import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Colors,
  Spacing,
  FontSizes,
  BorderRadius,
  formatDate,
} from '../../constants/theme';
import {
  formatClassLocationText,
  scheduleClassReminder,
  sendWhatsAppReminder,
} from '../../utils/notifications';
import type { ClassSession, Student, Subject } from '../../types';

interface ClassReminderAlertProps {
  session: ClassSession;
  student?: Student;
  subject?: Subject;
  teacherName?: string;
  isStudentOrParentView?: boolean;
}

export default function ClassReminderAlert({
  session,
  student,
  subject,
  teacherName,
  isStudentOrParentView = false,
}: ClassReminderAlertProps) {
  const [scheduled, setScheduled] = useState(false);
  const [loading, setLoading] = useState(false);

  const locationInfo = formatClassLocationText(session.location, student?.address);
  const subjectName = subject?.name || 'Clase Particular';
  const personName = isStudentOrParentView
    ? (teacherName ? `con ${teacherName}` : 'con el profesor')
    : (student ? `con ${student.firstName}` : '');

  const handleSetReminder = async () => {
    setLoading(true);
    try {
      const res = await scheduleClassReminder(session, student, subject, 60);
      if (res.success) {
        setScheduled(true);
        Alert.alert(
          '🔔 Alerta Programada',
          `${res.message}\n\nTe avisaremos de la clase de ${subjectName} y su lugar (${locationInfo.title}).`
        );
      } else {
        Alert.alert('Aviso', res.message);
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo programar el recordatorio.');
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsApp = () => {
    const targetPhone = student?.phone || student?.parentPhone || '';
    sendWhatsAppReminder(targetPhone, session, student, subject, teacherName);
  };

  return (
    <View style={styles.card}>
      {/* Top Banner Row */}
      <View style={styles.topRow}>
        <View style={styles.badgeRow}>
          <View style={styles.bellIconBox}>
            <Ionicons name="notifications" size={14} color={Colors.primary} />
          </View>
          <Text style={styles.badgeText}>RECORDATORIO DE CLASE</Text>
        </View>

        <Text style={styles.dateTimeText}>
          {session.date} • {session.startTime}
        </Text>
      </View>

      {/* Class Title & Person */}
      <View style={styles.titleSection}>
        <Text style={styles.subjectTitle}>
          {subjectName} <Text style={styles.personSub}>{personName}</Text>
        </Text>
      </View>

      {/* Location Box - Clear & Prominent */}
      <View style={styles.locationContainer}>
        <View style={styles.locationIconBox}>
          <Ionicons
            name={
              session.location === 'online'
                ? 'videocam'
                : session.location === 'domicilio'
                ? 'home'
                : 'location'
            }
            size={16}
            color={session.location === 'online' ? '#2563EB' : session.location === 'domicilio' ? '#D97706' : '#059669'}
          />
        </View>
        <View style={styles.locationTextBox}>
          <Text style={styles.locationTitle}>{locationInfo.title}</Text>
          <Text style={styles.locationDetail} numberOfLines={1}>
            {locationInfo.detail}
          </Text>
        </View>
      </View>

      {/* Actions: Alert notification & WhatsApp */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionBtn, scheduled && styles.actionBtnActive]}
          onPress={handleSetReminder}
          disabled={loading}
          activeOpacity={0.7}
        >
          <Ionicons
            name={scheduled ? 'checkmark-circle' : 'notifications-outline'}
            size={14}
            color={scheduled ? '#FFFFFF' : Colors.primary}
          />
          <Text style={[styles.actionBtnText, scheduled && styles.actionBtnTextActive]} numberOfLines={1}>
            {scheduled ? 'Alerta Activada' : 'Recordatorio'}
          </Text>
        </TouchableOpacity>

        {!isStudentOrParentView && (student?.phone || student?.parentPhone) && (
          <TouchableOpacity
            style={styles.actionBtnSecondary}
            onPress={handleWhatsApp}
            activeOpacity={0.7}
          >
            <Ionicons name="logo-whatsapp" size={14} color="#16A34A" />
            <Text style={styles.actionBtnSecondaryText} numberOfLines={1}>
              Avisar WhatsApp
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
      default: {},
    }),
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bellIconBox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.4,
  },
  dateTimeText: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  titleSection: {
    marginVertical: 4,
  },
  subjectTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  personSub: {
    fontSize: FontSizes.md,
    fontWeight: '400',
    color: Colors.textSecondary,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    marginVertical: Spacing.xs,
    gap: Spacing.sm,
  },
  locationIconBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  locationTextBox: {
    flex: 1,
  },
  locationTitle: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  locationDetail: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: Spacing.xs,
  },
  actionBtn: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#EEF2FF',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  actionBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  actionBtnTextActive: {
    color: '#FFFFFF',
  },
  actionBtnSecondary: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#F0FDF4',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  actionBtnSecondaryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
  },
});
