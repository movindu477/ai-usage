import React from 'react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Maximize2, MoreHorizontal } from 'lucide-react';
import { Card } from '../components/common/Card';
import { MetricOverview, ChartDataPoint, BindingWindow, WidgetMode } from '../lib/types';
import { quotaBand, quotaColor, formatCountdown } from '../lib/format';

interface CompactProps {
  overview: MetricOverview;
  series: ChartDataPoint[];
  bindingWindow: BindingWindow | null;
  providerName: string;
  onSetMode: (mode: WidgetMode) => void;
  onOpenSettings: () => void;
}

export const Compact: React.FC<CompactProps> = ({
  overview,
  series,
  bindingWindow,
  providerName,
  onSetMode,
  onOpenSettings,
}) => {
  const sparkData = series.map((s) => ({
    val: s.automation + s.query + s.system,
  }));

  const band = quotaBand(bindingWindow?.used_pct);
  const barColor = quotaColor(band);
  const countdown = formatCountdown(bindingWindow?.resets_at);

  return (
    <Card width={270} height={110} padding={false} className="p-2.5 justify-between">
      {/* Top Header */}
      <div className="flex items-center justify-between h-4">
        <span className="text-[9.5px] uppercase tracking-wider text-[var(--color-text-3)] font-semibold">
          {providerName}
        </span>
        <div className="flex items-center gap-1" onMouseDown={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onSetMode('expanded')}
            className="text-[var(--color-text-3)] hover:text-[var(--color-text-1)] p-0.5 rounded cursor-pointer transition-colors"
            title="Expand"
          >
            <Maximize2 className="w-2.5 h-2.5" />
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            className="text-[var(--color-text-3)] hover:text-[var(--color-text-1)] p-0.5 rounded cursor-pointer transition-colors"
            title="Settings"
          >
            <MoreHorizontal className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>

      {/* Main Metric and Sparkline */}
      <div className="flex items-center justify-between gap-2 my-1">
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1">
            <span className="text-[19px] font-bold tracking-tight num text-[var(--color-text-1)] leading-none">
              {overview.formatted_value}
            </span>
            <span className="text-[9.5px] text-[var(--color-text-3)] capitalize">
              {overview.unit}
            </span>
          </div>
          {overview.delta_pct !== undefined && (
            <span className="text-[9px] font-medium text-[var(--color-success)] num mt-0.5">
              +{overview.delta_pct}% this week
            </span>
          )}
        </div>

        {/* Micro Sparkline */}
        <div className="w-[85px] h-[30px] opacity-75">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
              <defs>
                <linearGradient id="compactGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c5cff" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#7c5cff" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="val"
                stroke="#7c5cff"
                fill="url(#compactGrad)"
                strokeWidth={1.5}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Mini Quota bar */}
      <div className="flex items-center gap-1.5 pt-1 border-t border-white/[0.06]">
        <div className="flex-1 h-[2.5px] rounded-full bg-white/10 overflow-hidden">
          {bindingWindow?.used_pct !== null && bindingWindow?.used_pct !== undefined && (
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, Math.max(0, bindingWindow.used_pct))}%`,
                backgroundColor: barColor,
              }}
            />
          )}
        </div>
        <div className="flex items-center gap-1 text-[8.5px] font-medium shrink-0">
          <span style={{ color: barColor }} className="num font-semibold">
            {bindingWindow?.used_pct != null ? `${Math.round(bindingWindow.used_pct)}%` : '—'}
          </span>
          {countdown && <span className="text-[var(--color-text-3)]">· {countdown}</span>}
        </div>
      </div>
    </Card>
  );
};
