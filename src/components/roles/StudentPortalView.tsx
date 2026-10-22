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
import { Card, Badge } from '../common';
import ClassReminderAlert from '../classes/ClassReminderAlert';
import {
  Colors,
  Spacing,
  FontSizes,
  BorderRadius,
  formatDate,
  formatTime,
  getLocationLabel,
} from '../../constants/theme';
import type { ClassSession, Subject, AppSettings } from '../../types';

export default function StudentPortalView() {
  const db = useDatabase();
  const { activeStudent } = useAuthRole();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [subjects, setSubjects] = useState<Record<string, Subject>>({});
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [completedHomework, setCompletedHomework] = useState<Record<string, boolean>>({});

  const loadStudentData = useCallback(async () => {
    if (!activeStudent?.id) {
      setLoading(false);
      return;
    }
    try {
      const [classList, subjectList, sets] = await Promise.all([
        db.getClassesByStudent(activeStudent.id),
        db.loadSubjects(),
        db.loadSettings(),
      ]);

      const subMap: Record<string, Subject> = {};
      subjectList.forEach((s) => {
        subMap[s.id] = s;
      });
      setSubjects(subMap);
      setClasses(classList);
      setSettings(sets);
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
    .sort((a, b) => `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`));

  const nextUpcomingClass = upcomingClasses.length > 0 ? upcomingClasses[0] : null;

  const classesWithHomework = classes.filter((c) => c.homework && c.homework.trim().length > 0);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header Estudiante - Limpio y personal */}
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

      {/* Recordatorio Alerta de Próxima Clase (con lugar y botón de notificación) */}
      {nextUpcomingClass && (
        <ClassReminderAlert
          session={nextUpcomingClass}
          student={activeStudent}
          subject={subjects[nextUpcomingClass.subjectId]}
          teacherName={settings?.teacherName}
          isStudentOrParentView={true}
        />
      )}

      {/* Mis Deberes y Tareas Asignadas */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="checkbox-outline" size={18} color={Colors.textPrimary} />
          <Text style={styles.sectionTitle}>Mis Tareas y Deberes</Text>
        </View>

        {classesWithHomework.length === 0 ? (
          <View style={styles.emptySimpleCard}>
            <Ionicons name="sparkles-outline" size={20} color={Colors.success} />
            <Text style={styles.emptySimpleText}>¡Estás al día! No tienes tareas pendientes asignadas.</Text>
          </View>
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
                  {isDone && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
                </TouchableOpacity>

                <View style={styles.taskInfo}>
                  <View style={styles.taskSubjectRow}>
                    <Text style={[styles.taskSubject, isDone && styles.taskSubjectDone]}>
                      {subject?.name || 'Clase particular'}
                    </Text>
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
          <Ionicons name="calendar-outline" size={18} color={Colors.textPrimary} />
          <Text style={styles.sectionTitle}>Mis Próximas Clases</Text>
        </View>

        {upcomingClasses.length === 0 ? (
          <View style={styles.emptySimpleCard}>
            <Ionicons name="calendar-outline" size={20} color={Colors.textTertiary} />
            <Text style={styles.emptySimpleText}>No tienes clases programadas próximamente.</Text>
          </View>
        ) : (
          upcomingClasses.map((cls) => {
            const subject = subjects[cls.subjectId];
            const isOnline = cls.location === 'online';
            const isHome = cls.location === 'domicilio';

            return (
              <View key={cls.id} style={styles.classCard}>
                <View style={styles.classHeader}>
                  <View style={styles.classTitleInfo}>
                    <Text style={styles.classSubject}>{subject?.name || 'Clase Particular'}</Text>
                    <Text style={styles.classDate}>
                      {formatDate(cls.date)} • {formatTime(cls.startTime)} - {formatTime(cls.endTime)}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.locationTag,
                      {
                        backgroundColor: isOnline ? '#EFF6FF' : isHome ? '#FFFBEB' : '#ECFDF5',
                      },
                    ]}
                  >
                    <Ionicons
                      name={isOnline ? 'videocam-outline' : isHome ? 'home-outline' : 'location-outline'}
                      size={12}
                      color={isOnline ? '#2563EB' : isHome ? '#D97706' : '#059669'}
                    />
                    <Text
                      style={[
                        styles.locationTagText,
                        {
                          color: isOnline ? '#2563EB' : isHome ? '#D97706' : '#059669',
                        },
                      ]}
                    >
                      {getLocationLabel(cls.location)}
                    </Text>
                  </View>
                </View>

                {cls.notes ? (
                  <View style={styles.classNotesBox}>
                    <Text style={styles.classNotesText}>{cls.notes}</Text>
                  </View>
                ) : null}
              </View>
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
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: Spacing.md,
    paddingBottom: 70,
    gap: Spacing.md,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: '#F8FAFC',
  },
  emptyTitle: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  welcomeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: Spacing.sm,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: FontSizes.md,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  welcomeInfo: {
    flex: 1,
  },
  welcomeGreeting: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  welcomeCourse: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  section: {
    gap: Spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  emptySimpleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  emptySimpleText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: 6,
  },
  taskCardDone: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    opacity: 0.75,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    backgroundColor: '#FFFFFF',
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
    color: Colors.textPrimary,
  },
  taskSubjectDone: {
    textDecorationLine: 'line-through',
    color: Colors.textSecondary,
  },
  taskDate: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  taskText: {
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  taskTextDone: {
    textDecorationLine: 'line-through',
    color: Colors.textSecondary,
  },
  classCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: Spacing.md,
    marginBottom: 6,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  locationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
  },
  locationTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  classNotesBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.xs,
    padding: 6,
    marginTop: 6,
  },
  classNotesText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
});
