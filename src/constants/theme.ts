// =============================================================================
// TutorApp - Theme & Design System
// Comprehensive design tokens, colors, typography, spacing, and helpers
// =============================================================================

import { Platform } from 'react-native';

// -----------------------------------------------------------------------------
// Light Mode Colors
// -----------------------------------------------------------------------------
export const Colors = {
  // Brand
  primary: '#4F46E5',       // Indigo
  primaryLight: '#818CF8',
  primaryDark: '#3730A3',
  primaryBg: '#EEF2FF',
  secondary: '#0EA5E9',     // Sky blue
  secondaryLight: '#7DD3FC',
  secondaryDark: '#0369A1',
  secondaryBg: '#E0F2FE',

  // Semantic
  success: '#10B981',
  successLight: '#6EE7B7',
  successDark: '#059669',
  warning: '#F59E0B',
  warningLight: '#FCD34D',
  warningDark: '#D97706',
  danger: '#EF4444',
  dangerLight: '#FCA5A5',
  dangerDark: '#DC2626',
  info: '#3B82F6',
  infoLight: '#93C5FD',
  infoDark: '#2563EB',

  // Backgrounds
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceVariant: '#F1F5F9',
  surfaceElevated: '#FFFFFF',

  // Text
  text: '#0F172A',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  textMuted: '#94A3B8',
  textOnPrimary: '#FFFFFF',
  textOnDark: '#FFFFFF',
  textInverse: '#FFFFFF',
  placeholder: '#94A3B8',
  disabled: '#CBD5E1',

  // Borders
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  borderFocused: '#4F46E5',

  // Overlays
  overlay: 'rgba(15, 23, 42, 0.5)',
  overlayLight: 'rgba(15, 23, 42, 0.1)',

  // Status colors (for class sessions)
  scheduled: '#3B82F6',
  scheduledBg: '#EFF6FF',
  completed: '#10B981',
  completedBg: '#ECFDF5',
  cancelled: '#EF4444',
  cancelledBg: '#FEF2F2',
  noShow: '#F59E0B',
  noShowBg: '#FFFBEB',

  // Payment status
  pendiente: '#F59E0B',
  pendienteBg: '#FFFBEB',
  cobrado: '#10B981',
  cobradoBg: '#ECFDF5',
  cancelado: '#EF4444',
  canceladoBg: '#FEF2F2',

  // Payment method colors
  efectivo: '#10B981',
  transferencia: '#3B82F6',
  bizum: '#8B5CF6',
  paypal: '#0EA5E9',
  otro: '#64748B',

  // Subject colors palette (for assigning to subjects)
  subjectColors: [
    '#4F46E5', // Indigo
    '#0EA5E9', // Sky
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Violet
    '#EC4899', // Pink
    '#14B8A6', // Teal
    '#F97316', // Orange
    '#06B6D4', // Cyan
  ],

  // Avatar colors palette (for student avatars)
  avatarColors: [
    '#4F46E5', // Indigo
    '#0EA5E9', // Sky
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Violet
    '#EC4899', // Pink
    '#F97316', // Orange
    '#14B8A6', // Teal
    '#06B6D4', // Cyan
  ],

  // Misc
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  shimmer: '#E2E8F0',
};

