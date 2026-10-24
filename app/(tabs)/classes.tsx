import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
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
  SearchBar,
  FloatingActionButton,
  FilterChip,
  EmptyState,
} from '../../src/components/common';
import ClassCard from '../../src/components/classes/ClassCard';
import {
  Colors,
  Spacing,
  FontSizes,
  BorderRadius,
  Shadows,
  formatCurrency,
} from '../../src/constants/theme';
import type { ClassSession, Student, Subject } from '../../src/types';

type PaymentFilterType = 'all' | 'paid' | 'pending' | 'cancelled';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function ClassesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const db = useDatabase();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [students, setStudents] = useState<Record<string, Student>>({});
  const [subjects, setSubjects] = useState<Record<string, Subject>>({});

  // Monthly navigation state
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilterType>('all');

  const selectedYear = selectedDate.getFullYear();
  const selectedMonth = selectedDate.getMonth(); // 0-indexed
  const selectedMonthStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
  const selectedMonthLabel = `${MONTH_NAMES[selectedMonth]} ${selectedYear}`;

  const loadData = useCallback(async () => {
    try {
      const [classesData, studentsData, subjectsData] = await Promise.all([
        db.loadClasses(),
        db.loadStudents(),
        db.loadSubjects(),
      ]);

      const studentMap: Record<string, Student> = {};
      studentsData.forEach((s) => {
        studentMap[s.id] = s;
      });
      setStudents(studentMap);

      const subjectMap: Record<string, Subject> = {};
      subjectsData.forEach((sub) => {
        subjectMap[sub.id] = sub;
      });
      setSubjects(subjectMap);

      setClasses(classesData);
    } catch (error) {
      console.error('Error loading classes:', error);
    } finally {
      setLoading(false);
    }
  }, [db]);

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

  const handlePrevMonth = () => {
    setSelectedDate(new Date(selectedYear, selectedMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setSelectedDate(new Date(selectedYear, selectedMonth + 1, 1));
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  // Toggle paid status for a session
  const handleTogglePaid = async (session: ClassSession) => {
    try {
      await db.toggleClassPaid(session.id);
      await loadData();
    } catch (e) {
      console.error('Error toggling paid state:', e);
    }
  };

  // Classes of the selected month
  const monthClasses = useMemo(() => {
    return classes.filter((c) => c.date.startsWith(selectedMonthStr));
  }, [classes, selectedMonthStr]);

  // Monthly stats calculations
  const monthStats = useMemo(() => {
    let totalClasses = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let paidAmount = 0;
    let pendingAmount = 0;
    let totalAmount = 0;

    monthClasses.forEach((c) => {
      if (c.status === 'cancelled') return;
      totalClasses++;
      totalAmount += c.totalAmount;
      if (c.isPaid) {
        paidCount++;
        paidAmount += c.totalAmount;
      } else {
        pendingCount++;
        pendingAmount += c.totalAmount;
      }
    });

    return {
      totalClasses,
      paidCount,
      pendingCount,
      paidAmount,
      pendingAmount,
      totalAmount,
    };
  }, [monthClasses]);

  // Filtered classes according to payment filter and search query
  const filteredClasses = useMemo(() => {
    return monthClasses.filter((item) => {
      // Payment & status filter
      if (paymentFilter === 'paid' && (!item.isPaid || item.status === 'cancelled')) {
        return false;
      }
      if (paymentFilter === 'pending' && (item.isPaid || item.status === 'cancelled')) {
        return false;
      }
      if (paymentFilter === 'cancelled' && item.status !== 'cancelled') {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const student = students[item.studentId];
        const studentName = student
          ? `${student.firstName} ${student.lastName}`.toLowerCase()
          : '';
        const subject = subjects[item.subjectId];
        const subjectName = subject ? subject.name.toLowerCase() : '';
        return studentName.includes(q) || subjectName.includes(q);
      }

      return true;
    }).sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
  }, [monthClasses, paymentFilter, searchQuery, students, subjects]);

  const filterOptions: { key: PaymentFilterType; label: string; count?: number; color?: string }[] = [
    { key: 'all', label: 'Todas', count: monthClasses.length },
    { key: 'paid', label: '✓ Pagadas (Verdes)', count: monthStats.paidCount, color: '#059669' },
    { key: 'pending', label: '⏳ Pendientes', count: monthStats.pendingCount, color: '#D97706' },
    { key: 'cancelled', label: '❌ Canceladas', count: monthClasses.filter((c) => c.status === 'cancelled').length, color: Colors.danger },
  ];

  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Month Navigator Header */}
      <View style={styles.header}>
        <View style={styles.monthSelectorRow}>
          <TouchableOpacity
            style={styles.navArrowButton}
            onPress={handlePrevMonth}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={20} color={Colors.text} />
          </TouchableOpacity>

          <View style={styles.monthTitleContainer}>
            <Text style={styles.monthTitle}>{selectedMonthLabel}</Text>
            <Text style={styles.monthSubtitle}>
              {monthClasses.length} {monthClasses.length === 1 ? 'clase en el mes' : 'clases en el mes'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.navArrowButton}
            onPress={handleNextMonth}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-forward" size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {/* Quick 'Hoy' jump button if not current month */}
        {selectedMonthStr !== `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}` && (
          <TouchableOpacity style={styles.todayButton} onPress={handleToday}>
            <Text style={styles.todayButtonText}>Ir a Mes Actual</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Aesthetic Monthly Financial Bar */}
      <View style={styles.statsSummaryCard}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Total Facturado</Text>
          <Text style={styles.statValueTotal}>{formatCurrency(monthStats.totalAmount)}</Text>
          <Text style={styles.statSubText}>{monthStats.totalClasses} clases</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statBox}>
          <View style={styles.statLabelRow}>
            <View style={[styles.miniDot, { backgroundColor: '#10B981' }]} />
            <Text style={[styles.statLabel, { color: '#047857' }]}>Pagadas</Text>
          </View>
          <Text style={styles.statValuePaid}>{formatCurrency(monthStats.paidAmount)}</Text>
          <Text style={styles.statSubTextPaid}>{monthStats.paidCount} pagadas</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statBox}>
          <View style={styles.statLabelRow}>
            <View style={[styles.miniDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={[styles.statLabel, { color: '#B45309' }]}>Pendientes</Text>
          </View>
          <Text style={styles.statValuePending}>{formatCurrency(monthStats.pendingAmount)}</Text>
          <Text style={styles.statSubTextPending}>{monthStats.pendingCount} por cobrar</Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar alumno o materia..."
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabsContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filterOptions}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.filterTabsList}
          renderItem={({ item }) => {
            const isSelected = paymentFilter === item.key;
            return (
              <TouchableOpacity
                onPress={() => setPaymentFilter(item.key)}
                style={[
                  styles.filterTab,
                  isSelected && styles.filterTabSelected,
                  isSelected && item.color ? { borderColor: item.color, backgroundColor: `${item.color}15` } : null,
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    isSelected && styles.filterTabTextSelected,
                    isSelected && item.color ? { color: item.color } : null,
                  ]}
                >
                  {item.label} ({item.count ?? 0})
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Classes List */}
      <FlatList
        data={filteredClasses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <ClassCard
            session={item}
            student={students[item.studentId]}
            subject={subjects[item.subjectId]}
            onPress={() => router.push(`/class/${item.id}`)}
            onTogglePaid={() => handleTogglePaid(item)}
            showStudentName={true}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="calendar-outline"
            title="Sin clases este mes"
            description={
              searchQuery
                ? 'No se encontraron clases que coincidan con la búsqueda.'
                : `No tienes clases registradas para ${selectedMonthLabel}.`
            }
            actionLabel="Programar Nueva Clase"
            onAction={() => router.push('/class/new')}
          />
        }
      />

      {/* Floating Action Button */}
      <FloatingActionButton
        icon="add"
        onPress={() => router.push('/class/new')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  monthSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  navArrowButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitleContainer: {
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '800',
    color: Colors.text,
  },
  monthSubtitle: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  todayButton: {
    alignSelf: 'center',
    marginTop: 6,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryBg,
  },
  todayButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  statsSummaryCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    justifyContent: 'space-around',
    alignItems: 'center',
    ...Shadows.sm,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  miniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  statValueTotal: {
    fontSize: FontSizes.md,
    fontWeight: '800',
    color: Colors.text,
  },
  statValuePaid: {
    fontSize: FontSizes.md,
    fontWeight: '800',
    color: '#059669', // Verde
  },
  statValuePending: {
    fontSize: FontSizes.md,
    fontWeight: '800',
    color: '#D97706', // Ámbar
  },
  statSubText: {
    fontSize: 10,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  statSubTextPaid: {
    fontSize: 10,
    color: '#047857',
    fontWeight: '600',
    marginTop: 2,
  },
  statSubTextPending: {
    fontSize: 10,
    color: '#B45309',
    fontWeight: '600',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 34,
    backgroundColor: Colors.borderLight,
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  filterTabsContainer: {
    paddingVertical: Spacing.xs,
  },
  filterTabsList: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xs,
  },
  filterTab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterTabSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterTabText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterTabTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingBottom: 90,
  },
});
