/**
 * Pantalla para reservar un nuevo turno
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { CalendarIcon, ArrowLeftIcon } from '../components/Icons';
import { MercadoPagoLogo } from '../components/MercadoPagoLogo';
import { useAppTheme } from '../store/useThemeStore';
import { appointmentsAPI, CreateAppointmentData } from '../api/appointments';
import { metaAPI, Service, Instructor } from '../api/meta';
import { useAuthStore } from '../store/useAuthStore';
import { CountdownTimer } from '../components/CountdownTimer';
import dayjs from 'dayjs';
import 'dayjs/locale/es';

dayjs.locale('es');

const ARJA_PRIMARY_START = '#13b5cf';
const ARJA_PRIMARY_END = '#0ea5e9';

interface TimeSlot {
  time: string;
  available: boolean;
}

export default function BookAppointmentScreen() {
  const { isDark } = useAppTheme();
  const isDarkMode = Boolean(isDark);
  const { tenantId, customerId } = useAuthStore();
  const navigation = useNavigation();

  const [step, setStep] = useState<'service' | 'instructor' | 'datetime' | 'confirm'>('service');
  const [services, setServices] = useState<Service[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [busySlots, setBusySlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createdAppointmentId, setCreatedAppointmentId] = useState<number | null>(null);
  const [depositAmount, setDepositAmount] = useState<number | null>(null);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [paymentLinkGeneratedAt, setPaymentLinkGeneratedAt] = useState<number | null>(null);
  const [appointmentCreatedAt, setAppointmentCreatedAt] = useState<string | null>(null);
  const [appointmentStartsAt, setAppointmentStartsAt] = useState<string | null>(null);

  // Cargar servicios e instructores
  useEffect(() => {
    if (!tenantId) return;
    loadServices();
    loadInstructors();
  }, [tenantId]);

  // Cargar disponibilidad cuando cambian servicio, instructor o fecha
  useEffect(() => {
    if (selectedService && selectedInstructor && selectedDate) {
      loadAvailability();
    }
  }, [selectedService, selectedInstructor, selectedDate]);

  const loadServices = async () => {
    try {
      setLoading(true);
      const data = await metaAPI.getServices(tenantId!);
      setServices(data);
    } catch (error: any) {
      console.error('[BookAppointmentScreen] Error loading services', error);
      Alert.alert('Error', 'No se pudieron cargar los servicios');
    } finally {
      setLoading(false);
    }
  };

  const loadInstructors = async () => {
    try {
      const data = await metaAPI.getInstructors(tenantId!);
      setInstructors(data);
    } catch (error: any) {
      console.error('[BookAppointmentScreen] Error loading instructors', error);
    }
  };

  const loadAvailability = async () => {
    if (!selectedService || !selectedInstructor || !selectedDate) return;
    try {
      setLoadingSlots(true);
      const response = await appointmentsAPI.getAvailability(
        tenantId!,
        selectedService.id,
        selectedInstructor.id,
        selectedDate
      );
      setAvailableSlots(response.data?.slots || []);
      setBusySlots(response.data?.busySlots || []);
    } catch (error: any) {
      console.error('[BookAppointmentScreen] Error loading availability', error);
      Alert.alert('Error', 'No se pudo cargar la disponibilidad');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setStep('instructor');
  };

  const handleInstructorSelect = (instructor: Instructor) => {
    setSelectedInstructor(instructor);
    setStep('datetime');
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTime(null); // Resetear horario cuando cambia la fecha
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep('confirm');
  };

  const handlePayDeposit = async () => {
    if (!createdAppointmentId || !tenantId || !customerId) {
      Alert.alert('Error', 'Faltan datos para generar el link de pago');
      return;
    }

    try {
      setLoadingPayment(true);
      const response = await appointmentsAPI.getDepositPaymentLink(
        createdAppointmentId,
        tenantId,
        customerId
      );

      if (response.ok && response.paymentLink) {
        const canOpen = await Linking.canOpenURL(response.paymentLink);
        if (canOpen) {
          await Linking.openURL(response.paymentLink);
          // El usuario será redirigido a Mercado Pago
          // Cuando regrese, el webhook actualizará el estado del turno
          Alert.alert(
            'Redirigiendo a Mercado Pago',
            'Serás redirigido para completar el pago de la seña.',
            [
              {
                text: 'OK',
                onPress: () => navigation.goBack(),
              },
            ]
          );
        } else {
          Alert.alert('Error', 'No se puede abrir el link de pago');
        }
      } else {
        Alert.alert('Error', 'No se pudo generar el link de pago');
      }
    } catch (error: any) {
      console.error('[BookAppointmentScreen] Error getting payment link', error);
      Alert.alert('Error', error?.response?.data?.error || 'No se pudo generar el link de pago');
    } finally {
      setLoadingPayment(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedService || !selectedInstructor || !selectedDate || !selectedTime || !tenantId || !customerId) {
      Alert.alert('Error', 'Faltan datos para reservar el turno');
      return;
    }

    try {
      setSubmitting(true);
      const startsAt = `${selectedDate}T${selectedTime}:00`;
      const appointmentData: CreateAppointmentData = {
        customer_id: customerId,
        service_id: selectedService.id,
        instructor_id: selectedInstructor.id,
        starts_at: startsAt,
        tenant_id: tenantId,
      };

      const response = await appointmentsAPI.createAppointment(appointmentData);
      
      if (response.requiresDeposit && response.data?.id) {
        // Guardar información del turno creado para mostrar opción de pago
        setCreatedAppointmentId(response.data.id);
        setDepositAmount(response.data.deposit_decimal || null);
        // No cerrar la pantalla, mostrar opción de pago
      } else {
        Alert.alert('Turno reservado', 'Tu turno fue reservado exitosamente', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      }
    } catch (error: any) {
      console.error('[BookAppointmentScreen] Error creating appointment', error);
      Alert.alert('Error', error?.response?.data?.error || 'No se pudo reservar el turno');
    } finally {
      setSubmitting(false);
    }
  };

  // Generar próximos 30 días
  const availableDates = useMemo(() => {
    const dates: string[] = [];
    for (let i = 0; i < 30; i++) {
      const date = dayjs().add(i, 'day');
      dates.push(date.format('YYYY-MM-DD'));
    }
    return dates;
  }, []);

  // Generar slots de tiempo disponibles
  const timeSlots = useMemo(() => {
    if (!availableSlots.length) return [];
    return availableSlots.map((slot) => ({
      time: slot,
      available: !busySlots.includes(slot),
    }));
  }, [availableSlots, busySlots]);

  const renderServiceStep = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, isDarkMode && styles.stepTitleDark]}>Seleccioná un servicio</Text>
      {loading ? (
        <ActivityIndicator size="large" color={ARJA_PRIMARY_START} style={styles.loader} />
      ) : (
        <View style={styles.optionsGrid}>
          {services.map((service) => (
            <TouchableOpacity
              key={service.id}
              style={[styles.optionCard, isDarkMode && styles.optionCardDark]}
              onPress={() => handleServiceSelect(service)}
              activeOpacity={0.7}
            >
              <Text style={[styles.optionTitle, isDarkMode && styles.optionTitleDark]}>{service.name}</Text>
              <Text style={[styles.optionSubtitle, isDarkMode && styles.optionSubtitleDark]}>
                {service.duration_min} min · ${service.price_decimal}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const renderInstructorStep = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, isDarkMode && styles.stepTitleDark]}>Seleccioná un instructor</Text>
      <View style={styles.optionsGrid}>
        {instructors.map((instructor) => (
          <TouchableOpacity
            key={instructor.id}
            style={[
              styles.optionCard,
              isDarkMode && styles.optionCardDark,
              selectedInstructor?.id === instructor.id && styles.optionCardSelected,
            ]}
            onPress={() => handleInstructorSelect(instructor)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.instructorColor,
                { backgroundColor: instructor.color_hex || ARJA_PRIMARY_START },
              ]}
            />
            <Text style={[styles.optionTitle, isDarkMode && styles.optionTitleDark]}>{instructor.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderDateTimeStep = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, isDarkMode && styles.stepTitleDark]}>Seleccioná fecha y horario</Text>
      
      {/* Selector de fechas */}
      <View style={styles.dateTimeSection}>
        <Text style={[styles.sectionLabel, isDarkMode && styles.sectionLabelDark]}>Fecha</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.datesScroll}>
          {availableDates.map((date) => {
            const isSelected = selectedDate === date;
            const isToday = date === dayjs().format('YYYY-MM-DD');
            return (
              <TouchableOpacity
                key={date}
                style={[
                  styles.dateCard,
                  isDarkMode && styles.dateCardDark,
                  isSelected && styles.dateCardSelected,
                ]}
                onPress={() => handleDateSelect(date)}
                activeOpacity={0.7}
              >
                <Text style={[styles.dateWeekday, isDarkMode && styles.dateWeekdayDark]}>
                  {dayjs(date).format('ddd')}
                </Text>
                <Text style={[styles.dateDay, isDarkMode && styles.dateDayDark]}>
                  {dayjs(date).format('D')}
                </Text>
                <Text style={[styles.dateMonth, isDarkMode && styles.dateMonthDark]}>
                  {dayjs(date).format('MMM')}
                </Text>
                {isToday && <View style={styles.todayBadge} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Selector de horarios */}
      {selectedDate && (
        <View style={styles.dateTimeSection}>
          <Text style={[styles.sectionLabel, isDarkMode && styles.sectionLabelDark]}>
            Horario {selectedDate ? `- ${dayjs(selectedDate).format('D MMM')}` : ''}
          </Text>
          {loadingSlots ? (
            <ActivityIndicator size="large" color={ARJA_PRIMARY_START} style={styles.loader} />
          ) : timeSlots.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyStateText, isDarkMode && styles.emptyStateTextDark]}>
                No hay horarios disponibles para esta fecha
              </Text>
            </View>
          ) : (
            <View style={styles.timeSlotsGrid}>
              {timeSlots.map((slot) => (
                <TouchableOpacity
                  key={slot.time}
                  style={[
                    styles.timeSlot,
                    isDarkMode && styles.timeSlotDark,
                    !slot.available && styles.timeSlotBusy,
                    selectedTime === slot.time && styles.timeSlotSelected,
                  ]}
                  onPress={() => slot.available && handleTimeSelect(slot.time)}
                  disabled={!slot.available}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.timeSlotText,
                      isDarkMode && styles.timeSlotTextDark,
                      !slot.available && styles.timeSlotTextBusy,
                      selectedTime === slot.time && styles.timeSlotTextSelected,
                    ]}
                  >
                    {slot.time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}

      {!selectedDate && (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyStateText, isDarkMode && styles.emptyStateTextDark]}>
            Seleccioná una fecha para ver los horarios disponibles
          </Text>
        </View>
      )}
    </View>
  );

  const renderConfirmStep = () => {
    if (!selectedService || !selectedInstructor || !selectedDate || !selectedTime) return null;

    const fullDate = dayjs(`${selectedDate}T${selectedTime}`);

    // Si ya se creó el turno y requiere seña, mostrar opción de pago
    if (createdAppointmentId && depositAmount) {
      return (
        <View style={styles.stepContainer}>
          <Text style={[styles.stepTitle, isDarkMode && styles.stepTitleDark]}>Turno reservado</Text>
          <View style={[styles.confirmCard, isDarkMode && styles.confirmCardDark]}>
            <View style={styles.successMessage}>
              <Text style={[styles.successText, isDarkMode && styles.successTextDark]}>
                ✅ Tu turno fue reservado exitosamente
              </Text>
            </View>
            <View style={styles.confirmRow}>
              <Text style={[styles.confirmLabel, isDarkMode && styles.confirmLabelDark]}>Servicio:</Text>
              <Text style={[styles.confirmValue, isDarkMode && styles.confirmValueDark]}>
                {selectedService.name}
              </Text>
            </View>
            <View style={styles.confirmRow}>
              <Text style={[styles.confirmLabel, isDarkMode && styles.confirmLabelDark]}>Instructor:</Text>
              <Text style={[styles.confirmValue, isDarkMode && styles.confirmValueDark]}>
                {selectedInstructor.name}
              </Text>
            </View>
            <View style={styles.confirmRow}>
              <Text style={[styles.confirmLabel, isDarkMode && styles.confirmLabelDark]}>Fecha y hora:</Text>
              <Text style={[styles.confirmValue, isDarkMode && styles.confirmValueDark]}>
                {fullDate.format('ddd D MMM · HH:mm')}
              </Text>
            </View>
            <View style={[styles.confirmRow, styles.depositRow]}>
              <View style={styles.depositInfoContainer}>
                <Text style={[styles.confirmLabel, isDarkMode && styles.confirmLabelDark]}>Seña requerida:</Text>
                <Text style={[styles.depositNote, isDarkMode && styles.depositNoteDark]}>
                  Debes pagar la seña para confirmar el turno
                </Text>
                {(() => {
                  if (!appointmentCreatedAt || !appointmentStartsAt) {
                    return (
                      <Text style={[styles.depositInfoNote, isDarkMode && styles.depositInfoNoteDark]}>
                        ⏰ El link de pago vence 1 hora antes del turno
                      </Text>
                    );
                  }
                  
                  const appointmentDate = dayjs(appointmentStartsAt);
                  const oneHourBefore = appointmentDate.subtract(1, 'hour');
                  const createdDate = dayjs(appointmentCreatedAt);
                  const now = dayjs();
                  
                  // Si ya pasó la hora antes del turno, está vencido
                  if (now.isAfter(oneHourBefore)) {
                    return (
                      <View style={styles.countdownContainer}>
                        <CountdownTimer
                          initialMinutes={0}
                          isDark={isDarkMode}
                        />
                        <Text style={[styles.depositExpiryNote, isDarkMode && styles.depositExpiryNoteDark, { color: '#ef4444' }]}>
                          El link de pago ya venció
                        </Text>
                      </View>
                    );
                  }
                  
                  // Calcular minutos desde la creación hasta 1 hora antes del turno
                  const totalMinutes = oneHourBefore.diff(createdDate, 'minute');
                  const elapsedMinutes = now.diff(createdDate, 'minute');
                  const remainingMinutes = Math.max(0, totalMinutes - elapsedMinutes);
                  const displayMinutes = Math.min(30, remainingMinutes);
                  
                  if (displayMinutes > 0) {
                    return (
                      <View style={styles.countdownContainer}>
                        <CountdownTimer
                          initialMinutes={displayMinutes}
                          isDark={isDarkMode}
                          onExpire={() => {
                            // El cronómetro expiró, pero el link puede seguir válido hasta 1 hora antes del turno
                          }}
                        />
                        <Text style={[styles.depositExpiryNote, isDarkMode && styles.depositExpiryNoteDark]}>
                          El link de pago vence 1 hora antes del turno
                        </Text>
                      </View>
                    );
                  }
                  
                  return (
                    <Text style={[styles.depositInfoNote, isDarkMode && styles.depositInfoNoteDark]}>
                      ⏰ El link de pago vence 1 hora antes del turno
                    </Text>
                  );
                })()}
              </View>
              <Text style={[styles.depositAmount, isDarkMode && styles.depositAmountDark]}>
                ${depositAmount}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.payButton, loadingPayment && styles.payButtonDisabled]}
            onPress={handlePayDeposit}
            disabled={loadingPayment}
            activeOpacity={0.8}
          >
            {loadingPayment ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <View style={styles.payButtonContent}>
                <MercadoPagoLogo size={44} variant="horizontal" width={180} />
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={[styles.skipButtonText, isDarkMode && styles.skipButtonTextDark]}>
              Pagar más tarde
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.stepContainer}>
        <Text style={[styles.stepTitle, isDarkMode && styles.stepTitleDark]}>Confirmar turno</Text>
        <View style={[styles.confirmCard, isDarkMode && styles.confirmCardDark]}>
          <View style={styles.confirmRow}>
            <Text style={[styles.confirmLabel, isDarkMode && styles.confirmLabelDark]}>Servicio:</Text>
            <Text style={[styles.confirmValue, isDarkMode && styles.confirmValueDark]}>
              {selectedService.name}
            </Text>
          </View>
          <View style={styles.confirmRow}>
            <Text style={[styles.confirmLabel, isDarkMode && styles.confirmLabelDark]}>Instructor:</Text>
            <Text style={[styles.confirmValue, isDarkMode && styles.confirmValueDark]}>
              {selectedInstructor.name}
            </Text>
          </View>
          <View style={styles.confirmRow}>
            <Text style={[styles.confirmLabel, isDarkMode && styles.confirmLabelDark]}>Fecha y hora:</Text>
            <Text style={[styles.confirmValue, isDarkMode && styles.confirmValueDark]}>
              {fullDate.format('ddd D MMM · HH:mm')}
            </Text>
          </View>
          <View style={styles.confirmRow}>
            <Text style={[styles.confirmLabel, isDarkMode && styles.confirmLabelDark]}>Duración:</Text>
            <Text style={[styles.confirmValue, isDarkMode && styles.confirmValueDark]}>
              {selectedService.duration_min} minutos
            </Text>
          </View>
          <View style={styles.confirmRow}>
            <Text style={[styles.confirmLabel, isDarkMode && styles.confirmLabelDark]}>Precio:</Text>
            <Text style={[styles.confirmValue, isDarkMode && styles.confirmValueDark]}>
              ${selectedService.price_decimal}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.confirmButton, submitting && styles.confirmButtonDisabled]}
          onPress={handleConfirm}
          disabled={submitting}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.confirmButtonText}>Confirmar reserva</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderStep = () => {
    switch (step) {
      case 'service':
        return renderServiceStep();
      case 'instructor':
        return renderInstructorStep();
      case 'datetime':
        return renderDateTimeStep();
      case 'confirm':
        return renderConfirmStep();
      default:
        return null;
    }
  };

  const canGoBack = step !== 'service';
  const stepNumber = { service: 1, instructor: 2, datetime: 3, confirm: 4 }[step];

  return (
    <View style={[styles.screenContainer, isDarkMode && styles.screenContainerDark]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <LinearGradient
        colors={[ARJA_PRIMARY_START, ARJA_PRIMARY_END]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          {canGoBack && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                if (step === 'instructor') setStep('service');
                else if (step === 'datetime') setStep('instructor');
                else if (step === 'confirm') setStep('datetime');
              }}
              activeOpacity={0.7}
            >
              <ArrowLeftIcon size={24} color="#ffffff" />
            </TouchableOpacity>
          )}
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Reservar turno</Text>
            <Text style={styles.headerSubtitle}>Paso {stepNumber} de 4</Text>
          </View>
        </View>
      </LinearGradient>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {renderStep()}
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
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 20,
  },
  stepTitleDark: {
    color: '#e6f2f8',
  },
  loader: {
    marginTop: 40,
  },
  optionsGrid: {
    gap: 12,
  },
  optionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  optionCardDark: {
    backgroundColor: '#1a2a3a',
  },
  optionCardSelected: {
    borderWidth: 2,
    borderColor: ARJA_PRIMARY_START,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  optionTitleDark: {
    color: '#e6f2f8',
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  optionSubtitleDark: {
    color: '#90acbc',
  },
  instructorColor: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 8,
  },
  dateTimeSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 12,
  },
  sectionLabelDark: {
    color: '#e6f2f8',
  },
  datesScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  dateCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 80,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  dateCardDark: {
    backgroundColor: '#1a2a3a',
  },
  dateCardSelected: {
    borderWidth: 2,
    borderColor: ARJA_PRIMARY_START,
  },
  dateWeekday: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  dateWeekdayDark: {
    color: '#90acbc',
  },
  dateDay: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  dateDayDark: {
    color: '#e6f2f8',
  },
  dateMonth: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  dateMonthDark: {
    color: '#90acbc',
  },
  todayBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ARJA_PRIMARY_START,
  },
  timeSlotsGrid: {
    gap: 12,
  },
  timeSlot: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  timeSlotDark: {
    backgroundColor: '#1a2a3a',
    borderColor: '#374151',
  },
  timeSlotBusy: {
    backgroundColor: '#f3f4f6',
    opacity: 0.5,
  },
  timeSlotSelected: {
    backgroundColor: ARJA_PRIMARY_START,
    borderColor: ARJA_PRIMARY_START,
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  timeSlotTextDark: {
    color: '#e6f2f8',
  },
  timeSlotTextBusy: {
    color: '#9ca3af',
  },
  timeSlotTextSelected: {
    color: '#ffffff',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  emptyStateTextDark: {
    color: '#90acbc',
  },
  confirmCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  confirmCardDark: {
    backgroundColor: '#1a2a3a',
  },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  confirmLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  confirmLabelDark: {
    color: '#90acbc',
  },
  confirmValue: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '700',
  },
  confirmValueDark: {
    color: '#e6f2f8',
  },
  confirmButton: {
    backgroundColor: ARJA_PRIMARY_START,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  successMessage: {
    backgroundColor: '#10b98120',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  successText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  successTextDark: {
    color: '#34d399',
  },
  depositRow: {
    backgroundColor: '#fef3c720',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
  depositNote: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  depositNoteDark: {
    color: '#90acbc',
  },
  depositInfoContainer: {
    flex: 1,
  },
  countdownContainer: {
    marginTop: 12,
    alignItems: 'flex-start',
  },
  depositExpiryNote: {
    fontSize: 11,
    color: '#0ea5e9',
    marginTop: 8,
    fontWeight: '500',
  },
  depositExpiryNoteDark: {
    color: '#38bdf8',
  },
  depositInfoNote: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 4,
  },
  depositInfoNoteDark: {
    color: '#9ca3af',
  },
  depositAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f59e0b',
  },
  depositAmountDark: {
    color: '#fbbf24',
  },
  depositExpiryNote: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 4,
  },
  depositExpiryNoteDark: {
    color: '#9ca3af',
  },
  payButton: {
    backgroundColor: '#009ee3',
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 12,
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  payButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  skipButtonTextDark: {
    color: '#90acbc',
  },
});

