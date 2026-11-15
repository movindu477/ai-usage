import React, { useState, useEffect } from 'react';
import { Card } from '../components/common/Card';
import { Header } from '../components/widget/Header';
import { SystemMonitor } from '../components/widget/SystemMonitor';
import { MediaPanel } from '../components/widgets/MediaPanel';
import { CompanionPanel } from '../components/widgets/CompanionPanel';
import { Check, Edit2 } from 'lucide-react';
import { dragWindow, getSetting, setSetting } from '../lib/ipc';
import { WidgetMode } from '../lib/types';

interface ExpandedProps {
  onSetMode: (mode: WidgetMode) => void;
  onOpenSettings: () => void;
  isPinned?: boolean;
  onTogglePin?: () => void;
}

export const Expanded: React.FC<ExpandedProps> = ({
  onSetMode,
  onOpenSettings,
  isPinned = true,
  onTogglePin,
}) => {
  const [userName, setUserName] = useState<string>('User');
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [tempName, setTempName] = useState<string>('');

  useEffect(() => {
    getSetting('user_display_name').then((val) => {
      if (val) setUserName(val);
      else {
        const legacy = localStorage.getItem('ai_user_name');
        if (legacy) setUserName(legacy);
      }
    });
  }, []);

  const handleSaveName = () => {
    const trimmed = tempName.trim();
    if (trimmed) {
      setUserName(trimmed);
      setSetting('user_display_name', trimmed);
      localStorage.setItem('ai_user_name', trimmed);
    }
    setIsEditingName(false);
  };

  const handleRightColMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button, input, a')) return;
    dragWindow();
  };

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="flex items-stretch gap-3 select-none">
      {/* Left Column: System Monitor Card (CPU, GPU, Storage, RAM, Wi-Fi) */}
      <Card width={328} height={294} className="justify-between">
        {/* 1. Header */}
        <Header
          onOpenSettings={onOpenSettings}
          onSetMode={onSetMode}
          isPinned={isPinned}
          onTogglePin={onTogglePin}
        />

        {/* 2. Welcome Message & Live Sync Status */}
        <div
          className="flex items-center justify-between mb-1 px-0.5 shrink-0"
          onMouseDown={(e) => e.stopPropagation()}
          data-interactive="true"
        >
          <div className="flex items-center gap-1.5 overflow-hidden">
            {isEditingName ? (
              <div className="flex items-center gap-1 bg-[var(--surface-2)] px-1.5 py-0.5 rounded-[5px] border border-[var(--border-strong)]">
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') setIsEditingName(false);
                  }}
                  autoFocus
                  maxLength={20}
                  className="bg-transparent text-[10.5px] font-semibold text-[var(--color-text-1)] outline-none w-20"
                />
                <button
                  type="button"
                  onClick={handleSaveName}
                  className="text-[var(--color-success)] hover:opacity-80 cursor-pointer"
                >
                  <Check className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setTempName(userName);
                  setIsEditingName(true);
                }}
                className="group flex items-center gap-1 cursor-pointer bg-transparent border-none p-0 text-left outline-none"
                title="Click to customize your name"
              >
                <span className="text-[10.5px] text-[var(--color-text-2)] font-medium">
                  {greeting},{' '}
                  <span className="text-[var(--color-text-1)] font-semibold group-hover:text-[#26b988] group-hover:underline transition-colors">
                    {userName}
                  </span>
                </span>
                <Edit2 className="w-2.5 h-2.5 opacity-0 group-hover:opacity-70 transition-opacity text-[var(--color-text-3)]" />
              </button>
            )}
          </div>

          {/* Live sync pulse */}
          <div className="flex items-center gap-1 text-[9px] text-[var(--color-text-3)] font-medium shrink-0">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#26b988] opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#26b988]" />
            </span>
            <span className="text-[8.5px] uppercase tracking-wider">Live</span>
          </div>
        </div>

        {/* 3. Live System Monitor (Row 1: CPU + GPU, Row 2: Storage + RAM, Row 3: Wi-Fi) */}
        <SystemMonitor />
      </Card>

      {/* Right Column: Music Widget (Top) + Cute Companion Widget (Bottom), Equal Size */}
      <div
        onMouseDown={handleRightColMouseDown}
        className="w-[196px] h-[294px] flex flex-col gap-3 shrink-0"
      >
        <MediaPanel />
        <CompanionPanel />
      </div>
    </div>
  );
};
