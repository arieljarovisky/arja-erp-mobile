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
import { useAppTheme } from '../store/useThemeStore';
import { useAppSettingsStore, selectFeatureFlags, selectThemeColors } from '../store/useAppSettingsStore';
import { CalendarIcon, PlusIcon, ClassesIcon, CreditCardIcon, UserIcon, RoutinesIcon, BellIcon, CoursesIcon, SettingsIcon } from '../components/Icons';
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
  const isDarkMode = Boolean(isDark);
  const { customerName, phone, tenantId, customerId, picture, clearAuth } = useAuthStore();
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
    <View style={[styles.screen, isDarkMode && styles.screenDark, { backgroundColor: isDarkMode ? '#0e1c2c' : themeColors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />
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
          colors={['#0d7fd4', '#13b5cf']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroTop}>
            <View style={styles.avatarRow}>
              <View style={styles.avatar}>
                {picture ? (
                  <Image source={{ uri: picture }} style={styles.avatarImg} resizeMode="cover" />
                ) : themeColors.logoUrl ? (
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
            <View style={styles.headerRight}>
              <TouchableOpacity 
                style={styles.settingsButton} 
                activeOpacity={0.8}
                onPress={() => navigation.navigate('Settings' as never)}
              >
                <SettingsIcon size={20} color="#ffffff" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.notifBadge} 
                activeOpacity={0.8}
                onPress={() => {
                  // Navegar al tab de Notificaciones usando el navegador padre (Tab Navigator)
                  const tabNavigator = navigation.getParent()?.getParent();
                  if (tabNavigator) {
                    tabNavigator.navigate('Notificaciones' as never);
                  } else {
                    // Fallback: intentar con el padre directo
                    const parent = navigation.getParent();
                    if (parent) {
                      parent.navigate('Notificaciones' as never);
                    } else {
                      navigation.navigate('Notificaciones' as never);
                    }
                  }
                }}
              >
                <BellIcon size={22} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Card principal: muestra turno próximo o rutina activa */}
          {(nextAppointment || routine) && (
            <View style={[styles.taskCard, styles.taskCardFlat]}>
              {nextAppointment ? (
                <>
                  <View style={styles.taskHeader}>
                    <View style={styles.taskHeaderLeft}>
                      <Text style={styles.taskLabel}>Próximo turno</Text>
                      <Text style={styles.taskTitle}>
                        {nextAppointment.service_name || 'Servicio'}
                      </Text>
                      <Text style={styles.taskSubtitle}>
                        {formatDate(nextAppointment.starts_at)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.taskButton}
                      activeOpacity={0.9}
                      onPress={() => navigation.navigate('Turnos')}
                    >
                      <Text style={styles.taskButtonText}>Ver</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : routine ? (
                <>
                  <View style={styles.taskHeader}>
                    <View style={styles.taskHeaderLeft}>
                      <Text style={styles.taskLabel}>Rutina activa</Text>
                      <Text style={styles.taskTitle} numberOfLines={1}>
                        {routine.name}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.taskButton}
                      activeOpacity={0.9}
                      onPress={() => navigation.navigate('WorkoutRoutineDetail' as never, { routineId: routine.id } as never)}
                    >
                      <Text style={styles.taskButtonText}>Ver</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : null}
            </View>
          )}
          
          {/* Si no hay turno ni rutina, mostrar CTA para reservar */}
          {!nextAppointment && !routine && (
            <View style={[styles.taskCard, styles.taskCardFlat]}>
              <View style={styles.taskHeader}>
                <View style={styles.taskHeaderLeft}>
                  <Text style={styles.taskLabel}>¡Empezá ahora!</Text>
                  <Text style={styles.taskTitle}>
                    Reservá tu primer turno
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.taskButton}
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate('Turnos')}
                >
                  <Text style={styles.taskButtonText}>Reservar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </LinearGradient>

        {/* Próximos */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>Próximos</Text>
          <View style={styles.stackCards}>
            <View style={[styles.stackCard, isDarkMode && styles.stackCardDark, { borderColor: `${themeColors.primary}25` }]}>
              <View style={styles.stackLeft}>
                <View style={[styles.stackIcon, { backgroundColor: `${themeColors.primary}15` }]}>
                  <CalendarIcon size={20} color={themeColors.primary} />
                </View>
                <View style={styles.stackTextCol}>
                  <Text style={[styles.stackTitle, isDarkMode && styles.stackTitleDark]}>Turno próximo</Text>
                  <Text style={[styles.stackSubtitle, isDarkMode && styles.stackSubtitleDark]}>
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

            <View style={[styles.stackCard, isDarkMode && styles.stackCardDark, { borderColor: '#13b5cf25' }]}>
              <View style={styles.stackLeft}>
                <View
                  style={[
                    styles.stackIcon,
                    { backgroundColor: '#13b5cf15' },
                  ]}
                >
                  <CoursesIcon size={20} color="#13b5cf" />
                </View>
                <View style={styles.stackTextCol}>
                  <Text style={[styles.stackTitle, isDarkMode && styles.stackTitleDark]}>Próxima clase</Text>
                  <Text style={[styles.stackSubtitle, isDarkMode && styles.stackSubtitleDark]}>
                    {nextClass?.session
                      ? `${nextClass.session.series_name || 'Clase'} · ${formatDate(nextClass.session.starts_at)}`
                      : 'Sin clases reservadas'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.stackCta, { backgroundColor: '#13b5cf' }]}
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
              color: '#0d7fd4', // Azul primario ARJA
              onPress: () => navigation.navigate('Turnos'),
            },
            {
              title: 'Clases',
              subtitle: 'Cupos y agenda',
              icon: CoursesIcon,
              color: '#13b5cf', // Cyan primario ARJA
              onPress: () => navigation.navigate('Classes' as never),
            },
            {
              title: 'Rutinas',
              subtitle: 'Tu plan diario',
              icon: RoutinesIcon,
              color: '#f59e0b', // Naranja/warning ARJA
              onPress: () => navigation.navigate('Rutinas'),
              hidden: !(featureFlags.routines && (tenantFeatures?.has_routines ?? true)),
            },
            {
              title: 'Plan',
              subtitle: membership ? 'Activa' : 'Sin membresía',
              icon: CreditCardIcon,
              color: '#34d399', // Verde/success ARJA
              onPress: () => navigation.navigate('Membresías' as never),
              hidden: !(tenantFeatures?.has_memberships ?? true),
            },
          ]
            .filter((item) => !item.hidden)
            .map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.quickButton, isDarkMode && styles.quickButtonDark, { borderColor: `${item.color}30` }]}
                activeOpacity={0.9}
                onPress={item.onPress}
              >
                <View style={[styles.quickIcon, { backgroundColor: `${item.color}15` }]}>
                  <item.icon size={24} color={item.color} />
                </View>
                <Text style={[styles.quickCta, { color: item.color, marginTop: 8 }]} numberOfLines={1}>{item.title}</Text>
              </TouchableOpacity>
            ))}
        </View>

        {/* Actividades */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>Actividades</Text>
            <Text style={[styles.sectionCounter, isDarkMode && styles.sectionCounterDark]}>6</Text>
          </View>
          <View style={styles.cardsRow}>
            <View style={[styles.progressCard, isDarkMode && styles.progressCardDark, { backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)' }]}>
              <Text style={[styles.cardOverline, isDarkMode && styles.cardOverlineDark]}>Rutina</Text>
              <Text style={[styles.cardTitle, isDarkMode && styles.cardTitleDark]}>
                {routine ? routine.name : 'Sin rutina asignada'}
              </Text>
            </View>
            <View style={[styles.progressCard, isDarkMode && styles.progressCardDark, { backgroundColor: isDarkMode ? 'rgba(19, 181, 207, 0.15)' : 'rgba(19, 181, 207, 0.1)' }]}>
              <Text style={[styles.cardOverline, isDarkMode && styles.cardOverlineDark]}>Clases</Text>
              <Text style={[styles.cardTitle, isDarkMode && styles.cardTitleDark]}>
                {nextClass?.session
                  ? `${nextClass.session.series_name || 'Clase'} · ${formatDate(nextClass.session.starts_at)}`
                  : 'Sin clases reservadas'}
              </Text>
            </View>
          </View>
        </View>

        {/* Resumen */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>Resumen</Text>
            <Text style={[styles.sectionCounter, isDarkMode && styles.sectionCounterDark]}>4</Text>
          </View>
          {[
            {
              title: 'Turnos próximos',
              tasks: nextAppointment ? formatDate(nextAppointment.starts_at) : 'Sin turnos reservados',
              color: '#0d7fd4', // Azul primario ARJA
              progress: appointmentsCount,
            },
            {
              title: 'Clases reservadas',
            tasks:
              classSeriesGroups[0]
                ? `${classSeriesGroups[0].name} · ${classSeriesGroups[0].days.join(' ')} ${classSeriesGroups[0].time}`
                : 'Sin clases',
              color: '#13b5cf', // Cyan primario ARJA
              progress: classesCount,
            },
            {
              title: 'Rutina del día',
              tasks: routine ? routine.name : 'Asigná una rutina',
              color: '#f59e0b', // Naranja/warning ARJA
              progress: routine ? 1 : 0,
            },
            {
              title: 'Membresía',
              tasks: membership ? `Activa · ${membership.plan?.name || ''}` : 'Sin membresía',
              color: '#34d399', // Verde/success ARJA
              progress: membership ? 'Activa' : 'Sin',
            },
          ].map((item, idx) => (
            <View key={idx} style={[styles.groupCard, isDarkMode && styles.groupCardDark]}>
              <View style={[styles.groupIcon, { backgroundColor: `${item.color}20` }]}>
                <Text style={[styles.groupIconText, { color: item.color }]}>•</Text>
              </View>
              <View style={styles.groupText}>
                <Text style={[styles.groupTitle, isDarkMode && styles.groupTitleDark]}>{item.title}</Text>
                <Text style={[styles.groupSubtitle, isDarkMode && styles.groupSubtitleDark]}>{item.tasks}</Text>
              </View>
              <View style={[styles.badge, isDarkMode && styles.badgeDark, { borderColor: item.color }]}>
                <Text style={[styles.badgeText, { color: item.color }]}>{typeof item.progress === 'number' ? item.progress : item.progress}</Text>
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
  screenDark: {
    backgroundColor: '#0e1c2c',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  hero: {
    // Espacio superior reducido
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 40) + 8,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    backgroundColor: '#0d7fd4', // Fondo sólido para mejor contraste
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
    fontWeight: '600',
    opacity: 1,
  },
  userName: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
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
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 90,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  quickButtonDark: {
    backgroundColor: '#1e2f3f',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickCta: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  taskHeaderLeft: {
    flex: 1,
    minWidth: 0,
  },
  taskLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  taskTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  taskSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '500',
  },
  taskButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 70,
    alignItems: 'center',
  },
  taskButtonText: {
    color: '#0d7fd4',
    fontWeight: '700',
    fontSize: 14,
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
  sectionTitleDark: {
    color: '#ffffff',
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
  stackCardDark: {
    backgroundColor: '#1e2f3f',
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
  stackTitleDark: {
    color: '#ffffff',
  },
  stackSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  stackSubtitleDark: {
    color: '#90acbc',
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
    color: '#0d7fd4',
    backgroundColor: 'rgba(13, 127, 212, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  sectionCounterDark: {
    color: '#4FD4E4',
    backgroundColor: 'rgba(79, 212, 228, 0.15)',
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
  progressCardDark: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardOverline: {
    fontSize: 11,
    color: '#6c7a92',
    marginBottom: 6,
  },
  cardOverlineDark: {
    color: '#90acbc',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2a44',
    marginBottom: 10,
  },
  cardTitleDark: {
    color: '#ffffff',
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
  groupCardDark: {
    backgroundColor: '#1e2f3f',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
  groupTitleDark: {
    color: '#ffffff',
  },
  groupSubtitle: {
    fontSize: 12,
    color: '#7a8699',
    marginTop: 2,
  },
  groupSubtitleDark: {
    color: '#90acbc',
  },
  badge: {
    borderWidth: 2,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 52,
    alignItems: 'center',
  },
  badgeDark: {
    borderColor: 'rgba(255, 255, 255, 0.2)',
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
