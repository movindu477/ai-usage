use serde::Serialize;
use std::process::Command;
use std::sync::{Mutex, OnceLock};
use std::time::{Duration, Instant};
use sysinfo::{Disks, System};

#[cfg(windows)]
use std::os::windows::process::CommandExt;

const CREATE_NO_WINDOW: u32 = 0x08000000;

#[derive(Serialize, Clone)]
pub struct SystemStats {
    pub cpu_usage: f32,
    pub ram_used_gb: f64,
    pub ram_total_gb: f64,
    pub storage_used_gb: f64,
    pub storage_total_gb: f64,
    pub wifi_speed_mbps: f64,
    pub wifi_ssid: String,
}

struct MonitorState {
    sys: System,
    last_slow_refresh: Option<Instant>,
    storage_used_gb: f64,
    storage_total_gb: f64,
    wifi_speed_mbps: f64,
    wifi_ssid: String,
}

static MONITOR: OnceLock<Mutex<MonitorState>> = OnceLock::new();

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

        let (storage_used_gb, storage_total_gb) = query_storage_c_drive();
        let (wifi_ssid, wifi_speed_mbps) = query_wifi_hidden();

        Mutex::new(MonitorState {
            sys,
            last_slow_refresh: Some(Instant::now()),
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

    // Fast path (every 1–1.5s): refresh CPU & RAM natively via sysinfo
    state.sys.refresh_cpu_all();
    state.sys.refresh_memory();

    let cpu_usage = state.sys.global_cpu_usage();
    let ram_total = state.sys.total_memory() as f64 / 1_073_741_824.0;
    let ram_used = state.sys.used_memory() as f64 / 1_073_741_824.0;

    // Slow path (every 10s): refresh Storage (C:) and Wi-Fi via hidden PowerShell
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
