use anyhow::{anyhow, Result};
use std::path::PathBuf;

pub struct ClaudeCredentials {
    pub access_token: String,
    pub expires_at: i64,
    pub subscription_type: Option<String>,
    pub rate_limit_tier: Option<String>,
}

pub fn read_claude_credentials() -> Result<ClaudeCredentials> {
    let home = dirs::home_dir().ok_or_else(|| anyhow!("Cannot locate user home directory"))?;
    let creds_path: PathBuf = home.join(".claude").join(".credentials.json");

    if !creds_path.exists() {
        return Err(anyhow!("Claude Code not detected — install it or run `claude` to connect"));
    }

    let content = std::fs::read_to_string(&creds_path)?;
    let val: serde_json::Value = serde_json::from_str(&content)?;

    let oauth = val
        .get("claudeAiOauth")
        .ok_or_else(|| anyhow!("Missing claudeAiOauth section"))?;

    let access_token = oauth
        .get("accessToken")
        .and_then(|t| t.as_str())
        .ok_or_else(|| anyhow!("Missing accessToken"))?
        .to_string();

    let expires_at = oauth
        .get("expiresAt")
        .and_then(|e| e.as_i64())
        .unwrap_or(0);

    let subscription_type = oauth
        .get("subscriptionType")
        .and_then(|s| s.as_str())
        .map(|s| s.to_string());

    let rate_limit_tier = oauth
        .get("rateLimitTier")
        .and_then(|r| r.as_str())
        .map(|r| r.to_string());

    let now_ms = chrono::Utc::now().timestamp_millis();
    if expires_at > 0 && expires_at < now_ms {
        return Err(anyhow!("Session expired — open Claude Code to refresh"));
    }

    Ok(ClaudeCredentials {
        access_token,
        expires_at,
        subscription_type,
        rate_limit_tier,
    })
}
