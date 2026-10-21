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
  getPaymentMethodLabel,
  getPaymentStatusColor,
  getPaymentStatusLabel,
} from '../../constants/theme';
import { Payment, Student } from '../../types';
import Badge from '../common/Badge';

interface PaymentCardProps {
  payment: Payment;
  student?: Student;
  onPress: () => void;
  showStudentName?: boolean;
}

export default function PaymentCard({
  payment,
  student,
  onPress,
  showStudentName = true,
}: PaymentCardProps) {
  const statusColor = getPaymentStatusColor(payment.status);
  const statusLabel = getPaymentStatusLabel(payment.status);
  const methodLabel = getPaymentMethodLabel(payment.method);

  const getMethodIcon = (method: string): keyof typeof Ionicons.glyphMap => {
    switch (method) {
      case 'efectivo':
        return 'cash-outline';
      case 'bizum':
        return 'phone-portrait-outline';
      case 'transferencia':
        return 'card-outline';
      case 'paypal':
        return 'logo-paypal';
      default:
        return 'wallet-outline';
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={styles.card}
    >
      <View style={styles.topRow}>
        <View style={styles.conceptCol}>
          <Text style={styles.conceptText} numberOfLines={1}>
            {payment.concept || 'Pago de clases'}
          </Text>
          {showStudentName && student && (
            <Text style={styles.studentText} numberOfLines={1}>
              {student.firstName} {student.lastName}
            </Text>
          )}
        </View>

        <Text style={styles.amountText}>{formatCurrency(payment.amount)}</Text>
      </View>

      <View style={styles.bottomRow}>
        <View style={styles.metaLeft}>
          <View style={styles.methodTag}>
            <Ionicons
              name={getMethodIcon(payment.method)}
              size={12}
              color={Colors.textSecondary}
            />
            <Text style={styles.methodText}>{methodLabel}</Text>
          </View>

          <Text style={styles.dateText}>{formatDate(payment.date)}</Text>
        </View>

        <Badge
          text={statusLabel}
          color={statusColor}
          backgroundColor={`${statusColor}18`}
          size="sm"
        />
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
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  conceptCol: {
    flex: 1,
    marginRight: Spacing.md,
  },
  conceptText: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.text,
  },
  studentText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  amountText: {
    fontSize: FontSizes.lg,
    fontWeight: '800',
    color: Colors.success,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  metaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  methodTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceVariant,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  methodText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  dateText: {
    fontSize: FontSizes.xs,
    color: Colors.textTertiary,
  },
});
