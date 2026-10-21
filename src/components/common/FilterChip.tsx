import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Colors, BorderRadius, FontSizes, Spacing } from '../../constants/theme';

interface FilterChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  color?: string;
}

export default function FilterChip({
  label,
  selected,
  onPress,
  color = Colors.primary,
}: FilterChipProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.chip,
        selected
          ? { backgroundColor: color }
          : { backgroundColor: Colors.borderLight, borderColor: Colors.border, borderWidth: 1 },
      ]}
    >
      <Text
        style={[
          styles.label,
          { color: selected ? Colors.textInverse : Colors.textSecondary },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
  },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});

export { FilterChip };
