import { useEffect, useState } from 'react';
import { fetchSystemStats, SystemStats } from '../../lib/system';
import { Cpu, HardDrive, Wifi, MemoryStick } from 'lucide-react';

export function SystemMonitor() {
  const [stats, setStats] = useState<SystemStats | null>(null);

  useEffect(() => {
    // 1. Fetch immediately on mount
    fetchSystemStats().then(setStats);

    // 2. Live update every 1.5 seconds (1500ms)
    const interval = setInterval(() => {
      fetchSystemStats().then(setStats);
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  if (!stats) {
    return (
      <div className="flex-1 flex items-center justify-center text-xs text-[var(--color-text-3)]">
        Loading system stats...
      </div>
    );
  }

  const cpuPct = Math.min(100, Math.max(0, stats.cpu_usage));
  const ramPct =
    stats.ram_total_gb > 0
      ? Math.min(100, Math.max(0, (stats.ram_used_gb / stats.ram_total_gb) * 100))
      : 0;
  const storagePct =
    stats.storage_total_gb > 0
      ? Math.min(
          100,
          Math.max(0, Math.round((stats.storage_used_gb / stats.storage_total_gb) * 100))
        )
      : 0;

  return (
    <div
      className="flex-1 flex flex-col justify-between gap-2 text-[var(--color-text-1)] select-none"
      onMouseDown={(e) => e.stopPropagation()}
      data-interactive="true"
    >
      {/* CPU & RAM Row */}
      <div className="flex gap-2.5">
        <div className="flex-1 bg-[var(--surface-1)] p-2.5 rounded-[12px] border border-[var(--border)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1 text-[var(--color-text-2)] text-[11px] font-medium">
            <span className="flex items-center gap-1.5">
              <Cpu size={13} className="text-[var(--color-accent-1)]" /> CPU
            </span>
            <span className="text-[9.5px] text-[var(--color-text-3)]">Live</span>
          </div>
          <div className="text-[20px] font-bold num leading-tight">
            {stats.cpu_usage.toFixed(1)}%
          </div>
          <div className="h-1 w-full bg-[var(--surface-2)] rounded-full overflow-hidden mt-1.5">
            <div
              className="h-full bg-[var(--color-accent-1)] rounded-full transition-all duration-500"
              style={{ width: `${cpuPct}%` }}
            />
          </div>
        </div>

        <div className="flex-1 bg-[var(--surface-1)] p-2.5 rounded-[12px] border border-[var(--border)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1 text-[var(--color-text-2)] text-[11px] font-medium">
            <span className="flex items-center gap-1.5">
              <MemoryStick size={13} className="text-[var(--color-accent-2)]" /> RAM
            </span>
            <span className="text-[9.5px] text-[var(--color-text-3)] num">
              {Math.round(ramPct)}%
            </span>
          </div>
          <div className="text-[20px] font-bold num leading-tight">
            {stats.ram_used_gb}{' '}
            <span className="text-[11px] font-medium text-[var(--color-text-3)]">
              / {stats.ram_total_gb} GB
            </span>
          </div>
          <div className="h-1 w-full bg-[var(--surface-2)] rounded-full overflow-hidden mt-1.5">
            <div
              className="h-full bg-[var(--color-accent-2)] rounded-full transition-all duration-500"
              style={{ width: `${ramPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Storage Row */}
      <div className="bg-[var(--surface-1)] p-2.5 rounded-[12px] border border-[var(--border)]">
        <div className="flex justify-between items-center mb-1.5 text-[var(--color-text-2)] text-[11px] font-medium">
          <div className="flex items-center gap-1.5">
            <HardDrive size={13} className="text-[var(--color-accent-1)]" /> Storage (C:)
          </div>
          <span className="num text-[10.5px]">
            <span className="text-[var(--color-text-1)] font-semibold">
              {stats.storage_used_gb} GB
            </span>{' '}
            <span className="text-[var(--color-text-3)]">
              / {stats.storage_total_gb} GB ({storagePct}%)
            </span>
          </span>
        </div>
        <div className="h-1.5 w-full bg-[var(--surface-2)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--color-accent-1)] rounded-full transition-all duration-500"
            style={{ width: `${storagePct}%` }}
          />
        </div>
      </div>

      {/* Wi-Fi Row */}
      <div className="flex items-center justify-between bg-[var(--surface-1)] px-3 py-2.5 rounded-[12px] border border-[var(--border)]">
        <div className="flex items-center gap-2 text-[var(--color-text-2)] text-[11.5px] font-medium min-w-0">
          <Wifi
            size={14}
            className={
              stats.wifi_speed_mbps > 0
                ? 'text-[var(--color-success)] shrink-0'
                : 'text-red-400 shrink-0'
            }
          />
          <span className="truncate text-[var(--color-text-1)]">
            {stats.wifi_ssid || 'Disconnected'}
          </span>
        </div>
        <div className="text-[12px] font-semibold num shrink-0 ml-2">
          {stats.wifi_speed_mbps > 0 ? `${stats.wifi_speed_mbps} Mbps` : 'Disconnected'}
        </div>
      </div>
    </div>
  );
}
