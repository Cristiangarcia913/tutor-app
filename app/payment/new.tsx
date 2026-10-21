import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDatabase } from '../../src/hooks/useDatabase';
import {
  Input,
  Button,
  Select,
  DatePicker,
  Card,
} from '../../src/components/common';
import {
  Colors,
  Spacing,
  FontSizes,
  BorderRadius,
  formatCurrency,
} from '../../src/constants/theme';
import type { PaymentFormData, Student } from '../../src/types';

export default function NewPaymentScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ studentId?: string; amount?: string }>();
  const db = useDatabase();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [students, setStudents] = useState<Student[]>([]);
  const [studentBalance, setStudentBalance] = useState<{ charged: number; paid: number; pending: number } | null>(null);

  // Form fields
  const [studentId, setStudentId] = useState(params.studentId || '');
  const [amount, setAmount] = useState(params.amount || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [method, setMethod] = useState<'bizum' | 'efectivo' | 'transferencia' | 'paypal' | 'otro'>('bizum');
  const [status, setStatus] = useState<'cobrado' | 'pendiente' | 'cancelado'>('cobrado');
  const [concept, setConcept] = useState('Pago de clases particulares');
  const [notes, setNotes] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const loadBalance = useCallback(async (sid: string) => {
    if (!sid) {
      setStudentBalance(null);
      return;
    }
    try {
      const bal = await db.getStudentBalance(sid);
      setStudentBalance(bal);
    } catch (e) {
      console.error('Error fetching balance:', e);
    }
  }, [db]);

  useEffect(() => {
    async function loadStudents() {
      try {
        const list = await db.loadStudents(true);
        setStudents(list);

        let initialStudentId = params.studentId;
        if (!initialStudentId && list.length > 0) {
          initialStudentId = list[0].id;
        }

        if (initialStudentId) {
          setStudentId(initialStudentId);
          loadBalance(initialStudentId);
        }
      } catch (err) {
        console.error('Failed to load students:', err);
      } finally {
        setLoading(false);
      }
    }

    loadStudents();
  }, [db, params.studentId, loadBalance]);

  const handleStudentSelect = (id: string) => {
    setStudentId(id);
    setErrors((prev) => ({ ...prev, studentId: '' }));
    loadBalance(id);
  };

  const handleSubmit = async () => {
    const errs: Record<string, string> = {};
    if (!studentId) errs.studentId = 'Selecciona un alumno';
    if (!amount || parseFloat(amount) <= 0) errs.amount = 'Introduce un importe válido';
    if (!date) errs.date = 'Indica la fecha';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const data: PaymentFormData = {
        studentId,
        amount: parseFloat(amount),
        date,
        method,
        status,
        concept,
        notes,
        classSessionIds: [],
      };

      await db.createPayment(data);
      router.back();
    } catch (error) {
      console.error('Error recording payment:', error);
      Alert.alert('Error', 'No se pudo guardar el pago.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const studentOptions = students.map((s) => ({
    label: `${s.firstName} ${s.lastName}`,
    value: s.id,
  }));

  const methodOptions = [
    { label: 'Bizum', value: 'bizum' },
    { label: 'Efectivo', value: 'efectivo' },
    { label: 'Transferencia Bancaria', value: 'transferencia' },
    { label: 'PayPal', value: 'paypal' },
    { label: 'Otro', value: 'otro' },
  ];

  const statusOptions = [
    { label: 'Cobrado (Recibido)', value: 'cobrado' },
    { label: 'Pendiente de cobro', value: 'pendiente' },
  ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nuevo Pago</Text>
        <TouchableOpacity onPress={handleSubmit} disabled={saving} style={styles.saveButton}>
          {saving ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Text style={styles.saveButtonText}>Guardar</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.formContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Alumno Selector */}
        <Select
          label="Alumno *"
          value={studentId}
          options={studentOptions}
          onSelect={handleStudentSelect}
          placeholder="Seleccionar alumno..."
          error={errors.studentId}
        />

        {/* Student Balance Card */}
        {studentBalance && (
          <Card style={styles.balanceInfoCard}>
            <View style={styles.balanceInfoRow}>
              <View>
                <Text style={styles.balanceInfoLabel}>Saldo Pendiente Actual</Text>
                <Text
                  style={[
                    styles.balanceInfoAmount,
                    {
                      color:
                        studentBalance.pending > 0
                          ? Colors.warning
                          : Colors.success,
                    },
                  ]}
                >
                  {formatCurrency(studentBalance.pending)}
                </Text>
              </View>

              {studentBalance.pending > 0 && (
                <TouchableOpacity
                  style={styles.fillPendingButton}
                  onPress={() => setAmount(studentBalance.pending.toString())}
                >
                  <Text style={styles.fillPendingText}>Usar pendiente</Text>
                </TouchableOpacity>
              )}
            </View>
          </Card>
        )}

        {/* Importe */}
        <Input
          label="Importe (€) *"
          value={amount}
          onChangeText={(val) => {
            setAmount(val);
            setErrors((prev) => ({ ...prev, amount: '' }));
          }}
          keyboardType="decimal-pad"
          placeholder="0.00"
          error={errors.amount}
        />

        {/* Fecha */}
        <DatePicker
          label="Fecha de Pago *"
          value={date}
          onChange={(val) => {
            setDate(val);
            setErrors((prev) => ({ ...prev, date: '' }));
          }}
          error={errors.date}
        />

        {/* Método de Pago */}
        <Select
          label="Método de Pago"
          value={method}
          options={methodOptions}
          onSelect={(val) => setMethod(val as any)}
        />

        {/* Estado del Pago */}
        <Select
          label="Estado"
          value={status}
          options={statusOptions}
          onSelect={(val) => setStatus(val as any)}
        />

        {/* Concepto */}
        <Input
          label="Concepto"
          value={concept}
          onChangeText={setConcept}
          placeholder="Ej: Mensualidad clases de matemáticas"
        />

        {/* Notas adicionales */}
        <Input
          label="Notas"
          value={notes}
          onChangeText={setNotes}
          placeholder="Número de comprobante, observaciones..."
          multiline
        />

        <View style={styles.submitContainer}>
          <Button
            title="Registrar Pago"
            onPress={handleSubmit}
            loading={saving}
            size="lg"
            fullWidth
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  saveButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  saveButtonText: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.primary,
  },
  formContent: {
    padding: Spacing.lg,
  },
  balanceInfoCard: {
    backgroundColor: Colors.surfaceVariant,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  balanceInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceInfoLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  balanceInfoAmount: {
    fontSize: FontSizes.lg,
    fontWeight: '800',
  },
  fillPendingButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  fillPendingText: {
    fontSize: FontSizes.xs,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  submitContainer: {
    marginTop: Spacing.lg,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
