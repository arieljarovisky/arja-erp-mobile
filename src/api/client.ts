/**
 * Cliente API para conectar con el backend
 */
import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// URL del backend - cambiar según el ambiente
const API_BASE_URL = __DEV__
  ? 'http://localhost:3000' // Desarrollo local
  : 'https://backend-production-1042.up.railway.app'; // Producción

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 segundos
});

// Interceptor para agregar token de autenticación automáticamente
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Agregar tenant_id si está disponible
      const tenantId = await AsyncStorage.getItem('tenant_id');
      if (tenantId && config.params) {
        config.params.tenant_id = tenantId;
      }
    } catch (error) {
      console.error('[API Client] Error obteniendo token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores globalmente
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // Si el token expiró o no es válido, limpiar sesión
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('customer_id');
      await AsyncStorage.removeItem('tenant_id');
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;

