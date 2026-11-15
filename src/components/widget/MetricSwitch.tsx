import type { FC } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Calendar, ArrowRight, TrendingUp } from 'lucide-react';
import { MetricType, MetricOverview } from '../../lib/types';

interface MetricSwitchProps {
  overview: MetricOverview;
  metric: MetricType;
  onCycleMetric: () => void;
  dateRangeText?: { start: string; end: string };
}

export const MetricSwitch: FC<MetricSwitchProps> = ({
  overview,
  metric,
  onCycleMetric,
  dateRangeText = { start: 'Apr 28', end: 'May 04' },
}) => {
  return (
    <div className="flex items-baseline justify-between mb-1.5 shrink-0 select-none">
      {/* Metric headline */}
      <button
        type="button"
        onClick={onCycleMetric}
        className="group flex items-baseline gap-1.5 cursor-pointer text-left bg-transparent border-none p-0 outline-none"
        title="Click to cycle tasks / tokens / cost"
        data-interactive="true"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={metric}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            transition={{ duration: 0.15 }}
            className="flex items-baseline gap-1.5"
          >
            <span className="text-[22px] font-bold leading-none tracking-tight num text-[var(--color-text-1)]">
              {overview.formatted_value}
            </span>
            <span className="text-[10.5px] text-[var(--color-text-3)] font-medium capitalize">
              {overview.unit}
            </span>
          </motion.div>
        </AnimatePresence>
        <ChevronDown className="w-2.5 h-2.5 text-[var(--color-text-3)] opacity-40 group-hover:opacity-100 transition-opacity self-center" />
      </button>

      {/* Date Range & Delta badge */}
      <div className="flex items-center gap-1.5">
        {overview.delta_pct !== undefined && (
          <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-[5px] bg-[var(--color-success)]/10 text-[9.5px] font-semibold text-[var(--color-success)] num">
            <TrendingUp className="w-2.5 h-2.5" />
            +{overview.delta_pct}%
          </span>
        )}
        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[5px] bg-white/[0.03] text-[9.5px] text-[var(--color-text-3)] font-medium">
          <Calendar className="w-2.5 h-2.5" />
          <span>{dateRangeText.start}</span>
          <ArrowRight className="w-2 h-2 opacity-50" />
          <span>{dateRangeText.end}</span>
        </div>
      </div>
    </div>
  );
};
