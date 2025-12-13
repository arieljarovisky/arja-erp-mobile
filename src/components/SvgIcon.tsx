/**
 * Componente para renderizar iconos SVG desde strings
 * Usa react-native-svg para renderizar SVGs dinámicamente
 */
import React from 'react';
import { View } from 'react-native';
import { Svg, Path, Circle, Rect } from 'react-native-svg';

interface SvgIconProps {
  svgString: string;
  size?: number;
  color?: string;
  style?: any;
}

// Función para extraer paths y elementos del SVG string
const parseSvgString = (svgString: string, size: number, color?: string) => {
  if (!svgString) return null;

  // Reemplazar currentColor con el color especificado
  let processedSvg = svgString;
  if (color) {
    processedSvg = processedSvg.replace(/currentColor/g, color);
  }

  // Extraer viewBox
  const viewBoxMatch = processedSvg.match(/viewBox=["']([^"']+)["']/);
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : `0 0 ${size} ${size}`;

  // Extraer todos los paths
  const pathMatches = processedSvg.match(/<path[^>]*>/g) || [];
  const circleMatches = processedSvg.match(/<circle[^>]*>/g) || [];
  const rectMatches = processedSvg.match(/<rect[^>]*>/g) || [];

  const elements: any[] = [];

  // Procesar paths
  pathMatches.forEach((pathTag) => {
    const dMatch = pathTag.match(/d=["']([^"']+)["']/);
    const fillMatch = pathTag.match(/fill=["']([^"']+)["']/);
    const strokeMatch = pathTag.match(/stroke=["']([^"']+)["']/);
    const strokeWidthMatch = pathTag.match(/stroke-width=["']?([^"'\s>]+)["']?/);
    const opacityMatch = pathTag.match(/opacity=["']?([^"'\s>]+)["']?/);
    const fillOpacityMatch = pathTag.match(/fill-opacity=["']?([^"'\s>]+)["']?/);

    if (dMatch) {
      elements.push({
        type: 'path',
        d: dMatch[1],
        fill: fillMatch ? fillMatch[1] : (fillMatch === null ? 'none' : undefined),
        stroke: strokeMatch ? strokeMatch[1] : (color || '#000000'),
        strokeWidth: strokeWidthMatch ? parseFloat(strokeWidthMatch[1]) : 2,
        opacity: opacityMatch ? parseFloat(opacityMatch[1]) : (fillOpacityMatch ? parseFloat(fillOpacityMatch[1]) : undefined),
      });
    }
  });

  // Procesar circles
  circleMatches.forEach((circleTag) => {
    const cxMatch = circleTag.match(/cx=["']?([^"'\s>]+)["']?/);
    const cyMatch = circleTag.match(/cy=["']?([^"'\s>]+)["']?/);
    const rMatch = circleTag.match(/r=["']?([^"'\s>]+)["']?/);
    const fillMatch = circleTag.match(/fill=["']([^"']+)["']/);
    const opacityMatch = circleTag.match(/opacity=["']?([^"'\s>]+)["']?/);

    if (cxMatch && cyMatch && rMatch) {
      elements.push({
        type: 'circle',
        cx: parseFloat(cxMatch[1]),
        cy: parseFloat(cyMatch[1]),
        r: parseFloat(rMatch[1]),
        fill: fillMatch ? fillMatch[1] : undefined,
        opacity: opacityMatch ? parseFloat(opacityMatch[1]) : undefined,
      });
    }
  });

  // Procesar rects
  rectMatches.forEach((rectTag) => {
    const xMatch = rectTag.match(/x=["']?([^"'\s>]+)["']?/);
    const yMatch = rectTag.match(/y=["']?([^"'\s>]+)["']?/);
    const widthMatch = rectTag.match(/width=["']?([^"'\s>]+)["']?/);
    const heightMatch = rectTag.match(/height=["']?([^"'\s>]+)["']?/);
    const rxMatch = rectTag.match(/rx=["']?([^"'\s>]+)["']?/);
    const fillMatch = rectTag.match(/fill=["']([^"']+)["']/);
    const opacityMatch = rectTag.match(/opacity=["']?([^"'\s>]+)["']?/);

    if (xMatch && yMatch && widthMatch && heightMatch) {
      elements.push({
        type: 'rect',
        x: parseFloat(xMatch[1]),
        y: parseFloat(yMatch[1]),
        width: parseFloat(widthMatch[1]),
        height: parseFloat(heightMatch[1]),
        rx: rxMatch ? parseFloat(rxMatch[1]) : undefined,
        fill: fillMatch ? fillMatch[1] : undefined,
        opacity: opacityMatch ? parseFloat(opacityMatch[1]) : undefined,
      });
    }
  });

  return { viewBox, elements };
};

export const SvgIcon: React.FC<SvgIconProps> = ({ 
  svgString, 
  size = 24, 
  color,
  style 
}) => {
  if (!svgString) {
    return null;
  }

  const parsed = parseSvgString(svgString, size, color);
  if (!parsed || parsed.elements.length === 0) {
    return null;
  }

  const [x, y, width, height] = parsed.viewBox.split(' ').map(Number);
  
  // Si el style tiene width y height específicos, usarlos; si no, usar size
  const containerWidth = style?.width || size;
  const containerHeight = style?.height || size;
  
  // Calcular el aspect ratio del viewBox para mantener las proporciones
  const aspectRatio = width / height;
  const finalWidth = containerWidth;
  const finalHeight = containerHeight;
  // Ajustar el viewBox si el contenedor tiene un aspect ratio diferente
  const adjustedViewBox = parsed.viewBox;

  return (
    <View style={[{ width: containerWidth, height: containerHeight }, style]}>
      <Svg width={finalWidth} height={finalHeight} viewBox={adjustedViewBox} preserveAspectRatio="xMidYMid meet">
        {parsed.elements.map((element, index) => {
          if (element.type === 'path') {
            return (
              <Path
                key={index}
                d={element.d}
                fill={element.fill}
                stroke={element.stroke}
                strokeWidth={element.strokeWidth}
                opacity={element.opacity}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          } else if (element.type === 'circle') {
            return (
              <Circle
                key={index}
                cx={element.cx}
                cy={element.cy}
                r={element.r}
                fill={element.fill}
                opacity={element.opacity}
              />
            );
          } else if (element.type === 'rect') {
            return (
              <Rect
                key={index}
                x={element.x}
                y={element.y}
                width={element.width}
                height={element.height}
                rx={element.rx}
                fill={element.fill}
                opacity={element.opacity}
              />
            );
          }
          return null;
        })}
      </Svg>
    </View>
  );
};

