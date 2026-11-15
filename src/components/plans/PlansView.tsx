import React, { useState } from 'react';
import { RefreshCw, ArrowLeft } from 'lucide-react';
import { Card } from '../common/Card';
import { ProviderPlanInfo } from '../../lib/types';
import { ProviderSection } from './ProviderSection';
import { formatFreshness } from '../../lib/format';

interface PlansViewProps {
  plans: ProviderPlanInfo[];
  onBack: () => void;
  onRefresh: () => Promise<void>;
  latestFetchedAt?: number | null;
}

export const PlansView: React.FC<PlansViewProps> = ({
  plans,
  onBack,
  onRefresh,
  latestFetchedAt,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  return (
    <Card width={340} height={420} className="justify-between">
      {/* Top Header */}
      <div className="flex items-center justify-between h-[24px] mb-1.5 border-b border-white/[0.06] pb-1.5 shrink-0">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onBack}
            onMouseDown={(e) => e.stopPropagation()}
            className="flex items-center justify-center w-5 h-5 rounded-[6px] text-[var(--color-text-3)] hover:text-[var(--color-text-1)] hover:bg-white/5 transition-colors cursor-pointer"
            title="Back to Widget"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11.5px] font-semibold text-[var(--color-text-1)]">
            Plans & Usage
          </span>
        </div>

        <div className="flex items-center gap-2" onMouseDown={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]" />
            <span className="text-[9px] text-[var(--color-text-3)]">
              {formatFreshness(latestFetchedAt) || 'live'}
            </span>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center justify-center w-5 h-5 rounded-[6px] text-[var(--color-text-3)] hover:text-[var(--color-text-1)] hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Body: Providers list without scrolling */}
      <div className="flex-1 flex flex-col justify-start overflow-y-auto py-1 gap-1 text-[10.5px]">
        {plans.map((p) => (
          <ProviderSection
            key={p.provider}
            providerInfo={p}
            onReconnect={() => handleRefresh()}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between h-[24px] pt-1 border-t border-white/[0.06] shrink-0 text-[9.5px]">
        <span className="text-[var(--color-text-3)]">
          Auto-synced in real-time
        </span>
        <button
          type="button"
          onClick={handleRefresh}
          onMouseDown={(e) => e.stopPropagation()}
          disabled={isRefreshing}
          className="h-[20px] px-2 rounded-[6px] bg-white/[0.04] hover:bg-white/[0.08] text-[9.5px] font-medium text-[var(--color-text-2)] hover:text-[var(--color-text-1)] transition-colors cursor-pointer border border-white/10"
        >
          {isRefreshing ? 'Syncing…' : 'Sync now'}
        </button>
      </div>
    </Card>
  );
};
