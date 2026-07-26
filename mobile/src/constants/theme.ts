export const colors = {
  primary: '#FFD700',
  primaryDark: '#E6C200',
  primaryLight: '#FFF9E6',
  accent: '#1A1A1A',
  background: '#FFFFFF',
  surface: '#F5F5F5',
  border: '#E8E8E8',
  text: '#1A1A1A',
  textSecondary: '#666666',
  textMuted: '#9E9E9E',
  white: '#FFFFFF',
  black: '#000000',
  success: '#28A745',
  successLight: '#E8F5E9',
  warning: '#FF9800',
  warningLight: '#FFF3E0',
  error: '#DC3545',
  errorLight: '#FFEBEE',
  info: '#007BFF',
  infoLight: '#E3F2FD',
  purple: '#7B1FA2',
  purpleLight: '#F3E5F5',
  disabled: '#BDBDBD',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const fonts = {
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

export const shadows = {
  card: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
};

export const theme = {
  colors,
  spacing,
  radii,
  fonts,
  shadows,
};

export type Theme = typeof theme;
