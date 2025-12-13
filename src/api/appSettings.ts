/**
 * API para configuración de la app (branding, precios, horarios, notifs, push)
 */
import apiClient from './client';

export interface AppTheme {
  primary?: string;
  secondary?: string;
  text?: string;
  background?: string;
}

export interface AppPricing {
  plans?: Array<{
    id?: string | number;
    name?: string;
    price?: number;
    currency?: string;
    description?: string;
  }>;
}

export interface AppSchedule {
  slots?: Array<{
    day: string;
    from: string;
    to: string;
  }>;
}

export interface AppNotificationsPrefs {
  push?: boolean;
  inApp?: boolean;
  features?: {
    routines?: boolean;
    classes?: boolean;
    qr?: boolean;
    notifications?: boolean;
  };
}

export interface AppSettings {
  theme: AppTheme | null;
  pricing: AppPricing | null;
  schedule: AppSchedule | null;
  notifications: AppNotificationsPrefs | null;
  logoUrl: string | null;
  pushToken?: string | null;
}

export const appSettingsAPI = {
  getMySettings: async (): Promise<AppSettings> => {
    const resp = await apiClient.get('/api/customers/app-settings/me');
    if (resp.data?.ok && resp.data?.data) {
      console.log('[appSettingsAPI] getMySettings data:', resp.data.data);
      return resp.data.data;
    }
    console.log('[appSettingsAPI] getMySettings vacío o sin ok');
    return {
      theme: null,
      pricing: null,
      schedule: null,
      notifications: null,
      logoUrl: null,
      pushToken: null,
    };
  },

  saveMyPushToken: async (pushToken: string): Promise<void> => {
    await apiClient.put('/api/customers/app-settings/me/push-token', { pushToken });
  },

  updateMyPicture: async (picture: string): Promise<void> => {
    const resp = await apiClient.put('/api/customers/app-settings/me/picture', { picture });
    if (!resp.data?.ok) {
      throw new Error(resp.data?.error || 'Error al actualizar foto de perfil');
    }
  },
};

