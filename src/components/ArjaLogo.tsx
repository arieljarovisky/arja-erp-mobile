/**
 * Componente de Logo ARJA ERP
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ARJA_PRIMARY_START = '#13b5cf';
const ARJA_PRIMARY_END = '#0d7fd4';

export function ArjaLogo({ size = 80, isDark = false }: { size?: number; isDark?: boolean }) {
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

const styles = StyleSheet.create({
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
});

