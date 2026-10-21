import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDatabase } from '../../hooks/useDatabase';
import { useAuthRole } from '../../hooks/useAuthRole';
import { Card, Badge, EmptyState } from '../common';
import {
  Colors,
  Spacing,
  FontSizes,
  BorderRadius,
  formatDate,
  formatTime,
} from '../../constants/theme';
import type { ClassSession, Subject } from '../../types';

export default function StudentPortalView() {
  const db = useDatabase();
  const { activeStudent } = useAuthRole();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [subjects, setSubjects] = useState<Record<string, Subject>>({});
  const [completedHomework, setCompletedHomework] = useState<Record<string, boolean>>({});

  const loadStudentData = useCallback(async () => {
    if (!activeStudent?.id) {
      setLoading(false);
      return;
    }
    try {
      const [classList, subjectList] = await Promise.all([
        db.getClassesByStudent(activeStudent.id),
        db.loadSubjects(),
      ]);

      const subMap: Record<string, Subject> = {};
      subjectList.forEach((s) => {
        subMap[s.id] = s;
      });
      setSubjects(subMap);
      setClasses(classList);
    } catch (e) {
      console.error('Error loading student portal data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeStudent?.id, db]);

  useEffect(() => {
    loadStudentData();
  }, [loadStudentData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadStudentData();
  };

  const toggleHomework = (classId: string) => {
    setCompletedHomework((prev) => ({
      ...prev,
      [classId]: !prev[classId],
    }));
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!activeStudent) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyTitle}>No hay alumno seleccionado</Text>
      </View>
    );
  }

  const upcomingClasses = classes
    .filter((c) => c.status === 'scheduled')
    .sort((a, b) => a.date.localeCompare(b.date));

  const classesWithHomework = classes.filter((c) => c.homework && c.homework.trim().length > 0);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header Estudiante */}
      <View style={styles.welcomeCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarLetter}>{activeStudent.firstName[0]}</Text>
        </View>
        <View style={styles.welcomeInfo}>
          <Text style={styles.welcomeGreeting}>¡Hola, {activeStudent.firstName}! 📚</Text>
          <Text style={styles.welcomeCourse}>
            {activeStudent.course || 'Estudiante'} • Tu portal de estudio
          </Text>
        </View>
      </View>

      {/* Mis Deberes y Tareas Asignadas */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="checkbox-outline" size={20} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Mis Deberes y Tareas</Text>
        </View>

        {classesWithHomework.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="sparkles" size={28} color={Colors.success} />
            <Text style={styles.emptyCardTitle}>¡Estás al día!</Text>
            <Text style={styles.emptyCardSub}>No tienes tareas pendientes asignadas.</Text>
          </Card>
        ) : (
          classesWithHomework.map((cls) => {
            const isDone = !!completedHomework[cls.id];
            const subject = subjects[cls.subjectId];
            return (
              <TouchableOpacity
                key={cls.id}
                style={[styles.taskCard, isDone && styles.taskCardDone]}
                activeOpacity={0.7}
                onPress={() => toggleHomework(cls.id)}
              >
                <TouchableOpacity
                  style={[styles.checkbox, isDone && styles.checkboxDone]}
                  onPress={() => toggleHomework(cls.id)}
                >
                  {isDone && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                </TouchableOpacity>

                <View style={styles.taskInfo}>
                  <View style={styles.taskSubjectRow}>
                    <Text style={styles.taskSubject}>{subject?.name || 'Clase particular'}</Text>
                    <Text style={styles.taskDate}>Para el {formatDate(cls.date)}</Text>
                  </View>
                  <Text style={[styles.taskText, isDone && styles.taskTextDone]}>
                    {cls.homework}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>

      {/* Próximas Clases Programadas */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
          <Text style={styles.sectionTitle}>Mis Próximas Clases</Text>
        </View>

        {upcomingClasses.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="cafe-outline" size={28} color={Colors.textTertiary} />
            <Text style={styles.emptyCardTitle}>Sin clases programadas</Text>
            <Text style={styles.emptyCardSub}>El profesor aún no ha agendado nuevas clases.</Text>
          </Card>
        ) : (
          upcomingClasses.map((cls) => {
            const subject = subjects[cls.subjectId];
            return (
              <Card key={cls.id} style={styles.classCard}>
                <View style={styles.classHeader}>
                  <View style={[styles.subjectIndicator, { backgroundColor: subject?.color || Colors.primary }]}>
                    <Ionicons name="book-outline" size={14} color="#FFFFFF" />
                  </View>
                  <View style={styles.classTitleInfo}>
                    <Text style={styles.classSubject}>{subject?.name || 'Clase Particular'}</Text>
                    <Text style={styles.classDate}>
                      {formatDate(cls.date)} • {formatTime(cls.startTime)} - {formatTime(cls.endTime)}
                    </Text>
                  </View>
                  <Badge text={`${cls.duration} min`} color={Colors.primary} backgroundColor={Colors.primaryBg} size="sm" />
                </View>

                {cls.notes ? (
                  <View style={styles.classNotesBox}>
                    <Ionicons name="information-circle-outline" size={14} color={Colors.textSecondary} />
                    <Text style={styles.classNotesText}>{cls.notes}</Text>
                  </View>
                ) : null}
              </Card>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 60,
    gap: Spacing.lg,
  },
  welcomeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D9488',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    gap: Spacing.md,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: FontSizes.xl,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  welcomeInfo: {
    flex: 1,
  },
  welcomeGreeting: {
    fontSize: FontSizes.lg,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  welcomeCourse: {
    fontSize: FontSizes.xs,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
    fontWeight: '500',
  },
  section: {
    gap: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: FontSizes.md,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.xs,
  },
  emptyCardTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 4,
  },
  emptyCardSub: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  taskCardDone: {
    backgroundColor: Colors.surfaceVariant,
    opacity: 0.7,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxDone: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  taskInfo: {
    flex: 1,
  },
  taskSubjectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  taskSubject: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.primary,
  },
  taskDate: {
    fontSize: 10,
    color: Colors.textTertiary,
  },
  taskText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  taskTextDone: {
    textDecorationLine: 'line-through',
    color: Colors.textTertiary,
  },
  classCard: {
    padding: Spacing.md,
    marginBottom: Spacing.xs,
  },
  classHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  subjectIndicator: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  classTitleInfo: {
    flex: 1,
  },
  classSubject: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  classDate: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  classNotesBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceVariant,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
  },
  classNotesText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emptyTitle: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
});
