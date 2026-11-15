import React, { useState } from 'react';
import { MetricOverview, BindingWindow, WidgetMode } from '../lib/types';
import { quotaBand, quotaColor } from '../lib/format';

interface RailProps {
  overview: MetricOverview;
  bindingWindow: BindingWindow | null;
  onSetMode: (mode: WidgetMode) => void;
}

export const Rail: React.FC<RailProps> = ({
  overview,
  bindingWindow,
  onSetMode,
}) => {
  const [hovered, setHovered] = useState(false);
  const band = quotaBand(bindingWindow?.used_pct);
  const color = quotaColor(band);

  const pct = bindingWindow?.used_pct ?? 0;

  return (
    <div
      data-tauri-drag-region
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onSetMode('expanded')}
      className="relative flex flex-col items-center justify-between w-[44px] h-[160px] py-3 bg-[var(--color-bg-card)] border-l border-y border-[var(--border)] rounded-l-[20px] shadow-2xl cursor-pointer select-none transition-all duration-200"
      style={{
        boxShadow: hovered
          ? '0 0 24px rgba(124, 92, 255, 0.25)'
          : '0 18px 50px rgba(0,0,0,0.55)',
      }}
      title="Click to expand widget"
    >
      {/* 6px accent dot */}
      <div
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: 'var(--color-accent-1)' }}
      />

      {/* Number rotated 90 deg */}
      <div className="flex-1 flex items-center justify-center my-2">
        <span
          className="text-[12px] font-semibold num tracking-tight text-[var(--color-text-1)] whitespace-nowrap"
          style={{
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
          }}
        >
          {overview.formatted_value}
        </span>
      </div>

      {/* 3px vertical quota track */}
      <div className="w-[3px] h-[36px] rounded-full bg-[rgba(255,255,255,0.08)] overflow-hidden shrink-0 flex flex-col justify-end">
        <div
          className="w-full rounded-full transition-all duration-300"
          style={{
            height: `${Math.min(100, Math.max(0, pct))}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
};