// -----------------------------------------------------------------------------
// Dark Mode Colors
// -----------------------------------------------------------------------------
export const DarkColors = {
  // Brand (keep the same)
  primary: '#818CF8',
  primaryLight: '#A5B4FC',
  primaryDark: '#4F46E5',
  secondary: '#38BDF8',
  secondaryLight: '#7DD3FC',
  secondaryDark: '#0EA5E9',

  // Semantic (slightly lighter for dark backgrounds)
  success: '#34D399',
  successLight: '#6EE7B7',
  successDark: '#10B981',
  warning: '#FBBF24',
  warningLight: '#FCD34D',
  warningDark: '#F59E0B',
  danger: '#F87171',
  dangerLight: '#FCA5A5',
  dangerDark: '#EF4444',
  info: '#60A5FA',
  infoLight: '#93C5FD',
  infoDark: '#3B82F6',

  // Backgrounds
  background: '#0F172A',
  surface: '#1E293B',
  surfaceVariant: '#334155',
  surfaceElevated: '#1E293B',

  // Text
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  textOnPrimary: '#FFFFFF',
  textOnDark: '#FFFFFF',

  // Borders
  border: '#334155',
  borderLight: '#1E293B',
  borderFocused: '#818CF8',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.6)',
  overlayLight: 'rgba(0, 0, 0, 0.2)',

  // Status colors (slightly adjusted for dark mode)
  scheduled: '#60A5FA',
  scheduledBg: '#1E3A5F',
  completed: '#34D399',
  completedBg: '#14352B',
  cancelled: '#F87171',
  cancelledBg: '#3B1D1D',
  noShow: '#FBBF24',
  noShowBg: '#3B2F0E',

  // Payment status
  pendiente: '#FBBF24',
  pendienteBg: '#3B2F0E',
  cobrado: '#34D399',
  cobradoBg: '#14352B',
  cancelado: '#F87171',
  canceladoBg: '#3B1D1D',

  // Payment method colors
  efectivo: '#34D399',
  transferencia: '#60A5FA',
  bizum: '#A78BFA',
  paypal: '#38BDF8',
  otro: '#94A3B8',

  // Subject colors palette (same as light)
  subjectColors: Colors.subjectColors,

  // Avatar colors (same as light)
  avatarColors: Colors.avatarColors,

  // Misc
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  shimmer: '#334155',
};

// -----------------------------------------------------------------------------
// Spacing Scale
// -----------------------------------------------------------------------------
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
  section: 48,
  screenPadding: 16,
} as const;

// -----------------------------------------------------------------------------
// Font Sizes
// -----------------------------------------------------------------------------
export const FontSizes = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 22,
  xxxl: 28,
  title: 34,
} as const;

// -----------------------------------------------------------------------------
// Font Weights
// -----------------------------------------------------------------------------
export const FontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

// -----------------------------------------------------------------------------
// Border Radius
// -----------------------------------------------------------------------------
export const BorderRadius = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  xxl: 28,
  full: 9999,
} as const;

// -----------------------------------------------------------------------------
// Shadows (cross-platform)
// -----------------------------------------------------------------------------
export const Shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
} as const;

// -----------------------------------------------------------------------------
// Layout Constants
// -----------------------------------------------------------------------------
export const Layout = {
  screenPadding: Spacing.lg,
  cardPadding: Spacing.lg,
  inputHeight: 48,
  buttonHeight: 48,
  buttonHeightSmall: 36,
  headerHeight: 56,
  tabBarHeight: Platform.OS === 'ios' ? 88 : 64,
  avatarSizeSmall: 32,
  avatarSizeMedium: 44,
  avatarSizeLarge: 64,
  avatarSizeXLarge: 80,
  iconSizeSmall: 16,
  iconSizeMedium: 20,
  iconSizeLarge: 24,
  iconSizeXLarge: 32,
  badgeSize: 20,
  dotSize: 8,
  listItemHeight: 72,
  dividerHeight: 1,
} as const;

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

/**
 * Format a number as currency (European style: "15.00 €")
 */
export const formatCurrency = (amount: number): string => {
  return `${amount.toFixed(2)} €`;
};

/**
 * Format an ISO date string to DD/MM/YYYY
 */
