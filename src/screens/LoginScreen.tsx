/**
 * Pantalla de Login/Identificación
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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { authService } from '../services/auth';

interface LoginScreenProps {
  navigation: any;
}

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const [phone, setPhone] = useState('');
  const [dni, setDni] = useState('');
  const [loading, setLoading] = useState(false);
  const [useDni, setUseDni] = useState(false);

  const { setAuth } = useAuthStore();

  const handleLogin = async () => {
    if (!phone && !dni) {
      Alert.alert('Error', 'Por favor, ingresá tu teléfono o DNI');
      return;
    }

    setLoading(true);
    try {
      // Identificar cliente (similar a WhatsApp)
      const authData = await authService.identify(
        useDni ? undefined : phone,
        useDni ? dni : undefined,
        undefined // tenantId se obtendrá del backend
      );

      setAuth(authData);
      navigation.replace('Home');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>¡Bienvenido! 👋</Text>
        <Text style={styles.subtitle}>
          Para continuar, necesitamos identificarte
        </Text>

        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggle, !useDni && styles.toggleActive]}
            onPress={() => setUseDni(false)}
          >
            <Text style={[styles.toggleText, !useDni && styles.toggleTextActive]}>
              Teléfono
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggle, useDni && styles.toggleActive]}
            onPress={() => setUseDni(true)}
          >
            <Text style={[styles.toggleText, useDni && styles.toggleTextActive]}>
              DNI
            </Text>
          </TouchableOpacity>
        </View>

        {!useDni ? (
          <TextInput
            style={styles.input}
            placeholder="Número de teléfono"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoComplete="tel"
            placeholderTextColor="#999"
          />
        ) : (
          <TextInput
            style={styles.input}
            placeholder="DNI (solo números)"
            value={dni}
            onChangeText={setDni}
            keyboardType="numeric"
            maxLength={8}
            placeholderTextColor="#999"
          />
        )}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Continuar</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 4,
  },
  toggle: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleActive: {
    backgroundColor: '#007AFF',
  },
  toggleText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  toggleTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 16,
    marginBottom: 20,
    borderRadius: 10,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

