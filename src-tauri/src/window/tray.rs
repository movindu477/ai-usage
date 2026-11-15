use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager,
};

pub fn create_tray(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let show_hide_item = MenuItem::with_id(app, "toggle", "Show / Hide", true, None::<&str>)?;
    let pin_item = MenuItem::with_id(app, "pin", "Pin (Always on top)", true, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

    let menu = Menu::with_items(app, &[&show_hide_item, &pin_item, &quit_item])?;

    let _tray = TrayIconBuilder::new()
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "toggle" => {
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
            "pin" => {
                if let Some(win) = app.get_webview_window("widget") {
                    // Toggle always on top
                    let _ = win.set_always_on_top(true);
                }
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
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
        .build(app)?;

    Ok(())
}
