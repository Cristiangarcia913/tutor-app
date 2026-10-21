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
import {
  Colors,
  Spacing,
  FontSizes,
  BorderRadius,
  formatCurrency,
  formatDate,
} from '../../src/constants/theme';
import type { Student, ClassSession, Payment, Subject } from '../../src/types';

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

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const loadData = useCallback(async () => {
    if (!id || id === 'new') return;
    try {
      const [studentData, classesData, paymentsData, subjectsData, balanceData] =
        await Promise.all([
          db.getStudent(id),
          db.getClassesByStudent(id),
          db.getPaymentsByStudent(id),
          db.loadSubjects(),
          db.getStudentBalance(id),
        ]);

      setStudent(studentData);
      setClasses(classesData);
      setPayments(paymentsData);
      setBalance(balanceData);

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

            {student.notes && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Notas / Observaciones</Text>
                <Text style={styles.detailValue}>{student.notes}</Text>
              </View>
            )}
          </View>
        </Card>

        {/* Access Code Card for Student & Parent Portal */}
        <Card style={styles.accessCodeCard}>
          <View style={styles.accessCodeHeader}>
            <View style={styles.accessCodeIconBox}>
              <Ionicons name="key-outline" size={18} color={Colors.primary} />
            </View>
            <View style={styles.accessCodeInfo}>
              <Text style={styles.accessCodeTitle}>Código de Acceso Alumno y Familias</Text>
              <Text style={styles.accessCodeSub}>
                Compártelo para que puedan consultar sus clases, tareas y pagos
              </Text>
            </View>
          </View>

          <View style={styles.accessCodeRow}>
            <View style={styles.accessCodeBadge}>
              <Text style={styles.accessCodeValue}>{student.accessCode || 'ALE-4819'}</Text>
            </View>
            <TouchableOpacity
              style={styles.copyCodeButton}
              onPress={() => {
                Alert.alert(
                  'Código de Acceso',
                  `Código para ${student.firstName}: ${student.accessCode || 'ALE-4819'}\n\nLos padres o el alumno pueden introducir este código en la app para acceder a su portal.`
                );
              }}
            >
              <Ionicons name="share-social-outline" size={16} color="#FFFFFF" />
              <Text style={styles.copyCodeButtonText}>Compartir</Text>
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
  accessCodeCard: {
    padding: Spacing.md,
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
    borderWidth: 1,
  },
  accessCodeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  accessCodeIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accessCodeInfo: {
    flex: 1,
  },
  accessCodeTitle: {
    fontSize: FontSizes.xs,
    fontWeight: '800',
    color: '#3730A3',
  },
  accessCodeSub: {
    fontSize: 10,
    color: '#4F46E5',
    marginTop: 1,
  },
  accessCodeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  accessCodeBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
  },
  accessCodeValue: {
    fontSize: FontSizes.md,
    fontWeight: '900',
    color: '#3730A3',
    letterSpacing: 1,
  },
  copyCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  copyCodeButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
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
});
