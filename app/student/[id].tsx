import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDatabase } from '../../src/hooks/useDatabase';
import {
  Card,
  Badge,
  Avatar,
  EmptyState,
  SectionHeader,
  ConfirmDialog,
  StatCard,
} from '../../src/components/common';
import ClassCard from '../../src/components/classes/ClassCard';
import PaymentCard from '../../src/components/finances/PaymentCard';
import WhatsAppReportModal from '../../src/components/finances/WhatsAppReportModal';
import {
  Colors,
  Spacing,
  FontSizes,
  BorderRadius,
  formatCurrency,
  formatDate,
} from '../../src/constants/theme';
import type { Student, ClassSession, Payment, Subject, AppSettings } from '../../src/types';

export default function StudentDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useDatabase();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [student, setStudent] = useState<Student | null>(null);
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [subjects, setSubjects] = useState<Record<string, Subject>>({});

  const [balance, setBalance] = useState<{ charged: number; paid: number; pending: number }>({
    charged: 0,
    paid: 0,
    pending: 0,
  });

  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const loadData = useCallback(async () => {
    if (!id || id === 'new') return;
    try {
      const [studentData, classesData, paymentsData, subjectsData, balanceData, settingsData] =
        await Promise.all([
          db.getStudent(id),
          db.getClassesByStudent(id),
          db.getPaymentsByStudent(id),
          db.loadSubjects(),
          db.getStudentBalance(id),
          db.loadSettings(),
        ]);

      setStudent(studentData);
      setClasses(classesData);
      setPayments(paymentsData);
      setBalance(balanceData);
      setSettings(settingsData);

      const subMap: Record<string, Subject> = {};
      subjectsData.forEach((s) => {
        subMap[s.id] = s;
      });
      setSubjects(subMap);
    } catch (error) {
      console.error('Error loading student detail:', error);
      Alert.alert('Error', 'No se pudo cargar la información del alumno.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [db, id]);

  useFocusEffect(
    useCallback(() => {
      if (id === 'new') {
        router.replace('/student/new');
        return;
      }
      loadData();
    }, [id, loadData, router])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const [generatingClasses, setGeneratingClasses] = useState(false);

  const handleTogglePaid = async (session: ClassSession) => {
    try {
      await db.toggleClassPaid(session.id);
      await loadData();
    } catch (e) {
      console.error('Error toggling class paid status:', e);
    }
  };

  const handleGenerateMonthClasses = async (targetMonthOffset = 0) => {
    if (!student || !student.scheduleDays || student.scheduleDays.length === 0) {
      Alert.alert(
        'Sin horario asignado',
        'Edita el alumno para configurar qué días de la semana tiene clase y su hora.'
      );
      return;
    }
    setGeneratingClasses(true);
    try {
      const now = new Date();
      let targetYear = now.getFullYear();
      let targetMonth = now.getMonth() + 1 + targetMonthOffset;
      if (targetMonth > 12) {
        targetMonth = 1;
        targetYear++;
      }
      const created = await db.generateMonthClassesForStudent(student.id, targetYear, targetMonth);
      Alert.alert(
        '¡Clases Programadas!',
        `Se han programado automáticamente ${created.length} clases para el mes según su horario habitual.`
      );
      await loadData();
    } catch (e) {
      console.error('Error generating classes:', e);
      Alert.alert('Error', 'No se pudieron generar las clases.');
    } finally {
      setGeneratingClasses(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await db.deleteStudent(id);
      router.back();
    } catch (error) {
      console.error('Error deleting student:', error);
      Alert.alert('Error', 'No se pudo eliminar el alumno.');
    } finally {
      setShowDeleteDialog(false);
    }
  };

  if (loading || id === 'new') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!student) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Alumno no encontrado.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const fullName = `${student.firstName} ${student.lastName}`;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {fullName}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => router.push(`/student/edit/${id}`)}
            style={styles.headerButton}
          >
            <Ionicons name="pencil-outline" size={22} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowDeleteDialog(true)}
            style={styles.headerButton}
          >
            <Ionicons name="trash-outline" size={22} color={Colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.avatarRow}>
            <Avatar
              firstName={student.firstName}
              lastName={student.lastName}
              color={student.avatarColor || Colors.primary}
              size={64}
            />
            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.studentName}>{fullName}</Text>
                <Badge
                  text={student.active ? 'Activo' : 'Inactivo'}
                  color={student.active ? Colors.success : Colors.textTertiary}
                  backgroundColor={student.active ? Colors.completedBg : Colors.surfaceVariant}
                  size="sm"
                />
              </View>

              {student.course ? (
                <View style={[styles.metaRow, { marginTop: 4 }]}>
                  <Ionicons name="school-outline" size={14} color={Colors.primary} />
                  <Text style={[styles.metaText, { color: Colors.primary, fontWeight: '700' }]}>
                    {student.course}
                  </Text>
                </View>
              ) : null}

              {student.phone ? (
                <View style={styles.metaRow}>
                  <Ionicons name="call-outline" size={14} color={Colors.textSecondary} />
                  <Text style={styles.metaText}>{student.phone}</Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Contact Details Grid */}
          <View style={styles.detailsGrid}>
            {student.course ? (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Curso Escolar</Text>
                <Text style={[styles.detailValue, { fontWeight: '700' }]}>{student.course}</Text>
              </View>
            ) : null}

            {student.phone ? (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Teléfono</Text>
                <Text style={styles.detailValue}>{student.phone}</Text>
              </View>
            ) : null}

            {student.address && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Dirección</Text>
                <Text style={styles.detailValue}>{student.address}</Text>
              </View>
            )}

            {student.parentName && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Padres / Tutor</Text>
                <Text style={styles.detailValue}>{student.parentName}</Text>
              </View>
            )}

            {student.parentPhone && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Teléfono del Tutor (WhatsApp)</Text>
                <Text style={[styles.detailValue, { color: Colors.primary, fontWeight: '700' }]}>
                  {student.parentPhone}
                </Text>
              </View>
            )}

            {student.notes && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Notas / Observaciones</Text>
                <Text style={styles.detailValue}>{student.notes}</Text>
              </View>
            )}
          </View>
        </Card>

        {/* Horario Habitual Asignado Card */}
        <Card style={styles.scheduleCard}>
          <View style={styles.scheduleCardHeader}>
            <View style={styles.scheduleIconCircle}>
              <Ionicons name="calendar" size={20} color="#4F46E5" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.scheduleCardTitle}>Horario Semanal Asignado</Text>
              <Text style={styles.scheduleCardSub}>
                {student.scheduleDays && student.scheduleDays.length > 0
                  ? `Clases los ${student.scheduleDays
                      .map((d) => ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'][d - 1])
                      .join(' y ')} a las ${student.scheduleTime || '17:00'} (${student.scheduleDuration || 60}m)`
                  : 'Sin días semanales fijos asignados aún.'}
              </Text>
            </View>
          </View>

          {student.scheduleDays && student.scheduleDays.length > 0 ? (
            <View style={styles.scheduleActionsRow}>
              <View style={styles.scheduleRateBadge}>
                <Text style={styles.scheduleRateBadgeText}>
                  {formatCurrency(student.scheduleRate || 15)} / clase
                </Text>
              </View>

              <TouchableOpacity
                style={styles.generateClassesButton}
                activeOpacity={0.85}
                disabled={generatingClasses}
                onPress={() => handleGenerateMonthClasses(0)}
              >
                {generatingClasses ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={14} color="#FFFFFF" />
                    <Text style={styles.generateClassesButtonText}>Programar Mes Actual</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.configScheduleBtn}
              onPress={() => router.push(`/student/edit/${id}`)}
            >
              <Ionicons name="add-circle-outline" size={16} color={Colors.primary} />
              <Text style={styles.configScheduleBtnText}>Asignar días y hora de clase</Text>
            </TouchableOpacity>
          )}
        </Card>

        {/* WhatsApp Monthly Breakdown & Billing Card */}
        <Card style={styles.whatsAppCard}>
          <View style={styles.whatsAppCardHeader}>
            <View style={styles.whatsAppIconCircle}>
              <Ionicons name="logo-whatsapp" size={22} color="#FFFFFF" />
            </View>
            <View style={styles.whatsAppCardInfo}>
              <Text style={styles.whatsAppCardTitle}>Resumen y Cobro por WhatsApp</Text>
              <Text style={styles.whatsAppCardSub}>
                Envía al tutor el desglose mensual de clases (impartidas, canceladas) y el importe total a abonar.
              </Text>
            </View>
          </View>

          <View style={styles.whatsAppTutorRow}>
            <View style={styles.whatsAppTutorInfo}>
              <Text style={styles.whatsAppTutorLabel}>Tutor asignado:</Text>
              <Text style={styles.whatsAppTutorValue} numberOfLines={1}>
                {student.parentName || 'Familia'} • {student.parentPhone || student.phone || 'Sin teléfono'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.openWhatsAppModalBtn}
              activeOpacity={0.85}
              onPress={() => setShowWhatsAppModal(true)}
            >
              <Ionicons name="paper-plane" size={14} color="#FFFFFF" />
              <Text style={styles.openWhatsAppModalBtnText}>Enviar Resumen</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Financial Balance Summary */}
        <View style={styles.statsRow}>
          <View style={styles.statCol}>
            <StatCard
              title="Clases"
              value={classes.length}
              icon="calendar-outline"
              color={Colors.primary}
            />
          </View>
          <View style={styles.statCol}>
            <StatCard
              title="Cobrado"
              value={formatCurrency(balance.paid)}
              icon="checkmark-done-outline"
              color={Colors.success}
            />
          </View>
          <View style={styles.statCol}>
            <StatCard
              title="Pendiente"
              value={formatCurrency(balance.pending)}
              icon="alert-circle-outline"
              color={balance.pending > 0 ? Colors.warning : Colors.textTertiary}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionBtnPrimary}
            onPress={() =>
              router.push({
                pathname: '/class/new',
                params: { studentId: student.id },
              })
            }
          >
            <Ionicons name="calendar-outline" size={18} color="#FFFFFF" />
            <Text style={styles.actionBtnPrimaryText}>Nueva Clase</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtnSecondary}
            onPress={() =>
              router.push({
                pathname: '/payment/new',
                params: {
                  studentId: student.id,
                  amount: balance.pending > 0 ? balance.pending.toString() : '',
                },
              })
            }
          >
            <Ionicons name="cash-outline" size={18} color={Colors.primary} />
            <Text style={styles.actionBtnSecondaryText}>Registrar Pago</Text>
          </TouchableOpacity>
        </View>

        {/* Classes History Section */}
        <SectionHeader
          title={`Clases (${classes.length})`}
          actionLabel="Ver todas"
          onAction={() => router.push('/(tabs)/classes')}
        />

        {classes.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title="Sin clases registradas"
            description="Programa la primera clase particular para este alumno."
          />
        ) : (
          classes.slice(0, 5).map((session) => (
            <ClassCard
              key={session.id}
              session={session}
              subject={subjects[session.subjectId]}
              showStudentName={false}
              onPress={() => router.push(`/class/${session.id}`)}
              onTogglePaid={() => handleTogglePaid(session)}
            />
          ))
        )}

        {/* Payments History Section */}
        <SectionHeader
          title={`Pagos (${payments.length})`}
          actionLabel="Ver todos"
          onAction={() => router.push('/(tabs)/finances')}
        />

        {payments.length === 0 ? (
          <EmptyState
            icon="wallet-outline"
            title="Sin pagos registrados"
            description="No se ha registrado ningún pago para este alumno."
          />
        ) : (
          payments.slice(0, 5).map((payment) => (
            <PaymentCard
              key={payment.id}
              payment={payment}
              showStudentName={false}
              onPress={() => router.push(`/payment/${payment.id}`)}
            />
          ))
        )}
      </ScrollView>

      {/* Delete Confirmation */}
      <ConfirmDialog
        visible={showDeleteDialog}
        title="Eliminar Alumno"
        message={`¿Estás seguro de que deseas eliminar a ${fullName}? Se conservará el historial para estadísticas.`}
        confirmLabel="Eliminar"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />

      {/* WhatsApp Monthly Report Modal */}
      {student && (
        <WhatsAppReportModal
          visible={showWhatsAppModal}
          onClose={() => setShowWhatsAppModal(false)}
          student={student}
          classes={classes}
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
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
    marginHorizontal: Spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  profileCard: {
    padding: Spacing.lg,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  profileInfo: {
    flex: 1,
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  studentName: {
    fontSize: FontSizes.lg,
    fontWeight: '800',
    color: Colors.text,
    flexShrink: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  whatsAppCard: {
    padding: Spacing.md,
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    borderWidth: 1,
  },
  whatsAppCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  whatsAppIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
  },
  whatsAppCardInfo: {
    flex: 1,
  },
  whatsAppCardTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '800',
    color: '#15803D',
  },
  whatsAppCardSub: {
    fontSize: 11,
    color: '#166534',
    marginTop: 1,
    lineHeight: 15,
  },
  whatsAppTutorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    gap: Spacing.xs,
  },
  whatsAppTutorInfo: {
    flex: 1,
  },
  whatsAppTutorLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  whatsAppTutorValue: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 1,
  },
  openWhatsAppModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#25D366',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
  },
  openWhatsAppModalBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: FontSizes.xs,
  },
  detailsGrid: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: Spacing.sm,
  },
  detailItem: {
    gap: 2,
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: FontSizes.sm,
    color: Colors.text,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  statCol: {
    flex: 1,
  },
  quickActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
  },
  actionBtnPrimaryText: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
  },
  actionBtnSecondaryText: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.primary,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: FontSizes.md,
    color: Colors.danger,
  },
  backButton: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scheduleCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    padding: Spacing.md,
  },
  scheduleCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  scheduleIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleCardTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '800',
    color: Colors.text,
  },
  scheduleCardSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  scheduleActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  scheduleRateBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
  },
  scheduleRateBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  generateClassesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
  },
  generateClassesButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  configScheduleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.sm,
    paddingVertical: 6,
  },
  configScheduleBtnText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 12,
  },
});
