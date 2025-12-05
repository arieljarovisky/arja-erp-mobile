/**
 * Servicio de autenticación con Google OAuth
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import apiClient from '../api/client';

WebBrowser.maybeCompleteAuthSession();

export interface AuthData {
  accessToken: string;
  refreshToken?: string;
  user: {
    id: number;
    email: string;
    name?: string;
    tenantId: number;
  };
}

export const authService = {
  /**
   * Iniciar login con Google OAuth
   */
  loginWithGoogle: async (): Promise<AuthData | null> => {
    try {
      // Obtener URL de autorización del backend
      const response = await fetch('https://backend-production-1042.up.railway.app/auth/google');
      const data = await response.json();

      if (!data.ok || !data.authUrl) {
        throw new Error('No se pudo obtener la URL de autorización');
      }

      // Crear redirect URI para Expo
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'pelu-turnos',
        path: 'auth',
      });

      // Iniciar sesión de autenticación
      const result = await AuthSession.startAsync({
        authUrl: data.authUrl,
        returnUrl: redirectUri,
      });

      if (result.type === 'success') {
        // El callback será manejado por el backend
        // Necesitamos extraer los tokens de la respuesta
        // Por ahora, retornamos null para indicar que necesita implementación
        return null;
      }

      return null;
    } catch (error: any) {
      console.error('[Auth Service] Error en login con Google:', error);
      throw new Error(error.message || 'Error al iniciar sesión con Google');
    }
  },

  /**
   * Guardar tokens de autenticación
   */
  saveTokens: async (authData: AuthData): Promise<void> => {
    await AsyncStorage.setItem('access_token', authData.accessToken);
    if (authData.refreshToken) {
      await AsyncStorage.setItem('refresh_token', authData.refreshToken);
    }
    await AsyncStorage.setItem('user_data', JSON.stringify(authData.user));
  },

  /**
   * Obtener datos de autenticación guardados
   */
  getAuthData: async (): Promise<AuthData | null> => {
    try {
      const accessToken = await AsyncStorage.getItem('access_token');
      const userDataStr = await AsyncStorage.getItem('user_data');

      if (!accessToken || !userDataStr) {
        return null;
      }

      const user = JSON.parse(userDataStr);
      const refreshToken = await AsyncStorage.getItem('refresh_token') || undefined;

      return {
        accessToken,
        refreshToken,
        user,
      };
    } catch (error) {
      console.error('[Auth Service] Error obteniendo datos de auth:', error);
      return null;
    }
  },

  /**
   * Logout - limpiar sesión
   */
  logout: async (): Promise<void> => {
    await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user_data']);
  },
};

