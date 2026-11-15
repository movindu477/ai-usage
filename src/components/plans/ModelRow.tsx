import React from 'react';
import { ModelUsage } from '../../lib/types';
import { formatTokens, formatUsd } from '../../lib/format';

interface ModelRowProps {
  model: ModelUsage;
}

export const ModelRow: React.FC<ModelRowProps> = ({ model }) => {
  return (
    <div className="flex items-center justify-between h-[20px] text-[10px]">
      <span className="text-[var(--color-text-2)] font-normal truncate">
        {model.name}
      </span>
      <div className="flex items-center gap-1 text-[9px] shrink-0">
        <span className="text-[var(--color-text-2)] num font-medium">
          {formatTokens(model.tokens)} tok
        </span>
        {model.cost_usd !== null && (
          <>
            <span className="text-[var(--color-text-3)]">·</span>
            <span className="text-[var(--color-text-3)] num font-normal">
              {formatUsd(model.cost_usd)}
            </span>
          </>
        )}
      </div>
    </div>
  );
};
