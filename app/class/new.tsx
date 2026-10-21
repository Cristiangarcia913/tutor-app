import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
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
import type { ClassSessionFormData, Student, Subject } from '../../src/types';

export default function NewClassScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ studentId?: string }>();
  const db = useDatabase();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // Form fields
  const [studentId, setStudentId] = useState(params.studentId || '');
  const [subjectId, setSubjectId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('16:00');
  const [endTime, setEndTime] = useState('17:00');
  const [rate, setRate] = useState('20');
  const [location, setLocation] = useState<'presencial' | 'online' | 'domicilio'>('presencial');
  const [status, setStatus] = useState<'scheduled' | 'completed'>('scheduled');
  const [notes, setNotes] = useState('');
  const [homework, setHomework] = useState('');

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

  // Compute duration in minutes
  const duration = useMemo(() => {
    try {
      const [startH, startM] = startTime.split(':').map(Number);
      const [endH, endM] = endTime.split(':').map(Number);
      const startMin = startH * 60 + startM;
      const endMin = endH * 60 + endM;
      return Math.max(endMin - startMin, 0);
    } catch {
      return 60;
    }
  }, [startTime, endTime]);

  // Compute total amount
  const totalAmount = useMemo(() => {
    const hourlyRate = parseFloat(rate.replace(',', '.')) || 0;
    return (duration / 60) * hourlyRate;
  }, [duration, rate]);

  const handleSubmit = async () => {
    const errs: Record<string, string> = {};
    if (!studentId) errs.studentId = 'Selecciona un alumno';
    if (!subjectId) errs.subjectId = 'Selecciona una asignatura';
    if (!date) errs.date = 'Indica la fecha';
    if (!startTime) errs.startTime = 'Indica la hora de inicio';
    if (!endTime) errs.endTime = 'Indica la hora de fin';
    if (duration <= 0) errs.time = 'La hora de fin debe ser posterior a la de inicio';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const numericRate = parseFloat(rate.replace(',', '.')) || 0;
      const data: ClassSessionFormData = {
        studentId,
        subjectId,
        date,
        startTime,
        endTime,
        duration,
        rate: numericRate,
        status,
        location,
        notes: notes.trim(),
        homework: homework.trim(),
      };

      await db.createClass(data);
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

        {/* Fecha y Horarios */}
        <DatePicker
          label="Fecha *"
          value={date}
          onChange={(val) => {
            setDate(val);
            setErrors((prev) => ({ ...prev, date: '' }));
          }}
          error={errors.date}
        />

        <View style={styles.row}>
          <View style={styles.flexHalf}>
            <TimePicker
              label="Hora Inicio *"
              value={startTime}
              onChange={(val) => {
                setStartTime(val);
                setErrors((prev) => ({ ...prev, startTime: '' }));
              }}
              error={errors.startTime}
            />
          </View>
          <View style={styles.flexHalf}>
            <TimePicker
              label="Hora Fin *"
              value={endTime}
              onChange={(val) => {
                setEndTime(val);
                setErrors((prev) => ({ ...prev, endTime: '' }));
              }}
              error={errors.endTime}
            />
          </View>
        </View>

        {errors.time && <Text style={styles.errorText}>{errors.time}</Text>}

        {/* Tarifa y Duración Calculada */}
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
              <Text style={styles.totalPreviewLabel}>Duración: {duration} min</Text>
              <Text style={styles.totalPreviewAmount}>{formatCurrency(totalAmount)}</Text>
            </View>
          </View>
        </View>

        {/* Modalidad y Estado */}
        <Select
          label="Modalidad"
          value={location}
          options={locationOptions}
          onSelect={(val) => setLocation(val as any)}
        />

        <Select
          label="Estado inicial"
          value={status}
          options={statusOptions}
          onSelect={(val) => setStatus(val as any)}
        />

        {/* Notas y Deberes */}
        <Input
          label="Notas de la clase"
          value={notes}
          onChangeText={setNotes}
          placeholder="Temas a tratar, preparación, observaciones..."
          multiline
        />

        <Input
          label="Deberes o tareas asignadas"
          value={homework}
          onChangeText={setHomework}
          placeholder="Ejercicios para la próxima clase..."
          multiline
        />

        <View style={styles.submitContainer}>
          <Button
            title="Guardar Clase"
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
