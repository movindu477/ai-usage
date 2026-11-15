use anyhow::{anyhow, Result};
use chrono::DateTime;
use rusqlite::Connection;
use serde_json::Value;
use std::process::Command;
use std::sync::Mutex;

use crate::db::queries::upsert_quota_window;

pub struct AntigravityDiscovery {
    pub pid: u32,
    pub csrf_token: String,
    pub ports: Vec<u16>,
}

#[cfg(windows)]
use std::os::windows::process::CommandExt;

const CREATE_NO_WINDOW: u32 = 0x08000000;

pub fn discover_antigravity() -> Result<AntigravityDiscovery> {
    let mut cmd = Command::new("powershell");
    cmd.args([
        "-NoProfile",
        "-Command",
        "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*--csrf_token*' -or $_.Name -eq 'language_server_windows_x64.exe' } | Select-Object ProcessId, CommandLine | ConvertTo-Json -Compress",
    ]);
    #[cfg(windows)]
    cmd.creation_flags(CREATE_NO_WINDOW);

    let output = cmd.output()?;

    if !output.status.success() {
        return Err(anyhow!("Failed to query processes"));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    if stdout.trim().is_empty() {
        return Err(anyhow!("Antigravity not running — start Antigravity to see quotas"));
    }

    let parsed: Value = serde_json::from_str(&stdout).map_err(|_| anyhow!("Invalid JSON from WMI"))?;

    let mut target_pid = 0;
    let mut target_cmdline = String::new();

    let items: Vec<Value> = if let Some(arr) = parsed.as_array() {
        arr.clone()
    } else if parsed.is_object() {
        vec![parsed]
    } else {
        vec![]
    };

    for item in items {
        let cmd = item.get("CommandLine").and_then(|c| c.as_str()).unwrap_or("");
        if cmd.contains("--csrf_token") || cmd.contains("--app_data_dir=antigravity") {
            target_pid = item.get("ProcessId").and_then(|p| p.as_u64()).unwrap_or(0) as u32;
            target_cmdline = cmd.to_string();
            break;
        }
    }

    if target_pid == 0 {
        return Err(anyhow!("Antigravity not running — start Antigravity to see quotas"));
    }

    // Extract csrf token: handles either `--csrf_token=<token>` or `--csrf_token <token>`
    let csrf_token = if let Some(part) = target_cmdline.split("--csrf_token=").nth(1) {
        part.split_whitespace().next().unwrap_or("").trim_matches('"')
    } else if let Some(part) = target_cmdline.split("--csrf_token").nth(1) {
        part.split_whitespace().next().unwrap_or("").trim_matches('"')
    } else {
        return Err(anyhow!("CSRF token not found in command line"));
    }
    .to_string();

    let mut ports = Vec::new();

    // Check for explicit --hub-port=<port>
    if let Some(part) = target_cmdline.split("--hub-port=").nth(1) {
        if let Some(val) = part.split_whitespace().next() {
            if let Ok(p) = val.trim_matches('"').parse::<u16>() {
                ports.push(p);
            }
        }
    }

    // Query all listening ports for PID
    if let Ok(port_output) = Command::new("powershell")
        .args([
            "-NoProfile",
            "-Command",
            &format!(
                "(Get-NetTCPConnection -OwningProcess {} -State Listen -ErrorAction SilentlyContinue).LocalPort",
                target_pid
            ),
        ])
        .output()
    {
        let port_str = String::from_utf8_lossy(&port_output.stdout);
        for line in port_str.lines() {
            if let Ok(p) = line.trim().parse::<u16>() {
                if !ports.contains(&p) {
                    ports.push(p);
                }
            }
        }
    }

    if ports.is_empty() {
        return Err(anyhow!("No listening ports for Antigravity"));
    }

    Ok(AntigravityDiscovery {
        pid: target_pid,
        csrf_token,
        ports,
    })
}

pub async fn fetch_and_save_antigravity_status(
    client: &reqwest::Client,
    conn: &Mutex<Connection>,
) -> Result<()> {
    let now = chrono::Utc::now().timestamp();

    let discovery = match discover_antigravity() {
        Ok(d) => d,
        Err(e) => {
            if let Ok(c) = conn.lock() {
                let _ = upsert_quota_window(
                    &c,
                    "antigravity",
                    None,
                    "*",
                    "rolling",
                    "Antigravity",
                    None,
                    None,
                    "ag_status",
                    now,
                    Some("Antigravity not running — start it to see quotas"),
                    None,
                );
            }
            return Err(e);
        }
    };

    let req_body = serde_json::json!({
        "metadata": {
            "ideName": "antigravity",
            "extensionName": "antigravity",
            "locale": "en",
            "ideVersion": "unknown"
        }
    });

    let mut response_json: Option<Value> = None;

    // Probe ports with both HTTP and HTTPS
    for port in discovery.ports {
        for scheme in &["http", "https"] {
            let status_url = format!(
                "{}://127.0.0.1:{}/exa.language_server_pb.LanguageServerService/GetUserStatus",
                scheme, port
            );

            let res = client
                .post(&status_url)
                .header("X-Codeium-Csrf-Token", &discovery.csrf_token)
                .header("Content-Type", "application/json")
                .json(&req_body)
                .send()
                .await;

            if let Ok(resp) = res {
                if resp.status().is_success() {
                    if let Ok(body) = resp.json::<Value>().await {
                        if body.get("userStatus").is_some() {
                            response_json = Some(body);
                            break;
                        }
                    }
                }
            }
        }
        if response_json.is_some() {
            break;
        }
    }

    let body = match response_json {
        Some(b) => b,
        None => {
            if let Ok(c) = conn.lock() {
                let _ = upsert_quota_window(
                    &c,
                    "antigravity",
                    None,
                    "*",
                    "rolling",
                    "Antigravity",
                    None,
                    None,
                    "ag_status",
                    now,
                    Some("Antigravity unreachable"),
                    None,
                );
            }
            return Err(anyhow!("Antigravity RPC endpoint unreachable"));
        }
    };

    let raw_str = body.to_string();
    let user_status = match body.get("userStatus") {
        Some(u) => u,
        None => return Ok(()),
    };

    let plan_name = user_status
        .get("planStatus")
        .and_then(|ps| ps.get("planInfo"))
        .and_then(|pi| pi.get("planName"))
        .and_then(|p| p.as_str())
        .or_else(|| user_status.get("planName").and_then(|p| p.as_str()))
        .unwrap_or("Pro");

    let account_email = user_status
        .get("email")
        .and_then(|e| e.as_str())
        .or_else(|| user_status.get("accountEmail").and_then(|e| e.as_str()));

    let model_configs = user_status
        .get("cascadeModelConfigData")
        .and_then(|c| c.get("clientModelConfigs"))
        .and_then(|m| m.as_array());

    let locked_conn = conn.lock().map_err(|e| anyhow!("{}", e))?;

    let _ = locked_conn.execute(
        r#"
        INSERT OR REPLACE INTO plans (id, provider_id, name, account, detected_at)
        VALUES ('antigravity_plan', 'antigravity', ?1, ?2, ?3)
        "#,
        rusqlite::params![plan_name, account_email, now],
    );

    if let Some(configs) = model_configs {
        for config in configs {
            let label = match config.get("label").and_then(|l| l.as_str()) {
                Some(l) => l,
                None => continue,
            };

            let quota_info = config.get("quotaInfo");

            let remaining_fraction = quota_info
                .and_then(|q| q.get("remainingFraction"))
                .and_then(|r| r.as_f64());

            let used_pct = remaining_fraction.map(|rf| ((1.0 - rf) * 100.0).clamp(0.0, 100.0));

            let reset_time = quota_info
                .and_then(|q| q.get("resetTime"))
                .and_then(|rt| {
                    if let Some(s) = rt.as_str() {
                        DateTime::parse_from_rfc3339(s).ok().map(|dt| dt.timestamp())
                    } else {
                        rt.as_i64()
                    }
                });

            upsert_quota_window(
                &locked_conn,
                "antigravity",
                Some("antigravity_plan"),
                label,
                "rolling",
                label,
                used_pct,
                reset_time,
                "ag_status",
                now,
                None,
                Some(&raw_str),
            )?;
        }
    }

    Ok(())
}
