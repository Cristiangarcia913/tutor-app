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
import { Ionicons } from '@expo/vector-icons';
import { useDatabase } from '../../src/hooks/useDatabase';
import {
  Card,
  Badge,
  EmptyState,
  SearchBar,
  FloatingActionButton,
  FilterChip,
} from '../../src/components/common';
import ClassCard from '../../src/components/classes/ClassCard';
import {
  Colors,
  Spacing,
  FontSizes,
  BorderRadius,
  Shadows,
} from '../../src/constants/theme';
import type { ClassSession, Student, Subject } from '../../src/types';

type StatusFilter = 'all' | 'scheduled' | 'completed' | 'cancelled';
type TimeFilter = 'all' | 'today' | 'week' | 'month';

export default function ClassesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const db = useDatabase();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [students, setStudents] = useState<Record<string, Student>>({});
  const [subjects, setSubjects] = useState<Record<string, Subject>>({});

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');

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

  // Date filtering logic
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const filteredClasses = useMemo(() => {
    return classes.filter((item) => {
      // Status filter
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }

      // Time filter
      if (timeFilter === 'today') {
        if (item.date !== todayStr) return false;
      } else if (timeFilter === 'week') {
        const itemDate = new Date(item.date);
        const diffDays = (itemDate.getTime() - now.getTime()) / (1000 * 3600 * 24);
        if (diffDays < -1 || diffDays > 7) return false;
      } else if (timeFilter === 'month') {
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        if (!item.date.startsWith(currentMonth)) return false;
      }

      // Search query (matches student name or subject name)
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
    });
  }, [classes, statusFilter, timeFilter, searchQuery, students, subjects, todayStr]);

  const statusFilters: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'Todas' },
    { key: 'scheduled', label: 'Programadas' },
    { key: 'completed', label: 'Completadas' },
    { key: 'cancelled', label: 'Canceladas' },
  ];

  const timeFilters: { key: TimeFilter; label: string }[] = [
    { key: 'all', label: 'Todo el tiempo' },
    { key: 'today', label: 'Hoy' },
    { key: 'week', label: 'Esta semana' },
    { key: 'month', label: 'Este mes' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Clases</Text>
          <Text style={styles.subtitle}>
            {filteredClasses.length} {filteredClasses.length === 1 ? 'clase encontrada' : 'clases encontradas'}
          </Text>
        </View>

        <Badge
          text={`${classes.filter((c) => c.status === 'scheduled').length} pendientes`}
          color={Colors.primary}
          backgroundColor={Colors.primaryBg}
        />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar por alumno o asignatura..."
        />
      </View>

      {/* Filter Chips - Status */}
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

      {/* Filter Chips - Time */}
      <View style={styles.timeChipsContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={timeFilters}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.chipsList}
          renderItem={({ item }) => (
            <FilterChip
              label={item.label}
              selected={timeFilter === item.key}
              onPress={() => setTimeFilter(item.key)}
            />
          )}
        />
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredClasses}
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
              icon="calendar-outline"
              title="No hay clases"
              description={
                searchQuery || statusFilter !== 'all' || timeFilter !== 'all'
                  ? 'No se encontraron clases con los filtros actuales.'
                  : 'Aún no tienes clases registradas. ¡Comienza programando una!'
              }
              actionLabel="Programar Clase"
              onAction={() => router.push('/class/new')}
            />
          }
          renderItem={({ item }) => (
            <ClassCard
              session={item}
              student={students[item.studentId]}
              subject={subjects[item.subjectId]}
              onPress={() => router.push(`/class/${item.id}`)}
              showStudentName={true}
            />
          )}
        />
      )}

      {/* Floating Action Button */}
      <FloatingActionButton
        onPress={() => router.push('/class/new')}
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
    paddingTop: Spacing.xs,
  },
  timeChipsContainer: {
    paddingVertical: 4,
  },
  chipsList: {
    paddingHorizontal: Spacing.lg,
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
