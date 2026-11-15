use rusqlite::{params, Connection, Result};
use serde::{Deserialize, Serialize};

pub fn db_get_setting(conn: &Connection, key: &str) -> Result<Option<String>> {
    let mut stmt = conn.prepare("SELECT value FROM settings WHERE key = ?1")?;
    let mut rows = stmt.query(params![key])?;
    if let Some(row) = rows.next()? {
        Ok(Some(row.get(0)?))
    } else {
        Ok(None)
    }
}

pub fn db_set_setting(conn: &Connection, key: &str, value: &str) -> Result<()> {
    conn.execute(
        "INSERT INTO settings (key, value) VALUES (?1, ?2) ON CONFLICT(key) DO UPDATE SET value = ?2",
        params![key, value],
    )?;
    Ok(())
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiagnosticsInfo {
    pub version: String,
    pub os: String,
    pub claude_status: String,
    pub antigravity_status: String,
    pub codex_status: String,
    pub db_events_count: i64,
    pub last_poll_timestamp: i64,
}

pub fn db_get_diagnostics(conn: &Connection) -> Result<DiagnosticsInfo> {
    let events_count: i64 = conn
        .query_row("SELECT COUNT(*) FROM usage_events", [], |r| r.get(0))
        .unwrap_or(0);

    let claude_err: Option<String> = conn
        .query_row(
            "SELECT error FROM quota_windows WHERE provider_id = 'claude' ORDER BY fetched_at_utc DESC LIMIT 1",
            [],
            |r| r.get(0),
        )
        .ok()
        .flatten();

    let ag_err: Option<String> = conn
        .query_row(
            "SELECT error FROM quota_windows WHERE provider_id = 'antigravity' ORDER BY fetched_at_utc DESC LIMIT 1",
            [],
            |r| r.get(0),
        )
        .ok()
        .flatten();

    let claude_status = match claude_err {
        Some(e) => format!("Inactive ({})", e),
        None => "Active / Synced".to_string(),
    };

    let antigravity_status = match ag_err {
        Some(e) => format!("Inactive ({})", e),
        None => "Active / Connected".to_string(),
    };

    Ok(DiagnosticsInfo {
        version: "1.0.0".to_string(),
        os: format!("Windows x64 ({})", std::env::consts::ARCH),
        claude_status,
        antigravity_status,
        codex_status: "Offline fallback".to_string(),
        db_events_count: events_count,
        last_poll_timestamp: chrono::Utc::now().timestamp(),
    })
}

pub fn db_reset_app_data(conn: &Connection) -> Result<()> {
    conn.execute_batch(
        r#"
        DELETE FROM quota_windows;
        DELETE FROM usage_events;
        DELETE FROM daily_rollup;
        DELETE FROM settings;
        UPDATE widget_state SET mode = 'expanded', opacity = 1.0, pinned = 1, selected_provider = 'all', metric = 'tasks' WHERE id = 1;
        "#,
    )?;
    Ok(())
}
