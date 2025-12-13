/**
 * Store para configuración de app por cliente (branding, precios, horarios, notifs)
 */
import { create } from 'zustand';
import { appSettingsAPI, AppSettings, AppTheme } from '../api/appSettings';

export type ThemeColors = {
  primary: string;
  secondary: string;
  text: string;
  background: string;
  logoUrl: string | null;
};

interface AppSettingsState {
  settings: AppSettings | null;
  themeColors: ThemeColors;
  isLoading: boolean;
  error: string | null;
  fetchSettings: () => Promise<void>;
  setTheme: (theme: AppTheme | null) => void;
}

const DEFAULT_PRIMARY = '#13b5cf';
const DEFAULT_FEATURES = {
  routines: false,
  classes: false,
  qr: false,
  notifications: false,
};
const DEFAULT_FEATURES_OBJ = Object.freeze({ ...DEFAULT_FEATURES });
const DEFAULT_THEME_COLORS: ThemeColors = Object.freeze({
  primary: DEFAULT_PRIMARY,
  secondary: '#0d7fd4',
  text: '#0f172a',
  background: '#f5f9fc',
  logoUrl: null,
});

function buildThemeColors(settings: AppSettings | null | undefined): ThemeColors {
  return {
    primary: settings?.theme?.primary || DEFAULT_THEME_COLORS.primary,
    secondary: settings?.theme?.secondary || DEFAULT_THEME_COLORS.secondary,
    text: settings?.theme?.text || DEFAULT_THEME_COLORS.text,
    background: settings?.theme?.background || DEFAULT_THEME_COLORS.background,
    logoUrl: settings?.logoUrl || null,
  };
}

export const useAppSettingsStore = create<AppSettingsState>((set, get) => ({
  settings: null,
  themeColors: DEFAULT_THEME_COLORS,
  isLoading: false,
  error: null,

  fetchSettings: async () => {
    if (get().isLoading) return;
    set({ isLoading: true, error: null });
    try {
      const data = await appSettingsAPI.getMySettings();
      // Asegurar defaults para que no se desactiven módulos si no vienen definidos
      const normalized: AppSettings = {
        ...data,
        notifications: {
          push: data?.notifications?.push ?? true,
          inApp: data?.notifications?.inApp ?? true,
          features: {
            // Usar los valores del backend, o false si no vienen definidos
            routines: data?.notifications?.features?.routines ?? false,
            classes: data?.notifications?.features?.classes ?? false,
            qr: data?.notifications?.features?.qr ?? false,
            notifications: data?.notifications?.features?.notifications ?? false,
          },
        },
      };
      console.log('[AppSettingsStore] settings cargados:', normalized.notifications);
      set({
        settings: normalized,
        themeColors: buildThemeColors(normalized),
        isLoading: false,
      });
    } catch (error: any) {
      console.error('[AppSettingsStore] Error obteniendo settings:', error?.message || error);
      set({ error: 'No se pudieron cargar las configuraciones', isLoading: false });
    }
  },

  setTheme: (theme: AppTheme | null) => {
    const current = get().settings || null;
    set({
      settings: {
        theme,
        pricing: current?.pricing ?? null,
        schedule: current?.schedule ?? null,
        notifications: current?.notifications ?? null,
        logoUrl: current?.logoUrl ?? null,
        pushToken: current?.pushToken ?? null,
      },
      themeColors: buildThemeColors({
        ...current,
        theme,
      } as AppSettings),
    });
  },
}));

export const selectPrimaryColor = (state: AppSettingsState) =>
  state.settings?.theme?.primary || DEFAULT_PRIMARY;

export const selectFeatureFlags = (state: AppSettingsState) => {
  return state.settings?.notifications?.features || DEFAULT_FEATURES_OBJ;
};

export const selectThemeColors = (state: AppSettingsState) => state.themeColors || DEFAULT_THEME_COLORS;

