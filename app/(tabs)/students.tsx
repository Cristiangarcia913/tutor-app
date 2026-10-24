import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { useDatabase } from '../../src/hooks/useDatabase';
import {
  Badge,
  EmptyState,
  SearchBar,
  FloatingActionButton,
  FilterChip,
} from '../../src/components/common';
import StudentCard from '../../src/components/students/StudentCard';
import {
  Colors,
  Spacing,
  FontSizes,
  BorderRadius,
} from '../../src/constants/theme';
import type { Student, StudentBalance } from '../../src/types';

type FilterType = 'all' | 'active' | 'inactive';

export default function StudentsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const db = useDatabase();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  const loadData = useCallback(async () => {
    try {
      const [studentsList, balancesList] = await Promise.all([
        db.loadStudents(),
        db.getStudentBalances(),
      ]);

      const balMap: Record<string, number> = {};
      balancesList.forEach((b: StudentBalance) => {
        balMap[b.student.id] = b.balance;
      });

      setStudents(studentsList);
      setBalances(balMap);
    } catch (error) {
      console.error('Error loading students:', error);
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

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      if (filter === 'active' && !student.active) return false;
      if (filter === 'inactive' && student.active) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
        const email = (student.email || '').toLowerCase();
        const phone = (student.phone || '').toLowerCase();
        const parent = (student.parentName || '').toLowerCase();
        return (
          fullName.includes(query) ||
          email.includes(query) ||
          phone.includes(query) ||
          parent.includes(query)
        );
      }

      return true;
    });
  }, [students, filter, searchQuery]);

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'active', label: 'Activos' },
    { key: 'inactive', label: 'Inactivos' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Alumnos</Text>
          <Text style={styles.subtitle}>
            {filteredStudents.length} {filteredStudents.length === 1 ? 'alumno' : 'alumnos'}
          </Text>
        </View>

        <Badge
          text={`${students.filter((s) => s.active).length} activos`}
          color={Colors.success}
          backgroundColor={Colors.completedBg}
        />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar por nombre, teléfono, tutor..."
        />
      </View>

      {/* Filter Chips */}
      <View style={styles.chipsContainer}>
        {filters.map((f) => (
          <FilterChip
            key={f.key}
            label={f.label}
            selected={filter === f.key}
            onPress={() => setFilter(f.key)}
          />
        ))}
      </View>

      {/* Students List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredStudents}
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
              icon="people-outline"
              title="No hay alumnos"
              description={
                searchQuery || filter !== 'all'
                  ? 'No se encontraron alumnos con los criterios de búsqueda.'
                  : 'Aún no tienes alumnos registrados. ¡Añade al primero!'
              }
              actionLabel="Añadir Alumno"
              onAction={() => router.push('/student/new')}
            />
          }
          renderItem={({ item }) => (
            <StudentCard
              student={item}
              pendingAmount={balances[item.id] || 0}
              onPress={() => router.push(`/student/${item.id}`)}
            />
          )}
        />
      )}

      {/* Floating Action Button */}
      <FloatingActionButton
        onPress={() => router.push('/student/new')}
        icon="add"
      />
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
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
  },
  chipsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
