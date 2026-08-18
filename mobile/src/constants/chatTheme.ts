import { theme } from './theme';

export const chatTheme = {
  background: '#E9E6E0',
  hubBackground: '#F4F2EE',
  inputBackground: '#FFFFFF',
  inputBorder: '#E0DDD6',
  ownBubble: '#1A1A1A',
  ownBubbleText: '#FFFFFF',
  ownBubbleMeta: 'rgba(255,255,255,0.72)',
  otherBubble: '#FFFFFF',
  otherBubbleText: '#1A1A1A',
  otherBubbleMeta: '#8A857C',
  senderName: '#B8860B',
  accent: theme.colors.primary,
  accentDark: '#C9A800',
  accentSoft: '#FFF8DC',
  teamGradientStart: '#1A1A1A',
  teamGradientEnd: '#3D3A34',
  shadow: {
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  inputShadow: {
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarPalette: [
    { bg: '#FFF3CD', text: '#7A5C00' },
    { bg: '#E8F4FD', text: '#1565C0' },
    { bg: '#E8F5E9', text: '#2E7D32' },
    { bg: '#F3E5F5', text: '#6A1B9A' },
    { bg: '#FFEBEE', text: '#C62828' },
    { bg: '#E0F2F1', text: '#00695C' },
    { bg: '#FFF8E1', text: '#F57F17' },
    { bg: '#E8EAF6', text: '#283593' },
  ],
} as const;

export type ChatTheme = typeof chatTheme;
