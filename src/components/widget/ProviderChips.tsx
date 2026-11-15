import type { FC } from 'react';
import clsx from 'clsx';
import { ProviderScope } from '../../lib/types';

interface ProviderChipsProps {
  selected: ProviderScope;
  onSelect: (scope: ProviderScope) => void;
}

interface ChipItem {
  id: ProviderScope;
  label: string;
  dotColor: string;
}

const CHIPS: ChipItem[] = [
  { id: 'all', label: 'All Providers', dotColor: '#7c5cff' },
  { id: 'claude', label: 'Claude', dotColor: '#7c5cff' },
  { id: 'antigravity', label: 'Antigravity', dotColor: '#ff8a4c' },
  { id: 'codex', label: 'Codex', dotColor: '#636375' },
];

export const ProviderChips: FC<ProviderChipsProps> = ({ selected, onSelect }) => {
  return (
    <div
      className="flex items-center gap-1 mb-1.5 overflow-hidden shrink-0"
      onMouseDown={(e) => e.stopPropagation()}
      data-interactive="true"
    >
      {CHIPS.map((chip) => {
        const isSelected = selected === chip.id;
        return (
          <button
            key={chip.id}
            type="button"
            onClick={() => onSelect(chip.id)}
            className={clsx(
              'flex items-center gap-1 h-[20px] px-2 rounded-[6px] text-[10px] font-medium transition-all cursor-pointer',
              isSelected
                ? 'bg-white/10 text-[var(--color-text-1)] border border-white/15 shadow-sm'
                : 'bg-transparent text-[var(--color-text-3)] border border-transparent hover:text-[var(--color-text-2)] hover:bg-white/5'
            )}
          >
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: chip.dotColor }}
            />
            <span>{chip.label}</span>
          </button>
        );
      })}
    </div>
  );
};
