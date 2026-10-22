import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
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
  formatCurrency,
  formatDate,
  formatTime,
  getLocationLabel,
} from '../../constants/theme';
import type { ClassSession, Subject, AppSettings } from '../../types';

export default function ParentPortalView() {
  const db = useDatabase();
  const { activeStudent } = useAuthRole();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [subjects, setSubjects] = useState<Record<string, Subject>>({});
  const [settings, setSettings] = useState<AppSettings | null>(null);

  const [balance, setBalance] = useState<{ charged: number; paid: number; pending: number }>({
    charged: 0,
    paid: 0,
    pending: 0,
  });

  const loadParentData = useCallback(async () => {
    if (!activeStudent?.id) {
      setLoading(false);
      return;
    }
    try {
      const [classList, subjectList, balData, sets] = await Promise.all([
        db.getClassesByStudent(activeStudent.id),
        db.loadSubjects(),
        db.getStudentBalance(activeStudent.id),
        db.loadSettings(),
      ]);

      const subMap: Record<string, Subject> = {};
      subjectList.forEach((s) => {
        subMap[s.id] = s;
      });
      setSubjects(subMap);
      setClasses(classList);
      setBalance(balData);
      setSettings(sets);
    } catch (e) {
      console.error('Error loading parent portal data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeStudent?.id, db]);

  useEffect(() => {
    loadParentData();
  }, [loadParentData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadParentData();
  };

  const handleBizumPrompt = () => {
    const teacherPhone = settings?.phone || '+34 600 000 000';
    const teacherName = settings?.teacherName || 'tu profesor';
    Alert.alert(
      'Pagar por Bizum',
      `Puedes realizar el Bizum de ${formatCurrency(balance.pending)} al teléfono:\n\n📱 ${teacherPhone}\n(${teacherName})\n\nConcepto: Clases ${activeStudent?.firstName}`,
      [{ text: 'Entendido' }]
    );
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
      {/* Header Familiar - Minimalista y limpio */}
      <View style={styles.welcomeCard}>
        <View style={styles.avatarCircle}>
          <Ionicons name="people" size={20} color={Colors.primary} />
        </View>
        <View style={styles.welcomeInfo}>
          <Text style={styles.welcomeGreeting}>Portal de Familias</Text>
          <Text style={styles.welcomeCourse}>
            {activeStudent.firstName} {activeStudent.lastName}
            {activeStudent.course ? ` • ${activeStudent.course}` : ''}
          </Text>
        </View>
      </View>

      {/* Recordatorio de Próxima Clase (con alerta y lugar destacado) */}
      {nextUpcomingClass && (
        <ClassReminderAlert
          session={nextUpcomingClass}
          student={activeStudent}
          subject={subjects[nextUpcomingClass.subjectId]}
          teacherName={settings?.teacherName}
          isStudentOrParentView={true}
        />
      )}

      {/* Estado de Pagos Simplificado (Sin total recaudado del profesor) */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="wallet-outline" size={18} color={Colors.textPrimary} />
          <Text style={styles.sectionTitle}>Estado de Pagos</Text>
        </View>

        {balance.pending > 0 ? (
          <View style={styles.pendingCard}>
            <View style={styles.pendingTop}>
              <View>
                <Text style={styles.pendingLabel}>Pendiente de abonar</Text>
                <Text style={styles.pendingAmount}>{formatCurrency(balance.pending)}</Text>
              </View>

              <TouchableOpacity
                style={styles.bizumBtn}
                activeOpacity={0.8}
                onPress={handleBizumPrompt}
              >
                <Ionicons name="phone-portrait-outline" size={15} color="#FFFFFF" />
                <Text style={styles.bizumBtnText}>Pagar Bizum</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.pendingSub}>
              Puedes abonar cómodamente por Bizum al profesor o en efectivo en la próxima clase.
            </Text>
          </View>
        ) : (
          <View style={styles.paidOkCard}>
            <View style={styles.paidOkIcon}>
              <Ionicons name="checkmark-circle" size={22} color={Colors.success} />
            </View>
            <View style={styles.paidOkTextContainer}>
              <Text style={styles.paidOkTitle}>Pagos al día</Text>
              <Text style={styles.paidOkSub}>No tienes ningún recibo o clase pendiente de abonar.</Text>
            </View>
          </View>
        )}
      </View>

      {/* Tareas y Deberes asignados para supervisión */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="book-outline" size={18} color={Colors.textPrimary} />
          <Text style={styles.sectionTitle}>Deberes Asignados para Casa</Text>
        </View>

        {classesWithHomework.length === 0 ? (
          <View style={styles.emptySimpleCard}>
            <Ionicons name="checkmark-circle-outline" size={22} color={Colors.success} />
            <Text style={styles.emptySimpleText}>Sin deberes pendientes asignados.</Text>
          </View>
        ) : (
          classesWithHomework.map((cls) => {
            const subject = subjects[cls.subjectId];
            return (
              <View key={cls.id} style={styles.taskCard}>
                <View style={styles.taskHeader}>
                  <Text style={styles.taskSubject}>{subject?.name || 'Clase particular'}</Text>
                  <Text style={styles.taskDate}>Para el {formatDate(cls.date)}</Text>
                </View>
                <Text style={styles.taskHomeworkText}>{cls.homework}</Text>
              </View>
            );
          })
        )}
      </View>

      {/* Calendario de Próximas Clases */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="calendar-outline" size={18} color={Colors.textPrimary} />
          <Text style={styles.sectionTitle}>Horario de Clases</Text>
        </View>

        {upcomingClasses.length === 0 ? (
          <View style={styles.emptySimpleCard}>
            <Ionicons name="calendar-outline" size={22} color={Colors.textTertiary} />
            <Text style={styles.emptySimpleText}>No hay próximas clases programadas.</Text>
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
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
  pendingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: Spacing.md,
  },
  pendingTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pendingLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#B45309',
    textTransform: 'uppercase',
  },
  pendingAmount: {
    fontSize: FontSizes.xl,
    fontWeight: '800',
    color: '#D97706',
    marginTop: 2,
  },
  pendingSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  bizumBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#8B5CF6',
    paddingVertical: 8,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  bizumBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: FontSizes.xs,
  },
  paidOkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  paidOkIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paidOkTextContainer: {
    flex: 1,
  },
  paidOkTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: '#059669',
  },
  paidOkSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
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
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: Spacing.md,
    marginBottom: 6,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  taskSubject: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  taskDate: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  taskHomeworkText: {
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
    lineHeight: 18,
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
