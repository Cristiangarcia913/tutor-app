import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Colors,
  BorderRadius,
  Spacing,
  FontSizes,
  Shadows,
} from '../../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

const VARIANT_STYLES: Record<
  string,
  { container: ViewStyle; text: TextStyle; iconColor: string }
> = {
  primary: {
    container: {
      backgroundColor: Colors.primary,
      ...Shadows.sm,
    },
    text: { color: Colors.textInverse },
    iconColor: Colors.textInverse,
  },
  secondary: {
    container: {
      backgroundColor: Colors.primaryBg,
    },
    text: { color: Colors.primary },
    iconColor: Colors.primary,
  },
  outline: {
    container: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: Colors.border,
    },
    text: { color: Colors.textPrimary },
    iconColor: Colors.textPrimary,
  },
  ghost: {
    container: {
      backgroundColor: 'transparent',
    },
    text: { color: Colors.primary },
    iconColor: Colors.primary,
  },
  danger: {
    container: {
      backgroundColor: Colors.danger,
      ...Shadows.sm,
    },
    text: { color: Colors.textInverse },
    iconColor: Colors.textInverse,
  },
};

const SIZE_STYLES: Record<
  string,
  { container: ViewStyle; text: TextStyle; iconSize: number }
> = {
  sm: {
    container: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md },
    text: { fontSize: FontSizes.sm },
    iconSize: 16,
  },
  md: {
    container: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl },
    text: { fontSize: FontSizes.md },
    iconSize: 18,
  },
  lg: {
    container: { paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xxl },
    text: { fontSize: FontSizes.lg },
    iconSize: 20,
  },
};

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled = false,
  fullWidth = false,
}: ButtonProps) {
  const v = VARIANT_STYLES[variant];
  const s = SIZE_STYLES[size];

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.base,
        v.container,
        s.container,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.text.color} size="small" />
      ) : (
        <View style={styles.content}>
          {icon && (
            <Ionicons
              name={icon as any}
              size={s.iconSize}
              color={disabled ? Colors.disabled : v.iconColor}
              style={styles.icon}
            />
          )}
          <Text
            style={[
              styles.label,
              v.text,
              s.text,
              disabled && styles.disabledText,
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    color: Colors.disabled,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: Spacing.sm,
  },
  label: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

export { Button };
