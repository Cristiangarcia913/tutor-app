import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows, formatCurrency } from '../../constants/theme';
import { Student } from '../../types';
import Avatar from '../common/Avatar';
import Badge from '../common/Badge';

interface StudentCardProps {
  student: Student;
  onPress: () => void;
  pendingAmount?: number;
  classesCount?: number;
}

export default function StudentCard({
  student,
  onPress,
  pendingAmount = 0,
  classesCount,
}: StudentCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={styles.card}
    >
      <View style={styles.content}>
        <Avatar
          firstName={student.firstName}
          lastName={student.lastName}
          color={student.avatarColor || Colors.primary}
          size={50}
        />

        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {student.firstName} {student.lastName}
            </Text>
            {!student.active && (
              <Badge text="Inactivo" color={Colors.textTertiary} backgroundColor={Colors.surfaceVariant} size="sm" />
            )}
          </View>

          {student.course ? (
            <View style={styles.courseBadge}>
              <Ionicons name="school-outline" size={12} color={Colors.primary} />
              <Text style={styles.courseText} numberOfLines={1}>{student.course}</Text>
            </View>
          ) : null}

          {student.phone ? (
            <View style={styles.metaRow}>
              <Ionicons name="call-outline" size={13} color={Colors.textSecondary} />
              <Text style={styles.metaText}>{student.phone}</Text>
            </View>
          ) : null}

          {student.address ? (
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={13} color={Colors.textTertiary} />
              <Text style={styles.metaTextMuted} numberOfLines={1}>{student.address}</Text>
            </View>
          ) : null}

          {student.parentName || student.parentPhone ? (
            <View style={styles.metaRow}>
              <Ionicons name="people-outline" size={13} color={Colors.textTertiary} />
              <Text style={styles.metaTextMuted} numberOfLines={1}>
                Tutor: {student.parentName || 'Tutor'}{student.parentPhone ? ` (${student.parentPhone})` : ''}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.rightSection}>
          {pendingAmount > 0 ? (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingLabel}>Pendiente</Text>
              <Text style={styles.pendingAmount}>{formatCurrency(pendingAmount)}</Text>
            </View>
          ) : classesCount !== undefined ? (
            <View style={styles.classCountBadge}>
              <Text style={styles.classCountText}>{classesCount} {classesCount === 1 ? 'clase' : 'clases'}</Text>
            </View>
          ) : (
            <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: Spacing.md,
    marginRight: Spacing.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: 2,
  },
  name: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.text,
    flexShrink: 1,
  },
  courseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.xs,
    alignSelf: 'flex-start',
    marginTop: 2,
    marginBottom: 2,
  },
  courseText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.primaryDark,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  metaText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  metaTextMuted: {
    fontSize: FontSizes.xs,
    color: Colors.textTertiary,
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    alignItems: 'flex-end',
  },
  pendingLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#B45309',
    textTransform: 'uppercase',
  },
  pendingAmount: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: '#B45309',
  },
  classCountBadge: {
    backgroundColor: Colors.surfaceVariant,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  classCountText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
});
