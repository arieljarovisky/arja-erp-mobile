/**
 * Pantalla de Configuración
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  ActivityIndicator,
  Image,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../store/useThemeStore';
import { useAuthStore } from '../store/useAuthStore';
import { useTenantStore } from '../store/useTenantStore';
import { appSettingsAPI } from '../api/appSettings';
import apiClient from '../api/client';
import { registerForPushNotifications } from '../services/pushNotifications';
import * as Notifications from 'expo-notifications';
import * as ImagePicker from 'expo-image-picker';
import { BellIcon, UserIcon, BuildingIcon, LogOutIcon, MoonIcon, SunIcon, SettingsIcon, MailIcon, PhoneIcon, GoogleIcon, EditIcon } from '../components/Icons';

const ARJA_PRIMARY_START = '#13b5cf';
const ARJA_PRIMARY_END = '#0d7fd4';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { isDark, toggleTheme } = useAppTheme();
  const isDarkMode = Boolean(isDark);
  
  const { 
    customerId, 
    customerName, 
    phone, 
    email,
    tenantId,
    picture,
    clearAuth,
    setAuth
  } = useAuthStore();
  
  const { 
    features
  } = useTenantStore();

  const [pushStatus, setPushStatus] = useState<{
    permissions: boolean;
    token: string | null;
    registered: boolean;
  } | null>(null);
  const [loadingPush, setLoadingPush] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tenantName, setTenantName] = useState<string | null>(null);
  const [updatingPicture, setUpdatingPicture] = useState(false);
  const [showPictureInput, setShowPictureInput] = useState(false);
  const [pictureUrl, setPictureUrl] = useState('');
  const [showTenantCodeInput, setShowTenantCodeInput] = useState(false);
  const [tenantCode, setTenantCode] = useState('');
  const [changingTenantCode, setChangingTenantCode] = useState(false);

  useEffect(() => {
    checkPushStatus();
    loadTenantName();
    loadTenantCode();
    setLoading(false);
  }, [tenantId]);

  const loadTenantCode = async () => {
    if (!tenantId) return;
    try {
      // Obtener información del tenant desde el API
      const response = await apiClient.get(`/api/public/customer/tenant/${tenantId}`);
      if (response.data?.ok && response.data?.data?.subdomain) {
        setTenantCode(response.data.data.subdomain);
      }
    } catch (error) {
      console.error('[SettingsScreen] Error cargando código del negocio:', error);
    }
  };

  const loadTenantName = async () => {
    if (!tenantId) return;
    try {
      // Intentar obtener el nombre del tenant desde las features
      const tenantFeatures = features;
      if (tenantFeatures && (tenantFeatures as any).tenant_name) {
        setTenantName((tenantFeatures as any).tenant_name);
      } else {
        // Si no está en features, usar el ID
        setTenantName(null);
      }
    } catch (error) {
      console.error('[SettingsScreen] Error cargando nombre del tenant:', error);
    }
  };

  const checkPushStatus = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      const hasPermissions = status === 'granted';

      let token: string | null = null;
      if (hasPermissions) {
        try {
          const tokenData = await Notifications.getExpoPushTokenAsync();
          token = tokenData.data;
        } catch (error) {
          console.warn('[SettingsScreen] Error obteniendo token:', error);
        }
      }

      let registered = false;
      if (token) {
        try {
          const settings = await appSettingsAPI.getMySettings();
          registered = settings.pushToken === token;
        } catch (error) {
          console.warn('[SettingsScreen] Error verificando token:', error);
          // Si hay error al verificar, asumir que no está registrado
          registered = false;
        }
      } else {
        // Si no hay token, no puede estar registrado
        registered = false;
      }

      setPushStatus({
        permissions: hasPermissions,
        token,
        registered,
      });
    } catch (error) {
      console.error('[SettingsScreen] Error verificando push:', error);
      setPushStatus({
        permissions: false,
        token: null,
        registered: false,
      });
    }
  };

  const handleSyncPushToken = async () => {
    setLoadingPush(true);
    try {
      const token = await registerForPushNotifications();
      if (token) {
        await checkPushStatus();
        Alert.alert('Éxito', 'Token sincronizado con el backend correctamente');
      } else {
        Alert.alert('Error', 'No se pudo obtener el token. Verifica los permisos en la configuración del dispositivo.');
      }
    } catch (error) {
      console.error('[SettingsScreen] Error sincronizando token:', error);
      Alert.alert('Error', 'No se pudo sincronizar el token con el backend');
    } finally {
      setLoadingPush(false);
    }
  };

  const handleTogglePush = async (value: boolean) => {
    if (value) {
      setLoadingPush(true);
      try {
        const token = await registerForPushNotifications();
        if (token) {
          await checkPushStatus();
          Alert.alert('Éxito', 'Notificaciones push activadas');
        } else {
          Alert.alert('Error', 'No se pudieron activar las notificaciones. Verifica los permisos en la configuración del dispositivo.');
        }
      } catch (error) {
        Alert.alert('Error', 'Error al activar notificaciones push');
      } finally {
        setLoadingPush(false);
      }
    } else {
      Alert.alert(
        'Desactivar notificaciones',
        'Para desactivar las notificaciones, ve a la configuración del dispositivo.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleChangeTenant = () => {
    setShowTenantCodeInput(true);
  };

  const handleSaveTenantCode = async () => {
    if (!tenantCode.trim()) {
      Alert.alert('Error', 'Por favor ingresá un código de negocio');
      return;
    }

    // Validar formato
    const codeRegex = /^[a-z0-9-]{3,}$/;
    const normalizedCode = tenantCode.trim().toLowerCase();
    
    if (!codeRegex.test(normalizedCode)) {
      Alert.alert('Error', 'El código solo puede contener letras, números y guiones, y debe tener al menos 3 caracteres');
      return;
    }

    setChangingTenantCode(true);
    try {
      await appSettingsAPI.updateTenantCode(normalizedCode);
      Alert.alert('Éxito', 'Código del negocio actualizado correctamente', [
        {
          text: 'OK',
          onPress: () => {
            setShowTenantCodeInput(false);
            // Recargar datos del tenant
            loadTenantName();
            loadTenantCode();
          },
        },
      ]);
    } catch (error: any) {
      console.error('[SettingsScreen] Error actualizando código del negocio:', error);
      Alert.alert('Error', error.message || 'Error al actualizar el código del negocio');
    } finally {
      setChangingTenantCode(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Cerrar sesión', 
          style: 'destructive',
          onPress: async () => {
            await clearAuth();
            navigation.navigate('Login' as never);
          }
        },
      ]
    );
  };

  const handleChangePicture = () => {
    Alert.alert(
      'Cambiar foto de perfil',
      '¿Cómo quieres cambiar tu foto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Seleccionar de galería', 
          onPress: handlePickImage
        },
        { 
          text: 'Ingresar URL', 
          onPress: () => setShowPictureInput(true)
        },
      ]
    );
  };

  const handlePickImage = async () => {
    try {
      // Solicitar permisos
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos necesarios', 'Necesitamos acceso a tu galería para seleccionar una foto.');
        return;
      }

      // Abrir selector de imagen
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        await updatePicture(imageUri);
      }
    } catch (error) {
      console.error('[SettingsScreen] Error seleccionando imagen:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen.');
    }
  };

  const updatePicture = async (imageUri: string) => {
    setUpdatingPicture(true);
    try {
      // Convertir imagen a base64
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        try {
          const base64data = reader.result as string;
          
          // Actualizar en el backend
          await appSettingsAPI.updateMyPicture(base64data);
          
          // Actualizar en el store
          const currentAuth = useAuthStore.getState();
          setAuth({
            customerId: currentAuth.customerId!,
            tenantId: currentAuth.tenantId!,
            customerName: currentAuth.customerName,
            phone: currentAuth.phone,
            picture: base64data,
          });
          
          Alert.alert('Éxito', 'Foto de perfil actualizada correctamente.');
          setShowPictureInput(false);
          setPictureUrl('');
        } catch (error) {
          console.error('[SettingsScreen] Error actualizando foto:', error);
          Alert.alert('Error', 'No se pudo actualizar la foto de perfil.');
        } finally {
          setUpdatingPicture(false);
        }
      };
      
      reader.onerror = () => {
        setUpdatingPicture(false);
        Alert.alert('Error', 'No se pudo procesar la imagen.');
      };
      
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('[SettingsScreen] Error procesando imagen:', error);
      Alert.alert('Error', 'No se pudo procesar la imagen.');
      setUpdatingPicture(false);
    }
  };

  const handleSavePictureUrl = async () => {
    if (!pictureUrl.trim()) {
      Alert.alert('Error', 'Por favor, ingresa una URL válida.');
      return;
    }

    try {
      // Validar que sea una URL válida
      new URL(pictureUrl);
    } catch {
      Alert.alert('Error', 'Por favor, ingresa una URL válida.');
      return;
    }

    await updatePicture(pictureUrl);
  };

  if (loading) {
    return (
      <View style={[styles.screenContainer, isDarkMode && styles.screenContainerDark]}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ARJA_PRIMARY_START} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screenContainer, isDarkMode && styles.screenContainerDark]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient
          colors={[ARJA_PRIMARY_START, ARJA_PRIMARY_END]}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.avatarContainer}>
              <TouchableOpacity 
                style={styles.avatar}
                onPress={handleChangePicture}
                disabled={updatingPicture}
                activeOpacity={0.8}
              >
                {updatingPicture ? (
                  <ActivityIndicator size="large" color="#ffffff" />
                ) : picture ? (
                  <Image source={{ uri: picture }} style={styles.avatarImg} resizeMode="cover" />
                ) : (
                  <Text style={styles.avatarText}>
                    {(customerName || phone || 'U').charAt(0).toUpperCase()}
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.avatarEditBadge}
                onPress={handleChangePicture}
                activeOpacity={0.8}
              >
                <EditIcon size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.headerTitle}>Configuración</Text>
            <Text style={styles.headerSubtitle}>
              {customerName || phone || 'Usuario'}
            </Text>
          </View>
        </LinearGradient>

                    {/* Cambiar foto de perfil - Input URL */}
                    {showPictureInput && (
                      <View style={styles.section}>
                        <View style={[styles.card, isDarkMode && styles.cardDark]}>
                          <Text style={[styles.cardLabel, isDarkMode && styles.cardLabelDark, { marginBottom: 12 }]}>
                            Ingresar URL de imagen
                          </Text>
                          <TextInput
                            style={[styles.textInput, isDarkMode && styles.textInputDark]}
                            placeholder="https://ejemplo.com/imagen.jpg"
                            placeholderTextColor={isDarkMode ? '#6b7280' : '#9ca3af'}
                            value={pictureUrl}
                            onChangeText={setPictureUrl}
                            autoCapitalize="none"
                            keyboardType="url"
                          />
                          <View style={styles.inputButtons}>
                            <TouchableOpacity
                              style={[styles.inputButton, styles.inputButtonCancel]}
                              onPress={() => {
                                setShowPictureInput(false);
                                setPictureUrl('');
                              }}
                            >
                              <Text style={styles.inputButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.inputButton, styles.inputButtonSave]}
                              onPress={handleSavePictureUrl}
                              disabled={updatingPicture}
                            >
                              {updatingPicture ? (
                                <ActivityIndicator size="small" color="#ffffff" />
                              ) : (
                                <Text style={[styles.inputButtonText, { color: '#ffffff' }]}>Guardar</Text>
                              )}
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    )}

                    {/* Perfil del Usuario */}
                    <View style={styles.section}>
                      <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
                        Perfil
                      </Text>
          <View style={[styles.card, isDarkMode && styles.cardDark]}>
            <View style={styles.cardRow}>
              <View style={styles.cardRowLeft}>
                <View style={[styles.iconContainer, { backgroundColor: `${ARJA_PRIMARY_START}15` }]}>
                  <UserIcon size={18} color={ARJA_PRIMARY_START} />
                </View>
                <View style={styles.cardRowText}>
                  <Text style={[styles.cardLabel, isDarkMode && styles.cardLabelDark]}>Nombre</Text>
                  <Text style={[styles.cardValue, isDarkMode && styles.cardValueDark]}>
                    {customerName || 'No especificado'}
                  </Text>
                </View>
              </View>
            </View>
            {phone && (
              <View style={[styles.cardRow, styles.cardRowBorder]}>
                <View style={styles.cardRowLeft}>
                  <View style={[styles.iconContainer, { backgroundColor: `${ARJA_PRIMARY_START}15` }]}>
                    <PhoneIcon size={18} color={ARJA_PRIMARY_START} />
                  </View>
                  <View style={styles.cardRowText}>
                    <Text style={[styles.cardLabel, isDarkMode && styles.cardLabelDark]}>Teléfono</Text>
                    <Text style={[styles.cardValue, isDarkMode && styles.cardValueDark]}>{phone}</Text>
                  </View>
                </View>
              </View>
            )}
            {email && (
              <View style={[styles.cardRow, styles.cardRowBorder]}>
                <View style={styles.cardRowLeft}>
                  <View style={[styles.iconContainer, { backgroundColor: `${ARJA_PRIMARY_START}15` }]}>
                    <MailIcon size={18} color={ARJA_PRIMARY_START} />
                  </View>
                  <View style={styles.cardRowText}>
                    <Text style={[styles.cardLabel, isDarkMode && styles.cardLabelDark]}>Email</Text>
                    <Text style={[styles.cardValue, isDarkMode && styles.cardValueDark]}>{email}</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Notificaciones */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
            Notificaciones
          </Text>
          <View style={[styles.card, isDarkMode && styles.cardDark]}>
            <View style={styles.cardRow}>
              <View style={styles.cardRowLeft}>
                <View style={[styles.iconContainer, { backgroundColor: `${ARJA_PRIMARY_START}15` }]}>
                  <BellIcon size={18} color={ARJA_PRIMARY_START} />
                </View>
                <View style={styles.cardRowText}>
                  <Text style={[styles.cardLabel, isDarkMode && styles.cardLabelDark]}>Notificaciones push</Text>
                  <Text style={[styles.cardSubtext, isDarkMode && styles.cardSubtextDark]}>
                    {pushStatus?.permissions 
                      ? pushStatus.registered 
                        ? 'Activadas y sincronizadas' 
                        : 'Activadas pero no sincronizadas'
                      : 'No activadas'}
                  </Text>
                </View>
              </View>
              {loadingPush ? (
                <ActivityIndicator size="small" color={ARJA_PRIMARY_START} />
              ) : (
                <Switch
                  value={pushStatus?.permissions || false}
                  onValueChange={handleTogglePush}
                  trackColor={{ false: '#d1d5db', true: `${ARJA_PRIMARY_START}80` }}
                  thumbColor={pushStatus?.permissions ? ARJA_PRIMARY_START : '#f3f4f6'}
                />
              )}
            </View>
          </View>
        </View>

        {/* Tenant/Negocio */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
            Negocio
          </Text>
          <View style={[styles.card, isDarkMode && styles.cardDark]}>
            <View style={styles.cardRow}>
              <View style={styles.cardRowLeft}>
                <View style={[styles.iconContainer, { backgroundColor: `${ARJA_PRIMARY_START}15` }]}>
                  <BuildingIcon size={18} color={ARJA_PRIMARY_START} />
                </View>
                <View style={styles.cardRowText}>
                  <Text style={[styles.cardLabel, isDarkMode && styles.cardLabelDark]}>Negocio actual</Text>
                  <Text style={[styles.cardValue, isDarkMode && styles.cardValueDark]}>
                    {tenantName || (features?.tenant_name || `ID: ${tenantId}`)}
                  </Text>
                </View>
              </View>
            </View>
            
            {!showTenantCodeInput ? (
              <>
                <View style={[styles.cardRow, styles.cardRowBorder]}>
                  <View style={styles.cardRowLeft}>
                    <View style={styles.cardRowText}>
                      <Text style={[styles.cardLabel, isDarkMode && styles.cardLabelDark]}>Código del negocio</Text>
                      <Text style={[styles.cardValue, isDarkMode && styles.cardValueDark]}>
                        {tenantCode || 'No configurado'}
                      </Text>
                      <Text style={[styles.cardSubtext, isDarkMode && styles.cardSubtextDark]}>
                        Este código se usa para acceder a tu negocio desde la app móvil
                      </Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity 
                  style={[styles.cardRow, styles.cardRowBorder, styles.cardRowButton]}
                  onPress={handleChangeTenant}
                >
                  <Text style={[styles.cardButtonText, { color: ARJA_PRIMARY_START }]}>
                    Cambiar código del negocio
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={[styles.cardRow, styles.cardRowBorder]}>
                <View style={{ width: '100%' }}>
                  <Text style={[styles.cardLabel, isDarkMode && styles.cardLabelDark, { marginBottom: 8 }]}>
                    Código del negocio
                  </Text>
                  <TextInput
                    style={[styles.textInput, isDarkMode && styles.textInputDark]}
                    placeholder="codigo-negocio"
                    placeholderTextColor={isDarkMode ? '#6b7280' : '#9ca3af'}
                    value={tenantCode}
                    onChangeText={(text) => {
                      // Solo permitir letras, números y guiones
                      const normalized = text.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase();
                      setTenantCode(normalized);
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!changingTenantCode}
                  />
                  <Text style={[styles.cardSubtext, isDarkMode && styles.cardSubtextDark, { marginTop: 4 }]}>
                    Solo letras, números y guiones. Mínimo 3 caracteres.
                  </Text>
                  <View style={styles.inputButtons}>
                    <TouchableOpacity
                      style={[styles.inputButton, styles.inputButtonCancel]}
                      onPress={() => {
                        setShowTenantCodeInput(false);
                        // Restaurar valor original
                        loadTenantCode();
                      }}
                      disabled={changingTenantCode}
                    >
                      <Text style={styles.inputButtonText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.inputButton, styles.inputButtonSave]}
                      onPress={handleSaveTenantCode}
                      disabled={changingTenantCode}
                    >
                      {changingTenantCode ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Text style={[styles.inputButtonText, { color: '#ffffff' }]}>Guardar</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Cuentas Conectadas */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
            Cuentas conectadas
          </Text>
          <View style={[styles.card, isDarkMode && styles.cardDark]}>
            <View style={styles.cardRow}>
              <View style={styles.cardRowLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#ffffff', padding: 2 }]}>
                  <GoogleIcon size={32} color={ARJA_PRIMARY_START} />
                </View>
                <View style={styles.cardRowText}>
                  <Text style={[styles.cardLabel, isDarkMode && styles.cardLabelDark]}>Google</Text>
                  <Text style={[styles.cardSubtext, isDarkMode && styles.cardSubtextDark]}>
                    {email ? `Conectado como ${email}` : 'Conectado'}
                  </Text>
                </View>
              </View>
              <View style={[styles.connectedBadge, isDarkMode && styles.connectedBadgeDark]}>
                <Text style={styles.connectedBadgeText}>✓</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Apariencia */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
            Apariencia
          </Text>
          <View style={[styles.card, isDarkMode && styles.cardDark]}>
            <View style={styles.cardRow}>
              <View style={styles.cardRowLeft}>
                <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? '#1e293b' : '#fef3c7' }]}>
                  {isDarkMode ? (
                    <MoonIcon size={18} color="#4FD4E4" />
                  ) : (
                    <SunIcon size={18} color="#f59e0b" />
                  )}
                </View>
                <View style={styles.cardRowText}>
                  <Text style={[styles.cardLabel, isDarkMode && styles.cardLabelDark]}>Modo oscuro</Text>
                  <Text style={[styles.cardSubtext, isDarkMode && styles.cardSubtextDark]}>
                    {isDarkMode ? 'Activado' : 'Desactivado'}
                  </Text>
                </View>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={toggleTheme}
                trackColor={{ false: '#d1d5db', true: `${ARJA_PRIMARY_START}80` }}
                thumbColor={isDarkMode ? ARJA_PRIMARY_START : '#f3f4f6'}
              />
            </View>
          </View>
        </View>

        {/* Cerrar Sesión */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={[styles.logoutButton, isDarkMode && styles.logoutButtonDark]}
            onPress={handleLogout}
          >
            <LogOutIcon size={20} color="#ef4444" />
            <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, isDarkMode && styles.footerTextDark]}>
            ARJA ERP v1.0.0
          </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '700',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 44,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 6,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.95)',
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 28,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  sectionTitleDark: {
    color: '#e6f2f8',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardDark: {
    backgroundColor: '#1e2f3f',
    borderColor: '#374151',
    shadowColor: '#000',
    shadowOpacity: 0.3,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  cardRowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginTop: 4,
    paddingTop: 16,
  },
  cardRowButton: {
    justifyContent: 'center',
  },
  cardRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  cardRowText: {
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  cardLabelDark: {
    color: '#e6f2f8',
  },
  cardValue: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '500',
  },
  cardValueDark: {
    color: '#9ca3af',
  },
  cardSubtext: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  cardSubtextDark: {
    color: '#6b7280',
  },
  cardButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  connectedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#10b981',
  },
  connectedBadgeDark: {
    backgroundColor: '#065f46',
    borderColor: '#10b981',
  },
  connectedBadgeText: {
    color: '#059669',
    fontSize: 16,
    fontWeight: '800',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#fee2e2',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  logoutButtonDark: {
    backgroundColor: '#1e2f3f',
    borderColor: '#7f1d1d',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ef4444',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  footerTextDark: {
    color: '#6b7280',
  },
});

