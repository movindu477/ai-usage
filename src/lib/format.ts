export type QuotaBand = 'ok' | 'warn' | 'danger' | 'none';

export function quotaBand(pct: number | null | undefined): QuotaBand {
  if (pct === null || pct === undefined || isNaN(pct)) return 'none';
  if (pct < 70) return 'ok';
  if (pct < 90) return 'warn';
  return 'danger';
}

export function quotaColor(band: QuotaBand): string {
  switch (band) {
    case 'ok':
      return 'var(--color-quota-ok, #7c5cff)';
    case 'warn':
      return 'var(--color-quota-warn, #ffb020)';
    case 'danger':
      return 'var(--color-quota-danger, #ff5d5d)';
    case 'none':
    default:
      return 'var(--color-text-3, rgba(238, 238, 245, 0.36))';
  }
}

export function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) {
    const val = tokens / 1_000_000;
    return `${val >= 10 ? val.toFixed(1) : val.toFixed(2)}M`;
  }
  if (tokens >= 1_000) {
    const val = tokens / 1_000;
    return `${val >= 10 ? val.toFixed(0) : val.toFixed(1)}k`;
  }
  return tokens.toLocaleString();
}

export function formatUsd(cost: number | null | undefined): string {
  if (cost === null || cost === undefined || isNaN(cost)) return '—';
  return `$${cost.toFixed(2)}`;
}

export function formatNumber(val: number): string {
  return val.toLocaleString('en-US');
}

export function formatCountdown(target: number | string | null | undefined): string {
  if (!target) return '';
  const targetMs = typeof target === 'string' ? new Date(target).getTime() : target > 1e11 ? target : target * 1000;
  const now = Date.now();
  const diffSec = Math.floor((targetMs - now) / 1000);

  if (diffSec <= 0) return 'resets soon';

  const days = Math.floor(diffSec / 86400);
  const hours = Math.floor((diffSec % 86400) / 3600);
  const minutes = Math.floor((diffSec % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function formatFreshness(timestamp: number | null | undefined): string {
  if (!timestamp) return '';
  const tsMs = timestamp > 1e11 ? timestamp : timestamp * 1000;
  const diffSec = Math.floor((Date.now() - tsMs) / 1000);
  if (diffSec < 5) return 'just now';
  if (diffSec < 60) return `updated ${diffSec}s`;
  const mins = Math.floor(diffSec / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ago`;
}
