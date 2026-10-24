import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Colors,
  Spacing,
  FontSizes,
  BorderRadius,
  formatCurrency,
} from '../../constants/theme';
import {
  buildMonthlyWhatsAppReport,
  openWhatsAppMessage,
} from '../../utils/whatsappReports';
import type { Student, ClassSession, AppSettings } from '../../types';

interface WhatsAppReportModalProps {
  visible: boolean;
  onClose: () => void;
  student: Student;
  classes: ClassSession[];
  settings?: AppSettings | null;
}

export default function WhatsAppReportModal({
  visible,
  onClose,
  student,
  classes,
  settings,
}: WhatsAppReportModalProps) {
  const currentDate = new Date();
  const [selectedMonthOffset, setSelectedMonthOffset] = useState<0 | -1>(0); // 0 = este mes, -1 = mes pasado
  const [customText, setCustomText] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Calcular el año y mes seleccionado
  const { year, monthIndex } = useMemo(() => {
    let y = currentDate.getFullYear();
    let m = currentDate.getMonth() + selectedMonthOffset;
    if (m < 0) {
      m = 11;
      y -= 1;
    }
    return { year: y, monthIndex: m };
  }, [selectedMonthOffset]);

  const report = useMemo(() => {
    return buildMonthlyWhatsAppReport({
      student,
      classes,
      year,
      monthIndex,
      teacherName: settings?.teacherName || 'Tu Profesor Particular',
      teacherPhone: settings?.phone || '+34 600 000 000',
    });
  }, [student, classes, year, monthIndex, settings]);

  useEffect(() => {
    setCustomText(report.messageText);
    setIsEditing(false);
  }, [report.messageText]);

  const targetPhone = student.parentPhone?.trim() || student.phone?.trim() || '';
  const tutorName = student.parentName?.trim() || `Familia de ${student.firstName}`;

  const handleSend = async () => {
    if (!targetPhone) {
      Alert.alert(
        'Sin teléfono del tutor',
        'Por favor, añade el teléfono del tutor en la ficha del alumno para enviarle el WhatsApp directo.'
      );
      return;
    }

    const success = await openWhatsAppMessage(targetPhone, customText || report.messageText);
    if (success) {
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.waIconBox}>
                <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Resumen y Cobro por WhatsApp</Text>
                <Text style={styles.headerSubtitle}>
                  Para {student.firstName} ({tutorName})
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Month Selector Tabs */}
          <View style={styles.monthToggleRow}>
            <TouchableOpacity
              style={[styles.monthTab, selectedMonthOffset === 0 && styles.monthTabActive]}
              onPress={() => setSelectedMonthOffset(0)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.monthTabText,
                  selectedMonthOffset === 0 && styles.monthTabTextActive,
                ]}
              >
                📅 Mes Actual
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.monthTab, selectedMonthOffset === -1 && styles.monthTabActive]}
              onPress={() => setSelectedMonthOffset(-1)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.monthTabText,
                  selectedMonthOffset === -1 && styles.monthTabTextActive,
                ]}
              >
                ⏪ Mes Anterior
              </Text>
            </TouchableOpacity>
          </View>

          {/* KPI Strip */}
          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Periodo</Text>
              <Text style={styles.kpiValue} numberOfLines={1}>
                {report.monthName}
              </Text>
            </View>

            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Clases Dadas</Text>
              <Text style={[styles.kpiValue, { color: Colors.primary }]}>
                {report.classesCount} ses.
              </Text>
            </View>

            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Total a Abonar</Text>
              <Text style={[styles.kpiValue, { color: Colors.success }]}>
                {formatCurrency(report.totalAmount)}
              </Text>
            </View>
          </View>

          {/* Recipient info badge */}
          <View style={styles.recipientBadge}>
            <Ionicons name="person-circle-outline" size={16} color={Colors.primary} />
            <Text style={styles.recipientText}>
              Destinatario: <Text style={styles.bold}>{tutorName}</Text> (
              {targetPhone || 'Sin teléfono guardado'})
            </Text>
          </View>

          {/* WhatsApp Message Preview */}
          <View style={styles.previewContainer}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>Vista previa del mensaje a enviar:</Text>
              <TouchableOpacity
                onPress={() => setIsEditing(!isEditing)}
                style={styles.editToggleBtn}
              >
                <Ionicons
                  name={isEditing ? 'checkmark' : 'create-outline'}
                  size={14}
                  color={Colors.primary}
                />
                <Text style={styles.editToggleText}>
                  {isEditing ? 'Listo' : 'Editar texto'}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.previewScroll} showsVerticalScrollIndicator>
              {isEditing ? (
                <TextInput
                  style={styles.previewInput}
                  multiline
                  value={customText}
                  onChangeText={setCustomText}
                  placeholder="Mensaje de WhatsApp..."
                />
              ) : (
                <Text style={styles.previewText}>{customText || report.messageText}</Text>
              )}
            </ScrollView>
          </View>

          {/* Action button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.sendWhatsAppBtn}
              onPress={handleSend}
              activeOpacity={0.85}
            >
              <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" />
              <Text style={styles.sendWhatsAppBtnText}>
                Enviar por WhatsApp ({formatCurrency(report.totalAmount)})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    maxHeight: '90%',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 10,
      },
      default: {},
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  waIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FontSizes.md,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
  },
  monthToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: BorderRadius.md,
    padding: 3,
    marginBottom: Spacing.md,
  },
  monthTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  monthTabActive: {
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
      },
      default: {},
    }),
  },
  monthTabText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  monthTabTextActive: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: Spacing.sm,
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  kpiValue: {
    fontSize: FontSizes.sm,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  recipientBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    paddingVertical: 6,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  recipientText: {
    fontSize: 11,
    color: Colors.textPrimary,
  },
  bold: {
    fontWeight: '700',
  },
  previewContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 4,
  },
  previewTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  editToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  previewScroll: {
    maxHeight: 180,
  },
  previewText: {
    fontSize: 12,
    color: Colors.textPrimary,
    lineHeight: 18,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  previewInput: {
    fontSize: 12,
    color: Colors.textPrimary,
    lineHeight: 18,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  footer: {
    paddingTop: Spacing.xs,
  },
  sendWhatsAppBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#25D366',
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
  },
  sendWhatsAppBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: FontSizes.md,
  },
});
