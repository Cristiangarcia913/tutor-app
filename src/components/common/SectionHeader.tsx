import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, FontSizes, Spacing } from '../../constants/theme';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  actionText?: string;
  onAction?: () => void;
}

export default function SectionHeader({
  title,
  actionLabel,
  actionText,
  onAction,
}: SectionHeaderProps) {
  const displayLabel = actionLabel || actionText;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {displayLabel && onAction && (
        <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
          <Text style={styles.action}>{displayLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    marginTop: Spacing.xs,
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 0.2,
  },
  action: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
});

export { SectionHeader };
