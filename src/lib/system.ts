import { invoke } from '@tauri-apps/api/core';

export interface SystemStats {
  cpu_usage: number;
  gpu_usage?: number | null;
  gpu_name?: string | null;
  ram_used_gb: number;
  ram_total_gb: number;
  storage_used_gb: number;
  storage_total_gb: number;
  wifi_speed_mbps: number;
  wifi_ssid: string;
}

export interface CursorRelativePos {
  x: number;
  y: number;
}

export async function fetchSystemStats(): Promise<SystemStats> {
  try {
    return await invoke<SystemStats>('get_system_stats');
  } catch (err) {
    console.warn('IPC get_system_stats fallback:', err);
    return {
      cpu_usage: 18.0,
      gpu_usage: 28.0,
      gpu_name: 'RTX 4050',
      ram_used_gb: 8.4,
      ram_total_gb: 16.0,
      storage_used_gb: 215.0,
      storage_total_gb: 512.0,
      wifi_speed_mbps: 300,
      wifi_ssid: 'Wi-Fi',
    };
  }
}

export async function fetchCursorPos(): Promise<CursorRelativePos | null> {
  try {
    return await invoke<CursorRelativePos>('get_cursor_pos');
  } catch {
    return null;
  }
}
