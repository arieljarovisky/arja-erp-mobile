/**
 * Pantalla que se muestra cuando el tenant no existe
 * Permite al usuario ingresar otro código de negocio
 */
import React, { useState } from 'react';
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
import { useAuthStore } from '../store/useAuthStore';
import { useTenantStore } from '../store/useTenantStore';
import { useAppTheme } from '../utils/useAppTheme';
import { ArjaLogo } from '../components/ArjaLogo';
import apiClient from '../api/client';

const ARJA_PRIMARY_START = '#13b5cf';
const ARJA_PRIMARY_END = '#0d7fd4';

interface TenantNotFoundScreenProps {
  navigation: any;
}

export default function TenantNotFoundScreen({ navigation }: TenantNotFoundScreenProps) {
  const { isDark } = useAppTheme();
  const { tenantId, setAuth } = useAuthStore();
  const { setTenantNotFound, loadFeatures } = useTenantStore();
  const [tenantCode, setTenantCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerifyTenant = async () => {
    if (!tenantCode.trim()) {
      Alert.alert('Error', 'Por favor ingresá un código de negocio');
      return;
    }

    setLoading(true);
    try {
      // Verificar que el tenant existe
      const response = await apiClient.get(`/api/public/customer/tenant/${tenantCode.trim()}`);
      
      if (!response.data?.ok || !response.data?.data) {
        Alert.alert('Error', 'Código de negocio no encontrado. Verificá el código e intentá nuevamente.');
        return;
      }

      const tenantData = response.data.data;
      const newTenantId = tenantData.id;

      // Actualizar el tenantId en el store de auth
      const currentAuth = useAuthStore.getState();
      setAuth({
        customerId: currentAuth.customerId || 0,
        tenantId: newTenantId,
        customerName: currentAuth.customerName || null,
        phone: currentAuth.phone || null,
      });

      // Limpiar el estado de tenant no encontrado
      setTenantNotFound(false);

      // Cargar las features del nuevo tenant
      await loadFeatures(newTenantId);

      Alert.alert('Éxito', `Negocio "${tenantData.name}" encontrado correctamente.`, [
        {
          text: 'Continuar',
          onPress: () => {
            // La navegación se manejará automáticamente
          },
        },
      ]);
    } catch (error: any) {
      console.error('[TenantNotFound] Error verificando tenant:', error);
      if (error.response?.status === 404) {
        Alert.alert('Error', 'Código de negocio no encontrado. Verificá el código e intentá nuevamente.');
      } else {
        Alert.alert('Error', error.response?.data?.error || 'Error al verificar el código de negocio. Intentá nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro que querés cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            const { clearAuth } = useAuthStore.getState();
            await clearAuth();
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

            <View style={styles.iconContainer}>
              <Text style={styles.icon}>⚠️</Text>
            </View>

            <Text style={[styles.title, isDark && styles.titleDark]}>
              Negocio no encontrado
            </Text>

            <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
              El código de negocio asociado a tu cuenta no existe o no está disponible.
              {'\n\n'}
              Por favor, ingresá un código de negocio válido para continuar.
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
                  styles.verifyButton,
                  isDark && styles.verifyButtonDark,
                  loading && styles.buttonDisabled,
                ]}
                onPress={handleVerifyTenant}
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
                    <Text style={styles.verifyButtonText}>Verificar código</Text>
                  </LinearGradient>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <Text style={[styles.logoutButtonText, isDark && styles.logoutButtonTextDark]}>
                  Cerrar sesión
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
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 64,
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
  verifyButton: {
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 16,
  },
  verifyButtonDark: {
    // El gradiente se mantiene igual
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  logoutButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: 15,
    color: '#385868',
    fontWeight: '500',
  },
  logoutButtonTextDark: {
    color: '#90acbc',
  },
});

