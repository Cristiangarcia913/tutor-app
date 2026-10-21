import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthRole } from '../../hooks/useAuthRole';
import { useDatabase } from '../../hooks/useDatabase';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '../../constants/theme';
import type { Student, AppRole } from '../../types';

export default function RoleSwitcherBar() {
  const {
    role,
    isTeacher,
    isStudent,
    isParent,
    activeStudent,
    switchRole,
    loginAsTeacher,
    loginWithCode,
  } = useAuthRole();

  const db = useDatabase();
  const [students, setStudents] = useState<Student[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [selectedTargetRole, setSelectedTargetRole] = useState<'estudiante' | 'padre'>('estudiante');

  useEffect(() => {
    async function load() {
      if (db.isReady) {
        try {
          const list = await db.loadStudents(true);
          setStudents(list);
        } catch {}
      }
    }
    load();
  }, [db]);

  const handleCodeSubmit = async () => {
    if (!inputCode.trim()) {
      Alert.alert('Error', 'Introduce el código del alumno.');
      return;
    }
    const res = await loginWithCode(inputCode, selectedTargetRole);
    if (!res.success) {
      Alert.alert('Acceso no encontrado', res.message || 'Código incorrecto.');
    } else {
      setModalVisible(false);
      setInputCode('');
    }
  };

  const getRoleLabel = () => {
    if (isTeacher) return 'Modo Profesor (Administrador)';
    if (isStudent) return `Estudiante: ${activeStudent?.firstName || 'Alumno'}`;
    return `Padres: ${activeStudent?.firstName || 'Familia'}`;
  };

  const getRoleColor = () => {
    if (isTeacher) return Colors.primary;
    if (isStudent) return '#0D9488'; // Teal
    return '#E11D48'; // Rose
  };

  const getRoleIcon = () => {
    if (isTeacher) return 'briefcase-outline';
    if (isStudent) return 'school-outline';
    return 'people-outline';
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.banner, { backgroundColor: isTeacher ? '#F8FAFC' : isStudent ? '#F0FDFA' : '#FFF1F2' }]}
        activeOpacity={0.8}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.bannerContent}>
          <View style={[styles.roleBadge, { backgroundColor: getRoleColor() + '20' }]}>
            <Ionicons name={getRoleIcon() as any} size={14} color={getRoleColor()} />
            <Text style={[styles.roleText, { color: getRoleColor() }]}>
              {role.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.bannerTitle} numberOfLines={1}>
            {getRoleLabel()}
          </Text>
        </View>

        <View style={styles.switchButton}>
          <Text style={styles.switchButtonText}>Cambiar rol</Text>
          <Ionicons name="swap-horizontal" size={14} color={Colors.primary} />
        </View>
      </TouchableOpacity>

      {/* Role Selection Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.dialog} onStartShouldSetResponder={() => true}>
            <View style={styles.dialogHeader}>
              <Text style={styles.dialogTitle}>Seleccionar Rol de Usuario</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.dialogDesc}>
              Elige cómo deseas ver la aplicación o introduce un código de acceso de alumno:
            </Text>

            {/* Role Options */}
            <TouchableOpacity
              style={[styles.roleCard, isTeacher && styles.roleCardActive]}
              onPress={() => {
                loginAsTeacher();
                setModalVisible(false);
              }}
            >
              <View style={[styles.roleCardIcon, { backgroundColor: Colors.primary + '18' }]}>
                <Ionicons name="briefcase-outline" size={22} color={Colors.primary} />
              </View>
              <View style={styles.roleCardInfo}>
                <Text style={styles.roleCardTitle}>Profesor (Gestión completa)</Text>
                <Text style={styles.roleCardSub}>
                  Crear clases, gestionar alumnos, cobros y finanzas
                </Text>
              </View>
              {isTeacher && <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />}
            </TouchableOpacity>

            {/* Quick student select if students exist */}
            {students.length > 0 && (
              <View style={styles.quickStudentsSection}>
                <Text style={styles.quickSectionTitle}>Probar con alumno existente:</Text>
                {students.slice(0, 3).map((st) => (
                  <View key={st.id} style={styles.studentRoleRow}>
                    <Text style={styles.studentNameText} numberOfLines={1}>
                      {st.firstName} {st.lastName}
                    </Text>
                    <View style={styles.studentRoleBtns}>
                      <TouchableOpacity
                        style={[
                          styles.smallRoleBtn,
                          isStudent && activeStudent?.id === st.id && styles.smallRoleBtnActive,
                        ]}
                        onPress={() => {
                          switchRole('estudiante', st.id);
                          setModalVisible(false);
                        }}
                      >
                        <Text style={styles.smallRoleBtnText}>🎓 Alumno</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.smallRoleBtn,
                          isParent && activeStudent?.id === st.id && styles.smallRoleBtnActive,
                        ]}
                        onPress={() => {
                          switchRole('padre', st.id);
                          setModalVisible(false);
                        }}
                      >
                        <Text style={styles.smallRoleBtnText}>👨‍👩‍👦 Padre</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Acceso por código */}
            <View style={styles.codeSection}>
              <Text style={styles.codeSectionTitle}>O entrar con código de acceso:</Text>
              <View style={styles.codeRoleToggle}>
                <TouchableOpacity
                  style={[styles.toggleBtn, selectedTargetRole === 'estudiante' && styles.toggleBtnActive]}
                  onPress={() => setSelectedTargetRole('estudiante')}
                >
                  <Text style={[styles.toggleBtnText, selectedTargetRole === 'estudiante' && styles.toggleBtnTextActive]}>
                    Como Estudiante
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.toggleBtn, selectedTargetRole === 'padre' && styles.toggleBtnActive]}
                  onPress={() => setSelectedTargetRole('padre')}
                >
                  <Text style={[styles.toggleBtnText, selectedTargetRole === 'padre' && styles.toggleBtnTextActive]}>
                    Como Padre/Madre
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.codeRow}>
                <TextInput
                  style={styles.codeInput}
                  placeholder="Ej: ALE-4819"
                  placeholderTextColor={Colors.placeholder}
                  value={inputCode}
                  onChangeText={(t) => setInputCode(t.toUpperCase())}
                  autoCapitalize="characters"
                />
                <TouchableOpacity style={styles.codeSubmitBtn} onPress={handleCodeSubmit}>
                  <Text style={styles.codeSubmitText}>Entrar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flex: 1,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  bannerTitle: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    fontWeight: '600',
    flex: 1,
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  switchButtonText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  dialog: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 420,
    ...Shadows.lg,
  },
  dialogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  dialogTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  dialogDesc: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  roleCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryBg,
  },
  roleCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleCardInfo: {
    flex: 1,
  },
  roleCardTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  roleCardSub: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  quickStudentsSection: {
    backgroundColor: Colors.surfaceVariant,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  quickSectionTitle: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  studentRoleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  studentNameText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
  },
  studentRoleBtns: {
    flexDirection: 'row',
    gap: 4,
  },
  smallRoleBtn: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  smallRoleBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryBg,
  },
  smallRoleBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  codeSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.sm,
  },
  codeSectionTitle: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  codeRoleToggle: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: BorderRadius.xs,
    alignItems: 'center',
    backgroundColor: Colors.surfaceVariant,
  },
  toggleBtnActive: {
    backgroundColor: Colors.primary,
  },
  toggleBtnText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  toggleBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  codeRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  codeInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 40,
    fontSize: FontSizes.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  codeSubmitBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeSubmitText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: FontSizes.sm,
  },
});
