/**
 * Cliente API para conectar con el backend
 */
import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// URL del backend - cambiar según el ambiente
// IMPORTANTE: En desarrollo móvil, usar la IP de tu máquina en la red local (no localhost)
// Para obtener tu IP local en Windows: ipconfig (buscar "IPv4 Address")
// Para obtener tu IP local en Mac/Linux: ifconfig o ip addr
// El backend corre en el puerto 4000 según los logs
// Si estás usando un emulador Android, puedes usar 'http://10.0.2.2:4000'
// Si estás usando un emulador iOS, puedes usar 'http://localhost:4000'
const API_BASE_URL = __DEV__
  ? 'https://backend-production-1042.up.railway.app' // Usando backend de producción
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
      
      // Log de la URL completa para debugging
      const fullURL = `${config.baseURL}${config.url}`;
      console.log(`[API Client] Request: ${config.method?.toUpperCase()} ${fullURL}`);
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

