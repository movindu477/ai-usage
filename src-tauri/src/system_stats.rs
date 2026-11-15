use serde::Serialize;
use std::process::Command;
use std::sync::{Mutex, OnceLock};
use std::time::{Duration, Instant};
use sysinfo::{Disks, System};
use tauri::WebviewWindow;

#[cfg(windows)]
use std::os::windows::process::CommandExt;

const CREATE_NO_WINDOW: u32 = 0x08000000;

#[derive(Serialize, Clone)]
pub struct SystemStats {
    pub cpu_usage: f32,
    pub gpu_usage: Option<f32>,
    pub gpu_name: Option<String>,
    pub ram_used_gb: f64,
    pub ram_total_gb: f64,
    pub storage_used_gb: f64,
    pub storage_total_gb: f64,
    pub wifi_speed_mbps: f64,
    pub wifi_ssid: String,
}

#[derive(Serialize, Clone)]
pub struct CursorRelativePos {
    pub x: f64,
    pub y: f64,
}

struct MonitorState {
    sys: System,
    last_gpu_refresh: Option<Instant>,
    last_slow_refresh: Option<Instant>,
    gpu_usage: Option<f32>,
    gpu_name: Option<String>,
    storage_used_gb: f64,
    storage_total_gb: f64,
    wifi_speed_mbps: f64,
    wifi_ssid: String,
}

static MONITOR: OnceLock<Mutex<MonitorState>> = OnceLock::new();

fn shorten_gpu_name(raw: &str) -> String {
    let cleaned = raw
        .replace("NVIDIA GeForce ", "")
        .replace("AMD Radeon ", "Radeon ")
        .replace("Intel(R) ", "Intel ")
        .replace(" Laptop GPU", "")
        .replace(" Graphics", "")
        .trim()
        .to_string();
    if cleaned.is_empty() {
        raw.trim().to_string()
    } else {
        cleaned
    }
}

fn query_gpu_hidden() -> (Option<String>, Option<f32>) {
    // 1. Fast path: try nvidia-smi (< 20ms on NVIDIA laptops)
    let mut nv_cmd = Command::new("nvidia-smi");
    nv_cmd.args([
        "--query-gpu=name,utilization.gpu",
        "--format=csv,noheader,nounits",
    ]);
    #[cfg(windows)]
    nv_cmd.creation_flags(CREATE_NO_WINDOW);

    if let Ok(out) = nv_cmd.output() {
        if out.status.success() {
            let stdout = String::from_utf8_lossy(&out.stdout);
            if let Some(first_line) = stdout.lines().next() {
                let parts: Vec<&str> = first_line.split(',').collect();
                if parts.len() >= 2 {
                    let name = shorten_gpu_name(parts[0]);
                    if let Ok(pct) = parts[1].trim().parse::<f32>() {
                        return (Some(name), Some(pct.clamp(0.0, 100.0)));
                    }
                }
            }
        }
    }

    // 2. Fallback: Windows WMI GPUEngine counters (Intel / AMD / NVIDIA)
    let ps_script = r#"
        $name = (Get-CimInstance Win32_VideoController -ErrorAction SilentlyContinue | Select-Object -First 1).Name;
        $load = (Get-CimInstance Win32_PerfFormattedData_GPUPerformanceCounters_GPUEngine -ErrorAction SilentlyContinue | Where-Object { $_.Name -like '*engtype_3D*' -or $_.Name -like '*engtype_Compute*' -or $_.Name -like '*engtype_VideoDecode*' } | Measure-Object -Property UtilizationPercentage -Sum).Sum;
        Write-Output "$name|$load"
    "#;

    let mut cmd = Command::new("powershell");
    cmd.args(["-NoProfile", "-Command", ps_script]);
    #[cfg(windows)]
    cmd.creation_flags(CREATE_NO_WINDOW);

    if let Ok(out) = cmd.output() {
        let stdout = String::from_utf8_lossy(&out.stdout);
        let parts: Vec<&str> = stdout.trim().split('|').collect();
        if !parts.is_empty() && !parts[0].trim().is_empty() {
            let name = shorten_gpu_name(parts[0]);
            let pct = parts
                .get(1)
                .and_then(|s| s.trim().parse::<f32>().ok())
                .unwrap_or(0.0)
                .clamp(0.0, 100.0);
            return (Some(name), Some(pct));
        }
    }

    (None, None)
}

fn query_wifi_hidden() -> (String, f64) {
    let ps_script = r#"
        $wifi = netsh wlan show interfaces;
        $ssid = ($wifi | Select-String "^\s+SSID\s+:\s+(.+)$").Matches.Groups[1].Value;
        $speed = ($wifi | Select-String "^\s+Receive rate \(Mbps\)\s+:\s+(.+)$").Matches.Groups[1].Value;
        Write-Output "$ssid|$speed"
    "#;

    let mut cmd = Command::new("powershell");
    cmd.args(["-NoProfile", "-Command", ps_script]);
    #[cfg(windows)]
    cmd.creation_flags(CREATE_NO_WINDOW);

    if let Ok(out) = cmd.output() {
        let stdout = String::from_utf8_lossy(&out.stdout);
        let parts: Vec<&str> = stdout.trim().split('|').collect();
        if parts.len() == 2 {
            let ssid = parts[0].trim().to_string();
            let speed = parts[1].trim().parse::<f64>().unwrap_or(0.0);
            if !ssid.is_empty() {
                return (ssid, speed);
            }
        }
    }

    (String::from("Disconnected"), 0.0)
}

