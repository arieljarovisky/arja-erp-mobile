/**
 * Pantalla de detalle de rutina de ejercicios
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppTheme } from '../store/useThemeStore';
import { workoutRoutinesAPI, WorkoutRoutine, Exercise } from '../api/workoutRoutines';
import { DumbbellIcon, ClockIcon, AIIcon, FlameIcon, LightbulbIcon, MeditationIcon, TrashIcon } from '../components/Icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';

const ARJA_PRIMARY_START = '#13b5cf';
const ARJA_PRIMARY_END = '#0d7fd4';

export default function WorkoutRoutineDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { isDark } = useAppTheme();
  const { routineId } = route.params as { routineId: number };
  
  const [routine, setRoutine] = useState<WorkoutRoutine | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingExerciseIndex, setEditingExerciseIndex] = useState<number | null>(null);
  const [showAIRegenerate, setShowAIRegenerate] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [regeneratingExercise, setRegeneratingExercise] = useState(false);

  useEffect(() => {
    loadRoutine();
  }, [routineId]);

  const loadRoutine = async () => {
    try {
      setLoading(true);
      const data = await workoutRoutinesAPI.getRoutine(routineId);
      setRoutine(data);
    } catch (error: any) {
      console.error('Error cargando rutina:', error);
      Alert.alert(
        'Error',
        error.response?.data?.error || 'No se pudo cargar la rutina',
        [
          {
            text: 'Volver',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateExercise = (exercise: Exercise, index: number) => {
    setEditingExerciseIndex(index);
    setShowAIRegenerate(true);
    setAiPrompt('');
  };

  const handleRegenerateWithAI = async () => {
    if (!aiPrompt.trim() || editingExerciseIndex === null || !routine) {
      Alert.alert('Error', 'Por favor, ingresa una descripción de lo que quieres cambiar');
      return;
    }

    try {
      setRegeneratingExercise(true);
      const regeneratedExercise = await workoutRoutinesAPI.regenerateExercise(
        routine.id,
        editingExerciseIndex,
        aiPrompt.trim()
      );
      
      // Actualizar la rutina local
      const updatedExercises = [...routine.exercises];
      updatedExercises[editingExerciseIndex] = regeneratedExercise;
      setRoutine({ ...routine, exercises: updatedExercises });
      
      // Cerrar el modal
      setShowAIRegenerate(false);
      setAiPrompt('');
      setEditingExerciseIndex(null);
      
      // Mostrar alert después de un pequeño delay
      setTimeout(() => {
        Alert.alert('Éxito', 'Ejercicio regenerado con IA correctamente');
      }, 100);
    } catch (error: any) {
      console.error('Error regenerando ejercicio:', error);
      Alert.alert('Error', error.response?.data?.error || 'No se pudo regenerar el ejercicio');
    } finally {
      setRegeneratingExercise(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar rutina',
      `¿Estás seguro de eliminar "${routine?.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await workoutRoutinesAPI.deleteRoutine(routineId);
              Alert.alert('Éxito', 'Rutina eliminada', [
                {
                  text: 'OK',
                  onPress: () => navigation.goBack(),
                },
              ]);
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar la rutina');
            }
          },
        },
      ]
    );
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'principiante':
        return '#10b981';
      case 'intermedio':
        return '#f59e0b';
      case 'avanzado':
        return '#ef4444';
      default:
        return ARJA_PRIMARY_START;
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  };

  const isDarkMode = Boolean(isDark);

  if (loading) {
    return (
      <View style={[styles.container, isDarkMode && styles.containerDark, styles.centerContent]}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <ActivityIndicator size="large" color={ARJA_PRIMARY_START} />
        <Text style={[styles.loadingText, isDarkMode && styles.loadingTextDark]}>
          Cargando rutina...
        </Text>
      </View>
    );
  }

  if (!routine) {
    return (
      <View style={[styles.container, isDarkMode && styles.containerDark, styles.centerContent]}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <Text style={[styles.errorText, isDarkMode && styles.errorTextDark]}>
          Rutina no encontrada
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <LinearGradient
        colors={[ARJA_PRIMARY_START, ARJA_PRIMARY_END]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButtonHeader}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonTextHeader}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {routine.name}
          </Text>
          {/* Botón de eliminar oculto - solo entrenadores pueden eliminar rutinas */}
          {/* Los customers solo pueden ver rutinas asignadas */}
          <View style={styles.deleteButtonHeader} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        scrollEnabled={!showAIRegenerate}
        nestedScrollEnabled={true}
      >
        {/* Información general */}
        <View style={[styles.section, isDarkMode && styles.sectionDark]}>
          {routine.description && (
            <Text style={[styles.description, isDarkMode && styles.descriptionDark]}>
              {routine.description}
            </Text>
          )}
          
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, isDarkMode && styles.infoLabelDark]}>
                Duración
              </Text>
              <Text style={[styles.infoValue, isDarkMode && styles.infoValueDark]}>
                {routine.duration_minutes} min
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, isDarkMode && styles.infoLabelDark]}>
                Dificultad
              </Text>
              <View
                style={[
                  styles.difficultyBadge,
                  { backgroundColor: getDifficultyColor(routine.difficulty) },
                ]}
              >
                <Text style={styles.difficultyBadgeText}>
                  {getDifficultyLabel(routine.difficulty)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.metaInfo}>
            <Text style={[styles.metaText, isDarkMode && styles.metaTextDark]}>
              Creada: {format(new Date(routine.created_at), "dd 'de' MMMM, yyyy", { locale: es })}
            </Text>
            {routine.body_parts && routine.body_parts.length > 0 && (
              <Text style={[styles.metaText, isDarkMode && styles.metaTextDark]}>
                Partes del cuerpo: {routine.body_parts.join(', ')}
              </Text>
            )}
          </View>
        </View>

        {/* Calentamiento */}
        {routine.warmup && routine.warmup.length > 0 && (
          <View style={[styles.section, isDarkMode && styles.sectionDark]}>
            <View style={styles.sectionTitleContainer}>
              <FlameIcon size={20} color={isDarkMode ? '#f59e0b' : '#f59e0b'} />
              <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
                Calentamiento
              </Text>
            </View>
            {routine.warmup.map((exercise, index) => (
              <View
                key={index}
                style={[styles.exerciseCard, isDarkMode && styles.exerciseCardDark]}
              >
                <View style={styles.exerciseHeader}>
                  <Text style={[styles.exerciseNumber, isDarkMode && styles.exerciseNumberDark]}>
                    {index + 1}.
                  </Text>
                  <Text style={[styles.exerciseName, isDarkMode && styles.exerciseNameDark]} numberOfLines={2}>
                    {exercise.name}
                  </Text>
                  <Text style={[styles.exerciseDuration, isDarkMode && styles.exerciseDurationDark]}>
                    {exercise.duration_seconds}s
                  </Text>
                </View>
                {exercise.description && (
                  <Text 
                    style={[styles.exerciseDescription, isDarkMode && styles.exerciseDescriptionDark]}
                    numberOfLines={0}
                  >
                    {exercise.description}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Ejercicios principales */}
        {routine.exercises && routine.exercises.length > 0 && (
          <View style={[styles.section, isDarkMode && styles.sectionDark]}>
            <View style={styles.sectionTitleContainer}>
              <DumbbellIcon size={24} color={isDarkMode ? '#e6f2f8' : '#051420'} />
              <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
                Ejercicios ({routine.exercises.length})
              </Text>
            </View>
            {routine.exercises.map((exercise, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.exerciseCard, isDarkMode && styles.exerciseCardDark]}
                activeOpacity={0.7}
                onPress={() => {
                  navigation.navigate('ExerciseDetail' as never, {
                    exercise,
                    exerciseIndex: index,
                    routineName: routine.name,
                  } as never);
                }}
              >
                {/* Header con número y botón de edición */}
                <View style={styles.exerciseCardHeader}>
                  <View style={styles.exerciseHeaderLeft}>
                    <View style={[styles.exerciseNumberBadge, isDarkMode && styles.exerciseNumberBadgeDark]}>
                      <Text style={[styles.exerciseNumber, isDarkMode && styles.exerciseNumberDark]}>
                        {index + 1}
                      </Text>
                    </View>
                    <View style={styles.exerciseTitleContainer}>
                      <Text 
                        style={[styles.exerciseName, isDarkMode && styles.exerciseNameDark]}
                        numberOfLines={2}
                      >
                        {exercise.name}
                      </Text>
                      {exercise.body_part && (
                        <View style={[styles.bodyPartBadge, isDarkMode && styles.bodyPartBadgeDark]}>
                          <Text style={[styles.exerciseBodyPart, isDarkMode && styles.exerciseBodyPartDark]}>
                            {exercise.body_part}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  {/* Botón de regenerar ejercicio oculto - solo entrenadores pueden modificar rutinas */}
                  {/* Los customers solo pueden ver rutinas asignadas */}
                </View>
                
                {/* Estadísticas del ejercicio */}
                <View style={styles.exerciseStatsGrid}>
                  <View style={[styles.exerciseStatCard, isDarkMode && styles.exerciseStatCardDark]}>
                    <DumbbellIcon size={14} color={isDarkMode ? '#4FD4E4' : ARJA_PRIMARY_START} />
                    <Text style={[styles.exerciseStatValue, isDarkMode && styles.exerciseStatValueDark]}>
                      {exercise.sets}
                    </Text>
                    <Text style={[styles.exerciseStatLabel, isDarkMode && styles.exerciseStatLabelDark]}>
                      Series
                    </Text>
                  </View>
                  <View style={[styles.exerciseStatCard, isDarkMode && styles.exerciseStatCardDark]}>
                    <DumbbellIcon size={14} color={isDarkMode ? '#4FD4E4' : ARJA_PRIMARY_START} />
                    <Text style={[styles.exerciseStatValue, isDarkMode && styles.exerciseStatValueDark]}>
                      {exercise.reps}
                    </Text>
                    <Text style={[styles.exerciseStatLabel, isDarkMode && styles.exerciseStatLabelDark]}>
                      Reps
                    </Text>
                  </View>
                  <View style={[styles.exerciseStatCard, isDarkMode && styles.exerciseStatCardDark]}>
                    <ClockIcon size={14} color={isDarkMode ? '#4FD4E4' : ARJA_PRIMARY_START} />
                    <Text style={[styles.exerciseStatValue, isDarkMode && styles.exerciseStatValueDark]}>
                      {exercise.rest_seconds}s
                    </Text>
                    <Text style={[styles.exerciseStatLabel, isDarkMode && styles.exerciseStatLabelDark]}>
                      Descanso
                    </Text>
                  </View>
                </View>

                {/* Descripción */}
                {exercise.description && (
                  <View style={[styles.exerciseDescriptionContainer, isDarkMode && styles.exerciseDescriptionContainerDark]}>
                    <Text 
                      style={[styles.exerciseDescription, isDarkMode && styles.exerciseDescriptionDark]}
                    >
                      {exercise.description}
                    </Text>
                  </View>
                )}

                {/* Consejos */}
                {exercise.tips && (
                  <View style={[styles.tipsContainer, isDarkMode && styles.tipsContainerDark]}>
                    <View style={styles.tipsLabelContainer}>
                      <LightbulbIcon size={18} color={isDarkMode ? '#fbbf24' : '#fbbf24'} />
                      <Text style={[styles.tipsLabel, isDarkMode && styles.tipsLabelDark]}>
                        Consejo:
                      </Text>
                    </View>
                    <Text 
                      style={[styles.tipsText, isDarkMode && styles.tipsTextDark]}
                      numberOfLines={0}
                    >
                      {exercise.tips}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Enfriamiento */}
        {routine.cooldown && routine.cooldown.length > 0 && (
          <View style={[styles.section, isDarkMode && styles.sectionDark]}>
            <View style={styles.sectionTitleContainer}>
              <MeditationIcon size={20} color={isDarkMode ? '#8b5cf6' : '#8b5cf6'} />
              <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
                Enfriamiento
              </Text>
            </View>
            {routine.cooldown.map((exercise, index) => (
              <View
                key={index}
                style={[styles.exerciseCard, isDarkMode && styles.exerciseCardDark]}
              >
                <View style={styles.exerciseHeader}>
                  <Text style={[styles.exerciseNumber, isDarkMode && styles.exerciseNumberDark]}>
                    {index + 1}.
                  </Text>
                  <Text style={[styles.exerciseName, isDarkMode && styles.exerciseNameDark]} numberOfLines={2}>
                    {exercise.name}
                  </Text>
                  <Text style={[styles.exerciseDuration, isDarkMode && styles.exerciseDurationDark]}>
                    {exercise.duration_seconds}s
                  </Text>
                </View>
                {exercise.description && (
                  <Text 
                    style={[styles.exerciseDescription, isDarkMode && styles.exerciseDescriptionDark]}
                    numberOfLines={0}
                  >
                    {exercise.description}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal para regenerar con IA */}
      <Modal
        visible={showAIRegenerate}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowAIRegenerate(false);
          setAiPrompt('');
          setEditingExerciseIndex(null);
        }}
        statusBarTranslucent={true}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => {
              setShowAIRegenerate(false);
              setAiPrompt('');
              setEditingExerciseIndex(null);
            }}
          />
          <View style={styles.modalContentWrapper}>
            <View style={[styles.modalContent, isDarkMode && styles.modalContentDark]}>
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleContainer}>
                  <AIIcon size={20} color={isDarkMode ? '#4FD4E4' : ARJA_PRIMARY_START} />
                  <Text style={[styles.modalTitle, isDarkMode && styles.modalTitleDark]} numberOfLines={1}>
                    Regenerar Ejercicio con IA
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setShowAIRegenerate(false);
                    setAiPrompt('');
                    setEditingExerciseIndex(null);
                  }}
                >
                  <Text style={[styles.modalCloseText, isDarkMode && styles.modalCloseTextDark]}>
                    ✕
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalForm}>
                <Text style={[styles.formLabel, isDarkMode && styles.formLabelDark]} numberOfLines={2}>
                  ¿Qué quieres cambiar del ejercicio?
                </Text>
                <Text style={[styles.formHint, isDarkMode && styles.formHintDark]} numberOfLines={2}>
                  Ejemplos: "quiero algo más fácil", "algo más intenso", "más repeticiones", "menos descanso", etc.
                </Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea, isDarkMode && styles.formInputDark]}
                  value={aiPrompt}
                  onChangeText={setAiPrompt}
                  placeholder="Describe qué quieres cambiar..."
                  placeholderTextColor={isDarkMode ? '#6b7280' : '#9ca3af'}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  autoFocus
                />
              </View>

              <View style={[styles.modalActions, isDarkMode && styles.modalActionsDark]}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel, isDarkMode && styles.modalButtonCancelDark]}
                  onPress={() => {
                    setShowAIRegenerate(false);
                    setAiPrompt('');
                  }}
                >
                  <Text style={[styles.modalButtonText, isDarkMode && styles.modalButtonTextDark]}>
                    Cancelar
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonSave]}
                  onPress={handleRegenerateWithAI}
                  disabled={regeneratingExercise || !aiPrompt.trim()}
                >
                  {regeneratingExercise ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.modalButtonTextSave}>Regenerar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f9fc',
  },
  containerDark: {
    backgroundColor: '#0e1c2c',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
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
    justifyContent: 'space-between',
  },
  backButtonHeader: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonTextHeader: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  deleteButtonHeader: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonTextHeader: {
    fontSize: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
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
  sectionDark: {
    backgroundColor: '#1e2f3f',
  },
  description: {
    fontSize: 16,
    color: '#385868',
    lineHeight: 24,
    marginBottom: 16,
  },
  descriptionDark: {
    color: '#90acbc',
  },
  infoRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    fontWeight: '600',
  },
  infoLabelDark: {
    color: '#9ca3af',
  },
  infoValue: {
    fontSize: 18,
    color: '#051420',
    fontWeight: '700',
  },
  infoValueDark: {
    color: '#e6f2f8',
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  difficultyBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  metaInfo: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 8,
  },
  metaText: {
    fontSize: 12,
    color: '#6b7280',
  },
  metaTextDark: {
    color: '#9ca3af',
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#051420',
  },
  sectionTitleDark: {
    color: '#e6f2f8',
  },
  exerciseCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  exerciseCardDark: {
    backgroundColor: '#1e2f3f',
    borderColor: '#2c4a5f',
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 0,
  },
  exerciseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  exerciseHeaderLeft: {
    flexDirection: 'row',
    flex: 1,
    gap: 12,
  },
  exerciseNumberBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ARJA_PRIMARY_START,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseNumberBadgeDark: {
    backgroundColor: ARJA_PRIMARY_START,
  },
  exerciseNumber: {
    color: '#051420',
    fontSize: 16,
    fontWeight: '700',
    minWidth: 28,
    textAlign: 'center',
  },
  exerciseNumberDark: {
    color: '#e6f2f8',
  },
  exerciseTitleContainer: {
    flex: 1,
    gap: 6,
  },
  exerciseName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#051420',
    lineHeight: 22,
    flex: 1,
  },
  exerciseNameDark: {
    color: '#e6f2f8',
  },
  bodyPartBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#e0f2fe',
  },
  bodyPartBadgeDark: {
    backgroundColor: '#1e3a5f',
  },
  exerciseBodyPart: {
    fontSize: 11,
    color: '#0369a1',
    textTransform: 'capitalize',
    fontWeight: '600',
  },
  exerciseBodyPartDark: {
    color: '#60a5fa',
  },
  editExerciseButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#e0f7fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editExerciseButtonDark: {
    backgroundColor: '#1e3a5f',
  },
  editExerciseButtonText: {
    fontSize: 20,
  },
  editExerciseButtonTextDark: {
    opacity: 0.9,
  },
  exerciseStatsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  exerciseStatCard: {
    flex: 1,
    backgroundColor: '#f0f9ff',
    borderRadius: 10,
    padding: 10,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 2,
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  exerciseStatCardDark: {
    backgroundColor: '#1e3a5f',
    borderColor: '#2c4a5f',
  },
  exerciseStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: ARJA_PRIMARY_START,
  },
  exerciseStatValueDark: {
    color: '#4FD4E4',
  },
  exerciseStatLabel: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  exerciseStatLabelDark: {
    color: '#9ca3af',
  },
  exerciseDescriptionContainer: {
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  exerciseDescriptionContainerDark: {
    borderTopColor: '#2c4a5f',
  },
  exerciseDuration: {
    fontSize: 14,
    fontWeight: '600',
    color: ARJA_PRIMARY_START,
  },
  exerciseDurationDark: {
    color: '#4FD4E4',
  },
  exerciseDescription: {
    fontSize: 14,
    color: '#385868',
    lineHeight: 20,
    marginTop: 0,
    paddingTop: 8,
  },
  exerciseDescriptionDark: {
    color: '#90acbc',
  },
  tipsContainer: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  tipsContainerDark: {
    backgroundColor: '#3f2e1e',
  },
  tipsLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tipsLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 4,
  },
  tipsLabelDark: {
    color: '#fbbf24',
  },
  tipsText: {
    fontSize: 13,
    color: '#78350f',
    lineHeight: 18,
  },
  tipsTextDark: {
    color: '#fde68a',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#385868',
  },
  loadingTextDark: {
    color: '#90acbc',
  },
  errorText: {
    fontSize: 18,
    color: '#ef4444',
    marginBottom: 20,
  },
  errorTextDark: {
    color: '#f87171',
  },
  backButton: {
    backgroundColor: ARJA_PRIMARY_START,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  videoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#e0f7fa',
    borderRadius: 10,
    marginTop: 12,
    marginBottom: 8,
  },
  videoButtonDark: {
    backgroundColor: '#1e3a5f',
  },
  videoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: ARJA_PRIMARY_START,
  },
  videoButtonTextDark: {
    color: '#4FD4E4',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContentWrapper: {
    width: '100%',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    width: '100%',
  },
  modalContentDark: {
    backgroundColor: '#1e2f3f',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalHeaderDark: {
    borderBottomColor: '#2c4a5f',
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'flex-start',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#051420',
    flex: 1,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  modalTitleDark: {
    color: '#e6f2f8',
  },
  modalCloseText: {
    fontSize: 24,
    color: '#6b7280',
    fontWeight: '300',
  },
  modalCloseTextDark: {
    color: '#9ca3af',
  },
  modalScrollView: {
    maxHeight: 500,
  },
  modalForm: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 8,
  },
  formGroup: {
    marginBottom: 0,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#051420',
    marginBottom: 2,
    textAlignVertical: 'center',
    includeFontPadding: false,
    lineHeight: 16,
  },
  formLabelDark: {
    color: '#e6f2f8',
  },
  formInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#051420',
    includeFontPadding: false,
    minHeight: 80,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  formInputDark: {
    backgroundColor: '#2d3f4f',
    color: '#e6f2f8',
    borderColor: '#2c4a5f',
  },
  formTextArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalActionsColumn: {
    padding: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  modalActionsColumnDark: {
    borderTopColor: '#2c4a5f',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: Platform.OS === 'ios' ? 8 : 8,
  },
  modalActionsDark: {
    borderTopColor: '#2c4a5f',
  },
  modalButtonFull: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#f3f4f6',
  },
  modalButtonCancelDark: {
    backgroundColor: '#2d3f4f',
  },
  modalButtonSave: {
    backgroundColor: ARJA_PRIMARY_START,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  modalButtonTextDark: {
    color: '#9ca3af',
  },
  modalButtonTextSave: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  modalButtonAI: {
    backgroundColor: '#f0f9ff',
  },
  modalButtonAIDark: {
    backgroundColor: '#1e3a5f',
  },
  modalButtonTextAI: {
    fontSize: 14,
    fontWeight: '600',
    color: ARJA_PRIMARY_START,
  },
  modalButtonTextAIDark: {
    color: '#4FD4E4',
  },
  formHint: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 4,
    marginTop: 0,
    fontStyle: 'italic',
    lineHeight: 14,
    includeFontPadding: false,
  },
  formHintDark: {
    color: '#9ca3af',
  },
});

