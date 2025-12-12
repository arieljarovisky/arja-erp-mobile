/**
 * Pantalla de éxito de pago de suscripción
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppTheme } from '../utils/useAppTheme';
import { Svg, Path, Circle } from 'react-native-svg';
import { useAuthStore } from '../store/useAuthStore';
import { useTenantStore } from '../store/useTenantStore';
import { membershipsAPI, MembershipSubscription } from '../api/memberships';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale/es';

export default function PaymentSuccessScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { isDark } = useAppTheme();
  const { user } = useAuthStore();
  const { tenantId } = useTenantStore();
  const [subscription, setSubscription] = useState<MembershipSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingCount, setCheckingCount] = useState(0);
  const maxChecks = 15; // Intentar verificar hasta 15 veces (15 segundos)

  const customerId = user?.id;
  const isDarkMode = Boolean(isDark);

  // Función para obtener la suscripción del cliente
  const fetchSubscription = async (): Promise<MembershipSubscription | null> => {
    if (!customerId || !tenantId) {
      console.log('[PaymentSuccessScreen] No hay customerId o tenantId');
      return null;
    }
    
    try {
      const subscriptionData = await membershipsAPI.getMyMembership(customerId, tenantId);
      if (subscriptionData) {
        setSubscription(subscriptionData);
        setLoading(false);
        return subscriptionData;
      }
      return null;
    } catch (error: any) {
      console.error('[PaymentSuccessScreen] Error obteniendo suscripción:', error);
      // Si es un error 404, es normal (no tiene suscripción aún)
      if (error?.response?.status === 404) {
        console.log('[PaymentSuccessScreen] No se encontró suscripción (404) - esto es normal si el webhook aún no procesó');
        return null;
      }
      // Para otros errores, detener el loading después de algunos intentos
      if (checkingCount >= 5) {
        setLoading(false);
      }
      return null;
    }
  };

  useEffect(() => {
    if (!customerId || !tenantId) {
      console.log('[PaymentSuccessScreen] No hay customerId o tenantId, deteniendo verificación');
      setLoading(false);
      return;
    }

    // Verificar la suscripción inmediatamente
    fetchSubscription().catch((error) => {
      console.error('[PaymentSuccessScreen] Error en fetchSubscription inicial:', error);
      setLoading(false);
    });

    // Si no encontramos una suscripción activa, verificar periódicamente
    // (el webhook puede tardar unos segundos en procesar)
    const checkInterval = setInterval(async () => {
      setCheckingCount((prev) => {
        if (prev >= maxChecks) {
          clearInterval(checkInterval);
          setLoading(false);
          return prev;
        }
        
        fetchSubscription().then((sub) => {
          // Si encontramos una suscripción activa, detener las verificaciones
          if (sub && (sub.status === 'authorized' || sub.status === 'active')) {
            clearInterval(checkInterval);
            setLoading(false);
          }
        }).catch((error) => {
          console.error('[PaymentSuccessScreen] Error en verificación periódica:', error);
          // Si hay muchos errores, detener las verificaciones
          if (prev >= 5) {
            clearInterval(checkInterval);
            setLoading(false);
          }
        });
        
        return prev + 1;
      });
    }, 1000); // Verificar cada segundo

    return () => clearInterval(checkInterval);
  }, [customerId, tenantId]);

  const handleGoToMemberships = () => {
    navigation.navigate('Membresías' as never);
  };

  const handleGoToHome = () => {
    navigation.navigate('Inicio' as never);
  };

  // Si no hay customerId o tenantId, mostrar mensaje
  if (!customerId || !tenantId) {
    return (
      <View style={[styles.container, isDarkMode && styles.containerDark]}>
        {/* Botón de volver atrás */}
        <View style={[styles.headerContainer, isDarkMode && styles.headerContainerDark]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.backButtonText, isDarkMode && styles.backButtonTextDark]}>←</Text>
          </TouchableOpacity>
        </View>
        <ScrollView 
          contentContainerStyle={styles.contentContainer}
        >
          <View style={styles.content}>
            <Text style={[styles.title, isDarkMode && styles.titleDark]}>
              Error de autenticación
            </Text>
            <Text style={[styles.subtitle, isDarkMode && styles.subtitleDark]}>
              Por favor, iniciá sesión nuevamente.
            </Text>
            <TouchableOpacity
              style={[styles.primaryButton, isDarkMode && styles.primaryButtonDark]}
              onPress={handleGoToHome}
            >
              <Text style={styles.primaryButtonText}>Ir al inicio</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      {/* Botón de volver atrás */}
      <View style={[styles.headerContainer, isDarkMode && styles.headerContainerDark]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backButtonText, isDarkMode && styles.backButtonTextDark]}>←</Text>
        </TouchableOpacity>
      </View>
      <ScrollView 
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.content}>
        {/* Icono de éxito */}
        <View style={[styles.iconContainer, isDarkMode && styles.iconContainerDark]}>
          <Svg width={80} height={80} viewBox="0 0 24 24" fill="none">
            <Circle cx="12" cy="12" r="10" stroke="#10b981" strokeWidth="2" fill="none" />
            <Path
              d="M9 12l2 2 4-4"
              stroke="#10b981"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>

        {/* Título */}
        <Text style={[styles.title, isDarkMode && styles.titleDark]}>
          ¡Pago realizado correctamente!
        </Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#10b981" />
            <Text style={[styles.loadingText, isDarkMode && styles.loadingTextDark]}>
              Verificando tu suscripción...
            </Text>
          </View>
        ) : subscription && (subscription.status === 'authorized' || subscription.status === 'active') ? (
          <View style={styles.successContent}>
            <Text style={[styles.subtitle, isDarkMode && styles.subtitleDark]}>
              Tu suscripción ha sido activada exitosamente.
            </Text>

            {/* Detalles de la suscripción */}
            <View style={[styles.detailsCard, isDarkMode && styles.detailsCardDark]}>
              <Text style={[styles.detailsTitle, isDarkMode && styles.detailsTitleDark]}>
                Detalles de tu suscripción
              </Text>

              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, isDarkMode && styles.detailLabelDark]}>
                  Plan:
                </Text>
                <Text style={[styles.detailValue, isDarkMode && styles.detailValueDark]}>
                  {subscription.plan?.name || 'Membresía'}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, isDarkMode && styles.detailLabelDark]}>
                  Estado:
                </Text>
                <View style={[styles.statusBadge, styles.statusBadgeActive]}>
                  <Text style={styles.statusBadgeText}>Activa</Text>
                </View>
              </View>

              {subscription.last_payment_at && (() => {
                try {
                  const date = parseISO(subscription.last_payment_at);
                  return (
                    <View style={styles.detailRow}>
                      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                        <Path
                          d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"
                          stroke={isDarkMode ? '#90acbc' : '#666'}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Svg>
                      <Text style={[styles.detailLabel, isDarkMode && styles.detailLabelDark]}>
                        Último pago:{' '}
                      </Text>
                      <Text style={[styles.detailValue, isDarkMode && styles.detailValueDark]}>
                        {format(date, "dd 'de' MMMM, yyyy", { locale: es })}
                      </Text>
                    </View>
                  );
                } catch (error) {
                  console.error('[PaymentSuccessScreen] Error formateando fecha de último pago:', error);
                  return null;
                }
              })()}

              {subscription.next_charge_at && (() => {
                try {
                  const date = parseISO(subscription.next_charge_at);
                  return (
                    <View style={styles.detailRow}>
                      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                        <Path
                          d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"
                          stroke={isDarkMode ? '#90acbc' : '#666'}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Svg>
                      <Text style={[styles.detailLabel, isDarkMode && styles.detailLabelDark]}>
                        Próxima renovación:{' '}
                      </Text>
                      <Text style={[styles.detailValue, isDarkMode && styles.detailValueDark]}>
                        {format(date, "dd 'de' MMMM, yyyy", { locale: es })}
                      </Text>
                    </View>
                  );
                } catch (error) {
                  console.error('[PaymentSuccessScreen] Error formateando fecha de próxima renovación:', error);
                  return null;
                }
              })()}

              <View style={styles.detailRow}>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"
                    stroke={isDarkMode ? '#90acbc' : '#666'}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
                <Text style={[styles.detailLabel, isDarkMode && styles.detailLabelDark]}>
                  Monto:{' '}
                </Text>
                <Text style={[styles.detailValue, isDarkMode && styles.detailValueDark]}>
                  ${subscription.amount_decimal} {subscription.currency}
                </Text>
              </View>
            </View>

            <View style={[styles.infoBox, isDarkMode && styles.infoBoxDark]}>
              <Text style={[styles.infoText, isDarkMode && styles.infoTextDark]}>
                Ya podés usar todas las funcionalidades de ARJA ERP.
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.pendingContent}>
            <Text style={[styles.subtitle, isDarkMode && styles.subtitleDark]}>
              Tu suscripción está siendo procesada.
            </Text>
            <Text style={[styles.pendingText, isDarkMode && styles.pendingTextDark]}>
              Te notificaremos cuando esté activa. Podés cerrar esta ventana y volver más tarde.
            </Text>
          </View>
        )}

        {/* Botones de acción */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.primaryButton, isDarkMode && styles.primaryButtonDark]}
            onPress={handleGoToMemberships}
          >
            <Text style={styles.primaryButtonText}>Ver mi membresía</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, isDarkMode && styles.secondaryButtonDark]}
            onPress={handleGoToHome}
          >
            <Text style={[styles.secondaryButtonText, isDarkMode && styles.secondaryButtonTextDark]}>
              Ir al inicio
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  containerDark: {
    backgroundColor: '#0f172a',
  },
  headerContainer: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: '#ffffff',
  },
  headerContainerDark: {
    backgroundColor: '#0f172a',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: '#111827',
    fontWeight: 'bold',
  },
  backButtonTextDark: {
    color: '#f1f5f9',
  },
  contentContainer: {
    flexGrow: 1,
    padding: 20,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  iconContainerDark: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  titleDark: {
    color: '#f1f5f9',
  },
  subtitle: {
    fontSize: 18,
    color: '#4b5563',
    textAlign: 'center',
    marginBottom: 24,
  },
  subtitleDark: {
    color: '#cbd5e1',
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  loadingTextDark: {
    color: '#94a3b8',
  },
  successContent: {
    width: '100%',
    maxWidth: 400,
  },
  detailsCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  detailsCardDark: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  detailsTitleDark: {
    color: '#f1f5f9',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  detailLabelDark: {
    color: '#94a3b8',
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
    flex: 1,
  },
  detailValueDark: {
    color: '#f1f5f9',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeActive: {
    backgroundColor: '#d1fae5',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065f46',
  },
  infoBox: {
    backgroundColor: '#d1fae5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  infoBoxDark: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  infoText: {
    fontSize: 14,
    color: '#065f46',
    textAlign: 'center',
  },
  infoTextDark: {
    color: '#6ee7b7',
  },
  pendingContent: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  pendingText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
  pendingTextDark: {
    color: '#94a3b8',
  },
  actions: {
    width: '100%',
    maxWidth: 400,
    gap: 12,
    marginTop: 24,
  },
  primaryButton: {
    backgroundColor: '#13b5cf',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDark: {
    backgroundColor: '#13b5cf',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  secondaryButtonDark: {
    borderColor: '#334155',
  },
  secondaryButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500',
  },
  secondaryButtonTextDark: {
    color: '#94a3b8',
  },
});

