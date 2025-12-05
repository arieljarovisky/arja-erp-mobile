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
  TextInput,
  KeyboardAvoidingView,
  useColorScheme,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';

// Cerrar el navegador después de la autenticación
WebBrowser.maybeCompleteAuthSession();

const API_BASE_URL = 'https://backend-production-1042.up.railway.app';

// Obtener el redirect URI para OAuth
// Usamos el callback del backend (que ya está en Google Cloud Console)
// NO necesitamos agregar arja-erp://oauth/callback porque Google no lo acepta
const getRedirectUri = () => {
  return `${API_BASE_URL}/api/public/customer/oauth/google/callback`;
};

// Colores ARJA ERP
const ARJA_PRIMARY_START = '#13b5cf';
const ARJA_PRIMARY_END = '#0d7fd4';

// Componente de Logo ARJA ERP
function ArjaLogo({ size = 80, isDark = false }: { size?: number; isDark?: boolean }) {
  const logoSize = size;
  const iconSize = logoSize * 0.85;
  
  const primaryColor = isDark ? '#4FD4E4' : ARJA_PRIMARY_START;
  const secondaryColor = isDark ? '#46C5E6' : ARJA_PRIMARY_END;
  const bgColor = isDark ? 'rgba(7, 23, 36, 0.96)' : '#ffffff';
  const borderColor = isDark ? 'rgba(79, 212, 228, 0.28)' : 'rgba(19, 181, 207, 0.16)';
  
  return (
    <View style={[
      styles.logoWrapper, 
      { 
        width: logoSize, 
        height: logoSize,
        backgroundColor: bgColor,
        borderRadius: logoSize * 0.22,
        borderWidth: 1,
        borderColor: borderColor,
        shadowColor: isDark ? '#053968' : ARJA_PRIMARY_START,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0.36 : 0.15,
        shadowRadius: 12,
        elevation: 6,
      }
    ]}>
      <View style={[styles.logoIconContainer, { width: iconSize, height: iconSize }]}>
        {/* Letra A estilizada con gradiente simulado */}
        <View style={styles.logoA}>
          <Text style={[
            styles.logoAText, 
            { 
              fontSize: iconSize * 0.55, 
              color: primaryColor,
              fontWeight: '700',
            }
          ]}>
            A
          </Text>
        </View>
        {/* Engranaje en la esquina */}
        <View style={[
          styles.logoGear, 
          { 
            right: -iconSize * 0.1, 
            top: iconSize * 0.35,
            width: iconSize * 0.25,
            height: iconSize * 0.25,
          }
        ]}>
          <Text style={{ 
            fontSize: iconSize * 0.2, 
            color: secondaryColor,
            opacity: 0.9,
          }}>
            ⚙
          </Text>
        </View>
      </View>
    </View>
  );
}

