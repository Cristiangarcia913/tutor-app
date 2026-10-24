import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDatabase } from '../../src/hooks/useDatabase';
import {
  Card,
  Badge,
  StatCard,
  SectionHeader,
  EmptyState,
} from '../../src/components/common';
import ClassCard from '../../src/components/classes/ClassCard';
import PaymentCard from '../../src/components/finances/PaymentCard';
import IncomeChart from '../../src/components/finances/IncomeChart';
import ClassReminderAlert from '../../src/components/classes/ClassReminderAlert';
import {
  Colors,
  Spacing,
  FontSizes,
  BorderRadius,
  formatCurrency,
} from '../../src/constants/theme';
import type { ClassSession, Payment, Student, Subject, DashboardStats, AppSettings } from '../../src/types';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const db = useDatabase();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [upcomingClasses, setUpcomingClasses] = useState<ClassSession[]>([]);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [monthlyIncome, setMonthlyIncome] = useState<{ month: string; amount: number }[]>([]);

  const [students, setStudents] = useState<Record<string, Student>>({});
  const [subjects, setSubjects] = useState<Record<string, Subject>>({});

  const loadData = useCallback(async () => {
    try {
      const [
        dashStats,
        settingsData,
        upcoming,
        recent,
        income,
        studentsList,
        subjectsList,
      ] = await Promise.all([
        db.loadDashboardStats(),
        db.loadSettings(),
        db.getUpcomingClasses(5),
        db.getRecentPayments(5),
        db.getMonthlyIncome(6),
        db.loadStudents(),
        db.loadSubjects(),
      ]);

      const studentMap: Record<string, Student> = {};
      studentsList.forEach((s) => {
        studentMap[s.id] = s;
      });
      setStudents(studentMap);

      const subjectMap: Record<string, Subject> = {};
      subjectsList.forEach((sub) => {
        subjectMap[sub.id] = sub;
      });
      setSubjects(subjectMap);

      setStats(dashStats);
      setSettings(settingsData);
      setUpcomingClasses(upcoming);
      setRecentPayments(recent);
      setMonthlyIncome(income);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const teacherName = settings?.teacherName || 'Profesor';

  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>{getGreeting()},</Text>
              <Text style={styles.teacherName}>{teacherName}</Text>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.actionIconButton}
                onPress={() => router.push('/reports')}
              >
                <Ionicons name="bar-chart-outline" size={22} color={Colors.primary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionIconButton}
                onPress={() => router.push('/settings')}
              >
                <Ionicons name="settings-outline" size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 90 }]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
        {/* KPI Grid */}
        <View style={styles.grid}>
          <View style={styles.gridCol}>
            <StatCard
              title="Alumnos Activos"
              value={stats?.activeStudents || 0}
              icon="people-outline"
              color={Colors.primary}
            />
          </View>
          <View style={styles.gridCol}>
            <StatCard
              title="Clases este mes"
              value={stats?.totalClassesThisMonth || 0}
              icon="calendar-outline"
              color={Colors.secondary}
            />
          </View>
        </View>

        <View style={styles.grid}>
          <View style={styles.gridCol}>
            <StatCard
              title="Ingresos del mes"
              value={formatCurrency(stats?.totalIncomeThisMonth || 0)}
              icon="trending-up-outline"
              color={Colors.success}
            />
          </View>
          <View style={styles.gridCol}>
            <StatCard
              title="Por cobrar"
              value={formatCurrency(stats?.pendingPaymentAmount || 0)}
              icon="alert-circle-outline"
              color={
                (stats?.pendingPaymentAmount || 0) > 0
                  ? Colors.warning
                  : Colors.textTertiary
              }
            />
          </View>
        </View>

        {/* Quick Action Shortcuts */}
        <View style={styles.shortcutsRow}>
          <TouchableOpacity
            style={styles.shortcutBtn}
            onPress={() => router.push('/class/new')}
          >
            <View style={[styles.shortcutIcon, { backgroundColor: Colors.primaryBg }]}>
              <Ionicons name="add-circle" size={22} color={Colors.primary} />
            </View>
            <Text style={styles.shortcutText}>Nueva Clase</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shortcutBtn}
            onPress={() => router.push('/payment/new')}
          >
            <View style={[styles.shortcutIcon, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="cash" size={22} color={Colors.success} />
            </View>
            <Text style={styles.shortcutText}>Cobrar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shortcutBtn}
            onPress={() => router.push('/student/new')}
          >
            <View style={[styles.shortcutIcon, { backgroundColor: '#F0F9FF' }]}>
              <Ionicons name="person-add" size={22} color={Colors.secondary} />
            </View>
            <Text style={styles.shortcutText}>Nuevo Alumno</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shortcutBtn}
            onPress={() => router.push('/subject/manage')}
          >
            <View style={[styles.shortcutIcon, { backgroundColor: '#FFFBEB' }]}>
              <Ionicons name="book" size={22} color={Colors.warning} />
            </View>
            <Text style={styles.shortcutText}>Asignaturas</Text>
          </TouchableOpacity>
        </View>

        {/* Alerta Destacada de Próxima Clase (Recordatorio + Ubicación) */}
        {upcomingClasses.length > 0 && (
          <ClassReminderAlert
            session={upcomingClasses[0]}
            student={students[upcomingClasses[0].studentId]}
            subject={subjects[upcomingClasses[0].subjectId]}
            teacherName={teacherName}
          />
        )}

        {/* Upcoming Classes Section */}
        <SectionHeader
          title="Próximas Clases"
          actionLabel="Ver todas"
          onAction={() => router.push('/(tabs)/classes')}
        />

        {upcomingClasses.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title="Sin clases programadas"
            description="No tienes clases programadas para los próximos días."
            actionLabel="Programar Clase"
            onAction={() => router.push('/class/new')}
          />
        ) : (
          upcomingClasses.map((cls) => (
            <ClassCard
              key={cls.id}
              session={cls}
              student={students[cls.studentId]}
              subject={subjects[cls.subjectId]}
              onPress={() => router.push(`/class/${cls.id}`)}
              showStudentName={true}
            />
          ))
        )}

        {/* Recent Payments Section */}
        <SectionHeader
          title="Cobros Recientes"
          actionLabel="Ver todos"
          onAction={() => router.push('/(tabs)/finances')}
        />

        {recentPayments.length === 0 ? (
          <EmptyState
            icon="wallet-outline"
            title="Sin cobros recientes"
            description="Aún no has registrado pagos recibidos."
            actionLabel="Registrar Pago"
            onAction={() => router.push('/payment/new')}
          />
        ) : (
          recentPayments.map((p) => (
            <PaymentCard
              key={p.id}
              payment={p}
              student={students[p.studentId]}
              onPress={() => router.push(`/payment/${p.id}`)}
              showStudentName={true}
            />
          ))
        )}

        {/* Income Chart */}
        <IncomeChart data={monthlyIncome} title="Evolución de Ingresos Mensuales" />
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
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  greeting: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  teacherName: {
    fontSize: FontSizes.xxl,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
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
  shortcutsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginVertical: Spacing.xs,
  },
  shortcutBtn: {
    alignItems: 'center',
    flex: 1,
  },
  shortcutIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  shortcutText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
