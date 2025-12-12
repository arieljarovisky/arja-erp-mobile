/**
 * API para gestión de clases
 */
import apiClient from './client';

export interface ClassSession {
  id: number;
  class_series_id: number;
  starts_at: string;
  ends_at: string;
  instructor_id: number;
  instructor_name?: string;
  series_name?: string;
  max_capacity?: number;
  current_enrollments?: number;
}

export interface ClassSeries {
  id: number;
  name: string;
  description?: string;
  instructor_id: number;
  instructor_name?: string;
  first_session_date?: string;
  sessions?: ClassSession[];
}

export interface ClassEnrollment {
  id: number;
  class_session_id: number;
  customer_id: number;
  enrolled_at: string;
  session?: ClassSession;
}

export const classesAPI = {
  /**
   * Listar clases disponibles (series)
   */
  getClasses: async (tenantId: number): Promise<ClassSeries[]> => {
    const response = await apiClient.get('/api/public/customer/classes', {
      params: { tenant_id: tenantId },
    });
    return response.data;
  },

  /**
   * Obtener detalles de una serie de clases
   */
  getClassSeries: async (seriesId: number, tenantId: number): Promise<ClassSeries> => {
    // Para obtener detalles de una serie, usamos las sesiones
    const sessions = await classesAPI.getClassSessions(seriesId, tenantId);
    if (sessions.length === 0) {
      throw new Error('Serie de clases no encontrada');
    }
    return {
      id: seriesId,
      name: sessions[0].series_name || 'Clase',
      instructor_id: sessions[0].instructor_id,
      instructor_name: sessions[0].instructor_name,
      sessions,
    };
  },

  /**
   * Obtener sesiones disponibles de una serie
   */
  getClassSessions: async (seriesId: number, tenantId: number): Promise<ClassSession[]> => {
    const response = await apiClient.get(`/api/public/customer/classes/${seriesId}/sessions`, {
      params: { tenant_id: tenantId },
    });
    return response.data;
  },

  /**
   * Inscribirse a una clase (sesión)
   */
  enrollToClass: async (sessionId: number, customerId: number, tenantId: number): Promise<ClassEnrollment> => {
    const response = await apiClient.post(`/api/public/customer/classes/sessions/${sessionId}/enroll`, {
      customer_id: customerId,
      tenant_id: tenantId,
    });
    return response.data;
  },

  /**
   * Ver mis inscripciones a clases
   */
  getMyEnrollments: async (tenantId: number, opts: { phone?: string; customerId?: number } = {}): Promise<ClassEnrollment[]> => {
    const response = await apiClient.get('/api/public/customer/classes/enrollments', {
      params: {
        tenant_id: tenantId,
        ...(opts.phone ? { phone: opts.phone.replace(/\D/g, '') } : {}),
        ...(opts.customerId ? { customer_id: opts.customerId } : {}),
      },
    });
    return response.data;
  },

  /**
   * Cancelar inscripción a clase
   */
  cancelEnrollment: async (enrollmentId: number, tenantId: number): Promise<void> => {
    await apiClient.delete(`/api/public/customer/classes/enrollments/${enrollmentId}`, {
      params: { tenant_id: tenantId },
    });
  },
};

