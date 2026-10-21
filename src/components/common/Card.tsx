import React from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { Colors, BorderRadius, Shadows, Spacing } from '../../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  variant?: 'default' | 'outlined' | 'elevated';
}

export default function Card({
  children,
  style,
  onPress,
  variant = 'default',
}: CardProps) {
  const cardStyle: ViewStyle[] = [
    styles.base,
    variant === 'default' && styles.default,
    variant === 'outlined' && styles.outlined,
    variant === 'elevated' && styles.elevated,
    style as ViewStyle,
  ].filter(Boolean) as ViewStyle[];

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        style={cardStyle}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
  },
  default: {
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  outlined: {
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  elevated: {
    ...Shadows.md,
  },
});

export { Card };
