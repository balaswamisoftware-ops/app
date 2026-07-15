/**
 * Sri Vidya Peetam brand tokens for use in JS/TS (icon colors, native props
 * like StatusBar / Switch that don't accept NativeWind classes). Keep these in
 * sync with `tailwind.config.js`.
 */
export const colors = {
  primary: '#E8751A',
  primaryDark: '#C25010',
  primaryLight: '#FBE7D3',
  maroon: '#7A1F1F',
  gold: '#E6A419',
  white: '#FFFFFF',
  background: '#FFF9F3',
  surface: '#FFFFFF',
  border: '#E5E7EB',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  danger: '#EF4444',
  success: '#16A34A',
} as const;

export type ColorToken = keyof typeof colors;
