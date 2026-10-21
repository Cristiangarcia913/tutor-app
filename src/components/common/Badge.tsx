import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, BorderRadius, FontSizes, Spacing } from '../../constants/theme';

interface BadgeProps {
  text?: string;
  label?: string;
  color?: string;
  backgroundColor?: string;
  size?: 'sm' | 'md';
}

export default function Badge({
  text,
  label,
  color = Colors.primary,
  backgroundColor,
  size = 'md',
}: BadgeProps) {
  const isSm = size === 'sm';
  const displayText = text || label || '';
  const bgColor = backgroundColor || `${color}18`;

  return (
    <View
      style={[
        styles.base,
        { backgroundColor: bgColor },
        isSm ? styles.sm : styles.md,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color },
          isSm ? styles.textSm : styles.textMd,
        ]}
        numberOfLines={1}
      >
        {displayText}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    borderRadius: BorderRadius.full,
  },
  sm: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  md: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
  },
  text: {
    fontWeight: '600',
  },
  textSm: {
    fontSize: FontSizes.xs,
  },
  textMd: {
    fontSize: FontSizes.sm,
  },
});

export { Badge };
