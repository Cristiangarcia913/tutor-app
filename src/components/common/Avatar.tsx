import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/theme';
import { getInitials } from '../../constants/theme';

interface AvatarProps {
  firstName?: string;
  lastName?: string;
  name?: string;
  color?: string;
  size?: number;
  imageUri?: string;
}

export default function Avatar({
  firstName,
  lastName,
  name,
  color = Colors.primary,
  size = 44,
  imageUri,
}: AvatarProps) {
  let initials = '';
  if (firstName || lastName) {
    initials = getInitials(firstName || '', lastName || '');
  } else if (name) {
    const parts = name.trim().split(/\s+/);
    initials = getInitials(parts[0] || '', parts[1] || '');
  } else {
    initials = '??';
  }

  const fontSize = size * 0.38;

  if (imageUri) {
    return (
      <Image
        source={{ uri: imageUri }}
        style={[
          styles.image,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
      ]}
    >
      <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    resizeMode: 'cover',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export { Avatar };
