import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDatabase } from '../../src/hooks/useDatabase';
import {
  Card,
  Badge,
  Avatar,
  Button,
  ConfirmDialog,
} from '../../src/components/common';
import {
  Colors,
  Spacing,
  FontSizes,
  BorderRadius,
  Shadows,
  formatCurrency,
  formatDate,
  formatDuration,
  getStatusColor,
  getStatusLabel,
  getLocationLabel,
} from '../../src/constants/theme';
import type { ClassSession, Student, Subject } from '../../src/types';

export default function ClassDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useDatabase();

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<ClassSession | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [subject, setSubject] = useState<Subject | null>(null);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    if (!id || id === 'new') return;
    try {
      const classData = await db.getClass(id);
      if (classData) {
        setSession(classData);
        const [studentData, subjectData] = await Promise.all([
          db.getStudent(classData.studentId),
          db.getSubject(classData.subjectId),
        ]);
        setStudent(studentData);
        setSubject(subjectData);
      }
    } catch (err) {
      console.error('Failed to load class detail:', err);
    } finally {
      setLoading(false);
    }
  }, [db, id]);

  useFocusEffect(
    useCallback(() => {
      if (id === 'new') {
        router.replace('/class/new');
        return;
      }
      loadData();
    }, [id, loadData, router])
  );

  const handleStatusChange = async (newStatus: ClassSession['status']) => {
    if (!session) return;
    try {
      await db.updateClass(session.id, { status: newStatus });
      setSession({ ...session, status: newStatus });
    } catch (err) {
      console.error('Error updating status:', err);
      Alert.alert('Error', 'No se pudo actualizar el estado de la clase.');
    }
  };

  const handleDelete = async () => {
    if (!session) return;
    setDeleting(true);
    try {
      await db.deleteClass(session.id);
      router.back();
    } catch (err) {
      console.error('Error deleting class:', err);
      Alert.alert('Error', 'No se pudo eliminar la clase.');
      setDeleting(false);
    }
  };

  if (loading || id === 'new') {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>No se encontró la clase.</Text>
        <Button title="Volver" onPress={() => router.back()} style={{ marginTop: Spacing.md }} />
      </View>
    );
  }

  const statusColor = getStatusColor(session.status);
  const statusLabel = getStatusLabel(session.status);
  const locationLabel = getLocationLabel(session.location);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalle de la Clase</Text>
        <TouchableOpacity
          onPress={() => setShowDeleteDialog(true)}
          style={styles.headerButton}
        >
          <Ionicons name="trash-outline" size={22} color={Colors.danger} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Badge & Subject */}
        <Card style={styles.mainCard}>
          <View style={styles.subjectRow}>
            <View
              style={[
                styles.subjectDot,
                { backgroundColor: subject?.color || Colors.primary },
              ]}
            />
            <View style={styles.subjectInfo}>
              <Text style={styles.subjectName}>{subject?.name || 'Clase'}</Text>
              <Text style={styles.subjectLevel}>{subject?.level || 'Particular'}</Text>
            </View>

            <Badge
              text={statusLabel}
              color={statusColor}
              backgroundColor={`${statusColor}18`}
            />
          </View>

          <View style={styles.divider} />

          {/* Student Profile Row */}
          {student && (
            <TouchableOpacity
              style={styles.studentRow}
              onPress={() => router.push(`/student/${student.id}`)}
              activeOpacity={0.7}
            >
              <Avatar
                firstName={student.firstName}
                lastName={student.lastName}
                color={student.avatarColor || Colors.primary}
                size={44}
              />
              <View style={styles.studentInfo}>
                <Text style={styles.studentName}>
                  {student.firstName} {student.lastName}
                </Text>
                <Text style={styles.studentMeta}>Tocar para ver perfil del alumno</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
            </TouchableOpacity>
          )}
        </Card>

        {/* Schedule & Financials Card */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Horario e Importe</Text>

          <View style={styles.infoGrid}>
            <View style={styles.gridItem}>
              <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
              <View>
                <Text style={styles.gridLabel}>Fecha</Text>
                <Text style={styles.gridValue}>{formatDate(session.date)}</Text>
              </View>
            </View>

            <View style={styles.gridItem}>
              <Ionicons name="time-outline" size={18} color={Colors.primary} />
              <View>
                <Text style={styles.gridLabel}>Horario</Text>
                <Text style={styles.gridValue}>
                  {session.startTime} - {session.endTime}
                </Text>
              </View>
            </View>

            <View style={styles.gridItem}>
              <Ionicons name="hourglass-outline" size={18} color={Colors.primary} />
              <View>
                <Text style={styles.gridLabel}>Duración</Text>
                <Text style={styles.gridValue}>{formatDuration(session.duration)}</Text>
              </View>
            </View>

            <View style={styles.gridItem}>
              <Ionicons name="location-outline" size={18} color={Colors.primary} />
              <View>
                <Text style={styles.gridLabel}>Modalidad</Text>
                <Text style={styles.gridValue}>{locationLabel}</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.priceRow}>
            <View>
              <Text style={styles.priceLabel}>Tarifa por hora</Text>
              <Text style={styles.priceSub}>{formatCurrency(session.rate)}/h</Text>
            </View>
            <View style={styles.totalBox}>
              <Text style={styles.totalBoxLabel}>Importe Total</Text>
              <Text style={styles.totalBoxAmount}>{formatCurrency(session.totalAmount)}</Text>
            </View>
          </View>
        </Card>

        {/* Notes & Homework */}
        {session.notes ? (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Notas</Text>
            <Text style={styles.bodyText}>{session.notes}</Text>
          </Card>
        ) : null}

        {session.homework ? (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Deberes Asignados</Text>
            <Text style={styles.bodyText}>{session.homework}</Text>
          </Card>
        ) : null}

        {/* Status Actions */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Cambiar Estado</Text>

          <View style={styles.actionButtonsCol}>
            {session.status !== 'completed' && (
              <Button
                title="Marcar como Completada"
                variant="primary"
                onPress={() => handleStatusChange('completed')}
                icon="checkmark-circle-outline"
              />
            )}

            {session.status !== 'scheduled' && (
              <Button
                title="Volver a Programada"
                variant="outline"
                onPress={() => handleStatusChange('scheduled')}
                icon="time-outline"
              />
            )}

            {session.status !== 'cancelled' && (
              <Button
                title="Marcar como Cancelada"
                variant="ghost"
                onPress={() => handleStatusChange('cancelled')}
                icon="close-circle-outline"
              />
            )}

            {session.status !== 'no-show' && (
              <Button
                title="No Asistió el Alumno"
                variant="ghost"
                onPress={() => handleStatusChange('no-show')}
                icon="alert-circle-outline"
              />
            )}
          </View>
        </Card>

        {/* Payment Action */}
        <Button
          title="Registrar Pago para este Alumno"
          variant="secondary"
          size="lg"
          onPress={() =>
            router.push({
              pathname: '/payment/new',
              params: {
                studentId: session.studentId,
                amount: session.totalAmount.toString(),
              },
            })
          }
          icon="cash-outline"
          style={{ marginTop: Spacing.xs }}
        />
      </ScrollView>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        visible={showDeleteDialog}
        title="Eliminar Clase"
        message="¿Estás seguro de que deseas eliminar esta clase? Esta acción no se puede deshacer."
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
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  mainCard: {
    padding: Spacing.lg,
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  subjectDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: FontSizes.xl,
    fontWeight: '800',
    color: Colors.text,
  },
  subjectLevel: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.text,
  },
  studentMeta: {
    fontSize: FontSizes.xs,
    color: Colors.primary,
    marginTop: 2,
  },
  card: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  gridItem: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  gridLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  gridValue: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  priceSub: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 2,
  },
  totalBox: {
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'flex-end',
  },
  totalBoxLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primaryDark,
    textTransform: 'uppercase',
  },
  totalBoxAmount: {
    fontSize: FontSizes.xl,
    fontWeight: '800',
    color: Colors.primary,
  },
  bodyText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  actionButtonsCol: {
    gap: Spacing.sm,
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
});
