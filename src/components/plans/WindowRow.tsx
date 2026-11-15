import React, { useState, useEffect } from 'react';
import { QuotaWindow } from '../../lib/types';
import { quotaBand, quotaColor, formatCountdown } from '../../lib/format';

interface WindowRowProps {
  window: QuotaWindow;
}

export const WindowRow: React.FC<WindowRowProps> = ({ window }) => {
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  const band = quotaBand(window.used_pct);
  const color = quotaColor(band);
  const countdown = formatCountdown(window.resets_at_utc);

  return (
    <div className="grid grid-cols-[108px_1fr_34px_56px] items-center h-[22px] text-[10px] gap-2">
      {/* Label */}
      <span className="text-[var(--color-text-2)] truncate font-normal" title={window.label}>
        {window.label}
      </span>

      {/* Bar */}
      <div className="h-[3px] rounded-[2px] bg-[var(--surface-2)] overflow-hidden">
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
