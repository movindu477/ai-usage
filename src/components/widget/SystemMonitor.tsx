import React, { useEffect, useState } from 'react';
import { fetchSystemStats, SystemStats } from '../../lib/system';
import { Wifi } from 'lucide-react';

interface GaugeCardProps {
  label: string;
  pct: number;
  subtitle: string;
  pulseTick: number;
}

const SpeedometerCard: React.FC<GaugeCardProps> = ({
  label,
  pct,
  subtitle,
  pulseTick,
}) => {
  const clamped = Math.min(100, Math.max(0, pct));
  const arcLen = Math.PI * 30; // r = 30 -> 94.25
  const dashOffset = arcLen * (1 - clamped / 100);
  // Subtle micro-flutter (±0.7 deg) so the needle visibly breathes like a real analog gauge
  const flutter = pulseTick % 2 === 0 ? 0.6 : -0.6;
  const angle = -90 + (clamped / 100) * 180 + flutter;

  return (
    <div className="bg-[var(--surface-1)] px-2.5 py-2 rounded-[13px] border border-[var(--border)] flex items-center justify-between gap-1.5 overflow-hidden">
      {/* Left: Value, Title, Subtitle */}
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-[18px] font-bold num text-[var(--color-text-1)] leading-none tracking-tight">
          {Math.round(clamped)}%
        </span>
        <span className="text-[10px] font-medium text-[var(--color-text-2)] mt-1 truncate">
          {label}
        </span>
        <div className="flex items-center gap-1 mt-0.5 min-w-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#26b988] shrink-0" />
          <span className="text-[9px] font-semibold text-[var(--color-text-3)] num truncate">
            {subtitle}
          </span>
        </div>
      </div>

      {/* Right: Moving Semi-Circular Clock/Speedometer Gauge */}
      <div className="shrink-0 flex items-center justify-center">
        <svg
          width="68"
          height="42"
          viewBox="0 0 76 46"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer background track arc */}
          <path
            d="M 8 40 A 30 30 0 0 1 68 40"
            stroke="rgba(38, 185, 136, 0.18)"
            strokeWidth="7"
            strokeLinecap="round"
          />

          {/* Subtle inner guide arc */}
          <path
            d="M 17 40 A 21 21 0 0 1 59 40"
            stroke="rgba(38, 185, 136, 0.10)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Active emerald progress arc */}
          <path
            d="M 8 40 A 30 30 0 0 1 68 40"
            stroke="#26b988"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={arcLen}
            strokeDashoffset={dashOffset}
            style={{
              transition:
                'stroke-dashoffset 650ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          />

          {/* Rotating Clock / Speedometer Needle */}
          <g
            style={{
              transformOrigin: '38px 40px',
              transform: `rotate(${angle}deg)`,
              transition: 'transform 650ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            <line
              x1="38"
              y1="40"
              x2="38"
              y2="16"
              stroke="#1b7a5a"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </g>

          {/* Semi-circular pivot base */}
          <path d="M 29 41 A 9 9 0 0 1 47 41 Z" fill="#134e3a" />
        </svg>
      </div>
    </div>
  );
};

export function SystemMonitor() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [tick, setTick] = useState<number>(0);

  useEffect(() => {
    fetchSystemStats().then(setStats);

    const interval = setInterval(() => {
      fetchSystemStats().then((data) => {
        setStats(data);
        setTick((t) => t + 1);
      });
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
  const hasGpu = stats.gpu_usage !== null && stats.gpu_usage !== undefined;
  const gpuPct = hasGpu ? Math.min(100, Math.max(0, stats.gpu_usage ?? 0)) : 0;

  const ramPct =
    stats.ram_total_gb > 0
      ? Math.min(100, Math.max(0, (stats.ram_used_gb / stats.ram_total_gb) * 100))
      : 0;
  const storagePct =
    stats.storage_total_gb > 0
      ? Math.min(
          100,
          Math.max(0, (stats.storage_used_gb / stats.storage_total_gb) * 100)
        )
      : 0;

  return (
    <div
      className="flex-1 flex flex-col justify-between gap-2 text-[var(--color-text-1)] select-none"
      onMouseDown={(e) => e.stopPropagation()}
      data-interactive="true"
    >
      {/* Row 1: CPU & GPU (side by side if GPU is detected on laptop) */}
      <div className={hasGpu ? 'grid grid-cols-2 gap-2' : 'grid grid-cols-1'}>
        <SpeedometerCard
          label="CPU Load"
          pct={cpuPct}
          subtitle={`${stats.cpu_usage.toFixed(1)}% active`}
          pulseTick={tick}
        />
        {hasGpu && (
          <SpeedometerCard
            label="GPU Load"
            pct={gpuPct}
            subtitle={stats.gpu_name || 'Graphics'}
            pulseTick={tick}
          />
        )}
      </div>

      {/* Row 2: Storage (C:) & RAM (side by side) */}
      <div className="grid grid-cols-2 gap-2">
        <SpeedometerCard
          label="Storage (C:)"
          pct={storagePct}
          subtitle={`${stats.storage_used_gb}/${stats.storage_total_gb} GB`}
          pulseTick={tick}
        />
        <SpeedometerCard
          label="RAM Usage"
          pct={ramPct}
          subtitle={`${stats.ram_used_gb}/${stats.ram_total_gb} GB`}
          pulseTick={tick}
        />
      </div>

      {/* Row 3: Compact Wi-Fi Strip */}
      <div className="flex items-center justify-between bg-[var(--surface-1)] px-3 py-1.5 rounded-[11px] border border-[var(--border)]">
        <div className="flex items-center gap-2 text-[var(--color-text-2)] text-[11px] font-medium min-w-0">
          <Wifi
            size={13}
            className={
              stats.wifi_speed_mbps > 0
                ? 'text-[#26b988] shrink-0'
                : 'text-red-400 shrink-0'
            }
          />
          <span className="truncate text-[var(--color-text-1)]">
            {stats.wifi_ssid || 'Disconnected'}
          </span>
        </div>
        <div className="text-[11px] font-semibold num shrink-0 ml-2 text-[var(--color-text-2)]">
          {stats.wifi_speed_mbps > 0
            ? `${stats.wifi_speed_mbps} Mbps`
            : 'Disconnected'}
        </div>
      </div>
    </div>
  );
}
