import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../constants/theme';

interface FABProps {
  onPress: () => void;
  icon?: string;
}

export default function FloatingActionButton({
  onPress,
  icon = 'add',
}: FABProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={styles.fab}
    >
      <Ionicons name={icon as any} size={28} color={Colors.textInverse} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 80,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
    ...Shadows.lg,
  },
});

export { FloatingActionButton };
