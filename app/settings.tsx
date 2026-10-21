import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useDatabase } from '../src/hooks/useDatabase';
import {
  Card,
  Input,
  Button,
  ConfirmDialog,
} from '../src/components/common';
import {
  Colors,
  Spacing,
  FontSizes,
  BorderRadius,
} from '../src/constants/theme';
import type { AppSettings } from '../src/types';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const db = useDatabase();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Settings state
  const [teacherName, setTeacherName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [defaultRate, setDefaultRate] = useState('20');

  // Dialogs
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const s = await db.loadSettings();
      if (s) {
        setTeacherName(s.teacherName || '');
        setBusinessName(s.businessName || '');
        setEmail(s.email || '');
        setPhone(s.phone || '');
        setDefaultRate(s.defaultRate ? s.defaultRate.toString() : '20');
      }
    } catch (e) {
      console.error('Error loading settings:', e);
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await db.updateSettings({
        teacherName: teacherName.trim(),
        businessName: businessName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        defaultRate: parseFloat(defaultRate) || 0,
      });
      Alert.alert('Guardado', 'Los ajustes se han actualizado correctamente.');
    } catch (e) {
      console.error('Error saving settings:', e);
      Alert.alert('Error', 'No se pudieron guardar los ajustes.');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    try {
      const data = await db.exportData();
      await Share.share({
        message: JSON.stringify(data, null, 2),
        title: 'Copia de seguridad TutorApp',
      });
    } catch (e) {
      console.error('Error sharing:', e);
    }
  };

  const handleResetWithSeed = async () => {
    try {
      await db.resetWithSeed();
      setShowResetConfirm(false);
      Alert.alert('Éxito', 'Se han cargado los datos de ejemplo.');
      await loadData();
    } catch (e) {
      console.error('Error seeding:', e);
      Alert.alert('Error', 'No se pudieron cargar los datos de ejemplo.');
    }
  };

  const handleClearAll = async () => {
    try {
      await db.clearAllData();
      setShowClearConfirm(false);
      Alert.alert('Éxito', 'Todos los datos han sido eliminados.');
      await loadData();
    } catch (e) {
      console.error('Error clearing:', e);
      Alert.alert('Error', 'No se pudieron borrar los datos.');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ajustes</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.headerButton}>
          {saving ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Text style={styles.saveText}>Guardar</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Perfil del Profesor</Text>

          <Input
            label="Tu Nombre"
            value={teacherName}
            onChangeText={setTeacherName}
            placeholder="Ej: Carlos Gómez"
          />

          <Input
            label="Nombre del Negocio o Academia"
            value={businessName}
            onChangeText={setBusinessName}
            placeholder="Ej: Clases Particulares Carlos"
          />

          <Input
            label="Email de Contacto"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            placeholder="tucorreo@ejemplo.com"
          />

          <Input
            label="Teléfono"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="+34 600 000 000"
          />
        </Card>

        {/* Defaults Card */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Preferencias de Clases</Text>

          <Input
            label="Tarifa por Defecto (€/hora)"
            value={defaultRate}
            onChangeText={setDefaultRate}
            keyboardType="decimal-pad"
            placeholder="20"
          />

          <TouchableOpacity
            style={styles.manageRow}
            onPress={() => router.push('/subject/manage')}
          >
            <View style={styles.manageIconCol}>
              <Ionicons name="library-outline" size={20} color={Colors.primary} />
              <View>
                <Text style={styles.manageTitle}>Gestionar Asignaturas</Text>
                <Text style={styles.manageSubtitle}>Añade o edita asignaturas y sus tarifas</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
          </TouchableOpacity>
        </Card>

        {/* Database Management Card */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Gestión de Datos</Text>

          <View style={styles.buttonCol}>
            <Button
              title="Exportar Copia de Seguridad"
              variant="outline"
              onPress={handleExport}
              icon="share-outline"
            />

            <Button
              title="Cargar Datos de Ejemplo"
              variant="ghost"
              onPress={() => setShowResetConfirm(true)}
              icon="sparkles-outline"
            />

            <Button
              title="Borrar Todos los Datos"
              variant="danger"
              onPress={() => setShowClearConfirm(true)}
              icon="trash-outline"
            />
          </View>
        </Card>

        {/* App Version Info */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionTitle}>TutorApp v1.0.0</Text>
          <Text style={styles.versionSubtitle}>
            Diseñado para profesores particulares con React Native & Expo
          </Text>
        </View>
      </ScrollView>

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        visible={showResetConfirm}
        title="Cargar Datos de Ejemplo"
        message="Se reiniciará la base de datos con alumnos, asignaturas y clases de muestra. ¿Deseas continuar?"
        confirmLabel="Cargar Ejemplo"
        onConfirm={handleResetWithSeed}
        onCancel={() => setShowResetConfirm(false)}
      />

      <ConfirmDialog
        visible={showClearConfirm}
        title="Borrar Todos los Datos"
        message="¿Estás seguro de que deseas borrar todos los alumnos, clases y pagos? Esta acción no se puede deshacer."
        confirmLabel="Borrar Todo"
        destructive
        onConfirm={handleClearAll}
        onCancel={() => setShowClearConfirm(false)}
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
  saveText: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.primary,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
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
  manageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    marginTop: Spacing.xs,
  },
  manageIconCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  manageTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.text,
  },
  manageSubtitle: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  buttonCol: {
    gap: Spacing.sm,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  versionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  versionSubtitle: {
    fontSize: FontSizes.xs,
    color: Colors.textTertiary,
    marginTop: 2,
    textAlign: 'center',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
