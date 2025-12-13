/**
 * Pantalla de Clases - Reservar clases si el lugar las tiene
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/useAuthStore';
import { useTenantStore } from '../store/useTenantStore';
import { useAppTheme } from '../store/useThemeStore';
import { ClassesIcon, CalendarIcon, PlusIcon, CoursesIcon } from '../components/Icons';
import { classesAPI, ClassEnrollment, ClassSession } from '../api/classes';
import { format, parseISO, isPast, isFuture, differenceInHours } from 'date-fns';
import { es } from 'date-fns/locale/es';

const ARJA_PRIMARY_START = '#13b5cf';
const ARJA_PRIMARY_END = '#0d7fd4';

export default function CoursesScreen() {
  const navigation = useNavigation();
  const { isDark } = useAppTheme();
  const { customerId, tenantId, phone } = useAuthStore();
  const { features, loadFeatures, hasFeature, isLoading: isLoadingFeatures } = useTenantStore();
  const [enrollments, setEnrollments] = useState<ClassEnrollment[]>([]);
  const [enrollmentGroups, setEnrollmentGroups] = useState<
    {
      key: string;
      name: string;
      days: string[];
      time: string;
      nextSession: ClassSession;
      enrollment: ClassEnrollment;
      sessions: { enrollment: ClassEnrollment; session: ClassSession }[];
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [enrollmentExpanded, setEnrollmentExpanded] = useState<Record<string, number>>({});

  // Cargar features del tenant al montar
  useEffect(() => {
    if (tenantId) {
      loadFeatures(tenantId);
    }
  }, [tenantId, loadFeatures]);

  const loadData = useCallback(async () => {
    if (!tenantId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    // Esperar a que las features se carguen antes de verificar
    if (isLoadingFeatures) {
      console.log('[CoursesScreen] Esperando a que se carguen las features...');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    // Verificar si el tenant tiene clases habilitadas
    const hasClassesFeature = hasFeature('has_classes');
    if (!hasClassesFeature) {
      console.log('[CoursesScreen] Clases no habilitadas para este negocio - saltando carga de datos');
      setEnrollments([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const enrollmentsData = await classesAPI.getMyEnrollments(tenantId, {
        phone: phone || undefined,
        customerId: customerId || undefined,
      });
      const enrollList = Array.isArray(enrollmentsData) ? enrollmentsData : [];
      setEnrollments(enrollList);

      // Agrupar inscripciones por serie para mostrar una sola tarjeta por serie
      const groupMap = new Map<
        string,
        {
          key: string;
          name: string;
          days: Set<string>;
          time: string;
          nextSession: ClassSession;
          enrollment: ClassEnrollment;
          sessions: { enrollment: ClassEnrollment; session: ClassSession }[];
        }
      >();
      enrollList
        .filter((e) => e.session?.starts_at)
        .forEach((enr) => {
          const session = enr.session!;
          const key = String(session.class_series_id ?? session.series_name ?? session.id);
          const name = session.series_name || 'Clase';
          const dayLabel = format(parseISO(session.starts_at), 'eee', { locale: es });
          const timeLabel = format(parseISO(session.starts_at), 'HH:mm', { locale: es });
          const existing = groupMap.get(key);
          if (existing) {
            existing.days.add(dayLabel);
            // elegir la próxima sesión
            const currentNext = parseISO(existing.nextSession.starts_at);
            const candidate = parseISO(session.starts_at);
            if (isFuture(candidate) && (!isFuture(currentNext) || candidate < currentNext)) {
              existing.nextSession = session;
              existing.enrollment = enr;
              existing.time = timeLabel;
            }
            existing.sessions.push({ enrollment: enr, session });
          } else {
            groupMap.set(key, {
              key,
              name,
              days: new Set([dayLabel]),
              time: timeLabel,
              nextSession: session,
              enrollment: enr,
              sessions: [{ enrollment: enr, session }],
            });
          }
        });
      setEnrollmentGroups(
        Array.from(groupMap.values()).map((g) => ({
          key: g.key,
          name: g.name,
          days: Array.from(g.days),
          time: g.time,
          nextSession: g.nextSession,
          enrollment: g.enrollment,
          sessions: g.sessions,
        }))
      );
    } catch (error: any) {
      if (error.response?.status === 404) {
        // El lugar no tiene clases habilitadas
        console.log('[CoursesScreen] No hay clases disponibles (404)');
        setEnrollments([]);
      } else if (error.response) {
        // Error del servidor con respuesta
        Alert.alert('Error', `No se pudieron cargar las inscripciones: ${error.response?.data?.error || error.message}`);
      } else {
        // Error de red - solo loguear como info, mostrar estado vacío
        console.log('[CoursesScreen] Backend no disponible - mostrando estado vacío de inscripciones');
        setEnrollments([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tenantId, phone, hasFeature, features, isLoadingFeatures]);

  // Cargar datos cuando las features estén listas
  useEffect(() => {
    if (!isLoadingFeatures && tenantId) {
      loadData();
    }
  }, [isLoadingFeatures, loadData, tenantId]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const canCancelSession = (startsAt: string) =>
    differenceInHours(parseISO(startsAt), new Date()) >= 24;

  const handleCancelEnrollment = (enrollment: ClassEnrollment) => {
    Alert.alert(
      'Cancelar reserva',
      '¿Estás seguro de cancelar tu reserva?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              await classesAPI.cancelEnrollment(enrollment.id, tenantId!);
              Alert.alert('Reserva cancelada', 'Tu reserva ha sido cancelada');
              await loadData();
            } catch (error) {
              Alert.alert('Error', 'No se pudo cancelar la reserva');
            }
          },
        },
      ]
    );
  };

  const isSessionPast = (session: ClassSession) => {
    return isPast(parseISO(session.ends_at));
  };

  if (loading) {
    return (
      <View style={[styles.screenContainer, isDark && styles.screenContainerDark, styles.centerContent]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <ActivityIndicator size="large" color={ARJA_PRIMARY_START} />
        <Text style={[styles.loadingText, isDark && styles.loadingTextDark]}>Cargando clases...</Text>
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
        style={styles.headerGradient}
      >
        <View style={[styles.header, styles.headerOnGradient]}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <CalendarIcon size={22} color="#ffffff" />
            <Text style={styles.headerTitle}>Clases</Text>
          </View>
          <TouchableOpacity
            style={styles.primaryCta}
            onPress={() => navigation.navigate('AvailableClasses' as never)}
            activeOpacity={0.9}
          >
            <PlusIcon size={16} color="#0f172a" />
            <Text style={styles.primaryCtaText}>Reservar</Text>
          </TouchableOpacity>
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
        {enrollmentGroups.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ClassesIcon size={64} color={isDark ? '#4FD4E4' : ARJA_PRIMARY_START} />
            <Text style={[styles.emptyTitle, isDark && styles.emptyTitleDark]}>
              No tienes reservas
            </Text>
            <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
              Aún no te has inscrito a ninguna clase
            </Text>
            <TouchableOpacity
              style={styles.availableCta}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('AvailableClasses' as never)}
            >
              <Text style={styles.availableCtaText}>Ver clases disponibles</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Mis Reservas */}
            {enrollmentGroups.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
                    Mis Reservas
                  </Text>
                  <View style={styles.sectionBadge}>
                    <Text style={styles.sectionBadgeText}>{enrollmentGroups.length}</Text>
                  </View>
                </View>
                {enrollmentGroups.map((group) => {
                  const session = group.nextSession;
                  const isPast = isSessionPast(session);
                  const daysLabel = `${group.days.join(' ')} ${group.time}`;
                  const expandedCount = enrollmentExpanded[group.key] ?? 0;
                  const visibleEnrolled = group.sessions.slice(0, expandedCount || 0);
                  return (
                    <View
                      key={group.key}
                      style={[styles.enrollmentCard, isDark && styles.enrollmentCardDark]}
                    >
                      <TouchableOpacity
                        style={styles.enrollmentHeader}
                        activeOpacity={0.9}
                        onPress={() => {
                          if (expandedCount > 0) {
                            setEnrollmentExpanded((prev) => ({ ...prev, [group.key]: 0 }));
                          } else {
                            const initial = Math.min(5, group.sessions.length);
                            setEnrollmentExpanded((prev) => ({ ...prev, [group.key]: initial }));
                          }
                        }}
                      >
                        <View style={styles.enrollmentHeaderLeft}>
                          <View style={[styles.enrollmentIcon, { backgroundColor: '#e0f2fe' }]}>
                            <CoursesIcon size={18} color="#0f172a" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.enrollmentTitle, isDark && styles.enrollmentTitleDark]}>
                              {group.name}
                            </Text>
                            <Text style={[styles.enrollmentDays, isDark && styles.enrollmentDaysDark]}>
                              {daysLabel}
                            </Text>
                          </View>
                        </View>
                        {isPast ? (
                          <View style={[styles.badge, styles.pastBadge]}>
                            <Text style={styles.badgeText}>Finalizada</Text>
                          </View>
                        ) : (
                          <View style={[styles.badge, styles.upcomingBadge]}>
                            <Text style={styles.badgeText}>Próxima</Text>
                          </View>
                        )}
                        <Text style={styles.expandIndicator}>{expandedCount > 0 ? '▲' : '▼'}</Text>
                      </TouchableOpacity>
                      <View style={styles.enrollmentInfoRow}>
                        <CalendarIcon size={16} color={isDark ? '#90acbc' : '#385868'} />
                        <Text style={[styles.enrollmentDate, isDark && styles.enrollmentDateDark]}>
                          {format(parseISO(session.starts_at), "EEEE, dd 'de' MMMM 'a las' HH:mm", { locale: es })}
                        </Text>
                      </View>
                      {session.instructor_name && (
                        <Text style={[styles.enrollmentInstructor, isDark && styles.enrollmentInstructorDark]}>
                          Instructor: {session.instructor_name}
                        </Text>
                      )}
                      {!isPast && (
                        <TouchableOpacity
                          style={[
                            styles.cancelButton,
                            differenceInHours(parseISO(session.starts_at), new Date()) < 24 && styles.cancelButtonDisabled,
                          ]}
                          disabled={differenceInHours(parseISO(session.starts_at), new Date()) < 24}
                          onPress={() => {
                            if (differenceInHours(parseISO(session.starts_at), new Date()) < 24) {
                              Alert.alert('No se puede cancelar', 'Solo podés cancelar hasta 24h antes.');
                              return;
                            }
                            handleCancelEnrollment(group.enrollment);
                          }}
                        >
                          <Text
                            style={[
                              styles.cancelButtonText,
                              differenceInHours(parseISO(session.starts_at), new Date()) < 24 && styles.cancelButtonTextDisabled,
                            ]}
                          >
                            Cancelar próxima
                          </Text>
                        </TouchableOpacity>
                      )}
                      {expandedCount > 0 && (
                        <View style={styles.enrolledSessions}>
                          {visibleEnrolled.map((item) => (
                            <View
                              key={item.session.id}
                              style={[
                                styles.enrolledSessionRow,
                                isDark && styles.enrolledSessionRowDark,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.enrolledSessionText,
                                  isDark && styles.enrolledSessionTextDark,
                                ]}
                              >
                                {format(parseISO(item.session.starts_at), "eee dd MMM · HH:mm", { locale: es })}
                              </Text>
                              {!isPast && (
                                <TouchableOpacity
                                  style={[
                                    styles.sessionCancelBtn,
                                    !canCancelSession(item.session.starts_at) && styles.sessionCancelBtnDisabled,
                                  ]}
                                  disabled={!canCancelSession(item.session.starts_at)}
                                  onPress={() => {
                                    if (!canCancelSession(item.session.starts_at)) {
                                      Alert.alert('No se puede cancelar', 'Solo podés cancelar hasta 24h antes.');
                                      return;
                                    }
                                    handleCancelEnrollment(item.enrollment);
                                  }}
                                >
                                  <Text
                                    style={[
                                      styles.sessionCancelText,
                                      !canCancelSession(item.session.starts_at) && styles.sessionCancelTextDisabled,
                                    ]}
                                  >
                                    Cancelar
                                  </Text>
                                </TouchableOpacity>
                              )}
                            </View>
                          ))}
                          {group.sessions.length > expandedCount && (
                            <TouchableOpacity
                              style={styles.loadMoreBtn}
                              onPress={() =>
                                setEnrollmentExpanded((prev) => ({
                                  ...prev,
                                  [group.key]: Math.min((prev[group.key] || 0) + 5, group.sessions.length),
                                }))
                              }
                            >
                              <Text style={styles.loadMoreText}>Cargar más</Text>
                            </TouchableOpacity>
                          )}
                          {!isPast && (
                            <TouchableOpacity
                              style={styles.seriesCancelBtn}
                              onPress={async () => {
                                const blocked = group.sessions.some(
                                  (s) => !canCancelSession(s.session.starts_at)
                                );
                                if (blocked) {
                                  Alert.alert(
                                    'No se puede cancelar',
                                    'Hay sesiones a menos de 24h. Contactá al negocio para cancelar la serie.'
                                  );
                                  return;
                                }
                                for (const s of group.sessions) {
                                  await handleCancelEnrollment(s.enrollment);
                                }
                              }}
                            >
                              <Text style={styles.seriesCancelText}>Cancelar serie</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {/* CTA a pantalla separada de Clases Disponibles */}
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.availableCta}
                activeOpacity={0.9}
                onPress={() => navigation.navigate('AvailableClasses' as never)}
              >
                <Text style={styles.availableCtaText}>Ver clases disponibles</Text>
              </TouchableOpacity>
            </View>
          </>
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
  headerGradient: {
    paddingTop: 52,
    paddingBottom: 14,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerOnGradient: {
    paddingTop: 0,
    paddingBottom: 0,
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
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  placeholder: {
    width: 40,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 400,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#051420',
    marginTop: 24,
    marginBottom: 8,
  },
  emptyTitleDark: {
    color: '#e6f2f8',
  },
  emptyText: {
    fontSize: 16,
    color: '#385868',
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyTextDark: {
    color: '#90acbc',
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
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionBadge: {
    minWidth: 28,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
  },
  sectionBadgeText: {
    color: '#075985',
    fontWeight: '700',
    fontSize: 12,
  },
  primaryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  primaryCtaText: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 13,
  },
  availableCta: {
    backgroundColor: ARJA_PRIMARY_START,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 8,
  },
  availableCtaText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  enrollmentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  enrollmentCardDark: {
    backgroundColor: '#1e2f3f',
    borderRadius: 14,
    padding: 14,
  },
  enrollmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  enrollmentHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  enrollmentIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enrollmentTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#051420',
    flex: 1,
  },
  enrollmentTitleDark: {
    color: '#e6f2f8',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pastBadge: {
    backgroundColor: '#e5e7eb',
  },
  upcomingBadge: {
    backgroundColor: '#dcfce7',
  },
  badgeText: {
    color: '#111827',
    fontSize: 11,
    fontWeight: '700',
  },
  enrollmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  enrollmentInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  enrollmentDate: {
    fontSize: 14,
    color: '#385868',
  },
  enrollmentDateDark: {
    color: '#90acbc',
  },
  enrollmentInstructor: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 12,
  },
  enrollmentInstructorDark: {
    color: '#9ca3af',
  },
  enrollmentDays: {
    fontSize: 13,
    color: '#4b5563',
    marginBottom: 6,
  },
  enrollmentDaysDark: {
    color: '#9ca3af',
  },
  enrolledSessions: {
    marginTop: 8,
    gap: 6,
  },
  enrolledSessionRow: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  enrolledSessionRowDark: {
    backgroundColor: '#132235',
  },
  enrolledSessionTextDark: {
    color: '#e5e7eb',
  },
  enrolledSessionText: {
    fontSize: 13,
    color: '#111827',
  },
  sessionCancelBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#fee2e2',
  },
  sessionCancelBtnDisabled: {
    backgroundColor: '#f3f4f6',
  },
  sessionCancelText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#b91c1c',
  },
  sessionCancelTextDisabled: {
    color: '#6b7280',
  },
  seriesCancelBtn: {
    marginTop: 8,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  seriesCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#b91c1c',
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
    alignSelf: 'flex-start',
  },
  cancelButtonText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButtonDisabled: {
    opacity: 0.5,
  },
  cancelButtonTextDisabled: {
    color: '#9ca3af',
  },
  bulkButton: {
    marginTop: 8,
    backgroundColor: ARJA_PRIMARY_START,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulkButtonDisabled: {
    opacity: 0.5,
  },
  bulkButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  loadMoreBtn: {
    marginTop: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  loadMoreText: {
    color: ARJA_PRIMARY_START,
    fontWeight: '700',
    fontSize: 13,
  },
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  filterPillActive: {
    backgroundColor: '#e0f2fe',
    borderColor: '#38bdf8',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  filterPillTextActive: {
    color: '#0369a1',
  },
  classCard: {
    marginBottom: 16,
  },
  classCardContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  classCardContentDark: {
    backgroundColor: '#1e2f3f',
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  className: {
    fontSize: 18,
    fontWeight: '700',
    color: '#051420',
    flex: 1,
  },
  classNameDark: {
    color: '#e6f2f8',
  },
  classMeta: {
    fontSize: 13,
    color: '#0f172a',
    marginBottom: 4,
  },
  classMetaDark: {
    color: '#e5e7eb',
  },
  expandIndicator: {
    fontSize: 16,
    color: ARJA_PRIMARY_START,
  },
  classDescription: {
    fontSize: 14,
    color: '#385868',
    marginBottom: 8,
    lineHeight: 20,
  },
  classDescriptionDark: {
    color: '#90acbc',
  },
  classInstructor: {
    fontSize: 13,
    color: '#6b7280',
  },
  classInstructorDark: {
    color: '#9ca3af',
  },
  classHint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  classHintDark: {
    color: '#9ca3af',
  },
  sessionsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  noSessionsText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    padding: 16,
  },
  noSessionsTextDark: {
    color: '#9ca3af',
  },
  sessionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  sessionCardDark: {
    backgroundColor: '#0e1c2c',
  },
  sessionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  sessionDetails: {
    flex: 1,
  },
  sessionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  sessionDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#051420',
    marginBottom: 2,
  },
  sessionDateDark: {
    color: '#e6f2f8',
  },
  sessionPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#e0f2fe',
  },
  sessionPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#075985',
  },
  sessionPillGhost: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  sessionPillGhostText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4b5563',
  },
  enrollButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: ARJA_PRIMARY_START,
  },
  enrollButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  enrollButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  enrollButtonTextDisabled: {
    color: '#6b7280',
  },
});
