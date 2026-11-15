import React from 'react';
import { BindingWindow } from '../../lib/types';
import { quotaBand, quotaColor, formatCountdown } from '../../lib/format';

interface QuotaStripProps {
  binding: BindingWindow | null;
  onClick: () => void;
}

export const QuotaStrip: React.FC<QuotaStripProps> = ({ binding, onClick }) => {
  if (!binding) {
    return (
      <button
        type="button"
        onClick={onClick}
        onMouseDown={(e) => e.stopPropagation()}
        data-interactive="true"
        className="w-full h-5 mt-1 px-1 flex items-center justify-between bg-transparent border-none cursor-pointer group shrink-0"
      >
        <span className="text-[9px] uppercase tracking-[0.04em] text-[var(--color-text-3)] font-medium">
          Quota Synced
        </span>
        <span className="text-[9px] text-[var(--color-text-3)]">Active</span>
      </button>
    );
  }

  const band = quotaBand(binding.used_pct);
  const color = quotaColor(band);
  const countdown = formatCountdown(binding.resets_at);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseDown={(e) => e.stopPropagation()}
      data-interactive="true"
      className="w-full h-5 mt-1 flex items-center gap-2 bg-transparent border-none cursor-pointer group px-0.5 shrink-0"
    >
      {/* Label */}
      <span className="text-[9px] uppercase tracking-[0.04em] text-[var(--color-text-3)] font-medium whitespace-nowrap shrink-0 group-hover:text-[var(--color-text-2)] transition-colors">
        {binding.label}
      </span>

      {/* Progress track */}
      <div className="flex-1 h-[3px] rounded-full bg-white/[0.08] overflow-hidden">
        {binding.used_pct !== null && binding.used_pct !== undefined ? (
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${Math.min(100, Math.max(0, binding.used_pct))}%`,
              backgroundColor: color,
            }}
          />
        ) : null}
      </div>

      {/* Value and Countdown */}
      <div className="flex items-center gap-1 shrink-0 text-[9px] whitespace-nowrap">
        {binding.used_pct !== null && binding.used_pct !== undefined ? (
          <span className="font-semibold num" style={{ color }}>
            {Math.round(binding.used_pct)}%
          </span>
        ) : (
          <span className="text-[var(--color-text-3)]">
            — {binding.error ? `(${binding.error})` : ''}
          </span>
        )}

        {countdown && (
          <span className="text-[var(--color-text-3)] font-medium">
            · {countdown}
          </span>
        )}
      </div>
    </button>
  );
};
