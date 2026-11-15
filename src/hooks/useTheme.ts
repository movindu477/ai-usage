import { useEffect, useState } from 'react';
import { getSetting, setSetting } from '../lib/ipc';

export type Theme = 'dark' | 'light' | 'system';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('dark');

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    if (newTheme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', isDark ? 'dark' : 'light');
    } else {
      root.setAttribute('data-theme', newTheme);
    }
  };

  useEffect(() => {
    async function loadTheme() {
      try {
        const saved = await getSetting('theme');
        if (saved && (saved === 'dark' || saved === 'light' || saved === 'system')) {
          applyTheme(saved as Theme);
          setThemeState(saved as Theme);
        } else {
          applyTheme('dark');
        }
      } catch (e) {
        console.warn('Failed to load theme:', e);
      }
    }
    loadTheme();
  }, []);

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    try {
      await setSetting('theme', newTheme);
    } catch (e) {
      console.warn('Failed to save theme:', e);
    }
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') applyTheme('system');
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return { theme, setTheme };
}
