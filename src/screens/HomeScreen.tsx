/**
 * Pantalla Principal / Home
 * Versión simplificada
 */
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';

interface HomeScreenProps {
  navigation: any;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.greeting}>
            ¡Hola! 👋
          </Text>
          <Text style={styles.subtitle}>¿Qué querés hacer hoy?</Text>
        </View>

        <View style={styles.menuContainer}>
          <TouchableOpacity style={styles.menuCard}>
            <Text style={styles.cardTitle}>📅 Mis Turnos</Text>
            <Text style={styles.cardDescription}>Ver y gestionar tus turnos</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuCard}>
            <Text style={styles.cardTitle}>➕ Reservar Turno</Text>
            <Text style={styles.cardDescription}>Reservar un nuevo turno</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuCard}>
            <Text style={styles.cardTitle}>🏋️ Clases</Text>
            <Text style={styles.cardDescription}>Ver e inscribirse a clases grupales</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuCard}>
            <Text style={styles.cardTitle}>💳 Membresías</Text>
            <Text style={styles.cardDescription}>Ver y gestionar tu membresía</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  menuContainer: {
    padding: 20,
    paddingTop: 10,
  },
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
  },
});
