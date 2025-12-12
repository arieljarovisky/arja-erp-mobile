/**
 * Pantalla Principal / Home con estilos ARJA ERP
 */
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  StatusBar,
  RefreshControl,
  Alert,
  Modal,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../store/useAuthStore';
import { useTenantStore } from '../store/useTenantStore';
import { useAppTheme } from '../utils/useAppTheme';
import { useAppSettingsStore, selectFeatureFlags, selectThemeColors } from '../store/useAppSettingsStore';
import { CalendarIcon, PlusIcon, ClassesIcon, CreditCardIcon, UserIcon, RoutinesIcon, BellIcon, CoursesIcon } from '../components/Icons';
import { appointmentsAPI, Appointment } from '../api/appointments';
import { classesAPI, ClassEnrollment } from '../api/classes';
import { membershipsAPI, MembershipSubscription } from '../api/memberships';
import { workoutRoutinesAPI, WorkoutRoutine } from '../api/workoutRoutines';
// @ts-ignore - dayjs sin tipos en este proyecto
import dayjs from 'dayjs';
import 'dayjs/locale/es';
dayjs.locale('es');

interface HomeScreenProps {
  navigation: any;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { isDark } = useAppTheme();
  const { customerName, phone, tenantId, customerId, clearAuth } = useAuthStore();
  const { loadFeatures, clearFeatures, features: tenantFeatures } = useTenantStore();
  const featureFlags = useAppSettingsStore((state) => selectFeatureFlags(state));
  const themeColors = useAppSettingsStore((state) => selectThemeColors(state));
  const [refreshing, setRefreshing] = React.useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [nextAppointment, setNextAppointment] = useState<Appointment | null>(null);
  const [appointmentsCount, setAppointmentsCount] = useState<number>(0);
  const [nextClass, setNextClass] = useState<ClassEnrollment | null>(null);
  const [classesCount, setClassesCount] = useState<number>(0);
  const [classSeriesGroups, setClassSeriesGroups] = useState<
    { key: string; name: string; days: string[]; time: string }[]
  >([]);
  const [membership, setMembership] = useState<MembershipSubscription | null>(null);
  const [routine, setRoutine] = useState<WorkoutRoutine | null>(null);

  // Cargar features del tenant al montar
  React.useEffect(() => {
    if (tenantId) {
      loadFeatures(tenantId);
    }
  }, [tenantId, loadFeatures]);
  
