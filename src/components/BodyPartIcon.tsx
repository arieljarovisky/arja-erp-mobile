/**
 * Componente para renderizar iconos de partes del cuerpo usando SVG
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SvgIcon } from './SvgIcon';
import { bodyPartSvgs } from './bodyPartSvgs';

interface BodyPartIconProps {
  bodyPartId: string;
  size?: number;
  color?: string;
}

export const BodyPartIcon: React.FC<BodyPartIconProps> = ({ 
  bodyPartId, 
  size = 56, 
  color = '#051420' 
}) => {
  const svgString = bodyPartSvgs[bodyPartId];
  
  if (!svgString) {
    // Si no hay SVG, retornar vista vacía
    return (
      <View style={[styles.container, { width: size, height: size }]} />
    );
  }
  
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <SvgIcon 
        svgString={svgString} 
        size={size}
        color={color}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

