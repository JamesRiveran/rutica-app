import { Platform } from 'react-native';

/**
 * Genera estilos de sombra compatibles con web y nativo
 */
export function getShadowStyle(config: {
  color?: string;
  offsetX?: number;
  offsetY?: number;
  opacity?: number;
  radius?: number;
  elevation?: number;
}) {
  const {
    color = '#000',
    offsetX = 0,
    offsetY = 2,
    opacity = 0.1,
    radius = 4,
    elevation = 4,
  } = config;

  if (Platform.OS === 'web') {
    // Para web, usar boxShadow
    const rgbaColor = hexToRgba(color, opacity);
    return {
      boxShadow: `${offsetX}px ${offsetY}px ${radius}px ${rgbaColor}`,
    };
  }

  // Para iOS/Android usar las propiedades nativas
  return {
    shadowColor: color,
    shadowOffset: { width: offsetX, height: offsetY },
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation, // Para Android
  };
}

/**
 * Convierte hex a rgba
 */
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
