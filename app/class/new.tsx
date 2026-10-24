import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDatabase } from '../../src/hooks/useDatabase';
import {
  Input,
  Button,
  Select,
  DatePicker,
  TimePicker,
} from '../../src/components/common';
import {
  Colors,
  Spacing,
  FontSizes,
  BorderRadius,
  formatCurrency,
} from '../../src/constants/theme';
import { generateRecurringClassDates } from '../../src/utils/academicCalendar';
import type { ClassSessionFormData, Student, Subject } from '../../src/types';

const DURATION_PRESETS = [
  { label: '45 min', minutes: 45 },
  { label: '1 hora', minutes: 60 },
  { label: '1h 30m', minutes: 90 },
  { label: '2 horas', minutes: 120 },
];

function calculateEndTime(start: string, durationMinutes: number): string {
  try {
    const [h, m] = start.split(':').map(Number);
    const total = h * 60 + m + durationMinutes;
    const endH = Math.floor(total / 60) % 24;
    const endM = total % 60;
    return `${endH < 10 ? '0' + endH : endH}:${endM < 10 ? '0' + endM : endM}`;
  } catch {
    return '18:00';
  }
}

export default function NewClassScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ studentId?: string; date?: string }>();
  const db = useDatabase();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // Form fields
  const [studentId, setStudentId] = useState(params.studentId || '');
  const [subjectId, setSubjectId] = useState('');
  const [date, setDate] = useState(params.date || new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('17:00');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [rate, setRate] = useState('20');
  const [notes, setNotes] = useState('');

  // Repetición y calendario académico
  const [repeatWeekly, setRepeatWeekly] = useState(false);
  const [repeatPeriod, setRepeatPeriod] = useState<'1month' | '3months' | 'course_end'>('1month');
  const [skipHolidays, setSkipHolidays] = useState(true);

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadOptions() {
      try {
        const [studentsList, subjectsList, settingsData] = await Promise.all([
          db.loadStudents(true),
          db.loadSubjects(true),
          db.loadSettings(),
        ]);

        setStudents(studentsList);
        setSubjects(subjectsList);

        if (subjectsList.length > 0) {
          setSubjectId(subjectsList[0].id);
          setRate(subjectsList[0].defaultRate.toString());
        } else if (settingsData?.defaultRate) {
          setRate(settingsData.defaultRate.toString());
        }

        if (params.studentId) {
          setStudentId(params.studentId);
        } else if (studentsList.length > 0) {
          setStudentId(studentsList[0].id);
        }
      } catch (err) {
        console.error('Failed to load form options:', err);
      } finally {
        setLoading(false);
      }
    }

    loadOptions();
  }, [db, params.studentId]);

  useEffect(() => {
    if (params.studentId) {
      setStudentId(params.studentId);
    }
  }, [params.studentId]);

  // Update rate when subject changes
  const handleSubjectChange = (newSubjectId: string) => {
    setSubjectId(newSubjectId);
    const sub = subjects.find((s) => s.id === newSubjectId);
    if (sub && sub.defaultRate > 0) {
      setRate(sub.defaultRate.toString());
    }
  };

  const endTime = useMemo(() => {
    return calculateEndTime(startTime, durationMinutes);
  }, [startTime, durationMinutes]);

  const recurrenceSchedule = useMemo(() => {
    if (!repeatWeekly) return null;
    return generateRecurringClassDates({
      startDate: date,
      frequency: 'weekly',
      period: repeatPeriod,
      skipHolidays,
    });
  }, [repeatWeekly, date, repeatPeriod, skipHolidays]);

  // Compute total amount
  const totalAmount = useMemo(() => {
    const hourlyRate = parseFloat(rate.replace(',', '.')) || 0;
    return (durationMinutes / 60) * hourlyRate;
  }, [durationMinutes, rate]);

  const handleSubmit = async () => {
    const errs: Record<string, string> = {};
    if (!studentId) errs.studentId = 'Selecciona un alumno';
    if (!subjectId) errs.subjectId = 'Selecciona una asignatura';
    if (!date) errs.date = 'Indica la fecha';
    if (!startTime) errs.startTime = 'Indica la hora';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const numericRate = parseFloat(rate.replace(',', '.')) || 0;

      if (repeatWeekly && recurrenceSchedule && recurrenceSchedule.validDates.length > 0) {
        const groupId = 'rec_' + Date.now();
        const batch: ClassSessionFormData[] = recurrenceSchedule.validDates.map((classDate) => ({
          studentId,
          subjectId,
          date: classDate,
          startTime,
          endTime,
          duration: durationMinutes,
          rate: numericRate,
          status: 'scheduled',
          location: 'presencial',
          notes: notes.trim(),
          homework: '',
          recurringGroupId: groupId,
        }));

        await db.createClassesBatch(batch);
        Alert.alert(
          'Clases Creadas',
          `Se han programado ${recurrenceSchedule.validDates.length} clases recurrentes.` +
            (recurrenceSchedule.skippedDates.length > 0
              ? `\n\nSe han saltado ${recurrenceSchedule.skippedDates.length} festivos escolares.`
              : '')
        );
      } else {
        const data: ClassSessionFormData = {
          studentId,
          subjectId,
          date,
          startTime,
          endTime,
          duration: durationMinutes,
          rate: numericRate,
          status: 'scheduled',
          location: 'presencial',
          notes: notes.trim(),
          homework: '',
        };

        await db.createClass(data);
      }

      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/classes');
      }
    } catch (error) {
      console.error('Error creating class:', error);
      Alert.alert('Error', 'No se pudo guardar la clase.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const studentOptions = students.map((s) => ({
    label: `${s.firstName} ${s.lastName}`,
    value: s.id,
  }));

  const subjectOptions = subjects.map((sub) => ({
    label: `${sub.name} (${sub.level || 'General'})`,
    value: sub.id,
  }));

  const locationOptions = [
    { label: 'Presencial', value: 'presencial' },
    { label: 'Online', value: 'online' },
    { label: 'A domicilio', value: 'domicilio' },
  ];

  const statusOptions = [
    { label: 'Programada', value: 'scheduled' },
    { label: 'Completada', value: 'completed' },
  ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/classes'))}
          style={styles.closeButton}
        >
          <Ionicons name="close" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nueva Clase</Text>
        <TouchableOpacity onPress={handleSubmit} disabled={saving} style={styles.saveButton}>
          {saving ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Text style={styles.saveButtonText}>Guardar</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.formContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Alumno & Asignatura */}
        <Select
          label="Alumno *"
          value={studentId}
          options={studentOptions}
          onSelect={(val) => {
            setStudentId(val);
            setErrors((prev) => ({ ...prev, studentId: '' }));
          }}
          placeholder="Seleccionar alumno..."
          error={errors.studentId}
        />

        <Select
          label="Asignatura *"
          value={subjectId}
          options={subjectOptions}
          onSelect={(val) => {
            handleSubjectChange(val);
            setErrors((prev) => ({ ...prev, subjectId: '' }));
          }}
          placeholder="Seleccionar asignatura..."
          error={errors.subjectId}
        />

        {/* Fecha y Hora */}
        <DatePicker
          label="Fecha *"
          value={date}
          onChange={(val) => {
            setDate(val);
            setErrors((prev) => ({ ...prev, date: '' }));
          }}
          error={errors.date}
        />

        <TimePicker
          label="Hora de Inicio *"
          value={startTime}
          onChange={(val) => {
            setStartTime(val);
            setErrors((prev) => ({ ...prev, startTime: '' }));
          }}
          error={errors.startTime}
        />

        {/* Duración rápida en 1 toque */}
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Duración de la clase</Text>
          <View style={styles.durationRow}>
            {DURATION_PRESETS.map((p) => {
              const isSelected = durationMinutes === p.minutes;
              return (
                <TouchableOpacity
                  key={p.minutes}
                  style={[
                    styles.durationChip,
                    isSelected && styles.durationChipActive,
                  ]}
                  onPress={() => setDurationMinutes(p.minutes)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.durationChipText,
                      isSelected && styles.durationChipTextActive,
                    ]}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Tarifa e Importe Calculado */}
        <View style={styles.row}>
          <View style={styles.flexHalf}>
            <Input
              label="Tarifa (€/hora) *"
              value={rate}
              onChangeText={setRate}
              keyboardType="decimal-pad"
              placeholder="Ej: 20"
            />
          </View>
          <View style={styles.flexHalf}>
            <View style={styles.totalPreview}>
              <Text style={styles.totalPreviewLabel}>
                {startTime} - {endTime} ({durationMinutes} min)
              </Text>
              <Text style={styles.totalPreviewAmount}>{formatCurrency(totalAmount)}</Text>
            </View>
          </View>
        </View>

        {/* Repetición y Calendario Académico */}
        <View style={styles.recurrenceCard}>
          <View style={styles.recurrenceToggleRow}>
            <View style={styles.recurrenceInfoCol}>
              <View style={styles.recurrenceBadgeRow}>
                <Ionicons name="repeat-outline" size={18} color={Colors.primary} />
                <Text style={styles.recurrenceTitle}>Repetir clase automáticamente</Text>
              </View>
              <Text style={styles.recurrenceSub}>
                Programa semanalmente respetando festivos escolares
              </Text>
            </View>
            <Switch
              value={repeatWeekly}
              onValueChange={setRepeatWeekly}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={repeatWeekly ? Colors.primary : Colors.surface}
            />
          </View>

          {repeatWeekly && (
            <View style={styles.recurrenceOptionsBox}>
              <Text style={styles.recurrenceOptionLabel}>¿Durante cuánto tiempo?</Text>
              <View style={styles.periodRow}>
                {[
                  { key: '1month', label: '1 Mes' },
                  { key: '3months', label: 'Trimestre' },
                  { key: 'course_end', label: 'Fin de Curso (Jun)' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.periodChip,
                      repeatPeriod === item.key && styles.periodChipActive,
                    ]}
                    onPress={() => setRepeatPeriod(item.key as any)}
                  >
                    <Text
                      style={[
                        styles.periodChipText,
                        repeatPeriod === item.key && styles.periodChipTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Toggle omitir festivos escolares */}
              <View style={styles.skipHolidaysRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.skipHolidaysTitle}>Respetar calendario escolar</Text>
                  <Text style={styles.skipHolidaysSub}>
                    Omitir festivos y vacaciones escolares de España
                  </Text>
                </View>
                <Switch
                  value={skipHolidays}
                  onValueChange={setSkipHolidays}
                  trackColor={{ false: Colors.border, true: '#BBF7D0' }}
                  thumbColor={skipHolidays ? Colors.success : Colors.surface}
                />
              </View>

              {/* Vista previa de fechas generadas */}
              {recurrenceSchedule && (
                <View style={styles.schedulePreviewBox}>
                  <View style={styles.schedulePreviewRow}>
                    <Ionicons name="calendar-outline" size={16} color={Colors.primary} />
                    <Text style={styles.schedulePreviewText}>
                      Se programarán <Text style={{ fontWeight: '800' }}>{recurrenceSchedule.validDates.length} clases</Text>
                    </Text>
                  </View>

                  {recurrenceSchedule.skippedDates.length > 0 && (
                    <View style={styles.scheduleSkippedRow}>
                      <Ionicons name="alert-circle-outline" size={16} color={Colors.warning} />
                      <Text style={styles.scheduleSkippedText}>
                        Se saltarán <Text style={{ fontWeight: '800' }}>{recurrenceSchedule.skippedDates.length} festivos</Text>: {recurrenceSchedule.skippedDates.map((s) => s.reason).slice(0, 2).join(', ')}
                        {recurrenceSchedule.skippedDates.length > 2 ? ' y más...' : ''}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Notas breves (opcional) */}
        <Input
          label="Notas (opcional)"
          value={notes}
          onChangeText={setNotes}
          placeholder="Ej: Tema 4 de matemáticas..."
        />

        <View style={styles.submitContainer}>
          <Button
            title="Crear Clase"
            onPress={handleSubmit}
            loading={saving}
            size="lg"
            fullWidth
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  saveButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  saveButtonText: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.primary,
  },
  formContent: {
    padding: Spacing.lg,
  },
  fieldBlock: {
    marginBottom: Spacing.lg,
  },
  fieldLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  durationRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  durationChip: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryBg,
  },
  durationChipText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  durationChipTextActive: {
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  recurrenceCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  recurrenceToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recurrenceInfoCol: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  recurrenceBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recurrenceTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  recurrenceSub: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  recurrenceOptionsBox: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  recurrenceOptionLabel: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  periodRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: Spacing.md,
  },
  periodChip: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryBg,
  },
  periodChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  periodChipTextActive: {
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  skipHolidaysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    marginBottom: Spacing.sm,
  },
  skipHolidaysTitle: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: '#166534',
  },
  skipHolidaysSub: {
    fontSize: 10,
    color: '#15803D',
    marginTop: 1,
  },
  schedulePreviewBox: {
    backgroundColor: Colors.surfaceVariant,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  schedulePreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  schedulePreviewText: {
    fontSize: FontSizes.xs,
    color: Colors.textPrimary,
  },
  scheduleSkippedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scheduleSkippedText: {
    fontSize: FontSizes.xs,
    color: Colors.warningDark || '#B45309',
    lineHeight: 16,
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  flexHalf: {
    flex: 1,
  },
  totalPreview: {
    backgroundColor: Colors.primaryBg,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    height: 72,
  },
  totalPreviewLabel: {
    fontSize: FontSizes.xs,
    color: Colors.primaryDark,
    fontWeight: '600',
    marginBottom: 2,
  },
  totalPreviewAmount: {
    fontSize: FontSizes.lg,
    fontWeight: '800',
    color: Colors.primary,
  },
  errorText: {
    fontSize: FontSizes.xs,
    color: Colors.danger,
    marginTop: -Spacing.xs,
    marginBottom: Spacing.sm,
  },
  submitContainer: {
    marginTop: Spacing.lg,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
