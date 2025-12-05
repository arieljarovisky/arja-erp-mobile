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
    return response.data;
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
    const response = await apiClient.post('/api/memberships/subscribe', {
      membership_plan_id: planId,
      customer_id: customerId,
      payer_email: email,
      tenant_id: tenantId,
    });
    return response.data;
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
      return response.data;
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
  getPaymentLink: async (subscriptionId: number): Promise<string> => {
    const response = await apiClient.get(`/api/memberships/subscriptions/${subscriptionId}/payment-link`);
    return response.data.payment_link;
  },

  /**
   * Cancelar membresía
   */
  cancelMembership: async (subscriptionId: number): Promise<void> => {
    await apiClient.delete(`/api/memberships/subscriptions/${subscriptionId}`);
  },
};

