use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WifiInfo {
    pub connected: bool,
    pub ssid: String,
    pub speed_mbps: String,
    pub signal: u32,
}

impl Default for WifiInfo {
    fn default() -> Self {
        Self {
            connected: false,
            ssid: "Offline".to_string(),
            speed_mbps: "0 Mbps".to_string(),
            signal: 0,
        }
    }
}

pub fn get_wifi_status() -> WifiInfo {
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;

        let output = match std::process::Command::new("netsh")
            .args(["wlan", "show", "interfaces"])
            .creation_flags(CREATE_NO_WINDOW)
            .output()
        {
            Ok(o) => String::from_utf8_lossy(&o.stdout).to_string(),
            Err(_) => return WifiInfo::default(),
        };

        let mut connected = false;
        let mut ssid = String::new();
        let mut speed = String::new();
        let mut signal = 0u32;

        for line in output.lines() {
            let trimmed = line.trim();
            if trimmed.starts_with("State") {
                if let Some((_, val)) = trimmed.split_once(':') {
                    if val.trim().eq_ignore_ascii_case("connected") {
                        connected = true;
                    }
                }
            } else if trimmed.starts_with("SSID") && !trimmed.starts_with("BSSID") {
                if let Some((_, val)) = trimmed.split_once(':') {
                    ssid = val.trim().to_string();
                }
            } else if trimmed.starts_with("Receive rate (Mbps)") || trimmed.starts_with("Transmit rate (Mbps)") {
                if speed.is_empty() {
                    if let Some((_, val)) = trimmed.split_once(':') {
                        let raw = val.trim();
                        speed = format!("{raw} Mbps");
                    }
                }
            } else if trimmed.starts_with("Signal") {
                if let Some((_, val)) = trimmed.split_once(':') {
                    let num_str = val.trim().trim_end_matches('%').trim();
                    signal = num_str.parse::<u32>().unwrap_or(0);
                }
            }
        }

        if connected && !speed.is_empty() {
            let final_ssid = if ssid.is_empty() { "Wi-Fi".to_string() } else { ssid };
            WifiInfo {
                connected: true,
                ssid: final_ssid,
                speed_mbps: speed,
                signal,
            }
        } else {
            WifiInfo::default()
        }
    }

    #[cfg(not(windows))]
    {
        WifiInfo {
            connected: true,
            ssid: "Wi-Fi".to_string(),
            speed_mbps: "100 Mbps".to_string(),
            signal: 90,
        }
    }
}
