/**
 * Pantalla de Login con estilos ARJA ERP
 */
import React, { useState } from 'react';
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
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../store/useAuthStore';
import { ArjaLogo } from '../components/ArjaLogo';
import { useAppTheme } from '../store/useThemeStore';
import apiClient from '../api/client';

const ARJA_PRIMARY_START = '#13b5cf';
const ARJA_PRIMARY_END = '#0d7fd4';

interface LoginScreenProps {
  navigation: any;
}

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const { isDark } = useAppTheme();
  const [loading, setLoading] = useState(false);
  const [oAuthLoading, setOAuthLoading] = useState(false);
  const { setAuth } = useAuthStore();

  // Listener para deep links de OAuth
  React.useEffect(() => {
    // En web, verificar si hay un código OAuth en la URL después de la redirección
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');
      
      if (code || error) {
        console.log('[LoginScreen] Código OAuth encontrado en URL (web):', code ? code.substring(0, 20) + '...' : 'NO');
        console.log('[LoginScreen] Error OAuth encontrado en URL (web):', error || 'NINGUNO');
        
        // Limpiar la URL para evitar que se procese de nuevo
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Establecer loading para mostrar el indicador mientras se procesa
        setOAuthLoading(true);
        
        if (error) {
          Alert.alert('Error de Autenticación', 'Error al autenticarse con Google');
          setOAuthLoading(false);
          return;
        }
        
        if (code) {
          const redirectUri = getRedirectUri();
          exchangeCodeForCustomerData(code, redirectUri).finally(() => {
            setOAuthLoading(false);
          });
        } else {
          setOAuthLoading(false);
        }
        return;
      }
    }

    // Verificar si la app se abrió con un deep link (móvil)
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('[LoginScreen] App abierta con deep link:', url);
        handleDeepLink(url);
      }
    });

    // Escuchar deep links mientras la app está abierta
    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('[LoginScreen] Deep link recibido:', url);
      handleDeepLink(url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Manejar deep link de OAuth
  const handleDeepLink = async (url: string) => {
    try {
      console.log('[LoginScreen] Procesando deep link:', url);
      const parsedUrl = Linking.parse(url);
      
      if (parsedUrl.path === 'oauth/callback' || parsedUrl.hostname === 'oauth' && parsedUrl.path === 'callback') {
        const code = parsedUrl.queryParams?.code as string;
        const error = parsedUrl.queryParams?.error as string;

        console.log('[LoginScreen] Código del deep link:', code ? code.substring(0, 20) + '...' : 'NO ENCONTRADO');
        console.log('[LoginScreen] Error del deep link:', error || 'NINGUNO');

        if (error) {
          Alert.alert('Error de Autenticación', 'Error al autenticarse con Google');
          return;
        }

        if (code) {
          const redirectUri = getRedirectUri();
          console.log('[LoginScreen] Intercambiando código del deep link por datos del cliente...');
          await exchangeCodeForCustomerData(code, redirectUri);
        }
      }
    } catch (error: any) {
      console.error('[LoginScreen] Error procesando deep link:', error);
    }
  };

  // Obtener el redirect URI para OAuth
  const getRedirectUri = () => {
    const baseURL = apiClient.defaults.baseURL || 'https://backend-production-1042.up.railway.app';
    return `${baseURL}/api/public/customer/oauth/google/callback`;
  };

  // Manejar login con Google OAuth
  const handleGoogleOAuth = async () => {
    setOAuthLoading(true);
    try {
      const redirectUri = getRedirectUri();
      // En web, usar la URL actual como callback; en móvil, usar el deep link
      const appDeepLink = Platform.OS === 'web' && typeof window !== 'undefined'
        ? `${window.location.origin}${window.location.pathname}`
        : 'arja-erp://oauth/callback';
      
      // Obtener la URL de autorización del backend
      const authUrlResponse = await apiClient.get(
        `/api/public/customer/oauth/google?redirect_uri=${encodeURIComponent(redirectUri)}&app_deep_link=${encodeURIComponent(appDeepLink)}`
      );

      const authUrlData = authUrlResponse.data;

      if (!authUrlData.ok || !authUrlData.authUrl) {
        Alert.alert('Error', authUrlData.error || 'Error al iniciar autenticación');
        return;
      }

      // En web, usar redirección completa en lugar de popup para evitar problemas con COOP
      if (Platform.OS === 'web') {
        // Guardar el estado en localStorage para recuperarlo después de la redirección
        if (typeof window !== 'undefined') {
          console.log('[LoginScreen] Redirigiendo a Google OAuth (web):', authUrlData.authUrl);
          // No hacer return aquí, dejar que setOAuthLoading se ejecute después
          // La redirección completa reiniciará la app y el useEffect procesará el código
          setTimeout(() => {
            window.location.href = authUrlData.authUrl;
          }, 100);
        }
        return;
      }

      // En móvil, usar el método normal con popup
      const result = await WebBrowser.openAuthSessionAsync(
        authUrlData.authUrl,
        appDeepLink
      );

      console.log('[LoginScreen] Resultado de WebBrowser:', result.type, result.url ? result.url.substring(0, 100) : 'sin URL');
      
      if (result.type === 'success' && result.url) {
        try {
          console.log('[LoginScreen] URL completa recibida:', result.url);
          
          // Usar Linking.parse() para parsear deep links en React Native
          const parsedUrl = Linking.parse(result.url);
          const code = parsedUrl.queryParams?.code as string;
          const error = parsedUrl.queryParams?.error as string;

          console.log('[LoginScreen] Código extraído:', code ? code.substring(0, 20) + '...' : 'NO ENCONTRADO');
          console.log('[LoginScreen] Error extraído:', error || 'NINGUNO');

          if (error) {
            Alert.alert('Error de Autenticación', 'Error al autenticarse con Google');
            return;
          }

          if (!code) {
            console.error('[LoginScreen] No se recibió código de autorización. URL completa:', result.url);
            console.error('[LoginScreen] URL parseada:', JSON.stringify(parsedUrl, null, 2));
            Alert.alert('Error', 'No se recibió código de autorización');
            return;
          }

          console.log('[LoginScreen] Código OAuth recibido, intercambiando por datos del cliente...');
          // Intercambiar código por datos del cliente
          await exchangeCodeForCustomerData(code, redirectUri);
        } catch (urlError: any) {
          console.error('[OAuth] Error parseando URL:', urlError);
          Alert.alert('Error', 'Error al procesar la respuesta de Google');
        }
      } else if (result.type === 'cancel') {
        console.log('OAuth cancelado por el usuario');
      } else {
        Alert.alert('Error', 'No se pudo completar la autenticación');
      }
    } catch (error: any) {
      console.error('Error en OAuth:', error);
      
      // Manejar diferentes tipos de errores
      if (error?.response?.status === 503) {
        Alert.alert(
          'Servidor no disponible',
          'El servidor está temporalmente no disponible. Por favor, intenta de nuevo en unos momentos.',
          [{ text: 'OK' }]
        );
      } else if (error?.response?.status >= 500) {
        Alert.alert(
          'Error del servidor',
          'Hubo un problema con el servidor. Por favor, intenta de nuevo más tarde.',
          [{ text: 'OK' }]
        );
      } else if (error?.response?.status === 404) {
        Alert.alert(
          'Endpoint no encontrado',
          'El servicio de autenticación no está disponible. Contacta al soporte.',
          [{ text: 'OK' }]
        );
      } else if (error?.code === 'ERR_NETWORK' || error?.message?.includes('Network Error')) {
        Alert.alert(
          'Error de conexión',
          'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Error de autenticación',
          error?.response?.data?.error || error?.message || 'Error al iniciar sesión con Google',
          [{ text: 'OK' }]
        );
      }
      Alert.alert('Error', 'Error al iniciar sesión con Google');
    } finally {
      setOAuthLoading(false);
    }
  };

  // Intercambiar código por datos del cliente
  const exchangeCodeForCustomerData = async (code: string, redirectUri: string) => {
    setLoading(true);
    try {
      console.log('[LoginScreen] Llamando a exchange-code con:', { code: code.substring(0, 20) + '...', redirectUri });
      const response = await apiClient.post(
        '/api/public/customer/oauth/exchange-code',
        {
          code,
          redirect_uri: redirectUri,
        }
      );

      console.log('[LoginScreen] Respuesta de exchange-code recibida, status:', response.status);
      const data = response.data;
      console.log('[LoginScreen] Datos recibidos de exchange-code:', JSON.stringify(data, null, 2));

      if (!data.ok) {
        Alert.alert('Error', data.error || 'Error al autenticarse');
        return;
      }

      // Si hay datos del cliente, guardarlos y navegar
      if (data.data && data.data.tenant_id) {
        const customerData = {
          customerId: data.data.customer_id,
          tenantId: data.data.tenant_id,
          customerName: data.data.name || null,
          phone: data.data.phone || null,
          email: data.data.email || null,
          picture: data.data.picture || null,
        };

        // Guardar el token si viene en la respuesta
        if (data.data.access_token) {
          await AsyncStorage.setItem('auth_token', data.data.access_token);
          console.log('[LoginScreen] Token guardado en AsyncStorage:', data.data.access_token.substring(0, 20) + '...');
          
          // Verificar que se guardó correctamente
          const savedToken = await AsyncStorage.getItem('auth_token');
          console.log('[LoginScreen] Token verificado después de guardar:', savedToken ? savedToken.substring(0, 20) + '...' : 'NO ENCONTRADO');
        } else {
          console.warn('[LoginScreen] No se recibió access_token en la respuesta del backend');
          console.log('[LoginScreen] Datos recibidos:', JSON.stringify(data.data, null, 2));
        }

        setAuth(customerData);
        // La navegación se manejará automáticamente por el useEffect en AppNavigator
      }
    } catch (error: any) {
      console.error('Error intercambiando código:', error);
      Alert.alert('Error', 'Error al obtener datos del cliente');
    } finally {
      setLoading(false);
    }
  };

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

const styles = StyleSheet.create({
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
});
