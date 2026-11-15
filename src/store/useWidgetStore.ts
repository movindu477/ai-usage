import { create } from 'zustand';
import { ActiveWidgetTab } from '../lib/types';

interface WidgetStoreState {
  activeTab: ActiveWidgetTab;
  setActiveTab: (tab: ActiveWidgetTab) => void;
  tempUnit: 'fahrenheit' | 'celsius';
  toggleTempUnit: () => void;
}

export const useWidgetStore = create<WidgetStoreState>((set) => ({
  activeTab: 'system',
  setActiveTab: (tab) => set({ activeTab: tab }),
  tempUnit:
    (localStorage.getItem('ai_weather_unit') as 'fahrenheit' | 'celsius') ||
    'fahrenheit',
  toggleTempUnit: () =>
    set((state) => {
      const next = state.tempUnit === 'fahrenheit' ? 'celsius' : 'fahrenheit';
      localStorage.setItem('ai_weather_unit', next);
      return { tempUnit: next };
    }),
}));
