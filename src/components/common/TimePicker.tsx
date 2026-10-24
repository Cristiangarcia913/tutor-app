import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Colors,
  BorderRadius,
  FontSizes,
  Spacing,
  Shadows,
} from '../../constants/theme';

interface TimePickerProps {
  label: string;
  value: string;
  onChange: (time: string) => void;
  error?: string;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

export default function TimePicker({
  label,
  value,
  onChange,
  error,
}: TimePickerProps) {
  const [visible, setVisible] = useState(false);

  const parts = value ? value.split(':') : [];
  const selectedHour = parts.length >= 2 ? parseInt(parts[0], 10) : -1;
  const selectedMinute = parts.length >= 2 ? parseInt(parts[1], 10) : -1;

  const [tempHour, setTempHour] = useState(selectedHour >= 0 ? selectedHour : 9);
  const [tempMinute, setTempMinute] = useState(selectedMinute >= 0 ? selectedMinute : 0);

  function handleOpen() {
    if (selectedHour >= 0) setTempHour(selectedHour);
    if (selectedMinute >= 0) setTempMinute(selectedMinute);
    setVisible(true);
  }

  function handleConfirm() {
    onChange(`${pad(tempHour)}:${pad(tempMinute)}`);
    setVisible(false);
  }

  function formatDisplay(timeStr: string): string {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    return `${pad(h)}:${pad(m)} hrs`;
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.label, error && styles.labelError]}>{label}</Text>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handleOpen}
        style={[styles.inputWrapper, error && styles.inputError]}
      >
        <Ionicons
          name="time-outline"
          size={18}
          color={Colors.placeholder}
          style={styles.icon}
        />
        <Text style={[styles.inputText, !value && styles.placeholder]}>
          {value ? formatDisplay(value) : 'Seleccionar hora'}
        </Text>
        <Ionicons name="chevron-down" size={16} color={Colors.placeholder} />
      </TouchableOpacity>
      {error && (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={14} color={Colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <View style={styles.dialog} onStartShouldSetResponder={() => true}>
            <Text style={styles.dialogTitle}>Seleccionar hora</Text>

            {/* Selector rápido de minutos exactos (:00, :15, :30, :45) */}
            <View style={styles.quickMinutesContainer}>
              <Text style={styles.quickSectionTitle}>Minutos:</Text>
              <View style={styles.quickMinutesRow}>
                {[0, 15, 30, 45].map((m) => {
                  const isSelected = tempMinute === m;
                  return (
                    <TouchableOpacity
                      key={m}
                      onPress={() => setTempMinute(m)}
                      style={[
                        styles.quickMinuteBtn,
                        isSelected && styles.quickMinuteBtnSelected,
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.quickMinuteBtnText,
                          isSelected && styles.quickMinuteBtnTextSelected,
                        ]}
                      >
                        :{pad(m)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Horas habituales en 1 toque */}
            <View style={styles.quickPresetsContainer}>
              <Text style={styles.quickSectionTitle}>Horas habituales:</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.quickPresetsScroll}
              >
                {[
                  '15:00', '15:15', '15:30', '15:45',
                  '16:00', '16:15', '16:30', '16:45',
                  '17:00', '17:15', '17:30', '17:45',
                  '18:00', '18:15', '18:30', '18:45',
                  '19:00', '19:15', '19:30', '19:45',
                  '20:00'
                ].map((t) => {
                  const [h, m] = t.split(':').map(Number);
                  const isMatch = tempHour === h && tempMinute === m;
                  return (
                    <TouchableOpacity
                      key={t}
                      onPress={() => {
                        setTempHour(h);
                        setTempMinute(m);
                      }}
                      style={[
                        styles.quickPresetChip,
                        isMatch && styles.quickPresetChipSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.quickPresetText,
                          isMatch && styles.quickPresetTextSelected,
                        ]}
                      >
                        {t}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.pickerRow}>
              {/* Hours */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Hora</Text>
                <ScrollView
                  style={styles.scrollCol}
                  showsVerticalScrollIndicator={false}
                >
                  {HOURS.map((h) => (
                    <TouchableOpacity
                      key={h}
                      onPress={() => setTempHour(h)}
                      style={[
                        styles.pickerItem,
                        tempHour === h && styles.pickerItemSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          tempHour === h && styles.pickerItemTextSelected,
                        ]}
                      >
                        {pad(h)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <Text style={styles.separator}>:</Text>

              {/* Minutes */}
              <View style={styles.pickerColumn}>
                <Text style={styles.pickerLabel}>Minuto</Text>
                <ScrollView
                  style={styles.scrollCol}
                  showsVerticalScrollIndicator={false}
                >
                  {MINUTES.map((m) => (
                    <TouchableOpacity
                      key={m}
                      onPress={() => setTempMinute(m)}
                      style={[
                        styles.pickerItem,
                        tempMinute === m && styles.pickerItemSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          tempMinute === m && styles.pickerItemTextSelected,
                        ]}
                      >
                        {pad(m)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.preview}>
              <Text style={styles.previewText}>
                {pad(tempHour)}:{pad(tempMinute)} hrs
              </Text>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                onPress={() => setVisible(false)}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirm}
                style={styles.confirmBtn}
              >
                <Text style={styles.confirmText}>Aceptar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    letterSpacing: 0.2,
  },
  labelError: {
    color: Colors.danger,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    height: 48,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  icon: {
    marginRight: Spacing.sm,
  },
  inputText: {
    flex: 1,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
  },
  placeholder: {
    color: Colors.placeholder,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    gap: 4,
  },
  errorText: {
    fontSize: FontSizes.xs,
    color: Colors.danger,
  },

  // Modal
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  dialog: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    width: '100%',
    maxWidth: 320,
    ...Shadows.lg,
  },
  dialogTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  quickMinutesContainer: {
    marginBottom: Spacing.sm,
  },
  quickSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  quickMinutesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickMinuteBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  quickMinuteBtnSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  quickMinuteBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  quickMinuteBtnTextSelected: {
    color: '#FFFFFF',
  },
  quickPresetsContainer: {
    marginBottom: Spacing.md,
  },
  quickPresetsScroll: {
    gap: 6,
    paddingVertical: 2,
  },
  quickPresetChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickPresetChipSelected: {
    backgroundColor: Colors.primaryBg,
    borderColor: Colors.primary,
  },
  quickPresetText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  quickPresetTextSelected: {
    color: Colors.primary,
    fontWeight: '800',
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  pickerColumn: {
    alignItems: 'center',
    flex: 1,
  },
  pickerLabel: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  scrollCol: {
    maxHeight: 200,
  },
  separator: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.xl,
  },
  pickerItem: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.sm,
    marginVertical: 2,
    alignItems: 'center',
  },
  pickerItemSelected: {
    backgroundColor: Colors.primary,
  },
  pickerItemText: {
    fontSize: FontSizes.lg,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  pickerItemTextSelected: {
    color: Colors.textInverse,
    fontWeight: '700',
  },
  preview: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primaryBg,
    borderRadius: BorderRadius.md,
  },
  previewText: {
    fontSize: FontSizes.xl,
    fontWeight: '700',
    color: Colors.primary,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  cancelBtn: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
  },
  cancelText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  confirmBtn: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
  },
  confirmText: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.textInverse,
  },
});

export { TimePicker };
