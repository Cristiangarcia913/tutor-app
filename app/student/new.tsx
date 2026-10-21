import React, { useState } from 'react';
import {
  View,
  Text,
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
import { Colors, Spacing, FontSizes, BorderRadius } from '../../src/constants/theme';
import type { StudentFormData } from '../../src/types';

export default function NewStudentScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { createStudent } = useDatabase();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [course, setCourse] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [parentName, setParentName] = useState('');
  const [notes, setNotes] = useState('');
  const [active, setActive] = useState(true);

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
      const data: StudentFormData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        course: course.trim() || undefined,
        phone: phone.trim(),
        address: address.trim() || undefined,
        parentName: parentName.trim() || undefined,
        email: '',
        notes: notes.trim(),
        active,
      };

      await createStudent(data);
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
          label="Dirección"
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
  sectionTitle: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  switchLabel: {
    fontSize: FontSizes.sm,
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
