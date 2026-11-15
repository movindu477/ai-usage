import { invoke } from '@tauri-apps/api/core';
import {
  ChartDataPoint,
  MetricOverview,
  ProviderPlanInfo,
  BindingWindow,
  WidgetMode,
  MetricType,
  ProviderScope,
  WifiInfo,
  DiagnosticsInfo,
} from './types';
import {
  getMockChartData,
  MOCK_OVERVIEWS,
  MOCK_PLANS,
  MOCK_BINDING_WINDOWS,
} from './mock';

export const USE_MOCKS = false;

export async function getOverview(
  scope: ProviderScope,
  metric: MetricType,
  range: string = 'week'
): Promise<MetricOverview> {
  if (USE_MOCKS) {
    const scopeData = MOCK_OVERVIEWS[scope] || MOCK_OVERVIEWS.all;
    return scopeData[metric] || scopeData.tasks;
  }
  try {
    return await invoke<MetricOverview>('get_overview', { scope, metric, range });
  } catch (err) {
    console.warn('IPC get_overview fallback:', err);
    const scopeData = MOCK_OVERVIEWS[scope] || MOCK_OVERVIEWS.all;
    return scopeData[metric] || scopeData.tasks;
  }
}

export async function getSeries(
  scope: ProviderScope,
  range: string = 'week'
): Promise<ChartDataPoint[]> {
  if (USE_MOCKS) {
    return getMockChartData(scope);
  }
  try {
    return await invoke<ChartDataPoint[]>('get_series', { scope, range });
  } catch (err) {
    console.warn('IPC get_series fallback:', err);
    return getMockChartData(scope);
  }
}

export async function getPlans(): Promise<ProviderPlanInfo[]> {
  if (USE_MOCKS) {
    return MOCK_PLANS;
  }
  try {
    return await invoke<ProviderPlanInfo[]>('get_plans');
  } catch (err) {
    console.warn('IPC get_plans fallback:', err);
    return MOCK_PLANS;
  }
}

export async function getBindingWindow(scope: ProviderScope): Promise<BindingWindow> {
  if (USE_MOCKS) {
    return MOCK_BINDING_WINDOWS[scope] || MOCK_BINDING_WINDOWS.all;
  }
  try {
    return await invoke<BindingWindow>('get_binding_window', { scope });
  } catch (err) {
    console.warn('IPC get_binding_window fallback:', err);
    return MOCK_BINDING_WINDOWS[scope] || MOCK_BINDING_WINDOWS.all;
  }
}

export async function refresh(provider?: string): Promise<void> {
  if (USE_MOCKS) return;
  try {
    await invoke('refresh', { provider });
  } catch (err) {
    console.warn('IPC refresh error:', err);
  }
}

export async function setWidgetMode(mode: WidgetMode): Promise<void> {
  try {
    await invoke('set_mode', { mode });
  } catch (err) {
    console.warn('IPC set_mode error:', err);
  }
}

export async function setWidgetPinned(pinned: boolean): Promise<void> {
  try {
    await invoke('set_pinned', { pinned });
  } catch (err) {
    console.warn('IPC set_pinned error:', err);
  }
}

export async function setWidgetOpacity(opacity: number): Promise<void> {
  try {
    await invoke('set_opacity', { opacity });
  } catch (err) {
    console.warn('IPC set_opacity error:', err);
  }
}

export async function setWidgetScope(scope: ProviderScope): Promise<void> {
  try {
    await invoke('set_scope', { scope });
  } catch (err) {
    console.warn('IPC set_scope error:', err);
  }
}

export async function setWidgetMetric(metric: MetricType): Promise<void> {
  try {
    await invoke('set_metric', { metric });
  } catch (err) {
    console.warn('IPC set_metric error:', err);
  }
}

export async function snapToEdges(): Promise<void> {
  try {
    await invoke('snap_to_edges');
  } catch (err) {
    console.warn('IPC snap_to_edges error:', err);
  }
}

export async function getWifiInfo(): Promise<WifiInfo> {
  try {
    return await invoke<WifiInfo>('get_wifi_info');
  } catch (err) {
    console.warn('IPC get_wifi_info error:', err);
    return {
      connected: true,
      ssid: 'Wi-Fi',
      speed_mbps: '300 Mbps',
      signal: 85,
    };
  }
}

export async function dragWindow(): Promise<void> {
  try {
    await invoke('drag_window');
  } catch (err) {
    console.warn('IPC drag_window error:', err);
  }
}

export async function getSetting(key: string): Promise<string | null> {
  try {
    return await invoke<string | null>('get_setting', { key });
  } catch (err) {
    console.warn('IPC get_setting error:', err);
    return null;
  }
}

export async function setSetting(key: string, value: string): Promise<void> {
  try {
    await invoke('set_setting', { key, value });
  } catch (err) {
    console.warn('IPC set_setting error:', err);
  }
}

export async function getDiagnostics(): Promise<DiagnosticsInfo> {
  try {
    return await invoke<DiagnosticsInfo>('get_diagnostics');
  } catch (err) {
    console.warn('IPC get_diagnostics error:', err);
    return {
      version: '1.0.0',
      os: 'Windows x64',
      claude_status: 'Active',
      antigravity_status: 'Active',
      codex_status: 'Offline',
      db_events_count: 0,
      last_poll_timestamp: Date.now(),
    };
  }
}

export async function resetAppData(): Promise<void> {
  try {
    await invoke('reset_app_data');
  } catch (err) {
    console.warn('IPC reset_app_data error:', err);
  }
}

export async function quitApp(): Promise<void> {
  try {
    await invoke('quit_app');
  } catch (err) {
    console.warn('IPC quit_app error:', err);
  }
}
