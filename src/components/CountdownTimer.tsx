/**
 * Componente de cronómetro regresivo
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ClockIcon } from './Icons';

interface CountdownTimerProps {
  initialMinutes: number;
  onExpire?: () => void;
  isDark?: boolean;
  compact?: boolean;
  color?: string;
}

export function CountdownTimer({ initialMinutes, onExpire, isDark = false, compact = false, color }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(initialMinutes * 60); // Convertir a segundos

  useEffect(() => {
    if (timeLeft <= 0) {
      if (onExpire) {
        onExpire();
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (onExpire) {
            onExpire();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onExpire]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isExpired = timeLeft === 0;
  const isWarning = timeLeft <= 300; // 5 minutos o menos

  const formatTime = (value: number) => {
    return value.toString().padStart(2, '0');
  };

  const timerColor = color || (isExpired ? '#ef4444' : isWarning ? '#f59e0b' : '#0ea5e9');
  
  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <ClockIcon size={12} color={timerColor} />
        <Text style={[styles.compactTime, { color: timerColor }]}>
          {isExpired ? '00:00' : `${formatTime(minutes)}:${formatTime(seconds)}`}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <View style={[styles.timerBox, isWarning && !isExpired && styles.timerBoxWarning, isExpired && styles.timerBoxExpired]}>
        <View style={styles.timerHeader}>
          <ClockIcon size={16} color={timerColor} />
          <Text style={[styles.timerLabel, isDark && styles.timerLabelDark, isExpired && styles.timerLabelExpired, isWarning && !isExpired && styles.timerLabelWarning]}>
            {isExpired ? 'Expirado' : 'Vence en'}
          </Text>
        </View>
        {!isExpired && (
          <View style={styles.timeContainer}>
            <View style={styles.timeUnit}>
              <Text style={[styles.timeValue, isWarning && styles.timeValueWarning]}>
                {formatTime(minutes)}
              </Text>
              <Text style={[styles.timeUnitLabel, isDark && styles.timeUnitLabelDark]}>min</Text>
            </View>
            <Text style={[styles.separator, isDark && styles.separatorDark, isWarning && styles.separatorWarning]}>:</Text>
            <View style={styles.timeUnit}>
              <Text style={[styles.timeValue, isWarning && styles.timeValueWarning]}>
                {formatTime(seconds)}
              </Text>
              <Text style={[styles.timeUnitLabel, isDark && styles.timeUnitLabelDark]}>seg</Text>
            </View>
          </View>
        )}
        {isExpired && (
          <Text style={[styles.expiredText, isDark && styles.expiredTextDark]}>El link ya no está disponible</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  containerDark: {
    // No changes needed
  },
  timerBox: {
    backgroundColor: '#f0f9ff',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#0ea5e9',
  },
  timerBoxWarning: {
    backgroundColor: '#fffbeb',
    borderColor: '#f59e0b',
  },
  timerBoxExpired: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
  },
  timerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  timerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0ea5e9',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timerLabelDark: {
    color: '#38bdf8',
  },
  timerLabelWarning: {
    color: '#f59e0b',
  },
  timerLabelExpired: {
    color: '#ef4444',
  },
  expiredText: {
    fontSize: 12,
    color: '#991b1b',
    marginTop: 4,
  },
  expiredTextDark: {
    color: '#fca5a5',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeUnit: {
    alignItems: 'center',
    minWidth: 50,
  },
  timeValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0ea5e9',
    fontVariant: ['tabular-nums'],
  },
  timeValueWarning: {
    color: '#f59e0b',
  },
  timeUnitLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6b7280',
    marginTop: 2,
  },
  timeUnitLabelDark: {
    color: '#9ca3af',
  },
  separator: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0ea5e9',
    marginHorizontal: 6,
  },
  separatorDark: {
    color: '#38bdf8',
  },
  separatorWarning: {
    color: '#f59e0b',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  compactTime: {
    fontSize: 11,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
});

