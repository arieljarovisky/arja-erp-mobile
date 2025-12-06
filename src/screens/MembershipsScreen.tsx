/**
 * Pantalla de Membresías - Control de pagos mensuales
 */
import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../store/useAuthStore';
import { useTenantStore } from '../store/useTenantStore';
import { useAppTheme } from '../utils/useAppTheme';
import { CreditCardIcon, CalendarIcon } from '../components/Icons';
import { membershipsAPI, MembershipPlan, MembershipSubscription } from '../api/memberships';
import { format, parseISO, addMonths } from 'date-fns';
import { es } from 'date-fns/locale/es';

const ARJA_PRIMARY_START = '#13b5cf';
const ARJA_PRIMARY_END = '#0d7fd4';

export default function MembershipsScreen({ navigation }: any) {
  const { isDark } = useAppTheme();
  const { customerId, tenantId } = useAuthStore();
  const { features, loadFeatures, hasFeature } = useTenantStore();
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [subscription, setSubscription] = useState<MembershipSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);

  // Cargar features del tenant al montar
  useEffect(() => {
    if (tenantId) {
      loadFeatures(tenantId);
    }
  }, [tenantId, loadFeatures]);

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
        membershipsAPI.getMyMembership(customerId, tenantId),
      ]);
      setPlans(plansData);
      setSubscription(subscriptionData);
    } catch (error: any) {
      // Solo mostrar alerta si es un error del servidor (no error de red)
      // Los errores de red (Network Error) son comunes en desarrollo y no necesitan alerta
      if (error.response && error.response.status !== 404) {
        // Error del servidor con respuesta
        console.error('Error cargando membresías:', error);
        Alert.alert('Error', 'No se pudieron cargar las membresías');
      } else if (!error.response && error.code !== 'ECONNABORTED') {
        // Error de red pero no timeout - solo loguear como info, no como error
        // El usuario verá el estado vacío que es más amigable
        console.log('Backend no disponible - mostrando estado vacío de membresías');
      } else {
        // 404 u otros errores esperados - solo loguear como info
        console.log('No hay membresías disponibles');
      }
      // Si es 404 o error de red, simplemente dejamos los estados vacíos
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
              // Necesitaríamos el email del usuario, por ahora usamos un placeholder
              const email = 'usuario@example.com'; // TODO: Obtener email del usuario
              const result = await membershipsAPI.subscribeToPlan(
                plan.id,
                customerId!,
                email,
                tenantId!
              );
              
              if (result.mp_init_point) {
                // Abrir link de pago de Mercado Pago
                const canOpen = await Linking.canOpenURL(result.mp_init_point);
                if (canOpen) {
                  await Linking.openURL(result.mp_init_point);
                  Alert.alert(
                    'Pago pendiente',
                    'Se abrió la página de pago. Una vez completado, tu membresía se activará automáticamente.'
                  );
                } else {
                  Alert.alert('Error', 'No se pudo abrir el link de pago');
                }
              } else {
                Alert.alert('Éxito', 'Te has suscrito correctamente');
              }
              await loadData();
            } catch (error: any) {
              Alert.alert(
                'Error',
                error.response?.data?.message || 'No se pudo realizar la suscripción'
              );
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
        await Linking.openURL(paymentLink);
        Alert.alert(
          'Pago pendiente',
          'Se abrió la página de pago. Una vez completado, tu membresía se renovará automáticamente.'
        );
      } else {
        Alert.alert('Error', 'No se pudo abrir el link de pago');
      }
    } catch (error: any) {
      Alert.alert('Error', 'No se pudo generar el link de pago');
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

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'Activa';
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
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
          <CreditCardIcon size={28} color="#ffffff" />
          <Text style={styles.headerTitle}>Membresías</Text>
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
                {subscription.status.toLowerCase() === 'active' && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={handleCancelMembership}
                  >
                    <Text style={[styles.actionButtonText, styles.cancelButtonText]}>
                      Cancelar membresía
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

                  <TouchableOpacity
                    style={[
                      styles.subscribeButton,
                      subscription?.membership_plan_id === plan.id && styles.subscribeButtonActive,
                    ]}
                    onPress={() => handleSubscribe(plan)}
                    disabled={loadingPayment || subscription?.membership_plan_id === plan.id}
                  >
                    {loadingPayment ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.subscribeButtonText}>
                        {subscription?.membership_plan_id === plan.id
                          ? 'Plan actual'
                          : 'Suscribirse'}
                      </Text>
                    )}
                  </TouchableOpacity>
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
    gap: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
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
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
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
  subscribeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
