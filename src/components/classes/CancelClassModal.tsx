import React, { useState } from 'react';
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
import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import type { ClassSession } from '../../types';

interface CancelClassModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  session?: ClassSession | null;
  studentName?: string;
}

const PRESET_REASONS = [
  'Festivo nacional / escolar',
  'Alumno enfermo',
  'Imprevisto del profesor',
  'Examen escolar del alumno',
  'Aviso previo de los padres',
  'Vacaciones escolares',
];

export default function CancelClassModal({
  visible,
  onClose,
  onConfirm,
  session,
  studentName,
}: CancelClassModalProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>(PRESET_REASONS[0]);
  const [customReason, setCustomReason] = useState<string>('');
  const [isCustom, setIsCustom] = useState(false);

  const handleConfirm = () => {
    const finalReason = isCustom
      ? customReason.trim() || 'Aviso del alumno / profesor'
      : selectedPreset;
    onConfirm(finalReason);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="close-circle-outline" size={24} color={Colors.danger} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>Cancelar Clase</Text>
              <Text style={styles.subtitle}>
                {session ? `${session.date} a las ${session.startTime}` : 'Clase programada'}
                {studentName ? ` • ${studentName}` : ''}
              </Text>
            </View>
          </View>

          <Text style={styles.prompt}>
            Selecciona el motivo de la cancelación. Este motivo aparecerá en el resumen mensual para los padres:
          </Text>

          {/* Preset reason chips */}
          <View style={styles.presetsGrid}>
            {PRESET_REASONS.map((r) => {
              const active = !isCustom && selectedPreset === r;
              return (
                <TouchableOpacity
                  key={r}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => {
                    setSelectedPreset(r);
                    setIsCustom(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{r}</Text>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={[styles.chip, isCustom && styles.chipActive]}
              onPress={() => setIsCustom(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, isCustom && styles.chipTextActive]}>
                ✏️ Otro motivo
              </Text>
            </TouchableOpacity>
          </View>

          {/* Custom Reason Input */}
          {isCustom && (
            <TextInput
              style={styles.customInput}
              placeholder="Escribe el motivo específico..."
              value={customReason}
              onChangeText={setCustomReason}
              autoFocus
            />
          )}

          {/* Action buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>Volver</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={handleConfirm}
              activeOpacity={0.7}
            >
              <Text style={styles.confirmBtnText}>Confirmar Cancelación</Text>
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
    maxWidth: 420,
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
    backgroundColor: '#FEE2E2',
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
  prompt: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.md,
  },
  chip: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 7,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.danger,
    fontWeight: '700',
  },
  customInput: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
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
    backgroundColor: Colors.danger,
  },
  confirmBtnText: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
