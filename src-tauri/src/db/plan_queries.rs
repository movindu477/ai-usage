use rusqlite::{params, Connection, Result};
use crate::db::types::{BindingWindow, ModelUsageRow, ProviderPlanInfo, QuotaWindowRow};

pub fn upsert_quota_window(
    conn: &Connection,
    provider_id: &str,
    plan_id: Option<&str>,
    model_key: &str,
    kind: &str,
    label: &str,
    used_pct: Option<f64>,
    resets_at_utc: Option<i64>,
    source: &str,
    fetched_at_utc: i64,
    error: Option<&str>,
    raw_json: Option<&str>,
) -> Result<()> {
    conn.execute(
        r#"
        INSERT INTO quota_windows
          (provider_id, plan_id, model_key, kind, label, used_pct, resets_at_utc,
           source, fetched_at_utc, stale, error, raw_json)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, 0, ?10, ?11)
        ON CONFLICT(provider_id, model_key, kind) DO UPDATE SET
          used_pct = excluded.used_pct,
          resets_at_utc = excluded.resets_at_utc,
          fetched_at_utc = excluded.fetched_at_utc,
          stale = 0,
          error = excluded.error,
          raw_json = excluded.raw_json;
        "#,
        params![
            provider_id,
            plan_id,
            model_key,
            kind,
            label,
            used_pct,
            resets_at_utc,
            source,
            fetched_at_utc,
            error,
            raw_json
        ],
    )?;
    Ok(())
}

pub fn get_all_plans(conn: &Connection) -> Result<Vec<ProviderPlanInfo>> {
    let mut stmt = conn.prepare("SELECT id, name, accent FROM providers WHERE enabled = 1")?;
    let providers = stmt
        .query_map([], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
            ))
        })?
        .collect::<Result<Vec<_>, _>>()?;

    let mut result = Vec::new();
    for (p_id, p_name, p_accent) in providers {
        let plan_row: Option<(String, Option<String>)> = conn
            .query_row(
                "SELECT name, account FROM plans WHERE provider_id = ? ORDER BY detected_at DESC LIMIT 1",
                params![p_id],
                |row| Ok((row.get(0)?, row.get(1)?)),
            )
            .ok();

        let (plan_name, account) = plan_row.unwrap_or_else(|| {
            let default_plan = match p_id.as_str() {
                "claude" => "Max 20×",
                "antigravity" => "Pro",
                "codex" => "Plus",
                _ => "Standard",
            };
            (default_plan.to_string(), None)
        });

        let mut w_stmt = conn.prepare(
            r#"
            SELECT id, provider_id, plan_id, model_key, kind, label, used_pct,
                   resets_at_utc, source, fetched_at_utc, stale, error
            FROM quota_windows
            WHERE provider_id = ?
            "#,
        )?;

        let windows = w_stmt
            .query_map(params![p_id], |row| {
                Ok(QuotaWindowRow {
                    id: Some(row.get(0)?),
                    provider_id: row.get(1)?,
                    plan_id: row.get(2)?,
                    model_key: row.get(3)?,
                    kind: row.get(4)?,
                    label: row.get(5)?,
                    used_pct: row.get(6)?,
                    resets_at_utc: row.get(7)?,
                    source: row.get(8)?,
                    fetched_at_utc: row.get(9)?,
                    stale: row.get::<_, i64>(10)? != 0,
                    error: row.get(11)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;

        let mut m_stmt = conn.prepare(
            r#"
            SELECT COALESCE(model_id, 'General'),
                   SUM(input_tokens + output_tokens) as total_tokens,
                   SUM(cost_usd) as total_cost
            FROM usage_events
            WHERE provider_id = ?
            GROUP BY model_id
            ORDER BY total_tokens DESC
            LIMIT 5
            "#,
        )?;

        let models = m_stmt
            .query_map(params![p_id], |row| {
                Ok(ModelUsageRow {
                    name: row.get(0)?,
                    tokens: row.get::<_, Option<i64>>(1)?.unwrap_or(0),
                    cost_usd: row.get(2)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;

        let fetched_at = windows.iter().map(|w| w.fetched_at_utc).max();
        let is_stale = windows.iter().any(|w| w.stale);
        let has_valid_window = windows.iter().any(|w| w.used_pct.is_some() && w.error.is_none());
        let error = if has_valid_window {
            None
        } else {
            windows.iter().find_map(|w| w.error.clone())
        };

        result.push(ProviderPlanInfo {
            provider: p_id,
            name: p_name,
            accent: p_accent,
            plan: plan_name,
            account,
            windows,
            models,
            fetched_at,
            stale: is_stale,
            error,
        });
    }

    Ok(result)
}

pub fn get_binding_window(conn: &Connection, scope: &str) -> Result<Option<BindingWindow>> {
    let query = if scope == "all" {
        r#"
        SELECT label, used_pct, resets_at_utc, stale, error, provider_id
        FROM quota_windows
        WHERE used_pct IS NOT NULL
        ORDER BY used_pct DESC LIMIT 1
        "#
    } else {
        r#"
        SELECT label, used_pct, resets_at_utc, stale, error, provider_id
        FROM quota_windows
        WHERE provider_id = ?1 AND used_pct IS NOT NULL
        ORDER BY (CASE kind WHEN 'session_5h' THEN 1 WHEN 'rolling' THEN 2 ELSE 3 END), used_pct DESC LIMIT 1
        "#
    };

    let mut stmt = conn.prepare(query)?;
    let row = if scope == "all" {
        stmt.query_row([], |r| {
            let p_id: String = r.get(5)?;
            let lbl: String = r.get(0)?;
            let label = if lbl.contains("·") {
                lbl
            } else {
                format!("{} · {}", p_id.to_uppercase(), lbl.to_uppercase())
            };
            Ok(BindingWindow {
                label,
                used_pct: r.get(1)?,
                resets_at: r.get(2)?,
                stale: r.get::<_, i64>(3)? != 0,
                error: r.get(4)?,
            })
        })
    } else {
        stmt.query_row(params![scope], |r| {
            let p_id: String = r.get(5)?;
            let lbl: String = r.get(0)?;
            let label = if lbl.contains("·") {
                lbl
            } else {
                format!("{} · {}", p_id.to_uppercase(), lbl.to_uppercase())
            };
            Ok(BindingWindow {
                label,
                used_pct: r.get(1)?,
                resets_at: r.get(2)?,
                stale: r.get::<_, i64>(3)? != 0,
                error: r.get(4)?,
            })
        })
    };

    match row {
        Ok(bw) => Ok(Some(bw)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e),
    }
}
