/**
 * Servicio para manejar notificaciones push
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { appSettingsAPI } from '../api/appSettings';
import { useAuthStore } from '../store/useAuthStore';

// Importar expo-constants de forma segura
import Constants from 'expo-constants';

// Configurar cómo se manejan las notificaciones cuando la app está en foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface PushNotificationService {
  registerForPushNotifications: () => Promise<string | null>;
  getExpoPushToken: () => Promise<string | null>;
  setupNotificationListeners: () => void;
}

/**
 * Solicita permisos y registra el token de notificaciones push
 */
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    // Solicitar permisos
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[PushNotifications] Permisos de notificaciones no otorgados');
      return null;
    }

    // Obtener el projectId de Expo
    // El projectId es necesario para obtener tokens de Expo Push
    let projectId: string | undefined;
    
    try {
      // Intentar obtener de diferentes fuentes
      projectId = 
        Constants?.expoConfig?.extra?.eas?.projectId ||
        Constants?.easConfig?.projectId ||
        Constants?.expoConfig?.extra?.projectId ||
        Constants?.expoConfig?.extra?.expo?.projectId;
      
      if (projectId) {
        console.log('[PushNotifications] projectId encontrado:', projectId);
      } else {
        console.warn('[PushNotifications] projectId no encontrado en Constants:', {
          hasConstants: !!Constants,
          hasExpoConfig: !!Constants?.expoConfig,
          hasExtra: !!Constants?.expoConfig?.extra,
          extraKeys: Constants?.expoConfig?.extra ? Object.keys(Constants.expoConfig.extra) : [],
        });
      }
    } catch (error) {
      console.warn('[PushNotifications] Error obteniendo projectId:', error);
    }

    // Si no hay projectId, intentar usar el slug como fallback temporal
    // NOTA: Esto solo funciona en desarrollo. Para producción, necesitas un projectId real de EAS.
    if (!projectId) {
      const slug = Constants?.expoConfig?.slug;
      if (slug) {
        console.warn('[PushNotifications] No se encontró projectId. Usando slug como fallback temporal:', slug);
        console.warn('[PushNotifications] ⚠️ Para producción, configura el projectId ejecutando: eas init');
        // En desarrollo, Expo puede aceptar el slug, pero no es recomendado para producción
        // Intentamos obtener el token sin projectId (Expo puede inferirlo del entorno)
        try {
          const tokenData = await Notifications.getExpoPushTokenAsync();
          const expoPushToken = tokenData.data;
          console.log('[PushNotifications] Token obtenido (sin projectId):', expoPushToken);
          
          // Guardar el token en el backend
          const { tenantId, customerId } = useAuthStore.getState();
          if (tenantId && customerId && expoPushToken) {
            try {
              await appSettingsAPI.saveMyPushToken(expoPushToken);
              console.log('[PushNotifications] Token guardado en backend');
            } catch (error) {
              console.error('[PushNotifications] Error guardando token:', error);
            }
          }
          
          return expoPushToken;
        } catch (error: any) {
          console.error('[PushNotifications] Error obteniendo token sin projectId:', error.message);
          console.warn('[PushNotifications] Para habilitar notificaciones push, ejecuta: eas init');
          return null;
        }
      } else {
        console.warn('[PushNotifications] No se puede obtener token sin projectId. Ejecuta: eas init');
        return null;
      }
    }

    // Obtener el token de Expo Push
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });

    const expoPushToken = tokenData.data;
    console.log('[PushNotifications] Token obtenido:', expoPushToken);

    // Guardar el token en el backend
    const { tenantId, customerId } = useAuthStore.getState();
    if (tenantId && customerId && expoPushToken) {
      try {
        await appSettingsAPI.saveMyPushToken(expoPushToken);
        console.log('[PushNotifications] Token guardado en backend');
      } catch (error) {
        console.error('[PushNotifications] Error guardando token:', error);
      }
    }

    return expoPushToken;
  } catch (error) {
    console.error('[PushNotifications] Error registrando notificaciones:', error);
    return null;
  }
}

/**
 * Configura los listeners para recibir notificaciones
 */
export function setupNotificationListeners(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationTapped?: (response: Notifications.NotificationResponse) => void
) {
  // Listener para cuando llega una notificación y la app está en foreground
  const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
    console.log('[PushNotifications] Notificación recibida:', notification);
    if (onNotificationReceived) {
      onNotificationReceived(notification);
    }
  });

  // Listener para cuando el usuario toca una notificación
  const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    console.log('[PushNotifications] Usuario tocó notificación:', response);
    if (onNotificationTapped) {
      onNotificationTapped(response);
    }
  });

  return {
    remove: () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    },
  };
}

/**
 * Obtiene el token de Expo Push (sin registrar)
 */
export async function getExpoPushToken(): Promise<string | null> {
  try {
    let projectId: string | undefined;
    
    try {
      projectId = 
        Constants?.expoConfig?.extra?.eas?.projectId ||
        Constants?.easConfig?.projectId ||
        Constants?.expoConfig?.extra?.projectId ||
        Constants?.expoConfig?.extra?.expo?.projectId;
      
      if (!projectId) {
        console.warn('[PushNotifications] No se puede obtener token sin projectId');
        return null;
      }
    } catch (error) {
      console.warn('[PushNotifications] Error obteniendo projectId:', error);
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    return tokenData.data;
  } catch (error) {
    console.error('[PushNotifications] Error obteniendo token:', error);
    return null;
  }
}

/**
 * Cancela todas las notificaciones programadas
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Cancela una notificación específica
 */
export async function cancelNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/**
 * Programa una notificación local
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: any,
  trigger?: Notifications.NotificationTriggerInput
): Promise<string> {
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
      sound: true,
    },
    trigger: trigger || null, // null = inmediato
  });

  return notificationId;
}

