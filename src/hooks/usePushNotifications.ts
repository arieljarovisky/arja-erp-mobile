/**
 * Hook para manejar notificaciones push
 */
import { useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import {
  registerForPushNotifications,
  setupNotificationListeners,
} from '../services/pushNotifications';
import { useAuthStore } from '../store/useAuthStore';
import { notificationsAPI } from '../api/notifications';

export function usePushNotifications() {
  // Este hook DEBE usarse dentro de NavigationContainer
  // Si se usa fuera, useNavigation() lanzará un error
  const navigation = useNavigation();
  const { isAuthenticated, tenantId, customerId } = useAuthStore();
  const listenersRef = useRef<{ remove: () => void } | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !tenantId || !customerId) {
      return;
    }

    // Registrar para notificaciones push cuando el usuario esté autenticado
    const initPushNotifications = async () => {
      try {
        const token = await registerForPushNotifications();
        if (token) {
          console.log('[usePushNotifications] Token registrado exitosamente');
        }
      } catch (error) {
        console.error('[usePushNotifications] Error inicializando:', error);
      }
    };

    initPushNotifications();

    // Configurar listeners para recibir notificaciones
    listenersRef.current = setupNotificationListeners(
      // Cuando llega una notificación en foreground
      async (notification) => {
        console.log('[usePushNotifications] Notificación recibida:', notification);
        // Aquí podrías mostrar un badge o actualizar el contador
        // Por ejemplo, recargar el contador de notificaciones no leídas
      },
      // Cuando el usuario toca una notificación
      async (response) => {
        console.log('[usePushNotifications] Usuario tocó notificación:', response);
        const data = response.notification.request.content.data;

        // Navegar según el tipo de notificación (solo si navigation está disponible)
        if (navigation) {
          if (data?.type) {
            switch (data.type) {
              case 'appointment':
              case 'appointment_reminder':
                if (data.appointmentId) {
                  navigation.navigate('Turnos' as never);
                }
                break;
              case 'class':
              case 'class_reminder':
                navigation.navigate('Classes' as never);
                break;
              case 'routine':
                if (data.routineId) {
                  navigation.navigate('WorkoutRoutineDetail' as never, { routineId: data.routineId } as never);
                } else {
                  navigation.navigate('Rutinas' as never);
                }
                break;
              case 'membership':
                navigation.navigate('Membresías' as never);
                break;
              default:
                // Por defecto, ir a notificaciones
                // Navegar al tab de Notificaciones usando el navegador padre (Tab Navigator)
                const tabNavigator1 = navigation.getParent()?.getParent();
                if (tabNavigator1) {
                  tabNavigator1.navigate('Notificaciones' as never);
                } else {
                  const parent1 = navigation.getParent();
                  if (parent1) {
                    parent1.navigate('Notificaciones' as never);
                  } else {
                    navigation.navigate('Notificaciones' as never);
                  }
                }
            }
          } else {
            // Si no hay tipo específico, ir a notificaciones
            // Navegar al tab de Notificaciones usando el navegador padre (Tab Navigator)
            const tabNavigator2 = navigation.getParent()?.getParent();
            if (tabNavigator2) {
              tabNavigator2.navigate('Notificaciones' as never);
            } else {
              const parent2 = navigation.getParent();
              if (parent2) {
                parent2.navigate('Notificaciones' as never);
              } else {
                navigation.navigate('Notificaciones' as never);
              }
            }
          }
        } else {
          console.warn('[usePushNotifications] No se puede navegar: navigation no disponible');
        }

        // Marcar como leída si tiene ID
        if (data?.notificationId) {
          try {
            await notificationsAPI.markRead(data.notificationId);
          } catch (error) {
            console.error('[usePushNotifications] Error marcando como leída:', error);
          }
        }
      }
    );

    // Limpiar listeners al desmontar
    return () => {
      if (listenersRef.current) {
        listenersRef.current.remove();
      }
    };
  }, [isAuthenticated, tenantId, customerId, navigation]);
}