export const formatDate = (date: string): string => {
  if (!date) return '';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Format an ISO date string to a short readable format: "15 Oct"
 */
export const formatDateShort = (date: string): string => {
  if (!date) return '';
  const d = new Date(date);
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${d.getDate()} ${months[d.getMonth()]}`;
};

/**
 * Format an ISO date to relative text (Hoy, Ayer, Mañana, or the date)
 */
export const formatDateRelative = (date: string): string => {
  if (!date) return '';
  const d = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);

  const diffDays = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Mañana';
  if (diffDays === -1) return 'Ayer';
  return formatDate(date);
};

/**
 * Format a time string (already HH:mm, just return as-is or reformat)
 */
export const formatTime = (time: string): string => {
  if (!time) return '';
  // Already in HH:mm format
  return time;
};

/**
 * Format a duration in minutes to a readable string: "1h 30min"
 */
export const formatDuration = (minutes: number): string => {
  if (minutes <= 0) return '0min';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}min`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}min`;
};

/**
 * Get initials from first and last name
 */
export const getInitials = (firstName: string, lastName: string): string => {
  const first = firstName?.trim().charAt(0).toUpperCase() || '';
  const last = lastName?.trim().charAt(0).toUpperCase() || '';
  return `${first}${last}`;
};

/**
 * Get a human-readable label for a class session status (in Spanish)
 */
export const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    'scheduled': 'Programada',
    'completed': 'Completada',
    'cancelled': 'Cancelada',
    'no-show': 'No asistió',
  };
  return labels[status] || status;
};

/**
 * Get the color for a class session status
 */
export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    'scheduled': Colors.scheduled,
    'completed': Colors.completed,
    'cancelled': Colors.cancelled,
    'no-show': Colors.noShow,
  };
  return colors[status] || Colors.textSecondary;
};

/**
 * Get the background color for a class session status
 */
export const getStatusBgColor = (status: string): string => {
  const colors: Record<string, string> = {
    'scheduled': Colors.scheduledBg,
    'completed': Colors.completedBg,
    'cancelled': Colors.cancelledBg,
    'no-show': Colors.noShowBg,
  };
  return colors[status] || Colors.surfaceVariant;
};

/**
 * Get a human-readable label for a payment method (in Spanish)
 */
export const getPaymentMethodLabel = (method: string): string => {
  const labels: Record<string, string> = {
    'efectivo': 'Efectivo',
    'transferencia': 'Transferencia',
    'bizum': 'Bizum',
    'paypal': 'PayPal',
    'otro': 'Otro',
  };
  return labels[method] || method;
};

/**
 * Get the color for a payment method
 */
export const getPaymentMethodColor = (method: string): string => {
  const colors: Record<string, string> = {
    'efectivo': Colors.efectivo,
    'transferencia': Colors.transferencia,
    'bizum': Colors.bizum,
    'paypal': Colors.paypal,
    'otro': Colors.otro,
  };
  return colors[method] || Colors.textSecondary;
};

/**
 * Get a human-readable label for a class location (in Spanish)
 */
export const getLocationLabel = (location: string): string => {
  const labels: Record<string, string> = {
    'presencial': 'Presencial',
    'online': 'Online',
    'domicilio': 'A domicilio',
  };
  return labels[location] || location;
};

/**
 * Get a human-readable label for a payment status (in Spanish)
 */
export const getPaymentStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    'pendiente': 'Pendiente',
    'cobrado': 'Cobrado',
    'cancelado': 'Cancelado',
  };
  return labels[status] || status;
};

/**
 * Get color for a payment status
 */
export const getPaymentStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    'pendiente': Colors.pendiente,
    'cobrado': Colors.cobrado,
    'cancelado': Colors.cancelado,
  };
  return colors[status] || Colors.textSecondary;
};

/**
 * Get a random avatar color from the palette
 */
export const getRandomAvatarColor = (): string => {
  return Colors.avatarColors[Math.floor(Math.random() * Colors.avatarColors.length)];
};

/**
 * Get a subject color by index (cycles through palette)
 */
export const getSubjectColor = (index: number): string => {
  return Colors.subjectColors[index % Colors.subjectColors.length];
};

/**
 * Format a month string (YYYY-MM) to a readable Spanish month name
 */
export const formatMonth = (monthStr: string): string => {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];
  const [year, month] = monthStr.split('-');
  const monthIndex = parseInt(month, 10) - 1;
  if (monthIndex < 0 || monthIndex > 11) return monthStr;
  return `${months[monthIndex]} ${year}`;
};

/**
 * Get the day name in Spanish for a date
 */
export const getDayName = (date: string): string => {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const d = new Date(date);
  return days[d.getDay()];
};

/**
 * Get the short day name in Spanish
 */
export const getDayNameShort = (date: string): string => {
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const d = new Date(date);
  return days[d.getDay()];
};

export const MONTH_LABELS_SHORT = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];
