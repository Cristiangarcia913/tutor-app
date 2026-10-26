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
  onTogglePaid?: () => void;
  showStudentName?: boolean;
}

export default function ClassCard({
  session,
  student,
  subject,
  onPress,
  onTogglePaid,
  showStudentName = true,
}: ClassCardProps) {
  const isPaid = session.isPaid === true;
  const isCancelled = session.status === 'cancelled';
  const statusColor = getStatusColor(session.status);
  const locationLabel = getLocationLabel(session.location);

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const isFuture = session.date > todayStr && session.status !== 'completed';

  const displayEndTime = session.endTime && session.endTime > session.startTime
    ? session.endTime
    : (() => {
        try {
          const [h, m] = (session.startTime || '17:00').split(':').map(Number);
          const total = (isNaN(h) ? 17 : h) * 60 + (isNaN(m) ? 0 : m) + (session.duration || 60);
          const endH = Math.floor(total / 60) % 24;
          const endM = total % 60;
          return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
        } catch {
          return '18:00';
        }
      })();

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
      style={[
        styles.card,
        isPaid && styles.cardPaid,
        isCancelled && styles.cardCancelled,
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.subjectRow}>
          <View
            style={[
              styles.colorDot,
              { backgroundColor: isPaid ? '#10B981' : subject?.color || Colors.primary },
            ]}
          />
          <Text style={styles.subjectName} numberOfLines={1}>
            {subject?.name || 'Clase'}
          </Text>
        </View>

        <View style={styles.badgesRow}>
          {isCancelled ? (
            <Badge
              text="❌ Cancelada"
              color={Colors.danger}
              backgroundColor="#FEE2E2"
              size="sm"
            />
          ) : isPaid ? (
            <Badge
              text="✓ Pagada"
              color="#047857"
              backgroundColor="#D1FAE5"
              size="sm"
            />
          ) : isFuture ? (
            <Badge
              text="📅 Próxima"
              color="#4F46E5"
              backgroundColor="#EEF2FF"
              size="sm"
            />
          ) : (
            <Badge
              text="⏳ A deber"
              color="#D97706"
              backgroundColor="#FEF3C7"
              size="sm"
            />
          )}
        </View>
      </View>

      {/* Student Name */}
      {showStudentName && student && (
        <View style={styles.studentRow}>
          <Ionicons
            name="person-circle-outline"
            size={16}
            color={isPaid ? '#047857' : Colors.textSecondary}
          />
          <Text style={[styles.studentName, isPaid && styles.studentNamePaid]} numberOfLines={1}>
            {student.firstName} {student.lastName}
          </Text>
        </View>
      )}

      {/* Footer Info */}
      <View style={styles.footer}>
        <View style={styles.metaCol}>
          <View style={styles.metaRow}>
            <Ionicons
              name="calendar-outline"
              size={13}
              color={isPaid ? '#059669' : Colors.textSecondary}
            />
            <Text style={[styles.metaText, isPaid && styles.metaTextPaid]}>
              {formatDate(session.date)}
            </Text>
            <Text style={styles.metaDot}>•</Text>
            <Ionicons
              name="time-outline"
              size={13}
              color={isPaid ? '#059669' : Colors.textSecondary}
            />
            <Text style={[styles.metaText, isPaid && styles.metaTextPaid]}>
              {session.startTime} - {displayEndTime} ({formatDuration(session.duration)})
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

          {isCancelled && (
            <View style={styles.cancelReasonRow}>
              <Ionicons name="alert-circle-outline" size={13} color={Colors.danger} />
              <Text style={styles.cancelReasonText} numberOfLines={1}>
                Motivo: {session.cancelReason || 'Aviso previo / Festivo'}
              </Text>
            </View>
          )}

          {(session.isRescheduled || session.rescheduledFromDate) && !isCancelled && (
            <View style={styles.rescheduledRow}>
              <Ionicons name="swap-horizontal" size={13} color={Colors.primary} />
              <Text style={styles.rescheduledText} numberOfLines={1}>
                Cambiada del {session.rescheduledFromDate}
              </Text>
            </View>
          )}
        </View>

        {/* Price & Quick Payment Action */}
        <View style={styles.rightCol}>
          <Text
            style={[
              styles.priceText,
              isPaid && styles.priceTextPaid,
              isCancelled && styles.priceTextCancelled,
            ]}
          >
            {isCancelled ? '0,00 €' : formatCurrency(session.totalAmount)}
          </Text>

          {!isCancelled && onTogglePaid && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={(e) => {
                e.stopPropagation();
                onTogglePaid();
              }}
              style={[
                styles.payActionButton,
                isPaid ? styles.payActionButtonPaid : styles.payActionButtonPending,
              ]}
            >
              <Ionicons
                name={isPaid ? 'checkmark-circle' : 'cash-outline'}
                size={14}
                color={isPaid ? '#047857' : '#4F46E5'}
              />
              <Text
                style={[
                  styles.payActionText,
                  isPaid ? styles.payActionTextPaid : styles.payActionTextPending,
                ]}
              >
                {isPaid ? 'Pagada' : 'Cobrar'}
              </Text>
            </TouchableOpacity>
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
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    ...Shadows.sm,
  },
  cardPaid: {
    backgroundColor: '#F0FDF4', // Verde suave
    borderColor: '#A7F3D0',
    borderLeftWidth: 5,
    borderLeftColor: '#10B981', // Verde esmeralda vibrante
  },
  cardCancelled: {
    backgroundColor: '#F9FAFB',
    borderColor: Colors.borderLight,
    borderLeftWidth: 4,
    borderLeftColor: Colors.danger,
    opacity: 0.85,
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
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  studentNamePaid: {
    color: '#065F46',
    fontWeight: '700',
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
  metaText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  metaTextPaid: {
    color: '#065F46',
  },
  metaDot: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  metaTextMuted: {
    fontSize: FontSizes.xs,
    color: Colors.textTertiary,
  },
  cancelReasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    alignSelf: 'flex-start',
  },
  cancelReasonText: {
    fontSize: FontSizes.xs,
    color: Colors.danger,
    fontWeight: '500',
  },
  rescheduledRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  rescheduledText: {
    fontSize: FontSizes.xs,
    color: Colors.primary,
    fontWeight: '500',
  },
  rightCol: {
    alignItems: 'flex-end',
    gap: 6,
  },
  priceText: {
    fontSize: FontSizes.md,
    fontWeight: '800',
    color: Colors.text,
  },
  priceTextPaid: {
    color: '#059669', // Verde esmeralda
  },
  priceTextCancelled: {
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  payActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  payActionButtonPaid: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  payActionButtonPending: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  payActionText: {
    fontSize: 11,
    fontWeight: '700',
  },
  payActionTextPaid: {
    color: '#047857',
  },
  payActionTextPending: {
    color: '#4F46E5',
  },
});
