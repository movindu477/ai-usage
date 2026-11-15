import { useState, useEffect } from 'react';
import { Card } from '../components/common/Card';
import { PrivacyModal } from '../components/common/PrivacyModal';
import { ResetConfirmModal } from '../components/common/ResetConfirmModal';
import { ThemeSelector } from '../components/common/ThemeSelector';
import { useTheme } from '../hooks/useTheme';
import {
  ArrowLeft,
  User,
  RefreshCw,
  Pin,
  Eye,
  Check,
  ShieldCheck,
  HelpCircle,
  Copy,
  Trash2,
} from 'lucide-react';
import { WidgetState } from '../lib/types';
import { getSetting, setSetting, getDiagnostics, resetAppData } from '../lib/ipc';

interface SettingsProps {
  state: WidgetState;
  onUpdateState: (updates: Partial<WidgetState>) => void;
  onClose: () => void;
  onRescan: () => void;
}

const PROVIDERS = [
  { id: 'claude', name: 'Claude Code', color: '#7c5cff', subtitle: 'OAuth usage & assistant logs' },
  { id: 'antigravity', name: 'Antigravity', color: '#ff8a4c', subtitle: 'Connect-RPC local loopback' },
  { id: 'codex', name: 'OpenAI Codex', color: '#636375', subtitle: 'Local usage events' },
];

