/**
 * Pantalla de detalle de ejercicio individual
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAppTheme } from '../store/useThemeStore';
import { DumbbellIcon, ClockIcon, LightbulbIcon } from '../components/Icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';

const ARJA_PRIMARY_START = '#13b5cf';
const ARJA_PRIMARY_END = '#0d7fd4';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Exercise {
  name: string;
  body_part?: string;
  sets: number;
  reps: string;
  rest_seconds: number;
  description?: string;
  tips?: string;
  video_url?: string;
  gif_url?: string; // URL del GIF del ejercicio
}

export default function ExerciseDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { isDark } = useAppTheme();
  const isDarkMode = Boolean(isDark);
  const { exercise, exerciseIndex, routineName } = route.params as {
    exercise: Exercise;
    exerciseIndex: number;
    routineName: string;
  };

  // Debug: Log del ejercicio recibido
  React.useEffect(() => {
    console.log('[ExerciseDetail] Ejercicio recibido:', JSON.stringify(exercise, null, 2));
    console.log('[ExerciseDetail] video_url:', exercise.video_url);
  }, [exercise]);

  const handleSearchYouTube = () => {
    // Crear URL de búsqueda en YouTube
    const searchQuery = encodeURIComponent(`${exercise.name} ejercicio`);
    const youtubeUrl = `https://www.youtube.com/results?search_query=${searchQuery}`;
    
    Linking.openURL(youtubeUrl).catch(err => {
      console.error('[ExerciseDetail] Error abriendo YouTube:', err);
      Alert.alert('Error', 'No se pudo abrir YouTube');
    });
  };

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <LinearGradient
        colors={[ARJA_PRIMARY_START, ARJA_PRIMARY_END]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButtonHeader}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonTextHeader}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {routineName}
            </Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              Ejercicio {exerciseIndex + 1}
            </Text>
          </View>
          <View style={styles.backButtonHeader} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Título del ejercicio */}
        <View style={[styles.section, isDarkMode && styles.sectionDark]}>
          <View style={styles.exerciseNumberBadge}>
            <Text style={styles.exerciseNumber}>
              {exerciseIndex + 1}
            </Text>
          </View>
          <Text style={[styles.exerciseTitle, isDarkMode && styles.exerciseTitleDark]}>
            {exercise.name}
          </Text>
          {exercise.body_part && (
            <View style={[styles.bodyPartBadge, isDarkMode && styles.bodyPartBadgeDark]}>
              <Text style={[styles.bodyPartText, isDarkMode && styles.bodyPartTextDark]}>
                {exercise.body_part}
              </Text>
            </View>
          )}
        </View>

        {/* Video del ejercicio */}
        {exercise.video_url && (
          <View style={[styles.section, isDarkMode && styles.sectionDark]}>
            <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
              Video del ejercicio
            </Text>
            <TouchableOpacity
              style={[styles.videoButton, isDarkMode && styles.videoButtonDark]}
              onPress={() => {
                let videoUrl = exercise.video_url!;
                
                // Si es YouTube, asegurar que sea una URL válida
                if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
                  // Convertir youtu.be a formato watch si es necesario
                  if (videoUrl.includes('youtu.be/')) {
                    const videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0];
                    videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
                  }
                  // Si ya es embed, convertir a watch
                  if (videoUrl.includes('youtube.com/embed/')) {
                    const videoId = videoUrl.split('embed/')[1]?.split('?')[0];
                    videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
                  }
                }
                
                Linking.openURL(videoUrl).catch(err => {
                  console.error('[ExerciseDetail] Error abriendo video:', err);
                  Alert.alert('Error', 'No se pudo abrir el video');
                });
              }}
              activeOpacity={0.8}
            >
              <View style={styles.videoButtonContent}>
                <View style={styles.videoIconContainer}>
                  <View style={styles.videoPlayIcon}>
                    <View style={styles.videoPlayTriangle} />
                  </View>
                </View>
                <View style={styles.videoButtonTextContainer}>
                  <Text style={[styles.videoButtonText, isDarkMode && styles.videoButtonTextDark]}>
                    {exercise.video_url.includes('youtube.com') || exercise.video_url.includes('youtu.be') 
                      ? 'Ver en YouTube' 
                      : 'Ver video'}
                  </Text>
                  <Text style={[styles.videoButtonSubtext, isDarkMode && styles.videoButtonSubtextDark]}>
                    {exercise.video_url.includes('youtube.com') || exercise.video_url.includes('youtu.be')
                      ? 'Abrir en la app de YouTube'
                      : 'Abrir en el navegador'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Botón de búsqueda en YouTube (solo si no hay video_url) */}
        {!exercise.video_url && (
          <View style={[styles.section, isDarkMode && styles.sectionDark]}>
            <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
              Ver tutorial en YouTube
            </Text>
            <TouchableOpacity
              style={[styles.youtubeButton, isDarkMode && styles.youtubeButtonDark]}
              onPress={handleSearchYouTube}
              activeOpacity={0.8}
            >
              <View style={styles.youtubeButtonContent}>
                <View style={styles.youtubeIconContainer}>
                  <View style={styles.youtubePlayIcon}>
                    <View style={styles.youtubePlayTriangle} />
                  </View>
                </View>
                <View style={styles.youtubeButtonTextContainer}>
                  <Text style={styles.youtubeButtonText}>
                    Ver en YouTube
                  </Text>
                  <Text style={styles.youtubeButtonSubtext}>
                    Buscar "{exercise.name}"
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Estadísticas */}
        <View style={[styles.section, isDarkMode && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
            Información del ejercicio
          </Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, isDarkMode && styles.statCardDark]}>
              <DumbbellIcon size={20} color={isDarkMode ? '#4FD4E4' : ARJA_PRIMARY_START} />
              <Text style={[styles.statValue, isDarkMode && styles.statValueDark]}>
                {exercise.sets}
              </Text>
              <Text style={[styles.statLabel, isDarkMode && styles.statLabelDark]}>
                Series
              </Text>
            </View>
            <View style={[styles.statCard, isDarkMode && styles.statCardDark]}>
              <DumbbellIcon size={20} color={isDarkMode ? '#4FD4E4' : ARJA_PRIMARY_START} />
              <Text style={[styles.statValue, isDarkMode && styles.statValueDark]}>
                {exercise.reps}
              </Text>
              <Text style={[styles.statLabel, isDarkMode && styles.statLabelDark]}>
                Repeticiones
              </Text>
            </View>
            <View style={[styles.statCard, isDarkMode && styles.statCardDark]}>
              <ClockIcon size={20} color={isDarkMode ? '#4FD4E4' : ARJA_PRIMARY_START} />
              <Text style={[styles.statValue, isDarkMode && styles.statValueDark]}>
                {exercise.rest_seconds}s
              </Text>
              <Text style={[styles.statLabel, isDarkMode && styles.statLabelDark]}>
                Descanso
              </Text>
            </View>
          </View>
        </View>

        {/* Descripción */}
        {exercise.description && (
          <View style={[styles.section, isDarkMode && styles.sectionDark]}>
            <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
              Descripción
            </Text>
            <Text style={[styles.descriptionText, isDarkMode && styles.descriptionTextDark]}>
              {exercise.description}
            </Text>
          </View>
        )}

        {/* Consejos */}
        {exercise.tips && (
          <View style={[styles.section, styles.tipsSection, isDarkMode && styles.sectionDark]}>
            <View style={styles.tipsLabelContainer}>
              <LightbulbIcon size={20} color={isDarkMode ? '#fbbf24' : '#fbbf24'} />
              <Text style={[styles.tipsTitle, isDarkMode && styles.tipsTitleDark]}>
                Consejo
              </Text>
            </View>
            <Text style={[styles.tipsText, isDarkMode && styles.tipsTextDark]}>
              {exercise.tips}
            </Text>
          </View>
        )}
      </ScrollView>
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
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
    opacity: 0.9,
    marginTop: 2,
    textAlign: 'center',
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
  exerciseNumberBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: ARJA_PRIMARY_START,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    alignSelf: 'center',
  },
  exerciseNumber: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
  },
  exerciseTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#051420',
    textAlign: 'center',
    marginBottom: 12,
  },
  exerciseTitleDark: {
    color: '#e6f2f8',
  },
  bodyPartBadge: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#e0f2fe',
  },
  bodyPartBadgeDark: {
    backgroundColor: '#1e3a5f',
  },
  bodyPartText: {
    fontSize: 13,
    color: '#0369a1',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  bodyPartTextDark: {
    color: '#60a5fa',
  },
  youtubeButton: {
    backgroundColor: '#FF0000',
    borderRadius: 16,
    padding: 0,
    overflow: 'hidden',
    shadowColor: '#FF0000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 0,
  },
  youtubeButtonDark: {
    backgroundColor: '#FF0000',
    shadowColor: '#FF0000',
    shadowOpacity: 0.4,
  },
  youtubeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    gap: 16,
  },
  youtubeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  youtubePlayIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  youtubePlayTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderRightWidth: 0,
    borderTopWidth: 7,
    borderBottomWidth: 7,
    borderLeftColor: '#FF0000',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: 'transparent',
    marginLeft: 2,
  },
  youtubeButtonTextContainer: {
    flex: 1,
    gap: 4,
  },
  youtubeButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  youtubeButtonSubtext: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    fontWeight: '500',
  },
  videoButton: {
    backgroundColor: ARJA_PRIMARY_START,
    borderRadius: 16,
    padding: 0,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: ARJA_PRIMARY_START,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 0,
  },
  videoButtonDark: {
    backgroundColor: ARJA_PRIMARY_START,
    shadowColor: ARJA_PRIMARY_START,
    shadowOpacity: 0.4,
  },
  videoButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    gap: 16,
  },
  videoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderRightWidth: 0,
    borderTopWidth: 7,
    borderBottomWidth: 7,
    borderLeftColor: ARJA_PRIMARY_START,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: 'transparent',
    marginLeft: 2,
  },
  videoButtonTextContainer: {
    flex: 1,
    gap: 4,
  },
  videoButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  videoButtonSubtext: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    fontWeight: '500',
  },
  videoButtonSubtextDark: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#051420',
    marginBottom: 16,
  },
  sectionTitleDark: {
    color: '#e6f2f8',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  statCardDark: {
    backgroundColor: '#1e3a5f',
    borderColor: '#2c4a5f',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: ARJA_PRIMARY_START,
  },
  statValueDark: {
    color: '#4FD4E4',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statLabelDark: {
    color: '#9ca3af',
  },
  descriptionText: {
    fontSize: 15,
    color: '#385868',
    lineHeight: 24,
  },
  descriptionTextDark: {
    color: '#90acbc',
  },
  tipsSection: {
    backgroundColor: '#fef3c7',
  },
  tipsSectionDark: {
    backgroundColor: '#3f2e1e',
  },
  tipsLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400e',
  },
  tipsTitleDark: {
    color: '#fbbf24',
  },
  tipsText: {
    fontSize: 14,
    color: '#78350f',
    lineHeight: 20,
  },
  tipsTextDark: {
    color: '#fde68a',
  },
});

