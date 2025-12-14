/**
 * API para obtener información y features del tenant
 */
import apiClient from './client';

export interface TenantFeatures {
  has_memberships: boolean;
  has_classes: boolean;
  has_qr_scanner: boolean;
  has_routines: boolean;
  tenant_name?: string;
  tenant_id: number;
}

export const tenantAPI = {
  /**
   * Obtener features y configuración del tenant
   */
  getTenantFeatures: async (tenantId: number): Promise<TenantFeatures> => {
    try {
      const url = `/api/public/customer/tenant/${tenantId}/features`;
      const baseURL = apiClient.defaults.baseURL;
      const fullURL = `${baseURL}${url}`;
      console.log('[TenantAPI] URL completa:', fullURL);
      console.log('[TenantAPI] Base URL:', baseURL);
      console.log('[TenantAPI] Path:', url);
      
      const response = await apiClient.get(url);
      console.log('[TenantAPI] Response completa:', JSON.stringify(response.data, null, 2));
      
      // El backend retorna { ok: true, data: {...} }
      if (response.data?.ok && response.data?.data) {
        return response.data.data;
      }
      // Si no tiene la estructura esperada, retornar directamente
      return response.data;
    } catch (error: any) {
      const baseURL = apiClient.defaults.baseURL;
      const fullURL = `${baseURL}/api/public/customer/tenant/${tenantId}/features`;
      console.error('[TenantAPI] Error al obtener features:', error.message);
      console.error('[TenantAPI] Error response:', error.response?.data);
      console.error('[TenantAPI] Error status:', error.response?.status);
      console.error('[TenantAPI] URL completa intentada:', fullURL);
      console.error('[TenantAPI] Base URL configurada:', baseURL);
      console.error('[TenantAPI] Request config:', error.config?.url);
      throw error;
    }
  },

  /**
   * Obtener información básica del tenant
   */
  getTenantInfo: async (tenantId: number): Promise<any> => {
    const response = await apiClient.get(`/api/tenants/${tenantId}`);
    return response.data;
  },

  /**
   * Obtener información del tenant por código (ID o subdomain)
   */
  getTenantByCode: async (code: string): Promise<any> => {
    const response = await apiClient.get(`/api/public/customer/tenant/${code}`);
    if (response.data?.ok && response.data?.data) {
      return response.data.data;
    }
    return response.data;
  },
};

