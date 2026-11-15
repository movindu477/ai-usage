import { ChartDataPoint, MetricOverview, ProviderPlanInfo, BindingWindow } from './types';

export const SERIES: Record<string, { automation: number[]; query: number[]; system: number[] }> = {
  all:         { automation: [180, 211, 190, 205, 302, 225, 220], query: [95, 80, 86, 70, 45, 100, 54], system: [45, 30, 32, 31, 59, 26, 22] },
  claude:      { automation: [100, 138, 132, 120, 205, 160, 172], query: [65, 62, 48, 45, 25, 72, 30], system: [35, 18, 20, 22, 45, 15, 12] },
  antigravity: { automation: [64, 55, 44, 70, 78, 52, 38],        query: [22, 18, 26, 25, 20, 28, 24], system: [8, 12, 9, 9, 14, 11, 10] },
  codex:       { automation: [16, 18, 14, 15, 19, 13, 10],        query: [8, 0, 12, 0, 0, 0, 0],       system: [2, 0, 3, 0, 0, 0, 0] },
};

export const X_LABELS = ["28", "29", "30", "1", "2", "3", "4"];

export function getMockChartData(scope: string): ChartDataPoint[] {
  const s = SERIES[scope] || SERIES.all;
  return X_LABELS.map((day, i) => ({
    day,
    automation: s.automation[i] ?? 0,
    query: s.query[i] ?? 0,
    system: s.system[i] ?? 0,
  }));
}

export const MOCK_OVERVIEWS: Record<string, Record<string, MetricOverview>> = {
  all: {
    tasks: { metric: 'tasks', unit: 'tasks', raw_value: 12450, formatted_value: '12,450', delta_pct: 12 },
    tokens: { metric: 'tokens', unit: 'tokens', raw_value: 4820000, formatted_value: '4.82M', delta_pct: 8 },
    cost: { metric: 'cost', unit: 'usd', raw_value: 37.2, formatted_value: '$37.20', delta_pct: -5 },
  },
  claude: {
    tasks: { metric: 'tasks', unit: 'tasks', raw_value: 7850, formatted_value: '7,850', delta_pct: 15 },
    tokens: { metric: 'tokens', unit: 'tokens', raw_value: 3120000, formatted_value: '3.12M', delta_pct: 10 },
    cost: { metric: 'cost', unit: 'usd', raw_value: 27.2, formatted_value: '$27.20', delta_pct: 4 },
  },
  antigravity: {
    tasks: { metric: 'tasks', unit: 'tasks', raw_value: 3820, formatted_value: '3,820', delta_pct: 5 },
    tokens: { metric: 'tokens', unit: 'tokens', raw_value: 1540000, formatted_value: '1.54M', delta_pct: 2 },
    cost: { metric: 'cost', unit: 'usd', raw_value: 0, formatted_value: '$0.00', delta_pct: 0 },
  },
  codex: {
    tasks: { metric: 'tasks', unit: 'tasks', raw_value: 780, formatted_value: '780', delta_pct: -20 },
    tokens: { metric: 'tokens', unit: 'tokens', raw_value: 160000, formatted_value: '160k', delta_pct: -15 },
    cost: { metric: 'cost', unit: 'usd', raw_value: 10.0, formatted_value: '$10.00', delta_pct: 0 },
  },
};

const NOW = Math.floor(Date.now() / 1000);

export const MOCK_PLANS: ProviderPlanInfo[] = [
  {
    provider: 'claude',
    name: 'Claude',
    accent: '#7c5cff',
    plan: 'Max 20×',
    account: 'you@example.com',
    stale: false,
    fetched_at: NOW - 12,
    windows: [
      {
        provider_id: 'claude',
        model_key: '*',
        kind: 'session_5h',
        label: 'Session (5h)',
        used_pct: 83.0,
        resets_at_utc: NOW + 2 * 3600 + 14 * 60, // 2h 14m
        stale: false,
      },
      {
        provider_id: 'claude',
        model_key: '*',
        kind: 'week_all',
        label: 'Week all models',
        used_pct: 14.0,
        resets_at_utc: NOW + 4 * 86400 + 11 * 3600, // 4d 11h
        stale: false,
      },
      {
        provider_id: 'claude',
        model_key: 'opus_4_5',
        kind: 'week_model',
        label: 'Opus 4.5',
        used_pct: 71.0,
        resets_at_utc: NOW + 4 * 86400 + 11 * 3600, // 4d 11h
        stale: false,
      },
    ],
    models: [
      { name: 'Sonnet 3.7', tokens: 3120000, cost_usd: 18.2 },
      { name: 'Opus 4.5', tokens: 1240000, cost_usd: 8.41 },
      { name: 'Haiku 3.5', tokens: 460000, cost_usd: 0.59 },
    ],
  },
  {
    provider: 'antigravity',
    name: 'Antigravity',
    accent: '#ff8a4c',
    plan: 'Pro',
    account: 'you@gmail.com',
    stale: false,
    fetched_at: NOW - 45,
    windows: [
      {
        provider_id: 'antigravity',
        model_key: 'gemini_3_pro',
        kind: 'rolling',
        label: 'Gemini 3 Pro',
        used_pct: 38.0,
        resets_at_utc: NOW + 6 * 86400 + 2 * 3600, // 6d 2h
        stale: false,
      },
      {
        provider_id: 'antigravity',
        model_key: 'claude_sonnet',
        kind: 'rolling',
        label: 'Claude Sonnet',
        used_pct: 52.0,
        resets_at_utc: NOW + 5 * 86400 + 19 * 3600, // 5d 19h
        stale: false,
      },
      {
        provider_id: 'antigravity',
        model_key: 'gemini_3_flash',
        kind: 'rolling',
        label: 'Gemini 3 Flash',
        used_pct: 12.0,
        resets_at_utc: NOW + 6 * 86400 + 2 * 3600, // 6d 2h
        stale: false,
      },
    ],
    models: [
      { name: 'Claude Sonnet', tokens: 1100000, cost_usd: 0 },
      { name: 'Gemini 2.5 Pro', tokens: 850000, cost_usd: 0 },
    ],
  },
  {
    provider: 'codex',
    name: 'Codex',
    accent: '#2e2e38',
    plan: 'Plus',
    account: null,
    stale: true,
    error: 'Session expired — sign in again',
    fetched_at: NOW - 600,
    windows: [],
    models: [],
  },
];

export const MOCK_BINDING_WINDOWS: Record<string, BindingWindow> = {
  all: {
    label: 'CLAUDE · SESSION',
    used_pct: 83.0,
    resets_at: NOW + 2 * 3600 + 14 * 60,
    stale: false,
  },
  claude: {
    label: 'CLAUDE · SESSION',
    used_pct: 83.0,
    resets_at: NOW + 2 * 3600 + 14 * 60,
    stale: false,
  },
  antigravity: {
    label: 'ANTIGRAVITY · SONNET',
    used_pct: 52.0,
    resets_at: NOW + 5 * 86400 + 19 * 3600,
    stale: false,
  },
  codex: {
    label: 'CODEX',
    used_pct: null,
    resets_at: null,
    stale: true,
    error: 'Session expired',
  },
};
