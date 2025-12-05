/**
 * API para gestión de turnos
 */
import apiClient from './client';

export interface Appointment {
  id: number;
  customer_id: number;
  service_id: number;
  instructor_id: number;
  starts_at: string;
  ends_at: string;
  status: string;
  service_name?: string;
  instructor_name?: string;
  customer_name?: string;
}

export interface CreateAppointmentData {
  customer_id: number;
  service_id: number;
  instructor_id: number;
  starts_at: string;
  tenant_id: number;
  branch_id?: number;
}

export const appointmentsAPI = {
  /**
   * Obtener turnos del cliente
   */
  getMyAppointments: async (phone: string, tenantId: number): Promise<Appointment[]> => {
    const response = await apiClient.get('/api/appointments', {
      params: {
        phone: phone.replace(/\D/g, ''), // Solo números
        tenant_id: tenantId,
      },
    });
    return response.data;
  },

  /**
   * Crear nuevo turno
   */
  createAppointment: async (data: CreateAppointmentData): Promise<Appointment> => {
    const response = await apiClient.post('/api/appointments', data);
    return response.data;
  },

  /**
   * Actualizar turno
   */
  updateAppointment: async (id: number, data: Partial<CreateAppointmentData>): Promise<Appointment> => {
    const response = await apiClient.patch(`/api/appointments/${id}`, data);
    return response.data;
  },

  /**
   * Cancelar turno
   */
  cancelAppointment: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/appointments/${id}`);
  },

  /**
   * Obtener disponibilidad de horarios
   */
  getAvailability: async (
    tenantId: number,
    serviceId: number,
    instructorId: number,
    date: string
  ): Promise<any> => {
    const response = await apiClient.get('/api/availability', {
      params: {
        tenant_id: tenantId,
        service_id: serviceId,
        instructor_id: instructorId,
        date,
      },
    });
    return response.data;
  },
};

