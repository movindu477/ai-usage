import React from 'react';
import { QuotaWindow } from '../../lib/types';
import { quotaBand, quotaColor, formatCountdown } from '../../lib/format';

interface WindowRowProps {
  window: QuotaWindow;
}

export const WindowRow: React.FC<WindowRowProps> = ({ window }) => {
  const band = quotaBand(window.used_pct);
  const color = quotaColor(band);
  const countdown = formatCountdown(window.resets_at_utc);

  return (
    <div className="grid grid-cols-[96px_1fr_34px_56px] items-center h-[22px] text-[10px] gap-2">
      {/* Label */}
      <span className="text-[var(--color-text-2)] truncate font-normal">
        {window.label}
      </span>

      {/* Bar */}
      <div className="h-[3px] rounded-[2px] bg-[rgba(255,255,255,0.08)] overflow-hidden">
        {window.used_pct !== null && window.used_pct !== undefined ? (
          <div
            className="h-full rounded-[2px] transition-all duration-300"
            style={{
              width: `${Math.min(100, Math.max(0, window.used_pct))}%`,
              backgroundColor: color,
            }}
          />
        ) : null}
      </div>

      {/* Pct */}
      <span className="num font-semibold text-right" style={{ color }}>
        {window.used_pct !== null && window.used_pct !== undefined
          ? `${Math.round(window.used_pct)}%`
          : '—'}
      </span>

      {/* Countdown */}
      <span className="text-[9px] text-[var(--color-text-3)] text-right truncate">
        {countdown || '—'}
      </span>
    </div>
  );
};
