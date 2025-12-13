/**
 * Pantalla de Turnos
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { CalendarIcon } from '../components/Icons';
import { MercadoPagoLogo } from '../components/MercadoPagoLogo';
import { useAppTheme } from '../store/useThemeStore';
import { appointmentsAPI, Appointment } from '../api/appointments';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigation } from '@react-navigation/native';
import { CountdownTimer } from '../components/CountdownTimer';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

dayjs.locale('es');

const ARJA_PRIMARY_START = '#13b5cf';
const STATUS_COLORS: Record<string, string> = {
  scheduled: '#10b981',
  confirmed: '#0ea5e9',
  completed: '#6366f1',
  cancelled: '#ef4444',
  pending_deposit: '#f59e0b',
  deposit_paid: '#8b5cf6',
};

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Programado',
  confirmed: 'Confirmado',
  completed: 'Completado',
  cancelled: 'Cancelado',
  pending_deposit: 'Pendiente seña',
  deposit_paid: 'Seña pagada',
};

export default function AppointmentsScreen() {
  const { isDark } = useAppTheme();
  const isDarkMode = Boolean(isDark);
  const { tenantId, customerId } = useAuthStore();
  const navigation = useNavigation();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState<number | null>(null);
  const [paymentLinkGeneratedAt, setPaymentLinkGeneratedAt] = useState<Record<number, number>>({});

  // Calcular si el link de pago está vencido basándose en la fecha del turno
  const isPaymentLinkExpired = (appt: Appointment) => {
    const appointmentDate = dayjs(appt.starts_at);
    const oneHourBefore = appointmentDate.subtract(1, 'hour');
    return dayjs().isAfter(oneHourBefore);
  };

  // Calcular minutos restantes para el vencimiento desde la creación del turno
  const getRemainingPaymentMinutes = (appt: Appointment): number | null => {
    if (!appt.created_at) return null;
    
    const appointmentDate = dayjs(appt.starts_at);
    const oneHourBefore = appointmentDate.subtract(1, 'hour');
    const createdDate = dayjs(appt.created_at);
    const now = dayjs();
    
    // Si ya pasó la hora antes del turno, está vencido
    if (now.isAfter(oneHourBefore)) {
      return 0;
    }
    
    // Calcular minutos desde la creación hasta 1 hora antes del turno
    const totalMinutes = oneHourBefore.diff(createdDate, 'minute');
    
    // Si ya pasó tiempo desde la creación, calcular lo que queda
    const elapsedMinutes = now.diff(createdDate, 'minute');
    const remainingMinutes = Math.max(0, totalMinutes - elapsedMinutes);
    
    // Limitar a 30 minutos máximo para el cronómetro
    return Math.min(30, remainingMinutes);
  };

  const loadData = useCallback(async () => {
    if (!tenantId || !customerId) {
      setLoading(false);
      return;
    }
    try {
      const data = await appointmentsAPI.getMyAppointments(customerId, tenantId);
      setAppointments(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('[AppointmentsScreen] Error loading appointments', error?.response?.data || error?.message);
      Alert.alert('Error', 'No se pudieron cargar tus turnos');
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

  const formatDate = (date?: string) =>
    date ? dayjs(date).format('ddd D MMM · HH:mm') : '';

  const { upcoming, past } = useMemo(() => {
    const now = dayjs();
    const all = appointments
      .filter((a) => a.starts_at)
      .sort((a, b) => dayjs(a.starts_at).valueOf() - dayjs(b.starts_at).valueOf());
    
    return {
      upcoming: all.filter((a) => dayjs(a.starts_at).isAfter(now)),
      past: all.filter((a) => dayjs(a.starts_at).isBefore(now) || dayjs(a.starts_at).isSame(now)),
    };
  }, [appointments]);

  const handlePayDeposit = async (appt: Appointment) => {
    if (!tenantId || !customerId) {
      Alert.alert('Error', 'Faltan datos para generar el link de pago');
      return;
    }

    try {
      setLoadingPayment(appt.id);
      const response = await appointmentsAPI.getDepositPaymentLink(appt.id, tenantId, customerId);

      if (response.ok && response.paymentLink) {
        // Guardar el momento en que se generó el link para el cronómetro
        setPaymentLinkGeneratedAt((prev) => ({
          ...prev,
          [appt.id]: Date.now(),
        }));
        
        const canOpen = await Linking.canOpenURL(response.paymentLink);
        if (canOpen) {
          await Linking.openURL(response.paymentLink);
          Alert.alert(
            'Redirigiendo a Mercado Pago',
            'Serás redirigido para completar el pago de la seña.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert('Error', 'No se puede abrir el link de pago');
        }
      } else {
        Alert.alert('Error', 'No se pudo generar el link de pago');
      }
    } catch (error: any) {
      console.error('[AppointmentsScreen] Error getting payment link', error);
      Alert.alert('Error', error?.response?.data?.error || 'No se pudo generar el link de pago');
    } finally {
      setLoadingPayment(null);
    }
  };

  const handleCancel = (appt: Appointment) => {
    Alert.alert(
      'Cancelar turno',
      `¿Querés cancelar el turno de ${appt.service_name || 'servicio'} el ${formatDate(appt.starts_at)}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!tenantId || !customerId) {
                Alert.alert('Error', 'Faltan datos para cancelar el turno');
                return;
              }
              await appointmentsAPI.cancelAppointment(appt.id, tenantId, customerId);
              await loadData();
              Alert.alert('Éxito', 'Turno cancelado correctamente');
            } catch (error: any) {
              Alert.alert('Error', error?.response?.data?.error || 'No se pudo cancelar el turno');
            }
          },
        },
      ]
    );
  };

  const renderCard = (appt: Appointment) => {
    const status = appt.status || 'scheduled';
    const statusColor = STATUS_COLORS[status] || '#7b4bff';
    const statusLabel = STATUS_LABELS[status] || status;
    const isPast = dayjs(appt.starts_at).isBefore(dayjs());
    const canCancel = status !== 'cancelled' && status !== 'completed' && !isPast;

    return (
      <View key={appt.id} style={[styles.card, isDarkMode && styles.cardDark]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text 
              style={[styles.cardTitle, isDarkMode && styles.cardTitleDark]}
              numberOfLines={3}
              ellipsizeMode="tail"
            >
              {appt.service_name || 'Servicio'}
            </Text>
          </View>
          <View style={styles.cardHeaderRight}>
            <View style={[styles.statusPill, { backgroundColor: `${statusColor}20` }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
            {appt.status === 'pending_deposit' && appt.deposit_decimal && appt.deposit_decimal > 0 && !appt.deposit_paid_at && (() => {
              const remainingMinutes = getRemainingPaymentMinutes(appt);
              const isExpired = isPaymentLinkExpired(appt);
              
              if (remainingMinutes !== null && remainingMinutes > 0 && !isExpired) {
                return (
                  <View style={styles.countdownContainerCompact}>
                    <CountdownTimer
                      initialMinutes={remainingMinutes}
                      isDark={isDarkMode}
                      compact={true}
                      color="#ef4444"
                      onExpire={() => {
                        // El cronómetro expiró, pero el link puede seguir válido hasta 1 hora antes del turno
                      }}
                    />
                  </View>
                );
              }
              
              return null;
            })()}
          </View>
        </View>
        <View style={styles.cardHeaderBottom}>
          <View style={styles.cardHeaderBottomLeft}>
            <Text style={[styles.cardSubtitle, isDarkMode && styles.cardSubtitleDark]}>
              {appt.instructor_name ? `Con ${appt.instructor_name}` : 'Sin asignar'}
            </Text>
            <Text style={[styles.cardDate, isDarkMode && styles.cardDateDark]}>{formatDate(appt.starts_at)}</Text>
          </View>
          {canCancel && (
            <TouchableOpacity
              style={[styles.cancelButtonHeader, isDarkMode && styles.cancelButtonHeaderDark]}
              onPress={() => handleCancel(appt)}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelButtonHeaderText, isDarkMode && styles.cancelButtonHeaderTextDark]}>
                Cancelar
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.cardActions}>
          {appt.status === 'pending_deposit' && appt.deposit_decimal && appt.deposit_decimal > 0 && !appt.deposit_paid_at && (
            <View style={styles.depositPaymentContainer}>
              <View style={styles.depositAmountContainer}>
                <Text style={[styles.depositAmountLabel, isDarkMode && styles.depositAmountLabelDark]}>
                  Seña a pagar:
                </Text>
                <Text style={[styles.depositAmountValue, isDarkMode && styles.depositAmountValueDark]}>
                  ${appt.deposit_decimal}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.payDepositButton, loadingPayment === appt.id && styles.payDepositButtonDisabled]}
                activeOpacity={0.9}
                onPress={() => handlePayDeposit(appt)}
                disabled={loadingPayment === appt.id}
              >
                {loadingPayment === appt.id ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <View style={styles.payDepositButtonContent}>
                    <MercadoPagoLogo size={40} variant="horizontal" width={160} />
                  </View>
                )}
              </TouchableOpacity>
              <Text style={[styles.depositInfoNote, isDarkMode && styles.depositInfoNoteDark]}>
                El link de pago vence en 30 minutos
              </Text>
            </View>
          )}
          {canCancel && appt.status !== 'pending_deposit' && (
            <TouchableOpacity
              style={[styles.secondaryBtn, { borderColor: statusColor }]}
              activeOpacity={0.9}
              onPress={() => handleCancel(appt)}
            >
              <Text style={[styles.secondaryBtnText, { color: statusColor }]}>Cancelar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.screenContainer, isDarkMode && styles.screenContainerDark]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={ARJA_PRIMARY_START}
            colors={[ARJA_PRIMARY_START]}
          />
        }
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.screenTitle, isDarkMode && styles.screenTitleDark]}>Turnos</Text>
            <Text style={[styles.screenSubtitle, isDarkMode && styles.screenSubtitleDark]}>
              Revisa tus reservas próximas
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('BookAppointment' as never)}
              activeOpacity={0.8}
            >
              <Text style={styles.addButtonText}>+ Nuevo</Text>
            </TouchableOpacity>
            <View style={styles.headerIcon}>
              <CalendarIcon size={24} color="#ffffff" />
            </View>
          </View>
        </View>

        {loading ? (
          <View style={styles.emptyScreen}>
            <ActivityIndicator size="large" color={ARJA_PRIMARY_START} />
            <Text style={styles.emptyScreenText}>Cargando turnos...</Text>
          </View>
        ) : upcoming.length === 0 && past.length === 0 ? (
          <View style={styles.emptyScreen}>
            <CalendarIcon size={64} color={isDarkMode ? '#4FD4E4' : ARJA_PRIMARY_START} />
            <Text style={[styles.emptyScreenTitle, isDarkMode && styles.emptyScreenTitleDark]}>Sin turnos</Text>
            <Text style={[styles.emptyScreenText, isDarkMode && styles.emptyScreenTextDark]}>
              Reservá tu próximo turno
            </Text>
            <TouchableOpacity
              style={styles.emptyScreenButton}
              onPress={() => navigation.navigate('BookAppointment' as never)}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyScreenButtonText}>Reservar turno</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.list}>
            {upcoming.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>Próximos</Text>
                {upcoming.map(renderCard)}
              </>
            )}
            {past.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark, { marginTop: 24 }]}>
                  Pasados
                </Text>
                {past.map(renderCard)}
              </>
            )}
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
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 40) + 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 0,
    paddingBottom: 12,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  screenTitleDark: {
    color: '#e6f2f8',
  },
  screenSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  screenSubtitleDark: {
    color: '#90acbc',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addButton: {
    backgroundColor: ARJA_PRIMARY_START,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: ARJA_PRIMARY_START,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyScreenTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#051420',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyScreenTitleDark: {
    color: '#e6f2f8',
  },
  emptyScreenText: {
    fontSize: 15,
    color: '#385868',
    textAlign: 'center',
    lineHeight: 21,
  },
  emptyScreenTextDark: {
    color: '#90acbc',
  },
  list: {
    gap: 12,
    paddingVertical: 6,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardDark: {
    backgroundColor: '#1a2a3a',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cancelButtonHeader: {
    backgroundColor: '#78350f',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#92400e',
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonHeaderDark: {
    backgroundColor: '#451a03',
    borderColor: '#78350f',
  },
  cancelButtonHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  cancelButtonHeaderTextDark: {
    color: '#ffffff',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: 20,
  },
  cardTitleDark: {
    color: '#e6f2f8',
  },
  cardHeaderLeft: {
    flex: 1,
    marginRight: 8,
  },
  cardHeaderBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  cardHeaderBottomLeft: {
    flex: 1,
  },
  cardHeaderCenter: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: 4,
    marginRight: 8,
  },
  depositBadge: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '600',
  },
  depositBadgeDark: {
    color: '#fbbf24',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },
  cardSubtitleDark: {
    color: '#90acbc',
  },
  cardDate: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  cardDateDark: {
    color: '#cbd5e1',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitleDark: {
    color: '#e6f2f8',
  },
  emptyScreenButton: {
    marginTop: 24,
    backgroundColor: ARJA_PRIMARY_START,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyScreenButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  secondaryBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  payDepositButton: {
    backgroundColor: '#009ee3',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  payDepositButtonDisabled: {
    opacity: 0.6,
  },
  payDepositButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  payDepositButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  depositAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  depositAmountLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  depositAmountLabelDark: {
    color: '#d1d5db',
  },
  depositAmountValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f59e0b',
  },
  depositAmountValueDark: {
    color: '#fbbf24',
  },
  depositPaymentContainer: {
    width: '100%',
  },
  countdownContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  countdownContainerCompact: {
    alignItems: 'center',
  },
  depositExpiryNote: {
    fontSize: 11,
    color: '#0ea5e9',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  depositExpiryNoteDark: {
    color: '#38bdf8',
  },
  depositInfoNote: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 16,
  },
  depositInfoNoteDark: {
    color: '#9ca3af',
  },
});

