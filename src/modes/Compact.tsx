import React, { useEffect, useState } from 'react';
import { Maximize2, MoreHorizontal, Cpu, MemoryStick, Wifi } from 'lucide-react';
import { Card } from '../components/common/Card';
import { WidgetMode } from '../lib/types';
import { fetchSystemStats, SystemStats } from '../lib/system';

interface CompactProps {
  onSetMode: (mode: WidgetMode) => void;
  onOpenSettings: () => void;
}

export const Compact: React.FC<CompactProps> = ({
  onSetMode,
  onOpenSettings,
}) => {
  const [stats, setStats] = useState<SystemStats | null>(null);

  useEffect(() => {
    fetchSystemStats().then(setStats);
    const interval = setInterval(() => {
      fetchSystemStats().then(setStats);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const cpuPct = stats ? stats.cpu_usage : 0;
  const ramPct =
    stats && stats.ram_total_gb > 0
      ? Math.min(100, Math.round((stats.ram_used_gb / stats.ram_total_gb) * 100))
      : 0;

  return (
    <Card width={270} height={110} padding={false} className="p-2.5 justify-between">
      {/* Top Header */}
      <div className="flex items-center justify-between h-4">
        <span className="text-[9.5px] uppercase tracking-wider text-[var(--color-text-3)] font-semibold">
          System Monitor
        </span>
        <div className="flex items-center gap-1" onMouseDown={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onSetMode('expanded')}
            className="text-[var(--color-text-3)] hover:text-[var(--color-text-1)] p-0.5 rounded cursor-pointer transition-colors"
            title="Expand"
          >
            <Maximize2 className="w-2.5 h-2.5" />
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            className="text-[var(--color-text-3)] hover:text-[var(--color-text-1)] p-0.5 rounded cursor-pointer transition-colors"
            title="Settings"
          >
            <MoreHorizontal className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>

      {/* Main CPU & RAM Row */}
      <div className="flex items-center justify-between gap-3 my-1">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[var(--color-accent-1)]" />
          <div>
            <div className="text-[15px] font-bold num text-[var(--color-text-1)] leading-none">
              {cpuPct.toFixed(1)}%
            </div>
            <div className="text-[8.5px] text-[var(--color-text-3)] mt-0.5">CPU Load</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <MemoryStick className="w-4 h-4 text-[var(--color-accent-2)]" />
          <div>
            <div className="text-[15px] font-bold num text-[var(--color-text-1)] leading-none">
              {stats ? stats.ram_used_gb : '—'} GB
            </div>
            <div className="text-[8.5px] text-[var(--color-text-3)] mt-0.5">
              RAM ({ramPct}%)
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Wi-Fi Strip */}
      <div className="flex items-center justify-between pt-1 border-t border-[var(--border)] text-[9px]">
        <div className="flex items-center gap-1.5 text-[var(--color-text-2)] truncate">
          <Wifi
            className={`w-3 h-3 shrink-0 ${
              (stats?.wifi_speed_mbps ?? 0) > 0 ? 'text-[var(--color-success)]' : 'text-red-400'
            }`}
          />
          <span className="truncate">{stats?.wifi_ssid || 'Disconnected'}</span>
        </div>
        <span className="num font-semibold text-[var(--color-text-1)] shrink-0">
          {(stats?.wifi_speed_mbps ?? 0) > 0 ? `${stats?.wifi_speed_mbps} Mbps` : 'Offline'}
        </span>
      </div>
    </Card>
  );
};
