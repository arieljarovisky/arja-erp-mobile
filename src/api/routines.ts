/**
 * API para gestión de rutinas del usuario
 */
import apiClient from './client';

export interface Routine {
  id: number;
  customer_id: number;
  name: string;
  description?: string;
  services: RoutineService[];
  frequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoutineService {
  id: number;
  service_id: number;
  service_name?: string;
  duration?: number;
  order: number;
}

export interface CreateRoutineData {
  customer_id: number;
  name: string;
  description?: string;
  services: Array<{
    service_id: number;
    order: number;
  }>;
  frequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  tenant_id: number;
}

export interface UpdateRoutineData {
  name?: string;
  description?: string;
  services?: Array<{
    service_id: number;
    order: number;
  }>;
  frequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  is_active?: boolean;
}

export const routinesAPI = {
  /**
   * Obtener rutinas del cliente
   */
  getMyRoutines: async (phone: string, tenantId: number): Promise<Routine[]> => {
    const response = await apiClient.get('/api/routines', {
      params: {
        phone: phone.replace(/\D/g, ''), // Solo números
        tenant_id: tenantId,
      },
    });
    return response.data;
  },

  /**
   * Obtener una rutina específica
   */
  getRoutine: async (id: number): Promise<Routine> => {
    const response = await apiClient.get(`/api/routines/${id}`);
    return response.data;
  },

  /**
   * Crear nueva rutina
   */
  createRoutine: async (data: CreateRoutineData): Promise<Routine> => {
    const response = await apiClient.post('/api/routines', data);
    return response.data;
  },

  /**
   * Actualizar rutina
   */
  updateRoutine: async (id: number, data: UpdateRoutineData): Promise<Routine> => {
    const response = await apiClient.patch(`/api/routines/${id}`, data);
    return response.data;
  },

  /**
   * Eliminar rutina
   */
  deleteRoutine: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/routines/${id}`);
  },

  /**
   * Activar/desactivar rutina
   */
  toggleRoutine: async (id: number, isActive: boolean): Promise<Routine> => {
    const response = await apiClient.patch(`/api/routines/${id}`, { is_active: isActive });
    return response.data;
  },
};

