import { Platform } from 'react-native';
import type { ClassSession, Student, Subject } from '../types';

/**
 * Formatea una fecha y hora local a formato iCalendar (YYYYMMDDTHHMMSS)
 */
const formatICalDate = (dateStr: string, timeStr: string): string => {
  const [y, m, d] = dateStr.split('-');
  const [hh, mm] = (timeStr || '17:00').split(':');
  return `${y}${m}${d}T${(hh || '17').padStart(2, '0')}${(mm || '00').padStart(2, '0')}00`;
};

/**
 * Genera el archivo estándar iCalendar (.ics) RFC 5545 con todas las clases
 */
export const generateICalendarData = (
  classes: ClassSession[],
  students: Record<string, Student> = {},
  subjects: Record<string, Subject> = {},
  teacherName: string = 'Cristian'
): string => {
  const now = new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .split('.')[0] + 'Z';

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TutorApp//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Clases Cristian',
    'X-WR-CALDESC:Calendario de Clases Particulares de Matemáticas',
    'X-WR-TIMEZONE:Europe/Madrid',
  ];

  classes.forEach((cls) => {
    if (cls.status === 'cancelled') return;

    const student = students[cls.studentId];
    const studentName = student ? `${student.firstName} ${student.lastName}`.trim() : 'Alumno';
    const startStr = formatICalDate(cls.date, cls.startTime);
    const endStr = formatICalDate(cls.date, cls.endTime || '18:00');

    let locationText = 'Presencial';
    if (cls.location === 'online') {
      locationText = 'Online por videollamada';
    } else if (cls.location === 'domicilio') {
      locationText = student?.address ? `A domicilio (${student.address})` : 'A domicilio';
    } else if (student?.address) {
      locationText = `Presencial (${student.address})`;
    }

    const paymentStatus = cls.isPaid ? 'Pagada ✓' : 'Pendiente de cobro ⏳';
    const description = `Clase de Matemáticas con ${studentName}\\nEstado: ${paymentStatus}\\nDuración: ${cls.duration} min\\n${cls.notes ? 'Notas: ' + cls.notes : ''}`;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:tutorapp-${cls.id}@tutorapp.es`);
    lines.push(`DTSTAMP:${now}`);
    lines.push(`DTSTART:${startStr}`);
    lines.push(`DTEND:${endStr}`);
    lines.push(`SUMMARY:Matemáticas - ${studentName}`);
    lines.push(`LOCATION:${locationText}`);
    lines.push(`DESCRIPTION:${description}`);
    lines.push('STATUS:CONFIRMED');
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
};

/**
 * Obtiene la URL de suscripción para Apple Calendar (webcal://)
 */
export const getCalendarSubscriptionUrl = (feedKey: string = 'cristian'): string => {
  if (typeof window === 'undefined') return '';
  const host = window.location.host;
  return `webcal://${host}/api/calendar.ics?key=${feedKey}`;
};

/**
 * Obtiene la URL HTTPS estándar para el feed .ics
 */
export const getCalendarHttpsUrl = (feedKey: string = 'cristian'): string => {
  if (typeof window === 'undefined') return '';
  const origin = window.location.origin;
  return `${origin}/api/calendar.ics?key=${feedKey}`;
};

/**
 * Envía automáticamente las clases actuales al servidor Vercel para mantener la suscripción iCal al día
 */
export const syncCalendarToServer = async (
  classes: ClassSession[],
  students: Record<string, Student> = {},
  subjects: Record<string, Subject> = {},
  teacherName: string = 'Cristian',
  feedKey: string = 'cristian'
): Promise<boolean> => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return false;
  }

  try {
    const icsContent = generateICalendarData(classes, students, subjects, teacherName);
    
    // Guardar también copia local para descarga offline directa
    localStorage.setItem('tutorapp_cached_ics', icsContent);

    const response = await fetch(`/api/calendar?key=${feedKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key: feedKey,
        ics: icsContent,
        updatedAt: new Date().toISOString(),
      }),
    });

    return response.ok;
  } catch (err) {
    console.warn('Silent calendar cloud sync notice:', err);
    return false;
  }
};

/**
 * Descarga o abre directamente el archivo .ics en el iPhone para importación instantánea
 */
export const downloadIcsFile = (
  classes: ClassSession[],
  students: Record<string, Student> = {},
  subjects: Record<string, Subject> = {},
  teacherName: string = 'Cristian'
): void => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;

  const icsData = generateICalendarData(classes, students, subjects, teacherName);
  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'clases_cristian.ics');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
