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
  deposit_decimal?: number;
  deposit_paid_at?: string;
  created_at?: string;
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
  getMyAppointments: async (customerId: number, tenantId: number): Promise<Appointment[]> => {
    const response = await apiClient.get('/api/public/customer/appointments', {
      params: {
        customer_id: customerId,
        tenant_id: tenantId,
      },
    });
    return response.data;
  },

  /**
   * Crear nuevo turno
   */
  createAppointment: async (data: CreateAppointmentData): Promise<{ ok: boolean; data: Appointment; requiresDeposit: boolean }> => {
    const response = await apiClient.post('/api/public/customer/appointments', data);
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
  cancelAppointment: async (id: number, tenantId: number, customerId: number): Promise<void> => {
    await apiClient.delete(`/api/public/customer/appointments/${id}`, {
      params: {
        tenant_id: tenantId,
        customer_id: customerId,
      },
    });
  },

  /**
   * Obtener disponibilidad de horarios
   */
  getAvailability: async (
    tenantId: number,
    serviceId: number,
    instructorId: number,
    date: string
  ): Promise<{ ok: boolean; data: { slots: string[]; busySlots: string[] } }> => {
    const response = await apiClient.get('/api/public/customer/appointments/availability', {
      params: {
        tenant_id: tenantId,
        service_id: serviceId,
        instructor_id: instructorId,
        date,
      },
    });
    return response.data;
  },

  /**
   * Generar link de pago de seña
   */
  getDepositPaymentLink: async (
    appointmentId: number,
    tenantId: number,
    customerId: number
  ): Promise<{ ok: boolean; paymentLink: string }> => {
    const response = await apiClient.post(
      `/api/public/customer/appointments/${appointmentId}/deposit-payment-link`,
      {
        tenant_id: tenantId,
        customer_id: customerId,
      }
    );
    return response.data;
  },
};

