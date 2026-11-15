export type WidgetMode = 'expanded' | 'plans' | 'compact' | 'rail' | 'settings';
export type MetricType = 'tasks' | 'tokens' | 'cost';
export type ProviderScope = 'all' | 'claude' | 'antigravity' | 'codex';
export type ActiveWidgetTab = 'ai' | 'weather' | 'music';

export interface MediaSessionInfo {
  title: string;
  artist: string;
  album: string;
  is_playing: boolean;
  has_session: boolean;
  position_secs: number;
  duration_secs: number;
  album_art: string | null;
}

export interface WeatherData {
  city: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  condition: string;
  isDay: boolean;
  unit: 'fahrenheit' | 'celsius';
  fetchedAt: number;
}

export interface ChartDataPoint {
  day: string;
  automation: number;
  query: number;
  system: number;
}

export interface MetricOverview {
  metric: string;
  unit: string;
  raw_value: number;
  formatted_value: string;
  delta_pct?: number;
}

export type QuotaKind = 'session_5h' | 'week_all' | 'week_model' | 'credits_month' | 'rolling';

export interface QuotaWindow {
  id?: number;
  provider_id: string;
  plan_id?: string | null;
  model_key: string;
  kind: QuotaKind;
  label: string;
  used_pct: number | null;
  resets_at_utc: number | null;
  source?: string;
  fetched_at_utc?: number;
  stale: boolean;
  error?: string | null;
}

export interface ModelUsage {
  name: string;
  tokens: number;
  cost_usd: number | null;
}

export interface ProviderPlanInfo {
  provider: string;
  name: string;
  accent: string;
  plan: string;
  account?: string | null;
  windows: QuotaWindow[];
  models: ModelUsage[];
  fetched_at?: number | null;
  stale: boolean;
  error?: string | null;
}

export interface BindingWindow {
  label: string;
  used_pct: number | null;
  resets_at: number | null;
  stale: boolean;
  error?: string | null;
}

export interface WidgetState {
  mode: WidgetMode;
  pinned: boolean;
  opacity: number;
  selected_provider: ProviderScope;
  metric: MetricType;
  snap_to_edges: boolean;
  polling_interval: number;
}

export interface WifiInfo {
  connected: boolean;
  ssid: string;
  speed_mbps: string;
  signal: number;
}

export interface DiagnosticsInfo {
  version: string;
  os: string;
  claude_status: string;
  antigravity_status: string;
  codex_status: string;
  db_events_count: number;
  last_poll_timestamp: number;
}
