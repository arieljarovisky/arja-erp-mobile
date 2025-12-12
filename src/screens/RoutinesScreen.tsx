/**
 * Pantalla de Rutinas del Usuario
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
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/useAuthStore';
import { useTenantStore } from '../store/useTenantStore';
import { useAppTheme } from '../utils/useAppTheme';
import { RoutinesIcon, PlusIcon, DumbbellIcon, ClockIcon, EditIcon, TrashIcon, VideoIcon } from '../components/Icons';
import { routinesAPI, Routine } from '../api/routines';
import { workoutRoutinesAPI, WorkoutRoutine } from '../api/workoutRoutines';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';

const ARJA_PRIMARY_START = '#13b5cf';
const ARJA_PRIMARY_END = '#0d7fd4';

export default function RoutinesScreen() {
  const navigation = useNavigation();
  const { isDark } = useAppTheme();
  const { customerId, tenantId, phone } = useAuthStore();
  const { features, loadFeatures, hasFeature } = useTenantStore();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [workoutRoutines, setWorkoutRoutines] = useState<WorkoutRoutine[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Cargar features del tenant al montar
  useEffect(() => {
    if (tenantId) {
      loadFeatures(tenantId);
    }
  }, [tenantId, loadFeatures]);

  const loadRoutines = useCallback(async () => {
    console.log('[RoutinesScreen] loadRoutines iniciado', { phone, tenantId, hasRoutines: hasFeature('has_routines') });
    
    if (!tenantId) {
      console.log('[RoutinesScreen] No hay tenantId, cancelando carga');
      setLoading(false);
      return;
    }

    // Verificar si el tenant tiene rutinas habilitadas
    if (!hasFeature('has_routines')) {
      console.log('[RoutinesScreen] Rutinas no habilitadas para este negocio');
      setRoutines([]);
      setWorkoutRoutines([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      // Cargar rutinas de servicios (turnos)
      if (phone) {
        try {
          console.log('[RoutinesScreen] Cargando rutinas de servicios...');
          const data = await routinesAPI.getMyRoutines(phone, tenantId);
          console.log('[RoutinesScreen] Rutinas de servicios cargadas:', data.length);
          setRoutines(data);
        } catch (error: any) {
          if (error.response && error.response.status !== 404) {
            console.error('[RoutinesScreen] Error cargando rutinas de servicios:', error);
          } else {
            console.log('[RoutinesScreen] No hay rutinas de servicios (404)');
          }
          setRoutines([]);
        }
      } else {
        console.log('[RoutinesScreen] No hay phone, omitiendo rutinas de servicios');
        setRoutines([]);
      }

      // Cargar rutinas de ejercicios
      try {
        console.log('[RoutinesScreen] Cargando rutinas de ejercicios...');
        const workoutData = await workoutRoutinesAPI.getMyRoutines();
        console.log('[RoutinesScreen] Rutinas de ejercicios cargadas:', workoutData.length, workoutData);
        setWorkoutRoutines(workoutData);
      } catch (error: any) {
        console.error('[RoutinesScreen] Error cargando rutinas de ejercicios:', error);
        if (error.response) {
          console.error('[RoutinesScreen] Status:', error.response.status);
          console.error('[RoutinesScreen] Data:', error.response.data);
        }
        if (error.response && error.response.status !== 404) {
          Alert.alert('Error', `No se pudieron cargar las rutinas de ejercicios: ${error.response?.data?.error || error.message}`);
        }
        setWorkoutRoutines([]);
      }
    } catch (error: any) {
      console.error('[RoutinesScreen] Error general cargando rutinas:', error);
      if (error.response && error.response.status !== 404) {
        Alert.alert('Error', 'No se pudieron cargar las rutinas');
      } else if (!error.response) {
        console.log('[RoutinesScreen] Backend no disponible - mostrando estado vacío de rutinas');
      } else {
        console.log('[RoutinesScreen] No hay rutinas disponibles');
      }
      setRoutines([]);
      setWorkoutRoutines([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [phone, tenantId, hasFeature]);

  useEffect(() => {
    loadRoutines();
  }, [loadRoutines]);

  // Recargar rutinas cuando la pantalla recibe el foco
  useFocusEffect(
    useCallback(() => {
      console.log('[RoutinesScreen] Pantalla enfocada, recargando rutinas...');
      loadRoutines();
    }, [loadRoutines])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadRoutines();
  }, [loadRoutines]);

  const handleToggleRoutine = async (routine: Routine) => {
    try {
      await routinesAPI.toggleRoutine(routine.id, !routine.is_active);
      await loadRoutines();
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar la rutina');
    }
  };

  const handleDeleteRoutine = (routine: Routine) => {
    Alert.alert(
      'Eliminar rutina',
      `¿Estás seguro de eliminar "${routine.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await routinesAPI.deleteRoutine(routine.id);
              await loadRoutines();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar la rutina');
            }
          },
        },
      ]
    );
  };

  const getFrequencyLabel = (frequency?: string) => {
    switch (frequency) {
      case 'daily':
        return 'Diaria';
      case 'weekly':
        return 'Semanal';
      case 'biweekly':
        return 'Quincenal';
      case 'monthly':
        return 'Mensual';
      default:
        return 'Sin frecuencia';
    }
  };

  if (loading) {
    return (
      <View style={[styles.screenContainer, isDark && styles.screenContainerDark, styles.centerContent]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <ActivityIndicator size="large" color={ARJA_PRIMARY_START} />
        <Text style={[styles.loadingText, isDark && styles.loadingTextDark]}>Cargando rutinas...</Text>
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
            <RoutinesIcon size={28} color="#ffffff" />
            <Text style={styles.headerTitle}>Mis Rutinas</Text>
          </View>
          {/* Botón de crear rutina oculto - solo entrenadores pueden generar rutinas */}
          {/* Los customers solo pueden ver rutinas asignadas por entrenadores */}
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
        {!hasFeature('has_routines') ? (
          <View style={styles.emptyContainer}>
            <RoutinesIcon size={64} color={isDark ? '#4FD4E4' : ARJA_PRIMARY_START} />
            <Text style={[styles.emptyTitle, isDark && styles.emptyTitleDark]}>
              Rutinas no disponibles
            </Text>
            <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
              Este negocio no tiene rutinas habilitadas
            </Text>
          </View>
        ) : routines.length === 0 && workoutRoutines.length === 0 ? (
          <View style={styles.emptyContainer}>
            <RoutinesIcon size={64} color={isDark ? '#4FD4E4' : ARJA_PRIMARY_START} />
            <Text style={[styles.emptyTitle, isDark && styles.emptyTitleDark]}>
              No tienes rutinas
            </Text>
            <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
              Tu entrenador te asignará rutinas personalizadas aquí
            </Text>
          </View>
        ) : (
          <View style={styles.routinesList}>
            {/* Rutinas de ejercicios */}
            {workoutRoutines.map((routine) => (
              <View
                key={`workout-${routine.id}`}
                style={[styles.routineCard, isDark && styles.routineCardDark]}
              >
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    navigation.navigate('WorkoutRoutineDetail' as never, { routineId: routine.id } as never);
                  }}
                >
                  <View style={styles.routineHeader}>
                    <View style={styles.routineIconContainer}>
                      <View style={[styles.routineIconWrapper, isDark && styles.routineIconWrapperDark]}>
                        <DumbbellIcon size={28} color={ARJA_PRIMARY_START} />
                      </View>
                    </View>
                    <View style={styles.routineTitleContainer}>
                      <Text style={[styles.routineName, isDark && styles.routineNameDark]} numberOfLines={1}>
                        {routine.name}
                      </Text>
                      <View style={styles.routineBadges}>
                        <View style={[styles.statusBadge, styles.workoutBadge]}>
                          <DumbbellIcon size={12} color="#ffffff" />
                          <Text style={styles.statusBadgeText}> Ejercicios</Text>
                        </View>
                        <View style={[styles.frequencyBadge, isDark && styles.frequencyBadgeDark]}>
                          <Text style={[styles.frequencyBadgeText, isDark && styles.frequencyBadgeTextDark]}>
                            {routine.difficulty.charAt(0).toUpperCase() + routine.difficulty.slice(1)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {routine.description && (
                    <Text style={[styles.routineDescription, isDark && styles.routineDescriptionDark]} numberOfLines={2}>
                      {routine.description}
                    </Text>
                  )}

                  <View style={[styles.routineStats, isDark && styles.routineStatsDark]}>
                    <View style={styles.routineStatItem}>
                      <DumbbellIcon size={16} color={isDark ? '#90acbc' : '#6b7280'} />
                      <Text style={[styles.routineStatText, isDark && styles.routineStatTextDark]}>
                        {routine.exercises.length} ejercicios
                      </Text>
                    </View>
                    <View style={styles.routineStatItem}>
                      <ClockIcon size={16} color={isDark ? '#90acbc' : '#6b7280'} />
                      <Text style={[styles.routineStatText, isDark && styles.routineStatTextDark]}>
                        {routine.duration_minutes} min
                      </Text>
                    </View>
                  </View>

                  <View style={styles.routineFooter}>
                    <Text style={[styles.routineDate, isDark && styles.routineDateDark]}>
                      {format(new Date(routine.created_at), "dd 'de' MMMM, yyyy", { locale: es })}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Botones de editar/eliminar ocultos - solo entrenadores pueden modificar rutinas */}
                {/* Los customers solo pueden ver rutinas asignadas */}
              </View>
            ))}

            {/* Rutinas de servicios (turnos) */}
            {routines.map((routine) => (
              <View
                key={routine.id}
                style={[styles.routineCard, isDark && styles.routineCardDark]}
              >
                <View style={styles.routineHeader}>
                  <View style={styles.routineTitleContainer}>
                    <Text style={[styles.routineName, isDark && styles.routineNameDark]}>
                      {routine.name}
                    </Text>
                    <View style={styles.routineBadges}>
                      <View
                        style={[
                          styles.statusBadge,
                          routine.is_active ? styles.activeBadge : styles.inactiveBadge,
                        ]}
                      >
                        <Text style={styles.statusBadgeText}>
                          {routine.is_active ? 'Activa' : 'Inactiva'}
                        </Text>
                      </View>
                      {routine.frequency && (
                        <View style={[styles.frequencyBadge, isDark && styles.frequencyBadgeDark]}>
                          <Text style={[styles.frequencyBadgeText, isDark && styles.frequencyBadgeTextDark]}>
                            {getFrequencyLabel(routine.frequency)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                {routine.description && (
                  <Text style={[styles.routineDescription, isDark && styles.routineDescriptionDark]}>
                    {routine.description}
                  </Text>
                )}

                {routine.services && routine.services.length > 0 && (
                  <View style={styles.servicesContainer}>
                    <Text style={[styles.servicesTitle, isDark && styles.servicesTitleDark]}>
                      Servicios ({routine.services.length}):
                    </Text>
                    {routine.services.map((service, index) => (
                      <View key={service.id || index} style={styles.serviceItem}>
                        <Text style={[styles.serviceName, isDark && styles.serviceNameDark]}>
                          {index + 1}. {service.service_name || `Servicio ${service.service_id}`}
                        </Text>
                        {service.duration && (
                          <Text style={[styles.serviceDuration, isDark && styles.serviceDurationDark]}>
                            {service.duration} min
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.routineFooter}>
                  <Text style={[styles.routineDate, isDark && styles.routineDateDark]}>
                    Creada: {format(new Date(routine.created_at), "dd 'de' MMMM, yyyy", { locale: es })}
                  </Text>
                  <View style={styles.routineActions}>
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        routine.is_active ? styles.deactivateButton : styles.activateButton,
                      ]}
                      onPress={() => handleToggleRoutine(routine)}
                    >
                      <Text
                        style={[
                          styles.actionButtonText,
                          routine.is_active ? styles.deactivateButtonText : styles.activateButtonText,
                        ]}
                      >
                        {routine.is_active ? 'Desactivar' : 'Activar'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => handleDeleteRoutine(routine)}
                    >
                      <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
                        Eliminar
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
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
  placeholder: {
    width: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
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
  routinesList: {
    gap: 16,
  },
  routineCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  routineCardDark: {
    backgroundColor: '#1e2f3f',
    borderColor: '#2c4a5f',
  },
  routineHeader: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  routineIconContainer: {
    marginRight: 4,
  },
  routineIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#e0f7fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  routineIconWrapperDark: {
    backgroundColor: '#1e3a5f',
  },
  routineTitleContainer: {
    flex: 1,
    gap: 8,
  },
  routineName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#051420',
  },
  routineNameDark: {
    color: '#e6f2f8',
  },
  routineBadges: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activeBadge: {
    backgroundColor: '#10b981',
  },
  inactiveBadge: {
    backgroundColor: '#6b7280',
  },
  workoutBadge: {
    backgroundColor: '#8b5cf6',
  },
  statusBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  frequencyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#e0f2fe',
  },
  frequencyBadgeDark: {
    backgroundColor: '#1e3a5f',
  },
  frequencyBadgeText: {
    color: '#0369a1',
    fontSize: 12,
    fontWeight: '600',
  },
  frequencyBadgeTextDark: {
    color: '#60a5fa',
  },
  routineDescription: {
    fontSize: 14,
    color: '#385868',
    marginBottom: 16,
    lineHeight: 20,
  },
  routineDescriptionDark: {
    color: '#90acbc',
  },
  servicesContainer: {
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  servicesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#051420',
    marginBottom: 8,
  },
  servicesTitleDark: {
    color: '#e6f2f8',
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  serviceName: {
    fontSize: 14,
    color: '#385868',
    flex: 1,
  },
  serviceNameDark: {
    color: '#90acbc',
  },
  serviceDuration: {
    fontSize: 12,
    color: '#6b7280',
  },
  serviceDurationDark: {
    color: '#9ca3af',
  },
  routineStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  routineStatsDark: {
    borderTopColor: '#2c4a5f',
  },
  routineStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  routineStatText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  routineStatTextDark: {
    color: '#9ca3af',
  },
  routineFooter: {
    marginTop: 8,
  },
  routineDate: {
    fontSize: 11,
    color: '#9ca3af',
  },
  routineDateDark: {
    color: '#6b7280',
  },
  routineActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    justifyContent: 'flex-end',
  },
  routineActionsDark: {
    borderTopColor: '#2c4a5f',
  },
  actionIconButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#e0f7fa',
  },
  editButtonDark: {
    backgroundColor: '#1e3a5f',
  },
  deleteIconButton: {
    backgroundColor: '#fef2f2',
  },
  deleteIconButtonDark: {
    backgroundColor: '#3f1f1f',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  activateButton: {
    backgroundColor: '#10b981',
  },
  deactivateButton: {
    backgroundColor: '#ef4444',
  },
  deleteButton: {
    backgroundColor: '#f3f4f6',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  activateButtonText: {
    color: '#ffffff',
  },
  deactivateButtonText: {
    color: '#ffffff',
  },
  deleteButtonText: {
    color: '#ef4444',
  },
});

