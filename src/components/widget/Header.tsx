import { useState, useRef, useEffect, type FC } from 'react';
import {
  BarChart3,
  TrendingUp,
  Grid3X3,
  ChevronDown,
  MoreHorizontal,
  Settings,
  Sliders,
  Minimize2,
  ExternalLink,
  Pin,
  PinOff,
} from 'lucide-react';
import { WidgetMode } from '../../lib/types';

interface HeaderProps {
  title?: string;
  chartType: 'bar' | 'area' | 'heatmap';
  onChartTypeChange: (type: 'bar' | 'area' | 'heatmap') => void;
  onOpenSettings: () => void;
  onSetMode: (mode: WidgetMode) => void;
  isPinned?: boolean;
  onTogglePin?: () => void;
}

export const Header: FC<HeaderProps> = ({
  title = 'AI Activity',
  chartType,
  onChartTypeChange,
  onOpenSettings,
  onSetMode,
  isPinned = true,
  onTogglePin,
}) => {
  const [showChartDropdown, setShowChartDropdown] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const chartDropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (chartDropdownRef.current && !chartDropdownRef.current.contains(target)) {
        setShowChartDropdown(false);
      }
      if (menuRef.current && !menuRef.current.contains(target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const ChartIcon =
    chartType === 'area' ? TrendingUp : chartType === 'heatmap' ? Grid3X3 : BarChart3;

  return (
    <div className="relative flex items-center justify-between h-[26px] mb-1.5 select-none shrink-0">
      {/* Left: Title */}
      <div className="flex items-center gap-2 overflow-hidden">
        <span className="text-[11.5px] font-semibold text-[var(--color-text-1)] tracking-tight truncate">
          {title}
        </span>
      </div>

      {/* Right Controls */}
      <div
        className="flex items-center gap-1 shrink-0"
        onMouseDown={(e) => e.stopPropagation()}
        data-interactive="true"
      >
        {/* Pin / Unpin button */}
        {onTogglePin && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin();
            }}
            title={isPinned ? 'Always on Top (Click to Unpin)' : 'Click to Pin (Always on Top)'}
            className={`flex items-center justify-center w-[24px] h-[24px] rounded-[7px] border transition-all cursor-pointer ${
              isPinned
                ? 'bg-[var(--color-accent-1)]/15 border-[var(--color-accent-1)]/40 text-[var(--color-accent-1)]'
                : 'bg-transparent border-transparent text-[var(--color-text-3)] hover:text-[var(--color-text-1)] hover:bg-white/5'
            }`}
          >
            {isPinned ? <Pin className="w-3 h-3 fill-current" /> : <PinOff className="w-3 h-3" />}
          </button>
        )}

        {/* Chart type segmented pill */}
        <div className="relative" ref={chartDropdownRef}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowChartDropdown((prev) => !prev);
              setShowMenu(false);
            }}
            className="flex items-center gap-1 h-[24px] px-2 rounded-[7px] bg-[var(--surface-1)] border border-[var(--border)] text-[10.5px] font-medium text-[var(--color-text-1)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
          >
            <ChartIcon className="w-3 h-3 text-[var(--color-accent-1)]" />
            <span className="capitalize">{chartType}</span>
            <ChevronDown className="w-2.5 h-2.5 text-[var(--color-text-3)]" />
          </button>

          {showChartDropdown && (
            <div className="absolute right-0 top-[28px] z-50 w-32 py-1 rounded-[9px] bg-[var(--color-bg-elevated)] border border-[var(--border-strong)] shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
              {(
                [
                  { id: 'bar', label: 'Bar Chart', icon: BarChart3 },
                  { id: 'area', label: 'Area Chart', icon: TrendingUp },
                  { id: 'heatmap', label: 'Heatmap Chart', icon: Grid3X3 },
                ] as const
              ).map((item) => {
                const ItemIcon = item.icon;
                const isActive = chartType === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChartTypeChange(item.id);
                      setShowChartDropdown(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 flex items-center gap-2 text-[10.5px] font-medium cursor-pointer transition-colors ${
                      isActive
                        ? 'bg-[var(--color-accent-1)]/15 text-[var(--color-accent-1)] font-semibold'
                        : 'text-[var(--color-text-2)] hover:text-[var(--color-text-1)] hover:bg-white/5'
                    }`}
                  >
                    <ItemIcon className="w-3 h-3 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* More options button */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu((prev) => !prev);
              setShowChartDropdown(false);
            }}
            className="flex items-center justify-center w-[24px] h-[24px] rounded-[7px] text-[var(--color-text-3)] hover:text-[var(--color-text-1)] hover:bg-[var(--surface-1)] transition-colors cursor-pointer"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-[28px] z-50 w-36 py-1 rounded-[9px] bg-[var(--color-bg-elevated)] border border-[var(--border-strong)] shadow-2xl text-[10.5px]">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSetMode('plans');
                  setShowMenu(false);
                }}
                className="w-full text-left px-2.5 py-1.5 flex items-center gap-2 text-[var(--color-text-2)] hover:text-[var(--color-text-1)] hover:bg-white/5 cursor-pointer"
              >
                <Sliders className="w-3 h-3 text-[var(--color-accent-1)]" />
                Plans & Quotas
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSetMode('compact');
                  setShowMenu(false);
                }}
                className="w-full text-left px-2.5 py-1.5 flex items-center gap-2 text-[var(--color-text-2)] hover:text-[var(--color-text-1)] hover:bg-white/5 cursor-pointer"
              >
                <Minimize2 className="w-3 h-3 text-[var(--color-accent-2)]" />
                Compact View
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSetMode('rail');
                  setShowMenu(false);
                }}
                className="w-full text-left px-2.5 py-1.5 flex items-center gap-2 text-[var(--color-text-2)] hover:text-[var(--color-text-1)] hover:bg-white/5 cursor-pointer"
              >
                <ExternalLink className="w-3 h-3 text-[var(--color-success)]" />
                Dock to Rail
              </button>
              <div className="h-[1px] bg-[var(--border)] my-1" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenSettings();
                  setShowMenu(false);
                }}
                className="w-full text-left px-2.5 py-1.5 flex items-center gap-2 text-[var(--color-text-2)] hover:text-[var(--color-text-1)] hover:bg-white/5 cursor-pointer"
              >
                <Settings className="w-3 h-3 text-[var(--color-text-3)]" />
                Settings
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
