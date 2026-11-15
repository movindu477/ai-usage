#[cfg(test)]
mod tests {
    use crate::db::queries::*;
    use rusqlite::Connection;

    #[test]
    fn test_schema_and_idempotence() {
        let conn = Connection::open_in_memory().unwrap();
        crate::db::schema::init_tables(&conn).unwrap();

        // Calling it again should be idempotent
        crate::db::schema::init_tables(&conn).unwrap();

        let plans = get_all_plans(&conn).unwrap();
        assert_eq!(plans.len(), 3); // claude, antigravity, codex

        let now = 1700000000;
        // Upsert quota window
        upsert_quota_window(
            &conn,
            "claude",
            None,
            "*",
            "session_5h",
            "Session (5h)",
            Some(83.0),
            Some(now + 7200),
            "oauth_usage",
            now,
            None,
            None,
        )
        .unwrap();

        // Upsert again with new values - should update, not duplicate
        upsert_quota_window(
            &conn,
            "claude",
            None,
            "*",
            "session_5h",
            "Session (5h)",
            Some(85.0),
            Some(now + 7000),
            "oauth_usage",
            now + 10,
            None,
            None,
        )
        .unwrap();

        let plans_after = get_all_plans(&conn).unwrap();
        let claude_plan = plans_after.iter().find(|p| p.provider == "claude").unwrap();
        assert_eq!(claude_plan.windows.len(), 1);
        assert_eq!(claude_plan.windows[0].used_pct, Some(85.0));

        // Test binding window
        let binding = get_binding_window(&conn, "claude").unwrap().unwrap();
        assert_eq!(binding.used_pct, Some(85.0));

        let binding_all = get_binding_window(&conn, "all").unwrap().unwrap();
        assert_eq!(binding_all.used_pct, Some(85.0));
    }
}
