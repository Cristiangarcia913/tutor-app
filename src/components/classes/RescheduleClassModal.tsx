import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSizes, BorderRadius, formatDate } from '../../constants/theme';
import DatePicker from '../common/DatePicker';
import TimePicker from '../common/TimePicker';
import type { ClassSession } from '../../types';

interface RescheduleClassModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (newDate: string, newStartTime: string, newEndTime: string, reason?: string) => void;
  session?: ClassSession | null;
  studentName?: string;
}

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

export default function RescheduleClassModal({
  visible,
  onClose,
  onConfirm,
  session,
  studentName,
}: RescheduleClassModalProps) {
  const [newDate, setNewDate] = useState<string>('');
  const [newStartTime, setNewStartTime] = useState<string>('17:00');
  const [changeReason, setChangeReason] = useState<string>('');

  useEffect(() => {
    if (session) {
      setNewDate(session.date);
      setNewStartTime(session.startTime);
      setChangeReason('');
    }
  }, [session, visible]);

  if (!session) return null;

  const duration = session.duration || 60;
  const newEndTime = calculateEndTime(newStartTime, duration);

  const handleConfirm = () => {
    onConfirm(newDate, newStartTime, newEndTime, changeReason.trim() || undefined);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="swap-horizontal" size={22} color={Colors.primary} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>Cambiar Día y Hora de la Clase</Text>
              <Text style={styles.subtitle}>
                {studentName ? `${studentName} • ` : ''}Actualmente: {formatDate(session.date)} a las {session.startTime}
              </Text>
            </View>
          </View>

          {/* New Date Picker */}
          <View style={styles.fieldRow}>
            <DatePicker
              label="Nueva Fecha de la Clase"
              value={newDate}
              onChange={setNewDate}
            />
          </View>

          {/* New Time Picker */}
          <View style={styles.fieldRow}>
            <TimePicker
              label="Nueva Hora de Inicio"
              value={newStartTime}
              onChange={setNewStartTime}
            />

            {/* Selector rápido de minutos (:00, :15, :30, :45) */}
            <View style={styles.quickMinutesRow}>
              <Text style={styles.quickMinutesLabel}>Minutos:</Text>
              {[0, 15, 30, 45].map((min) => {
                const [h] = (newStartTime || '17:00').split(':');
                const targetTime = `${h || '17'}:${String(min).padStart(2, '0')}`;
                const isSelected = (newStartTime || '').endsWith(`:${String(min).padStart(2, '0')}`);
                return (
                  <TouchableOpacity
                    key={min}
                    onPress={() => setNewStartTime(targetTime)}
                    style={[styles.quickMinuteChip, isSelected && styles.quickMinuteChipSelected]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.quickMinuteChipText, isSelected && styles.quickMinuteChipTextSelected]}>
                      :{String(min).padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Info pill */}
          <View style={styles.infoPill}>
            <Ionicons name="information-circle-outline" size={16} color={Colors.primary} />
            <Text style={styles.infoPillText}>
              Nueva sesión: {newStartTime} a {newEndTime} ({duration} min). Se guardará el cambio para el resumen de WhatsApp.
            </Text>
          </View>

          {/* Optional reason / note */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Motivo del cambio (opcional)</Text>
            <TextInput
              style={styles.reasonInput}
              placeholder="Ej: Cambio acordado con la madre, médico..."
              value={changeReason}
              onChangeText={setChangeReason}
            />
          </View>

          {/* Action buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={handleConfirm}
              activeOpacity={0.7}
            >
              <Text style={styles.confirmBtnText}>Guardar Cambio</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  dialog: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 440,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
      default: {},
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: FontSizes.md,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  fieldRow: {
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  reasonInput: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  infoPillText: {
    fontSize: 11,
    color: Colors.primaryDark,
    flex: 1,
    lineHeight: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  quickMinutesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  quickMinutesLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginRight: 2,
  },
  quickMinuteChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  quickMinuteChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  quickMinuteChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  quickMinuteChipTextSelected: {
    color: '#FFFFFF',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    backgroundColor: '#F1F5F9',
  },
  cancelBtnText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  confirmBtn: {
    flex: 1.6,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
  },
  confirmBtnText: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
