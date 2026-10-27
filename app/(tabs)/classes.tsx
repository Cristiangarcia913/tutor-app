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
import { FloatingActionButton, EmptyState } from '../../src/components/common';
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
type ViewModeType = 'calendar' | 'list';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const WEEK_DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const WEEK_COL_HEADERS = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

interface DayGridItem {
  dayNum: number;
  dateStr: string;
  classes: ClassSession[];
  allPaid: boolean;
}

export default function ClassesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const db = useDatabase();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [students, setStudents] = useState<Record<string, Student>>({});
  const [subjects, setSubjects] = useState<Record<string, Subject>>({});

  // View state
  const [viewMode, setViewMode] = useState<ViewModeType>('calendar');
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilterType>('all');

  // Format today's date string YYYY-MM-DD
  const todayObj = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => {
    const y = todayObj.getFullYear();
    const m = String(todayObj.getMonth() + 1).padStart(2, '0');
    const d = String(todayObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [todayObj]);

  const [selectedDay, setSelectedDay] = useState<string>(() => todayStr);

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
    const newDate = new Date(selectedYear, selectedMonth - 1, 1);
    setSelectedDate(newDate);
    const mStr = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`;
    if (todayStr.startsWith(mStr)) {
      setSelectedDay(todayStr);
    } else {
      setSelectedDay(`${mStr}-01`);
    }
  };

  const handleNextMonth = () => {
    const newDate = new Date(selectedYear, selectedMonth + 1, 1);
    setSelectedDate(newDate);
    const mStr = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`;
    if (todayStr.startsWith(mStr)) {
      setSelectedDay(todayStr);
    } else {
      setSelectedDay(`${mStr}-01`);
    }
  };

  const handleToday = () => {
    const now = new Date();
    setSelectedDate(now);
    setSelectedDay(todayStr);
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

  // Calendar Weeks calculation for square grid (Monday-first)
  const calendarWeeks = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const firstDayDate = new Date(selectedYear, selectedMonth, 1);
    // 0 = Sunday, 1 = Monday. Shift so Monday = 0, Sunday = 6
    const startCol = (firstDayDate.getDay() + 6) % 7;

    const weeks: (DayGridItem | null)[][] = [];
    let currentWeek: (DayGridItem | null)[] = [];

    // Leading padding for previous month days
    for (let i = 0; i < startCol; i++) {
      currentWeek.push(null);
    }

    // Days in current month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      let dayClasses = monthClasses.filter((c) => c.date === dateStr);

      if (paymentFilter === 'paid') {
        dayClasses = dayClasses.filter((c) => c.isPaid && c.status !== 'cancelled');
      } else if (paymentFilter === 'pending') {
        dayClasses = dayClasses.filter((c) => !c.isPaid && c.status !== 'cancelled');
      } else if (paymentFilter === 'cancelled') {
        dayClasses = dayClasses.filter((c) => c.status === 'cancelled');
      }

      // Sort classes by time
      dayClasses.sort((a, b) => a.startTime.localeCompare(b.startTime));

      const activeClasses = dayClasses.filter((c) => c.status !== 'cancelled');
      const allPaid = activeClasses.length > 0 && activeClasses.every((c) => c.isPaid);

      currentWeek.push({
        dayNum: day,
        dateStr,
        classes: dayClasses,
        allPaid,
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    // Trailing padding to finish last week
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }

    return weeks;
  }, [selectedYear, selectedMonth, monthClasses, paymentFilter]);

  // Classes for the currently selected day
  const selectedDayClasses = useMemo(() => {
    let list = monthClasses.filter((c) => c.date === selectedDay);
    if (paymentFilter === 'paid') {
      list = list.filter((c) => c.isPaid && c.status !== 'cancelled');
    } else if (paymentFilter === 'pending') {
      list = list.filter((c) => !c.isPaid && c.status !== 'cancelled');
    } else if (paymentFilter === 'cancelled') {
      list = list.filter((c) => c.status === 'cancelled');
    }
    return list.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [monthClasses, selectedDay, paymentFilter]);

  // Formatted title for the selected day agenda
  const selectedDayLabel = useMemo(() => {
    if (!selectedDay) return '';
    const [y, m, d] = selectedDay.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dayName = WEEK_DAY_NAMES[dateObj.getDay()];
    const monthName = MONTH_NAMES[m - 1];
    return `${dayName}, ${d} de ${monthName}`;
  }, [selectedDay]);

  // All filtered classes in the month for list view
  const allFilteredMonthClasses = useMemo(() => {
    let list = [...monthClasses];
    if (paymentFilter === 'paid') {
      list = list.filter((c) => c.isPaid && c.status !== 'cancelled');
    } else if (paymentFilter === 'pending') {
      list = list.filter((c) => !c.isPaid && c.status !== 'cancelled');
    } else if (paymentFilter === 'cancelled') {
      list = list.filter((c) => c.status === 'cancelled');
    }
    return list.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
  }, [monthClasses, paymentFilter]);

  const filterOptions: { key: PaymentFilterType; label: string; count?: number; color?: string }[] = [
    { key: 'all', label: 'Todas', count: monthClasses.length },
    { key: 'paid', label: '✓ Pagadas', count: monthStats.paidCount, color: '#059669' },
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

  const isCurrentMonth = selectedMonthStr === `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}`;

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

        {/* Quick 'Mes Actual' jump button if viewing another month */}
        {!isCurrentMonth && (
          <TouchableOpacity style={styles.todayButton} onPress={handleToday}>
            <Ionicons name="today-outline" size={13} color={Colors.primary} />
            <Text style={styles.todayButtonText}>Ir a Mes Actual</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Aesthetic Monthly Financial Bar */}
      <View style={styles.statsSummaryCard}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit>
            Total Facturado
          </Text>
          <Text style={styles.statValueTotal} numberOfLines={1} adjustsFontSizeToFit>
            {formatCurrency(monthStats.totalAmount)}
          </Text>
          <Text style={styles.statSubText} numberOfLines={1}>
            {monthStats.totalClasses} clases
          </Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statBox}>
          <View style={styles.statLabelRow}>
            <View style={[styles.miniDot, { backgroundColor: '#10B981' }]} />
            <Text style={[styles.statLabel, { color: '#047857' }]} numberOfLines={1} adjustsFontSizeToFit>
              Pagadas
            </Text>
          </View>
          <Text style={styles.statValuePaid} numberOfLines={1} adjustsFontSizeToFit>
            {formatCurrency(monthStats.paidAmount)}
          </Text>
          <Text style={styles.statSubTextPaid} numberOfLines={1}>
            {monthStats.paidCount} pagadas
          </Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statBox}>
          <View style={styles.statLabelRow}>
            <View style={[styles.miniDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={[styles.statLabel, { color: '#B45309' }]} numberOfLines={1} adjustsFontSizeToFit>
              Pendientes
            </Text>
          </View>
          <Text style={styles.statValuePending} numberOfLines={1} adjustsFontSizeToFit>
            {formatCurrency(monthStats.pendingAmount)}
          </Text>
          <Text style={styles.statSubTextPending} numberOfLines={1}>
            {monthStats.pendingCount} por cobrar
          </Text>
        </View>
      </View>

      {/* View Mode Toggle (Calendario Cuadrícula vs Lista Mensual) */}
      <View style={styles.viewModeRow}>
        <View style={styles.viewModeSegment}>
          <TouchableOpacity
            style={[styles.segmentBtn, viewMode === 'calendar' && styles.segmentBtnActive]}
            onPress={() => setViewMode('calendar')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="calendar"
              size={15}
              color={viewMode === 'calendar' ? Colors.primary : Colors.textSecondary}
            />
            <Text
              style={[
                styles.segmentBtnText,
                viewMode === 'calendar' && styles.segmentBtnTextActive,
              ]}
            >
              Calendario
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, viewMode === 'list' && styles.segmentBtnActive]}
            onPress={() => setViewMode('list')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="list"
              size={15}
              color={viewMode === 'list' ? Colors.primary : Colors.textSecondary}
            />
            <Text
              style={[
                styles.segmentBtnText,
                viewMode === 'list' && styles.segmentBtnTextActive,
              ]}
            >
              Lista Mensual
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterTabsList}>
          {filterOptions.map((item) => {
            const isSelected = paymentFilter === item.key;
            return (
              <TouchableOpacity
                key={item.key}
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
          })}
        </ScrollView>
      </View>

      {/* Main Content Area */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {viewMode === 'calendar' ? (
          <>
            {/* CALENDARIO MENSUAL CON CUADRADOS */}
            <View style={styles.calendarCard}>
              {/* Encabezado Días de la semana */}
              <View style={styles.weekDaysHeader}>
                {WEEK_COL_HEADERS.map((col, idx) => (
                  <View key={idx} style={styles.weekDayCell}>
                    <Text
                      style={[
                        styles.weekDayHeaderLabel,
                        (idx === 5 || idx === 6) && styles.weekDayHeaderWeekend,
                      ]}
                    >
                      {col}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Matriz de semanas del calendario */}
              <View style={styles.gridContainer}>
                {calendarWeeks.map((week, wIdx) => (
                  <View key={`week-${wIdx}`} style={styles.weekRow}>
                    {week.map((dayItem, dIdx) => {
                      if (!dayItem) {
                        return <View key={`empty-${wIdx}-${dIdx}`} style={styles.emptySquare} />;
                      }

                      const isSelected = dayItem.dateStr === selectedDay;
                      const isToday = dayItem.dateStr === todayStr;
                      const hasClasses = dayItem.classes.length > 0;

                      return (
                        <TouchableOpacity
                          key={dayItem.dateStr}
                          activeOpacity={0.7}
                          onPress={() => setSelectedDay(dayItem.dateStr)}
                          style={[
                            styles.daySquare,
                            hasClasses && styles.daySquareHasClasses,
                            isSelected && styles.daySquareSelected,
                            isToday && !isSelected && styles.daySquareToday,
                          ]}
                        >
                          {/* Top del cuadrado: Número de día y badge/punto de estado */}
                          <View style={styles.daySquareHeader}>
                            <View
                              style={[
                                styles.dayNumberCircle,
                                isToday && styles.dayNumberCircleToday,
                                isSelected && styles.dayNumberCircleSelected,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.dayNumberText,
                                  isToday && styles.dayNumberTextToday,
                                  isSelected && styles.dayNumberTextSelected,
                                ]}
                              >
                                {dayItem.dayNum}
                              </Text>
                            </View>

                            {hasClasses && (
                              <View
                                style={[
                                  styles.dayDotIndicator,
                                  dayItem.allPaid ? styles.dotPaid : styles.dotPending,
                                ]}
                              />
                            )}
                          </View>

                          {/* Clases dentro del cuadrado del día */}
                          <View style={styles.daySquareContent}>
                            {dayItem.classes.slice(0, 2).map((session) => {
                              const student = students[session.studentId];
                              const shortName = student ? student.firstName : 'Clase';
                              const isPaid = session.isPaid;
                              const isCancelled = session.status === 'cancelled';

                              return (
                                <View
                                  key={session.id}
                                  style={[
                                    styles.squareClassChip,
                                    isPaid && styles.squareClassChipPaid,
                                    isCancelled && styles.squareClassChipCancelled,
                                  ]}
                                >
                                  <Text
                                    numberOfLines={1}
                                    style={[
                                      styles.squareClassChipTime,
                                      isPaid && styles.squareClassChipTextPaid,
                                      isCancelled && styles.squareClassChipTextCancelled,
                                    ]}
                                  >
                                    {isPaid ? '✓ ' : ''}{session.startTime}
                                  </Text>
                                  <Text
                                    numberOfLines={1}
                                    style={[
                                      styles.squareClassChipName,
                                      isPaid && styles.squareClassChipTextPaid,
                                      isCancelled && styles.squareClassChipTextCancelled,
                                    ]}
                                  >
                                    {shortName}
                                  </Text>
                                </View>
                              );
                            })}

                            {dayItem.classes.length > 2 && (
                              <Text style={styles.squareMoreClassesText}>
                                +{dayItem.classes.length - 2} más
                              </Text>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </View>
            </View>

            {/* SECCIÓN DETALLE DEL DÍA SELECCIONADO */}
            <View style={styles.selectedDaySection}>
              <View style={styles.selectedDayHeader}>
                <View style={{ flex: 1, minWidth: 0, marginRight: Spacing.xs }}>
                  <Text style={styles.selectedDayTitle} numberOfLines={1} adjustsFontSizeToFit>
                    {selectedDayLabel}
                  </Text>
                  <Text style={styles.selectedDaySubtitle} numberOfLines={1}>
                    {selectedDayClasses.length === 0
                      ? 'Sin clases en esta fecha'
                      : `${selectedDayClasses.length} ${selectedDayClasses.length === 1 ? 'clase programada' : 'clases programadas'}`}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.addDayClassBtn}
                  onPress={() => router.push(`/class/new?date=${selectedDay}`)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={16} color="#FFFFFF" />
                  <Text style={styles.addDayClassBtnText}>Nueva Clase</Text>
                </TouchableOpacity>
              </View>

              {/* Lista de clases del día seleccionado */}
              {selectedDayClasses.length > 0 ? (
                selectedDayClasses.map((session) => (
                  <ClassCard
                    key={session.id}
                    session={session}
                    student={students[session.studentId]}
                    subject={subjects[session.subjectId]}
                    onPress={() => router.push(`/class/${session.id}`)}
                    onTogglePaid={() => handleTogglePaid(session)}
                    showStudentName={true}
                  />
                ))
              ) : (
                <View style={styles.emptyDayContainer}>
                  <Ionicons name="calendar-outline" size={36} color={Colors.textTertiary} />
                  <Text style={styles.emptyDayText}>
                    No tienes clases programadas para el {selectedDayLabel}.
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyDayActionBtn}
                    onPress={() => router.push(`/class/new?date=${selectedDay}`)}
                  >
                    <Ionicons name="add-circle-outline" size={16} color={Colors.primary} />
                    <Text style={styles.emptyDayActionBtnText}>
                      Programar clase para este día
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </>
        ) : (
          /* VISTA LISTA MENSUAL */
          <View style={styles.listViewContainer}>
            <View style={styles.listHeaderRow}>
              <Text style={styles.listSectionTitle}>
                Todas las clases de {selectedMonthLabel} ({allFilteredMonthClasses.length})
              </Text>
            </View>

            {allFilteredMonthClasses.length > 0 ? (
              allFilteredMonthClasses.map((item) => (
                <ClassCard
                  key={item.id}
                  session={item}
                  student={students[item.studentId]}
                  subject={subjects[item.subjectId]}
                  onPress={() => router.push(`/class/${item.id}`)}
                  onTogglePaid={() => handleTogglePaid(item)}
                  showStudentName={true}
                />
              ))
            ) : (
              <EmptyState
                icon="calendar-outline"
                title="Sin clases este mes"
                description={`No tienes clases registradas con el filtro seleccionado para ${selectedMonthLabel}.`}
                actionLabel="Programar Nueva Clase"
                onAction={() => router.push('/class/new')}
              />
            )}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <FloatingActionButton
        icon="add"
        onPress={() => router.push(selectedDay ? `/class/new?date=${selectedDay}` : '/class/new')}
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
    backgroundColor: Colors.surface,
  },
  monthSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navArrowButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitleContainer: {
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '800',
    color: Colors.text,
  },
  monthSubtitle: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  todayButton: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryBg,
    marginTop: 6,
  },
  todayButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  statsSummaryCard: {
    flexDirection: 'row',
    marginHorizontal: 8,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  statBox: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  statDivider: {
    width: 1,
    height: '75%',
    backgroundColor: Colors.border,
    alignSelf: 'center',
  },
  statLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
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
  statValueTotal: {
    fontSize: 13.5,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 2,
  },
  statValuePaid: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#059669',
    marginTop: 2,
  },
  statValuePending: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#D97706',
    marginTop: 2,
  },
  statSubText: {
    fontSize: 9.5,
    color: Colors.textTertiary,
    marginTop: 1,
  },
  statSubTextPaid: {
    fontSize: 9.5,
    color: '#047857',
    fontWeight: '600',
    marginTop: 1,
  },
  statSubTextPending: {
    fontSize: 9.5,
    color: '#B45309',
    fontWeight: '600',
    marginTop: 1,
  },
  viewModeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    marginTop: Spacing.xs,
  },
  viewModeSegment: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceVariant,
    padding: 3,
    borderRadius: BorderRadius.full,
    width: '100%',
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  segmentBtnActive: {
    backgroundColor: Colors.surface,
    ...Shadows.sm,
  },
  segmentBtnText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  segmentBtnTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  filterTabsContainer: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  filterTabsList: {
    paddingHorizontal: Spacing.md,
    gap: 6,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterTabSelected: {
    backgroundColor: Colors.primaryBg,
    borderColor: Colors.primary,
  },
  filterTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterTabTextSelected: {
    color: Colors.primary,
    fontWeight: '700',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 8,
    paddingBottom: 135,
  },

  /* CALENDARIO MENSUAL CUADRICULA */
  calendarCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 4,
    marginTop: 4,
    ...Shadows.sm,
  },
  weekDaysHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 4,
    marginBottom: 4,
  },
  weekDayCell: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDayHeaderLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  weekDayHeaderWeekend: {
    color: '#94A3B8',
  },
  gridContainer: {
    gap: 3,
  },
  weekRow: {
    flexDirection: 'row',
    gap: 2,
  },
  emptySquare: {
    flex: 1,
    minWidth: 0,
    minHeight: 68,
    backgroundColor: 'transparent',
  },
  daySquare: {
    flex: 1,
    minWidth: 0,
    minHeight: 68,
    backgroundColor: '#FAFAFA',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 2,
    justifyContent: 'flex-start',
    overflow: 'hidden',
  },
  daySquareHasClasses: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
  },
  daySquareSelected: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: '#EEF2FF',
    ...Shadows.sm,
  },
  daySquareToday: {
    borderColor: '#93C5FD',
    backgroundColor: '#F0F9FF',
  },
  daySquareHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 1,
  },
  dayNumberCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumberCircleToday: {
    backgroundColor: Colors.primary,
  },
  dayNumberCircleSelected: {
    backgroundColor: Colors.primaryDark,
  },
  dayNumberText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.text,
  },
  dayNumberTextToday: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  dayNumberTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  dayDotIndicator: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  dotPaid: {
    backgroundColor: '#10B981',
  },
  dotPending: {
    backgroundColor: '#F59E0B',
  },
  daySquareContent: {
    flex: 1,
    minWidth: 0,
    gap: 2,
    marginTop: 1,
    overflow: 'hidden',
  },
  squareClassChip: {
    borderRadius: 3,
    paddingHorizontal: 2,
    paddingVertical: 1,
    backgroundColor: '#E0E7FF',
    borderWidth: 0.5,
    borderColor: '#C7D2FE',
    minWidth: 0,
    overflow: 'hidden',
  },
  squareClassChipPaid: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  squareClassChipCancelled: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  squareClassChipTime: {
    fontSize: 8,
    fontWeight: '800',
    color: '#3730A3',
    lineHeight: 10,
  },
  squareClassChipName: {
    fontSize: 7.5,
    fontWeight: '600',
    color: '#4338CA',
    lineHeight: 9.5,
  },
  squareClassChipTextPaid: {
    color: '#15803D',
  },
  squareClassChipTextCancelled: {
    color: '#B91C1C',
    textDecorationLine: 'line-through',
  },
  squareMoreClassesText: {
    fontSize: 7.5,
    fontWeight: '700',
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: 1,
  },

  /* SECCION AGENDA DEL DIA SELECCIONADO */
  selectedDaySection: {
    marginTop: Spacing.md,
  },
  selectedDayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
    backgroundColor: Colors.surface,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedDayTitle: {
    fontSize: FontSizes.md,
    fontWeight: '800',
    color: Colors.text,
  },
  selectedDaySubtitle: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  addDayClassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  addDayClassBtnText: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyDayContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: Spacing.xs,
  },
  emptyDayText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  emptyDayActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
  },
  emptyDayActionBtnText: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.primary,
  },

  /* VISTA LISTA MENSUAL */
  listViewContainer: {
    marginTop: Spacing.xs,
  },
  listHeaderRow: {
    marginBottom: Spacing.sm,
  },
  listSectionTitle: {
    fontSize: FontSizes.md,
    fontWeight: '800',
    color: Colors.text,
  },
});
