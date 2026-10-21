import React, { useState, useCallback, useMemo } from 'react';
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
  Card,
  Badge,
  EmptyState,
  StatCard,
  FloatingActionButton,
  FilterChip,
} from '../../src/components/common';
import PaymentCard from '../../src/components/finances/PaymentCard';
import IncomeChart from '../../src/components/finances/IncomeChart';
import {
  Colors,
  Spacing,
  FontSizes,
  BorderRadius,
  Shadows,
  formatCurrency,
} from '../../src/constants/theme';
import type { Payment, Student, StudentBalance } from '../../src/types';

type ActiveTab = 'payments' | 'summary';
type MethodFilter = 'all' | 'bizum' | 'efectivo';

export default function FinancesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const db = useDatabase();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('payments');

  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Record<string, Student>>({});
  const [studentBalances, setStudentBalances] = useState<StudentBalance[]>([]);
  const [monthlyIncome, setMonthlyIncome] = useState<{ month: string; amount: number }[]>([]);

  const [methodFilter, setMethodFilter] = useState<MethodFilter>('all');

  const loadData = useCallback(async () => {
    try {
      const [paymentsData, studentsData, balancesData, incomeData] = await Promise.all([
        db.loadPayments(),
        db.loadStudents(),
        db.getStudentBalances(),
        db.getMonthlyIncome(6),
      ]);

      const studentMap: Record<string, Student> = {};
      studentsData.forEach((s) => {
        studentMap[s.id] = s;
      });
      setStudents(studentMap);

      setPayments(paymentsData);
      setStudentBalances(balancesData);
      setMonthlyIncome(incomeData);
    } catch (error) {
      console.error('Error loading finances:', error);
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

  // Financial calculations
  const totalCollected = useMemo(() => {
    return payments
      .filter((p) => p.status === 'cobrado')
      .reduce((sum, p) => sum + p.amount, 0);
  }, [payments]);

  const totalPending = useMemo(() => {
    return payments
      .filter((p) => p.status === 'pendiente')
      .reduce((sum, p) => sum + p.amount, 0);
  }, [payments]);

  const filteredPayments = useMemo(() => {
    if (methodFilter === 'all') return payments;
    return payments.filter((p) => p.method === methodFilter);
  }, [payments, methodFilter]);

  const methodFilters: { key: MethodFilter; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'bizum', label: 'Bizum' },
    { key: 'efectivo', label: 'Efectivo' },
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
            title="Pendiente"
            value={formatCurrency(totalPending)}
            icon="alert-circle"
            color={Colors.warning}
          />
        </View>
      </View>

      {/* Segmented Controls / Tab Switcher */}
      <View style={styles.tabSwitcher}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'payments' && styles.tabButtonActive]}
          onPress={() => setActiveTab('payments')}
        >
          <Text style={[styles.tabText, activeTab === 'payments' && styles.tabTextActive]}>
            Pagos ({payments.length})
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
      ) : activeTab === 'payments' ? (
        <>
          {/* Method Filter Chips */}
          <View style={styles.chipsContainer}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={methodFilters}
              keyExtractor={(item) => item.key}
              contentContainerStyle={styles.chipsList}
              renderItem={({ item }) => (
                <FilterChip
                  label={item.label}
                  selected={methodFilter === item.key}
                  onPress={() => setMethodFilter(item.key)}
                />
              )}
            />
          </View>

          {/* Payments List */}
          <FlatList
            data={filteredPayments}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: insets.bottom + 90 },
            ]}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <EmptyState
                icon="wallet-outline"
                title="No hay pagos"
                description={
                  methodFilter !== 'all'
                    ? 'No se encontraron pagos con ese método.'
                    : 'Aún no has registrado ningún pago. ¡Añade uno nuevo!'
                }
                actionLabel="Registrar Pago"
                onAction={() => router.push('/payment/new')}
              />
            }
            renderItem={({ item }) => (
              <PaymentCard
                payment={item}
                student={students[item.studentId]}
                onPress={() => router.push(`/payment/${item.id}`)}
                showStudentName={true}
              />
            )}
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
            <IncomeChart data={monthlyIncome} title="Evolución Mensual de Ingresos" />
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
                <View style={styles.balanceRow}>
                  <View style={styles.balanceStudentInfo}>
                    <Text style={styles.balanceStudentName}>
                      {item.student.firstName} {item.student.lastName}
                    </Text>
                    <View style={styles.balanceMeta}>
                      <Text style={styles.balanceMetaText}>
                        Total facturado: {formatCurrency(item.totalCharged)}
                      </Text>
                      <Text style={styles.balanceMetaDot}>•</Text>
                      <Text style={styles.balanceMetaText}>
                        Cobrado: {formatCurrency(item.totalPaid)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.balanceAmountCol}>
                    <Text
                      style={[
                        styles.balanceAmount,
                        { color: hasPending ? Colors.warning : Colors.success },
                      ]}
                    >
                      {hasPending ? `-${formatCurrency(item.balance)}` : 'Al día'}
                    </Text>
                    {hasPending && (
                      <TouchableOpacity
                        style={styles.chargeButton}
                        onPress={() =>
                          router.push({
                            pathname: '/payment/new',
                            params: {
                              studentId: item.student.id,
                              amount: item.balance.toString(),
                            },
                          })
                        }
                      >
                        <Text style={styles.chargeButtonText}>Cobrar</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </Card>
            );
          }}
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  title: {
    fontSize: FontSizes.xxxl,
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
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  statCol: {
    flex: 1,
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceVariant,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    padding: 3,
    marginBottom: Spacing.sm,
  },
  tabButton: {
    flex: 1,
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
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xs,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceCard: {
    marginBottom: Spacing.sm,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceStudentInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  balanceStudentName: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  balanceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  balanceMetaText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  balanceMetaDot: {
    fontSize: 10,
    color: Colors.textTertiary,
  },
  balanceAmountCol: {
    alignItems: 'flex-end',
    gap: 6,
  },
  balanceAmount: {
    fontSize: FontSizes.md,
    fontWeight: '800',
  },
  chargeButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  chargeButtonText: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
