/**
 * Theme Management Service
 * Controls Light, Dark, and System theme modes and updates CSS root variables.
 */
import { useState, useEffect } from 'react';
import { syncStatusBar } from '../services/mobileAppService';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  border: string;
  input: string;
  muted: string;
  mutedForeground: string;
  darkText: string;
  mutedText: string;
  borderSubtle: string;
  cardWhite: string;
  softWhite: string;
  appBg: string;
  appText: string;
}

export const LIGHT_THEME_VARIABLES: ThemeColors = {
  background: '#F9FAFB',
  foreground: '#111827',
  card: '#FFFFFF',
  cardForeground: '#111827',
  popover: '#FFFFFF',
  popoverForeground: '#111827',
  border: '#E5E7EB',
  input: '#E5E7EB',
  muted: '#F3F4F6',
  mutedForeground: '#6B7280',
  darkText: '#111827',
  mutedText: '#6B7280',
  borderSubtle: '#E5E7EB',
  cardWhite: '#FFFFFF',
  softWhite: '#F9FAFB',
  appBg: '#F9FAFB',
  appText: '#111827'
};

export const DARK_THEME_VARIABLES: ThemeColors = {
  background: '#121316',
  foreground: '#F5F5F4',
  card: '#1C1917',
  cardForeground: '#F5F5F4',
  popover: '#1C1917',
  popoverForeground: '#F5F5F4',
  border: 'rgba(255, 255, 255, 0.1)',
  input: 'rgba(255, 255, 255, 0.12)',
  muted: '#292524',
  mutedForeground: '#A8A29E',
  darkText: '#F5F5F4',
  mutedText: '#A8A29E',
  borderSubtle: '#292524',
  cardWhite: '#1C1917',
  softWhite: '#121316',
  appBg: '#121316',
  appText: '#F5F5F4'
};

const THEME_STORAGE_KEY = 'cecilian_theme_mode';

export function getStoredTheme(): ThemeMode {
  try {
    const val = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
    if (val === 'light' || val === 'dark' || val === 'system') {
      return val;
    }
  } catch {
    // ignore
  }
  return 'light';
}

export function isDarkModeActive(mode: ThemeMode): boolean {
  if (mode === 'dark') return true;
  if (mode === 'light') return false;
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function applyTheme(mode: ThemeMode) {
  const isDark = isDarkModeActive(mode);
  const root = document.documentElement;

  // 1. Toggle Tailwind dark class
  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  // 2. Select variables
  const vars = isDark ? DARK_THEME_VARIABLES : LIGHT_THEME_VARIABLES;

  // 3. Update CSS root variables
  root.style.setProperty('--background', vars.background);
  root.style.setProperty('--foreground', vars.foreground);
  root.style.setProperty('--card', vars.card);
  root.style.setProperty('--card-foreground', vars.cardForeground);
  root.style.setProperty('--popover', vars.popover);
  root.style.setProperty('--popover-foreground', vars.popoverForeground);
  root.style.setProperty('--border', vars.border);
  root.style.setProperty('--input', vars.input);
  root.style.setProperty('--muted', vars.muted);
  root.style.setProperty('--muted-foreground', vars.mutedForeground);
  root.style.setProperty('--color-dark-text', vars.darkText);
  root.style.setProperty('--color-muted-text', vars.mutedText);
  root.style.setProperty('--color-border-subtle', vars.borderSubtle);
  root.style.setProperty('--color-card-white', vars.cardWhite);
  root.style.setProperty('--color-soft-white', vars.softWhite);
  root.style.setProperty('--bg-app', vars.appBg);
  root.style.setProperty('--text-app', vars.appText);

  // 4. Update body background and color directly for immediate repaint
  document.body.style.backgroundColor = vars.appBg;
  document.body.style.color = vars.appText;

  // 5. Store in localStorage
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    // ignore
  }

  // 6. Dispatch custom event for immediate reactive re-renders
  window.dispatchEvent(new CustomEvent('cecilian:theme-change', { detail: { mode, isDark } }));

  // 7. Sync native Capacitor mobile status bar
  try {
    syncStatusBar(isDark).catch(() => {});
  } catch {
    // ignore in environments where capacitor is not initialized
  }
}

// Auto-initialize theme on import / script evaluation
if (typeof window !== 'undefined') {
  const initialMode = getStoredTheme();
  applyTheme(initialMode);

  // Listen to system preference changes if in 'system' mode
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (getStoredTheme() === 'system') {
      applyTheme('system');
    }
  });
}

/**
 * Universal React Hook for Theme state and reactive toggling
 */
export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>(() => getStoredTheme());
  const [isDark, setIsDark] = useState<boolean>(() => isDarkModeActive(getStoredTheme()));

  useEffect(() => {
    const handleThemeChange = (e: any) => {
      if (e.detail?.mode) {
        setTheme(e.detail.mode);
        setIsDark(e.detail.isDark ?? isDarkModeActive(e.detail.mode));
      }
    };
    window.addEventListener('cecilian:theme-change', handleThemeChange);
    return () => window.removeEventListener('cecilian:theme-change', handleThemeChange);
  }, []);

  const toggleTheme = () => {
    const nextMode: ThemeMode = isDark ? 'light' : 'dark';
    applyTheme(nextMode);
    setTheme(nextMode);
    setIsDark(!isDark);
  };

  const setThemeMode = (mode: ThemeMode) => {
    applyTheme(mode);
    setTheme(mode);
    setIsDark(isDarkModeActive(mode));
  };

  return { theme, isDark, toggleTheme, setThemeMode };
}

