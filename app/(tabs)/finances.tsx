import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDatabase } from '../../src/hooks/useDatabase';
import {
  Card,
  Badge,
  Avatar,
  EmptyState,
  StatCard,
  FloatingActionButton,
  FilterChip,
} from '../../src/components/common';
import WhatsAppReportModal from '../../src/components/finances/WhatsAppReportModal';
import {
  Colors,
  Spacing,
  FontSizes,
  BorderRadius,
  Shadows,
  formatCurrency,
  formatDate,
} from '../../src/constants/theme';
import type { Payment, Student, StudentBalance, ClassSession, Subject, AppSettings } from '../../src/types';

type ActiveTab = 'classes' | 'summary';
type StatusFilter = 'all' | 'pagada' | 'por_pagar';

interface StudentClassItem {
  id: string;
  type: 'class' | 'payment';
  date: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  subjectName?: string;
  concept?: string;
  amount: number;
  isPaid: boolean;
  classSession?: ClassSession;
}

interface StudentFinancesGroup {
  student: Student;
  pendingClasses: StudentClassItem[];
  paidClasses: StudentClassItem[];
  totalPendingAmount: number;
  totalPaidAmount: number;
  totalChargedAmount: number;
}

export default function FinancesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const db = useDatabase();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('classes');

  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Record<string, Student>>({});
  const [subjects, setSubjects] = useState<Record<string, Subject>>({});
  const [studentBalances, setStudentBalances] = useState<StudentBalance[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  // WhatsApp Report modal state
  const [selectedStudentForWA, setSelectedStudentForWA] = useState<Student | null>(null);
  const [selectedClassesForWA, setSelectedClassesForWA] = useState<ClassSession[]>([]);
  const [showWAModal, setShowWAModal] = useState(false);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const loadData = useCallback(async () => {
    try {
      const [
        classesData,
        paymentsData,
        studentsData,
        subjectsData,
        balancesData,
        settingsData,
      ] = await Promise.all([
        db.loadClasses(),
        db.loadPayments(),
        db.loadStudents(),
        db.loadSubjects(),
        db.getStudentBalances(),
        db.loadSettings(),
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
      setPayments(paymentsData);
      setStudentBalances(balancesData);
      setSettings(settingsData);
    } catch (error) {
      console.error('Error loading finances:', error);
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

  // Global calculations
  const totalFacturado = useMemo(() => {
    const classesTotal = classes
      .filter((c) => c.status !== 'cancelled')
      .reduce((sum, c) => sum + c.totalAmount, 0);
    const standalonePayments = payments
      .filter((p) => (!p.classSessionIds || p.classSessionIds.length === 0) && p.status === 'cobrado')
      .reduce((sum, p) => sum + p.amount, 0);
    return classesTotal + standalonePayments;
  }, [classes, payments]);

  const totalCollected = useMemo(() => {
    const paidClassesAmount = classes
      .filter((c) => c.isPaid && c.status !== 'cancelled')
      .reduce((sum, c) => sum + c.totalAmount, 0);
    const standalonePayments = payments
      .filter((p) => (!p.classSessionIds || p.classSessionIds.length === 0) && p.status === 'cobrado')
      .reduce((sum, p) => sum + p.amount, 0);
    return paidClassesAmount + standalonePayments;
  }, [classes, payments]);

  const totalPending = useMemo(() => {
    const unpaidClassesAmount = classes
      .filter((c) => !c.isPaid && c.status !== 'cancelled')
      .reduce((sum, c) => sum + c.totalAmount, 0);
    return unpaidClassesAmount;
  }, [classes]);

  // Group classes and payments by student
  const studentGroups = useMemo<StudentFinancesGroup[]>(() => {
    const studentList = Object.values(students);

    return studentList.map((student) => {
      const sClasses = classes.filter((c) => c.studentId === student.id && c.status !== 'cancelled');

      const pendingClasses: StudentClassItem[] = sClasses
        .filter((c) => !c.isPaid)
        .sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime))
        .map((c) => ({
          id: c.id,
          type: 'class',
          date: c.date,
          startTime: c.startTime,
          endTime: c.endTime,
          duration: c.duration,
          subjectName: subjects[c.subjectId]?.name || 'Matemáticas',
          amount: c.totalAmount,
          isPaid: false,
          classSession: c,
        }));

      const paidClasses: StudentClassItem[] = sClasses
        .filter((c) => c.isPaid)
        .sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime))
        .map((c) => ({
          id: c.id,
          type: 'class',
          date: c.date,
          startTime: c.startTime,
          endTime: c.endTime,
          duration: c.duration,
          subjectName: subjects[c.subjectId]?.name || 'Matemáticas',
          amount: c.totalAmount,
          isPaid: true,
          classSession: c,
        }));

      // Include standalone payments if any
      const sPayments = payments.filter(
        (p) => p.studentId === student.id && (!p.classSessionIds || p.classSessionIds.length === 0)
      );
      sPayments.forEach((p) => {
        if (p.status === 'cobrado') {
          paidClasses.push({
            id: p.id,
            type: 'payment',
            date: p.date,
            concept: p.concept || 'Cobro registrado',
            amount: p.amount,
            isPaid: true,
          });
        } else if (p.status === 'pendiente') {
          pendingClasses.push({
            id: p.id,
            type: 'payment',
            date: p.date,
            concept: p.concept || 'Cobro pendiente',
            amount: p.amount,
            isPaid: false,
          });
        }
      });

      const totalPendingAmount = pendingClasses.reduce((sum, item) => sum + item.amount, 0);
      const totalPaidAmount = paidClasses.reduce((sum, item) => sum + item.amount, 0);
      const totalChargedAmount = totalPendingAmount + totalPaidAmount;

      return {
        student,
        pendingClasses,
        paidClasses,
        totalPendingAmount,
        totalPaidAmount,
        totalChargedAmount,
      };
    });
  }, [students, classes, subjects, payments]);

  // Filter student groups according to selected status filter
  const filteredStudentGroups = useMemo(() => {
    return studentGroups.filter((group) => {
      if (statusFilter === 'por_pagar') {
        return group.pendingClasses.length > 0;
      }
      if (statusFilter === 'pagada') {
        return group.paidClasses.length > 0;
      }
      return group.pendingClasses.length > 0 || group.paidClasses.length > 0;
    });
  }, [studentGroups, statusFilter]);

  // Actions
  const handleToggleClassPaid = async (classId: string) => {
    try {
      await db.toggleClassPaid(classId);
      await loadData();
    } catch (e) {
      console.error('Error toggling class paid:', e);
    }
  };

  const handleMarkStudentAllPaid = async (studentId: string) => {
    try {
      const studentUnpaidClasses = classes.filter(
        (c) => c.studentId === studentId && !c.isPaid && c.status !== 'cancelled'
      );
      if (studentUnpaidClasses.length === 0) return;

      for (const cls of studentUnpaidClasses) {
        await db.toggleClassPaid(cls.id);
      }
      await loadData();
      Alert.alert('¡Cobrado!', 'Todas las clases pendientes han sido marcadas como pagadas.');
    } catch (e) {
      console.error('Error marking all paid:', e);
      Alert.alert('Error', 'No se pudieron actualizar los cobros.');
    }
  };

  const statusFilters: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'pagada', label: 'Pagadas' },
    { key: 'por_pagar', label: 'Por pagar' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Finanzas</Text>
          <Text style={styles.subtitle}>Gestión de cobros e ingresos</Text>
        </View>

        <TouchableOpacity
          style={styles.reportsButton}
          onPress={() => router.push('/reports')}
        >
          <Ionicons name="bar-chart-outline" size={20} color={Colors.primary} />
          <Text style={styles.reportsButtonText}>Informes</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Stat Cards */}
      <View style={styles.statsRow}>
        <View style={styles.statCol}>
          <StatCard
            title="Total Cobrado"
            value={formatCurrency(totalCollected)}
            icon="checkmark-circle"
            color={Colors.success}
          />
        </View>
        <View style={styles.statCol}>
          <StatCard
            title="Por Cobrar"
            value={formatCurrency(totalPending)}
            icon="alert-circle"
            color={totalPending > 0 ? Colors.warning : Colors.textTertiary}
          />
        </View>
      </View>

      {/* Segmented Controls / Tab Switcher */}
      <View style={styles.tabSwitcher}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'classes' && styles.tabButtonActive]}
          onPress={() => setActiveTab('classes')}
        >
          <Text style={[styles.tabText, activeTab === 'classes' && styles.tabTextActive]}>
            Clases y Cobros
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'summary' && styles.tabButtonActive]}
          onPress={() => setActiveTab('summary')}
        >
          <Text style={[styles.tabText, activeTab === 'summary' && styles.tabTextActive]}>
            Balance Alumnos
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : activeTab === 'classes' ? (
        <>
          {/* Status Filter Chips */}
          <View style={styles.chipsContainer}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={statusFilters}
              keyExtractor={(item) => item.key}
              contentContainerStyle={styles.chipsList}
              renderItem={({ item }) => (
                <FilterChip
                  label={item.label}
                  selected={statusFilter === item.key}
                  onPress={() => setStatusFilter(item.key)}
                />
              )}
            />
          </View>

          {/* Students Grouped Finances List */}
          <FlatList
            data={filteredStudentGroups}
            keyExtractor={(item) => item.student.id}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: insets.bottom + 90 },
            ]}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <EmptyState
                icon={statusFilter === 'por_pagar' ? 'checkmark-circle-outline' : 'wallet-outline'}
                title={statusFilter === 'por_pagar' ? '¡Todo al día!' : 'No hay datos'}
                description={
                  statusFilter === 'por_pagar'
                    ? 'No hay ninguna clase pendiente de cobro este mes. ¡Todos los alumnos están al día!'
                    : statusFilter === 'pagada'
                    ? 'Aún no has marcado clases como cobradas este mes.'
                    : 'Aún no tienes clases registradas. Programa una nueva clase en el calendario.'
                }
                actionLabel={statusFilter === 'por_pagar' ? 'Ver Todas' : 'Programar Clase'}
                onAction={() => {
                  if (statusFilter === 'por_pagar') {
                    setStatusFilter('all');
                  } else {
                    router.push('/class/new');
                  }
                }}
              />
            }
            renderItem={({ item: group }) => {
              const itemsToShow: StudentClassItem[] =
                statusFilter === 'por_pagar'
                  ? group.pendingClasses
                  : statusFilter === 'pagada'
                  ? group.paidClasses
                  : [...group.pendingClasses, ...group.paidClasses];

              const pendingCount = group.pendingClasses.length;

              return (
                <Card style={styles.studentCard}>
                  {/* Student Header */}
                  <View style={styles.studentCardHeader}>
                    <View style={styles.studentHeaderLeft}>
                      <Avatar
                        firstName={group.student.firstName}
                        lastName={group.student.lastName}
                        color={group.student.avatarColor || Colors.primary}
                        size={42}
                      />
                      <View style={{ marginLeft: Spacing.sm, flex: 1 }}>
                        <Text style={styles.studentCardName}>
                          {group.student.firstName} {group.student.lastName}
                        </Text>
                        <Text style={styles.studentCardSub}>
                          {group.student.course ? `${group.student.course} • ` : ''}
                          {pendingCount > 0 ? (
                            <Text style={{ color: Colors.warning, fontWeight: '700' }}>
                              {pendingCount} por pagar ({formatCurrency(group.totalPendingAmount)})
                            </Text>
                          ) : (
                            <Text style={{ color: Colors.success, fontWeight: '700' }}>
                              ✓ Al día
                            </Text>
                          )}
                        </Text>
                      </View>
                    </View>

                    {/* Batch Pay Button for this student */}
                    {pendingCount > 0 && (
                      <TouchableOpacity
                        style={styles.batchPayButton}
                        activeOpacity={0.85}
                        onPress={() => handleMarkStudentAllPaid(group.student.id)}
                      >
                        <Ionicons name="checkmark-done" size={14} color="#FFFFFF" />
                        <Text style={styles.batchPayText}>
                          Cobrar todo ({formatCurrency(group.totalPendingAmount)})
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Classes List */}
                  <View style={styles.itemsListContainer}>
                    {itemsToShow.map((item) => (
                      <View key={item.id} style={styles.classItemRow}>
                        <View style={styles.classItemInfo}>
                          <View style={styles.classItemTop}>
                            <View
                              style={[
                                styles.statusDot,
                                { backgroundColor: item.isPaid ? Colors.success : Colors.warning },
                              ]}
                            />
                            <Text style={styles.classItemDate}>{formatDate(item.date)}</Text>
                            {item.startTime ? (
                              <Text style={styles.classItemTime}>• {item.startTime}</Text>
                            ) : null}
                          </View>
                          <Text style={styles.classItemSubject}>
                            {item.subjectName || item.concept || 'Matemáticas'}
                            {item.duration ? ` (${item.duration} min)` : ''}
                          </Text>
                        </View>

                        <View style={styles.classItemRight}>
                          <Text
                            style={[
                              styles.classItemAmount,
                              { color: item.isPaid ? Colors.success : Colors.text },
                            ]}
                          >
                            {formatCurrency(item.amount)}
                          </Text>

                          {item.type === 'class' ? (
                            <TouchableOpacity
                              style={[
                                styles.itemPayToggleBtn,
                                item.isPaid ? styles.itemPayToggleBtnPaid : styles.itemPayToggleBtnPending,
                              ]}
                              activeOpacity={0.8}
                              onPress={() => handleToggleClassPaid(item.id)}
                            >
                              <Ionicons
                                name={item.isPaid ? 'checkmark-circle' : 'cash-outline'}
                                size={14}
                                color={item.isPaid ? Colors.success : '#FFFFFF'}
                              />
                              <Text
                                style={[
                                  styles.itemPayToggleText,
                                  item.isPaid ? styles.itemPayToggleTextPaid : styles.itemPayToggleTextPending,
                                ]}
                              >
                                {item.isPaid ? 'Pagada' : 'Cobrar'}
                              </Text>
                            </TouchableOpacity>
                          ) : (
                            <View style={styles.itemPaidBadge}>
                              <Text style={styles.itemPaidBadgeText}>
                                {item.isPaid ? 'Cobrado' : 'Pendiente'}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                </Card>
              );
            }}
          />

          <FloatingActionButton
            onPress={() => router.push('/payment/new')}
            icon="add"
          />
        </>
      ) : (
        /* Summary & Balances Tab */
        <FlatList
          data={studentBalances}
          keyExtractor={(item) => item.student.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 90 },
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListHeaderComponent={
            /* Monthly Overview Card */
            <Card style={styles.balanceSummaryCard}>
              <View style={styles.summaryCardHeader}>
                <Ionicons name="wallet-outline" size={20} color={Colors.primary} />
                <Text style={styles.summaryCardTitle}>Resumen Financiero Global</Text>
              </View>
              <View style={styles.summaryCardRow}>
                <View style={styles.summaryCol}>
                  <Text style={styles.summaryLabel}>Facturado</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(totalFacturado)}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryCol}>
                  <Text style={styles.summaryLabel}>Cobrado</Text>
                  <Text style={[styles.summaryValue, { color: Colors.success }]}>
                    {formatCurrency(totalCollected)}
                  </Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryCol}>
                  <Text style={styles.summaryLabel}>Por Cobrar</Text>
                  <Text
                    style={[
                      styles.summaryValue,
                      { color: totalPending > 0 ? Colors.warning : Colors.textTertiary },
                    ]}
                  >
                    {formatCurrency(totalPending)}
                  </Text>
                </View>
              </View>
            </Card>
          }
          ListEmptyComponent={
            <EmptyState
              icon="people-outline"
              title="Sin balances"
              description="No hay datos de alumnos suficientes para calcular balances."
            />
          }
          renderItem={({ item }) => {
            const hasPending = item.balance > 0;
            return (
              <Card style={styles.balanceCard}>
                <View style={styles.balanceTopRow}>
                  <Avatar
                    firstName={item.student.firstName}
                    lastName={item.student.lastName}
                    color={item.student.avatarColor || Colors.primary}
                    size={44}
                  />
                  <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                    <View style={styles.balanceNameRow}>
                      <Text style={styles.balanceStudentName}>
                        {item.student.firstName} {item.student.lastName}
                      </Text>
                      <Badge
                        text={hasPending ? `Pendiente: ${formatCurrency(item.balance)}` : '✓ Al día'}
                        color={hasPending ? '#DC2626' : Colors.success}
                        backgroundColor={hasPending ? '#FEF2F2' : '#F0FDF4'}
                      />
                    </View>
                    <Text style={styles.balanceMetaText}>
                      {item.student.course ? `${item.student.course} • ` : ''}
                      Facturado: {formatCurrency(item.totalCharged)} • Cobrado: {formatCurrency(item.totalPaid)}
                    </Text>
                  </View>
                </View>

                {/* Parent Contact Row */}
                {(item.student.parentName || item.student.parentPhone) && (
                  <View style={styles.balanceParentRow}>
                    <Ionicons name="people-outline" size={14} color={Colors.textSecondary} />
                    <Text style={styles.balanceParentText}>
                      {item.student.parentName ? `${item.student.parentName}` : 'Tutor'}
                      {item.student.parentPhone ? ` (${item.student.parentPhone})` : ''}
                    </Text>
                  </View>
                )}

                {/* Actions: Avisar a los Padres (WhatsApp) & Cobrar todo */}
                <View style={styles.balanceActionsBar}>
                  <TouchableOpacity
                    style={styles.whatsAppReportBtn}
                    activeOpacity={0.85}
                    onPress={async () => {
                      setSelectedStudentForWA(item.student);
                      const cls = await db.getClassesByStudent(item.student.id);
                      setSelectedClassesForWA(cls);
                      setShowWAModal(true);
                    }}
                  >
                    <Ionicons name="logo-whatsapp" size={16} color="#FFFFFF" />
                    <Text style={styles.whatsAppReportBtnText}>Avisar a los Padres</Text>
                  </TouchableOpacity>

                  {hasPending && (
                    <TouchableOpacity
                      style={styles.balanceChargeBtn}
                      activeOpacity={0.85}
                      onPress={() => handleMarkStudentAllPaid(item.student.id)}
                    >
                      <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" />
                      <Text style={styles.balanceChargeBtnText}>
                        Cobrar todo ({formatCurrency(item.balance)})
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </Card>
            );
          }}
        />
      )}

      {/* WhatsApp Report Modal */}
      {selectedStudentForWA && (
        <WhatsAppReportModal
          visible={showWAModal}
          onClose={() => setShowWAModal(false)}
          student={selectedStudentForWA}
          classes={selectedClassesForWA}
          settings={settings}
        />
      )}
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
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: '800',
    color: Colors.text,
  },
  subtitle: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  reportsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
  },
  reportsButtonText: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.primary,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  statCol: {
    flex: 1,
    minWidth: 0,
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceVariant,
    marginHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    padding: 3,
    marginBottom: Spacing.sm,
  },
  tabButton: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  tabButtonActive: {
    backgroundColor: Colors.surface,
    ...Shadows.sm,
  },
  tabText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  chipsContainer: {
    paddingVertical: Spacing.xs,
  },
  chipsList: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Student Group Card
  studentCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  studentCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexWrap: 'wrap',
    gap: 8,
  },
  studentHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 180,
  },
  studentCardName: {
    fontSize: FontSizes.md,
    fontWeight: '800',
    color: Colors.text,
  },
  studentCardSub: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  batchPayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.success,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  batchPayText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  itemsListContainer: {
    paddingTop: Spacing.xs,
  },
  classItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  classItemInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  classItemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  classItemDate: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.text,
  },
  classItemTime: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  classItemSubject: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 2,
    marginLeft: 13,
  },
  classItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  classItemAmount: {
    fontSize: FontSizes.sm,
    fontWeight: '800',
  },
  itemPayToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  itemPayToggleBtnPending: {
    backgroundColor: Colors.primary,
  },
  itemPayToggleBtnPaid: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  itemPayToggleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  itemPayToggleTextPending: {
    color: '#FFFFFF',
  },
  itemPayToggleTextPaid: {
    color: Colors.success,
  },
  itemPaidBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  itemPaidBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.success,
  },

  // Balance Tab Styles
  balanceSummaryCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
    backgroundColor: '#F8FAFC',
  },
  summaryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  summaryCardTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '800',
    color: Colors.text,
  },
  summaryCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  summaryCol: {
    alignItems: 'center',
    flex: 1,
  },
  summaryDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border,
  },
  summaryLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: FontSizes.md,
    fontWeight: '800',
    color: Colors.text,
  },
  balanceCard: {
    marginBottom: Spacing.sm,
    padding: Spacing.md,
  },
  balanceTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  balanceStudentName: {
    fontSize: FontSizes.md,
    fontWeight: '800',
    color: Colors.text,
  },
  balanceMetaText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  balanceParentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.sm,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  balanceParentText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  balanceActionsBar: {
    flexDirection: 'row',
    gap: 8,
    marginTop: Spacing.sm,
    alignItems: 'center',
  },
  whatsAppReportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#25D366',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  whatsAppReportBtnText: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  balanceChargeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.md,
    flex: 1,
    justifyContent: 'center',
  },
  balanceChargeBtnText: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
