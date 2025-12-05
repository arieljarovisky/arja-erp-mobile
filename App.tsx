/**
 * Componente principal - App móvil para CLIENTES con estilos ARJA ERP
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
  ScrollView,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://backend-production-1042.up.railway.app';

// Colores ARJA ERP
const ARJA_PRIMARY_START = '#13b5cf';
const ARJA_PRIMARY_END = '#0d7fd4';

// Pantalla de identificación para CLIENTES
function CustomerLoginScreen({ onLogin }: { onLogin: (customerData: any) => void }) {
  const [step, setStep] = useState<'tenant' | 'identify'>('tenant');
  const [loading, setLoading] = useState(false);
  
  // Datos del tenant (negocio)
  const [tenantId, setTenantId] = useState<string>('');
  const [tenantName, setTenantName] = useState<string>('');
  
  // Datos de identificación del cliente
  const [identificationMethod, setIdentificationMethod] = useState<'phone' | 'dni' | null>(null);
  const [phone, setPhone] = useState('');
  const [dni, setDni] = useState('');

  // Paso 1: Identificar el negocio (tenant)
  const handleTenantSubmit = async () => {
    if (!tenantId.trim()) {
      Alert.alert('Error', 'Por favor, ingresá el código de tu negocio');
      return;
    }

    setLoading(true);
    try {
      // Verificar que el tenant existe
      const response = await fetch(`${API_BASE_URL}/api/public/customer/tenant/${tenantId}`);
      const data = await response.json();

      if (!data.ok) {
        Alert.alert('Error', 'Negocio no encontrado. Verificá el código.');
        return;
      }

      setTenantName(data.data?.name || 'Tu negocio');
      setStep('identify');
      await AsyncStorage.setItem('tenant_id', String(data.data.id));
    } catch (error: any) {
      Alert.alert('Error', 'Error al verificar el negocio');
    } finally {
      setLoading(false);
    }
  };

  // Paso 2: Identificar al cliente por teléfono o DNI
  const handleIdentifyCustomer = async () => {
    if (!identificationMethod) {
      Alert.alert('Error', 'Seleccioná un método de identificación');
      return;
    }

    if (identificationMethod === 'phone' && !phone.trim()) {
      Alert.alert('Error', 'Ingresá tu número de teléfono');
      return;
    }

    if (identificationMethod === 'dni' && !dni.trim()) {
      Alert.alert('Error', 'Ingresá tu DNI');
      return;
    }

    setLoading(true);
    try {
      const storedTenantId = await AsyncStorage.getItem('tenant_id');
      if (!storedTenantId) {
        Alert.alert('Error', 'Error: no se encontró el negocio');
        return;
      }

      // Normalizar teléfono (solo números)
      const normalizedPhone = phone.replace(/\D/g, '');
      const normalizedDni = dni.trim();
      
      // Identificar cliente en el backend
      const response = await fetch(`${API_BASE_URL}/api/public/customer/identify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenant_id: parseInt(storedTenantId, 10),
          phone: normalizedPhone || undefined,
          dni: normalizedDni || undefined,
        }),
      });

      const data = await response.json();

      if (!data.ok) {
        Alert.alert('Error', data.error || 'Error al identificar cliente');
        return;
      }

      // Guardar datos del cliente
      const customerData = {
        customerId: data.data.customer_id,
        tenantId: data.data.tenant_id,
        tenantName: data.data.tenant_name,
        name: data.data.name,
        phone: data.data.phone,
        dni: data.data.dni,
      };

      await AsyncStorage.setItem('customer_data', JSON.stringify(customerData));
      await AsyncStorage.setItem('customer_id', String(data.data.customer_id));
      onLogin(customerData);
    } catch (error: any) {
      Alert.alert('Error', 'Error al identificar cliente');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Pantalla de selección de tenant
  if (step === 'tenant') {
    return (
      <KeyboardAvoidingView
        style={styles.loginContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <ScrollView
          contentContainerStyle={styles.loginContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>AR</Text>
            </View>
            <Text style={styles.appName}>ARJA ERP</Text>
          </View>

          <Text style={styles.welcomeTitle}>¡Bienvenido! 👋</Text>
          <Text style={styles.welcomeSubtitle}>
            Ingresá el código que te proporcionó tu negocio para acceder a tus turnos y servicios
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Código del Negocio</Text>
            <Text style={styles.inputHint}>
              Pedí este código en tu gimnasio, peluquería o negocio
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: 12345 o nombre-del-negocio"
              placeholderTextColor="#999"
              value={tenantId}
              onChangeText={setTenantId}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleTenantSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>Continuar</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.helpText}>
            Si no conocés el código, pedilo en tu negocio o contactá con el administrador
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // Pantalla de identificación del cliente
  return (
    <KeyboardAvoidingView
      style={styles.loginContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ScrollView
        contentContainerStyle={styles.loginContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setStep('tenant')}
        >
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>

        <Text style={styles.welcomeTitle}>Identificate</Text>
        <Text style={styles.welcomeSubtitle}>
          {tenantName && `Negocio: ${tenantName}`}
        </Text>

        <Text style={styles.methodTitle}>¿Cómo querés identificarte?</Text>

        <View style={styles.methodContainer}>
          <TouchableOpacity
            style={[
              styles.methodButton,
              identificationMethod === 'phone' && styles.methodButtonActive,
            ]}
            onPress={() => setIdentificationMethod('phone')}
            activeOpacity={0.8}
          >
            <Text style={styles.methodEmoji}>📱</Text>
            <Text style={styles.methodText}>Teléfono</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.methodButton,
              identificationMethod === 'dni' && styles.methodButtonActive,
            ]}
            onPress={() => setIdentificationMethod('dni')}
            activeOpacity={0.8}
          >
            <Text style={styles.methodEmoji}>🆔</Text>
            <Text style={styles.methodText}>DNI</Text>
          </TouchableOpacity>
        </View>

        {identificationMethod === 'phone' && (
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Número de Teléfono</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: 1123456789"
              placeholderTextColor="#999"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoCapitalize="none"
            />
          </View>
        )}

        {identificationMethod === 'dni' && (
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>DNI</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: 12345678"
              placeholderTextColor="#999"
              value={dni}
              onChangeText={setDni}
              keyboardType="number-pad"
              autoCapitalize="none"
            />
          </View>
        )}

        {identificationMethod && (
          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleIdentifyCustomer}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>Continuar</Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
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
  backButton: {
    marginBottom: 20,
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: ARJA_PRIMARY_START,
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputHint: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#1a1a1a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  primaryButton: {
    backgroundColor: ARJA_PRIMARY_START,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: ARJA_PRIMARY_END,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  methodTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  methodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 16,
  },
  methodButton: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  methodButtonActive: {
    borderColor: ARJA_PRIMARY_START,
    backgroundColor: 'rgba(19, 181, 207, 0.08)',
  },
  methodEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  methodText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
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
