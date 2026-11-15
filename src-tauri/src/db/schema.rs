use rusqlite::{Connection, Result};

pub fn init_tables(conn: &Connection) -> Result<()> {
    conn.execute_batch(
        r#"
        CREATE TABLE IF NOT EXISTS providers (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          kind TEXT NOT NULL,
          accent TEXT NOT NULL,
          enabled INTEGER NOT NULL DEFAULT 1,
          config_json TEXT NOT NULL DEFAULT '{}'
        );

        CREATE TABLE IF NOT EXISTS plans (
          id TEXT PRIMARY KEY,
          provider_id TEXT NOT NULL REFERENCES providers(id),
          name TEXT NOT NULL,
          tier TEXT,
          account TEXT,
          detected_at INTEGER
        );

        CREATE TABLE IF NOT EXISTS models (
          provider_id TEXT NOT NULL,
          model_id TEXT NOT NULL,
          display_name TEXT NOT NULL,
          family TEXT,
          PRIMARY KEY (provider_id, model_id)
        );

        CREATE TABLE IF NOT EXISTS usage_events (
          id INTEGER PRIMARY KEY,
          provider_id TEXT NOT NULL,
          model_id TEXT,
          ts_utc INTEGER NOT NULL,
          category TEXT NOT NULL,
          input_tokens INTEGER DEFAULT 0,
          output_tokens INTEGER DEFAULT 0,
          cache_read_tokens INTEGER DEFAULT 0,
          cache_write_tokens INTEGER DEFAULT 0,
          requests INTEGER DEFAULT 1,
          cost_usd REAL,
          session_id TEXT,
          source TEXT NOT NULL,
          dedupe_key TEXT UNIQUE
        );
        CREATE INDEX IF NOT EXISTS idx_usage_ts ON usage_events(ts_utc);

        CREATE TABLE IF NOT EXISTS quota_windows (
          id INTEGER PRIMARY KEY,
          provider_id TEXT NOT NULL,
          plan_id TEXT,
          model_key TEXT NOT NULL DEFAULT '*',
          kind TEXT NOT NULL,
          label TEXT NOT NULL,
          used_pct REAL,
          resets_at_utc INTEGER,
          source TEXT NOT NULL,
          fetched_at_utc INTEGER NOT NULL,
          stale INTEGER NOT NULL DEFAULT 0,
          error TEXT,
          raw_json TEXT,
          UNIQUE (provider_id, model_key, kind)
        );

        CREATE TABLE IF NOT EXISTS daily_rollup (
          day TEXT NOT NULL,
          provider_id TEXT NOT NULL,
          model_id TEXT NOT NULL DEFAULT '*',
          category TEXT NOT NULL,
          requests INTEGER,
          tokens_in INTEGER,
          tokens_out INTEGER,
          cost_usd REAL,
          PRIMARY KEY (day, provider_id, model_id, category)
        );

        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS widget_state (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          monitor_name TEXT,
          edge TEXT,
          offset_ratio REAL,
          mode TEXT DEFAULT 'expanded',
          opacity REAL DEFAULT 1.0,
          click_through INTEGER DEFAULT 0,
          pinned INTEGER DEFAULT 1,
          selected_provider TEXT DEFAULT 'all',
          metric TEXT DEFAULT 'tasks'
        );
        "#,
    )?;

    // Seed providers if not exist
    conn.execute(
        "INSERT OR IGNORE INTO providers (id, name, kind, accent, enabled) VALUES
         ('claude', 'Claude', 'claude', '#7c5cff', 1),
         ('antigravity', 'Antigravity', 'antigravity', '#ff8a4c', 1),
         ('codex', 'Codex', 'codex', '#2e2e38', 1)",
        [],
    )?;

    // Seed default widget_state if not exists
    conn.execute(
        "INSERT OR IGNORE INTO widget_state (id, mode, opacity, click_through, pinned, selected_provider, metric)
         VALUES (1, 'expanded', 1.0, 0, 1, 'all', 'tasks')",
        [],
    )?;

    Ok(())
}
