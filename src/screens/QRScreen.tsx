/**
 * Pantalla de QR Code - Mostrar código QR para acceso
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { useAuthStore } from '../store/useAuthStore';
import { useTenantStore } from '../store/useTenantStore';
import { useAppTheme } from '../utils/useAppTheme';
import { QRCodeIcon } from '../components/Icons';

const ARJA_PRIMARY_START = '#13b5cf';
const ARJA_PRIMARY_END = '#0d7fd4';
const { width } = Dimensions.get('window');
const QR_SIZE = width * 0.7;

export default function QRScreen() {
  const { isDark } = useAppTheme();
  const { customerId, tenantId, phone } = useAuthStore();
  const { features, loadFeatures, hasFeature } = useTenantStore();
  const [qrData, setQrData] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Cargar features del tenant al montar
  useEffect(() => {
    if (tenantId) {
      loadFeatures(tenantId);
    }
  }, [tenantId, loadFeatures]);

  useEffect(() => {
    loadQRData();
  }, [customerId, tenantId, phone, features]);

  const loadQRData = async () => {
    if (!customerId || !tenantId || !phone) {
      setLoading(false);
      return;
    }

    // Verificar si el tenant tiene QR scanner habilitado
    if (!hasFeature('has_qr_scanner')) {
      setLoading(false);
      return;
    }

    try {
      // Generar un código QR único para el usuario
      // El código contiene información del cliente y tenant para validación
      const qrPayload = JSON.stringify({
        customer_id: customerId,
        tenant_id: tenantId,
        phone: phone.replace(/\D/g, ''),
        timestamp: Date.now(),
      });
      
      setQrData(qrPayload);
    } catch (error) {
      console.error('Error generando QR:', error);
      Alert.alert('Error', 'No se pudo generar el código QR');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.screenContainer, isDark && styles.screenContainerDark, styles.centerContent]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <ActivityIndicator size="large" color={ARJA_PRIMARY_START} />
        <Text style={[styles.loadingText, isDark && styles.loadingTextDark]}>Generando código QR...</Text>
      </View>
    );
  }

  if (!hasFeature('has_qr_scanner')) {
    return (
      <View style={[styles.screenContainer, isDark && styles.screenContainerDark]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <LinearGradient
          colors={[ARJA_PRIMARY_START, ARJA_PRIMARY_END]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <QRCodeIcon size={28} color="#ffffff" />
            <Text style={styles.headerTitle}>Acceso QR</Text>
          </View>
        </LinearGradient>
        <View style={styles.emptyContainer}>
          <QRCodeIcon size={64} color={isDark ? '#4FD4E4' : ARJA_PRIMARY_START} />
          <Text style={[styles.emptyTitle, isDark && styles.emptyTitleDark]}>
            QR no disponible
          </Text>
          <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
            Este lugar no tiene scanner de QR habilitado
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screenContainer, isDark && styles.screenContainerDark]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <LinearGradient
        colors={[ARJA_PRIMARY_START, ARJA_PRIMARY_END]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <QRCodeIcon size={28} color="#ffffff" />
          <Text style={styles.headerTitle}>Acceso QR</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.qrContainer}>
          <View style={[styles.qrWrapper, isDark && styles.qrWrapperDark]}>
            {qrData ? (
              <QRCode
                value={qrData}
                size={QR_SIZE}
                color={isDark ? '#e6f2f8' : '#051420'}
                backgroundColor={isDark ? '#1e2f3f' : '#ffffff'}
                logoSize={60}
                logoBackgroundColor="transparent"
                logoMargin={8}
                logoBorderRadius={30}
              />
            ) : (
              <View style={styles.qrPlaceholder}>
                <QRCodeIcon size={80} color={isDark ? '#4FD4E4' : ARJA_PRIMARY_START} />
                <Text style={[styles.qrPlaceholderText, isDark && styles.qrPlaceholderTextDark]}>
                  No se pudo generar el código
                </Text>
              </View>
            )}
          </View>

          <View style={styles.infoContainer}>
            <Text style={[styles.infoTitle, isDark && styles.infoTitleDark]}>
              Código de Acceso
            </Text>
            <Text style={[styles.infoText, isDark && styles.infoTextDark]}>
              Mostrá este código QR en la entrada del establecimiento para acceder rápidamente.
            </Text>
            <Text style={[styles.infoSubtext, isDark && styles.infoSubtextDark]}>
              El código se actualiza automáticamente para mayor seguridad.
            </Text>
          </View>

          <View style={[styles.tipsContainer, isDark && styles.tipsContainerDark]}>
            <Text style={[styles.tipsTitle, isDark && styles.tipsTitleDark]}>
              💡 Consejos
            </Text>
            <View style={styles.tipItem}>
              <Text style={[styles.tipText, isDark && styles.tipTextDark]}>
                • Asegurate de tener buena iluminación
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={[styles.tipText, isDark && styles.tipTextDark]}>
                • Mantené el código visible y sin reflejos
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={[styles.tipText, isDark && styles.tipTextDark]}>
                • No compartas tu código con otras personas
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.refreshButton, isDark && styles.refreshButtonDark]}
            onPress={loadQRData}
          >
            <Text style={[styles.refreshButtonText, isDark && styles.refreshButtonTextDark]}>
              Actualizar código
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#f5f9fc',
  },
  screenContainerDark: {
    backgroundColor: '#0e1c2c',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#385868',
  },
  loadingTextDark: {
    color: '#90acbc',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 400,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#051420',
    marginTop: 24,
    marginBottom: 8,
  },
  emptyTitleDark: {
    color: '#e6f2f8',
  },
  emptyText: {
    fontSize: 16,
    color: '#385868',
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyTextDark: {
    color: '#90acbc',
  },
  qrContainer: {
    width: '100%',
    alignItems: 'center',
  },
  qrWrapper: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrWrapperDark: {
    backgroundColor: '#1e2f3f',
  },
  qrPlaceholder: {
    width: QR_SIZE,
    height: QR_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrPlaceholderText: {
    marginTop: 16,
    fontSize: 14,
    color: '#6b7280',
  },
  qrPlaceholderTextDark: {
    color: '#9ca3af',
  },
  infoContainer: {
    width: '100%',
    marginBottom: 24,
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#051420',
    marginBottom: 12,
    textAlign: 'center',
  },
  infoTitleDark: {
    color: '#e6f2f8',
  },
  infoText: {
    fontSize: 16,
    color: '#385868',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  infoTextDark: {
    color: '#90acbc',
  },
  infoSubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  infoSubtextDark: {
    color: '#9ca3af',
  },
  tipsContainer: {
    width: '100%',
    backgroundColor: '#f0f9ff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  tipsContainerDark: {
    backgroundColor: '#1e3a5f',
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#051420',
    marginBottom: 12,
  },
  tipsTitleDark: {
    color: '#e6f2f8',
  },
  tipItem: {
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#385868',
    lineHeight: 20,
  },
  tipTextDark: {
    color: '#90acbc',
  },
  refreshButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    backgroundColor: ARJA_PRIMARY_START,
    shadowColor: ARJA_PRIMARY_START,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  refreshButtonDark: {
    backgroundColor: ARJA_PRIMARY_START,
  },
  refreshButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  refreshButtonTextDark: {
    color: '#ffffff',
  },
});
