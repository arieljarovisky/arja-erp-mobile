/**
 * Pantalla de Clases Disponibles (solo oferta, sin "Mis Reservas")
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { CalendarIcon, PlusIcon, CoursesIcon } from '../components/Icons';
import { classesAPI, ClassSeries, ClassSession } from '../api/classes';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale/es';

const ARJA_PRIMARY_START = '#13b5cf';
const ARJA_PRIMARY_END = '#0d7fd4';

export default function AvailableClassesScreen() {
  const navigation = useNavigation();
  const { isDark } = useAppTheme();
  const { tenantId } = useAuthStore();
  const { loadFeatures, isLoading: isLoadingFeatures, hasFeature } = useTenantStore();

  const [classes, setClasses] = useState<ClassSeries[]>([]);
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState<ClassSeries | null>(null);
  const [sessionsExpanded, setSessionsExpanded] = useState<Record<string, number>>({});
  const [filterType, setFilterType] = useState<string>('all');

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
    // Esperar features
    if (isLoadingFeatures) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    if (!hasFeature('has_classes')) {
      setClasses([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const classesData = await classesAPI.getClasses(tenantId);
      setClasses(Array.isArray(classesData) ? classesData : []);
    } catch (error: any) {
      console.error('[AvailableClassesScreen] Error clases:', error?.response?.data || error?.message);
      Alert.alert('Error', 'No se pudieron cargar las clases');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tenantId, isLoadingFeatures, hasFeature]);

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
      setSessionsExpanded((prev) => ({ ...prev, [String(series.id)]: 5 }));
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar las sesiones');
    } finally {
      setLoadingSessions(false);
    }
  };

  const visibleSessionsFor = (seriesId: number) => {
    const cap = sessionsExpanded[String(seriesId)] ?? 5;
    return sessions.slice(0, cap);
  };

  const loadMoreSessions = (seriesId: number) => {
    setSessionsExpanded((prev) => {
      const current = prev[String(seriesId)] ?? 5;
      return { ...prev, [String(seriesId)]: current + 5 };
    });
  };

  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    classes.forEach((c) => {
      if (c.name) types.add(c.name);
      if (c.sessions && c.sessions.length > 0) {
        c.sessions.forEach((s) => {
          if (s.series_name) types.add(s.series_name);
        });
      }
    });
    return Array.from(types).filter(Boolean);
  }, [classes]);

  return (
    <View style={[styles.screenContainer, isDark && styles.screenContainerDark]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
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
            <Text style={styles.headerTitle}>Clases disponibles</Text>
          </View>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      {loading ? (
        <View style={[styles.screenContainer, isDark && styles.screenContainerDark, styles.centerContent]}>
          <ActivityIndicator size="large" color={ARJA_PRIMARY_START} />
          <Text style={[styles.loadingText, isDark && styles.loadingTextDark]}>Cargando clases...</Text>
        </View>
      ) : (
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
              <CoursesIcon size={64} color={isDark ? '#4FD4E4' : ARJA_PRIMARY_START} />
              <Text style={[styles.emptyTitle, isDark && styles.emptyTitleDark]}>
                No hay clases disponibles
              </Text>
              <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
                Este lugar no tiene clases habilitadas actualmente
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
                    Clases Disponibles
                  </Text>
                </View>
                {availableTypes.length > 0 && (
                  <View style={styles.filtersRow}>
                    <TouchableOpacity
                      style={[
                        styles.filterPill,
                        filterType === 'all' && styles.filterPillActive,
                      ]}
                      onPress={() => setFilterType('all')}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.filterPillText,
                          filterType === 'all' && styles.filterPillTextActive,
                        ]}
                      >
                        Todas
                      </Text>
                    </TouchableOpacity>
                    {availableTypes.map((t: string) => (
                      <TouchableOpacity
                        key={t}
                        style={[
                          styles.filterPill,
                          filterType === t && styles.filterPillActive,
                        ]}
                        onPress={() => setFilterType(t)}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.filterPillText,
                            filterType === t && styles.filterPillTextActive,
                          ]}
                        >
                          {t}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {classes
                  .filter((c) => filterType === 'all' || c.name === filterType || c.description === filterType)
                  .map((classSeries) => (
                    <View key={classSeries.id} style={styles.classCard}>
                      <TouchableOpacity
                        style={[styles.classCardContent, isDark && styles.classCardContentDark]}
                        onPress={() => {
                          if (selectedSeries?.id === classSeries.id) {
                            setSelectedSeries(null);
                            setSessions([]);
                            return;
                          }
                          loadSessions(classSeries);
                        }}
                        activeOpacity={0.9}
                      >
                        <View style={styles.classHeader}>
                          <View style={styles.classHeaderLeft}>
                            <CoursesIcon size={18} color={ARJA_PRIMARY_START} />
                            <Text style={[styles.className, isDark && styles.classNameDark]}>
                              {classSeries.name}
                            </Text>
                          </View>
                          <Text style={styles.expandIndicator}>
                            {selectedSeries?.id === classSeries.id ? '▲' : '▼'}
                          </Text>
                        </View>
                        {classSeries.first_session_date && (
                          <Text style={[styles.classMeta, isDark && styles.classMetaDark]}>
                            Próxima: {format(parseISO(classSeries.first_session_date), "eee dd MMM · HH:mm", { locale: es })}
                          </Text>
                        )}
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
                        <Text style={[styles.classHint, isDark && styles.classHintDark]}>
                          Toca para ver sesiones y reservar
                        </Text>
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
                            visibleSessionsFor(classSeries.id).map((session) => (
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
                                    <View style={styles.sessionMetaRow}>
                                      <View style={styles.sessionPill}>
                                        <Text style={styles.sessionPillText}>
                                          {format(parseISO(session.starts_at), 'HH:mm')} - {format(parseISO(session.ends_at), 'HH:mm')}
                                        </Text>
                                      </View>
                                      {session.max_capacity && (
                                        <View style={styles.sessionPillGhost}>
                                          <Text style={styles.sessionPillGhostText}>
                                            {session.current_enrollments || 0}/{session.max_capacity} cupos
                                          </Text>
                                        </View>
                                      )}
                                    </View>
                                  </View>
                                </View>
                                <TouchableOpacity
                                  style={[
                                    styles.enrollButton,
                                    session.max_capacity && session.current_enrollments !== undefined && session.current_enrollments >= (session.max_capacity || 0) && styles.enrollButtonDisabled,
                                  ]}
                                  onPress={() => classesAPI.enrollToClass(session.id, (tenantId as number), tenantId!).catch(() => {})}
                                  disabled={session.max_capacity !== undefined && session.current_enrollments !== undefined && session.current_enrollments >= (session.max_capacity || 0)}
                                >
                                  <Text style={[styles.enrollButtonText]}>
                                    Reservar
                                  </Text>
                                </TouchableOpacity>
                              </View>
                            ))
                          )}
                          {sessions.length > (sessionsExpanded[String(classSeries.id)] ?? 5) && (
                            <TouchableOpacity
                              style={styles.loadMoreBtn}
                              onPress={() => loadMoreSessions(classSeries.id)}
                            >
                              <Text style={styles.loadMoreText}>Cargar más</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      )}
                    </View>
                  ))}
              </View>
            </>
          )}
        </ScrollView>
      )}
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
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  placeholder: {
    width: 40,
  },
  headerTitle: {
    fontSize: 24,
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
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#051420',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyTitleDark: {
    color: '#e6f2f8',
  },
  emptyText: {
    fontSize: 14,
    color: '#385868',
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyTextDark: {
    color: '#90acbc',
  },
  section: {
    marginTop: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  sectionTitleDark: {
    color: '#e6f2f8',
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
  classHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
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
  classMeta: {
    fontSize: 13,
    color: '#0f172a',
    marginBottom: 4,
  },
  classMetaDark: {
    color: '#e5e7eb',
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
});


