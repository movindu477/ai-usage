const SNAP_LOGICAL_PX: f64 = 14.0;

#[tauri::command]
pub fn snap_to_edges(win: tauri::WebviewWindow) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        let raw = win.hwnd().map_err(|e| e.to_string())?;
        let hwnd = windows::Win32::Foundation::HWND(raw.0);
        let area = unsafe {
            let mon = windows::Win32::Graphics::Gdi::MonitorFromWindow(
                hwnd,
                windows::Win32::Graphics::Gdi::MONITOR_DEFAULTTONEAREST,
            );
            let mut info = windows::Win32::Graphics::Gdi::MONITORINFO {
                cbSize: std::mem::size_of::<windows::Win32::Graphics::Gdi::MONITORINFO>() as u32,
                ..Default::default()
            };
            windows::Win32::Graphics::Gdi::GetMonitorInfoW(mon, &mut info)
                .as_bool()
                .then_some(info.rcWork)
        };
        let Some(area) = area else { return Ok(()) };
        let pos = win.outer_position().map_err(|e| e.to_string())?;
        let size = win.outer_size().map_err(|e| e.to_string())?;
        let t = (SNAP_LOGICAL_PX * win.scale_factor().unwrap_or(1.0)) as i32;
        let (mut x, mut y) = (pos.x, pos.y);
        if (x - area.left).abs() < t {
            x = area.left;
        }
        if (area.right - (x + size.width as i32)).abs() < t {
            x = area.right - size.width as i32;
        }
        if (y - area.top).abs() < t {
            y = area.top;
        }
        if (area.bottom - (y + size.height as i32)).abs() < t {
            y = area.bottom - size.height as i32;
        }
        if (x, y) == (pos.x, pos.y) {
            return Ok(());
        }
        win.set_position(tauri::PhysicalPosition::new(x, y))
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}
