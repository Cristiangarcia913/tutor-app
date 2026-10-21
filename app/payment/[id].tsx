import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDatabase } from '../../src/hooks/useDatabase';
import {
  Card,
  Badge,
  Avatar,
  Button,
  ConfirmDialog,
} from '../../src/components/common';
import {
  Colors,
  Spacing,
  FontSizes,
  BorderRadius,
  formatCurrency,
  formatDate,
  getPaymentMethodLabel,
  getPaymentStatusColor,
  getPaymentStatusLabel,
} from '../../src/constants/theme';
import type { Payment, Student } from '../../src/types';

export default function PaymentDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useDatabase();

  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [student, setStudent] = useState<Student | null>(null);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const paymentData = await db.getPayment(id);
      if (paymentData) {
        setPayment(paymentData);
        const studentData = await db.getStudent(paymentData.studentId);
        setStudent(studentData);
      }
    } catch (err) {
      console.error('Failed to load payment detail:', err);
    } finally {
      setLoading(false);
    }
  }, [db, id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusChange = async (newStatus: Payment['status']) => {
    if (!payment) return;
    try {
      await db.updatePayment(payment.id, { status: newStatus });
      setPayment({ ...payment, status: newStatus });
    } catch (err) {
      console.error('Error updating payment status:', err);
      Alert.alert('Error', 'No se pudo actualizar el estado del pago.');
    }
  };

  const handleDelete = async () => {
    if (!payment) return;
    setDeleting(true);
    try {
      await db.deletePayment(payment.id);
      router.back();
    } catch (err) {
      console.error('Error deleting payment:', err);
      Alert.alert('Error', 'No se pudo eliminar el pago.');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!payment) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>No se encontró el pago.</Text>
        <Button title="Volver" onPress={() => router.back()} style={{ marginTop: Spacing.md }} />
      </View>
    );
  }

  const statusColor = getPaymentStatusColor(payment.status);
  const statusLabel = getPaymentStatusLabel(payment.status);
  const methodLabel = getPaymentMethodLabel(payment.method);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalle del Pago</Text>
        <TouchableOpacity
          onPress={() => setShowDeleteDialog(true)}
          style={styles.headerButton}
        >
          <Ionicons name="trash-outline" size={22} color={Colors.danger} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Amount Hero Card */}
        <Card style={styles.heroCard}>
          <Badge
            text={statusLabel}
            color={statusColor}
            backgroundColor={`${statusColor}18`}
          />
          <Text style={styles.heroAmount}>{formatCurrency(payment.amount)}</Text>
          <Text style={styles.heroConcept}>{payment.concept || 'Pago de clases'}</Text>

          <View style={styles.heroDivider} />

          {/* Student shortcut */}
          {student && (
            <TouchableOpacity
              style={styles.studentRow}
              onPress={() => router.push(`/student/${student.id}`)}
              activeOpacity={0.7}
            >
              <Avatar
                firstName={student.firstName}
                lastName={student.lastName}
                color={student.avatarColor || Colors.primary}
                size={40}
              />
              <View style={styles.studentInfo}>
                <Text style={styles.studentName}>
                  {student.firstName} {student.lastName}
                </Text>
                <Text style={styles.studentMeta}>Ver perfil del alumno</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
            </TouchableOpacity>
          )}
        </Card>

        {/* Details Grid Card */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Información de la Transacción</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Fecha de pago</Text>
            <Text style={styles.detailValue}>{formatDate(payment.date)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Método de pago</Text>
            <View style={styles.methodBadge}>
              <Ionicons name="wallet-outline" size={14} color={Colors.primary} />
              <Text style={styles.methodValue}>{methodLabel}</Text>
            </View>
          </View>

          {payment.receiptNumber ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Nº Comprobante</Text>
              <Text style={styles.detailValue}>{payment.receiptNumber}</Text>
            </View>
          ) : null}
        </Card>

        {/* Notes */}
        {payment.notes ? (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Notas</Text>
            <Text style={styles.notesText}>{payment.notes}</Text>
          </Card>
        ) : null}

        {/* Status Actions */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Acciones</Text>

          <View style={styles.actionsCol}>
            {payment.status !== 'cobrado' && (
              <Button
                title="Marcar como Cobrado"
                variant="primary"
                onPress={() => handleStatusChange('cobrado')}
                icon="checkmark-circle-outline"
              />
            )}

            {payment.status !== 'pendiente' && (
              <Button
                title="Marcar como Pendiente"
                variant="outline"
                onPress={() => handleStatusChange('pendiente')}
                icon="time-outline"
              />
            )}

            {payment.status !== 'cancelado' && (
              <Button
                title="Marcar como Cancelado"
                variant="ghost"
                onPress={() => handleStatusChange('cancelado')}
                icon="close-circle-outline"
              />
            )}
          </View>
        </Card>
      </ScrollView>

      {/* Delete Confirmation */}
      <ConfirmDialog
        visible={showDeleteDialog}
        title="Eliminar Pago"
        message="¿Estás seguro de que deseas eliminar este registro de pago? Esto afectará los balances."
        confirmLabel="Eliminar"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  heroCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  heroAmount: {
    fontSize: 36,
    fontWeight: '900',
    color: Colors.text,
    marginTop: Spacing.md,
  },
  heroConcept: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  heroDivider: {
    width: '100%',
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.lg,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: Spacing.md,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.text,
  },
  studentMeta: {
    fontSize: FontSizes.xs,
    color: Colors.primary,
    marginTop: 2,
  },
  card: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  detailLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  methodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  methodValue: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.primaryDark,
  },
  notesText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  actionsCol: {
    gap: Spacing.sm,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: FontSizes.md,
    color: Colors.danger,
  },
});
