import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Colors,
  Spacing,
  FontSizes,
  BorderRadius,
  Shadows,
} from '../../constants/theme';
import {
  isSecurityEnabled,
  isFaceIdEnabled,
  authenticateWithFaceId,
  verifyPin,
} from '../../utils/security';

interface SecurityLockModalProps {
  onUnlock?: () => void;
}

export default function SecurityLockModal({ onUnlock }: SecurityLockModalProps) {
  const [locked, setLocked] = useState(false);
  const [pin, setPin] = useState('');
  const [hasFaceId, setHasFaceId] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const [errorShake, setErrorShake] = useState(false);

  // Comprobar estado de seguridad al cargar
  const checkSecurityStatus = useCallback(() => {
    if (typeof window === 'undefined') return;
    const enabled = isSecurityEnabled();
    const faceId = isFaceIdEnabled();
    setLocked(enabled);
    setHasFaceId(faceId);
    setPin('');
  }, []);

  useEffect(() => {
    checkSecurityStatus();
  }, [checkSecurityStatus]);

  const handleFaceIdUnlock = useCallback(async () => {
    if (authenticating) return;
    setAuthenticating(true);
    try {
      const success = await authenticateWithFaceId();
      if (success) {
        setLocked(false);
        onUnlock?.();
      }
    } catch (e) {
      console.warn('Face ID failed:', e);
    } finally {
      setAuthenticating(false);
    }
  }, [authenticating, onUnlock]);

  // Si tiene Face ID activo, solicitarlo automáticamente al abrir la app
  useEffect(() => {
    if (locked && hasFaceId) {
      const timer = setTimeout(() => {
        handleFaceIdUnlock();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [locked, hasFaceId, handleFaceIdUnlock]);

  // Manejo de pulsación en el teclado numérico de PIN
  const handleDigitPress = (digit: string) => {
    if (pin.length >= 4) return;
    const nextPin = pin + digit;
    setPin(nextPin);

    if (nextPin.length === 4) {
      if (verifyPin(nextPin)) {
        setTimeout(() => {
          setLocked(false);
          setPin('');
          onUnlock?.();
        }, 150);
      } else {
        setErrorShake(true);
        setTimeout(() => {
          setPin('');
          setErrorShake(false);
        }, 600);
      }
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
    }
  };

  if (!locked) {
    return null;
  }

  return (
    <Modal visible={locked} animationType="fade" transparent={false}>
      <View style={styles.container}>
        {/* Cabecera / Logo */}
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Ionicons name="shield-checkmark" size={38} color={Colors.primary} />
          </View>
          <Text style={styles.appTitle}>TutorApp Clases</Text>
          <Text style={styles.instructionText}>
            {hasFaceId
              ? 'Desbloquea con Face ID o introduce tu PIN'
              : 'Introduce tu PIN de seguridad'}
          </Text>
        </View>

        {/* Botón destacado Face ID */}
        {hasFaceId && (
          <TouchableOpacity
            style={styles.faceIdCard}
            onPress={handleFaceIdUnlock}
            disabled={authenticating}
            activeOpacity={0.8}
          >
            {authenticating ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Ionicons name="scan-outline" size={32} color={Colors.primary} />
            )}
            <Text style={styles.faceIdText}>
              {authenticating ? 'Escaneando rostro...' : 'Tocar para usar Face ID'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Indicadores de 4 dígitos */}
        <View style={styles.dotsRow}>
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pin.length > index;
            return (
              <View
                key={index}
                style={[
                  styles.dot,
                  isFilled && styles.dotFilled,
                  errorShake && styles.dotError,
                ]}
              />
            );
          })}
        </View>

        {errorShake && (
          <Text style={styles.errorText}>PIN incorrecto. Inténtalo de nuevo.</Text>
        )}

        {/* Teclado numérico */}
        <View style={styles.keypad}>
          {[
            ['1', '2', '3'],
            ['4', '5', '6'],
            ['7', '8', '9'],
          ].map((row, rIdx) => (
            <View key={rIdx} style={styles.keypadRow}>
              {row.map((digit) => (
                <TouchableOpacity
                  key={digit}
                  style={styles.keyButton}
                  onPress={() => handleDigitPress(digit)}
                  activeOpacity={0.6}
                >
                  <Text style={styles.keyText}>{digit}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}

          {/* Fila inferior con Face ID y Borrar */}
          <View style={styles.keypadRow}>
            {hasFaceId ? (
              <TouchableOpacity
                style={styles.keyButtonIcon}
                onPress={handleFaceIdUnlock}
                activeOpacity={0.6}
              >
                <Ionicons name="scan-outline" size={24} color={Colors.primary} />
              </TouchableOpacity>
            ) : (
              <View style={styles.keyButtonEmpty} />
            )}

            <TouchableOpacity
              style={styles.keyButton}
              onPress={() => handleDigitPress('0')}
              activeOpacity={0.6}
            >
              <Text style={styles.keyText}>0</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.keyButtonIcon}
              onPress={handleDelete}
              activeOpacity={0.6}
            >
              <Ionicons name="backspace-outline" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  logoCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  appTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: '800',
    color: Colors.text,
  },
  instructionText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
  faceIdCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.lg,
  },
  faceIdText: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.primary,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: Spacing.lg,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  dotFilled: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dotError: {
    backgroundColor: Colors.danger,
    borderColor: Colors.danger,
  },
  errorText: {
    color: Colors.danger,
    fontSize: FontSizes.xs,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  keypad: {
    width: '100%',
    maxWidth: 280,
    gap: 14,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  keyButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
  },
  keyButtonIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyButtonEmpty: {
    width: 68,
    height: 68,
  },
});
