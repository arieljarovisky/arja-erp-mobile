/**
 * Navegación principal de la app
 * Versión simplificada para evitar errores de tipos
 */
import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../store/useAuthStore';
import { useTenantStore } from '../store/useTenantStore';
import { useAppTheme } from '../utils/useAppTheme';
import { useAppSettingsStore, selectPrimaryColor, selectFeatureFlags } from '../store/useAppSettingsStore';
import { HomeIcon, BellIcon, QRCodeIcon, CalendarIcon, RoutinesIcon, CoursesIcon } from '../components/Icons';

// Screens
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import QRScreen from '../screens/QRScreen';
import AppointmentsScreen from '../screens/AppointmentsScreen';
import MembershipsScreen from '../screens/MembershipsScreen';
import RoutinesScreen from '../screens/RoutinesScreen';
import CreateWorkoutRoutineScreen from '../screens/CreateWorkoutRoutineScreen';
import WorkoutRoutineDetailScreen from '../screens/WorkoutRoutineDetailScreen';
import ExerciseDetailScreen from '../screens/ExerciseDetailScreen';
import CoursesScreen from '../screens/CoursesScreen';
import AvailableClassesScreen from '../screens/AvailableClassesScreen';
import TenantNotFoundScreen from '../screens/TenantNotFoundScreen';
import PaymentSuccessScreen from '../screens/PaymentSuccessScreen';

const ARJA_PRIMARY_START = '#13b5cf';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Stack Navigator para pantallas que necesitan el tab bar visible
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
    </Stack.Navigator>
  );
}

function NotificationsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="NotificationsMain" component={NotificationsScreen} />
    </Stack.Navigator>
  );
}

function QRStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="QRMain" component={QRScreen} />
    </Stack.Navigator>
  );
}

function RoutinesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="RoutinesMain" component={RoutinesScreen} />
      <Stack.Screen name="CreateWorkoutRoutine" component={CreateWorkoutRoutineScreen} />
      <Stack.Screen name="WorkoutRoutineDetail" component={WorkoutRoutineDetailScreen} />
      <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />
    </Stack.Navigator>
  );
}

function AppointmentsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AppointmentsMain" component={AppointmentsScreen} />
    </Stack.Navigator>
  );
}

function ClassesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ClassesMain" component={CoursesScreen} />
      <Stack.Screen name="AvailableClasses" component={AvailableClassesScreen} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  const { isDark } = useAppTheme();
  const isDarkMode = Boolean(isDark);
  const primaryColor = useAppSettingsStore(selectPrimaryColor);
  const featureFlags = useAppSettingsStore(selectFeatureFlags);
   const tenantFeatures = useTenantStore(state => state.features);
  
  const tabs = [
    {
      key: 'home',
      name: 'Inicio',
      component: HomeStack,
      icon: HomeIcon,
      feature: true,
    },
    {
      key: 'notifications',
      name: 'Notificaciones',
      component: NotificationsStack,
      icon: BellIcon,
      feature: featureFlags.notifications,
      filled: true,
    },
    {
      key: 'qr',
      name: 'QRTab',
      label: ' ',
      component: QRStack,
      icon: QRCodeIcon,
      feature: featureFlags.qr,
      isQr: true,
    },
    {
      key: 'routines',
      name: 'Rutinas',
      component: RoutinesStack,
      icon: RoutinesIcon,
      feature: featureFlags.routines && (tenantFeatures?.has_routines ?? true),
    },
    {
      key: 'appointments',
      name: 'Turnos',
      component: AppointmentsStack,
      icon: CalendarIcon,
      feature: true,
    },
  ].filter(t => t.feature);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: primaryColor,
        tabBarInactiveTintColor: isDarkMode ? '#90acbc' : '#666',
        tabBarStyle: {
          backgroundColor: isDarkMode ? '#1e2f3f' : '#ffffff',
          borderTopWidth: 1,
          borderTopColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          height: Platform.OS === 'ios' ? 90 : 70,
          paddingBottom: Platform.OS === 'ios' ? 25 : 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500' as const,
        },
      }}
    >
      {tabs.map(tab => (
        <Tab.Screen
          key={tab.key}
          name={tab.name}
          component={tab.component}
          options={{
            tabBarShowLabel: true,
            title: tab.label || tab.name,
            tabBarIcon: ({ focused, color, size }) => {
              const iconSize = typeof size === 'number' ? size : 24;
              const isFocused = Boolean(focused);
              if (tab.isQr) {
                const styleArray: any[] = [styles.qrTabButton];
                if (isFocused === true) styleArray.push(styles.qrTabButtonActive);
                if (Boolean(isDarkMode) === true) styleArray.push(styles.qrTabButtonDark);
                return (
                  <View style={styleArray}>
                    <tab.icon size={iconSize + 4} color={isFocused ? '#ffffff' : primaryColor} />
                  </View>
                );
              }
              return (
                <tab.icon
                  size={iconSize}
                  color={isFocused ? primaryColor : (color || '#666')}
                  {...(tab.filled ? { filled: isFocused } : {})}
                />
              );
            },
          }}
        />
      ))}
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, checkAuth } = useAuthStore();
  const { tenantNotFound } = useTenantStore();
  const [isReady, setIsReady] = useState(false);
  const fetchSettings = useAppSettingsStore(state => state.fetchSettings);

  useEffect(() => {
    // Verificar autenticación al montar
    const initAuth = async () => {
      try {
        await checkAuth();
      } catch (error) {
        console.error('[AppNavigator] Error inicializando auth:', error);
        // Continuar aunque haya error, con isAuthenticated = false
      } finally {
        setIsReady(true);
      }
    };
    initAuth();
  }, [checkAuth]);

  // CRÍTICO: Asegurar que isAuthenticated sea SIEMPRE un boolean válido
  // Usar ?? false para manejar undefined/null, luego Boolean() para asegurar tipo
  const authStatus = Boolean(isAuthenticated ?? false);
  
  // Log para debugging
  useEffect(() => {
    console.log('[AppNavigator] Estado de autenticación:', { isAuthenticated, authStatus, tenantNotFound });
  }, [isAuthenticated, authStatus, tenantNotFound]);

  // Cargar configuraciones de app (tema/branding) cuando el usuario esté autenticado
  useEffect(() => {
    if (authStatus) {
      fetchSettings().catch(() => {});
    }
  }, [authStatus, fetchSettings]);

  // Mostrar loading mientras se verifica la autenticación
  // Nunca retornar null, siempre retornar un componente válido
  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  // Si el tenant no existe y el usuario está autenticado, mostrar pantalla de error
  if (authStatus && tenantNotFound) {
    console.log('[AppNavigator] Mostrando pantalla TenantNotFound - authStatus:', authStatus, 'tenantNotFound:', tenantNotFound);
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="TenantNotFound" component={TenantNotFoundScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  // CRÍTICO: initialRouteName debe ser un string válido, nunca undefined
  const initialRoute = authStatus ? 'Main' : 'Login';

  // Usar key para forzar re-render cuando cambie el estado de autenticación
  // Esto asegura que el navegador se reinicialice con la ruta correcta
  const navigationKey = authStatus ? 'authenticated' : 'unauthenticated';

  return (
    <NavigationContainer key={navigationKey}>
      <Stack.Navigator 
        screenOptions={{ headerShown: false }}
        initialRouteName={initialRoute}
      >
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{ 
          headerShown: false,
          // ⚠️ RN19 + Fabric: NO usar gestureEnabled, animationEnabled, animationTypeForReplace,
          // presentation, fullScreenGestureEnabled, replaceAnimation, cardStyleInterpolator, cardShadowEnabled
        }}
      />
      <Stack.Screen 
        name="Main" 
        component={MainTabs}
        options={{ 
          headerShown: false,
          // ⚠️ RN19 + Fabric: NO usar gestureEnabled, animationEnabled, animationTypeForReplace,
          // presentation, fullScreenGestureEnabled, replaceAnimation, cardStyleInterpolator, cardShadowEnabled
        }}
      />
      <Stack.Screen 
        name="TenantNotFound" 
        component={TenantNotFoundScreen}
        options={{ 
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="PaymentSuccess" 
        component={PaymentSuccessScreen}
        options={{ 
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="Membresías" 
        component={MembershipsScreen}
        options={{ 
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="Classes" 
        component={ClassesStack}
        options={{ 
          headerShown: false,
        }}
      />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  // Botón QR destacado en el menú
  qrTabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -16, // Ajustar para alinear verticalmente con los otros iconos (el botón es más grande)
    borderWidth: 2,
    borderColor: ARJA_PRIMARY_START,
    shadowColor: ARJA_PRIMARY_START,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  qrTabButtonActive: {
    backgroundColor: ARJA_PRIMARY_START,
    borderColor: ARJA_PRIMARY_START,
  },
  qrTabButtonDark: {
    backgroundColor: '#1e2f3f',
    borderColor: ARJA_PRIMARY_START,
  },
});
