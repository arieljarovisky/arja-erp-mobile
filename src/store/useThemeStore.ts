/**
 * Store global para el tema (modo oscuro)
 * Usa Zustand para compartir el estado del tema en toda la aplicación
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme, Appearance } from 'react-native';
import { useEffect } from 'react';

interface ThemeState {
  isDark: boolean;
  themeLoaded: boolean;
  loadTheme: () => Promise<void>;
  toggleTheme: (dark: boolean) => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  isDark: false,
  themeLoaded: false,

  loadTheme: async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('app_theme');
      if (savedTheme === 'dark') {
        set({ isDark: true, themeLoaded: true });
      } else if (savedTheme === 'light') {
        set({ isDark: false, themeLoaded: true });
      } else {
        // Por defecto usar el tema del sistema
        const systemTheme = Appearance.getColorScheme();
        const systemIsDark = systemTheme === 'dark';
        set({ isDark: systemIsDark, themeLoaded: true });
      }
    } catch (error) {
      console.error('[ThemeStore] Error loading theme:', error);
      set({ isDark: false, themeLoaded: true });
    }
  },

  toggleTheme: async (dark: boolean) => {
    set({ isDark: dark });
    try {
      await AsyncStorage.setItem('app_theme', dark ? 'dark' : 'light');
      console.log('[ThemeStore] Tema guardado:', dark ? 'dark' : 'light');
    } catch (error) {
      console.error('[ThemeStore] Error saving theme:', error);
    }
  },
}));

/**
 * Hook para usar el tema en componentes
 * Reemplaza el hook anterior useAppTheme
 */
export function useAppTheme() {
  const { isDark, themeLoaded, loadTheme, toggleTheme } = useThemeStore();
  const systemTheme = useColorScheme();

  // Cargar tema al montar si no está cargado
  useEffect(() => {
    if (!themeLoaded) {
      loadTheme();
    }
  }, [themeLoaded, loadTheme]);

  return {
    isDark: Boolean(isDark),
    themeLoaded,
    toggleTheme,
  };
}

