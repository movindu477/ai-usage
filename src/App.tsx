import { useState, useEffect, useCallback } from 'react';
import {
  WidgetMode,
  MetricType,
  ProviderScope,
  MetricOverview,
  ChartDataPoint,
  ProviderPlanInfo,
  BindingWindow,
  WidgetState,
} from './lib/types';
import {
  getOverview,
  getSeries,
  getPlans,
  getBindingWindow,
  refresh,
  setWidgetMode,
  setWidgetPinned,
  setWidgetOpacity,
  setWidgetScope,
  setWidgetMetric,
  snapToEdges,
} from './lib/ipc';
import { Expanded } from './modes/Expanded';
import { Compact } from './modes/Compact';
import { Rail } from './modes/Rail';
import { Settings } from './modes/Settings';
import { PlansView } from './components/plans/PlansView';

const METRIC_CYCLE: MetricType[] = ['tasks', 'tokens', 'cost'];

export default function App() {
  const [mode, setMode] = useState<WidgetMode>('expanded');
  const [scope, setScope] = useState<ProviderScope>('all');
  const [metric, setMetric] = useState<MetricType>('tasks');
  const [widgetState, setWidgetState] = useState<WidgetState>({
    mode: 'expanded',
    pinned: true,
    opacity: 1.0,
    selected_provider: 'all',
    metric: 'tasks',
    snap_to_edges: true,
    polling_interval: 5,
  });

  const [overview, setOverview] = useState<MetricOverview>({
    metric: 'tasks',
    unit: 'tasks',
    raw_value: 12450,
    formatted_value: '12,450',
    delta_pct: 12,
  });

  const [series, setSeries] = useState<ChartDataPoint[]>([]);
  const [plans, setPlans] = useState<ProviderPlanInfo[]>([]);
  const [bindingWindow, setBindingWindow] = useState<BindingWindow | null>(null);

  // Load real-time data for current scope and metric
  const loadData = useCallback(async () => {
    try {
      const [ov, ser, pl, bw] = await Promise.all([
        getOverview(scope, metric),
        getSeries(scope),
        getPlans(),
        getBindingWindow(scope),
      ]);
      setOverview(ov);
      setSeries(ser);
      setPlans(pl);
      setBindingWindow(bw);
    } catch (err) {
      console.warn('Failed to load data:', err);
    }
  }, [scope, metric]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time background auto-update timer (every 3.5 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      loadData();
    }, 3500);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleCycleMetric = async () => {
    const nextIdx = (METRIC_CYCLE.indexOf(metric) + 1) % METRIC_CYCLE.length;
    const nextMetric = METRIC_CYCLE[nextIdx];
    setMetric(nextMetric);
    await setWidgetMetric(nextMetric);
  };

  const handleScopeChange = async (newScope: ProviderScope) => {
    setScope(newScope);
    await setWidgetScope(newScope);
  };

  const handleModeChange = async (newMode: WidgetMode) => {
    setMode(newMode);
    await setWidgetMode(newMode);
  };

  const handleTogglePin = async () => {
    const nextPinned = !widgetState.pinned;
    setWidgetState((prev) => ({ ...prev, pinned: nextPinned }));
    await setWidgetPinned(nextPinned);
  };

  const handleUpdateWidgetState = async (updates: Partial<WidgetState>) => {
    setWidgetState((prev) => ({ ...prev, ...updates }));
    if (updates.pinned !== undefined) {
      await setWidgetPinned(updates.pinned);
    }
    if (updates.opacity !== undefined) {
      await setWidgetOpacity(updates.opacity);
    }
  };

  const handleRefresh = async () => {
    await refresh();
    await loadData();
  };

  const latestFetchedAt = plans.reduce<number | null>((acc, p) => {
    if (!p.fetched_at) return acc;
    if (!acc || p.fetched_at > acc) return p.fetched_at;
    return acc;
  }, null);

  const providerDisplayName =
    scope === 'all'
      ? 'All Providers'
      : scope === 'claude'
      ? 'Claude'
      : scope === 'antigravity'
      ? 'Antigravity'
      : 'Codex';

  return (
    <div
      className="w-full h-full flex items-center justify-center select-none"
      style={{ opacity: widgetState.opacity }}
      onMouseUp={() => {
        if (widgetState.snap_to_edges) {
          snapToEdges();
        }
      }}
    >
      {mode === 'expanded' && (
        <Expanded
          overview={overview}
          series={series}
          bindingWindow={bindingWindow}
          scope={scope}
          metric={metric}
          onScopeChange={handleScopeChange}
          onCycleMetric={handleCycleMetric}
          onSetMode={handleModeChange}
          onOpenSettings={() => handleModeChange('settings')}
          isPinned={widgetState.pinned}
          onTogglePin={handleTogglePin}
        />
      )}

      {mode === 'plans' && (
        <PlansView
          plans={plans}
          onBack={() => handleModeChange('expanded')}
          onRefresh={handleRefresh}
          latestFetchedAt={latestFetchedAt}
        />
      )}

      {mode === 'compact' && (
        <Compact
          overview={overview}
          series={series}
          bindingWindow={bindingWindow}
          providerName={providerDisplayName}
          onSetMode={handleModeChange}
          onOpenSettings={() => handleModeChange('settings')}
        />
      )}

      {mode === 'rail' && (
        <Rail
          overview={overview}
          bindingWindow={bindingWindow}
          onSetMode={handleModeChange}
        />
      )}

      {mode === 'settings' && (
        <Settings
          state={widgetState}
          onUpdateState={handleUpdateWidgetState}
          onClose={() => handleModeChange('expanded')}
          onRescan={handleRefresh}
        />
      )}
    </div>
  );
}
