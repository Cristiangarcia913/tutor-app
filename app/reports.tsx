import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDatabase } from '../src/hooks/useDatabase';
import {
  Card,
  StatCard,
  Button,
} from '../src/components/common';
import IncomeChart from '../src/components/finances/IncomeChart';
import {
  Colors,
  Spacing,
  FontSizes,
  BorderRadius,
  formatCurrency,
} from '../src/constants/theme';
import type { ClassSession, Payment, Student, Subject } from '../src/types';

export default function ReportsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const db = useDatabase();

  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [monthlyIncome, setMonthlyIncome] = useState<{ month: string; amount: number }[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [classesData, paymentsData, studentsData, subjectsData, incomeData] =
        await Promise.all([
          db.loadClasses(),
          db.loadPayments(),
          db.loadStudents(),
          db.loadSubjects(),
          db.getMonthlyIncome(6),
        ]);

      setClasses(classesData);
      setPayments(paymentsData);
      setStudents(studentsData);
      setSubjects(subjectsData);
      setMonthlyIncome(incomeData);
    } catch (err) {
      console.error('Error loading reports data:', err);
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  // Overall statistics
  const totalBilled = useMemo(() => {
    return classes
      .filter((c) => c.status !== 'cancelled' && !c.cancelReason)
      .reduce((sum, c) => sum + c.totalAmount, 0);
  }, [classes]);

  const totalCollected = useMemo(() => {
    const paidClassesAmount = classes
      .filter((c) => c.isPaid && c.status !== 'cancelled' && !c.cancelReason)
      .reduce((sum, c) => sum + c.totalAmount, 0);
    const standalonePayments = payments
      .filter((p) => p.status === 'cobrado' && (!p.classSessionIds || p.classSessionIds.length === 0))
      .reduce((sum, p) => sum + p.amount, 0);
    return paidClassesAmount + standalonePayments;
  }, [classes, payments]);

  // Solo se consideran a deber las clases ya dadas
  const totalPending = useMemo(() => {
    return classes
      .filter(
        (c) =>
          !c.isPaid &&
          c.status !== 'cancelled' &&
          !c.cancelReason &&
          (c.date <= todayStr || c.status === 'completed')
      )
      .reduce((sum, c) => sum + c.totalAmount, 0);
  }, [classes, todayStr]);

  const totalHours = useMemo(() => {
    return classes.reduce((sum, c) => sum + c.duration, 0) / 60;
  }, [classes]);

  const handleExport = async () => {
    try {
      const data = await db.exportData();
      await Share.share({
        message: JSON.stringify(data, null, 2),
        title: 'Copia de seguridad TutorApp',
      });
    } catch (e) {
      console.error('Export error:', e);
      Alert.alert('Error', 'No se pudo exportar la información.');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Informes y Resumen</Text>
        <TouchableOpacity onPress={handleExport} style={styles.headerButton}>
          <Ionicons name="share-outline" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* KPI Grid */}
        <View style={styles.grid}>
          <View style={styles.gridCol}>
            <StatCard
              title="Total Cobrado"
              value={formatCurrency(totalCollected)}
              icon="cash-outline"
              color={Colors.success}
            />
          </View>
          <View style={styles.gridCol}>
            <StatCard
              title="Por Cobrar"
              value={formatCurrency(totalPending)}
              icon="alert-circle-outline"
              color={totalPending > 0 ? Colors.warning : Colors.textTertiary}
            />
          </View>
        </View>

        <View style={styles.grid}>
          <View style={styles.gridCol}>
            <StatCard
              title="Total Clases"
              value={classes.length}
              icon="school-outline"
              color={Colors.primary}
            />
          </View>
          <View style={styles.gridCol}>
            <StatCard
              title="Horas Totales"
              value={`${totalHours.toFixed(1)} h`}
              icon="time-outline"
              color={Colors.secondary}
            />
          </View>
        </View>

        {/* Monthly Income Chart */}
        <IncomeChart data={monthlyIncome} title="Evolución de Ingresos" />

        {/* Export Data Button */}
        <Button
          title="Exportar Datos Completos (Copia de Seguridad)"
          variant="outline"
          onPress={handleExport}
          icon="download-outline"
          size="lg"
        />
      </ScrollView>
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
    paddingHorizontal: Spacing.md,
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
    padding: Spacing.md,
    gap: Spacing.md,
  },
  grid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  gridCol: {
    flex: 1,
    minWidth: 0,
  },
  card: {
    padding: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  emptyText: {
    fontSize: FontSizes.sm,
    color: Colors.textTertiary,
    fontStyle: 'italic',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
