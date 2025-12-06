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
import { useAuthStore } from '../store/useAuthStore';
import { useTenantStore } from '../store/useTenantStore';
import { useAppTheme } from '../utils/useAppTheme';
import { ClassesIcon, CalendarIcon } from '../components/Icons';
import { classesAPI, ClassSeries, ClassSession, ClassEnrollment } from '../api/classes';
import { format, parseISO, isPast, isFuture } from 'date-fns';
import { es } from 'date-fns/locale/es';

const ARJA_PRIMARY_START = '#13b5cf';
const ARJA_PRIMARY_END = '#0d7fd4';

export default function CoursesScreen({ navigation }: any) {
  const { isDark } = useAppTheme();
  const { customerId, tenantId, phone } = useAuthStore();
  const { features, loadFeatures, hasFeature } = useTenantStore();
  const [classes, setClasses] = useState<ClassSeries[]>([]);
  const [enrollments, setEnrollments] = useState<ClassEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState<ClassSeries | null>(null);
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Cargar features del tenant al montar
  useEffect(() => {
    if (tenantId) {
      loadFeatures(tenantId);
    }
  }, [tenantId, loadFeatures]);

  const loadData = useCallback(async () => {
    if (!tenantId || !phone) {
      setLoading(false);
      return;
    }

    // Verificar si el tenant tiene clases habilitadas
    if (!hasFeature('has_classes')) {
      console.log('Clases no habilitadas para este negocio');
      setClasses([]);
      setEnrollments([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const [classesData, enrollmentsData] = await Promise.all([
        classesAPI.getClasses(tenantId),
        classesAPI.getMyEnrollments(phone, tenantId),
      ]);
      setClasses(classesData);
      setEnrollments(enrollmentsData);
    } catch (error: any) {
      if (error.response?.status === 404) {
        // El lugar no tiene clases habilitadas
        console.log('No hay clases disponibles');
        setClasses([]);
      } else if (error.response) {
        // Error del servidor con respuesta
        console.error('Error cargando clases:', error);
        Alert.alert('Error', 'No se pudieron cargar las clases');
      } else {
        // Error de red - solo loguear como info, mostrar estado vacío
        console.log('Backend no disponible - mostrando estado vacío de clases');
        setClasses([]);
      }
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

  const loadSessions = async (series: ClassSeries) => {
    setLoadingSessions(true);
    setSelectedSeries(series);
    try {
      const sessionsData = await classesAPI.getClassSessions(series.id, tenantId!);
      setSessions(sessionsData);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar las sesiones');
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleEnroll = async (session: ClassSession) => {
    if (!customerId || !tenantId) {
      Alert.alert('Error', 'No se pudo identificar tu cuenta');
      return;
    }

    // Verificar si ya está inscrito
    const alreadyEnrolled = enrollments.some(
      (e) => e.class_session_id === session.id
    );
    if (alreadyEnrolled) {
      Alert.alert('Ya estás inscrito', 'Ya tienes una reserva para esta clase');
      return;
    }

    // Verificar capacidad
    if (session.max_capacity && session.current_enrollments) {
      if (session.current_enrollments >= session.max_capacity) {
        Alert.alert('Clase llena', 'Esta clase ya alcanzó su capacidad máxima');
        return;
      }
    }

    Alert.alert(
      'Reservar clase',
      `¿Confirmar reserva para la clase del ${format(parseISO(session.starts_at), "dd 'de' MMMM 'a las' HH:mm", { locale: es })}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              await classesAPI.enrollToClass(session.id, customerId, tenantId);
              Alert.alert('Éxito', 'Te has inscrito a la clase correctamente');
              await loadData();
              setSelectedSeries(null);
              setSessions([]);
            } catch (error: any) {
              Alert.alert(
                'Error',
                error.response?.data?.message || 'No se pudo realizar la reserva'
              );
            }
          },
        },
      ]
    );
  };

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
              await classesAPI.cancelEnrollment(enrollment.id);
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

  const isEnrolled = (sessionId: number) => {
    return enrollments.some((e) => e.class_session_id === sessionId);
  };

  const isSessionPast = (session: ClassSession) => {
    return isPast(parseISO(session.ends_at));
  };

  const isSessionFull = (session: ClassSession) => {
    if (!session.max_capacity || !session.current_enrollments) return false;
    return session.current_enrollments >= session.max_capacity;
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
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTitleContainer}>
            <ClassesIcon size={28} color="#ffffff" />
            <Text style={styles.headerTitle}>Clases</Text>
          </View>
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
        {classes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ClassesIcon size={64} color={isDark ? '#4FD4E4' : ARJA_PRIMARY_START} />
            <Text style={[styles.emptyTitle, isDark && styles.emptyTitleDark]}>
              No hay clases disponibles
            </Text>
            <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
              Este lugar no tiene clases habilitadas actualmente
            </Text>
          </View>
        ) : (
          <>
            {/* Mis Reservas */}
            {enrollments.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
                  Mis Reservas
                </Text>
                {enrollments.map((enrollment) => {
                  const session = enrollment.session;
                  if (!session) return null;
                  const isPast = isSessionPast(session);
                  
                  return (
                    <View
                      key={enrollment.id}
                      style={[styles.enrollmentCard, isDark && styles.enrollmentCardDark]}
                    >
                      <View style={styles.enrollmentHeader}>
                        <Text style={[styles.enrollmentTitle, isDark && styles.enrollmentTitleDark]}>
                          {session.series_name || 'Clase'}
                        </Text>
                        {isPast ? (
                          <View style={[styles.badge, styles.pastBadge]}>
                            <Text style={styles.badgeText}>Finalizada</Text>
                          </View>
                        ) : (
                          <View style={[styles.badge, styles.upcomingBadge]}>
                            <Text style={styles.badgeText}>Próxima</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.enrollmentInfo}>
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
                          style={styles.cancelButton}
                          onPress={() => handleCancelEnrollment(enrollment)}
                        >
                          <Text style={styles.cancelButtonText}>Cancelar reserva</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {/* Clases Disponibles */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
                Clases Disponibles
              </Text>
              {classes.map((classSeries) => (
                <View key={classSeries.id} style={styles.classCard}>
                  <TouchableOpacity
                    style={[styles.classCardContent, isDark && styles.classCardContentDark]}
                    onPress={() => loadSessions(classSeries)}
                  >
                    <View style={styles.classHeader}>
                      <Text style={[styles.className, isDark && styles.classNameDark]}>
                        {classSeries.name}
                      </Text>
                      {selectedSeries?.id === classSeries.id && (
                        <Text style={styles.expandIndicator}>▼</Text>
                      )}
                    </View>
                    {classSeries.description && (
                      <Text style={[styles.classDescription, isDark && styles.classDescriptionDark]}>
                        {classSeries.description}
                      </Text>
                    )}
                    {classSeries.instructor_name && (
                      <Text style={[styles.classInstructor, isDark && styles.classInstructorDark]}>
                        Instructor: {classSeries.instructor_name}
                      </Text>
                    )}
                  </TouchableOpacity>

                  {selectedSeries?.id === classSeries.id && (
                    <View style={styles.sessionsContainer}>
                      {loadingSessions ? (
                        <ActivityIndicator size="small" color={ARJA_PRIMARY_START} />
                      ) : sessions.length === 0 ? (
                        <Text style={[styles.noSessionsText, isDark && styles.noSessionsTextDark]}>
                          No hay sesiones disponibles
                        </Text>
                      ) : (
                        sessions.map((session) => {
                          const enrolled = isEnrolled(session.id);
                          const past = isSessionPast(session);
                          const full = isSessionFull(session);

                          return (
                            <View
                              key={session.id}
                              style={[styles.sessionCard, isDark && styles.sessionCardDark]}
                            >
                              <View style={styles.sessionInfo}>
                                <CalendarIcon size={16} color={isDark ? '#90acbc' : '#385868'} />
                                <View style={styles.sessionDetails}>
                                  <Text style={[styles.sessionDate, isDark && styles.sessionDateDark]}>
                                    {format(parseISO(session.starts_at), "EEEE, dd 'de' MMMM", { locale: es })}
                                  </Text>
                                  <Text style={[styles.sessionTime, isDark && styles.sessionTimeDark]}>
                                    {format(parseISO(session.starts_at), 'HH:mm')} -{' '}
                                    {format(parseISO(session.ends_at), 'HH:mm')}
                                  </Text>
                                  {session.max_capacity && (
                                    <Text style={[styles.sessionCapacity, isDark && styles.sessionCapacityDark]}>
                                      {session.current_enrollments || 0}/{session.max_capacity} cupos
                                    </Text>
                                  )}
                                </View>
                              </View>
                              {!past && (
                                <TouchableOpacity
                                  style={[
                                    styles.enrollButton,
                                    (enrolled || full) && styles.enrollButtonDisabled,
                                  ]}
                                  onPress={() => handleEnroll(session)}
                                  disabled={enrolled || full}
                                >
                                  <Text
                                    style={[
                                      styles.enrollButtonText,
                                      (enrolled || full) && styles.enrollButtonTextDisabled,
                                    ]}
                                  >
                                    {enrolled ? 'Inscrito' : full ? 'Llena' : 'Reservar'}
                                  </Text>
                                </TouchableOpacity>
                              )}
                            </View>
                          );
                        })
                      )}
                    </View>
                  )}
                </View>
              ))}
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
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleContainer: {
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
  enrollmentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  enrollmentCardDark: {
    backgroundColor: '#1e2f3f',
  },
  enrollmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
    backgroundColor: '#6b7280',
  },
  upcomingBadge: {
    backgroundColor: '#10b981',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  enrollmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
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
  sessionDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#051420',
    marginBottom: 2,
  },
  sessionDateDark: {
    color: '#e6f2f8',
  },
  sessionTime: {
    fontSize: 13,
    color: '#385868',
    marginBottom: 4,
  },
  sessionTimeDark: {
    color: '#90acbc',
  },
  sessionCapacity: {
    fontSize: 12,
    color: '#6b7280',
  },
  sessionCapacityDark: {
    color: '#9ca3af',
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
