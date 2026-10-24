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
import type { PaymentFormData, Student, ClassSession } from '../../src/types';

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
  const [method, setMethod] = useState<'bizum' | 'efectivo'>('bizum');
  const [status, setStatus] = useState<'cobrado' | 'pendiente'>('cobrado');
  const [concept, setConcept] = useState('Clases particulares');
  const [notes, setNotes] = useState('');

  const [unpaidClasses, setUnpaidClasses] = useState<ClassSession[]>([]);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const loadBalanceAndClasses = useCallback(async (sid: string) => {
    if (!sid) {
      setStudentBalance(null);
      setUnpaidClasses([]);
      setSelectedClassIds([]);
      return;
    }
    try {
      const [bal, studentClasses] = await Promise.all([
        db.getStudentBalance(sid),
        db.getClassesByStudent(sid),
      ]);
      setStudentBalance(bal);

      const unpaid = studentClasses.filter((c) => !c.isPaid && c.status !== 'cancelled');
      setUnpaidClasses(unpaid);

      if (params.amount === undefined || params.amount === null || params.amount === '') {
        const ids = unpaid.map((c) => c.id);
        setSelectedClassIds(ids);
        const total = unpaid.reduce((sum, c) => sum + c.totalAmount, 0);
        if (total > 0) {
          setAmount(String(total));
        }
      } else {
        const targetAmount = parseFloat(String(params.amount));
        let accumulated = 0;
        const matched: string[] = [];
        for (const c of unpaid) {
          if (accumulated + c.totalAmount <= targetAmount + 0.01) {
            matched.push(c.id);
            accumulated += c.totalAmount;
          }
        }
        setSelectedClassIds(matched.length > 0 ? matched : unpaid.map((c) => c.id));
      }
    } catch (e) {
      console.error('Error fetching balance and classes:', e);
    }
  }, [db, params.amount]);

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
          loadBalanceAndClasses(initialStudentId);
        }
      } catch (err) {
        console.error('Failed to load students:', err);
      } finally {
        setLoading(false);
      }
    }

    loadStudents();
  }, [db, params.studentId, loadBalanceAndClasses]);

  useEffect(() => {
    if (params.amount !== undefined && params.amount !== null && params.amount !== '') {
      setAmount(String(params.amount));
    }
  }, [params.amount]);

  useEffect(() => {
    if (params.studentId) {
      setStudentId(params.studentId);
      loadBalanceAndClasses(params.studentId);
    }
  }, [params.studentId, loadBalanceAndClasses]);

  const handleStudentSelect = (id: string) => {
    setStudentId(id);
    setErrors((prev) => ({ ...prev, studentId: '' }));
    loadBalanceAndClasses(id);
  };

  const toggleClassSelection = (classId: string) => {
    setSelectedClassIds((prev) => {
      const next = prev.includes(classId)
        ? prev.filter((id) => id !== classId)
        : [...prev, classId];
      const newTotal = unpaidClasses
        .filter((c) => next.includes(c.id))
        .reduce((sum, c) => sum + c.totalAmount, 0);
      setAmount(newTotal > 0 ? String(newTotal) : '');
      return next;
    });
  };

  const selectAllClasses = () => {
    const ids = unpaidClasses.map((c) => c.id);
    setSelectedClassIds(ids);
    const total = unpaidClasses.reduce((sum, c) => sum + c.totalAmount, 0);
    setAmount(total > 0 ? String(total) : '');
  };

  const handleSubmit = async () => {
    const errs: Record<string, string> = {};
    if (!studentId) errs.studentId = 'Selecciona un alumno';

    const cleanAmountStr = amount.trim().replace(',', '.');
    const parsedAmount = parseFloat(cleanAmountStr);
    if (!cleanAmountStr || isNaN(parsedAmount) || parsedAmount <= 0) {
      errs.amount = 'Introduce un importe válido mayor que 0';
    }
    if (!date) errs.date = 'Indica la fecha';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const data: PaymentFormData = {
        studentId,
        amount: parsedAmount,
        date,
        method,
        status,
        concept: concept.trim() || 'Pago de clases particulares',
        notes: notes.trim(),
        classSessionIds: selectedClassIds,
      };

      await db.createPayment(data);
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/finances');
      }
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
        <TouchableOpacity
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/finances'))}
          style={styles.closeButton}
        >
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

        {/* Clases Pendientes a Vincular */}
        {unpaidClasses.length > 0 && (
          <View style={styles.pendingClassesSection}>
            <View style={styles.pendingClassesHeader}>
              <Text style={styles.pendingClassesTitle}>
                Clases a marcar como pagadas ({selectedClassIds.length}/{unpaidClasses.length}):
              </Text>
              <TouchableOpacity onPress={selectAllClasses} activeOpacity={0.7}>
                <Text style={styles.selectAllText}>Marcar todas</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.pendingClassesList}>
              {unpaidClasses.map((c) => {
                const isSelected = selectedClassIds.includes(c.id);
                return (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => toggleClassSelection(c.id)}
                    style={[
                      styles.pendingClassItem,
                      isSelected && styles.pendingClassItemSelected,
                    ]}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={isSelected ? 'checkbox' : 'square-outline'}
                      size={20}
                      color={isSelected ? Colors.success : Colors.textTertiary}
                    />
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={[styles.pendingClassDate, isSelected && styles.pendingClassDateSelected]}>
                        {c.date} • {c.startTime} ({c.duration} min)
                      </Text>
                    </View>
                    <Text style={[styles.pendingClassPrice, isSelected && styles.pendingClassPriceSelected]}>
                      {formatCurrency(c.totalAmount)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
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

        {/* Método de Pago - 1 toque: Bizum o Efectivo */}
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Método de Pago</Text>
          <View style={styles.methodSelector}>
            <TouchableOpacity
              style={[
                styles.methodOption,
                method === 'bizum' && styles.methodOptionActive,
              ]}
              onPress={() => setMethod('bizum')}
              activeOpacity={0.7}
            >
              <Ionicons
                name="phone-portrait-outline"
                size={18}
                color={method === 'bizum' ? Colors.primary : Colors.textSecondary}
              />
              <Text
                style={[
                  styles.methodOptionText,
                  method === 'bizum' && styles.methodOptionTextActive,
                ]}
              >
                Bizum
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.methodOption,
                method === 'efectivo' && styles.methodOptionActive,
              ]}
              onPress={() => setMethod('efectivo')}
              activeOpacity={0.7}
            >
              <Ionicons
                name="cash-outline"
                size={18}
                color={method === 'efectivo' ? Colors.success : Colors.textSecondary}
              />
              <Text
                style={[
                  styles.methodOptionText,
                  method === 'efectivo' && styles.methodOptionTextActive,
                ]}
              >
                Efectivo
              </Text>
            </TouchableOpacity>
          </View>
        </View>

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

        {/* Concepto (opcional) */}
        <Input
          label="Concepto"
          value={concept}
          onChangeText={setConcept}
          placeholder="Ej: Clases de matemáticas"
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
  fieldBlock: {
    marginBottom: Spacing.lg,
  },
  fieldLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  methodSelector: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  methodOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  methodOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryBg,
  },
  methodOptionText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  methodOptionTextActive: {
    color: Colors.primaryDark,
    fontWeight: '700',
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
  pendingClassesSection: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  pendingClassesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  pendingClassesTitle: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.text,
  },
  selectAllText: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.primary,
  },
  pendingClassesList: {
    gap: 6,
  },
  pendingClassItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.sm,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pendingClassItemSelected: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  pendingClassDate: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  pendingClassDateSelected: {
    color: '#15803D',
    fontWeight: '700',
  },
  pendingClassPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
  },
  pendingClassPriceSelected: {
    color: '#15803D',
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
