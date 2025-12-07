/**
 * API para gestión de membresías
 */
import apiClient from './client';

export interface MembershipPlan {
  id: number;
  name: string;
  description?: string;
  price: number;
  currency: string;
  frequency: number; // meses
  features?: string[];
  is_active: boolean;
}

export interface MembershipSubscription {
  id: number;
  customer_id: number;
  membership_plan_id: number;
  status: string;
  next_charge_at?: string;
  last_payment_at?: string;
  amount_decimal: number;
  currency: string;
  plan?: MembershipPlan;
  mp_init_point?: string; // Link de pago de Mercado Pago
}

export const membershipsAPI = {
  /**
   * Listar planes de membresía disponibles
   */
  getPlans: async (tenantId: number): Promise<MembershipPlan[]> => {
    const response = await apiClient.get('/api/memberships/plans', {
      params: { tenant_id: tenantId },
    });
    // El backend devuelve { ok: true, data: [...] }
    if (response.data?.ok && response.data?.data) {
      // Transformar los datos del backend al formato esperado por el frontend
      return response.data.data.map((plan: any) => ({
        id: plan.id,
        name: plan.name,
        description: plan.description || '',
        price: plan.price_decimal || 0,
        currency: 'ARS',
        frequency: plan.duration_months || 1,
        features: plan.features ? (typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features) : [],
        is_active: plan.is_active === 1 || plan.is_active === true,
      }));
    }
    return response.data?.data || [];
  },

  /**
   * Obtener detalles de un plan
   */
  getPlan: async (planId: number, tenantId: number): Promise<MembershipPlan> => {
    const response = await apiClient.get(`/api/memberships/plans/${planId}`, {
      params: { tenant_id: tenantId },
    });
    return response.data;
  },

  /**
   * Suscribirse a un plan de membresía
   */
  subscribeToPlan: async (
    planId: number,
    customerId: number,
    email: string,
    tenantId: number
  ): Promise<MembershipSubscription> => {
    try {
      const response = await apiClient.post('/api/memberships/subscribe', {
        membership_plan_id: planId,
        customer_id: customerId,
        payer_email: email || undefined, // No enviar si está vacío
        tenant_id: tenantId,
      });
      
      console.log('[MembershipsAPI] Respuesta de suscripción:', response.data);
      
      // El backend devuelve { ok: true, data: {...} }
      if (response.data?.ok && response.data?.data) {
        const sub = response.data.data;
        return {
          id: sub.id,
          customer_id: sub.customer_id,
          membership_plan_id: sub.membership_plan_id,
          status: sub.status,
          next_charge_at: sub.next_charge_at,
          last_payment_at: sub.last_payment_at,
          amount_decimal: sub.amount_decimal,
          currency: sub.currency,
          mp_init_point: sub.mp_init_point,
          plan: sub.plan_name ? {
            id: sub.membership_plan_id,
            name: sub.plan_name,
            description: sub.plan_description || '',
            price: sub.plan_price || 0,
            currency: sub.currency,
            frequency: sub.duration_months || 1,
            is_active: true,
          } : undefined,
        };
      }
      
      // Si la respuesta no tiene el formato esperado, lanzar error con detalles
      console.error('[MembershipsAPI] Respuesta inesperada:', response.data);
      throw new Error(`Respuesta inválida del servidor: ${JSON.stringify(response.data)}`);
    } catch (error: any) {
      console.error('[MembershipsAPI] Error en subscribeToPlan:', error);
      if (error.response?.data) {
        console.error('[MembershipsAPI] Error response data:', error.response.data);
      }
      throw error;
    }
  },

  /**
   * Ver mi membresía activa
   */
  getMyMembership: async (customerId: number, tenantId: number): Promise<MembershipSubscription | null> => {
    try {
      const response = await apiClient.get('/api/memberships/my', {
        params: {
          customer_id: customerId,
          tenant_id: tenantId,
        },
      });
      // El backend devuelve { ok: true, data: {...} }
      if (response.data?.ok && response.data?.data) {
        const sub = response.data.data;
        return {
          id: sub.id,
          customer_id: sub.customer_id,
          membership_plan_id: sub.membership_plan_id,
          status: sub.status,
          next_charge_at: sub.next_charge_at,
          last_payment_at: sub.last_payment_at,
          amount_decimal: sub.amount_decimal,
          currency: sub.currency,
          plan: {
            id: sub.membership_plan_id,
            name: sub.plan_name,
            description: sub.plan_description || '',
            price: sub.plan_price || 0,
            currency: sub.currency,
            frequency: sub.duration_months || 1,
            is_active: true,
          },
        };
      }
      return null;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null; // No tiene membresía activa
      }
      throw error;
    }
  },

  /**
   * Obtener link de pago para renovar membresía
   */
  getPaymentLink: async (subscriptionId: number, regenerate: boolean = false): Promise<string> => {
    const response = await apiClient.get(`/api/memberships/subscriptions/${subscriptionId}/payment-link`, {
      params: { regenerate: regenerate ? 'true' : 'false' },
    });
    // El backend devuelve { ok: true, data: { payment_link: "..." } }
    if (response.data?.ok && response.data?.data?.payment_link) {
      return response.data.data.payment_link;
    }
    throw new Error('No se pudo obtener el link de pago');
  },

  /**
   * Cancelar membresía
   */
  cancelMembership: async (subscriptionId: number): Promise<void> => {
    await apiClient.delete(`/api/memberships/subscriptions/${subscriptionId}`);
  },
};

