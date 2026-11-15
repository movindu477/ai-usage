import { useState } from 'react';
import { WidgetMode, WidgetState } from './lib/types';
import {
  setWidgetMode,
  setWidgetPinned,
  setWidgetOpacity,
  snapToEdges,
} from './lib/ipc';
import { Expanded } from './modes/Expanded';
import { Compact } from './modes/Compact';
import { Rail } from './modes/Rail';
import { Settings } from './modes/Settings';
import { useTheme } from './hooks/useTheme';
import { useAutoUpdate } from './hooks/useAutoUpdate';

export default function App() {
  useTheme();
  useAutoUpdate();

  const [mode, setMode] = useState<WidgetMode>('expanded');
  const [widgetState, setWidgetState] = useState<WidgetState>({
    mode: 'expanded',
    pinned: true,
    opacity: 1.0,
    selected_provider: 'all',
    metric: 'tasks',
    snap_to_edges: true,
    polling_interval: 2,
  });

  const handleModeChange = async (newMode: WidgetMode) => {
    setMode(newMode);
    await setWidgetMode(newMode);
  };

  const handleTogglePin = async () => {
    const nextPinned = !widgetState.pinned;
    setWidgetState((prev) => ({ ...prev, pinned: nextPinned }));
    await setWidgetPinned(nextPinned);
  };

  const handleUpdateWidgetState = async (updates: Partial<WidgetState>) => {
    setWidgetState((prev) => ({ ...prev, ...updates }));
    if (updates.pinned !== undefined) {
      await setWidgetPinned(updates.pinned);
    }
    if (updates.opacity !== undefined) {
      await setWidgetOpacity(updates.opacity);
    }
  };

  return (
    <div
      className="w-full h-full flex items-center justify-center select-none"
      style={{ opacity: widgetState.opacity }}
      onMouseUp={() => {
        if (widgetState.snap_to_edges) {
          snapToEdges();
        }
      }}
    >
      {mode === 'expanded' && (
        <Expanded
          onSetMode={handleModeChange}
          onOpenSettings={() => handleModeChange('settings')}
          isPinned={widgetState.pinned}
          onTogglePin={handleTogglePin}
        />
      )}

      {mode === 'compact' && (
        <Compact
          onSetMode={handleModeChange}
          onOpenSettings={() => handleModeChange('settings')}
        />
      )}

      {mode === 'rail' && <Rail onSetMode={handleModeChange} />}

      {mode === 'settings' && (
        <Settings
          state={widgetState}
          onUpdateState={handleUpdateWidgetState}
          onClose={() => handleModeChange('expanded')}
          onRescan={() => {}}
        />
      )}
    </div>
  );
}
