import React from 'react';
import clsx from 'clsx';
import { AlertCircle } from 'lucide-react';
import { ProviderPlanInfo } from '../../lib/types';
import { WindowRow } from './WindowRow';
import { ModelRow } from './ModelRow';
import { formatFreshness } from '../../lib/format';

interface ProviderSectionProps {
  providerInfo: ProviderPlanInfo;
  onReconnect?: (provider: string) => void;
}

const KIND_ORDER: Record<string, number> = {
  session_5h: 1,
  week_all: 2,
  week_model: 3,
  credits_month: 4,
  rolling: 5,
};

export const ProviderSection: React.FC<ProviderSectionProps> = ({
  providerInfo,
  onReconnect,
}) => {
  const sortedWindows = [...providerInfo.windows].sort((a, b) => {
    const orderA = KIND_ORDER[a.kind] ?? 99;
    const orderB = KIND_ORDER[b.kind] ?? 99;
    return orderA - orderB;
  });

  const sortedModels = [...providerInfo.models].sort(
    (a, b) => b.tokens - a.tokens
  );

  const isStale = providerInfo.stale;
  const hasError = !!providerInfo.error;

  return (
    <div
      className={clsx(
        'flex flex-col py-2 border-b border-[rgba(255,255,255,0.06)] last:border-b-0 transition-opacity',
        isStale && !hasError && 'opacity-60',
        hasError && 'opacity-70'
      )}
    >
      {/* Header Line */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ backgroundColor: providerInfo.accent }}
          />
          <span className="text-[12px] font-semibold text-[var(--color-text-1)]">
            {providerInfo.name}
          </span>
          <span className="text-[9px] font-semibold uppercase tracking-[0.06em] text-[var(--color-text-2)] bg-[var(--surface-2)] px-1.5 py-0.5 rounded-[4px] shrink-0">
            {providerInfo.plan}
          </span>
          {isStale && !hasError && providerInfo.fetched_at && (
            <span className="text-[9px] text-[var(--color-text-3)] ml-1 truncate">
              last known {formatFreshness(providerInfo.fetched_at)}
            </span>
          )}
        </div>

        {providerInfo.account && (
          <span
            className="text-[9px] text-[var(--color-text-3)] max-w-[120px] truncate text-right ml-2"
            title={providerInfo.account}
          >
            {providerInfo.account}
          </span>
        )}
      </div>

      {/* Error state */}
      {hasError ? (
        <div className="flex items-center gap-2 py-1 px-2 rounded-[8px] bg-[rgba(255,93,93,0.08)] border border-[rgba(255,93,93,0.15)] text-[10px]">
          <AlertCircle className="w-3.5 h-3.5 text-[var(--color-quota-danger)] shrink-0" />
          <span className="text-[var(--color-text-2)] flex-1 truncate">
            {providerInfo.error}
          </span>
          {onReconnect && (
            <button
              type="button"
              onClick={() => onReconnect(providerInfo.provider)}
              className="text-[10px] text-[var(--color-accent-1)] font-medium hover:underline bg-transparent border-none p-0 cursor-pointer shrink-0"
            >
              Reconnect
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Quota Windows */}
          {sortedWindows.length > 0 && (
            <div className="flex flex-col gap-0.5 mb-1">
              {sortedWindows.map((w, idx) => (
                <WindowRow key={w.id ?? `${w.provider_id}-${w.model_key}-${idx}`} window={w} />
              ))}
            </div>
          )}

          {/* Model Usage Divider & Rows */}
          {sortedModels.length > 0 && (
            <div className="flex flex-col gap-0.5 mt-1 pt-1 border-t border-[rgba(255,255,255,0.04)]">
              {sortedModels.map((m, idx) => (
                <ModelRow key={idx} model={m} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
