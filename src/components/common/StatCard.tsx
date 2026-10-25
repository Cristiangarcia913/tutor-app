import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Colors,
  BorderRadius,
  FontSizes,
  Spacing,
  Shadows,
} from '../../constants/theme';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  onPress?: () => void;
}

const TREND_CONFIG = {
  up: { icon: 'trending-up', color: Colors.success },
  down: { icon: 'trending-down', color: Colors.danger },
  neutral: { icon: 'remove-outline', color: Colors.textTertiary },
} as const;

export default function StatCard({
  title,
  value,
  icon,
  color,
  subtitle,
  trend,
  onPress,
}: StatCardProps) {
  const trendCfg = trend ? TREND_CONFIG[trend] : null;

  const content = (
    <>
      <View style={styles.header}>
        <View style={[styles.iconCircle, { backgroundColor: `${color}18` }]}>
          <Ionicons name={icon as any} size={20} color={color} />
        </View>
        {trendCfg ? (
          <Ionicons
            name={trendCfg.icon as any}
            size={18}
            color={trendCfg.color}
          />
        ) : onPress ? (
          <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
        ) : null}
      </View>
      <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {subtitle && (
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      )}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        style={styles.card}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={styles.card}>{content}</View>;
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  title: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 10,
    color: Colors.textTertiary,
    marginTop: 2,
  },
});

export { StatCard };
