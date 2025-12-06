/**
 * Store para manejar las features y configuración del tenant
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tenantAPI, TenantFeatures } from '../api/tenant';
import { useAuthStore } from './useAuthStore';

interface TenantState {
  features: TenantFeatures | null;
  isLoading: boolean;
  tenantNotFound: boolean; // Indica si el tenant no fue encontrado
  loadFeatures: (tenantId: number) => Promise<void>;
  clearFeatures: () => void;
  hasFeature: (feature: keyof TenantFeatures) => boolean;
  setTenantNotFound: (value: boolean) => void;
}

export const useTenantStore = create<TenantState>((set, get) => ({
  features: null,
  isLoading: false,
  tenantNotFound: false,

  loadFeatures: async (tenantId: number) => {
    set({ isLoading: true, tenantNotFound: false }); // Limpiar estado de error al intentar cargar
    try {
      console.log(`[TenantStore] Cargando features para tenant ${tenantId}`);
      const features = await tenantAPI.getTenantFeatures(tenantId);
      console.log(`[TenantStore] Features cargadas:`, features);
      set({ features, tenantNotFound: false }); // Asegurar que se limpie el estado de error
      // Guardar en AsyncStorage para acceso rápido
      await AsyncStorage.setItem('tenant_features', JSON.stringify(features));
    } catch (error: any) {
      console.error(`[TenantStore] Error al cargar features:`, error.message);
      console.error(`[TenantStore] Error completo:`, error);
      if (error.response) {
        console.error(`[TenantStore] Status:`, error.response.status);
        console.error(`[TenantStore] Data:`, error.response.data);
      }
      
      // Si hay error, intentar cargar desde cache
      try {
        const cached = await AsyncStorage.getItem('tenant_features');
        if (cached) {
          const cachedFeatures = JSON.parse(cached);
          // Solo usar cache si es del mismo tenant
          if (cachedFeatures.tenant_id === tenantId) {
            console.log('[TenantStore] Usando features en cache del tenant');
            set({ features: cachedFeatures });
            return; // Salir temprano si usamos cache
          }
        }
        
        // Si no hay cache válido, determinar si es error de red o del servidor
        if (!error.response || error.response.status >= 500) {
          // Error de red o servidor caído - asumir habilitadas para no bloquear
          console.log('[TenantStore] Error de red/servidor - asumiendo features habilitadas para permitir acceso');
          set({
            features: {
              has_memberships: true,
              has_classes: true,
              has_qr_scanner: true,
              has_routines: true,
              tenant_id: tenantId,
            },
          });
        } else if (error.response.status === 404) {
          // Tenant no encontrado - marcar como no encontrado para mostrar pantalla de error
          console.log('[TenantStore] Tenant no encontrado - marcando estado para mostrar pantalla de error');
          set({ 
            features: null,
            tenantNotFound: true,
          });
          await AsyncStorage.removeItem('tenant_features');
          return; // Salir sin establecer features
        } else {
          // Otro error del servidor (400, 403, etc.) - usar defaults conservadores
          console.log('[TenantStore] Error del servidor al cargar features - usando defaults conservadores');
          set({
            features: {
              has_memberships: false,
              has_classes: false,
              has_qr_scanner: false,
              has_routines: false,
              tenant_id: tenantId,
            },
          });
        }
      } catch (cacheError) {
        console.error('[TenantStore] Error al leer cache:', cacheError);
        // Si todo falla, asumir habilitadas para no bloquear la app
        set({
          features: {
            has_memberships: true,
            has_classes: true,
            has_qr_scanner: true,
            has_routines: true,
            tenant_id: tenantId,
          },
        });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  clearFeatures: () => {
    set({ features: null, tenantNotFound: false });
    AsyncStorage.removeItem('tenant_features');
  },

  setTenantNotFound: (value: boolean) => {
    set({ tenantNotFound: value });
  },

  hasFeature: (feature: keyof TenantFeatures): boolean => {
    const { features } = get();
    if (!features) return false;
    
    // Excluir campos que no son features booleanas
    if (feature === 'tenant_name' || feature === 'tenant_id') {
      return false;
    }
    
    return Boolean(features[feature]);
  },
}));

