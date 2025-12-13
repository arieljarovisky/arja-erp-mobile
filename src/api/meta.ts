/**
 * API para metadatos (servicios, instructores, etc.)
 */
import apiClient from './client';

export interface Service {
  id: number;
  name: string;
  duration_min: number;
  price_decimal: number;
  description?: string;
}

export interface Instructor {
  id: number;
  name: string;
  color_hex?: string;
  is_active: boolean;
}

export const metaAPI = {
  /**
   * Obtener servicios del tenant
   */
  getServices: async (tenantId: number): Promise<Service[]> => {
    const response = await apiClient.get('/api/meta/services', {
      params: {
        tenant_id: tenantId,
        active: 1,
      },
    });
    // El backend devuelve { ok: true, data: [...] }
    if (response.data?.ok && response.data?.data) {
      return response.data.data;
    }
    return Array.isArray(response.data) ? response.data : [];
  },

  /**
   * Obtener instructores del tenant
   */
  getInstructors: async (tenantId: number): Promise<Instructor[]> => {
    const response = await apiClient.get('/api/meta/instructors', {
      params: {
        tenant_id: tenantId,
        active: 1,
      },
    });
    // El backend devuelve { ok: true, data: [...] }
    if (response.data?.ok && response.data?.data) {
      return response.data.data;
    }
    return Array.isArray(response.data) ? response.data : [];
  },
};

