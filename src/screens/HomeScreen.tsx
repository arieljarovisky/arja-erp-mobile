/**
 * Pantalla Principal / Home con estilos ARJA ERP
 */
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  StatusBar,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../store/useAuthStore';
import { useTenantStore } from '../store/useTenantStore';
import { useAppTheme } from '../utils/useAppTheme';
import { CalendarIcon, PlusIcon, ClassesIcon, CreditCardIcon, UserIcon, RoutinesIcon } from '../components/Icons';

const ARJA_PRIMARY_START = '#13b5cf';
const ARJA_PRIMARY_END = '#0d7fd4';

interface HomeScreenProps {
  navigation: any;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const { isDark } = useAppTheme();
  const { customerName, phone, tenantId, clearAuth } = useAuthStore();
  const { loadFeatures, clearFeatures } = useTenantStore();
  const [refreshing, setRefreshing] = React.useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Cargar features del tenant al montar
  React.useEffect(() => {
    if (tenantId) {
      loadFeatures(tenantId);
    }
  }, [tenantId, loadFeatures]);
  
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Simulación de carga
      await new Promise(resolve => setTimeout(resolve, 1000));
      // TODO: Agregar llamadas a la API para actualizar datos
    } catch (error) {
      console.error('Error refreshing data:', error);
      Alert.alert('Error', 'No se pudo actualizar la información');
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro que querés cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
          onPress: () => setShowProfileMenu(false),
        },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAuth();
              await clearFeatures();
              setShowProfileMenu(false);
              // La navegación se manejará automáticamente por el AppNavigator
            } catch (error) {
              console.error('Error al cerrar sesión:', error);
              Alert.alert('Error', 'No se pudo cerrar sesión. Intentá nuevamente.');
            }
          },
        },
      ]
    );
  };
  
  return (
    <View style={[styles.homeContainer, isDark && styles.homeContainerDark]}>
      <StatusBar barStyle="light-content" backgroundColor={ARJA_PRIMARY_START} translucent={true} />
      <View style={styles.homeWrapper}>
        <ScrollView
          style={styles.homeScrollView}
          contentContainerStyle={styles.homeContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={ARJA_PRIMARY_START}
              colors={[ARJA_PRIMARY_START]}
              progressBackgroundColor="#ffffff"
            />
          }
        >
        {/* Header con gradiente */}
        <View style={[styles.homeHeader, isDark && styles.homeHeaderDark]}>
          <LinearGradient
            colors={[ARJA_PRIMARY_START, ARJA_PRIMARY_END]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <View style={styles.headerContent}>
              <View style={styles.headerText}>
                <Text style={[styles.homeGreeting, isDark && styles.homeGreetingDark]}>¡Hola!</Text>
                <Text style={[styles.homeUserName, isDark && styles.homeUserNameDark]}>
                  {customerName || phone || 'Cliente'}
                </Text>
              </View>
              <TouchableOpacity 
                style={[styles.profileButton, isDark && styles.profileButtonDark]}
                activeOpacity={0.7}
                onPress={() => setShowProfileMenu(true)}
              >
                <UserIcon size={20} color={isDark ? '#e6f2f8' : '#ffffff'} />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Sección de acciones rápidas */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>Acciones rápidas</Text>
          <View style={styles.menuGrid}>
            {/* Las tarjetas se muestran siempre, pero las pantallas verifican las features internamente */}
            {/* Mis Turnos */}
            <TouchableOpacity 
              style={styles.menuCard} 
              activeOpacity={0.8}
              onPress={() => {
                // Navegar directamente al tab de Turnos
                navigation.navigate('Turnos');
              }}
            >
              <LinearGradient
                colors={['#1a9bc8', ARJA_PRIMARY_START]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <View style={styles.cardGradientOverlay}>
                  <View style={[styles.cardIcon, styles.iconWhite]}>
                    <CalendarIcon size={28} color="#ffffff" />
                  </View>
                  <Text style={[styles.cardTitle, styles.cardTitleWhite]}>Mis Turnos</Text>
                  <Text style={[styles.cardDescription, styles.cardDescriptionWhite]}>Ver y gestionar</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Reservar Turno */}
            <TouchableOpacity 
              style={styles.menuCard} 
              activeOpacity={0.8}
              onPress={() => {
                Alert.alert('Reservar', 'Próximamente: Reservar nuevo turno');
              }}
            >
              <LinearGradient
                colors={[ARJA_PRIMARY_START, '#0d7fd4']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <View style={styles.cardGradientOverlay}>
                  <View style={[styles.cardIcon, styles.iconWhite]}>
                    <PlusIcon size={28} color="#ffffff" />
                  </View>
                  <Text style={[styles.cardTitle, styles.cardTitleWhite]}>Reservar</Text>
                  <Text style={[styles.cardDescription, styles.cardDescriptionWhite]}>Nuevo turno</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Clases */}
            <TouchableOpacity 
              style={styles.menuCard} 
              activeOpacity={0.8}
              onPress={() => {
                navigation.navigate('Classes');
              }}
            >
              <LinearGradient
                colors={['#0d7fd4', '#1a9bc8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <View style={styles.cardGradientOverlay}>
                  <View style={[styles.cardIcon, styles.iconWhite]}>
                    <ClassesIcon size={28} color="#ffffff" />
                  </View>
                  <Text style={[styles.cardTitle, styles.cardTitleWhite]}>Clases</Text>
                  <Text style={[styles.cardDescription, styles.cardDescriptionWhite]}>Individuales y grupales</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Membresías */}
            <TouchableOpacity 
              style={styles.menuCard} 
              activeOpacity={0.8}
              onPress={() => {
                // Navegar directamente al tab de Membresías
                navigation.navigate('Membresías');
              }}
            >
              <LinearGradient
                colors={[ARJA_PRIMARY_END, '#0a8bb8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <View style={styles.cardGradientOverlay}>
                  <View style={[styles.cardIcon, styles.iconWhite]}>
                    <CreditCardIcon size={28} color="#ffffff" />
                  </View>
                  <Text style={[styles.cardTitle, styles.cardTitleWhite]}>Membresías</Text>
                  <Text style={[styles.cardDescription, styles.cardDescriptionWhite]}>Ver planes y pagos</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Rutinas */}
            <TouchableOpacity 
              style={styles.menuCard} 
              activeOpacity={0.8}
              onPress={() => {
                navigation.navigate('Routines');
              }}
            >
              <LinearGradient
                colors={['#8b5cf6', '#7c3aed']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <View style={styles.cardGradientOverlay}>
                  <View style={[styles.cardIcon, styles.iconWhite]}>
                    <RoutinesIcon size={28} color="#ffffff" />
                  </View>
                  <Text style={[styles.cardTitle, styles.cardTitleWhite]}>Rutinas</Text>
                  <Text style={[styles.cardDescription, styles.cardDescriptionWhite]}>Mis rutinas</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
        </ScrollView>
      </View>

      {/* Modal de menú de perfil */}
      <Modal
        visible={showProfileMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowProfileMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowProfileMenu(false)}
        >
          <View style={[styles.profileMenu, isDark && styles.profileMenuDark]}>
            <View style={[styles.profileMenuHeader, isDark && { borderBottomColor: '#2c4a5f' }]}>
              <Text style={[styles.profileMenuTitle, isDark && styles.profileMenuTitleDark]}>
                {customerName || phone || 'Usuario'}
              </Text>
              <Text style={[styles.profileMenuSubtitle, isDark && styles.profileMenuSubtitleDark]}>
                {phone || 'Sin teléfono'}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.profileMenuButton, styles.logoutButton]}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.profileMenuButton, styles.cancelButton, isDark && styles.cancelButtonDark]}
              onPress={() => setShowProfileMenu(false)}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelButtonText, isDark && styles.cancelButtonTextDark]}>
                Cancelar
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  homeContainer: {
    flex: 1,
    backgroundColor: '#f5f9fc',
  },
  homeContainerDark: {
    backgroundColor: '#0e1c2c',
  },
  homeWrapper: {
    flex: 1,
    position: 'relative',
  },
  homeScrollView: {
    flex: 1,
  },
  homeContent: {
    paddingBottom: 100,
  },
  homeHeader: {
    paddingTop: 0,
    paddingBottom: 0,
    marginBottom: 24,
    overflow: 'hidden',
  },
  homeHeaderDark: {
    backgroundColor: '#1e2f3f',
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 40) + 10,
    paddingBottom: 32,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: ARJA_PRIMARY_START,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerText: {
    flex: 1,
    paddingRight: 12,
  },
  homeGreeting: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 6,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  homeGreetingDark: {
    color: 'rgba(230, 242, 248, 0.8)',
  },
  homeUserName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  homeUserNameDark: {
    color: '#e6f2f8',
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  profileButtonDark: {
    backgroundColor: 'rgba(46, 74, 95, 0.4)',
    borderColor: 'rgba(79, 212, 228, 0.3)',
  },
  sectionContainer: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#051420',
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  sectionTitleDark: {
    color: '#e6f2f8',
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  menuCard: {
    width: '48%',
    borderRadius: 20,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: ARJA_PRIMARY_START,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  cardGradient: {
    borderRadius: 20,
    minHeight: 140,
  },
  cardGradientOverlay: {
    padding: 20,
    alignItems: 'center',
    minHeight: 140,
    justifyContent: 'center',
  },
  cardIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  iconWhite: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#051420',
    marginBottom: 4,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  cardTitleWhite: {
    color: '#ffffff',
  },
  cardDescription: {
    fontSize: 12,
    color: '#385868',
    textAlign: 'center',
    fontWeight: '400',
    lineHeight: 16,
  },
  cardDescriptionWhite: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  profileMenu: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  profileMenuDark: {
    backgroundColor: '#1e2f3f',
  },
  profileMenuHeader: {
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  profileMenuTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#051420',
    marginBottom: 4,
  },
  profileMenuTitleDark: {
    color: '#e6f2f8',
  },
  profileMenuSubtitle: {
    fontSize: 14,
    color: '#385868',
  },
  profileMenuSubtitleDark: {
    color: '#90acbc',
  },
  profileMenuButton: {
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#d2d8e0',
  },
  cancelButtonDark: {
    borderColor: '#2c4a5f',
  },
  cancelButtonText: {
    color: '#385868',
    fontSize: 16,
    fontWeight: '500',
  },
  cancelButtonTextDark: {
    color: '#90acbc',
  },
});
