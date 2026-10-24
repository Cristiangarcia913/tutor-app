import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Colors,
  Spacing,
  FontSizes,
  BorderRadius,
  Shadows,
  formatCurrency,
  formatDate,
  formatDuration,
  getStatusColor,
  getStatusLabel,
  getLocationLabel,
} from '../../constants/theme';
import { ClassSession, Student, Subject } from '../../types';
import Badge from '../common/Badge';

interface ClassCardProps {
  session: ClassSession;
  student?: Student;
  subject?: Subject;
  onPress: () => void;
  showStudentName?: boolean;
}

export default function ClassCard({
  session,
  student,
  subject,
  onPress,
  showStudentName = true,
}: ClassCardProps) {
  const statusColor = getStatusColor(session.status);
  const statusLabel = getStatusLabel(session.status);
  const locationLabel = getLocationLabel(session.location);

  const getLocationIcon = (loc: string): keyof typeof Ionicons.glyphMap => {
    switch (loc) {
      case 'online':
        return 'videocam-outline';
      case 'domicilio':
        return 'car-outline';
      default:
        return 'business-outline';
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={styles.card}
    >
      <View style={styles.header}>
        <View style={styles.subjectRow}>
          <View
            style={[
              styles.colorDot,
              { backgroundColor: subject?.color || Colors.primary },
            ]}
          />
          <Text style={styles.subjectName} numberOfLines={1}>
            {subject?.name || 'Clase'}
          </Text>
        </View>

        <Badge
          text={statusLabel}
          color={statusColor}
          backgroundColor={`${statusColor}18`}
          size="sm"
        />
      </View>

      {showStudentName && student && (
        <View style={styles.studentRow}>
          <Ionicons name="person-circle-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.studentName} numberOfLines={1}>
            {student.firstName} {student.lastName}
          </Text>
        </View>
      )}

      <View style={styles.footer}>
        <View style={styles.metaCol}>
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={13} color={Colors.textSecondary} />
            <Text style={styles.metaText}>{formatDate(session.date)}</Text>
            <Text style={styles.metaDot}>•</Text>
            <Ionicons name="time-outline" size={13} color={Colors.textSecondary} />
            <Text style={styles.metaText}>
              {session.startTime} - {session.endTime} ({formatDuration(session.duration)})
            </Text>
          </View>

          <View style={styles.metaRow}>
            <Ionicons
              name={getLocationIcon(session.location)}
              size={13}
              color={Colors.textTertiary}
            />
            <Text style={styles.metaTextMuted}>{locationLabel}</Text>
          </View>

          {session.status === 'cancelled' && (
            <View style={styles.cancelReasonRow}>
              <Ionicons name="alert-circle-outline" size={13} color={Colors.danger} />
              <Text style={styles.cancelReasonText} numberOfLines={1}>
                Motivo: {session.cancelReason || 'Aviso previo / Festivo'}
              </Text>
            </View>
          )}

          {(session.isRescheduled || session.rescheduledFromDate) && session.status !== 'cancelled' && (
            <View style={styles.rescheduledRow}>
              <Ionicons name="swap-horizontal" size={13} color={Colors.primary} />
              <Text style={styles.rescheduledText} numberOfLines={1}>
                Cambiada del {session.rescheduledFromDate}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.priceContainer}>
          <Text
            style={[
              styles.priceText,
              session.status === 'cancelled' && styles.priceTextCancelled,
            ]}
          >
            {session.status === 'cancelled' ? '0,00 €' : formatCurrency(session.totalAmount)}
          </Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: Spacing.sm,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  subjectName: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.text,
    flexShrink: 1,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.xs,
  },
  studentName: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 4,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  metaCol: {
    flex: 1,
    gap: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaDot: {
    fontSize: 10,
    color: Colors.textTertiary,
  },
  metaText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  metaTextMuted: {
    fontSize: FontSizes.xs,
    color: Colors.textTertiary,
  },
  priceContainer: {
    backgroundColor: Colors.surfaceVariant,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    marginLeft: Spacing.sm,
  },
  priceText: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.primary,
  },
  priceTextCancelled: {
    color: Colors.textTertiary,
    textDecorationLine: 'line-through',
  },
  cancelReasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  cancelReasonText: {
    fontSize: 11,
    color: Colors.danger,
    fontWeight: '600',
  },
  rescheduledRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  rescheduledText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
  },
});
