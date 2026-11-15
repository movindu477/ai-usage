import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { Theme } from '../../hooks/useTheme';

interface ThemeSelectorProps {
  theme: Theme;
  onSelect: (theme: Theme) => void;
}

const THEME_OPTIONS: Array<{ id: Theme; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'system', label: 'System', icon: Monitor },
];

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ theme, onSelect }) => {
  return (
    <div className="flex flex-col gap-1 p-2 rounded-[7px] bg-[var(--surface-1)] border border-[var(--border)]">
      <div className="flex items-center justify-between text-[9.5px] text-[var(--color-text-2)] font-medium">
        <span>Interface Theme</span>
        <span className="capitalize text-[var(--color-text-3)] text-[9px]">{theme}</span>
      </div>
      <div className="flex items-center gap-1 p-0.5 rounded-[6px] bg-[var(--surface-2)] border border-[var(--border)]">
        {THEME_OPTIONS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            onMouseDown={(e) => e.stopPropagation()}
            className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-[5px] text-[9.5px] font-medium transition-all cursor-pointer ${
              theme === id
                ? 'bg-[var(--color-bg-elevated)] text-[var(--color-text-1)] shadow-sm'
                : 'text-[var(--color-text-3)] hover:text-[var(--color-text-2)]'
            }`}
          >
            <Icon className="w-3 h-3" />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
