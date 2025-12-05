/**
 * Componente principal - App móvil para CLIENTES con estilos ARJA ERP
 * OAuth de Google para identificar automáticamente el negocio
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';

// Cerrar el navegador después de la autenticación
WebBrowser.maybeCompleteAuthSession();

// Obtener el redirect URI para OAuth (deep link)
const getRedirectUri = () => {
  return Linking.createURL('/oauth/callback');
};

const API_BASE_URL = 'https://backend-production-1042.up.railway.app';

// Colores ARJA ERP
const ARJA_PRIMARY_START = '#13b5cf';
const ARJA_PRIMARY_END = '#0d7fd4';

// Pantalla de login para CLIENTES con OAuth
function CustomerLoginScreen({ onLogin }: { onLogin: (customerData: any) => void }) {
  const [loading, setLoading] = useState(false);
  const [oAuthLoading, setOAuthLoading] = useState(false);

  // Manejar login con Google OAuth
  const handleGoogleOAuth = async () => {
    setOAuthLoading(true);
    try {
      const redirectUri = getRedirectUri();
      
      // Obtener la URL de autorización del backend con el redirect URI de la app
      const authUrlResponse = await fetch(
        `${API_BASE_URL}/api/public/customer/oauth/google?redirect_uri=${encodeURIComponent(redirectUri)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const authUrlData = await authUrlResponse.json();

      if (!authUrlData.ok || !authUrlData.authUrl) {
        Alert.alert('Error', authUrlData.error || 'Error al iniciar autenticación');
        return;
      }

      // Abrir el navegador para autenticación con el redirect URI de la app
      const result = await WebBrowser.openAuthSessionAsync(
        authUrlData.authUrl,
        redirectUri
      );

      if (result.type === 'success' && result.url) {
        // Extraer el código de la URL de respuesta
        try {
          const url = new URL(result.url);
          const code = url.searchParams.get('code');
          const error = url.searchParams.get('error');
          const errorDescription = url.searchParams.get('error_description');

          if (error) {
            Alert.alert(
              'Error de Autenticación',
              errorDescription || `Error: ${error}\n\nVerificá que el redirect URI esté configurado en Google Cloud Console.`
            );
            console.error('[OAuth] Error en la URL:', { error, errorDescription, url: result.url });
            return;
          }

          if (!code) {
            Alert.alert('Error', 'No se recibió código de autorización. Intentá nuevamente.');
            console.error('[OAuth] No se encontró código en la URL:', result.url);
            return;
          }

          console.log('[OAuth] Código recibido, intercambiando...');
          // Intercambiar código por datos del cliente
          await exchangeCodeForCustomerData(code, redirectUri);
        } catch (urlError: any) {
          console.error('[OAuth] Error parseando URL:', urlError, result.url);
          Alert.alert('Error', 'Error al procesar la respuesta de Google. Intentá nuevamente.');
        }
      } else if (result.type === 'cancel') {
        console.log('OAuth cancelado por el usuario');
      } else {
        console.error('[OAuth] Resultado inesperado:', result);
        Alert.alert('Error', 'No se pudo completar la autenticación. Intentá nuevamente.');
      }
    } catch (error: any) {
      console.error('Error en OAuth:', error);
      Alert.alert('Error', 'Error al iniciar sesión con Google');
    } finally {
      setOAuthLoading(false);
    }
  };

  // Intercambiar código por datos del cliente
  const exchangeCodeForCustomerData = async (code: string, redirectUri: string) => {
    setLoading(true);
    try {
      // Usar el nuevo endpoint para intercambiar el código directamente
      const response = await fetch(
        `${API_BASE_URL}/api/public/customer/oauth/exchange-code`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            redirect_uri: redirectUri,
          }),
        }
      );

      const data = await response.json();

      if (!data.ok) {
        if (data.errorCode === 'CUSTOMER_NOT_FOUND') {
          Alert.alert(
            'Cuenta no encontrada',
            'No se encontró una cuenta asociada a este email. Por favor, registrate primero en el negocio.'
          );
        } else {
          const errorMessage = data.error || 'Error al autenticarse';
          const errorDetails = data.errorDetails ? `\n\nDetalles: ${data.errorDetails}` : '';
          Alert.alert('Error de Autenticación', errorMessage + errorDetails);
          console.error('[OAuth] Error del backend:', data);
        }
        return;
      }

      // Si hay múltiples tenants, mostrar selector
      if (data.multipleTenants && data.tenants) {
        // Por ahora, usar el primer tenant
        // TODO: Implementar selector de tenant
        const firstTenant = data.tenants[0];
        await handleTenantSelection(data.email, firstTenant.tenant_id);
        return;
      }

      // Si hay un solo tenant o datos directos
      if (data.data) {
        const customerData = {
          customerId: data.data.customer_id,
          tenantId: data.data.tenant_id,
          tenantName: data.data.tenant_name,
          name: data.data.name,
          phone: data.data.phone,
          email: data.data.email,
          dni: data.data.dni,
        };

        await AsyncStorage.setItem('customer_data', JSON.stringify(customerData));
        await AsyncStorage.setItem('customer_id', String(data.data.customer_id));
        await AsyncStorage.setItem('tenant_id', String(data.data.tenant_id));
        onLogin(customerData);
      }
    } catch (error: any) {
      console.error('Error intercambiando código:', error);
      Alert.alert('Error', 'Error al obtener datos del cliente');
    } finally {
      setLoading(false);
    }
  };

  // Seleccionar tenant cuando hay múltiples
  const handleTenantSelection = async (email: string, tenantId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/public/customer/oauth/select-tenant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          tenant_id: tenantId,
        }),
      });

      const data = await response.json();

      if (!data.ok) {
        Alert.alert('Error', data.error || 'Error al seleccionar negocio');
        return;
      }

      const customerData = {
        customerId: data.data.customer_id,
        tenantId: data.data.tenant_id,
        tenantName: data.data.tenant_name,
        name: data.data.name,
        phone: data.data.phone,
        email: data.data.email,
        dni: data.data.dni,
      };

      await AsyncStorage.setItem('customer_data', JSON.stringify(customerData));
      await AsyncStorage.setItem('customer_id', String(data.data.customer_id));
      await AsyncStorage.setItem('tenant_id', String(data.data.tenant_id));
      onLogin(customerData);
    } catch (error: any) {
      console.error('Error seleccionando tenant:', error);
      Alert.alert('Error', 'Error al seleccionar negocio');
    }
  };

  return (
    <View style={styles.loginContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ScrollView
        contentContainerStyle={styles.loginContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>AR</Text>
          </View>
          <Text style={styles.appName}>ARJA ERP</Text>
        </View>

        <Text style={styles.welcomeTitle}>¡Bienvenido! 👋</Text>
        <Text style={styles.welcomeSubtitle}>
          Ingresá con tu cuenta de Google para acceder a tus turnos y servicios
        </Text>

        <TouchableOpacity
          style={[styles.googleButton, (loading || oAuthLoading) && styles.buttonDisabled]}
          onPress={handleGoogleOAuth}
          disabled={loading || oAuthLoading}
          activeOpacity={0.8}
        >
          {(loading || oAuthLoading) ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text style={styles.googleButtonEmoji}>🔐</Text>
              <Text style={styles.googleButtonText}>Ingresar con Google</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.helpText}>
          El sistema identificará automáticamente tu negocio según tu email
        </Text>
      </ScrollView>
    </View>
  );
}

// Pantalla Home para CLIENTES
function CustomerHomeScreen({ customerData, onLogout }: { customerData: any; onLogout: () => void }) {
  return (
    <View style={styles.homeContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <ScrollView
        style={styles.homeScrollView}
        contentContainerStyle={styles.homeContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.homeHeader}>
          <View style={styles.headerText}>
            <Text style={styles.homeGreeting}>¡Hola!</Text>
            <Text style={styles.homeUserName}>
              {customerData?.name || customerData?.phone || 'Cliente'}
            </Text>
            {customerData?.tenantName && (
              <Text style={styles.tenantName}>{customerData.tenantName}</Text>
            )}
          </View>
          <TouchableOpacity onPress={onLogout} style={styles.profileButton}>
            <Text style={styles.profileEmoji}>👤</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.menuGrid}>
          <TouchableOpacity style={[styles.menuCard, styles.cardBlue]} activeOpacity={0.8}>
            <View style={[styles.cardIcon, styles.iconBlue]}>
              <Text style={styles.cardEmoji}>📅</Text>
            </View>
            <Text style={styles.cardTitle}>Mis Turnos</Text>
            <Text style={styles.cardDescription}>Ver y gestionar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuCard, styles.cardGreen]} activeOpacity={0.8}>
            <View style={[styles.cardIcon, styles.iconGreen]}>
              <Text style={styles.cardEmoji}>➕</Text>
            </View>
            <Text style={styles.cardTitle}>Reservar</Text>
            <Text style={styles.cardDescription}>Nuevo turno</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuCard, styles.cardOrange]} activeOpacity={0.8}>
            <View style={[styles.cardIcon, styles.iconOrange]}>
              <Text style={styles.cardEmoji}>🏋️</Text>
            </View>
            <Text style={styles.cardTitle}>Clases</Text>
            <Text style={styles.cardDescription}>Ver clases</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuCard, styles.cardPurple]} activeOpacity={0.8}>
            <View style={[styles.cardIcon, styles.iconPurple]}>
              <Text style={styles.cardEmoji}>💳</Text>
            </View>
            <Text style={styles.cardTitle}>Membresías</Text>
            <Text style={styles.cardDescription}>Ver planes</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

// Componente principal
export default function App() {
  const [customerData, setCustomerData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedCustomerData = await AsyncStorage.getItem('customer_data');
        if (storedCustomerData) {
          setCustomerData(JSON.parse(storedCustomerData));
        }
      } catch (error) {
        console.error('Error verificando auth:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.multiRemove([
      'customer_data',
      'tenant_id',
      'customer_id',
      'customer_phone',
      'customer_dni',
    ]);
    setCustomerData(null);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingBox}>
          <View style={styles.loadingLogoCircle}>
            <Text style={styles.loadingLogoText}>AR</Text>
          </View>
          <ActivityIndicator size="large" color={ARJA_PRIMARY_START} style={styles.loadingSpinner} />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </View>
    );
  }

  if (customerData) {
    return <CustomerHomeScreen customerData={customerData} onLogout={handleLogout} />;
  }

  return <CustomerLoginScreen onLogin={setCustomerData} />;
}

const styles = StyleSheet.create({
  // Loading
  loadingContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingBox: {
    alignItems: 'center',
  },
  loadingLogoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: ARJA_PRIMARY_START,
    shadowColor: ARJA_PRIMARY_START,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  loadingLogoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: ARJA_PRIMARY_START,
    letterSpacing: 2,
  },
  loadingSpinner: {
    marginVertical: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    fontWeight: '500',
  },

  // Login
  loginContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loginContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: ARJA_PRIMARY_START,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 3,
    borderColor: ARJA_PRIMARY_START,
  },
  logoText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: ARJA_PRIMARY_START,
    letterSpacing: 2,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    letterSpacing: 1,
  },
  welcomeTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 48,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  googleButton: {
    backgroundColor: '#4285F4',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#4285F4',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32,
    shadowRadius: 12,
    elevation: 6,
  },
  googleButtonEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  googleButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  helpText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },

  // Home
  homeContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  homeScrollView: {
    flex: 1,
  },
  homeContent: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
  },
  homeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 4,
  },
  headerText: {
    flex: 1,
  },
  homeGreeting: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
    fontWeight: '500',
  },
  homeUserName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  tenantName: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  profileButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  profileEmoji: {
    fontSize: 26,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  cardBlue: {
    borderTopWidth: 4,
    borderTopColor: ARJA_PRIMARY_START,
  },
  cardGreen: {
    borderTopWidth: 4,
    borderTopColor: '#34d399',
  },
  cardOrange: {
    borderTopWidth: 4,
    borderTopColor: '#f59e0b',
  },
  cardPurple: {
    borderTopWidth: 4,
    borderTopColor: '#a855f7',
  },
  cardIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBlue: {
    backgroundColor: 'rgba(19, 181, 207, 0.12)',
  },
  iconGreen: {
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
  },
  iconOrange: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  iconPurple: {
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
  },
  cardEmoji: {
    fontSize: 32,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 6,
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
});
