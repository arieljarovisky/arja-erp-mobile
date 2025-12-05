/**
 * Navegación principal de la app
 * Versión simplificada para evitar errores de tipos
 */
import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Screens
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';

// Placeholder screens (crear después)
const PlaceholderScreen = ({ route }: any) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
    <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>
      {route.name}
    </Text>
    <Text style={{ color: '#666' }}>Pantalla en desarrollo</Text>
  </View>
);

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#999',
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarLabel: 'Inicio',
        }}
      />
      <Tab.Screen 
        name="Appointments" 
        component={PlaceholderScreen}
        options={{
          tabBarLabel: 'Turnos',
        }}
      />
      <Tab.Screen 
        name="Classes" 
        component={PlaceholderScreen}
        options={{
          tabBarLabel: 'Clases',
        }}
      />
      <Tab.Screen 
        name="Memberships" 
        component={PlaceholderScreen}
        options={{
          tabBarLabel: 'Membresías',
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Inicialmente siempre mostrar login
    setIsAuthenticated(false);
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!isAuthenticated ? (
          <Stack.Screen 
            name="Login" 
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <Stack.Screen 
            name="Main" 
            component={MainTabs}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
