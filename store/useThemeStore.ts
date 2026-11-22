import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { THEMES, DEFAULT_THEME } from '@/constants/theme';
import { ThemePalette } from '@/types';

interface ThemeState {
  theme: ThemePalette;
  themeId: string;
  currentThemeKey: string;
  setTheme: (themeId: string) => Promise<void>;
  loadSavedTheme: () => Promise<void>;
}

const STORAGE_KEY = 'streambuddy_active_theme';

export const useThemeStore = create<ThemeState>((set) => ({
  theme: DEFAULT_THEME,
  themeId: 'epic',
  currentThemeKey: 'epic',

  setTheme: async (themeId: string) => {
    const selected = THEMES[themeId] || DEFAULT_THEME;
    set({ theme: selected, themeId: selected.id, currentThemeKey: selected.id });

    if (Platform.OS !== 'web') {
      try {
        await SecureStore.setItemAsync(STORAGE_KEY, selected.id);
      } catch { }
    } else {
      try {
        localStorage.setItem(STORAGE_KEY, selected.id);
      } catch { }
    }
  },

  loadSavedTheme: async () => {
    try {
      let savedId: string | null = null;
      if (Platform.OS !== 'web') {
        savedId = await SecureStore.getItemAsync(STORAGE_KEY);
      } else {
        savedId = localStorage.getItem(STORAGE_KEY);
      }
      if (savedId && THEMES[savedId]) {
        set({ theme: THEMES[savedId], themeId: savedId, currentThemeKey: savedId });
      }
    } catch { }
  },
}));
