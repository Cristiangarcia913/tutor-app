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

  // Overall statistics
  const totalBilled = useMemo(() => {
    return classes.reduce((sum, c) => sum + c.totalAmount, 0);
  }, [classes]);

  const totalCollected = useMemo(() => {
    return payments
      .filter((p) => p.status === 'cobrado')
      .reduce((sum, p) => sum + p.amount, 0);
  }, [payments]);

  const totalHours = useMemo(() => {
    return classes.reduce((sum, c) => sum + c.duration, 0) / 60;
  }, [classes]);

  const avgPerClass = useMemo(() => {
    if (classes.length === 0) return 0;
    return totalBilled / classes.length;
  }, [totalBilled, classes.length]);

  // Subject breakdown
  const subjectStats = useMemo(() => {
    const map: Record<string, { count: number; total: number; name: string; color: string }> = {};

    subjects.forEach((s) => {
      map[s.id] = { count: 0, total: 0, name: s.name, color: s.color };
    });

    classes.forEach((c) => {
      if (map[c.subjectId]) {
        map[c.subjectId].count += 1;
        map[c.subjectId].total += c.totalAmount;
      }
    });

    return Object.values(map).filter((s) => s.count > 0);
  }, [classes, subjects]);

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
              title="Total Clases"
              value={classes.length}
              icon="school-outline"
              color={Colors.primary}
            />
          </View>
        </View>

        <View style={styles.grid}>
          <View style={styles.gridCol}>
            <StatCard
              title="Horas Totales"
              value={`${totalHours.toFixed(1)} h`}
              icon="time-outline"
              color={Colors.secondary}
            />
          </View>
          <View style={styles.gridCol}>
            <StatCard
              title="Media / Clase"
              value={formatCurrency(avgPerClass)}
              icon="trending-up-outline"
              color={Colors.warning}
            />
          </View>
        </View>

        {/* Monthly Income Chart */}
        <IncomeChart data={monthlyIncome} title="Evolución de Ingresos" />

        {/* Subject Breakdown Card */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Distribución por Asignatura</Text>
          {subjectStats.length === 0 ? (
            <Text style={styles.emptyText}>Sin clases registradas aún.</Text>
          ) : (
            subjectStats.map((sub, idx) => (
              <View key={idx} style={styles.subjectRow}>
                <View style={styles.subjectHeader}>
                  <View style={[styles.subjectDot, { backgroundColor: sub.color }]} />
                  <Text style={styles.subjectName}>{sub.name}</Text>
                  <Text style={styles.subjectCount}>
                    {sub.count} {sub.count === 1 ? 'clase' : 'clases'}
                  </Text>
                </View>
                <Text style={styles.subjectTotal}>{formatCurrency(sub.total)}</Text>
              </View>
            ))
          )}
        </Card>

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
  grid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  gridCol: {
    flex: 1,
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
  emptyText: {
    fontSize: FontSizes.sm,
    color: Colors.textTertiary,
    fontStyle: 'italic',
  },
  subjectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  subjectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  subjectDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  subjectName: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.text,
  },
  subjectCount: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  subjectTotal: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.primary,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