fn query_storage_c_drive() -> (f64, f64) {
    let disks = Disks::new_with_refreshed_list();
    for disk in &disks {
        let mount = disk.mount_point().to_string_lossy();
        if mount.starts_with('C') || mount.starts_with('c') {
            let total = disk.total_space() as f64 / 1_073_741_824.0;
            let avail = disk.available_space() as f64 / 1_073_741_824.0;
            let used = (total - avail).max(0.0);
            return (used, total);
        }
    }
    if let Some(first) = disks.list().first() {
        let total = first.total_space() as f64 / 1_073_741_824.0;
        let avail = first.available_space() as f64 / 1_073_741_824.0;
        let used = (total - avail).max(0.0);
        return (used, total);
    }
    (0.0, 0.0)
}

fn collect_system_stats_sync() -> SystemStats {
    let mutex = MONITOR.get_or_init(|| {
        let mut sys = System::new_all();
        sys.refresh_cpu_all();
        std::thread::sleep(sysinfo::MINIMUM_CPU_UPDATE_INTERVAL);
        sys.refresh_cpu_all();
        sys.refresh_memory();

        let (gpu_name, gpu_usage) = query_gpu_hidden();
        let (storage_used_gb, storage_total_gb) = query_storage_c_drive();
        let (wifi_ssid, wifi_speed_mbps) = query_wifi_hidden();
        let now = Instant::now();

        Mutex::new(MonitorState {
            sys,
            last_gpu_refresh: Some(now),
            last_slow_refresh: Some(now),
            gpu_usage,
            gpu_name,
            storage_used_gb,
            storage_total_gb,
            wifi_speed_mbps,
            wifi_ssid,
        })
    });

    let mut state = match mutex.lock() {
        Ok(guard) => guard,
        Err(poisoned) => poisoned.into_inner(),
    };

    // 1. Fast path (every 1.5s): CPU & RAM via native sysinfo
    state.sys.refresh_cpu_all();
    state.sys.refresh_memory();

    let cpu_usage = state.sys.global_cpu_usage();
    let ram_total = state.sys.total_memory() as f64 / 1_073_741_824.0;
    let ram_used = state.sys.used_memory() as f64 / 1_073_741_824.0;

    // 2. Medium path (every 2.5s): GPU usage
    let should_refresh_gpu = state
        .last_gpu_refresh
        .map(|t| t.elapsed() >= Duration::from_millis(2500))
        .unwrap_or(true);

    if should_refresh_gpu {
        let (g_name, g_load) = query_gpu_hidden();
        state.gpu_name = g_name;
        state.gpu_usage = g_load;
        state.last_gpu_refresh = Some(Instant::now());
    }

    // 3. Slow path (every 10s): Storage (C:) & Wi-Fi
    let should_refresh_slow = state
        .last_slow_refresh
        .map(|t| t.elapsed() >= Duration::from_secs(10))
        .unwrap_or(true);

    if should_refresh_slow {
        let (s_used, s_total) = query_storage_c_drive();
        let (ssid, speed) = query_wifi_hidden();
        state.storage_used_gb = s_used;
        state.storage_total_gb = s_total;
        state.wifi_ssid = ssid;
        state.wifi_speed_mbps = speed;
        state.last_slow_refresh = Some(Instant::now());
    }

    SystemStats {
        cpu_usage,
        gpu_usage: state.gpu_usage,
        gpu_name: state.gpu_name.clone(),
        ram_used_gb: (ram_used * 10.0).round() / 10.0,
        ram_total_gb: (ram_total * 10.0).round() / 10.0,
        storage_used_gb: (state.storage_used_gb * 10.0).round() / 10.0,
        storage_total_gb: (state.storage_total_gb * 10.0).round() / 10.0,
        wifi_speed_mbps: state.wifi_speed_mbps,
        wifi_ssid: state.wifi_ssid.clone(),
    }
}

#[tauri::command]
pub async fn get_system_stats() -> Result<SystemStats, String> {
    tokio::task::spawn_blocking(collect_system_stats_sync)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_cursor_pos(win: WebviewWindow) -> Result<CursorRelativePos, String> {
    #[cfg(windows)]
    {
        use windows::Win32::Foundation::POINT;
        use windows::Win32::UI::WindowsAndMessaging::GetCursorPos;

        let mut pt = POINT { x: 0, y: 0 };
        unsafe {
            let _ = GetCursorPos(&mut pt);
        }
        let win_pos = win.outer_position().map_err(|e| e.to_string())?;
        let scale = win.scale_factor().unwrap_or(1.0);
        let rel_x = (pt.x - win_pos.x) as f64 / scale;
        let rel_y = (pt.y - win_pos.y) as f64 / scale;
        Ok(CursorRelativePos { x: rel_x, y: rel_y })
    }
    #[cfg(not(windows))]
    {
        let _ = win;
        Ok(CursorRelativePos { x: 270.0, y: 150.0 })
    }
}
