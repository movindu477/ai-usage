import type { FC } from 'react';
import { ShieldCheck, X } from 'lucide-react';

interface PrivacyModalProps {
  onClose: () => void;
}

const DISCLOSURES = [
  {
    path: '~/.claude/.credentials.json',
    detail: 'Reads OAuth access token & expiration only. Sent strictly to api.anthropic.com. Never logged, never written.',
  },
  {
    path: 'Antigravity Connect-RPC (127.0.0.1)',
    detail: 'Queries local language server port via GetUserStatus for active model quotas. Never leaves your PC.',
  },
  {
    path: '~/.claude/projects/*/*.jsonl',
    detail: 'Parses assistant session logs to calculate daily task counts and token costs completely offline.',
  },
];

export const PrivacyModal: FC<PrivacyModalProps> = ({ onClose }) => {
  return (
    <div
      className="absolute inset-0 z-50 bg-[#0b0b0f]/95 backdrop-blur-md p-3 flex flex-col justify-between rounded-[20px]"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div>
        <div className="flex items-center justify-between pb-1.5 border-b border-white/10 mb-2">
          <span className="text-[11.5px] font-bold text-white flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-success)]" />
            What AI Usage Reads
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-white/50 hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex flex-col gap-2 text-[9.5px] text-white/80 leading-relaxed overflow-y-auto max-h-[220px]">
          {DISCLOSURES.map((item, idx) => (
            <div key={idx} className="p-1.5 rounded bg-white/[0.03] border border-white/[0.06]">
              <div className="font-semibold text-white">{item.path}</div>
              <div className="text-white/60">{item.detail}</div>
            </div>
          ))}
          <div className="text-[9px] text-[var(--color-success)] font-medium">
            ✓ No analytics · No crash telemetry · Zero cloud storage
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="w-full h-6 rounded-[6px] bg-white/10 hover:bg-white/15 text-[10px] font-semibold text-white cursor-pointer transition-colors mt-2"
      >
        Close Disclosure
      </button>
    </div>
  );
};
