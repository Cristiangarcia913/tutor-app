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
  Platform,
  Modal,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
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
import { sendInstantReminderNotification } from '../src/utils/notifications';
import {
  isSecurityEnabled,
  isFaceIdEnabled,
  isFaceIdAvailable,
  setupSecurity,
  disableSecurity,
} from '../src/utils/security';
import {
  getCalendarSubscriptionUrl,
  getCleanSubscriptionUrl,
  getCalendarHttpsUrl,
  getCleanHttpsUrl,
  downloadIcsFile,
} from '../src/utils/calendarSync';
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

  // Security state
  const [securityActive, setSecurityActive] = useState(false);
  const [faceIdActive, setFaceIdActive] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [enableFaceIdChoice, setEnableFaceIdChoice] = useState(true);
  const [settingUpSecurity, setSettingUpSecurity] = useState(false);

  // Calendar state
  const [syncingCalendar, setSyncingCalendar] = useState(false);

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

      // Cargar estado de seguridad
      setSecurityActive(isSecurityEnabled());
      setFaceIdActive(isFaceIdEnabled());
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

  // Acciones de Seguridad
  const handleSaveSecurity = async () => {
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      Alert.alert('PIN inválido', 'El PIN debe ser exactamente de 4 dígitos numéricos.');
      return;
    }
    if (newPin !== confirmPin) {
      Alert.alert('Error', 'Los dos PIN introducidos no coinciden.');
      return;
    }

    setSettingUpSecurity(true);
    try {
      const ok = await setupSecurity(newPin, enableFaceIdChoice);
      if (ok) {
        setSecurityActive(true);
        setFaceIdActive(enableFaceIdChoice && isFaceIdEnabled());
        setShowSecurityModal(false);
        setNewPin('');
        setConfirmPin('');
        Alert.alert(
          '¡Seguridad Activada!',
          enableFaceIdChoice
            ? 'Protección con Face ID y PIN de 4 dígitos configurada con éxito.'
            : 'PIN de 4 dígitos configurado correctamente.'
        );
      } else {
        Alert.alert('Error', 'No se pudo guardar la configuración de seguridad.');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Error al configurar seguridad.');
    } finally {
      setSettingUpSecurity(false);
    }
  };

  const handleDisableSecurity = () => {
    Alert.alert(
      'Desactivar Seguridad',
      '¿Seguro que deseas desactivar el PIN y Face ID? La app se abrirá directamente sin solicitar autenticación.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desactivar',
          style: 'destructive',
          onPress: () => {
            disableSecurity();
            setSecurityActive(false);
            setFaceIdActive(false);
            Alert.alert('Seguridad desactivada', 'Se ha eliminado la protección.');
          },
        },
      ]
    );
  };

  // Acciones de Calendario iPhone
  const handleSubscribeCalendar = async () => {
    try {
      // Sincronizar clases actuales al backend primero
      await db.syncCalendarNow();

      const url = getCalendarSubscriptionUrl('cristian');
      if (!url) {
        Alert.alert('Error', 'No se pudo generar la URL de suscripción.');
        return;
      }
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.location.href = url;
      } else {
        Linking.openURL(url);
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Error al iniciar suscripción.');
    }
  };

  const handleCopyCalendarUrl = async () => {
    try {
      await db.syncCalendarNow();
      const url = getCalendarHttpsUrl('cristian');
      await Clipboard.setStringAsync(url);
      Alert.alert(
        '¡Enlace Copiado!',
        'El enlace oficial del calendario ha sido copiado. Pégalo en:\n\nAjustes > Calendario > Cuentas > Añadir cuenta > Otra > Añadir calendario con suscripción.'
      );
    } catch {
      const cleanUrl = getCleanHttpsUrl('cristian');
      await Clipboard.setStringAsync(cleanUrl);
      Alert.alert('Enlace del Calendario', cleanUrl);
    }
  };

  const handleDownloadIcs = async () => {
    try {
      const [classes, students, subjects] = await Promise.all([
        db.loadClasses(),
        db.loadStudents(),
        db.loadSubjects(),
      ]);
      const studentMap: Record<string, any> = {};
      students.forEach((s) => {
        studentMap[s.id] = s;
      });
      const subjectMap: Record<string, any> = {};
      subjects.forEach((s) => {
        subjectMap[s.id] = s;
      });
      downloadIcsFile(classes, studentMap, subjectMap, teacherName || 'Cristian');
    } catch (e) {
      Alert.alert('Error', 'No se pudo descargar el archivo .ics.');
    }
  };

  const handleForceCalendarSync = async () => {
    setSyncingCalendar(true);
    try {
      const ok = await db.syncCalendarNow();
      if (ok) {
        Alert.alert(
          '¡Sincronizado!',
          'El feed de calendario en la nube se ha actualizado con todas tus clases actuales.'
        );
      } else {
        Alert.alert(
          'Información',
          'Sincronización enviada. Si no tienes conexión a internet se actualizará al reconectar.'
        );
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Error al sincronizar.');
    } finally {
      setSyncingCalendar(false);
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
        {/* Calendario de iPhone (iCloud) - Opción B Sincronización Automática */}
        <Card style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.iconCircleBlue}>
              <Ionicons name="calendar" size={22} color="#2563EB" />
            </View>
            <View style={{ flex: 1, marginLeft: Spacing.sm }}>
              <Text style={styles.sectionTitle}>Calendario de iPhone (iCloud)</Text>
              <View style={styles.badgeSuccess}>
                <Ionicons name="checkmark-circle" size={13} color="#166534" />
                <Text style={styles.badgeSuccessText}>Sincronización Automática Activa</Text>
              </View>
            </View>
          </View>

          <Text style={[styles.cardSubtitle, { marginTop: Spacing.sm }]}>
            Todas tus clases de Matemáticas se reflejan automáticamente en el calendario oficial de tu iPhone con hora exacta, alumno, dirección y estado de cobro.
          </Text>

          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Ionicons name="flash-outline" size={16} color={Colors.primary} />
              <Text style={styles.featureText}>
                Si añades, cambias la hora o marcas una clase como pagada, se actualiza sola.
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="location-outline" size={16} color={Colors.primary} />
              <Text style={styles.featureText}>
                Incluye si es Presencial, a domicilio (con dirección) u online, y notas.
              </Text>
            </View>
          </View>

          <View style={styles.buttonCol}>
            <Button
              title="📲 Suscribir mi iPhone al Calendario"
              onPress={handleSubscribeCalendar}
            />

            <Button
              title="📥 Descargar e Importar en Calendario (1 toque)"
              variant="outline"
              icon="download-outline"
              onPress={handleDownloadIcs}
            />

            <Button
              title="📋 Copiar Enlace de Suscripción"
              variant="outline"
              icon="copy-outline"
              onPress={handleCopyCalendarUrl}
            />

            <Button
              title={syncingCalendar ? "Sincronizando..." : "🔄 Forzar Sincronización en la Nube"}
              variant="ghost"
              disabled={syncingCalendar}
              onPress={handleForceCalendarSync}
            />
          </View>

          {/* Instrucciones sencillas para iPhone */}
          <View style={styles.instructionsBox}>
            <Text style={styles.instructionsTitle}>
              📲 Cómo añadirlo a tu iPhone (2 opciones):
            </Text>
            <Text style={styles.instructionsStep}>
              <Text style={{ fontWeight: '700' }}>Opción 1 (Automática por Suscripción):</Text> Pulsa en <Text style={{ fontWeight: '700' }}>"Suscribir mi iPhone al Calendario"</Text>. En la ventana de Apple, pulsa <Text style={{ fontWeight: '700' }}>"Suscribirse"</Text> y luego <Text style={{ fontWeight: '700' }}>"Añadir"</Text>.
            </Text>
            <Text style={styles.instructionsStep}>
              <Text style={{ fontWeight: '700' }}>Opción 2 (Importación Directa 100% infalible):</Text> Pulsa en <Text style={{ fontWeight: '700' }}>"Descargar e Importar en Calendario"</Text>. Safari descargará el archivo y tu iPhone abrirá la ventana oficial para añadir todas tus clases al instante a tu app Calendario.
            </Text>
            <Text style={[styles.instructionsStep, { marginBottom: 0 }]}>
              <Text style={{ fontWeight: '700' }}>Si prefieres hacerlo manual:</Text> Copia el enlace y ve en tu iPhone a: <Text style={{ fontStyle: 'italic' }}>Ajustes ➔ Calendario ➔ Cuentas ➔ Añadir cuenta ➔ Otra ➔ Añadir calendario con suscripción</Text>, pega la URL y pulsa Guardar.
            </Text>
          </View>
        </Card>

        {/* Seguridad & Face ID */}
        <Card style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.iconCirclePurple}>
              <Ionicons name="scan-outline" size={22} color="#7C3AED" />
            </View>
            <View style={{ flex: 1, marginLeft: Spacing.sm }}>
              <Text style={styles.sectionTitle}>Seguridad & Face ID</Text>
              {securityActive ? (
                <View style={styles.badgeSuccess}>
                  <Ionicons name="shield-checkmark" size={13} color="#166534" />
                  <Text style={styles.badgeSuccessText}>
                    {faceIdActive ? 'Face ID + PIN Activo' : 'PIN de 4 dígitos Activo'}
                  </Text>
                </View>
              ) : (
                <View style={styles.badgeWarning}>
                  <Ionicons name="lock-open-outline" size={13} color="#B45309" />
                  <Text style={styles.badgeWarningText}>Desactivada (Acceso libre)</Text>
                </View>
              )}
            </View>
          </View>

          <Text style={[styles.cardSubtitle, { marginTop: Spacing.sm }]}>
            Protege los datos de tus alumnos, ingresos y clases frente a accesos no autorizados mediante reconocimiento facial (Face ID) o un PIN de 4 dígitos.
          </Text>

          {securityActive ? (
            <View style={styles.buttonCol}>
              <Button
                title="Cambiar PIN o Ajustes de Face ID"
                variant="outline"
                icon="key-outline"
                onPress={() => {
                  setNewPin('');
                  setConfirmPin('');
                  setShowSecurityModal(true);
                }}
              />
              <Button
                title="Desactivar Protección"
                variant="danger"
                icon="lock-open-outline"
                onPress={handleDisableSecurity}
              />
            </View>
          ) : (
            <Button
              title="🔒 Activar Face ID y PIN"
              icon="scan-outline"
              onPress={() => {
                setNewPin('');
                setConfirmPin('');
                setShowSecurityModal(true);
              }}
            />
          )}
        </Card>

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

        {/* Alertas y Recordatorios de Clase */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Alertas y Recordatorios de Clase</Text>
          <Text style={[styles.manageSubtitle, { marginBottom: Spacing.sm }]}>
            Notificaciones automáticas que avisan con antelación de cada clase y su lugar exacto (Presencial con dirección, A domicilio u Online por videollamada).
          </Text>

          <Button
            title="Probar Alerta de Recordatorio Ahora"
            variant="outline"
            icon="notifications-outline"
            onPress={async () => {
              const ok = await sendInstantReminderNotification(
                '🔔 Recordatorio de Clase: Matemáticas',
                'Hoy a las 17:00 con Alejandro.\nLugar: 📍 Presencial (en el aula habitual).'
              );
              if (ok) {
                Alert.alert(
                  '¡Alerta enviada!',
                  'Se ha emitido la notificación de prueba con el recordatorio y lugar de la clase.'
                );
              }
            }}
          />
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

      {/* Modal de Configuración de Seguridad */}
      <Modal
        visible={showSecurityModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSecurityModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <Ionicons name="shield-checkmark" size={22} color={Colors.primary} />
                <Text style={styles.modalTitle}>Configurar Seguridad</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowSecurityModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDescription}>
              Introduce un código PIN de 4 dígitos. Si tienes Face ID en tu iPhone, podrás desbloquear la app al instante con tu cara.
            </Text>

            <Input
              label="Nuevo PIN (4 dígitos)"
              value={newPin}
              onChangeText={(t) => setNewPin(t.replace(/[^0-9]/g, '').slice(0, 4))}
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
              placeholder="••••"
            />

            <Input
              label="Confirmar PIN"
              value={confirmPin}
              onChangeText={(t) => setConfirmPin(t.replace(/[^0-9]/g, '').slice(0, 4))}
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
              placeholder="••••"
            />

            <View style={styles.switchRow}>
              <View style={{ flex: 1, marginRight: Spacing.sm }}>
                <Text style={styles.switchLabel}>Activar Face ID de Apple</Text>
                <Text style={styles.switchSublabel}>
                  Escaneará tu cara automáticamente al abrir la app
                </Text>
              </View>
              <Switch
                value={enableFaceIdChoice}
                onValueChange={setEnableFaceIdChoice}
                trackColor={{ false: '#CBD5E1', true: '#818CF8' }}
                thumbColor={enableFaceIdChoice ? Colors.primary : '#F1F5F9'}
              />
            </View>

            <View style={styles.modalActions}>
              <Button
                title="Cancelar"
                variant="outline"
                onPress={() => setShowSecurityModal(false)}
                style={{ flex: 1 }}
              />
              <Button
                title={settingUpSecurity ? 'Guardando...' : 'Activar'}
                onPress={handleSaveSecurity}
                disabled={settingUpSecurity || newPin.length !== 4 || confirmPin.length !== 4}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

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
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircleBlue: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCirclePurple: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 4,
    marginTop: 4,
  },
  badgeSuccessText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#166534',
  },
  badgeWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 4,
    marginTop: 4,
  },
  badgeWarningText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#B45309',
  },
  cardSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  featureList: {
    gap: 6,
    marginBottom: Spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 13,
    color: Colors.text,
    flex: 1,
  },
  instructionsBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  instructionsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
    marginBottom: 6,
  },
  instructionsStep: {
    fontSize: 12,
    color: '#166534',
    marginBottom: 4,
    lineHeight: 18,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 420,
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  modalTitle: {
    fontSize: FontSizes.md,
    fontWeight: '700',
    color: Colors.text,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceVariant,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  switchSublabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
});
