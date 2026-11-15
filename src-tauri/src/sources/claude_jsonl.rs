use anyhow::Result;
use rusqlite::{params, Connection};
use serde_json::Value;
use std::fs::File;
use std::io::{BufRead, BufReader};
use std::path::Path;

pub fn import_claude_jsonl_files(conn: &std::sync::Mutex<Connection>) -> Result<()> {
    let home = match dirs::home_dir() {
        Some(h) => h,
        None => return Ok(()),
    };

    let claude_projects = home.join(".claude").join("projects");
    if !claude_projects.exists() {
        return Ok(());
    }

    // Recursively collect all .jsonl files
    let mut files = Vec::new();
    collect_jsonl_files(&claude_projects, &mut files);

    for path in files {
        let _ = process_single_jsonl(&path, conn);
    }

    Ok(())
}

fn collect_jsonl_files(dir: &Path, acc: &mut Vec<std::path::PathBuf>) {
    if let Ok(entries) = std::fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                collect_jsonl_files(&path, acc);
            } else if path.extension().and_then(|s| s.to_str()) == Some("jsonl") {
                acc.push(path);
            }
        }
    }
}

fn process_single_jsonl(path: &Path, conn: &std::sync::Mutex<Connection>) -> Result<()> {
    let file = File::open(path)?;
    let reader = BufReader::new(file);

    for line_res in reader.lines() {
        let line = match line_res {
            Ok(l) => l,
            Err(_) => continue,
        };

        if !line.contains("\"type\":\"assistant\"") {
            continue;
        }

        let val: Value = match serde_json::from_str(&line) {
            Ok(v) => v,
            Err(_) => continue,
        };

        let message = match val.get("message") {
            Some(m) => m,
            None => continue,
        };

        let usage = match message.get("usage") {
            Some(u) => u,
            None => continue,
        };

        let input_tokens = usage.get("input_tokens").and_then(|v| v.as_i64()).unwrap_or(0);
        let output_tokens = usage.get("output_tokens").and_then(|v| v.as_i64()).unwrap_or(0);
        let cache_read = usage.get("cache_read_input_tokens").and_then(|v| v.as_i64()).unwrap_or(0);
        let cache_write = usage.get("cache_creation_input_tokens").and_then(|v| v.as_i64()).unwrap_or(0);

        let model = message.get("model").and_then(|s| s.as_str()).unwrap_or("claude-3-5-sonnet");
        let request_id = val.get("requestId").and_then(|s| s.as_str());

        // Deduplication key
        let dedupe = match request_id {
            Some(id) => id.to_string(),
            None => format!("{}-{}-{}", model, input_tokens, output_tokens),
        };

        let ts_utc = val.get("timestamp")
            .and_then(|t| t.as_str())
            .and_then(|s| chrono::DateTime::parse_from_rfc3339(s).ok())
            .map(|dt| dt.timestamp())
            .unwrap_or_else(|| chrono::Utc::now().timestamp());

        // Category mapping
        let category = if line.contains("tool_use") || line.contains("tool_call") {
            "automation"
        } else if line.contains("user_query") {
            "query"
        } else {
            "automation"
        };

        let cost_usd = estimate_cost(model, input_tokens, output_tokens, cache_read, cache_write);

        if let Ok(c) = conn.lock() {
            let _ = c.execute(
                r#"
                INSERT OR IGNORE INTO usage_events
                  (provider_id, model_id, ts_utc, category, input_tokens, output_tokens,
                   cache_read_tokens, cache_write_tokens, requests, cost_usd, source, dedupe_key)
                VALUES ('claude', ?1, ?2, ?3, ?4, ?5, ?6, ?7, 1, ?8, 'jsonl', ?9)
                "#,
                params![
                    model,
                    ts_utc,
                    category,
                    input_tokens,
                    output_tokens,
                    cache_read,
                    cache_write,
                    cost_usd,
                    dedupe
                ],
            );
        }
    }

    Ok(())
}

fn estimate_cost(model: &str, in_tok: i64, out_tok: i64, read_tok: i64, write_tok: i64) -> f64 {
    // Anthropic pricing per 1M tokens:
    // Opus: $15 / $75, cache read: $1.5, write: $18.75
    // Sonnet: $3 / $15, cache read: $0.3, write: $3.75
    // Haiku: $0.80 / $4.00, cache read: $0.08, write: $1.00
    let (rate_in, rate_out, rate_read, rate_write) = if model.contains("opus") {
        (15.0, 75.0, 1.5, 18.75)
    } else if model.contains("haiku") {
        (0.80, 4.0, 0.08, 1.0)
    } else {
        (3.0, 15.0, 0.30, 3.75)
    };

    (in_tok as f64 * rate_in
        + out_tok as f64 * rate_out
        + read_tok as f64 * rate_read
        + write_tok as f64 * rate_write)
        / 1_000_000.0
}