export const Settings: React.FC<SettingsProps> = ({
  state,
  onUpdateState,
  onClose,
  onRescan,
}) => {
  const { theme, setTheme } = useTheme();
  const [userName, setUserName] = useState('User');
  const [savedName, setSavedName] = useState(false);
  const [copiedDiag, setCopiedDiag] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    getSetting('user_display_name').then((val) => {
      if (val) setUserName(val);
      else {
        const legacy = localStorage.getItem('ai_user_name');
        if (legacy) {
          setUserName(legacy);
          setSetting('user_display_name', legacy);
        }
      }
    });
  }, []);

  const handleSaveUserName = (name: string) => {
    setUserName(name);
    setSetting('user_display_name', name);
    localStorage.setItem('ai_user_name', name);
    setSavedName(true);
    setTimeout(() => setSavedName(false), 1500);
  };

  const handleCopyDiagnostics = async () => {
    const diag = await getDiagnostics();
    const text = `AI Usage Tracker Diagnostics
============================
Version: ${diag.version}
Platform: ${diag.os}
Claude Status: ${diag.claude_status}
Antigravity Status: ${diag.antigravity_status}
Codex Status: ${diag.codex_status}
Stored Events: ${diag.db_events_count}
Timestamp: ${new Date(diag.last_poll_timestamp * 1000).toISOString()}`;
    await navigator.clipboard.writeText(text);
    setCopiedDiag(true);
    setTimeout(() => setCopiedDiag(false), 2000);
  };

  const handleResetData = async () => {
    await resetAppData();
    setShowResetConfirm(false);
    onRescan();
  };

  return (
    <Card width={340} height={360} className="justify-between relative">
      {/* Header */}
      <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onClose}
            onMouseDown={(e) => e.stopPropagation()}
            className="flex items-center justify-center w-5 h-5 rounded-[6px] text-[var(--color-text-3)] hover:text-[var(--color-text-1)] hover:bg-white/5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11.5px] font-semibold text-[var(--color-text-1)]">
            Widget Settings
          </span>
        </div>

        {/* Local only badge */}
        <div
          onClick={() => setShowPrivacyModal(true)}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded-[5px] bg-[var(--color-success)]/10 text-[9px] font-semibold text-[var(--color-success)] cursor-pointer hover:bg-[var(--color-success)]/20 transition-colors"
          title="Click to view privacy & access details"
        >
          <ShieldCheck className="w-2.5 h-2.5" />
          <span>Local Only</span>
        </div>
      </div>

      <div className="flex flex-col gap-2 py-1.5 overflow-y-auto flex-1 pr-0.5 text-[10.5px]">
        {/* User Name */}
        <div className="flex flex-col gap-1 p-2 rounded-[7px] bg-white/[0.03] border border-white/[0.06]">
          <div className="flex items-center justify-between text-[9.5px] text-[var(--color-text-2)] font-medium">
            <span className="flex items-center gap-1">
              <User className="w-3 h-3 text-[var(--color-accent-1)]" />
              Your Display Name
            </span>
            {savedName && (
              <span className="text-[var(--color-success)] flex items-center gap-0.5 text-[9px]">
                <Check className="w-2.5 h-2.5" /> Saved
              </span>
            )}
          </div>
          <input
            type="text"
            value={userName}
            onChange={(e) => handleSaveUserName(e.target.value)}
            placeholder="Enter your name..."
            maxLength={25}
            className="w-full bg-black/40 border border-white/10 rounded-[5px] px-2 py-1 text-[10.5px] text-white outline-none focus:border-[var(--color-accent-1)]"
          />
        </div>

        {/* Pin Window */}
        <div className="flex items-center justify-between p-2 rounded-[7px] bg-white/[0.03] border border-white/[0.06]">
          <div className="flex items-center gap-1.5">
            <Pin className="w-3 h-3 text-[var(--color-accent-1)]" />
            <div>
              <div className="font-medium text-[var(--color-text-1)]">Always on Top</div>
              <div className="text-[9px] text-[var(--color-text-3)]">Keep floating above all windows</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onUpdateState({ pinned: !state.pinned })}
            onMouseDown={(e) => e.stopPropagation()}
            className={`w-8 h-4.5 rounded-full transition-colors relative cursor-pointer ${
              state.pinned ? 'bg-[var(--color-accent-1)]' : 'bg-white/10'
            }`}
          >
            <div
              className={`w-3 h-3 rounded-full bg-white absolute top-[3px] transition-transform ${
                state.pinned ? 'left-[17px]' : 'left-[3px]'
              }`}
            />
          </button>
        </div>

        {/* Theme Preference */}
        <ThemeSelector theme={theme} onSelect={setTheme} />

        {/* Opacity (Floor at 75%) */}
        <div className="flex flex-col gap-1 p-2 rounded-[7px] bg-white/[0.03] border border-white/[0.06]">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 font-medium text-[var(--color-text-1)]">
              <Eye className="w-3 h-3 text-[var(--color-accent-2)]" />
              Window Opacity
            </span>
            <span className="text-[9px] font-semibold num text-[var(--color-text-2)]">
              {Math.round(state.opacity * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0.75"
            max="1.0"
            step="0.05"
            value={state.opacity}
            onChange={(e) => onUpdateState({ opacity: parseFloat(e.target.value) })}
            onMouseDown={(e) => e.stopPropagation()}
            className="w-full accent-[var(--color-accent-1)] cursor-pointer h-1"
          />
        </div>

        {/* Providers Overview */}
        <div className="flex flex-col gap-1">
          <span className="text-[9.5px] uppercase tracking-wider text-[var(--color-text-3)] font-semibold px-0.5">
            Supported AI Tools
          </span>
          {PROVIDERS.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between p-1.5 rounded-[6px] bg-white/[0.02] border border-white/[0.04]"
            >
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
                <div>
                  <div className="font-medium text-[var(--color-text-1)] text-[10px]">{p.name}</div>
                  <div className="text-[8.5px] text-[var(--color-text-3)]">{p.subtitle}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 mt-0.5">
          <button
            type="button"
            onClick={handleCopyDiagnostics}
            onMouseDown={(e) => e.stopPropagation()}
            className="flex-1 h-6 rounded-[6px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-[9.5px] font-medium text-[var(--color-text-2)] hover:text-white transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            {copiedDiag ? <Check className="w-2.5 h-2.5 text-[var(--color-success)]" /> : <Copy className="w-2.5 h-2.5" />}
            {copiedDiag ? 'Copied' : 'Diagnostics'}
          </button>
          <button
            type="button"
            onClick={() => setShowPrivacyModal(true)}
            onMouseDown={(e) => e.stopPropagation()}
            className="flex-1 h-6 rounded-[6px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-[9.5px] font-medium text-[var(--color-text-2)] hover:text-white transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            <HelpCircle className="w-2.5 h-2.5" />
            What It Reads
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onRescan}
            onMouseDown={(e) => e.stopPropagation()}
            className="flex-1 h-6 rounded-[6px] bg-[var(--surface-1)] hover:bg-[var(--surface-2)] border border-[var(--border)] text-[9.5px] font-medium text-[var(--color-text-2)] hover:text-white transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-2.5 h-2.5 text-[var(--color-accent-1)]" />
            Rescan Now
          </button>
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            onMouseDown={(e) => e.stopPropagation()}
            className="h-6 px-2 rounded-[6px] bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-[9.5px] font-medium text-red-400 hover:text-red-300 transition-colors flex items-center justify-center gap-1 cursor-pointer"
            title="Reset SQLite database"
          >
            <Trash2 className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>

      {/* Privacy / What This App Reads Disclosure Modal */}
      {showPrivacyModal && (
        <PrivacyModal onClose={() => setShowPrivacyModal(false)} />
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <ResetConfirmModal
          onCancel={() => setShowResetConfirm(false)}
          onConfirm={handleResetData}
        />
      )}
    </Card>
  );
};
