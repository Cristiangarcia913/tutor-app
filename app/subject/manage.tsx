import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDatabase } from '../../src/hooks/useDatabase';
import {
  Card,
  Input,
  Button,
  Badge,
  ConfirmDialog,
} from '../../src/components/common';
import {
  Colors,
  Spacing,
  FontSizes,
  BorderRadius,
  formatCurrency,
} from '../../src/constants/theme';
import type { Subject, SubjectFormData } from '../../src/types';

export default function ManageSubjectsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const db = useDatabase();

  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form fields for new subject
  const [name, setName] = useState('');
  const [level, setLevel] = useState('');
  const [defaultRate, setDefaultRate] = useState('20');
  const [selectedColor, setSelectedColor] = useState(Colors.subjectColors[0]);

  // Delete dialog state
  const [deleteSubjectId, setDeleteSubjectId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const list = await db.loadSubjects();
      setSubjects(list);
    } catch (err) {
      console.error('Error loading subjects:', err);
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateSubject = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Por favor introduce el nombre de la asignatura.');
      return;
    }

    setSaving(true);
    try {
      const data: SubjectFormData = {
        name: name.trim(),
        description: '',
        level: level.trim() || 'General',
        defaultRate: parseFloat(defaultRate) || 0,
        color: selectedColor,
        icon: 'book',
        active: true,
      };

      await db.createSubject(data);
      setName('');
      setLevel('');
      setShowAddForm(false);
      await loadData();
    } catch (err) {
      console.error('Error creating subject:', err);
      Alert.alert('Error', 'No se pudo guardar la asignatura.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSubject = async () => {
    if (!deleteSubjectId) return;
    try {
      await db.deleteSubject(deleteSubjectId);
      setDeleteSubjectId(null);
      await loadData();
    } catch (err) {
      console.error('Error deleting subject:', err);
      Alert.alert('Error', 'No se pudo eliminar la asignatura.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Asignaturas</Text>
        <TouchableOpacity
          onPress={() => setShowAddForm(!showAddForm)}
          style={styles.addButton}
        >
          <Ionicons
            name={showAddForm ? 'remove' : 'add'}
            size={24}
            color={Colors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={subjects}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 40 },
          ]}
          ListHeaderComponent={
            showAddForm ? (
              <Card style={styles.addCard}>
                <Text style={styles.formTitle}>Nueva Asignatura</Text>

                <Input
                  label="Nombre de la asignatura *"
                  value={name}
                  onChangeText={setName}
                  placeholder="Ej: Matemáticas, Física, Inglés..."
                />

                <Input
                  label="Nivel escolar"
                  value={level}
                  onChangeText={setLevel}
                  placeholder="Ej: Bachillerato, ESO, Primaria..."
                />

                <Input
                  label="Tarifa por defecto (€/hora)"
                  value={defaultRate}
                  onChangeText={setDefaultRate}
                  keyboardType="decimal-pad"
                  placeholder="20"
                />

                <Text style={styles.colorLabel}>Color identificativo</Text>
                <View style={styles.colorPalette}>
                  {Colors.subjectColors.map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorCircle,
                        { backgroundColor: color },
                        selectedColor === color && styles.colorCircleSelected,
                      ]}
                      onPress={() => setSelectedColor(color)}
                    >
                      {selectedColor === color && (
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.formActions}>
                  <Button
                    title="Cancelar"
                    variant="ghost"
                    onPress={() => setShowAddForm(false)}
                  />
                  <Button
                    title="Añadir Asignatura"
                    variant="primary"
                    loading={saving}
                    onPress={handleCreateSubject}
                  />
                </View>
              </Card>
            ) : null
          }
          renderItem={({ item }) => (
            <Card style={styles.subjectCard}>
              <View style={styles.subjectRow}>
                <View style={[styles.colorBadge, { backgroundColor: item.color }]} />

                <View style={styles.subjectInfo}>
                  <Text style={styles.subjectName}>{item.name}</Text>
                  <Text style={styles.subjectLevel}>{item.level}</Text>
                </View>

                <View style={styles.rateBadge}>
                  <Text style={styles.rateText}>{formatCurrency(item.defaultRate)}/h</Text>
                </View>

                <TouchableOpacity
                  onPress={() => setDeleteSubjectId(item.id)}
                  style={styles.deleteButton}
                >
                  <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                </TouchableOpacity>
              </View>
            </Card>
          )}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        visible={!!deleteSubjectId}
        title="Eliminar Asignatura"
        message="¿Estás seguro de que deseas eliminar esta asignatura?"
        confirmLabel="Eliminar"
        destructive
        onConfirm={handleDeleteSubject}
        onCancel={() => setDeleteSubjectId(null)}
      />
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
  addButton: {
    padding: Spacing.xs,
  },
  listContent: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  addCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
  },
  formTitle: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  colorLabel: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  colorPalette: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorCircleSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    elevation: 3,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.md,
  },
  subjectCard: {
    padding: Spacing.md,
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  colorBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.text,
  },
  subjectLevel: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  rateBadge: {
    backgroundColor: Colors.surfaceVariant,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  rateText: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.primary,
  },
  deleteButton: {
    padding: Spacing.xs,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
