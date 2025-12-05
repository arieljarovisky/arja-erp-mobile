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
    const response = await apiClient.get('/api/classes', {
      params: { tenant_id: tenantId },
    });
    return response.data;
  },

  /**
   * Obtener detalles de una serie de clases
   */
  getClassSeries: async (seriesId: number, tenantId: number): Promise<ClassSeries> => {
    const response = await apiClient.get(`/api/classes/${seriesId}`, {
      params: { tenant_id: tenantId },
    });
    return response.data;
  },

  /**
   * Obtener sesiones disponibles de una serie
   */
  getClassSessions: async (seriesId: number, tenantId: number): Promise<ClassSession[]> => {
    const response = await apiClient.get(`/api/classes/${seriesId}/sessions`, {
      params: { tenant_id: tenantId },
    });
    return response.data;
  },

  /**
   * Inscribirse a una clase (sesión)
   */
  enrollToClass: async (sessionId: number, customerId: number, tenantId: number): Promise<ClassEnrollment> => {
    const response = await apiClient.post(`/api/classes/sessions/${sessionId}/enroll`, {
      customer_id: customerId,
      tenant_id: tenantId,
    });
    return response.data;
  },

  /**
   * Ver mis inscripciones a clases
   */
  getMyEnrollments: async (phone: string, tenantId: number): Promise<ClassEnrollment[]> => {
    const response = await apiClient.get('/api/classes/enrollments', {
      params: {
        phone: phone.replace(/\D/g, ''),
        tenant_id: tenantId,
      },
    });
    return response.data;
  },

  /**
   * Cancelar inscripción a clase
   */
  cancelEnrollment: async (enrollmentId: number): Promise<void> => {
    await apiClient.delete(`/api/classes/enrollments/${enrollmentId}`);
  },
};

