import { DarkTheme } from '@react-navigation/native';

export const colors = {
  background: '#000000',
  surface: '#0A0A0A',
  surfaceMuted: '#111111',
  border: '#1A1A1A',
  primary: '#8A2BE2',
  primarySoft: 'rgba(138, 43, 226, 0.15)',
  text: '#FFFFFF',
  textMuted: '#9CA3AF',
  danger: '#FF3B30',
};

export const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.surface,
    primary: colors.primary,
    text: colors.text,
    border: colors.border,
    notification: colors.danger,
  },
};
