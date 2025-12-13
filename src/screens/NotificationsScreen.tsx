/**
 * Pantalla de Notificaciones
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
} from 'react-native';
import { BellIcon } from '../components/Icons';
import { useAppTheme } from '../store/useThemeStore';
import { notificationsAPI, NotificationItem } from '../api/notifications';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

dayjs.locale('es');

const ARJA_PRIMARY_START = '#13b5cf';

export default function NotificationsScreen() {
  const { isDark } = useAppTheme();
  const isDarkMode = Boolean(isDark);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const data = await notificationsAPI.list(false);
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('[NotificationsScreen] Error loading', error?.response?.data || error?.message);
      Alert.alert('Error', 'No se pudieron cargar las notificaciones');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications]
  );

  const formatDate = (date?: string) => (date ? dayjs(date).format('D MMM · HH:mm') : '');

  const markAsRead = async (id: number) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    } catch (error) {
      Alert.alert('Error', 'No se pudo marcar como leída');
    }
  };

  const markAll = async () => {
    try {
      setMarkingAll(true);
      await notificationsAPI.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      Alert.alert('Error', 'No se pudieron marcar todas');
    } finally {
      setMarkingAll(false);
    }
  };

  const removeOne = async (id: number) => {
    try {
      await notificationsAPI.remove(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {
      Alert.alert('Error', 'No se pudo eliminar la notificación');
    }
  };

  const renderItem = (item: NotificationItem) => {
    const badgeColor = item.is_read ? '#d1d5db' : '#10b981';
    return (
      <View key={item.id} style={[styles.card, !item.is_read && styles.cardUnread]}>
        <View style={styles.cardHeader}>
          <View style={styles.titleRow}>
            <View style={[styles.badge, { backgroundColor: `${badgeColor}30`, borderColor: badgeColor }]}>
              <Text style={[styles.badgeText, { color: badgeColor }]}>{item.type || 'info'}</Text>
            </View>
            <Text style={styles.cardTitle}>{item.title || 'Notificación'}</Text>
          </View>
          <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
        </View>
        <Text style={styles.cardMessage}>{item.message || ''}</Text>
        <View style={styles.cardActions}>
          {!item.is_read && (
            <TouchableOpacity style={styles.linkBtn} onPress={() => markAsRead(item.id)}>
              <Text style={styles.linkBtnText}>Marcar leída</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.linkBtn} onPress={() => removeOne(item.id)}>
            <Text style={styles.linkBtnText}>Eliminar</Text>
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
          <View style={{ flex: 1 }}>
            <Text style={styles.screenTitle}>Notificaciones</Text>
            <Text style={styles.screenSubtitle}>Novedades, turnos y avisos</Text>
          </View>
          <View style={styles.unreadPill}>
            <BellIcon size={18} color="#ffffff" />
            <Text style={styles.unreadText}>{unreadCount}</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={markAll} disabled={markingAll || unreadCount === 0}>
            <Text style={[styles.secondaryBtnText, { opacity: markingAll || unreadCount === 0 ? 0.5 : 1 }]}>
              Marcar todo leído
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.emptyScreen}>
            <ActivityIndicator size="large" color={ARJA_PRIMARY_START} />
            <Text style={styles.emptyScreenText}>Cargando notificaciones...</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyScreen}>
            <BellIcon size={64} color={isDarkMode ? '#4FD4E4' : ARJA_PRIMARY_START} />
            <Text style={[styles.emptyScreenTitle, isDarkMode && styles.emptyScreenTitleDark]}>Sin notificaciones</Text>
            <Text style={[styles.emptyScreenText, isDarkMode && styles.emptyScreenTextDark]}>
              Acá verás avisos de turnos, clases y mensajes del negocio.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>{notifications.map(renderItem)}</View>
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
    // Más espacio superior para no chocar con notch/Isla Dinámica
    paddingTop: Platform.OS === 'ios' ? 88 : 32,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 10,
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
  unreadPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: ARJA_PRIMARY_START,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  unreadText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
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
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardUnread: {
    borderColor: `${ARJA_PRIMARY_START}33`,
    backgroundColor: `${ARJA_PRIMARY_START}0f`,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  badge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  cardDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  cardMessage: {
    fontSize: 13,
    color: '#111827',
    marginTop: 4,
    lineHeight: 18,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 10,
  },
  linkBtn: {
    paddingVertical: 6,
  },
  linkBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: ARJA_PRIMARY_START,
  },
});

