import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDatabase } from '../../src/hooks/useDatabase';
import { Input, Button } from '../../src/components/common';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '../../src/constants/theme';
import type { StudentFormData, ScheduleSlot } from '../../src/types';

const DAYS = [
  { id: 1, label: 'L', name: 'Lunes' },
  { id: 2, label: 'M', name: 'Martes' },
  { id: 3, label: 'X', name: 'Miércoles' },
  { id: 4, label: 'J', name: 'Jueves' },
  { id: 5, label: 'V', name: 'Viernes' },
  { id: 6, label: 'S', name: 'Sábado' },
  { id: 7, label: 'D', name: 'Domingo' },
];

const COMMON_HOURS = ['16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00'];
const COMMON_DURATIONS = [
  { value: 60, label: '1 hora (60m)' },
  { value: 90, label: '1h 30m (90m)' },
  { value: 120, label: '2 horas (120m)' },
];

export default function NewStudentScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { createStudent, generateMonthClassesForStudent } = useDatabase();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [course, setCourse] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [active, setActive] = useState(true);

  // Horario semanal asignado (slots por día con su propia hora)
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([
    { day: 1, time: '17:00' },
    { day: 3, time: '17:00' },
  ]);
  const [scheduleDuration, setScheduleDuration] = useState(60);
  const [scheduleRate, setScheduleRate] = useState('15');
  const [autoGenerateMonth, setAutoGenerateMonth] = useState(true);

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggleDay = (dayId: number) => {
    setScheduleSlots((prev) => {
      const exists = prev.some((s) => s.day === dayId);
      if (exists) {
        return prev.filter((s) => s.day !== dayId);
      } else {
        const lastTime = prev.length > 0 ? prev[prev.length - 1].time : '17:00';
        return [...prev, { day: dayId, time: lastTime }].sort((a, b) => a.day - b.day);
      }
    });
  };

  const updateSlotTime = (dayId: number, newTime: string) => {
    setScheduleSlots((prev) =>
      prev.map((s) => (s.day === dayId ? { ...s, time: newTime } : s))
    );
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!firstName.trim()) newErrors.firstName = 'El nombre es obligatorio';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const scheduleDays = scheduleSlots.map((s) => s.day);
      const data: StudentFormData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        course: course.trim() || undefined,
        phone: phone.trim(),
        address: address.trim() || undefined,
        parentName: parentName.trim() || undefined,
        parentPhone: parentPhone.trim() || undefined,
        email: '',
        notes: notes.trim(),
        active,
        scheduleSlots,
        scheduleDays,
        scheduleTime: scheduleSlots[0]?.time || '17:00',
        scheduleDuration,
        scheduleRate: parseFloat(scheduleRate) || 15,
      };

      const created = await createStudent(data);

      // Auto-generar clases si se eligió la opción y hay días asignados
      if (autoGenerateMonth && scheduleSlots.length > 0) {
        const now = new Date();
        await generateMonthClassesForStudent(created.id, now.getFullYear(), now.getMonth() + 1);
      }

      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/students');
      }
    } catch (error) {
      console.error('Error creating student:', error);
      Alert.alert('Error', 'No se pudo guardar el alumno. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/students'))}
          style={styles.closeButton}
        >
          <Ionicons name="close" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nuevo Alumno</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveButton}>
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
        <Text style={styles.sectionTitle}>Ficha del Alumno</Text>

        <Input
          label="Nombre *"
          value={firstName}
          onChangeText={(v) => {
            setFirstName(v);
            setErrors((prev) => ({ ...prev, firstName: '' }));
          }}
          placeholder="Ej: Alejandro"
          error={errors.firstName}
        />

        <Input
          label="Apellidos"
          value={lastName}
          onChangeText={setLastName}
          placeholder="Ej: Martínez Ruiz"
        />

        <Input
          label="Curso Escolar"
          value={course}
          onChangeText={setCourse}
          placeholder="Ej: 2º Bachillerato, 3º ESO, 1º Primaria..."
        />

        <Input
          label="Teléfono del Alumno"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder="+34 600 000 000"
        />

        <Input
          label="Dirección de la clase"
          value={address}
          onChangeText={setAddress}
          placeholder="Calle Mayor 14, 3ºB"
        />

        <Input
          label="Nombre de los Padres / Tutor"
          value={parentName}
          onChangeText={setParentName}
          placeholder="Ej: Carmen Ruiz (Madre)"
        />

        <Input
          label="Teléfono del Tutor (para WhatsApp y avisos)"
          value={parentPhone}
          onChangeText={setParentPhone}
          keyboardType="phone-pad"
          placeholder="+34 612 345 678"
        />

        {/* SECCIÓN HORARIO FIJO SEMANAL */}
        <View style={styles.scheduleSectionCard}>
          <View style={styles.scheduleSectionHeader}>
            <Ionicons name="calendar" size={20} color={Colors.primary} />
            <Text style={styles.scheduleSectionTitle}>Horario Semanal Asignado</Text>
          </View>
          <Text style={styles.scheduleSectionSubtitle}>
            Indica qué días de la semana y a qué hora dará clase para programarlas automáticamente sin caos.
          </Text>

          {/* Días de la semana */}
          <Text style={styles.scheduleFieldLabel}>Días de clase en la semana:</Text>
          <View style={styles.daysRow}>
            {DAYS.map((d) => {
              const isSelected = scheduleSlots.some((s) => s.day === d.id);
              return (
                <TouchableOpacity
                  key={d.id}
                  activeOpacity={0.7}
                  onPress={() => toggleDay(d.id)}
                  style={[styles.dayButton, isSelected && styles.dayButtonSelected]}
                >
                  <Text style={[styles.dayButtonText, isSelected && styles.dayButtonTextSelected]}>
                    {d.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.daysHelpText}>
            {scheduleSlots.length === 0
              ? 'Toca los días que dará clase el alumno'
              : `Clases los: ${DAYS.filter((d) => scheduleSlots.some((s) => s.day === d.id)).map((d) => d.name).join(', ')}`}
          </Text>

          {/* Horario específico por día seleccionado */}
          {scheduleSlots.length > 0 ? (
            <View style={styles.slotsContainer}>
              <Text style={styles.scheduleFieldLabel}>Hora para cada día (pueden ser distintas):</Text>
              {scheduleSlots.map((slot) => {
                const dayObj = DAYS.find((d) => d.id === slot.day);
                return (
                  <View key={slot.day} style={styles.slotCard}>
                    <View style={styles.slotCardHeader}>
                      <View style={styles.slotBadge}>
                        <Text style={styles.slotBadgeText}>{dayObj?.label}</Text>
                      </View>
                      <Text style={styles.slotDayName}>{dayObj?.name}</Text>
                      <View style={styles.slotTimeInputContainer}>
                        <Ionicons name="time-outline" size={16} color={Colors.primary} />
                        <TextInput
                          style={styles.slotTimeInput}
                          value={slot.time}
                          onChangeText={(val) => updateSlotTime(slot.day, val)}
                          placeholder="17:00"
                          placeholderTextColor={Colors.textTertiary}
                          maxLength={5}
                        />
                      </View>
                    </View>

                    {/* Chips rápidos de hora para este día específico */}
                    <View style={styles.quickHoursRow}>
                      {COMMON_HOURS.map((h) => {
                        const isSelectedHour = slot.time === h;
                        return (
                          <TouchableOpacity
                            key={h}
                            onPress={() => updateSlotTime(slot.day, h)}
                            style={[
                              styles.quickHourChip,
                              isSelectedHour && styles.quickHourChipSelected,
                            ]}
                          >
                            <Text
                              style={[
                                styles.quickHourText,
                                isSelectedHour && styles.quickHourTextSelected,
                              ]}
                            >
                              {h}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.noSlotsNotice}>
              <Ionicons name="information-circle-outline" size={18} color={Colors.textTertiary} />
              <Text style={styles.noSlotsText}>
                Selecciona al menos un día arriba para configurar el horario.
              </Text>
            </View>
          )}

          {/* Duración */}
          <Text style={[styles.scheduleFieldLabel, { marginTop: Spacing.sm }]}>Duración de la sesión:</Text>
          <View style={styles.durationRow}>
            {COMMON_DURATIONS.map((dur) => (
              <TouchableOpacity
                key={dur.value}
                onPress={() => setScheduleDuration(dur.value)}
                style={[
                  styles.durationChip,
                  scheduleDuration === dur.value && styles.durationChipSelected,
                ]}
              >
                <Text
                  style={[
                    styles.durationChipText,
                    scheduleDuration === dur.value && styles.durationChipTextSelected,
                  ]}
                >
                  {dur.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Precio / Tarifa */}
          <Input
            label="Precio por clase (€)"
            value={scheduleRate}
            onChangeText={setScheduleRate}
            keyboardType="numeric"
            placeholder="15"
          />

          {/* Auto-programar mes actual */}
          <View style={styles.autoGenSwitchRow}>
            <View style={{ flex: 1, marginRight: Spacing.sm }}>
              <Text style={styles.autoGenSwitchTitle}>Generar clases de este mes</Text>
              <Text style={styles.autoGenSwitchSub}>
                Crea automáticamente todas las clases de este mes en el calendario según estos días.
              </Text>
            </View>
            <Switch
              value={autoGenerateMonth}
              onValueChange={setAutoGenerateMonth}
              trackColor={{ false: Colors.border, true: '#86EFAC' }}
              thumbColor={autoGenerateMonth ? '#10B981' : Colors.surface}
            />
          </View>
        </View>

        <Input
          label="Notas adicionales (opcional)"
          value={notes}
          onChangeText={setNotes}
          placeholder="Observaciones, temario, etc."
          multiline
        />

        {/* Estado activo Switch */}
        <View style={styles.switchRow}>
          <View>
            <Text style={styles.switchLabel}>Alumno Activo</Text>
            <Text style={styles.switchSubtitle}>
              {active ? 'Recibe clases actualmente' : 'En pausa o baja'}
            </Text>
          </View>
          <Switch
            value={active}
            onValueChange={setActive}
            trackColor={{ false: Colors.border, true: Colors.primaryLight }}
            thumbColor={active ? Colors.primary : Colors.surface}
          />
        </View>

        <View style={styles.submitContainer}>
          <Button
            title="Crear Alumno"
            onPress={handleSave}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  saveButtonText: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.primary,
  },
  formContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  scheduleSectionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginVertical: Spacing.xs,
    ...Shadows.sm,
  },
  scheduleSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  scheduleSectionTitle: {
    fontSize: FontSizes.md,
    fontWeight: '800',
    color: Colors.text,
  },
  scheduleSectionSubtitle: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  scheduleFieldLabel: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dayButtonText: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  dayButtonTextSelected: {
    color: '#FFFFFF',
  },
  daysHelpText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  slotsContainer: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
    gap: 10,
  },
  slotCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  slotCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  slotBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  slotBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  slotDayName: {
    flex: 1,
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.text,
  },
  slotTimeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  slotTimeInput: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    width: 52,
    textAlign: 'center',
    padding: 0,
  },
  noSlotsNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  noSlotsText: {
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
  },
  quickHoursRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
    marginBottom: 2,
  },
  quickHourChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickHourChipSelected: {
    backgroundColor: Colors.primaryBg,
    borderColor: Colors.primary,
  },
  quickHourText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  quickHourTextSelected: {
    color: Colors.primary,
    fontWeight: '700',
  },
  durationRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.sm,
  },
  durationChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  durationChipSelected: {
    backgroundColor: Colors.primaryBg,
    borderColor: Colors.primary,
  },
  durationChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  durationChipTextSelected: {
    color: Colors.primary,
    fontWeight: '700',
  },
  autoGenSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginTop: Spacing.xs,
  },
  autoGenSwitchTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: '#166534',
  },
  autoGenSwitchSub: {
    fontSize: 11,
    color: '#15803D',
    marginTop: 2,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  switchLabel: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.text,
  },
  switchSubtitle: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  submitContainer: {
    marginTop: Spacing.sm,
  },
});
