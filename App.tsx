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
  RefreshControl,
} from 'react-native';
import { Svg, Path, Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
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

// Componentes de Iconos SVG Profesionales
const CalendarIcon = ({ size = 24, color = ARJA_PRIMARY_START }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const PlusIcon = ({ size = 24, color = '#10b981' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 5v14m-7-7h14"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ClassesIcon = ({ size = 24, color = '#f59e0b' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 6.252v13m-9-4.5v4.5h18v-4.5M3 6.252h18M3 6.252l9-4.5 9 4.5M12 2.25v4.002"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const QRCodeIcon = ({ size = 24, color = '#8b5cf6' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM16 13h2M20 13h2M13 16v2M13 20v2M16 16h2v2h-2zM20 16h2v2h-2zM16 20h2v2h-2zM20 20h2v2h-2z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const WorkoutIcon = ({ size = 24, color = '#10b981' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M7 13l3 3 7-7"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CreditCardIcon = ({ size = 24, color = '#8b5cf6' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 10h18M7 15h1m4 0h1m-6 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const UserIcon = ({ size = 20, color = '#051420' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Iconos para el menú inferior
const HomeIcon = ({ size = 24, color = '#051420', filled = false }: { size?: number; color?: string; filled?: boolean }) => {
  const isFilled = filled === true;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={isFilled ? color : 'none'}>
      <Path
        d={isFilled 
          ? "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          : "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        }
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

const BellIcon = ({ size = 24, color = '#051420', filled = false }: { size?: number; color?: string; filled?: boolean }) => {
  const isFilled = filled === true;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={isFilled ? color : 'none'}>
      <Path
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

const AccountIcon = ({ size = 24, color = '#051420', filled = false }: { size?: number; color?: string; filled?: boolean }) => {
  const isFilled = filled === true;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={isFilled ? color : 'none'}>
      <Path
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

const CoursesIcon = ({ size = 24, color = '#051420', filled = false }: { size?: number; color?: string; filled?: boolean }) => {
  const isFilled = filled === true;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={isFilled ? color : 'none'}>
      <Path
        d="M12 14l9-5-9-5-9 5 9 5z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 14v7"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

// Componente de Logo ARJA ERP
function ArjaLogo({ size = 80, isDark = false }: { size?: number; isDark?: boolean }) {
  const logoSize = size;
  const iconSize = logoSize * 0.85;
  
  // Asegurar que isDark sea siempre un boolean
  const isDarkMode = Boolean(isDark);
  
  const primaryColor = isDarkMode ? '#4FD4E4' : ARJA_PRIMARY_START;
  const secondaryColor = isDarkMode ? '#46C5E6' : ARJA_PRIMARY_END;
  const bgColor = isDarkMode ? 'rgba(7, 23, 36, 0.96)' : '#ffffff';
  const borderColor = isDarkMode ? 'rgba(79, 212, 228, 0.28)' : 'rgba(19, 181, 207, 0.16)';
  
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
        shadowColor: isDarkMode ? '#053968' : ARJA_PRIMARY_START,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDarkMode ? 0.36 : 0.15,
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
  const { isDark } = useAppTheme();
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
              <ArjaLogo size={80} isDark={isDark === true} />
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
            <ArjaLogo size={80} isDark={isDark === true} />
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

// Hook para manejar tema (modo oscuro desde configuraciones)
function useAppTheme() {
  const systemTheme = useColorScheme();
  const [isDark, setIsDark] = useState(false);
  const [themeLoaded, setThemeLoaded] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('app_theme');
        if (savedTheme === 'dark') {
          setIsDark(true);
        } else if (savedTheme === 'light') {
          setIsDark(false);
        } else {
          // Por defecto usar el tema del sistema
          setIsDark(systemTheme === 'dark');
        }
      } catch (error) {
        console.error('Error loading theme:', error);
        setIsDark(systemTheme === 'dark');
      } finally {
        setThemeLoaded(true);
      }
    };
    loadTheme();
  }, [systemTheme]);

  const toggleTheme = async (dark: boolean) => {
    setIsDark(dark);
    try {
      await AsyncStorage.setItem('app_theme', dark ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  // Asegurar que isDark sea siempre un boolean explícito
  return { isDark: Boolean(isDark), themeLoaded, toggleTheme };
}

// Pantalla Home para CLIENTES
function CustomerHomeScreen({ customerData, onLogout }: { customerData: any; onLogout: () => void }) {
  const { isDark } = useAppTheme();
  const [refreshing, setRefreshing] = useState(false);
  
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      // Aquí puedes agregar la lógica para actualizar los datos
      // Por ejemplo, recargar eventos, turnos, etc.
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulación de carga
      
      // TODO: Agregar llamadas a la API para actualizar datos
      // Ejemplo:
      // const events = await fetchUpcomingEvents();
      // const appointments = await fetchAppointments();
      
    } catch (error) {
      console.error('Error refreshing data:', error);
      Alert.alert('Error', 'No se pudo actualizar la información');
    } finally {
      setRefreshing(false);
    }
  }, []);
  
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
                  {customerData?.name || customerData?.phone || 'Cliente'}
                </Text>
                {customerData?.tenantName && (
                  <Text style={[styles.tenantName, isDark && styles.tenantNameDark]}>
                    {customerData.tenantName}
                  </Text>
                )}
              </View>
              <TouchableOpacity 
                onPress={onLogout} 
                style={[styles.profileButton, isDark && styles.profileButtonDark]}
                activeOpacity={0.7}
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
            {/* Rutinas de Gimnasio */}
            <TouchableOpacity 
              style={styles.menuCard} 
              activeOpacity={0.8}
              onPress={() => {
                // TODO: Navegar a pantalla de rutinas
                Alert.alert('Rutinas', 'Próximamente: Gestión de rutinas de gimnasio');
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
                    <WorkoutIcon size={28} color="#ffffff" />
                  </View>
                  <Text style={[styles.cardTitle, styles.cardTitleWhite]}>Rutinas</Text>
                  <Text style={[styles.cardDescription, styles.cardDescriptionWhite]}>Gimnasio</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Clases */}
            <TouchableOpacity 
              style={styles.menuCard} 
              activeOpacity={0.8}
              onPress={() => {
                // TODO: Navegar a pantalla de clases
                Alert.alert('Clases', 'Próximamente: Gestión de clases individuales y grupales');
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

            {/* Mis Turnos */}
            <TouchableOpacity 
              style={styles.menuCard} 
              activeOpacity={0.8}
              onPress={() => {
                // TODO: Navegar a pantalla de turnos
                Alert.alert('Mis Turnos', 'Próximamente: Ver y gestionar tus turnos');
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

            {/* Membresías */}
            <TouchableOpacity 
              style={styles.menuCard} 
              activeOpacity={0.8}
              onPress={() => {
                // TODO: Navegar a pantalla de membresías
                Alert.alert('Membresías', 'Próximamente: Ver y gestionar membresías');
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

            {/* Acceso QR */}
            <TouchableOpacity 
              style={styles.menuCard} 
              activeOpacity={0.8}
              onPress={() => {
                // TODO: Mostrar QR para acceso
                Alert.alert('Acceso QR', 'Próximamente: Mostrar código QR para acceso al gimnasio');
              }}
            >
              <LinearGradient
                colors={['#0a8bb8', ARJA_PRIMARY_START]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <View style={styles.cardGradientOverlay}>
                  <View style={[styles.cardIcon, styles.iconWhite]}>
                    <QRCodeIcon size={28} color="#ffffff" />
                  </View>
                  <Text style={[styles.cardTitle, styles.cardTitleWhite]}>Acceso QR</Text>
                  <Text style={[styles.cardDescription, styles.cardDescriptionWhite]}>Entrada al gimnasio</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Reservar Turno */}
            <TouchableOpacity 
              style={styles.menuCard} 
              activeOpacity={0.8}
              onPress={() => {
                // TODO: Navegar a pantalla de reserva
                Alert.alert('Reservar', 'Próximamente: Reservar nuevo turno o clase');
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
          </View>
        </View>

        {/* Sección de Próximos Eventos */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>Próximos eventos</Text>
          <View style={styles.eventsList}>
            {/* Evento ejemplo 1 */}
            <View style={[styles.eventCard, isDark && styles.eventCardDark]}>
              <View style={[styles.eventDateBadge, isDark && styles.eventDateBadgeDark]}>
                <Text style={[styles.eventDay, isDark && styles.eventDayDark]}>15</Text>
                <Text style={[styles.eventMonth, isDark && styles.eventMonthDark]}>ENE</Text>
              </View>
              <View style={styles.eventContent}>
                <Text style={[styles.eventTitle, isDark && styles.eventTitleDark]}>Corte de pelo</Text>
                <Text style={[styles.eventTime, isDark && styles.eventTimeDark]}>10:00 AM</Text>
                <Text style={[styles.eventDescription, isDark && styles.eventDescriptionDark]}>
                  Con Juan Pérez
                </Text>
              </View>
              <View style={[styles.eventStatus, styles.eventStatusPending]}>
                <Text style={styles.eventStatusText}>Pendiente</Text>
              </View>
            </View>

            {/* Evento ejemplo 2 */}
            <View style={[styles.eventCard, isDark && styles.eventCardDark]}>
              <View style={[styles.eventDateBadge, isDark && styles.eventDateBadgeDark]}>
                <Text style={[styles.eventDay, isDark && styles.eventDayDark]}>18</Text>
                <Text style={[styles.eventMonth, isDark && styles.eventMonthDark]}>ENE</Text>
              </View>
              <View style={styles.eventContent}>
                <Text style={[styles.eventTitle, isDark && styles.eventTitleDark]}>Clase de yoga</Text>
                <Text style={[styles.eventTime, isDark && styles.eventTimeDark]}>06:00 PM</Text>
                <Text style={[styles.eventDescription, isDark && styles.eventDescriptionDark]}>
                  Clase grupal
                </Text>
              </View>
              <View style={[styles.eventStatus, styles.eventStatusConfirmed]}>
                <Text style={[styles.eventStatusText, styles.eventStatusTextConfirmed]}>Confirmado</Text>
              </View>
            </View>

            {/* Evento ejemplo 3 */}
            <View style={[styles.eventCard, isDark && styles.eventCardDark]}>
              <View style={[styles.eventDateBadge, isDark && styles.eventDateBadgeDark]}>
                <Text style={[styles.eventDay, isDark && styles.eventDayDark]}>20</Text>
                <Text style={[styles.eventMonth, isDark && styles.eventMonthDark]}>ENE</Text>
              </View>
              <View style={styles.eventContent}>
                <Text style={[styles.eventTitle, isDark && styles.eventTitleDark]}>Consulta médica</Text>
                <Text style={[styles.eventTime, isDark && styles.eventTimeDark]}>11:30 AM</Text>
                <Text style={[styles.eventDescription, isDark && styles.eventDescriptionDark]}>
                  Dr. García
                </Text>
              </View>
              <View style={[styles.eventStatus, styles.eventStatusPending]}>
                <Text style={styles.eventStatusText}>Pendiente</Text>
              </View>
            </View>
          </View>
        </View>
        </ScrollView>
        
        {/* Floating Action Button */}
        <TouchableOpacity
          style={[styles.fab, isDark && styles.fabDark]}
          activeOpacity={0.8}
          onPress={() => {
            Alert.alert('Nuevo', '¿Qué querés crear?', [
              { text: 'Reservar Turno', onPress: () => {} },
              { text: 'Nueva Clase', onPress: () => {} },
              { text: 'Cancelar', style: 'cancel' },
            ]);
          }}
        >
          <PlusIcon size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Pantallas adicionales para el menú
function NotificationsScreen() {
  const { isDark } = useAppTheme();
  const isDarkMode = Boolean(isDark);
  return (
    <View style={[styles.screenContainer, isDarkMode && styles.screenContainerDark]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <View style={styles.emptyScreen}>
        <BellIcon size={64} color={isDarkMode ? '#4FD4E4' : ARJA_PRIMARY_START} />
        <Text style={[styles.emptyScreenTitle, isDarkMode && styles.emptyScreenTitleDark]}>Notificaciones</Text>
        <Text style={[styles.emptyScreenText, isDarkMode && styles.emptyScreenTextDark]}>
          No tenés notificaciones nuevas
        </Text>
      </View>
    </View>
  );
}

function QRScreen() {
  const { isDark } = useAppTheme();
  const isDarkMode = Boolean(isDark);
  return (
    <View style={[styles.screenContainer, isDarkMode && styles.screenContainerDark]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <View style={styles.emptyScreen}>
        <QRCodeIcon size={64} color={isDarkMode ? '#4FD4E4' : ARJA_PRIMARY_START} />
        <Text style={[styles.emptyScreenTitle, isDarkMode && styles.emptyScreenTitleDark]}>Acceso QR</Text>
        <Text style={[styles.emptyScreenText, isDarkMode && styles.emptyScreenTextDark]}>
          Mostrá este código QR en la entrada
        </Text>
      </View>
    </View>
  );
}

function AccountScreen() {
  const { isDark } = useAppTheme();
  const isDarkMode = Boolean(isDark);
  return (
    <View style={[styles.screenContainer, isDarkMode && styles.screenContainerDark]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <View style={styles.emptyScreen}>
        <AccountIcon size={64} color={isDarkMode ? '#4FD4E4' : ARJA_PRIMARY_START} />
        <Text style={[styles.emptyScreenTitle, isDarkMode && styles.emptyScreenTitleDark]}>Cuenta Corriente</Text>
        <Text style={[styles.emptyScreenText, isDarkMode && styles.emptyScreenTextDark]}>
          Ver movimientos y saldo
        </Text>
      </View>
    </View>
  );
}

function CoursesScreen() {
  const { isDark } = useAppTheme();
  const isDarkMode = Boolean(isDark);
  return (
    <View style={[styles.screenContainer, isDarkMode && styles.screenContainerDark]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <View style={styles.emptyScreen}>
        <CoursesIcon size={64} color={isDarkMode ? '#4FD4E4' : ARJA_PRIMARY_START} />
        <Text style={[styles.emptyScreenTitle, isDarkMode && styles.emptyScreenTitleDark]}>Mis Cursos</Text>
        <Text style={[styles.emptyScreenText, isDarkMode && styles.emptyScreenTextDark]}>
          Ver tus cursos y clases
        </Text>
      </View>
    </View>
  );
}

// Navegador principal con tabs
const Tab = createBottomTabNavigator();

function MainNavigator({ customerData, onLogout }: { customerData: any; onLogout: () => void }) {
  const { isDark } = useAppTheme();
  const isDarkMode = Boolean(isDark);
  
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ARJA_PRIMARY_START,
        tabBarInactiveTintColor: isDarkMode ? '#90acbc' : '#666',
        tabBarStyle: {
          backgroundColor: isDarkMode ? '#1e2f3f' : '#ffffff',
          borderTopWidth: 1,
          borderTopColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          height: Platform.OS === 'ios' ? 90 : 70,
          paddingBottom: Platform.OS === 'ios' ? 25 : 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500' as const,
        },
      }}
    >
      <Tab.Screen
        name="Inicio"
        options={{
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => {
            const iconSize = typeof size === 'number' ? size : 24;
            const isFocused = Boolean(focused);
            return <HomeIcon size={iconSize} color={isFocused ? ARJA_PRIMARY_START : (color || '#666')} filled={isFocused} />;
          },
        }}
      >
        {() => <CustomerHomeScreen customerData={customerData} onLogout={onLogout} />}
      </Tab.Screen>
      
      <Tab.Screen
        name="Notificaciones"
        options={{
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => {
            const iconSize = typeof size === 'number' ? size : 24;
            const isFocused = Boolean(focused);
            return <BellIcon size={iconSize} color={isFocused ? ARJA_PRIMARY_START : (color || '#666')} filled={isFocused} />;
          },
        }}
      >
        {() => <NotificationsScreen />}
      </Tab.Screen>
      
      <Tab.Screen
        name=""
        options={{
          headerShown: false,
          tabBarShowLabel: false,
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
      >
        {() => <QRScreen />}
      </Tab.Screen>
      
      <Tab.Screen
        name="Cuenta"
        options={{
          headerShown: false,
          tabBarLabel: 'Cta. Corriente',
          tabBarIcon: ({ focused, color, size }) => {
            const iconSize = typeof size === 'number' ? size : 24;
            const isFocused = Boolean(focused);
            return <AccountIcon size={iconSize} color={isFocused ? ARJA_PRIMARY_START : (color || '#666')} filled={isFocused} />;
          },
        }}
      >
        {() => <AccountScreen />}
      </Tab.Screen>
      
      <Tab.Screen
        name="Cursos"
        options={{
          headerShown: false,
          tabBarLabel: 'Mis Cursos',
          tabBarIcon: ({ focused, color, size }) => {
            const iconSize = typeof size === 'number' ? size : 24;
            const isFocused = Boolean(focused);
            return <CoursesIcon size={iconSize} color={isFocused ? ARJA_PRIMARY_START : (color || '#666')} filled={isFocused} />;
          },
        }}
      >
        {() => <CoursesScreen />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

// Componente principal
export default function App() {
  // Los hooks deben llamarse siempre en el mismo orden, antes de cualquier return condicional
  const { isDark } = useAppTheme();
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
    const isDarkMode = Boolean(isDark);
    return (
      <NavigationContainer theme={isDarkMode ? DarkTheme : DefaultTheme}>
        <MainNavigator customerData={customerData} onLogout={handleLogout} />
      </NavigationContainer>
    );
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
  tenantName: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
    marginTop: 2,
  },
  tenantNameDark: {
    color: '#4FD4E4',
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
  },
  menuCard: {
    width: '48%',
    borderRadius: 20,
    marginBottom: 0,
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
  // Próximos Eventos
  eventsList: {
    gap: 12,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    alignItems: 'center',
  },
  eventCardDark: {
    backgroundColor: '#1e2f3f',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  eventDateBadge: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: 'rgba(19, 181, 207, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  eventDateBadgeDark: {
    backgroundColor: 'rgba(79, 212, 228, 0.15)',
  },
  eventDay: {
    fontSize: 20,
    fontWeight: '700',
    color: ARJA_PRIMARY_START,
    lineHeight: 24,
  },
  eventDayDark: {
    color: '#4FD4E4',
  },
  eventMonth: {
    fontSize: 10,
    fontWeight: '600',
    color: ARJA_PRIMARY_START,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  eventMonthDark: {
    color: '#4FD4E4',
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#051420',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  eventTitleDark: {
    color: '#e6f2f8',
  },
  eventTime: {
    fontSize: 13,
    fontWeight: '500',
    color: ARJA_PRIMARY_START,
    marginBottom: 2,
  },
  eventTimeDark: {
    color: '#4FD4E4',
  },
  eventDescription: {
    fontSize: 12,
    color: '#385868',
    fontWeight: '400',
  },
  eventDescriptionDark: {
    color: '#90acbc',
  },
  eventStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 12,
  },
  eventStatusPending: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  eventStatusConfirmed: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  eventStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#f59e0b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  eventStatusTextConfirmed: {
    color: '#10b981',
  },
  // Pantallas
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
    padding: 20,
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
  },
  emptyScreenTextDark: {
    color: '#90acbc',
  },
  // Botón QR destacado en el menú
  qrTabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
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
  // Floating Action Button
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: ARJA_PRIMARY_START,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: ARJA_PRIMARY_START,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  fabDark: {
    backgroundColor: ARJA_PRIMARY_START,
  },
});
