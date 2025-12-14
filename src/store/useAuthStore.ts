/**
 * Store de autenticación usando Zustand
 * Versión simplificada sin persist para evitar problemas con tipos
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/auth';

// Tipo adaptado para el store
export interface StoreAuthData {
  customerId: number;
  tenantId?: number | null; // Opcional para permitir usuarios autenticados sin tenant
  customerName?: string | null;
  phone?: string | null;
  email?: string | null;
  picture?: string | null;
}

interface AuthState {
  isAuthenticated: boolean;
  customerId: number | null;
  tenantId: number | null;
  customerName: string | null;
  phone: string | null;
  email: string | null;
  picture: string | null;
  
  // Actions
  setAuth: (data: StoreAuthData) => void;
  setTenantId: (tenantId: number) => void;
  clearAuth: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // CRÍTICO: Siempre inicializar con boolean explícito, nunca undefined
  isAuthenticated: Boolean(false),
  customerId: null,
  tenantId: null,
  customerName: null,
  phone: null,
  email: null,
  picture: null,

  setAuth: (data: StoreAuthData) => {
    console.log('[AuthStore] ═══════════════════════════════════════');
    console.log('[AuthStore] setAuth llamado con:', { 
      customerId: data.customerId, 
      tenantId: data.tenantId,
      email: data.email,
      customerName: data.customerName
    });
    // Guardar en AsyncStorage manualmente
    AsyncStorage.setItem('customer_id', String(data.customerId || ''));
    if (data.tenantId) {
      AsyncStorage.setItem('tenant_id', String(data.tenantId));
    } else {
      AsyncStorage.removeItem('tenant_id');
    }
    if (data.customerName) {
      AsyncStorage.setItem('customer_name', data.customerName);
    }
    if (data.phone) {
      AsyncStorage.setItem('phone', data.phone);
    }
    if (data.email) {
      AsyncStorage.setItem('email', data.email);
    }
    if (data.picture) {
      AsyncStorage.setItem('picture', data.picture);
    }
    AsyncStorage.setItem('is_authenticated', 'true');

    set({
      isAuthenticated: Boolean(true),
      customerId: data.customerId,
      tenantId: data.tenantId || null,
      customerName: data.customerName || null,
      phone: data.phone || null,
      email: data.email || null,
      picture: data.picture || null,
    });
    console.log('[AuthStore] Estado actualizado en store');
    console.log('[AuthStore] isAuthenticated: true');
    console.log('[AuthStore] customerId:', data.customerId);
    console.log('[AuthStore] tenantId:', data.tenantId || 'null');
    console.log('[AuthStore] email:', data.email || 'null');
    console.log('[AuthStore] ═══════════════════════════════════════');
  },

  setTenantId: (tenantId: number) => {
    console.log('[AuthStore] setTenantId llamado con:', tenantId);
    AsyncStorage.setItem('tenant_id', String(tenantId));
    set({ tenantId });
  },

  clearAuth: async () => {
    await authService.logout();
    await AsyncStorage.multiRemove(['customer_id', 'tenant_id', 'customer_name', 'phone', 'email', 'picture', 'is_authenticated']);
    set({
      isAuthenticated: Boolean(false),
      customerId: null,
      tenantId: null,
      customerName: null,
      phone: null,
      email: null,
      picture: null,
    });
  },

  checkAuth: async () => {
    try {
      const [customerId, tenantId, customerName, phone, email, picture, isAuth] = await AsyncStorage.multiGet([
        'customer_id',
        'tenant_id',
        'customer_name',
        'phone',
        'email',
        'picture',
        'is_authenticated',
      ]);

      // Asegurar que isAuthenticated sea siempre un boolean real, no un string
      const isAuthenticated = Boolean(isAuth[1] === 'true');
      const cId = customerId[1] ? parseInt(customerId[1], 10) : null;
      const tId = tenantId[1] ? parseInt(tenantId[1], 10) : null;

      // Permitir autenticación con customerId pero sin tenantId (usuario nuevo)
      // customerId puede ser 0 para usuarios pendientes de selección de tenant
      if (isAuthenticated && (cId !== null || email[1])) {
        // Si hay email pero no customerId, es un usuario pendiente
        const finalCustomerId = cId !== null ? cId : 0;
        set({
          isAuthenticated: Boolean(true),
          customerId: finalCustomerId,
          tenantId: tId,
          customerName: customerName[1] || null,
          phone: phone[1] || null,
          email: email[1] || null,
          picture: picture[1] || null,
        });
      } else {
        set({
          isAuthenticated: Boolean(false),
          customerId: null,
          tenantId: null,
          customerName: null,
          phone: null,
          email: null,
          picture: null,
        });
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      set({
        isAuthenticated: Boolean(false),
        customerId: null,
        tenantId: null,
        customerName: null,
        phone: null,
        email: null,
        picture: null,
      });
    }
  },
}));
