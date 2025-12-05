/**
 * Pantalla de Turnos
 */
import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { CalendarIcon } from '../components/Icons';
import { useAppTheme } from '../utils/useAppTheme';

const ARJA_PRIMARY_START = '#13b5cf';

export default function AppointmentsScreen() {
  const { isDark } = useAppTheme();
  const isDarkMode = Boolean(isDark);
  
  return (
    <View style={[styles.screenContainer, isDarkMode && styles.screenContainerDark]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <View style={styles.emptyScreen}>
        <CalendarIcon size={64} color={isDarkMode ? '#4FD4E4' : ARJA_PRIMARY_START} />
        <Text style={[styles.emptyScreenTitle, isDarkMode && styles.emptyScreenTitleDark]}>Turnos</Text>
        <Text style={[styles.emptyScreenText, isDarkMode && styles.emptyScreenTextDark]}>
          Ver y gestionar tus turnos
        </Text>
      </View>
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
  emptyScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyScreenTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#051420',
    marginTop: 24,
    marginBottom: 8,
  },
  emptyScreenTitleDark: {
    color: '#e6f2f8',
  },
  emptyScreenText: {
    fontSize: 16,
    color: '#385868',
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyScreenTextDark: {
    color: '#90acbc',
  },
});

