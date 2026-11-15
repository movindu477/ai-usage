use anyhow::Result;
use chrono::DateTime;
use reqwest::header::{HeaderMap, HeaderValue, AUTHORIZATION};
use serde_json::Value;

use crate::db::queries::upsert_quota_window;
use crate::sources::claude_credentials::read_claude_credentials;
use rusqlite::Connection;

// Live testing with Claude Code and live OAuth /api/oauth/usage verification confirms:
// utilization is percentage consumed/used (0.0 to 100.0), matching limits[i].percent.
pub fn normalize_utilization(raw: f64) -> f64 {
    raw.clamp(0.0, 100.0)
}

fn parse_rfc3339_to_utc_epoch(s: &str) -> Option<i64> {
    DateTime::parse_from_rfc3339(s)
        .ok()
        .map(|dt| dt.timestamp())
}

pub async fn fetch_and_save_claude_usage(
    client: &reqwest::Client,
    conn: &std::sync::Mutex<Connection>,
) -> Result<()> {
    let creds = match read_claude_credentials() {
        Ok(c) => c,
        Err(e) => {
            let now = chrono::Utc::now().timestamp();
            if let Ok(c) = conn.lock() {
                let _ = upsert_quota_window(
                    &c,
                    "claude",
                    None,
                    "*",
                    "session_5h",
                    "Session (5h)",
                    None,
                    None,
                    "oauth_usage",
                    now,
                    Some(&e.to_string()),
                    None,
                );
            }
            return Err(e);
        }
    };

    let mut headers = HeaderMap::new();
    headers.insert(
        AUTHORIZATION,
        HeaderValue::from_str(&format!("Bearer {}", creds.access_token))?,
    );
    headers.insert(
        "anthropic-beta",
        HeaderValue::from_static("oauth-2025-04-20"),
    );
    headers.insert("anthropic-version", HeaderValue::from_static("2023-06-01"));

    let resp = client
        .get("https://api.anthropic.com/api/oauth/usage")
        .headers(headers)
        .send()
        .await?;

    let now = chrono::Utc::now().timestamp();
    let status = resp.status();

    if status == reqwest::StatusCode::UNAUTHORIZED {
        if let Ok(c) = conn.lock() {
            let _ = upsert_quota_window(
                &c,
                "claude",
                None,
                "*",
                "session_5h",
                "Session (5h)",
                None,
                None,
                "oauth_usage",
                now,
                Some("Session expired — open Claude Code to refresh"),
                None,
            );
        }
        return Ok(());
    }

    if status == reqwest::StatusCode::TOO_MANY_REQUESTS {
        let retry_after = resp
            .headers()
            .get("Retry-After")
            .and_then(|v| v.to_str().ok())
            .unwrap_or("rate limited");
        let err_msg = format!("Rate limited · retry in {}", retry_after);
        if let Ok(c) = conn.lock() {
            let _ = upsert_quota_window(
                &c,
                "claude",
                None,
                "*",
                "session_5h",
                "Session (5h)",
                None,
                None,
                "oauth_usage",
                now,
                Some(&err_msg),
                None,
            );
        }
        return Ok(());
    }

    if !status.is_success() {
        let err_msg = format!("HTTP error: {}", status);
        if let Ok(c) = conn.lock() {
            let _ = upsert_quota_window(
                &c,
                "claude",
                None,
                "*",
                "session_5h",
                "Session (5h)",
                None,
                None,
                "oauth_usage",
                now,
                Some(&err_msg),
                None,
            );
        }
        return Ok(());
    }

    let body: Value = resp.json().await?;
    let raw_str = body.to_string();

    let locked_conn = conn.lock().map_err(|e| anyhow::anyhow!("{}", e))?;

    // Parse five_hour
    if let Some(five) = body.get("five_hour").and_then(|v| v.as_object()) {
        let util = five
            .get("utilization")
            .and_then(|u| u.as_f64())
            .map(normalize_utilization);
        let resets = five
            .get("resets_at")
            .and_then(|r| r.as_str())
            .and_then(parse_rfc3339_to_utc_epoch);
        upsert_quota_window(
            &locked_conn,
            "claude",
            None,
            "*",
            "session_5h",
            "Session (5h)",
            util,
            resets,
            "oauth_usage",
            now,
            None,
            Some(&raw_str),
        )?;
    }

    // Parse seven_day
    if let Some(seven) = body.get("seven_day").and_then(|v| v.as_object()) {
        let util = seven
            .get("utilization")
            .and_then(|u| u.as_f64())
            .map(normalize_utilization);
        let resets = seven
            .get("resets_at")
            .and_then(|r| r.as_str())
            .and_then(parse_rfc3339_to_utc_epoch);
        upsert_quota_window(
            &locked_conn,
            "claude",
            None,
            "*",
            "week_all",
            "Week, all models",
            util,
            resets,
            "oauth_usage",
            now,
            None,
            Some(&raw_str),
        )?;
    }

    // Check seven_day_<model> fields
    if let Some(obj) = body.as_object() {
        for (key, val) in obj {
            if key.starts_with("seven_day_") && !val.is_null() {
                let model_part = &key["seven_day_".len()..];
                let title_cased = match model_part {
                    "opus" => "Opus 4.5",
                    "sonnet" => "Sonnet 3.7",
                    "haiku" => "Haiku 3.5",
                    other => other,
                };
                if let Some(m_obj) = val.as_object() {
                    let util = m_obj
                        .get("utilization")
                        .and_then(|u| u.as_f64())
                        .map(normalize_utilization);
                    let resets = m_obj
                        .get("resets_at")
                        .and_then(|r| r.as_str())
                        .and_then(parse_rfc3339_to_utc_epoch);
                    upsert_quota_window(
                        &locked_conn,
                        "claude",
                        None,
                        model_part,
                        "week_model",
                        title_cased,
                        util,
                        resets,
                        "oauth_usage",
                        now,
                        None,
                        Some(&raw_str),
                    )?;
                }
            }
        }
    }

    Ok(())
}
