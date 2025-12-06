/**
 * Constantes de la aplicación
 */

// URL del backend
export const API_BASE_URL = __DEV__
  ? 'https://backend-production-1042.up.railway.app' // Usando backend de producción
  : 'https://backend-production-1042.up.railway.app'; // Producción

// Colores de la app
export const COLORS = {
  primary: '#007AFF',
  secondary: '#34C759',
  danger: '#FF3B30',
  warning: '#FF9500',
  info: '#5AC8FA',
  success: '#34C759',
  text: '#000000',
  textSecondary: '#666666',
  background: '#F5F5F5',
  white: '#FFFFFF',
  border: '#E0E0E0',
};

// Tamaños de fuente
export const FONT_SIZES = {
  small: 12,
  medium: 14,
  large: 16,
  xlarge: 18,
  xxlarge: 24,
  title: 28,
};

// Espaciado
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

// Timeouts
export const TIMEOUTS = {
  api: 10000, // 10 segundos
  debounce: 300, // 300ms
};

