/**
 * Pantalla para seleccionar el negocio cuando un usuario nuevo se autentica
 * Permite al usuario ingresar el código del negocio para registrarse
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../store/useAuthStore';
import { useTenantStore } from '../store/useTenantStore';
import { useAppTheme } from '../store/useThemeStore';
import { ArjaLogo } from '../components/ArjaLogo';
import apiClient from '../api/client';

const ARJA_PRIMARY_START = '#13b5cf';
const ARJA_PRIMARY_END = '#0d7fd4';

interface SelectTenantScreenProps {
  navigation: any;
}

export default function SelectTenantScreen({ navigation }: SelectTenantScreenProps) {
  const { isDark } = useAppTheme();
  const { setAuth, email: storedEmail } = useAuthStore();
  const { loadFeatures, setTenantNotFound } = useTenantStore();
  const [tenantCode, setTenantCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [pendingName, setPendingName] = useState<string | null>(null);

  useEffect(() => {
    // Cargar email y nombre pendientes del AsyncStorage
    const loadPendingData = async () => {
      const email = await AsyncStorage.getItem('pending_user_email');
      const name = await AsyncStorage.getItem('pending_user_name');
      setPendingEmail(email);
      setPendingName(name);
    };
    loadPendingData();
  }, []);

  const handleSelectTenant = async () => {
    if (!tenantCode.trim()) {
      Alert.alert('Error', 'Por favor ingresá un código de negocio');
      return;
    }

    setLoading(true);
    try {
      // Obtener el email pendiente del AsyncStorage
      const email = pendingEmail || await AsyncStorage.getItem('pending_user_email');
      const name = pendingName || await AsyncStorage.getItem('pending_user_name');
      
      if (!email) {
        Alert.alert('Error', 'No se encontró información del usuario. Por favor, intentá iniciar sesión nuevamente.');
        setLoading(false);
        return;
      }

      // Llamar al endpoint /register para crear el cliente con el tenant
      const registerResponse = await apiClient.post(
        '/api/public/customer/oauth/register',
        {
          email: email,
          tenant_code: tenantCode.trim(),
          name: name || null,
        }
      );

      const registerData = registerResponse.data;

      if (!registerData.ok || !registerData.data) {
        Alert.alert('Error', registerData.error || 'Error al crear la cuenta');
        setLoading(false);
        return;
      }

      // Guardar datos del cliente
      const customerData = {
        customerId: registerData.data.customer_id,
        tenantId: registerData.data.tenant_id,
        customerName: registerData.data.name || null,
        phone: registerData.data.phone || null,
        email: registerData.data.email || null,
        picture: registerData.data.picture || null,
      };

      // Guardar el token si viene en la respuesta
      if (registerData.data.access_token) {
        await AsyncStorage.setItem('auth_token', registerData.data.access_token);
      }

      // Limpiar datos pendientes
      await AsyncStorage.multiRemove(['pending_user_email', 'pending_user_name', 'oauth_code', 'oauth_redirect_uri']);

      setAuth(customerData);
      setTenantNotFound(false);

      // Cargar las features del tenant
      await loadFeatures(registerData.data.tenant_id);

      Alert.alert('Éxito', `Te registraste en "${registerData.data.tenant_name || 'el negocio'}" correctamente.`, [
        {
          text: 'Continuar',
          onPress: () => {
            // La navegación se manejará automáticamente
          },
        },
      ]);
    } catch (error: any) {
      console.error('[SelectTenant] Error seleccionando tenant:', error);
      if (error.response?.status === 404) {
        Alert.alert('Error', 'Código de negocio no encontrado. Verificá el código e intentá nuevamente.');
      } else {
        Alert.alert('Error', error.response?.data?.error || 'Error al seleccionar el negocio. Intentá nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Cancelar registro',
      '¿Estás seguro que querés cancelar el registro?',
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Sí',
          style: 'destructive',
          onPress: async () => {
            const { clearAuth } = useAuthStore.getState();
            await clearAuth();
            await AsyncStorage.multiRemove(['pending_user_email', 'pending_user_name', 'oauth_code', 'oauth_redirect_uri']);
            setTenantNotFound(false);
            // La navegación se manejará automáticamente
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <View style={styles.logoContainer}>
              <ArjaLogo size={80} isDark={isDark === true} />
            </View>

            <Text style={[styles.title, isDark && styles.titleDark]}>
              Seleccioná tu negocio
            </Text>

            <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
              {pendingEmail 
                ? `Para completar tu registro con ${pendingEmail}, ingresá el código del negocio donde querés registrarte.`
                : 'Ingresá el código del negocio donde querés registrarte.'}
            </Text>

            <View style={styles.formContainer}>
              <Text style={[styles.label, isDark && styles.labelDark]}>
                Código de negocio
              </Text>
              <TextInput
                style={[styles.input, isDark && styles.inputDark]}
                placeholder="Ingresá el código de negocio"
                placeholderTextColor={isDark ? '#90acbc' : '#999'}
                value={tenantCode}
                onChangeText={setTenantCode}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />

              <TouchableOpacity
                style={[
                  styles.selectButton,
                  isDark && styles.selectButtonDark,
                  loading && styles.buttonDisabled,
                ]}
                onPress={handleSelectTenant}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <LinearGradient
                    colors={[ARJA_PRIMARY_START, ARJA_PRIMARY_END]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.selectButtonText}>Continuar</Text>
                  </LinearGradient>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <Text style={[styles.cancelButtonText, isDark && styles.cancelButtonTextDark]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f9fc',
  },
  containerDark: {
    backgroundColor: '#0e1c2c',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#051420',
    textAlign: 'center',
    marginBottom: 16,
  },
  titleDark: {
    color: '#e6f2f8',
  },
  subtitle: {
    fontSize: 15,
    color: '#385868',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  subtitleDark: {
    color: '#90acbc',
  },
  formContainer: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#051420',
    marginBottom: 8,
  },
  labelDark: {
    color: '#e6f2f8',
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#d2d8e0',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#051420',
    marginBottom: 20,
  },
  inputDark: {
    backgroundColor: '#1e2f3f',
    borderColor: '#2c4a5f',
    color: '#e6f2f8',
  },
  selectButton: {
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 16,
  },
  selectButtonDark: {
    // El gradiente se mantiene igual
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    color: '#385868',
    fontWeight: '500',
  },
  cancelButtonTextDark: {
    color: '#90acbc',
  },
});

