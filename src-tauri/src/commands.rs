use tauri::{State, WebviewWindow};

use crate::db::queries::{
    db_get_diagnostics, db_get_setting, db_reset_app_data, db_set_setting,
    get_all_plans, get_binding_window as db_get_binding_window,
    get_chart_series, get_overview_data, BindingWindow, ChartDataPoint,
    DiagnosticsInfo, MetricOverview, ProviderPlanInfo,
};
use crate::sources::network::{get_wifi_status, WifiInfo};
use crate::sources::{antigravity, claude_jsonl, claude_usage};
use crate::state::AppState;

#[tauri::command]
pub fn get_overview(
    state: State<'_, AppState>,
    scope: String,
    metric: String,
    _range: Option<String>,
) -> Result<MetricOverview, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    get_overview_data(&conn, &scope, &metric).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_series(
    state: State<'_, AppState>,
    scope: String,
    _range: Option<String>,
) -> Result<Vec<ChartDataPoint>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    get_chart_series(&conn, &scope).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_plans(state: State<'_, AppState>) -> Result<Vec<ProviderPlanInfo>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    get_all_plans(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_binding_window(
    state: State<'_, AppState>,
    scope: String,
) -> Result<Option<BindingWindow>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    db_get_binding_window(&conn, &scope).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn refresh(
    state: State<'_, AppState>,
    provider: Option<String>,
) -> Result<(), String> {
    let conn = state.conn.clone();
    let client = state.client.clone();

    match provider.as_deref() {
        Some("claude") => {
            let _ = claude_usage::fetch_and_save_claude_usage(&client, &conn).await;
            let _ = claude_jsonl::import_claude_jsonl_files(&conn);
        }
        Some("antigravity") => {
            let _ = antigravity::fetch_and_save_antigravity_status(&client, &conn).await;
        }
        _ => {
            let c1 = conn.clone();
            let cl1 = client.clone();
            let c2 = conn.clone();
            let cl2 = client.clone();

            let _ = tokio::join!(
                async {
                    let _ = claude_usage::fetch_and_save_claude_usage(&cl1, &c1).await;
                    let _ = claude_jsonl::import_claude_jsonl_files(&c1);
                },
                async {
                    let _ = antigravity::fetch_and_save_antigravity_status(&cl2, &c2).await;
                }
            );
        }
    }
    Ok(())
}

#[tauri::command]
pub fn get_wifi_info() -> Result<WifiInfo, String> {
    Ok(get_wifi_status())
}

#[tauri::command]
pub fn drag_window(win: WebviewWindow) -> Result<(), String> {
    let _ = win.start_dragging();
    Ok(())
}

#[tauri::command]
pub fn set_mode(win: WebviewWindow, mode: String) -> Result<(), String> {
    let (w, h) = match mode.as_str() {
        "plans" => (340.0, 420.0),
        "compact" => (270.0, 110.0),
        "rail" => (44.0, 160.0),
        "settings" => (340.0, 360.0),
        _ => (340.0, 290.0), // "expanded"
    };

    let _ = win.set_size(tauri::Size::Logical(tauri::LogicalSize::new(w, h)));
    Ok(())
}

#[tauri::command]
pub fn set_pinned(win: WebviewWindow, pinned: bool) -> Result<(), String> {
    let _ = win.set_always_on_top(pinned);
    Ok(())
}

#[tauri::command]
pub fn set_opacity(_win: WebviewWindow, _opacity: f64) -> Result<(), String> {
    // Tauri handles opacity smoothly via webview or windows API
    Ok(())
}

#[tauri::command]
pub fn set_scope(state: State<'_, AppState>, scope: String) -> Result<(), String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    let _ = conn.execute(
        "UPDATE widget_state SET selected_provider = ? WHERE id = 1",
        rusqlite::params![scope],
    );
    Ok(())
}

#[tauri::command]
pub fn set_metric(state: State<'_, AppState>, metric: String) -> Result<(), String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    let _ = conn.execute(
        "UPDATE widget_state SET metric = ? WHERE id = 1",
        rusqlite::params![metric],
    );
    Ok(())
}

#[tauri::command]
pub fn get_setting(state: State<'_, AppState>, key: String) -> Result<Option<String>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    db_get_setting(&conn, &key).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn set_setting(state: State<'_, AppState>, key: String, value: String) -> Result<(), String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    db_set_setting(&conn, &key, &value).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_diagnostics(state: State<'_, AppState>) -> Result<DiagnosticsInfo, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    db_get_diagnostics(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn reset_app_data(state: State<'_, AppState>) -> Result<(), String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    db_reset_app_data(&conn).map_err(|e| e.to_string())
}
