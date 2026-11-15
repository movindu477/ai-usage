pub mod commands;
pub mod db;
pub mod sources;
pub mod state;
pub mod window;

use std::sync::{Arc, Mutex};
use tauri::Manager;
use tauri_plugin_global_shortcut::ShortcutState;

use crate::commands::*;
use crate::db::open_db;
use crate::sources::start_polling_tasks;
use crate::state::AppState;
use crate::window::snap::snap_to_edges;
use crate::window::tray::create_tray;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(win) = app.get_webview_window("widget") {
                let _ = win.show();
            }
        }))
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--autostart"]),
        ))
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_shortcut("CommandOrControl+Shift+U")
                .expect("Failed to parse global shortcut")
                .with_handler(|app, _shortcut, event| {
                    if event.state() == ShortcutState::Pressed {
                        if let Some(win) = app.get_webview_window("widget") {
                            if let Ok(visible) = win.is_visible() {
                                if visible {
                                    let _ = win.hide();
                                } else {
                                    let _ = win.show();
                                }
                            }
                        }
                    }
                })
                .build(),
        )
        .setup(|app| {
            let app_data = app.path().app_data_dir().ok();
            let conn = open_db(app_data).expect("Failed to initialize database");
            let conn_arc = Arc::new(Mutex::new(conn));

            let client_clone = reqwest::Client::builder()
                .danger_accept_invalid_certs(true)
                .build()
                .unwrap_or_default();

            // Start background pollers
            start_polling_tasks(Arc::clone(&conn_arc), client_clone.clone());

            app.manage(AppState {
                conn: conn_arc,
                client: client_clone,
            });

            // Initialize System Tray
            create_tray(app.handle()).ok();

            // Show window without stealing focus
            if let Some(win) = app.get_webview_window("widget") {
                win.show()?; // Never set_focus()
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_overview,
            get_series,
            get_plans,
            get_binding_window,
            get_wifi_info,
            drag_window,
            get_setting,
            set_setting,
            get_diagnostics,
            reset_app_data,
            refresh,
            set_mode,
            set_pinned,
            set_opacity,
            set_scope,
            set_metric,
            snap_to_edges,
            quit_app,
            get_media_session,
            media_control,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
