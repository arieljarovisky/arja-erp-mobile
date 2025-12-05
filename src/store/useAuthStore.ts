/**
 * Store de autenticación usando Zustand
 * Versión simplificada sin persist para evitar problemas con tipos
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, AuthData } from '../services/auth';

interface AuthState {
  isAuthenticated: boolean;
  customerId: number | null;
  tenantId: number | null;
  customerName: string | null;
  phone: string | null;
  
  // Actions
  setAuth: (data: AuthData) => void;
  clearAuth: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  customerId: null,
  tenantId: null,
  customerName: null,
  phone: null,

  setAuth: (data: AuthData) => {
    // Guardar en AsyncStorage manualmente
    AsyncStorage.setItem('customer_id', String(data.customerId || ''));
    AsyncStorage.setItem('tenant_id', String(data.tenantId || ''));
    if (data.customerName) {
      AsyncStorage.setItem('customer_name', data.customerName);
    }
    if (data.phone) {
      AsyncStorage.setItem('phone', data.phone);
    }
    AsyncStorage.setItem('is_authenticated', 'true');

    set({
      isAuthenticated: true,
      customerId: data.customerId,
      tenantId: data.tenantId,
      customerName: data.customerName || null,
      phone: data.phone || null,
    });
  },

  clearAuth: async () => {
    await authService.logout();
    await AsyncStorage.multiRemove(['customer_id', 'tenant_id', 'customer_name', 'phone', 'is_authenticated']);
    set({
      isAuthenticated: false,
      customerId: null,
      tenantId: null,
      customerName: null,
      phone: null,
    });
  },

  checkAuth: async () => {
    try {
      const [customerId, tenantId, customerName, phone, isAuth] = await AsyncStorage.multiGet([
        'customer_id',
        'tenant_id',
        'customer_name',
        'phone',
        'is_authenticated',
      ]);

      const isAuthenticated = isAuth[1] === 'true';
      const cId = customerId[1] ? parseInt(customerId[1], 10) : null;
      const tId = tenantId[1] ? parseInt(tenantId[1], 10) : null;

      if (isAuthenticated && cId && tId) {
        set({
          isAuthenticated: true,
          customerId: cId,
          tenantId: tId,
          customerName: customerName[1] || null,
          phone: phone[1] || null,
        });
      } else {
        set({
          isAuthenticated: false,
          customerId: null,
          tenantId: null,
          customerName: null,
          phone: null,
        });
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      set({
        isAuthenticated: false,
        customerId: null,
        tenantId: null,
        customerName: null,
        phone: null,
      });
    }
  },
}));
