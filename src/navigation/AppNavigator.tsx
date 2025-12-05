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
import { useAppTheme } from '../utils/useAppTheme';
import { HomeIcon, BellIcon, QRCodeIcon, CreditCardIcon, CalendarIcon } from '../components/Icons';

// Screens
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import QRScreen from '../screens/QRScreen';
import MembershipsScreen from '../screens/MembershipsScreen';
import AppointmentsScreen from '../screens/AppointmentsScreen';

const ARJA_PRIMARY_START = '#13b5cf';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const { isDark } = useAppTheme();
  const isDarkMode = Boolean(isDark);
  
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true, // Por defecto, todos los tabs muestran label
        tabBarActiveTintColor: ARJA_PRIMARY_START,
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
      <Tab.Screen
        name="Inicio"
        component={HomeScreen}
        options={{
          tabBarShowLabel: true,
          tabBarIcon: ({ focused, color, size }) => {
            const iconSize = typeof size === 'number' ? size : 24;
            const isFocused = Boolean(focused);
            return <HomeIcon size={iconSize} color={isFocused ? ARJA_PRIMARY_START : (color || '#666')} filled={isFocused} />;
          },
        }}
      />
      
      <Tab.Screen
        name="Notificaciones"
        component={NotificationsScreen}
        options={{
          tabBarShowLabel: true,
          tabBarIcon: ({ focused, color, size }) => {
            const iconSize = typeof size === 'number' ? size : 24;
            const isFocused = Boolean(focused);
            return <BellIcon size={iconSize} color={isFocused ? ARJA_PRIMARY_START : (color || '#666')} filled={isFocused} />;
          },
        }}
      />
      
      <Tab.Screen
        name=" "
        component={QRScreen}
        options={{
          tabBarShowLabel: true,
          tabBarIcon: ({ focused, color, size }) => {
            const iconSize = typeof size === 'number' ? size : 24;
            const isFocused = Boolean(focused);
            const styleArray: any[] = [styles.qrTabButton];
            if (isFocused === true) {
              styleArray.push(styles.qrTabButtonActive);
            }
            if (Boolean(isDarkMode) === true) {
              styleArray.push(styles.qrTabButtonDark);
            }
            return (
              <View style={styleArray}>
                <QRCodeIcon size={iconSize + 4} color={isFocused ? '#ffffff' : ARJA_PRIMARY_START} />
              </View>
            );
          },
        }}
      />
      
      <Tab.Screen
        name="Membresías"
        component={MembershipsScreen}
        options={{
          tabBarShowLabel: true,
          tabBarIcon: ({ focused, color, size }) => {
            const iconSize = typeof size === 'number' ? size : 24;
            const isFocused = Boolean(focused);
            return <CreditCardIcon size={iconSize} color={isFocused ? ARJA_PRIMARY_START : (color || '#666')} />;
          },
        }}
      />
      
      <Tab.Screen
        name="Turnos"
        component={AppointmentsScreen}
        options={{
          tabBarShowLabel: true,
          tabBarIcon: ({ focused, color, size }) => {
            const iconSize = typeof size === 'number' ? size : 24;
            const isFocused = Boolean(focused);
            return <CalendarIcon size={iconSize} color={isFocused ? ARJA_PRIMARY_START : (color || '#666')} />;
          },
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, checkAuth } = useAuthStore();
  const [isReady, setIsReady] = useState(false);

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

  // CRÍTICO: initialRouteName debe ser un string válido, nunca undefined
  const initialRoute = authStatus ? 'Main' : 'Login';

  return (
    <NavigationContainer>
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
