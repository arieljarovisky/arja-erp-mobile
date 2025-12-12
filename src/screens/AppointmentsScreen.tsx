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
} from 'react-native';
import { CalendarIcon } from '../components/Icons';
import { useAppTheme } from '../utils/useAppTheme';
import { appointmentsAPI, Appointment } from '../api/appointments';
import { useAuthStore } from '../store/useAuthStore';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

dayjs.locale('es');

const ARJA_PRIMARY_START = '#13b5cf';
const STATUS_COLORS: Record<string, string> = {
  scheduled: '#10b981',
  confirmed: '#0ea5e9',
  completed: '#6366f1',
  cancelled: '#ef4444',
};

export default function AppointmentsScreen() {
  const { isDark } = useAppTheme();
  const isDarkMode = Boolean(isDark);
  const { tenantId, phone } = useAuthStore();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!tenantId || !phone) {
      setLoading(false);
      return;
    }
    try {
      const data = await appointmentsAPI.getMyAppointments(phone, tenantId);
      setAppointments(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('[AppointmentsScreen] Error loading appointments', error?.response?.data || error?.message);
      Alert.alert('Error', 'No se pudieron cargar tus turnos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tenantId, phone]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const formatDate = (date?: string) =>
    date ? dayjs(date).format('ddd D MMM · HH:mm') : '';

  const upcoming = useMemo(
    () =>
      appointments
        .filter((a) => a.starts_at)
        .sort((a, b) => dayjs(a.starts_at).valueOf() - dayjs(b.starts_at).valueOf()),
    [appointments]
  );

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
              await appointmentsAPI.cancelAppointment(appt.id);
              await loadData();
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
    return (
      <View key={appt.id} style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{appt.service_name || 'Servicio'}</Text>
          <View style={[styles.statusPill, { backgroundColor: `${statusColor}20` }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{status}</Text>
          </View>
        </View>
        <Text style={styles.cardSubtitle}>
          {appt.instructor_name ? `Con ${appt.instructor_name}` : 'Sin asignar'}
        </Text>
        <Text style={styles.cardDate}>{formatDate(appt.starts_at)}</Text>
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.secondaryBtn, { borderColor: statusColor }]}
            activeOpacity={0.9}
            onPress={() => handleCancel(appt)}
            disabled={status === 'cancelled'}
          >
            <Text style={[styles.secondaryBtnText, { color: statusColor }]}>
              {status === 'cancelled' ? 'Cancelado' : 'Cancelar'}
            </Text>
          </TouchableOpacity>
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
            <Text style={styles.screenTitle}>Turnos</Text>
            <Text style={styles.screenSubtitle}>Revisa tus reservas próximas</Text>
          </View>
          <View style={styles.headerIcon}>
            <CalendarIcon size={24} color="#ffffff" />
          </View>
        </View>

        {loading ? (
          <View style={styles.emptyScreen}>
            <ActivityIndicator size="large" color={ARJA_PRIMARY_START} />
            <Text style={styles.emptyScreenText}>Cargando turnos...</Text>
          </View>
        ) : upcoming.length === 0 ? (
          <View style={styles.emptyScreen}>
            <CalendarIcon size={64} color={isDarkMode ? '#4FD4E4' : ARJA_PRIMARY_START} />
            <Text style={[styles.emptyScreenTitle, isDarkMode && styles.emptyScreenTitleDark]}>Sin turnos</Text>
            <Text style={[styles.emptyScreenText, isDarkMode && styles.emptyScreenTextDark]}>
              Reservá tu próximo turno desde la sección Turnos.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>{upcoming.map(renderCard)}</View>
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
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 12,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
  },
  screenSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
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
  cardDate: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
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
});

