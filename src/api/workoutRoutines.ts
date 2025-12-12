/**
 * API para gestión de rutinas de ejercicios con IA
 */
import apiClient from './client';

export interface BodyPart {
  id: string;
  name: string;
  icon: string;
}

export interface Exercise {
  name: string;
  body_part: string;
  sets: number;
  reps: string;
  rest_seconds: number;
  description: string;
  tips?: string;
  video_url?: string; // URL de video de YouTube, Vimeo, etc.
  gif_url?: string; // URL del GIF del ejercicio desde ExerciseDB
}

export interface WarmupExercise {
  name: string;
  duration_seconds: number;
  description: string;
  video_url?: string;
}

export interface CooldownExercise {
  name: string;
  duration_seconds: number;
  description: string;
  video_url?: string;
}

export interface WorkoutRoutine {
  id: number;
  name: string;
  description: string;
  duration_minutes: number;
  difficulty: 'principiante' | 'intermedio' | 'avanzado';
  body_parts: string[];
  exercises: Exercise[];
  warmup: WarmupExercise[];
  cooldown: CooldownExercise[];
  created_at: string;
  updated_at: string;
}

export interface GenerateRoutineRequest {
  bodyParts?: string[];
  customRequest?: string;
  duration?: number;
  difficulty?: 'principiante' | 'intermedio' | 'avanzado';
}

export const workoutRoutinesAPI = {
  /**
   * Obtener partes del cuerpo disponibles
   */
  getBodyParts: async (): Promise<BodyPart[]> => {
    // Agregar timestamp para evitar caché
    const response = await apiClient.get('/api/workout-routines/body-parts', {
      params: { _t: Date.now() }
    });
    if (response.data?.ok && response.data?.data) {
      return response.data.data;
    }
    return response.data?.data || [];
  },

  /**
   * Generar rutina de ejercicios con IA
   * Nota: Esta operación puede tardar 20-30 segundos debido a la generación con IA
   */
  generateRoutine: async (request: GenerateRoutineRequest): Promise<WorkoutRoutine> => {
    const response = await apiClient.post('/api/workout-routines/generate', request, {
      timeout: 90000, // 90 segundos para generación con IA
    });
    if (response.data?.ok && response.data?.data) {
      return response.data.data;
    }
    throw new Error(response.data?.error || 'Error al generar la rutina');
  },

  /**
   * Obtener rutinas del usuario
   */
  getMyRoutines: async (): Promise<WorkoutRoutine[]> => {
    const response = await apiClient.get('/api/workout-routines');
    if (response.data?.ok && response.data?.data) {
      return response.data.data;
    }
    return response.data?.data || [];
  },

  /**
   * Obtener una rutina específica
   */
  getRoutine: async (id: number): Promise<WorkoutRoutine> => {
    const response = await apiClient.get(`/api/workout-routines/${id}`);
    if (response.data?.ok && response.data?.data) {
      return response.data.data;
    }
    throw new Error(response.data?.error || 'Error al obtener la rutina');
  },

  /**
   * Eliminar una rutina
   */
  deleteRoutine: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/workout-routines/${id}`);
  },

  /**
   * Actualizar un ejercicio específico de una rutina
   */
  updateExercise: async (routineId: number, exerciseIndex: number, exercise: Partial<Exercise>): Promise<Exercise> => {
    const response = await apiClient.put(`/api/workout-routines/${routineId}/exercise/${exerciseIndex}`, {
      exercise,
    });
    if (response.data?.ok && response.data?.data) {
      return response.data.data.exercise;
    }
    throw new Error(response.data?.error || 'Error al actualizar el ejercicio');
  },

  /**
   * Regenerar un ejercicio específico con IA usando un prompt personalizado
   */
  regenerateExercise: async (routineId: number, exerciseIndex: number, prompt: string): Promise<Exercise> => {
    const response = await apiClient.put(`/api/workout-routines/${routineId}/exercise/${exerciseIndex}/regenerate`, {
      prompt,
    }, {
      timeout: 60000, // 60 segundos para generación con IA
    });
    if (response.data?.ok && response.data?.data) {
      return response.data.data.exercise;
    }
    throw new Error(response.data?.error || 'Error al regenerar el ejercicio');
  },
};

