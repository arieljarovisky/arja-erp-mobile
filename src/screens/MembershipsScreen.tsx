/**
 * Pantalla de Membresías - Control de pagos mensuales
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Linking,
  AppState,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/useAuthStore';
import { useTenantStore } from '../store/useTenantStore';
import { useAppTheme } from '../store/useThemeStore';
import { CreditCardIcon, CalendarIcon } from '../components/Icons';
import { membershipsAPI, MembershipPlan, MembershipSubscription } from '../api/memberships';
import { format, parseISO, addMonths, differenceInDays, isAfter } from 'date-fns';
import { es } from 'date-fns/locale/es';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/auth';

const ARJA_PRIMARY_START = '#13b5cf';
const ARJA_PRIMARY_END = '#0d7fd4';

export default function MembershipsScreen() {
  const navigation = useNavigation();
  const { isDark } = useAppTheme();
  const { customerId, tenantId } = useAuthStore();
  const { features, loadFeatures, hasFeature } = useTenantStore();
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [subscription, setSubscription] = useState<MembershipSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const appState = useRef(AppState.currentState);
  const paymentInProgress = useRef(false);

  // Cargar features del tenant al montar
  useEffect(() => {
    if (tenantId) {
      loadFeatures(tenantId);
    }
  }, [tenantId, loadFeatures]);

  // Función para verificar y navegar a la pantalla de éxito
  const checkAndNavigateToSuccess = useCallback(async () => {
    try {
      // Esperar un momento para que el webhook procese el pago
      setTimeout(async () => {
        try {
          // Recargar datos para verificar el estado de la suscripción
          if (customerId && tenantId) {
            const subscriptionData = await membershipsAPI.getMyMembership(customerId, tenantId);
            
            // Si la suscripción está activa o autorizada, navegar a la pantalla de éxito
            if (subscriptionData && (subscriptionData.status === 'authorized' || subscriptionData.status === 'active')) {
              paymentInProgress.current = false;
              navigation.navigate('PaymentSuccess' as never);
            } else if (subscriptionData && subscriptionData.status === 'pending') {
              // Si está pendiente, también mostrar la pantalla de éxito (se verificará allí)
              paymentInProgress.current = false;
              navigation.navigate('PaymentSuccess' as never);
            }
          }
        } catch (error) {
          console.error('[MembershipsScreen] Error verificando suscripción después de pago:', error);
        }
      }, 2000); // Esperar 2 segundos para que el webhook procese
    } catch (error) {
      console.error('[MembershipsScreen] Error en checkAndNavigateToSuccess:', error);
    }
  }, [customerId, tenantId, navigation]);

  // Función para manejar deep links
  const handleDeepLink = useCallback((url: string) => {
    try {
      console.log('[MembershipsScreen] Procesando deep link:', url);
      
      if (url.startsWith('arja-erp://payment-success')) {
        console.log('[MembershipsScreen] Deep link de pago exitoso detectado');
        paymentInProgress.current = true;
        checkAndNavigateToSuccess();
      } else if (url.startsWith('arja-erp://payment-failure')) {
        console.log('[MembershipsScreen] Deep link de pago fallido detectado');
        paymentInProgress.current = false;
        Alert.alert(
          'Pago no completado',
          'El pago no se pudo completar. Por favor, intentá nuevamente.',
          [{ text: 'OK' }]
        );
      } else if (url.startsWith('arja-erp://payment-pending')) {
        console.log('[MembershipsScreen] Deep link de pago pendiente detectado');
        paymentInProgress.current = true;
        checkAndNavigateToSuccess();
      }
    } catch (error) {
      console.error('[MembershipsScreen] Error procesando deep link:', error);
    }
  }, [checkAndNavigateToSuccess]);

  // Manejar deep links de Mercado Pago (payment-success, payment-failure)
  useEffect(() => {
    // Verificar si hay un deep link al iniciar
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    // Escuchar deep links mientras la app está abierta
    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('[MembershipsScreen] Deep link recibido:', url);
      handleDeepLink(url);
    });

    return () => {
      subscription.remove();
    };
  }, [handleDeepLink]);

  // Detectar cuando el usuario regresa de Mercado Pago (fallback si no funciona el deep link)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      // Si la app vuelve al foreground y había un pago en progreso
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        paymentInProgress.current
      ) {
        console.log('[MembershipsScreen] App volvió al foreground después de pago');
        checkAndNavigateToSuccess();
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [customerId, tenantId, navigation]);

  const loadData = useCallback(async () => {
    if (!tenantId || !customerId) {
      setLoading(false);
      return;
    }

    // Verificar si el tenant tiene membresías habilitadas
    if (!hasFeature('has_memberships')) {
      console.log('Membresías no habilitadas para este negocio');
      setPlans([]);
      setSubscription(null);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const [plansData, subscriptionData] = await Promise.all([
        membershipsAPI.getPlans(tenantId),
        membershipsAPI.getMyMembership(customerId, tenantId).catch(err => {
          // Si es 404, es normal (no tiene membresía activa)
          if (err.response?.status === 404) {
            return null;
          }
          throw err;
        }),
      ]);
      setPlans(plansData);
      setSubscription(subscriptionData);
    } catch (error: any) {
      // Manejar diferentes tipos de errores
      if (error.response?.status === 403) {
        // Error 403 - Permisos denegados
        console.error('Error 403 - Acceso denegado:', error.response?.data);
        // Puede ser que el backend no esté actualizado
        Alert.alert(
          'Acceso denegado',
          'No tenés permisos para acceder a las membresías. Esto puede indicar que el servidor necesita actualizarse.'
        );
      } else if (error.response && error.response.status !== 404) {
        // Error del servidor con respuesta (excepto 404)
        console.error('Error cargando membresías:', error.response?.status, error.response?.data);
        Alert.alert('Error', `No se pudieron cargar las membresías: ${error.response?.data?.error || error.message}`);
      } else if (!error.response && error.code !== 'ECONNABORTED') {
        // Error de red pero no timeout
        console.log('Backend no disponible - mostrando estado vacío de membresías');
      } else {
        // 404 u otros errores esperados
        console.log('No hay membresías disponibles');
      }
      // Dejar los estados vacíos en caso de error
      setPlans([]);
      setSubscription(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tenantId, customerId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const handleSubscribe = async (plan: MembershipPlan) => {
    Alert.alert(
      'Suscribirse',
      `¿Deseas suscribirte al plan "${plan.name}" por $${plan.price} cada ${plan.frequency} mes${plan.frequency > 1 ? 'es' : ''}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              setLoadingPayment(true);
              
              // Obtener email del usuario
              let email: string | undefined;
              try {
                // Intentar obtener del user_data guardado
                const authData = await authService.getAuthData();
                if (authData?.user?.email) {
                  email = authData.user.email;
                } else {
                  // Intentar obtener del AsyncStorage directamente
                  const userDataStr = await AsyncStorage.getItem('user_data');
                  if (userDataStr) {
                    const userData = JSON.parse(userDataStr);
                    email = userData.email;
                  }
                }
              } catch (error) {
                console.log('No se pudo obtener el email del usuario:', error);
              }
              
              // Si no tenemos email, intentar sin enviarlo (el backend lo buscará en la BD)
              const result = await membershipsAPI.subscribeToPlan(
                plan.id,
                customerId!,
                email || '', // Enviar string vacío si no tenemos email
                tenantId!
              );
              
              if (result.mp_init_point) {
                // Marcar que hay un pago en progreso
                paymentInProgress.current = true;
                
                // Abrir link de pago de Mercado Pago
                const canOpen = await Linking.canOpenURL(result.mp_init_point);
                if (canOpen) {
                  await Linking.openURL(result.mp_init_point);
                  // No mostrar alert, la app detectará cuando el usuario regrese
                } else {
                  Alert.alert('Error', 'No se pudo abrir el link de pago');
                  paymentInProgress.current = false;
                }
              } else {
                Alert.alert('Éxito', 'Te has suscrito correctamente');
                paymentInProgress.current = false;
              }
              await loadData();
            } catch (error: any) {
              console.error('Error en suscripción:', error);
              console.error('Error response:', error.response?.data);
              console.error('Error message:', error.message);
              
              let errorMessage = 'No se pudo realizar la suscripción';
              
              if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
              } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
              } else if (error.message) {
                errorMessage = error.message;
              }
              
              Alert.alert('Error', errorMessage);
            } finally {
              setLoadingPayment(false);
            }
          },
        },
      ]
    );
  };

  const handleRenewPayment = async () => {
    if (!subscription) return;

    try {
      setLoadingPayment(true);
      const paymentLink = await membershipsAPI.getPaymentLink(subscription.id);
      const canOpen = await Linking.canOpenURL(paymentLink);
      if (canOpen) {
        // Marcar que hay un pago en progreso
        paymentInProgress.current = true;
        
        await Linking.openURL(paymentLink);
        // No mostrar alert, la app detectará cuando el usuario regrese
      } else {
        Alert.alert('Error', 'No se pudo abrir el link de pago');
        paymentInProgress.current = false;
      }
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo generar el link de pago');
      paymentInProgress.current = false;
    } finally {
      setLoadingPayment(false);
    }
  };

  const handleRegeneratePaymentLink = async () => {
    if (!subscription) return;

    try {
      setLoadingPayment(true);
      const paymentLink = await membershipsAPI.getPaymentLink(subscription.id, true);
      const canOpen = await Linking.canOpenURL(paymentLink);
      if (canOpen) {
        await Linking.openURL(paymentLink);
        Alert.alert(
          'Nuevo link generado',
          'Se abrió la página de pago. Una vez completado, tu membresía se activará automáticamente.'
        );
        // Recargar datos para actualizar el estado
        await loadData();
      } else {
        Alert.alert('Error', 'No se pudo abrir el link de pago');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'No se pudo generar el nuevo link de pago';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoadingPayment(false);
    }
  };

  const handleCancelMembership = () => {
    if (!subscription) return;

    Alert.alert(
      'Cancelar membresía',
      '¿Estás seguro de cancelar tu membresía? No se realizarán más cobros, pero perderás el acceso al finalizar el período actual.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              await membershipsAPI.cancelMembership(subscription.id);
              Alert.alert('Membresía cancelada', 'Tu membresía ha sido cancelada');
              await loadData();
            } catch (error) {
              Alert.alert('Error', 'No se pudo cancelar la membresía');
            }
          },
        },
      ]
    );
  };

  const handleUpgradePlan = async (newPlan: MembershipPlan) => {
    if (!subscription) return;

    Alert.alert(
      'Subir de plan',
      `¿Deseas cambiar al plan "${newPlan.name}" por $${newPlan.price} cada ${newPlan.frequency} mes${newPlan.frequency > 1 ? 'es' : ''}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              setLoadingPayment(true);
              const result = await membershipsAPI.changePlan(subscription.id, newPlan.id);
              
              if (result.mp_init_point) {
                const canOpen = await Linking.canOpenURL(result.mp_init_point);
                if (canOpen) {
                  paymentInProgress.current = true;
                  await Linking.openURL(result.mp_init_point);
                } else {
                  Alert.alert('Error', 'No se pudo abrir el link de pago');
                }
              } else {
                Alert.alert('Éxito', 'Plan actualizado correctamente');
              }
              await loadData();
            } catch (error: any) {
              console.error('Error cambiando de plan:', error);
              const errorMessage = error.response?.data?.error || error.message || 'No se pudo cambiar el plan';
              
              if (error.response?.data?.requires_admin) {
                Alert.alert(
                  'Contactar administración',
                  'Para bajar de plan, por favor contactá a administración.',
                  [{ text: 'OK' }]
                );
              } else {
                Alert.alert('Error', errorMessage);
              }
            } finally {
              setLoadingPayment(false);
            }
          },
        },
      ]
    );
  };

  const handleContactAdmin = () => {
    Alert.alert(
      'Contactar administración',
      'Para bajar de plan, necesitás contactar a administración. ¿Deseas enviar un mensaje?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Contactar',
          onPress: () => {
            // Aquí podrías abrir WhatsApp, email, o una pantalla de contacto
            // Por ahora mostramos un mensaje
            Alert.alert(
              'Contactar administración',
              'Por favor, contactá a administración a través de los canales oficiales para solicitar el cambio de plan.',
              [{ text: 'OK' }]
            );
          },
        },
      ]
    );
  };

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'authorized':
        return 'Activo';
      case 'pending':
        return 'Pendiente';
      case 'cancelled':
        return 'Cancelada';
      case 'expired':
        return 'Expirada';
      default:
        return status;
    }
  };

  // Calcular días hasta el próximo pago
  const getDaysUntilRenewal = (nextChargeAt: string | undefined): number | null => {
    if (!nextChargeAt) return null;
    try {
      const nextCharge = parseISO(nextChargeAt);
      const today = new Date();
      const days = differenceInDays(nextCharge, today);
      return days >= 0 ? days : null;
    } catch (error) {
      console.error('Error calculando días hasta renovación:', error);
      return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'authorized':
        return '#10b981';
      case 'pending':
        return '#f59e0b';
      case 'cancelled':
        return '#6b7280';
      case 'expired':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  if (loading) {
    return (
      <View style={[styles.screenContainer, isDark && styles.screenContainerDark, styles.centerContent]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <ActivityIndicator size="large" color={ARJA_PRIMARY_START} />
        <Text style={[styles.loadingText, isDark && styles.loadingTextDark]}>Cargando membresías...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.screenContainer, isDark && styles.screenContainerDark]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <LinearGradient
        colors={[ARJA_PRIMARY_START, ARJA_PRIMARY_END]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <CreditCardIcon size={28} color="#ffffff" />
            <Text style={styles.headerTitle}>Membresías</Text>
          </View>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={ARJA_PRIMARY_START}
            colors={[ARJA_PRIMARY_START]}
          />
        }
      >
        {/* Membresía Actual */}
        {subscription ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
              Mi Membresía
            </Text>
            <View style={[styles.subscriptionCard, isDark && styles.subscriptionCardDark]}>
              <View style={styles.subscriptionHeader}>
                <View style={styles.subscriptionTitleContainer}>
                  <Text style={[styles.subscriptionName, isDark && styles.subscriptionNameDark]}>
                    {subscription.plan?.name || 'Membresía'}
                  </Text>
                  <View style={styles.statusContainer}>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(subscription.status) },
                      ]}
                    >
                      <Text style={styles.statusBadgeText}>
                        {getStatusLabel(subscription.status)}
                      </Text>
                    </View>
                    {(() => {
                      const daysUntil = getDaysUntilRenewal(subscription.next_charge_at);
                      const isActive = subscription.status.toLowerCase() === 'active' || subscription.status.toLowerCase() === 'authorized';
                      if (isActive && daysUntil !== null && daysUntil <= 7) {
                        return (
                          <View style={[styles.daysBadge, daysUntil <= 3 && styles.daysBadgeUrgent]}>
                            <Text style={[styles.daysBadgeText, daysUntil <= 3 && styles.daysBadgeTextUrgent]}>
                              {daysUntil === 0 ? 'Vence hoy' : daysUntil === 1 ? 'Vence mañana' : `Faltan ${daysUntil} días`}
                            </Text>
                          </View>
                        );
                      }
                      return null;
                    })()}
                  </View>
                </View>
              </View>

              {subscription.plan?.description && (
                <Text style={[styles.subscriptionDescription, isDark && styles.subscriptionDescriptionDark]}>
                  {subscription.plan.description}
                </Text>
              )}

              <View style={styles.subscriptionDetails}>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, isDark && styles.detailLabelDark]}>
                    Precio:
                  </Text>
                  <Text style={[styles.detailValue, isDark && styles.detailValueDark]}>
                    ${subscription.amount_decimal} {subscription.currency} /{' '}
                    {subscription.plan?.frequency || 1} mes{subscription.plan?.frequency && subscription.plan.frequency > 1 ? 'es' : ''}
                  </Text>
                </View>

                {subscription.last_payment_at && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, isDark && styles.detailLabelDark]}>
                      Último pago:
                    </Text>
                    <Text style={[styles.detailValue, isDark && styles.detailValueDark]}>
                      {format(parseISO(subscription.last_payment_at), "dd 'de' MMMM, yyyy", { locale: es })}
                    </Text>
                  </View>
                )}

                {subscription.next_charge_at && (
                  <View style={styles.detailRow}>
                    <CalendarIcon size={16} color={isDark ? '#90acbc' : '#385868'} />
                    <Text style={[styles.detailLabel, isDark && styles.detailLabelDark]}>
                      Próximo pago:
                    </Text>
                    <Text style={[styles.detailValue, isDark && styles.detailValueDark]}>
                      {format(parseISO(subscription.next_charge_at), "dd 'de' MMMM, yyyy", { locale: es })}
                    </Text>
                  </View>
                )}

                {subscription.plan?.features && subscription.plan.features.length > 0 && (
                  <View style={styles.featuresContainer}>
                    <Text style={[styles.featuresTitle, isDark && styles.featuresTitleDark]}>
                      Beneficios:
                    </Text>
                    {subscription.plan.features.map((feature, index) => (
                      <View key={index} style={styles.featureItem}>
                        <Text style={[styles.featureText, isDark && styles.featureTextDark]}>
                          • {feature}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.subscriptionActions}>
                {subscription.status.toLowerCase() === 'pending' && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.renewButton]}
                    onPress={handleRegeneratePaymentLink}
                    disabled={loadingPayment}
                  >
                    {loadingPayment ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.actionButtonText}>Generar nuevo link de pago</Text>
                    )}
                  </TouchableOpacity>
                )}
                {subscription.status.toLowerCase() === 'active' && subscription.next_charge_at && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.renewButton]}
                    onPress={handleRenewPayment}
                    disabled={loadingPayment}
                  >
                    {loadingPayment ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.actionButtonText}>Renovar ahora</Text>
                    )}
                  </TouchableOpacity>
                )}
                {(subscription.status.toLowerCase() === 'authorized' || subscription.status.toLowerCase() === 'active') && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={handleCancelMembership}
                  >
                    <Text style={[styles.actionButtonText, styles.cancelButtonText]}>
                      Darse de baja
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.noSubscriptionContainer}>
            <CreditCardIcon size={64} color={isDark ? '#4FD4E4' : ARJA_PRIMARY_START} />
            <Text style={[styles.noSubscriptionTitle, isDark && styles.noSubscriptionTitleDark]}>
              No tienes membresía activa
            </Text>
            <Text style={[styles.noSubscriptionText, isDark && styles.noSubscriptionTextDark]}>
              Suscríbete a un plan para acceder a beneficios exclusivos
            </Text>
          </View>
        )}

        {/* Planes Disponibles - solo si está habilitado */}
        {hasFeature('has_memberships') && plans.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
              Planes Disponibles
            </Text>
            {plans
              .filter((plan) => plan.is_active)
              .map((plan) => (
                <View key={plan.id} style={[styles.planCard, isDark && styles.planCardDark]}>
                  <View style={styles.planHeader}>
                    <Text style={[styles.planName, isDark && styles.planNameDark]}>
                      {plan.name}
                    </Text>
                    <View style={styles.planPriceContainer}>
                      <Text style={[styles.planPrice, isDark && styles.planPriceDark]}>
                        ${plan.price}
                      </Text>
                      <Text style={[styles.planFrequency, isDark && styles.planFrequencyDark]}>
                        / {plan.frequency} mes{plan.frequency > 1 ? 'es' : ''}
                      </Text>
                    </View>
                  </View>

                  {plan.description && (
                    <Text style={[styles.planDescription, isDark && styles.planDescriptionDark]}>
                      {plan.description}
                    </Text>
                  )}

                  {plan.features && plan.features.length > 0 && (
                    <View style={styles.planFeatures}>
                      {plan.features.map((feature, index) => (
                        <View key={index} style={styles.planFeatureItem}>
                          <Text style={[styles.planFeatureText, isDark && styles.planFeatureTextDark]}>
                            ✓ {feature}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {(() => {
                    const isCurrentPlan = subscription?.membership_plan_id === plan.id;
                    const currentPlanPrice = subscription?.plan?.price || 0;
                    const isUpgrade = plan.price > currentPlanPrice;
                    const isDowngrade = plan.price < currentPlanPrice && currentPlanPrice > 0;
                    
                    if (isCurrentPlan) {
                      return (
                        <TouchableOpacity
                          style={[styles.subscribeButton, styles.subscribeButtonActive]}
                          disabled={true}
                        >
                          <Text style={[styles.subscribeButtonText, styles.subscribeButtonTextActive]}>
                            Plan actual
                          </Text>
                        </TouchableOpacity>
                      );
                    }
                    
                    if (isUpgrade && subscription) {
                      return (
                        <TouchableOpacity
                          style={[styles.subscribeButton, styles.upgradeButton]}
                          onPress={() => handleUpgradePlan(plan)}
                          disabled={loadingPayment}
                        >
                          {loadingPayment ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                          ) : (
                            <Text style={styles.subscribeButtonText}>
                              Subir de plan
                            </Text>
                          )}
                        </TouchableOpacity>
                      );
                    }
                    
                    if (isDowngrade && subscription) {
                      return (
                        <TouchableOpacity
                          style={[styles.subscribeButton, styles.contactButton]}
                          onPress={handleContactAdmin}
                        >
                          <Text style={styles.subscribeButtonText}>
                            Contactar administración
                          </Text>
                        </TouchableOpacity>
                      );
                    }
                    
                    // Si no tiene suscripción, mostrar botón de suscribirse
                    return (
                      <TouchableOpacity
                        style={styles.subscribeButton}
                        onPress={() => handleSubscribe(plan)}
                        disabled={loadingPayment}
                      >
                        {loadingPayment ? (
                          <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                          <Text style={styles.subscribeButtonText}>
                            Suscribirse
                          </Text>
                        )}
                      </TouchableOpacity>
                    );
                  })()}
                </View>
              ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#f5f9fc',
  },
  screenContainerDark: {
    backgroundColor: '#0e1c2c',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#385868',
  },
  loadingTextDark: {
    color: '#90acbc',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#051420',
    marginBottom: 16,
  },
  sectionTitleDark: {
    color: '#e6f2f8',
  },
  noSubscriptionContainer: {
    alignItems: 'center',
    padding: 40,
    marginBottom: 24,
  },
  noSubscriptionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#051420',
    marginTop: 24,
    marginBottom: 8,
  },
  noSubscriptionTitleDark: {
    color: '#e6f2f8',
  },
  noSubscriptionText: {
    fontSize: 16,
    color: '#385868',
    textAlign: 'center',
    lineHeight: 22,
  },
  noSubscriptionTextDark: {
    color: '#90acbc',
  },
  subscriptionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  subscriptionCardDark: {
    backgroundColor: '#1e2f3f',
  },
  subscriptionHeader: {
    marginBottom: 16,
  },
  subscriptionTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusContainer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 6,
  },
  subscriptionName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#051420',
    flex: 1,
  },
  subscriptionNameDark: {
    color: '#e6f2f8',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  daysBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  daysBadgeUrgent: {
    backgroundColor: '#fee2e2',
  },
  daysBadgeText: {
    color: '#92400e',
    fontSize: 11,
    fontWeight: '600',
  },
  daysBadgeTextUrgent: {
    color: '#991b1b',
  },
  subscriptionDescription: {
    fontSize: 14,
    color: '#385868',
    marginBottom: 16,
    lineHeight: 20,
  },
  subscriptionDescriptionDark: {
    color: '#90acbc',
  },
  subscriptionDetails: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#051420',
  },
  detailLabelDark: {
    color: '#e6f2f8',
  },
  detailValue: {
    fontSize: 14,
    color: '#385868',
    flex: 1,
  },
  detailValueDark: {
    color: '#90acbc',
  },
  featuresContainer: {
    marginTop: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#051420',
    marginBottom: 8,
  },
  featuresTitleDark: {
    color: '#e6f2f8',
  },
  featureItem: {
    marginBottom: 6,
  },
  featureText: {
    fontSize: 14,
    color: '#385868',
    lineHeight: 20,
  },
  featureTextDark: {
    color: '#90acbc',
  },
  subscriptionActions: {
    gap: 12,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  renewButton: {
    backgroundColor: ARJA_PRIMARY_START,
  },
  cancelButton: {
    backgroundColor: '#fee2e2',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#ef4444',
  },
  planCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  planCardDark: {
    backgroundColor: '#1e2f3f',
  },
  planHeader: {
    marginBottom: 12,
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#051420',
    marginBottom: 8,
  },
  planNameDark: {
    color: '#e6f2f8',
  },
  planPriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPrice: {
    fontSize: 28,
    fontWeight: '700',
    color: ARJA_PRIMARY_START,
  },
  planPriceDark: {
    color: ARJA_PRIMARY_START,
  },
  planFrequency: {
    fontSize: 16,
    color: '#6b7280',
    marginLeft: 4,
  },
  planFrequencyDark: {
    color: '#9ca3af',
  },
  planDescription: {
    fontSize: 14,
    color: '#385868',
    marginBottom: 16,
    lineHeight: 20,
  },
  planDescriptionDark: {
    color: '#90acbc',
  },
  planFeatures: {
    marginBottom: 20,
  },
  planFeatureItem: {
    marginBottom: 8,
  },
  planFeatureText: {
    fontSize: 14,
    color: '#385868',
    lineHeight: 20,
  },
  planFeatureTextDark: {
    color: '#90acbc',
  },
  subscribeButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    backgroundColor: ARJA_PRIMARY_START,
    alignItems: 'center',
  },
  subscribeButtonActive: {
    backgroundColor: '#10b981',
  },
  upgradeButton: {
    backgroundColor: '#10b981',
  },
  contactButton: {
    backgroundColor: '#f59e0b',
  },
  subscribeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  subscribeButtonTextActive: {
    color: '#065f46',
  },
});
