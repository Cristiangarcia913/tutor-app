import { Platform, Linking, Alert } from 'react-native';
import type { ClassSession, Student, Subject } from '../types';

let Notifications: any = null;
if (Platform.OS !== 'web') {
  try {
    Notifications = require('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch (e) {
    console.warn('expo-notifications not available:', e);
  }
}

/**
 * Devuelve el texto descriptivo del lugar y modalidad de la clase
 */
export function formatClassLocationText(
  location: 'presencial' | 'online' | 'domicilio',
  studentAddress?: string,
  customAddress?: string
): { title: string; detail: string; icon: string } {
  switch (location) {
    case 'online':
      return {
        title: '💻 Online por Videollamada',
        detail: customAddress || 'Enlace o plataforma online acordada',
        icon: 'videocam-outline',
      };
    case 'domicilio':
      return {
        title: '🏠 A Domicilio',
        detail: studentAddress || customAddress || 'En el domicilio del alumno',
        icon: 'home-outline',
      };
    case 'presencial':
    default:
      return {
        title: '📍 Presencial',
        detail: customAddress || studentAddress || 'En el aula habitual de clases',
        icon: 'location-outline',
      };
  }
}

/**
 * Solicita permisos de notificación tanto en móvil (iOS / Android) como en Navegador Web
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        return true;
      }
      const perm = await Notification.requestPermission();
      return perm === 'granted';
    }
    return false;
  }

  if (Notifications) {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      return finalStatus === 'granted';
    } catch (e) {
      console.warn('Error requesting native notification permission:', e);
      return false;
    }
  }

  return false;
}

/**
 * Dispara una notificación de prueba instantánea con el recordatorio y lugar
 */
export async function sendInstantReminderNotification(
  title: string,
  body: string
): Promise<boolean> {
  const granted = await requestNotificationPermission();
  if (!granted) {
    Alert.alert(
      'Permiso requerido',
      'Por favor, activa las notificaciones en los ajustes de tu dispositivo para recibir los recordatorios de clase.'
    );
    return false;
  }

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.png',
      });
      return true;
    }
  }

  if (Notifications) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
        },
        trigger: null, // Inmediata
      });
      return true;
    } catch (e) {
      console.warn('Error scheduling notification:', e);
    }
  }

  return false;
}

/**
 * Programa una notificación de recordatorio para una clase programada
 */
export async function scheduleClassReminder(
  session: ClassSession,
  student?: Student,
  subject?: Subject,
  minutesBefore: number = 60
): Promise<{ success: boolean; message: string }> {
  const loc = formatClassLocationText(session.location, student?.address);
  const subjectName = subject?.name || 'Clase particular';
  const studentName = student ? `${student.firstName} ${student.lastName}`.trim() : 'el alumno';

  const title = `🔔 Recordatorio de Clase: ${subjectName}`;
  const body = `Clase con ${studentName} a las ${session.startTime}.\nLugar: ${loc.title} (${loc.detail}).`;

  // Calcular fecha y hora de la clase
  const [hours, minutes] = session.startTime.split(':').map(Number);
  const classDate = new Date(`${session.date}T${session.startTime}:00`);
  const triggerDate = new Date(classDate.getTime() - minutesBefore * 60 * 1000);

  const now = new Date();

  // Si la clase ya pasó o es en menos tiempo del margen, mandar recordatorio inmediato
  const isImmediate = triggerDate.getTime() <= now.getTime();

  const granted = await requestNotificationPermission();
  if (!granted) {
    return {
      success: false,
      message: 'No se han concedido permisos para enviar notificaciones en este dispositivo.',
    };
  }

  if (Platform.OS === 'web') {
    if (isImmediate) {
      await sendInstantReminderNotification(title, body);
    } else {
      const msUntil = triggerDate.getTime() - now.getTime();
      setTimeout(() => {
        sendInstantReminderNotification(title, body);
      }, Math.min(msUntil, 2147483647));
    }
    return {
      success: true,
      message: isImmediate
        ? 'Alerta de clase mostrada correctamente.'
        : `Recordatorio programado para avisarte ${minutesBefore} minutos antes de la clase.`,
    };
  }

  if (Notifications) {
    try {
      if (isImmediate) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            sound: true,
          },
          trigger: null,
        });
      } else {
        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            sound: true,
          },
          trigger: {
            date: triggerDate,
          },
        });
      }
      return {
        success: true,
        message: isImmediate
          ? 'Alerta de clase activada para hoy.'
          : `Recordatorio programado ${minutesBefore} min antes de la clase.`,
      };
    } catch (e) {
      console.warn('Error in native notification schedule:', e);
    }
  }

  return {
    success: true,
    message: 'Alerta activada.',
  };
}

/**
 * Genera el texto del mensaje para enviar por WhatsApp al alumno o padre
 */
export function buildWhatsAppReminderMessage(
  session: ClassSession,
  student?: Student,
  subject?: Subject,
  teacherName?: string
): string {
  const loc = formatClassLocationText(session.location, student?.address);
  const subjectName = subject?.name || 'Clase particular';
  const name = student?.firstName || 'estudiante';

  return `👋 ¡Hola ${name}! Te recuerdo nuestra próxima clase:

📚 Asignatura: ${subjectName}
📅 Fecha: ${session.date}
⏰ Horario: ${session.startTime} a ${session.endTime} (${session.duration} min)
${loc.title}: ${loc.detail}
${session.homework ? `📝 Tareas a revisar: ${session.homework}\n` : ''}
¡Nos vemos en clase!
${teacherName ? `— ${teacherName}` : ''}`;
}

/**
 * Abre la app de WhatsApp con el recordatorio listo para enviar
 */
export async function sendWhatsAppReminder(
  phone: string,
  session: ClassSession,
  student?: Student,
  subject?: Subject,
  teacherName?: string
): Promise<void> {
  const message = buildWhatsAppReminderMessage(session, student, subject, teacherName);
  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  const encoded = encodeURIComponent(message);
  const url = cleanPhone ? `https://wa.me/${cleanPhone.replace('+', '')}?text=${encoded}` : `whatsapp://send?text=${encoded}`;

  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      // Fallback a enlace web de WhatsApp
      await Linking.openURL(`https://api.whatsapp.com/send?text=${encoded}`);
    }
  } catch (err) {
    Alert.alert('Error', 'No se pudo abrir WhatsApp en este dispositivo.');
  }
}
