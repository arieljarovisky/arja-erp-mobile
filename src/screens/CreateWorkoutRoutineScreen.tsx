/**
 * Pantalla para crear rutinas de ejercicios con IA
 * Formulario de dos pasos: 1) Selección de partes del cuerpo, 2) Configuración
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/useAuthStore';
import { useTenantStore } from '../store/useTenantStore';
import { useAppTheme } from '../utils/useAppTheme';
import { workoutRoutinesAPI, BodyPart } from '../api/workoutRoutines';
import { BodyPartIcon } from '../components/BodyPartIcon';

const ARJA_PRIMARY_START = '#13b5cf';
const ARJA_PRIMARY_END = '#0d7fd4';

export default function CreateWorkoutRoutineScreen() {
  const navigation = useNavigation();
  const { isDark } = useAppTheme();
  const { customerId, tenantId } = useAuthStore();
  const [bodyParts, setBodyParts] = useState<BodyPart[]>([]);
  const [selectedBodyParts, setSelectedBodyParts] = useState<string[]>([]);
  const [customRequest, setCustomRequest] = useState('');
  const [duration, setDuration] = useState<number | undefined>(60);
  const [difficulty, setDifficulty] = useState<'principiante' | 'intermedio' | 'avanzado'>('intermedio');
  const [loading, setLoading] = useState(false);
  const [loadingBodyParts, setLoadingBodyParts] = useState(true);
  const [step, setStep] = useState<1 | 2>(1); // Paso actual del formulario

  // Verificar al montar - los customers no pueden generar rutinas
  useEffect(() => {
    // En la app mobile, todos los usuarios son customers
    // Solo los entrenadores (desde el frontend web) pueden generar rutinas
    Alert.alert(
      'Acceso restringido',
      'Solo los entrenadores pueden generar rutinas. Tu entrenador te asignará rutinas personalizadas.',
      [
        {
          text: 'Entendido',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  }, [navigation]);

  const loadBodyParts = async () => {
    try {
      // Agregar timestamp para evitar caché
      const data = await workoutRoutinesAPI.getBodyParts();
      // Forzar actualización limpiando y estableciendo de nuevo
      setBodyParts([]);
      setTimeout(() => {
        setBodyParts(data);
      }, 100);
    } catch (error) {
      console.error('Error cargando partes del cuerpo:', error);
      Alert.alert('Error', 'No se pudieron cargar las partes del cuerpo');
    } finally {
      setLoadingBodyParts(false);
    }
  };

  const toggleBodyPart = (id: string) => {
    setSelectedBodyParts(prev => {
      if (prev.includes(id)) {
        return prev.filter(p => p !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleNextStep = () => {
    if (selectedBodyParts.length === 0 && !customRequest.trim()) {
      Alert.alert('Atención', 'Seleccioná al menos una parte del cuerpo o escribí una solicitud personalizada');
      return;
    }
    setStep(2);
  };

  const handleBackStep = () => {
    setStep(1);
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const routine = await workoutRoutinesAPI.generateRoutine({
        bodyParts: selectedBodyParts.length > 0 ? selectedBodyParts : undefined,
        customRequest: customRequest.trim() || undefined,
        duration,
        difficulty,
      });

      Alert.alert(
        '¡Rutina generada!',
        `Se creó la rutina "${routine.name}" exitosamente`,
        [
          {
            text: 'Ver rutina',
            onPress: () => {
              navigation.navigate('WorkoutRoutineDetail' as never, { routineId: routine.id } as never);
            },
          },
          {
            text: 'Crear otra',
            style: 'cancel',
            onPress: () => {
              // Resetear formulario
              setSelectedBodyParts([]);
              setCustomRequest('');
              setDuration(60);
              setDifficulty('intermedio');
              setStep(1);
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error generando rutina:', error);
      
      // Mensaje de error más específico
      let errorMessage = 'No se pudo generar la rutina';
      const errorData = error.response?.data;
      
      if (errorData?.error) {
        errorMessage = errorData.error;
        
        // Si es un error de suscripción, mostrar mensaje más claro
        if (errorMessage.includes('suscripción') || errorMessage.includes('ExerciseDB no está disponible')) {
          errorMessage = 'El servicio de ejercicios no está disponible. Por favor, contactá al administrador para activar la suscripción a ExerciseDB.';
        } else if (errorMessage.includes('No se encontraron ejercicios')) {
          errorMessage = errorMessage; // Mantener el mensaje específico del backend
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert(
        'Error al generar rutina',
        errorMessage,
        [{ text: 'Entendido' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const isDarkMode = Boolean(isDark);

  // Paso 1: Selección de partes del cuerpo
  const renderStep1 = () => (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.stepContainer}>
        <Text style={[styles.mainQuestion, isDarkMode && styles.mainQuestionDark]}>
          ¿Qué querés entrenar hoy?
        </Text>
        <Text style={[styles.subtitle, isDarkMode && styles.subtitleDark]}>
          Seleccioná las partes del cuerpo que querés trabajar
        </Text>

        {loadingBodyParts ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={ARJA_PRIMARY_START} />
          </View>
        ) : (
          <>
            <Text style={[styles.bodyPartsTitle, isDarkMode && styles.bodyPartsTitleDark]}>
              Partes del cuerpo
            </Text>
            <View style={styles.bodyPartsGrid}>
            {bodyParts.map((part) => {
              const isSelected = selectedBodyParts.includes(part.id);
              return (
                <TouchableOpacity
                  key={`${part.id}-${part.icon?.substring(0, 50)}`}
                  style={[
                    styles.bodyPartCard,
                    isSelected && styles.bodyPartCardSelected,
                    isDarkMode && styles.bodyPartCardDark,
                    isSelected && isDarkMode && styles.bodyPartCardSelectedDark,
                  ]}
                  onPress={() => toggleBodyPart(part.id)}
                >
                  <View style={styles.bodyPartIconContainer}>
                    <BodyPartIcon 
                      bodyPartId={part.id}
                      size={56}
                      color={isSelected ? '#ffffff' : (isDarkMode ? '#13b5cf' : '#051420')}
                    />
                  </View>
                  <Text
                    style={[
                      styles.bodyPartName,
                      isSelected && styles.bodyPartNameSelected,
                      isDarkMode && styles.bodyPartNameDark,
                    ]}
                  >
                    {part.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          </>
        )}

        {/* Solicitud personalizada */}
        <View style={styles.customRequestSection}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
            O escribí una solicitud personalizada
          </Text>
          <TextInput
            style={[
              styles.textInput,
              isDarkMode && styles.textInputDark,
            ]}
            placeholder="Ej: Rutina para ganar masa muscular en brazos y pecho"
            placeholderTextColor={isDarkMode ? '#90acbc' : '#9ca3af'}
            value={customRequest}
            onChangeText={setCustomRequest}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Botón siguiente */}
        <TouchableOpacity
          style={[styles.nextButton, (selectedBodyParts.length === 0 && !customRequest.trim()) && styles.nextButtonDisabled]}
          onPress={handleNextStep}
          disabled={selectedBodyParts.length === 0 && !customRequest.trim()}
        >
          <Text style={styles.nextButtonText}>Continuar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // Paso 2: Configuración de duración y dificultad
  const renderStep2 = () => (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.stepContainer}>
        <Text style={[styles.mainQuestion, isDarkMode && styles.mainQuestionDark]}>
          Configurá tu rutina
        </Text>
        <Text style={[styles.subtitle, isDarkMode && styles.subtitleDark]}>
          Elegí la duración y el nivel de dificultad
        </Text>

        {/* Resumen de selección */}
        {selectedBodyParts.length > 0 && (
          <View style={[styles.summaryCard, isDarkMode && styles.summaryCardDark]}>
            <Text style={[styles.summaryTitle, isDarkMode && styles.summaryTitleDark]}>
              Partes seleccionadas:
            </Text>
            <View style={styles.summaryTags}>
              {selectedBodyParts.map(id => {
                const part = bodyParts.find(p => p.id === id);
                return part ? (
                  <View key={id} style={[styles.summaryTag, isDarkMode && styles.summaryTagDark]}>
                    <Text style={[styles.summaryTagText, isDarkMode && styles.summaryTagTextDark]}>
                      {part.name}
                    </Text>
                  </View>
                ) : null;
              })}
            </View>
          </View>
        )}

        {/* Duración */}
        <View style={styles.configSection}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
            Duración (minutos)
          </Text>
          <View style={styles.durationButtons}>
            {[30, 45, 60, 90].map((mins) => (
              <TouchableOpacity
                key={mins}
                style={[
                  styles.durationButton,
                  duration === mins && styles.durationButtonSelected,
                  isDarkMode && styles.durationButtonDark,
                ]}
                onPress={() => setDuration(mins)}
              >
                <Text
                  style={[
                    styles.durationButtonText,
                    duration === mins && styles.durationButtonTextSelected,
                    isDarkMode && styles.durationButtonTextDark,
                  ]}
                >
                  {mins} min
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Dificultad */}
        <View style={styles.configSection}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
            Nivel de dificultad
          </Text>
          <View style={styles.difficultyButtons}>
            {(['principiante', 'intermedio', 'avanzado'] as const).map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.difficultyButton,
                  difficulty === level && styles.difficultyButtonSelected,
                  isDarkMode && styles.difficultyButtonDark,
                ]}
                onPress={() => setDifficulty(level)}
              >
                <Text
                  style={[
                    styles.difficultyButtonText,
                    difficulty === level && styles.difficultyButtonTextSelected,
                    isDarkMode && styles.difficultyButtonTextDark,
                  ]}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Botones de acción */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.backButton, isDarkMode && styles.backButtonDark]}
            onPress={handleBackStep}
          >
            <Text style={[styles.backButtonText, isDarkMode && styles.backButtonTextDark]}>
              Atrás
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.generateButton, loading && styles.generateButtonDisabled]}
            onPress={handleGenerate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.generateButtonText}>
                Generar Rutina
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

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
            style={styles.headerBackButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.headerBackButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Crear Rutina con IA</Text>
          <View style={styles.placeholder} />
        </View>
        
        {/* Indicador de pasos */}
        <View style={styles.stepIndicator}>
          <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]} />
          <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
          <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]} />
        </View>
      </LinearGradient>

      {step === 1 ? renderStep1() : renderStep2()}
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
    marginBottom: 16,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBackButtonText: {
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
  },
  placeholder: {
    width: 40,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  stepDotActive: {
    backgroundColor: '#ffffff',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  stepLineActive: {
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  stepContainer: {
    flex: 1,
  },
  mainQuestion: {
    fontSize: 28,
    fontWeight: '800',
    color: '#051420',
    marginBottom: 8,
    textAlign: 'center',
  },
  mainQuestionDark: {
    color: '#e6f2f8',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 32,
    textAlign: 'center',
  },
  subtitleDark: {
    color: '#90acbc',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  bodyPartsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#051420',
    marginBottom: 20,
    textAlign: 'center',
  },
  bodyPartsTitleDark: {
    color: '#e6f2f8',
  },
  bodyPartsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
    marginBottom: 32,
  },
  bodyPartCard: {
    width: '45%',
    aspectRatio: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bodyPartCardDark: {
    backgroundColor: '#1e2f3f',
    borderColor: '#2d3f4f',
  },
  bodyPartCardSelected: {
    backgroundColor: ARJA_PRIMARY_START,
    borderColor: ARJA_PRIMARY_START,
  },
  bodyPartCardSelectedDark: {
    backgroundColor: ARJA_PRIMARY_START,
    borderColor: ARJA_PRIMARY_START,
  },
  bodyPartIconContainer: {
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyPartName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#051420',
    textAlign: 'center',
  },
  bodyPartNameDark: {
    color: '#e6f2f8',
  },
  bodyPartNameSelected: {
    color: '#ffffff',
  },
  customRequestSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#051420',
    marginBottom: 12,
  },
  sectionTitleDark: {
    color: '#e6f2f8',
  },
  textInput: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#051420',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  textInputDark: {
    backgroundColor: '#1e2f3f',
    borderColor: '#2d3f4f',
    color: '#e6f2f8',
  },
  nextButton: {
    backgroundColor: ARJA_PRIMARY_START,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  summaryCardDark: {
    backgroundColor: '#1e2f3f',
    borderColor: '#2d3f4f',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#051420',
    marginBottom: 12,
  },
  summaryTitleDark: {
    color: '#e6f2f8',
  },
  summaryTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  summaryTag: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  summaryTagDark: {
    backgroundColor: '#2d3f4f',
  },
  summaryTagText: {
    fontSize: 14,
    color: '#051420',
    fontWeight: '500',
  },
  summaryTagTextDark: {
    color: '#e6f2f8',
  },
  configSection: {
    marginBottom: 32,
  },
  durationButtons: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  durationButton: {
    flex: 1,
    minWidth: '22%',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  durationButtonDark: {
    backgroundColor: '#1e2f3f',
    borderColor: '#2d3f4f',
  },
  durationButtonSelected: {
    backgroundColor: ARJA_PRIMARY_START,
    borderColor: ARJA_PRIMARY_START,
  },
  durationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#051420',
  },
  durationButtonTextDark: {
    color: '#e6f2f8',
  },
  durationButtonTextSelected: {
    color: '#ffffff',
  },
  difficultyButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  difficultyButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  difficultyButtonDark: {
    backgroundColor: '#1e2f3f',
    borderColor: '#2d3f4f',
  },
  difficultyButtonSelected: {
    backgroundColor: ARJA_PRIMARY_START,
    borderColor: ARJA_PRIMARY_START,
  },
  difficultyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#051420',
  },
  difficultyButtonTextDark: {
    color: '#e6f2f8',
  },
  difficultyButtonTextSelected: {
    color: '#ffffff',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  backButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  backButtonDark: {
    backgroundColor: '#1e2f3f',
    borderColor: '#2d3f4f',
  },
  backButtonText: {
    color: '#051420',
    fontSize: 16,
    fontWeight: '600',
  },
  backButtonTextDark: {
    color: '#e6f2f8',
  },
  generateButton: {
    flex: 2,
    backgroundColor: ARJA_PRIMARY_START,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
});
