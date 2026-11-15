import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import clsx from 'clsx';
import { ChartDataPoint } from '../../lib/types';

interface UsageChartProps {
  data: ChartDataPoint[];
  chartType?: 'bar' | 'area' | 'heatmap';
}

interface SeriesConfig {
  key: 'automation' | 'query' | 'system';
  label: string;
  color: string;
}

const SERIES_CONFIGS: SeriesConfig[] = [
  { key: 'automation', label: 'Automation', color: '#7c5cff' },
  { key: 'query', label: 'Queries', color: '#ff8a4c' },
  { key: 'system', label: 'System', color: 'var(--color-accent-3)' },
];

export const UsageChart: React.FC<UsageChartProps> = ({
  data,
  chartType = 'bar',
}) => {
  const [visibleSeries, setVisibleSeries] = useState<Record<string, boolean>>({
    automation: true,
    query: true,
    system: true,
  });

  const toggleSeries = (key: string) => {
    setVisibleSeries((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Custom Recharts Tooltip
  const renderTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    return (
      <div className="bg-[var(--color-bg-elevated)] border border-[var(--border-strong)] rounded-[8px] p-2 shadow-2xl text-[10px] min-w-[110px] z-50">
        <div className="text-[var(--color-text-3)] text-[9.5px] mb-1 font-semibold">
          Day {label}
        </div>
        {payload.map((entry: any, idx: number) => (
          <div
            key={idx}
            className="flex items-center justify-between gap-2.5 text-[10px] py-0.5"
          >
            <div className="flex items-center gap-1.5">
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-[var(--color-text-2)]">{entry.name}</span>
            </div>
            <span className="font-semibold num text-[var(--color-text-1)]">
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col flex-1 min-h-[105px] w-full select-none">
      {/* Legend */}
      <div
        className="flex items-center gap-3 mb-1 shrink-0"
        onMouseDown={(e) => e.stopPropagation()}
        data-interactive="true"
      >
        {SERIES_CONFIGS.map((s) => {
          const isVisible = visibleSeries[s.key];
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => toggleSeries(s.key)}
              className={clsx(
                'flex items-center gap-1 cursor-pointer bg-transparent border-none p-0 transition-opacity',
                isVisible ? 'opacity-100' : 'opacity-35'
              )}
            >
              <span
                className="w-[6px] h-[6px] rounded-[1.5px] shrink-0"
                style={{ backgroundColor: s.color }}
              />
              <span className="text-[9.5px] text-[var(--color-text-2)] whitespace-nowrap">
                {s.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Chart Visualizations */}
      <div className="flex-1 w-full min-h-[85px] relative">
        {chartType === 'bar' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 4, right: 0, left: -22, bottom: -4 }}
              barCategoryGap="16%"
            >
              <XAxis
                dataKey="day"
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={false}
                tickMargin={4}
                tick={{ fill: 'var(--color-text-3)', fontSize: 9 }}
              />
              <YAxis
                domain={[0, 300]}
                ticks={[0, 150, 300]}
                axisLine={false}
                tickLine={false}
                width={26}
                tick={{ fill: 'var(--color-text-3)', fontSize: 8 }}
              />
              <Tooltip cursor={{ fill: 'var(--surface-1)', radius: 4 }} content={renderTooltip} />
              {visibleSeries.automation && (
                <Bar
                  dataKey="automation"
                  name="Automation"
                  stackId="a"
                  fill="#7c5cff"
                  radius={!visibleSeries.query && !visibleSeries.system ? [2, 2, 0, 0] : [0, 0, 0, 0]}
                  animationDuration={350}
                />
              )}
              {visibleSeries.query && (
                <Bar
                  dataKey="query"
                  name="Queries"
                  stackId="a"
                  fill="#ff8a4c"
                  radius={!visibleSeries.system ? [2, 2, 0, 0] : [0, 0, 0, 0]}
                  animationDuration={350}
                />
              )}
              {visibleSeries.system && (
                <Bar
                  dataKey="system"
                  name="System"
                  stackId="a"
                  fill="var(--color-accent-3)"
                  radius={[2, 2, 0, 0]}
                  animationDuration={350}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        )}

        {chartType === 'area' && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 4, right: 0, left: -22, bottom: -4 }}
            >
              <defs>
                <linearGradient id="gradAuto" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c5cff" stopOpacity={0.7} />
                  <stop offset="95%" stopColor="#7c5cff" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="gradQuery" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff8a4c" stopOpacity={0.7} />
                  <stop offset="95%" stopColor="#ff8a4c" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="gradSys" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#454558" stopOpacity={0.7} />
                  <stop offset="95%" stopColor="#454558" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="day"
                axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                tickLine={false}
                tickMargin={4}
                tick={{ fill: 'rgba(238, 238, 245, 0.4)', fontSize: 9 }}
              />
              <YAxis
                domain={[0, 300]}
                ticks={[0, 150, 300]}
                axisLine={false}
                tickLine={false}
                width={26}
                tick={{ fill: 'rgba(238, 238, 245, 0.4)', fontSize: 8 }}
              />
              <Tooltip cursor={{ stroke: 'rgba(255, 255, 255, 0.1)', strokeDasharray: '3 3' }} content={renderTooltip} />
              {visibleSeries.automation && (
                <Area
                  type="monotone"
                  dataKey="automation"
                  name="Automation"
                  stackId="1"
                  stroke="#7c5cff"
                  fill="url(#gradAuto)"
                  strokeWidth={1.5}
                />
              )}
              {visibleSeries.query && (
                <Area
                  type="monotone"
                  dataKey="query"
                  name="Queries"
                  stackId="1"
                  stroke="#ff8a4c"
                  fill="url(#gradQuery)"
                  strokeWidth={1.5}
                />
              )}
              {visibleSeries.system && (
                <Area
                  type="monotone"
                  dataKey="system"
                  name="System"
                  stackId="1"
                  stroke="#68687e"
                  fill="url(#gradSys)"
                  strokeWidth={1.5}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        )}

        {chartType === 'heatmap' && (
          <div className="w-full h-full flex flex-col justify-between py-1">
            <div className="grid grid-cols-7 gap-1.5 flex-1">
              {data.map((item, idx) => {
                const total = item.automation + item.query + item.system;
                const intensity =
                  total > 220 ? 'bg-[#7c5cff]' : total > 150 ? 'bg-[#7c5cff]/65' : total > 80 ? 'bg-[#ff8a4c]/50' : 'bg-white/10';
                return (
                  <div
                    key={idx}
                    className="flex flex-col items-center justify-between gap-1 p-1 rounded-[6px] bg-white/[0.02] border border-white/[0.04] hover:border-white/20 transition-all cursor-default"
                    title={`Day ${item.day}: ${total} total actions (${item.automation} auto, ${item.query} queries)`}
                  >
                    <span className="text-[8.5px] text-[var(--color-text-3)] font-medium">
                      {item.day}
                    </span>
                    <div className={clsx('w-full h-7 rounded-[4px] transition-all', intensity)} />
                    <span className="text-[8px] font-semibold num text-[var(--color-text-2)]">
                      {total}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-end gap-1.5 mt-1 text-[8.5px] text-[var(--color-text-3)]">
              <span>Less</span>
              <div className="w-2 h-2 rounded-[2px] bg-white/10" />
              <div className="w-2 h-2 rounded-[2px] bg-[#ff8a4c]/50" />
              <div className="w-2 h-2 rounded-[2px] bg-[#7c5cff]/65" />
              <div className="w-2 h-2 rounded-[2px] bg-[#7c5cff]" />
              <span>More</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
