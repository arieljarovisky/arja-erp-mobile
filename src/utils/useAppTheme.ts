/**
 * Hook para manejar tema (modo oscuro desde configuraciones)
 */
import { useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useAppTheme() {
  const systemTheme = useColorScheme();
  const [isDark, setIsDark] = useState(false);
  const [themeLoaded, setThemeLoaded] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('app_theme');
        if (savedTheme === 'dark') {
          setIsDark(true);
        } else if (savedTheme === 'light') {
          setIsDark(false);
        } else {
          // Por defecto usar el tema del sistema
          setIsDark(systemTheme === 'dark');
        }
      } catch (error) {
        console.error('Error loading theme:', error);
        setIsDark(systemTheme === 'dark');
      } finally {
        setThemeLoaded(true);
      }
    };
    loadTheme();
  }, [systemTheme]);

  const toggleTheme = async (dark: boolean) => {
    setIsDark(dark);
    try {
      await AsyncStorage.setItem('app_theme', dark ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  // Asegurar que isDark sea siempre un boolean explícito
  return { isDark: Boolean(isDark), themeLoaded, toggleTheme };
}

