import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDatabase } from '../../hooks/useDatabase';
import { useAuthRole } from '../../hooks/useAuthRole';
import { Card, Badge, Button } from '../common';
import {
  Colors,
  Spacing,
  FontSizes,
  BorderRadius,
  formatCurrency,
  formatDate,
  formatTime,
  getPaymentMethodLabel,
} from '../../constants/theme';
import type { ClassSession, Payment, Subject, AppSettings } from '../../types';

export default function ParentPortalView() {
  const db = useDatabase();
  const { activeStudent } = useAuthRole();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [subjects, setSubjects] = useState<Record<string, Subject>>({});
  const [settings, setSettings] = useState<AppSettings | null>(null);

  const [balance, setBalance] = useState<{ charged: number; paid: number; pending: number }>({
    charged: 0,
    paid: 0,
    pending: 0,
  });

  const loadParentData = useCallback(async () => {
    if (!activeStudent?.id) {
      setLoading(false);
      return;
    }
    try {
      const [classList, paymentList, subjectList, balData, sets] = await Promise.all([
        db.getClassesByStudent(activeStudent.id),
        db.getPaymentsByStudent(activeStudent.id),
        db.loadSubjects(),
        db.getStudentBalance(activeStudent.id),
        db.loadSettings(),
      ]);

      const subMap: Record<string, Subject> = {};
      subjectList.forEach((s) => {
        subMap[s.id] = s;
      });
      setSubjects(subMap);
      setClasses(classList);
      setPayments(paymentList);
      setBalance(balData);
      setSettings(sets);
    } catch (e) {
      console.error('Error loading parent portal data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeStudent?.id, db]);

  useEffect(() => {
    loadParentData();
  }, [loadParentData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadParentData();
  };

  const handleBizumPrompt = () => {
    const teacherPhone = settings?.phone || '+34 600 000 000';
    const teacherName = settings?.teacherName || 'tu profesor';
    Alert.alert(
      'Pago por Bizum',
      `Puedes realizar el Bizum de ${formatCurrency(balance.pending)} al teléfono:\n\n📱 ${teacherPhone}\n(${teacherName})\n\nConcepto: Clases ${activeStudent?.firstName}`,
      [{ text: 'Entendido' }]
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!activeStudent) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyTitle}>No hay alumno seleccionado</Text>
      </View>
    );
  }

  const upcomingClasses = classes
    .filter((c) => c.status === 'scheduled')
    .sort((a, b) => a.date.localeCompare(b.date));

  const classesWithHomework = classes.filter((c) => c.homework && c.homework.trim().length > 0);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header Familiar */}
      <View style={styles.welcomeCard}>
        <View style={styles.avatarCircle}>
          <Ionicons name="people" size={24} color="#FFFFFF" />
        </View>
        <View style={styles.welcomeInfo}>
          <Text style={styles.welcomeGreeting}>Portal de Familias</Text>
          <Text style={styles.welcomeCourse}>
            Seguimiento de {activeStudent.firstName} {activeStudent.lastName}
            {activeStudent.course ? ` • ${activeStudent.course}` : ''}
          </Text>
        </View>
      </View>

      {/* Saldo y Pagos */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="wallet-outline" size={20} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Estado de Pagos</Text>
        </View>

        <Card style={styles.balanceCard}>
          <View style={styles.balanceRow}>
            <View>
              <Text style={styles.balanceLabel}>Saldo Pendiente de Pago</Text>
              <Text
                style={[
                  styles.balanceAmount,
                  { color: balance.pending > 0 ? Colors.warning : Colors.success },
                ]}
              >
                {formatCurrency(balance.pending)}
              </Text>
            </View>

            {balance.pending > 0 && (
              <TouchableOpacity
                style={styles.payBizumBtn}
                activeOpacity={0.8}
                onPress={handleBizumPrompt}
              >
                <Ionicons name="phone-portrait-outline" size={16} color="#FFFFFF" />
                <Text style={styles.payBizumBtnText}>Pagar con Bizum</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.divider} />

          <View style={styles.subStatsRow}>
            <View style={styles.subStat}>
              <Text style={styles.subStatLabel}>Total Clases</Text>
              <Text style={styles.subStatValue}>{classes.length}</Text>
            </View>
            <View style={styles.subStat}>
              <Text style={styles.subStatLabel}>Total Abonado</Text>
              <Text style={[styles.subStatValue, { color: Colors.success }]}>
                {formatCurrency(balance.paid)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Últimos pagos */}
        {payments.length > 0 && (
          <View style={styles.recentPaymentsBox}>
            <Text style={styles.recentPaymentsTitle}>Historial de pagos recibidos:</Text>
            {payments.slice(0, 3).map((p) => (
              <View key={p.id} style={styles.paymentRow}>
                <View style={styles.paymentMethodBadge}>
                  <Ionicons
                    name={p.method === 'bizum' ? 'phone-portrait-outline' : 'cash-outline'}
                    size={14}
                    color={Colors.primary}
                  />
                  <Text style={styles.paymentMethodText}>{getPaymentMethodLabel(p.method)}</Text>
                </View>
                <Text style={styles.paymentDate}>{formatDate(p.date)}</Text>
                <Text style={styles.paymentAmount}>{formatCurrency(p.amount)}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Tareas y Deberes mandados para casa */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="book-outline" size={20} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Deberes Asignados para Casa</Text>
        </View>

        {classesWithHomework.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="checkmark-done-circle-outline" size={28} color={Colors.success} />
            <Text style={styles.emptyCardTitle}>Sin tareas pendientes</Text>
            <Text style={styles.emptyCardSub}>El alumno no tiene tareas pendientes mandadas.</Text>
          </Card>
        ) : (
          classesWithHomework.map((cls) => {
            const subject = subjects[cls.subjectId];
            return (
              <Card key={cls.id} style={styles.taskCard}>
                <View style={styles.taskHeader}>
                  <Text style={styles.taskSubject}>{subject?.name || 'Clase particular'}</Text>
                  <Text style={styles.taskDate}>Para el {formatDate(cls.date)}</Text>
                </View>
                <Text style={styles.taskHomeworkText}>{cls.homework}</Text>
              </Card>
            );
          })
        )}
      </View>

      {/* Clases Programadas */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Próximas Clases</Text>
        </View>

        {upcomingClasses.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="calendar" size={28} color={Colors.textTertiary} />
            <Text style={styles.emptyCardTitle}>No hay clases programadas</Text>
            <Text style={styles.emptyCardSub}>El profesor no tiene próximas sesiones fijadas.</Text>
          </Card>
        ) : (
          upcomingClasses.map((cls) => {
            const subject = subjects[cls.subjectId];
            return (
              <Card key={cls.id} style={styles.classCard}>
                <View style={styles.classHeader}>
                  <View style={styles.classTitleInfo}>
                    <Text style={styles.classSubject}>{subject?.name || 'Clase Particular'}</Text>
                    <Text style={styles.classDate}>
                      {formatDate(cls.date)} • {formatTime(cls.startTime)} - {formatTime(cls.endTime)}
                    </Text>
                  </View>
                  <Badge text={formatCurrency(cls.totalAmount)} color={Colors.primary} backgroundColor={Colors.primaryBg} size="sm" />
                </View>

                {cls.notes ? (
                  <View style={styles.classNotesBox}>
                    <Text style={styles.classNotesText}>{cls.notes}</Text>
                  </View>
                ) : null}
              </Card>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 60,
    gap: Spacing.lg,
  },
  welcomeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E11D48', // Rose
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    gap: Spacing.md,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeInfo: {
    flex: 1,
  },
  welcomeGreeting: {
    fontSize: FontSizes.lg,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  welcomeCourse: {
    fontSize: FontSizes.xs,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
    fontWeight: '500',
  },
  section: {
    gap: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: FontSizes.md,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  balanceCard: {
    padding: Spacing.lg,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  balanceAmount: {
    fontSize: FontSizes.xxl,
    fontWeight: '900',
  },
  payBizumBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  payBizumBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: FontSizes.xs,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.md,
  },
  subStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  subStat: {
    alignItems: 'center',
  },
  subStatLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  subStatValue: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  recentPaymentsBox: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  recentPaymentsTitle: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  paymentMethodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  paymentMethodText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  paymentDate: {
    fontSize: FontSizes.xs,
    color: Colors.textTertiary,
  },
  paymentAmount: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.success,
  },
  taskCard: {
    padding: Spacing.md,
    marginBottom: Spacing.xs,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  taskSubject: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.primary,
  },
  taskDate: {
    fontSize: 10,
    color: Colors.textTertiary,
  },
  taskHomeworkText: {
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
    lineHeight: 20,
    fontWeight: '500',
  },
  classCard: {
    padding: Spacing.md,
    marginBottom: Spacing.xs,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  classTitleInfo: {
    flex: 1,
  },
  classSubject: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  classDate: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  classNotesBox: {
    backgroundColor: Colors.surfaceVariant,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
  },
  classNotesText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.xs,
  },
  emptyCardTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 4,
  },
  emptyCardSub: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emptyTitle: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
});