// Pantalla de login para CLIENTES con OAuth
function CustomerLoginScreen({ onLogin }: { onLogin: (customerData: any) => void }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [loading, setLoading] = useState(false);
  const [oAuthLoading, setOAuthLoading] = useState(false);
  const [showTenantSelection, setShowTenantSelection] = useState(false);
  const [tenantCode, setTenantCode] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingName, setPendingName] = useState('');

  // Manejar login con Google OAuth
  const handleGoogleOAuth = async () => {
    setOAuthLoading(true);
    try {
      const redirectUri = getRedirectUri();
      const appDeepLink = 'arja-erp://oauth/callback'; // Deep link de la app
      
      // Obtener la URL de autorización del backend con el redirect URI del backend y el deep link de la app
      const authUrlResponse = await fetch(
        `${API_BASE_URL}/api/public/customer/oauth/google?redirect_uri=${encodeURIComponent(redirectUri)}&app_deep_link=${encodeURIComponent(appDeepLink)}`,
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

      // Abrir el navegador para autenticación con el redirect URI del backend
      // Pero esperamos recibir el código en el deep link de la app
      const result = await WebBrowser.openAuthSessionAsync(
        authUrlData.authUrl,
        appDeepLink // Usar el deep link de la app para capturar la redirección
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

      let data;
      try {
        const responseText = await response.text();
        console.log('[OAuth] Respuesta del servidor (texto):', responseText);
        data = JSON.parse(responseText);
      } catch (jsonError) {
        console.error('[OAuth] Error parseando JSON:', jsonError);
        Alert.alert('Error', 'Error al procesar la respuesta del servidor');
        return;
      }
      
      console.log('[OAuth] Respuesta del backend (JSON):', JSON.stringify(data, null, 2));
      console.log('[OAuth] Status code:', response.status);
      console.log('[OAuth] data.ok:', data.ok);
      console.log('[OAuth] data.errorCode:', data.errorCode);
      console.log('[OAuth] data.needsTenantSelection:', data.needsTenantSelection);

      if (!data.ok) {
        console.log('[OAuth] Error detectado:', {
          errorCode: data.errorCode,
          needsTenantSelection: data.needsTenantSelection,
          email: data.email,
          name: data.name,
        });
        
        if ((data.errorCode === 'CUSTOMER_NOT_FOUND' || data.errorCode === 'NO_TENANTS_FOUND') && data.needsTenantSelection) {
          console.log('[OAuth] ✅ Usuario no asociado a ningún negocio, mostrando pantalla para ingresar código');
          console.log('[OAuth] Email:', data.email);
          console.log('[OAuth] Name:', data.name);
          // Usuario no está asociado a ningún negocio - mostrar pantalla para ingresar código
          setPendingEmail(data.email || '');
          setPendingName(data.name || '');
          setShowTenantSelection(true);
          setLoading(false);
          return;
        } else if (data.errorCode === 'CUSTOMER_NOT_FOUND') {
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

      // Si hay un solo tenant o datos directos - el usuario ya está asociado a un negocio
      if (data.data && data.data.tenant_id) {
        const customerData = {
          customerId: data.data.customer_id,
          tenantId: data.data.tenant_id,
          tenantName: data.data.tenant_name,
          name: data.data.name,
          phone: data.data.phone,
          email: data.data.email,
          dni: data.data.dni,
        };

        // Usuario ya está asociado a un negocio - hacer login directo
        await AsyncStorage.setItem('customer_data', JSON.stringify(customerData));
        await AsyncStorage.setItem('customer_id', String(data.data.customer_id));
        await AsyncStorage.setItem('tenant_id', String(data.data.tenant_id));
        // Guardar también el código del negocio si existe
        if (data.data.tenant_slug) {
          await AsyncStorage.setItem('tenant_code', data.data.tenant_slug);
        }
        onLogin(customerData);
        return;
      }
    } catch (error: any) {
      console.error('Error intercambiando código:', error);
      Alert.alert('Error', 'Error al obtener datos del cliente');
    } finally {
      setLoading(false);
    }
  };

  // Registrar cliente nuevo con código de negocio
  const handleRegisterWithTenant = async () => {
    if (!tenantCode.trim()) {
      Alert.alert('Error', 'Por favor, ingresá el código del negocio');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/public/customer/oauth/register`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: pendingEmail,
            tenant_code: tenantCode.trim(),
            name: pendingName,
          }),
        }
      );

      const data = await response.json();

      if (!data.ok) {
        Alert.alert('Error', data.error || 'Error al registrarse');
        return;
      }

      // Cliente registrado exitosamente
      const customerData = {
        customerId: data.data.customer_id,
        tenantId: data.data.tenant_id,
        tenantName: data.data.tenant_name,
        name: data.data.name,
        phone: data.data.phone,
        email: data.data.email,
        dni: data.data.dni,
      };

      // Guardar datos del cliente y el tenant_id
      await AsyncStorage.setItem('customer_data', JSON.stringify(customerData));
      await AsyncStorage.setItem('customer_id', String(data.data.customer_id));
      await AsyncStorage.setItem('tenant_id', String(data.data.tenant_id));
      // Guardar también el código del negocio para futuras sesiones
      if (data.data.tenant_slug) {
        await AsyncStorage.setItem('tenant_code', data.data.tenant_slug);
      } else if (tenantCode.trim()) {
        // Si no hay tenant_slug, guardar el código que ingresó el usuario
        await AsyncStorage.setItem('tenant_code', tenantCode.trim());
      }
      
      setShowTenantSelection(false);
      setTenantCode('');
      onLogin(customerData);
    } catch (error: any) {
      console.error('Error registrando cliente:', error);
      Alert.alert('Error', 'Error al registrarse. Intentá nuevamente.');
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

  // Pantalla de selección de negocio para registro
  if (showTenantSelection) {
    return (
      <View style={[styles.loginContainer, isDark && styles.loginContainerDark]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#0e1c2c" : "#f5f9fc"} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.loginWrapper}
        >
          <ScrollView
            contentContainerStyle={styles.loginContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.logoContainer}>
              <ArjaLogo size={80} isDark={isDark} />
              <Text style={[styles.appName, isDark && styles.appNameDark]}>ARJA ERP</Text>
            </View>

            <View style={styles.formContainer}>
              <Text style={[styles.welcomeTitle, isDark && styles.welcomeTitleDark]}>
                {pendingName ? `Hola ${pendingName}!` : 'Ingresá el código de tu negocio'}
              </Text>
              <Text style={[styles.welcomeSubtitle, isDark && styles.welcomeSubtitleDark]}>
                Ingresá el código del negocio para continuar. Quedará guardado para futuras sesiones.
              </Text>

              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>Código del negocio</Text>
                <TextInput
                  style={[styles.input, isDark && styles.inputDark]}
                  placeholder="Ej: gimnasio-abc o 123"
                  placeholderTextColor={isDark ? "#6b7280" : "#999"}
                  value={tenantCode}
                  onChangeText={setTenantCode}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                />
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={handleRegisterWithTenant}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.primaryButtonText}>Continuar</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  setShowTenantSelection(false);
                  setTenantCode('');
                  setPendingEmail('');
                  setPendingName('');
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.backButtonText, isDark && styles.backButtonTextDark]}>Volver</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  return (
    <View style={[styles.loginContainer, isDark && styles.loginContainerDark]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#0e1c2c" : "#f5f9fc"} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.loginWrapper}
      >
        <ScrollView
          contentContainerStyle={styles.loginContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoContainer}>
            <ArjaLogo size={80} isDark={isDark} />
            <Text style={[styles.appName, isDark && styles.appNameDark]}>ARJA ERP</Text>
            <Text style={[styles.appTagline, isDark && styles.appTaglineDark]}>Gestión Empresarial Inteligente</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={[styles.welcomeTitle, isDark && styles.welcomeTitleDark]}>Iniciar sesión</Text>
            <Text style={[styles.welcomeSubtitle, isDark && styles.welcomeSubtitleDark]}>
              Ingresá con tu cuenta de Google para continuar
            </Text>

            <TouchableOpacity
              style={[
                styles.googleButton, 
                isDark && styles.googleButtonDark,
                (loading || oAuthLoading) && styles.buttonDisabled
              ]}
              onPress={handleGoogleOAuth}
              disabled={loading || oAuthLoading}
              activeOpacity={0.8}
            >
              {(loading || oAuthLoading) ? (
                <ActivityIndicator color={isDark ? "#fff" : "#374151"} size="small" />
              ) : (
                <>
                  <View style={styles.googleIconContainer}>
                    <Text style={styles.googleIcon}>G</Text>
                  </View>
                  <Text style={[styles.googleButtonText, isDark && styles.googleButtonTextDark]}>Continuar con Google</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    backgroundColor: '#f5f9fc',
  },
  loginContainerDark: {
    backgroundColor: '#0e1c2c',
  },
  loginWrapper: {
    flex: 1,
  },
  loginContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 56,
  },
  logoWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoIconContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoA: {
    position: 'relative',
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoAText: {
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  logoGear: {
    position: 'absolute',
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#051420',
    letterSpacing: 0.5,
    marginTop: 8,
  },
  appNameDark: {
    color: '#e6f2f8',
  },
  appTagline: {
    fontSize: 11,
    fontWeight: '500',
    color: '#1c8fa6',
    letterSpacing: 1.2,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  appTaglineDark: {
    color: '#8cd9e9',
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#051420',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeTitleDark: {
    color: '#e6f2f8',
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#385868',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  welcomeSubtitleDark: {
    color: '#90acbc',
  },
  googleButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#d2d8e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  googleButtonDark: {
    backgroundColor: '#1e2f3f',
    borderColor: '#2c4a5f',
  },
  googleIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  googleIcon: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  googleButtonText: {
    color: '#374151',
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  googleButtonTextDark: {
    color: '#e6f2f8',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#051420',
    marginBottom: 8,
  },
  inputLabelDark: {
    color: '#e6f2f8',
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#d2d8e0',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#051420',
    minHeight: 50,
  },
  inputDark: {
    backgroundColor: '#1e2f3f',
    borderColor: '#2c4a5f',
    color: '#e6f2f8',
  },
  primaryButton: {
    backgroundColor: ARJA_PRIMARY_START,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: ARJA_PRIMARY_START,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  backButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  backButtonText: {
    color: '#385868',
    fontSize: 14,
    fontWeight: '500',
  },
  backButtonTextDark: {
    color: '#90acbc',
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