  const loadData = useCallback(async () => {
    if (!tenantId) return;
    try {
      const tasks: Promise<void>[] = [];

      if (phone) {
        tasks.push(
          appointmentsAPI
            .getMyAppointments(phone, tenantId)
            .then((list) => {
              const upcoming = list
                .filter((a) => a.starts_at)
                .sort((a, b) => dayjs(a.starts_at).valueOf() - dayjs(b.starts_at).valueOf());
              setNextAppointment(upcoming[0] || null);
              setAppointmentsCount(upcoming.length);
            })
            .catch(() => setNextAppointment(null))
        );
      }

      // Cargar inscripciones a clases usando customerId/token aunque no haya phone
      tasks.push(
        classesAPI
          .getMyEnrollments(tenantId, { phone: phone || undefined, customerId: customerId || undefined })
          .then((list) => {
            const withSession = list.filter((e) => e.session?.starts_at);
            const upcoming = withSession.sort(
              (a, b) =>
                dayjs(a.session!.starts_at).valueOf() - dayjs(b.session!.starts_at).valueOf()
            );
            setNextClass(upcoming[0] || null);

            // Agrupar por serie para mostrar una sola tarjeta por serie
            const groupsMap = new Map<string, { key: string; name: string; days: Set<string>; time: string }>();
            upcoming.forEach((enr) => {
              const session = enr.session!;
              const key = String(session.class_series_id ?? session.series_name ?? session.id);
              const name = session.series_name || 'Clase';
              const dayLabel = dayjs(session.starts_at).format('ddd');
              const timeLabel = dayjs(session.starts_at).format('HH:mm');
              const existing = groupsMap.get(key);
              if (existing) {
                existing.days.add(dayLabel);
                // Si la hora es más próxima, actualizar
                const existingTime = existing.time;
                if (existingTime !== timeLabel) {
                  existing.time = timeLabel; // mantener última vista; simplificado
                }
              } else {
                groupsMap.set(key, { key, name, days: new Set([dayLabel]), time: timeLabel });
              }
            });
            const groups = Array.from(groupsMap.values()).map((g) => ({
              key: g.key,
              name: g.name,
              days: Array.from(g.days),
              time: g.time,
            }));
            setClassSeriesGroups(groups);
            setClassesCount(groups.length);
          })
          .catch(() => setNextClass(null))
      );

      if (customerId && tenantId) {
        tasks.push(
          membershipsAPI
            .getMyMembership(customerId, tenantId)
            .then((m) => setMembership(m))
            .catch(() => setMembership(null))
        );
      }

      tasks.push(
        workoutRoutinesAPI
          .getMyRoutines()
          .then((list) => setRoutine(list?.[0] || null))
          .catch(() => setRoutine(null))
      );

      await Promise.all(tasks);
    } catch {
      // ignore
    }
  }, [tenantId, phone, customerId]);
  
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadData();
    } catch (error) {
      console.error('Error refreshing data:', error);
      Alert.alert('Error', 'No se pudo actualizar la información');
    } finally {
      setRefreshing(false);
    }
  }, [loadData]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const formatDate = (date?: string) =>
    date ? dayjs(date).format('ddd D MMM, HH:mm') : '';

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro que querés cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
          onPress: () => setShowProfileMenu(false),
        },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAuth();
              await clearFeatures();
              setShowProfileMenu(false);
              // La navegación se manejará automáticamente por el AppNavigator
            } catch (error) {
              console.error('Error al cerrar sesión:', error);
              Alert.alert('Error', 'No se pudo cerrar sesión. Intentá nuevamente.');
            }
          },
        },
      ]
    );
  };
  
  return (
    <View style={[styles.screen, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={themeColors.primary}
            colors={[themeColors.primary]}
            progressBackgroundColor="#ffffff"
          />
        }
      >
        {/* Encabezado */}
        <LinearGradient
          colors={[themeColors.primary, themeColors.secondary || themeColors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroTop}>
            <View style={styles.avatarRow}>
              <View style={styles.avatar}>
                {themeColors.logoUrl ? (
                  <Image source={{ uri: themeColors.logoUrl }} style={styles.avatarImg} resizeMode="cover" />
                ) : (
                  <Text style={styles.avatarText}>{(customerName || 'C').charAt(0)}</Text>
                )}
              </View>
              <View>
                <Text style={styles.greeting}>¡Hola!</Text>
                <Text style={styles.userName}>{customerName || phone || 'Cliente'}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.notifBadge} activeOpacity={0.8}>
              <BellIcon size={22} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <View style={[styles.taskCard, styles.taskCardFlat]}>
            <Text style={styles.taskTitle}>
              {nextAppointment
                ? 'Tu próximo turno'
                : routine
                  ? 'Rutina asignada'
                  : 'Sin turnos por ahora'}
            </Text>
            <Text style={styles.taskSubtitle}>
              {nextAppointment
                ? `${nextAppointment.service_name || 'Servicio'} · ${formatDate(nextAppointment.starts_at)}`
                : routine
                  ? routine.name
                  : 'Agenda un turno y seguí tu progreso'}
            </Text>
            <View style={styles.taskRow}>
              <TouchableOpacity
                style={styles.taskButton}
                activeOpacity={0.9}
                onPress={() => {
                  if (nextAppointment) {
                    navigation.navigate('Turnos');
                  } else {
                    navigation.navigate('Turnos');
                  }
                }}
              >
                <Text style={styles.taskButtonText}>
                  {nextAppointment ? 'Ver turno' : 'Reservar turno'}
                </Text>
              </TouchableOpacity>
              <View style={styles.progressOuter}>
                <View style={styles.progressInner}>
                  <Text style={styles.progressText}>
                    {nextAppointment ? 'Próx' : routine ? 'Rut' : '0%'}
                  </Text>
                </View>
              </View>
              <View style={styles.moreBtn}>
                <Text style={styles.moreBtnText}>···</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Próximos */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Próximos</Text>
          <View style={styles.stackCards}>
            <View style={[styles.stackCard, { borderColor: `${themeColors.primary}25` }]}>
              <View style={styles.stackLeft}>
                <View style={[styles.stackIcon, { backgroundColor: `${themeColors.primary}15` }]}>
                  <CalendarIcon size={20} color={themeColors.primary} />
                </View>
                <View style={styles.stackTextCol}>
                  <Text style={styles.stackTitle}>Turno próximo</Text>
                  <Text style={styles.stackSubtitle}>
                    {nextAppointment ? formatDate(nextAppointment.starts_at) : 'Sin turnos'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.stackCta, { backgroundColor: themeColors.primary }]}
                onPress={() => navigation.navigate('Turnos')}
                activeOpacity={0.9}
              >
                <Text style={styles.stackCtaText}>{nextAppointment ? 'Ver' : 'Reservar'}</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.stackCard, { borderColor: `${themeColors.secondary || themeColors.primary}25` }]}>
              <View style={styles.stackLeft}>
                <View
                  style={[
                    styles.stackIcon,
                    { backgroundColor: `${themeColors.secondary || themeColors.primary}15` },
                  ]}
                >
                  <CoursesIcon size={20} color={themeColors.secondary || themeColors.primary} />
                </View>
                <View style={styles.stackTextCol}>
                  <Text style={styles.stackTitle}>Próxima clase</Text>
                  <Text style={styles.stackSubtitle}>
                    {nextClass?.session
                      ? `${nextClass.session.series_name || 'Clase'} · ${formatDate(nextClass.session.starts_at)}`
                      : 'Sin clases reservadas'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.stackCta, { backgroundColor: themeColors.secondary || themeColors.primary }]}
                onPress={() => navigation.navigate('Classes' as never)}
                activeOpacity={0.9}
              >
                <Text style={styles.stackCtaText}>{nextClass ? 'Ver' : 'Reservar'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Accesos directos */}
        <View style={styles.quickActions}>
          {[
            {
              title: 'Turnos',
              subtitle: 'Reservá o reprogramá',
              icon: CalendarIcon,
              color: themeColors.primary,
              onPress: () => navigation.navigate('Turnos'),
            },
            {
              title: 'Clases',
              subtitle: 'Cupos y agenda',
              icon: CoursesIcon,
              color: themeColors.secondary || themeColors.primary,
              onPress: () => navigation.navigate('Classes' as never),
            },
            {
              title: 'Rutinas',
              subtitle: 'Tu plan diario',
              icon: RoutinesIcon,
              color: '#f59e0b',
              onPress: () => navigation.navigate('Rutinas'),
              hidden: !(featureFlags.routines && (tenantFeatures?.has_routines ?? true)),
            },
            {
              title: 'Membresía',
              subtitle: membership ? 'Activa' : 'Sin membresía',
              icon: CreditCardIcon,
              color: '#13b5cf',
              onPress: () => navigation.navigate('Memberships'),
              hidden: !(tenantFeatures?.has_memberships ?? true),
            },
          ]
            .filter((item) => !item.hidden)
            .map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.quickButton, { borderColor: `${item.color}30` }]}
                activeOpacity={0.9}
                onPress={item.onPress}
              >
                <View style={styles.quickButtonLeft}>
                  <View style={[styles.quickIcon, { backgroundColor: `${item.color}15` }]}>
                    <item.icon size={22} color={item.color} />
                  </View>
                  <View style={styles.quickTextCol}>
                    <Text style={styles.quickTitle}>{item.title}</Text>
                    <Text style={styles.quickSubtitle}>{item.subtitle}</Text>
                  </View>
                </View>
                <Text style={[styles.quickCta, { color: item.color }]}>Ir</Text>
              </TouchableOpacity>
            ))}
        </View>

        {/* En progreso */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>En progreso</Text>
            <Text style={styles.sectionCounter}>6</Text>
          </View>
          <View style={styles.cardsRow}>
            <View style={[styles.progressCard, { backgroundColor: '#e7f1ff' }]}>
              <Text style={styles.cardOverline}>Rutina</Text>
              <Text style={styles.cardTitle}>
                {routine ? routine.name : 'Sin rutina asignada'}
              </Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressBarFill, { width: routine ? '60%' : '10%' }]} />
              </View>
            </View>
            <View style={[styles.progressCard, { backgroundColor: '#ffe8e0' }]}>
              <Text style={styles.cardOverline}>Clases</Text>
              <Text style={styles.cardTitle}>
                {nextClass?.session
                  ? `${nextClass.session.series_name || 'Clase'} · ${formatDate(nextClass.session.starts_at)}`
                  : 'Sin clases reservadas'}
              </Text>
              <View style={[styles.progressBar, { backgroundColor: '#ffd6cb' }]}>
                <View style={[styles.progressBarFill, { width: nextClass ? '40%' : '10%', backgroundColor: '#ff9470' }]} />
              </View>
            </View>
          </View>
        </View>

        {/* Grupos */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Grupos de tareas</Text>
            <Text style={styles.sectionCounter}>4</Text>
          </View>
          {[
            {
              title: 'Turnos próximos',
              tasks: nextAppointment ? formatDate(nextAppointment.starts_at) : 'Sin turnos reservados',
              color: '#7b4bff',
              progress: appointmentsCount,
            },
            {
              title: 'Clases reservadas',
            tasks:
              classSeriesGroups[0]
                ? `${classSeriesGroups[0].name} · ${classSeriesGroups[0].days.join(' ')} ${classSeriesGroups[0].time}`
                : 'Sin clases',
              color: '#ff5fa2',
              progress: classesCount,
            },
            {
              title: 'Rutina del día',
              tasks: routine ? routine.name : 'Asigná una rutina',
              color: '#f7a531',
              progress: routine ? 1 : 0,
            },
            {
              title: 'Membresía',
              tasks: membership ? `Activa · ${membership.plan?.name || ''}` : 'Sin membresía',
              color: '#13b5cf',
              progress: membership ? 'Activa' : 'Sin',
            },
          ].map((item, idx) => (
            <View key={idx} style={styles.groupCard}>
              <View style={[styles.groupIcon, { backgroundColor: `${item.color}20` }]}>
                <Text style={[styles.groupIconText, { color: item.color }]}>•</Text>
              </View>
              <View style={styles.groupText}>
                <Text style={styles.groupTitle}>{item.title}</Text>
                <Text style={styles.groupSubtitle}>{item.tasks}</Text>
              </View>
              <View style={[styles.badge, { borderColor: item.color }]}>
                <Text style={[styles.badgeText, { color: item.color }]}>{item.progress}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  homeContainer: {
    flex: 1,
    backgroundColor: '#f5f9fc',
  },
  homeContainerDark: {
    backgroundColor: '#0e1c2c',
  },
  homeWrapper: {
    flex: 1,
    position: 'relative',
  },
  homeScrollView: {
    flex: 1,
  },
  homeContent: {
    paddingBottom: 100,
  },
  homeHeader: {
    paddingTop: 0,
    paddingBottom: 0,
    marginBottom: 24,
    overflow: 'hidden',
  },
  homeHeaderDark: {
    backgroundColor: '#1e2f3f',
  },
  screen: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  hero: {
    // Más espacio superior para evitar solaparse con la isla dinámica/notch
    paddingTop: Platform.OS === 'ios' ? 88 : (StatusBar.currentHeight || 40) + 16,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: 56,
    height: 56,
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 18,
  },
  greeting: {
    color: '#ffffff',
    fontSize: 14,
    opacity: 0.9,
  },
  userName: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 2,
  },
  notifBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskCard: {
    marginTop: 10,
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  taskCardFlat: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  quickActions: {
    paddingHorizontal: 20,
    paddingTop: 16,
    flexDirection: 'row',
    gap: 12,
  },
  quickButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    minHeight: 70,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  quickButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  quickIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickTextCol: {
    flex: 1,
    minWidth: 0, // permite truncar adecuadamente en iOS/Android
  },
  quickTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  quickSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  quickCta: {
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 0,
  },
  taskTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  taskSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    marginBottom: 8,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  taskButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  taskButtonText: {
    color: '#5a3ef2',
    fontWeight: '700',
  },
  progressOuter: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 8,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    color: '#5a3ef2',
    fontWeight: '800',
  },
  moreBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreBtnText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginTop: -2,
  },
  sectionBlock: {
    paddingHorizontal: 20,
    paddingTop: 22,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  stackCards: {
    gap: 10,
    marginTop: 10,
  },
  stackCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  stackLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  stackIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stackTextCol: {
    flex: 1,
    minWidth: 0,
  },
  stackTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  stackSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  stackCta: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  stackCtaText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  sectionCounter: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7b4bff',
    backgroundColor: '#f0eaff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  progressCard: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardOverline: {
    fontSize: 11,
    color: '#6c7a92',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2a44',
    marginBottom: 10,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#d7e7ff',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 6,
    backgroundColor: '#4b7bff',
    borderRadius: 6,
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  groupIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  groupIconText: {
    fontSize: 20,
    fontWeight: '800',
  },
  groupText: {
    flex: 1,
  },
  groupTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  groupSubtitle: {
    fontSize: 12,
    color: '#7a8699',
    marginTop: 2,
  },
  badge: {
    borderWidth: 2,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 52,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  logoImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  cancelButtonText: {
    color: '#385868',
    fontSize: 16,
    fontWeight: '500',
  },
  cancelButtonTextDark: {
    color: '#90acbc',
  },
});
