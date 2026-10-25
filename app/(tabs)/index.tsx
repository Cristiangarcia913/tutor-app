import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import {
  Colors,
  Spacing,
  FontSizes,
  BorderRadius,
  formatCurrency,
  formatDate,
} from '../../src/constants/theme';
import type { ClassSession, Student, Subject, DashboardStats, AppSettings } from '../../src/types';

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
  const [nextClassDate, setNextClassDate] = useState<string>('');
  const [nextDayClasses, setNextDayClasses] = useState<ClassSession[]>([]);
  const [isTodayClass, setIsTodayClass] = useState<boolean>(true);

  const [students, setStudents] = useState<Record<string, Student>>({});
  const [subjects, setSubjects] = useState<Record<string, Subject>>({});

  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [
        dashStats,
        settingsData,
        allClasses,
        studentsList,
        subjectsList,
      ] = await Promise.all([
        db.loadDashboardStats(),
        db.loadSettings(),
        db.loadClasses(),
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

      const now = new Date();
      const currentTodayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const activeClasses = allClasses.filter((c) => c.status !== 'cancelled');

      // Buscar clases desde hoy en adelante ordenadas por fecha y hora
      const upcoming = activeClasses
        .filter((c) => c.date >= currentTodayStr)
        .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

      if (upcoming.length > 0) {
        const closestDate = upcoming[0].date;
        const classesOnClosestDay = upcoming.filter((c) => c.date === closestDate);
        setNextClassDate(closestDate);
        setNextDayClasses(classesOnClosestDay);
        setIsTodayClass(closestDate === currentTodayStr);
      } else {
        setNextClassDate('');
        setNextDayClasses([]);
        setIsTodayClass(false);
      }

      setStats(dashStats);
      setSettings(settingsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [db]);

  const nextClassDayLabel = useMemo(() => {
    if (!nextClassDate) return '';
    const [y, m, d] = nextClassDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const dayName = dayNames[dateObj.getDay()];
    const monthName = monthNames[m - 1];
    if (isTodayClass) {
      return `Hoy (${dayName}, ${d} de ${monthName})`;
    }
    return `${dayName}, ${d} de ${monthName}`;
  }, [nextClassDate, isTodayClass]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  const handleTogglePaid = async (cls: ClassSession) => {
    try {
      await db.toggleClassPaid(cls.id);
      await loadData();
    } catch (e) {
      console.error('Error toggling paid in dashboard:', e);
    }
  };

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
        {/* KPI Grid - Tarjetas clickables hacia sus menús */}
        <View style={styles.grid}>
          <View style={styles.gridCol}>
            <StatCard
              title="Alumnos Activos"
              value={stats?.activeStudents || 0}
              icon="people-outline"
              color={Colors.primary}
              onPress={() => router.push('/(tabs)/students')}
            />
          </View>
          <View style={styles.gridCol}>
            <StatCard
              title="Clases este mes"
              value={stats?.totalClassesThisMonth || 0}
              icon="calendar-outline"
              color={Colors.secondary}
              onPress={() => router.push('/(tabs)/classes')}
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
              onPress={() => router.push('/(tabs)/finances')}
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
              onPress={() => router.push('/(tabs)/finances')}
            />
          </View>
        </View>

        {/* Quick Action Shortcuts (Nueva Clase, Cobrar, Nuevo Alumno) */}
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
        </View>

        {/* Futuro Día de Clase Section */}
        <SectionHeader
          title={
            isTodayClass
              ? `Clases de Hoy (${nextDayClasses.length})`
              : nextClassDate
              ? `Futuro Día de Clase: ${nextClassDayLabel} (${nextDayClasses.length})`
              : 'Futuro Día de Clase'
          }
          actionLabel="Ver Calendario"
          onAction={() => router.push('/(tabs)/classes')}
        />

        {nextDayClasses.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title="Sin clases próximas"
            description="No tienes clases programadas para los próximos días. ¡Programa una nueva clase cuando quieras!"
            actionLabel="Programar Clase"
            onAction={() => router.push('/class/new')}
          />
        ) : (
          nextDayClasses.map((cls) => (
            <ClassCard
              key={cls.id}
              session={cls}
              student={students[cls.studentId]}
              subject={subjects[cls.subjectId]}
              onPress={() => router.push(`/class/${cls.id}`)}
              onTogglePaid={() => handleTogglePaid(cls)}
              showStudentName={true}
            />
          ))
        )}
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
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  greeting: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  teacherName: {
    fontSize: FontSizes.xl,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  content: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  gridCol: {
    flex: 1,
    minWidth: 0,
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
    minWidth: 0,
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
