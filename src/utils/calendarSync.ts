import { Platform } from 'react-native';
import type { ClassSession, Student, Subject } from '../types';

/**
 * Escapa caracteres especiales según el estándar RFC 5545 para iCalendar
 */
const escapeICalText = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n');
};

export const computeEndTime = (startTime: string, durationMinutes: number = 60): string => {
  try {
    const [h, m] = (startTime || '17:00').split(':').map(Number);
    const total = (isNaN(h) ? 17 : h) * 60 + (isNaN(m) ? 0 : m) + (durationMinutes || 60);
    const endH = Math.floor(total / 60) % 24;
    const endM = total % 60;
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  } catch {
    return '18:00';
  }
};

/**
 * Formatea una fecha y hora local a formato iCalendar (YYYYMMDDTHHMMSS)
 */
const formatICalDate = (dateStr: string, timeStr: string): string => {
  const [y, m, d] = (dateStr || '').split('-');
  const [hh, mm] = (timeStr || '17:00').split(':');
  const safeY = y || '2026';
  const safeM = (m || '01').padStart(2, '0');
  const safeD = (d || '01').padStart(2, '0');
  const safeH = (hh || '17').padStart(2, '0');
  const safeMin = (mm || '00').padStart(2, '0');
  return `${safeY}${safeM}${safeD}T${safeH}${safeMin}00`;
};

/**
 * Genera el archivo estándar iCalendar (.ics) RFC 5545 con soporte completo de zona horaria VTIMEZONE
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
    'PRODID:-//Cristian//TutorApp Clases//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Clases Cristian',
    'X-WR-CALDESC:Clases Particulares de Matemáticas',
    'X-WR-TIMEZONE:Europe/Madrid',
    'BEGIN:VTIMEZONE',
    'TZID:Europe/Madrid',
    'X-LIC-LOCATION:Europe/Madrid',
    'BEGIN:DAYLIGHT',
    'TZOFFSETFROM:+0100',
    'TZOFFSETTO:+0200',
    'TZNAME:CEST',
    'DTSTART:19700329T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
    'END:DAYLIGHT',
    'BEGIN:STANDARD',
    'TZOFFSETFROM:+0200',
    'TZOFFSETTO:+0100',
    'TZNAME:CET',
    'DTSTART:19701025T030000',
    'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
    'END:STANDARD',
    'END:VTIMEZONE',
  ];

  const activeClasses = classes.filter((cls) => cls.status !== 'cancelled');

  if (activeClasses.length === 0) {
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    lines.push('BEGIN:VEVENT');
    lines.push('UID:tutorapp-bienvenida@tutorapp.es');
    lines.push(`DTSTAMP:${now}`);
    lines.push(`DTSTART:${today}T170000`);
    lines.push(`DTEND:${today}T180000`);
    lines.push('SUMMARY:TutorApp - Calendario Conectado');
    lines.push('DESCRIPTION:Tus clases de matemáticas se sincronizarán aquí automáticamente.');
    lines.push('STATUS:CONFIRMED');
    lines.push('END:VEVENT');
  } else {
    activeClasses.forEach((cls) => {
      const student = students[cls.studentId];
      const studentName = student ? `${student.firstName} ${student.lastName}`.trim() : 'Alumno';
      const effectiveEndTime = cls.endTime && cls.endTime > cls.startTime
        ? cls.endTime
        : computeEndTime(cls.startTime, cls.duration || 60);
      const startStr = formatICalDate(cls.date, cls.startTime);
      const endStr = formatICalDate(cls.date, effectiveEndTime);

      let locationText = 'Presencial';
      if (cls.location === 'online') {
        locationText = 'Online por videollamada';
      } else if (cls.location === 'domicilio') {
        locationText = student?.address ? `A domicilio (${student.address})` : 'A domicilio';
      } else if (student?.address) {
        locationText = `Presencial (${student.address})`;
      }

      const paymentStatus = cls.isPaid ? 'Pagada ✓' : 'Pendiente de cobro ⏳';
      const description = `Clase con ${studentName}\\nEstado: ${paymentStatus}\\nDuración: ${cls.duration} min${cls.notes ? '\\nNotas: ' + cls.notes : ''}`;

      lines.push('BEGIN:VEVENT');
      lines.push(`UID:tutorapp-${cls.id}-${cls.date}@tutorapp.es`);
      lines.push(`DTSTAMP:${now}`);
      lines.push(`DTSTART:${startStr}`);
      lines.push(`DTEND:${endStr}`);
      lines.push(`SUMMARY:${escapeICalText(`Clase - ${studentName}`)}`);
      lines.push(`LOCATION:${escapeICalText(locationText)}`);
      lines.push(`DESCRIPTION:${escapeICalText(description)}`);
      lines.push('STATUS:CONFIRMED');
      lines.push('END:VEVENT');
    });
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
};

/**
 * Codifica de manera compacta las clases para incluirlas en la URL
 */
export const encodeClassesForUrl = (
  classes: ClassSession[] = [],
  students: Record<string, Student> = {}
): string => {
  const compact = classes
    .filter((c) => c.status !== 'cancelled')
    .slice(0, 100)
    .map((c) => {
      const student = students[c.studentId];
      const studentName = student ? `${student.firstName} ${student.lastName}`.trim() : 'Alumno';
      let loc = 'Presencial';
      if (c.location === 'online') loc = 'Online';
      else if (c.location === 'domicilio') loc = student?.address ? `Domicilio (${student.address})` : 'A domicilio';
      else if (student?.address) loc = `Presencial (${student.address})`;

      const startTime = c.startTime || '17:00';
      const duration = c.duration || 60;
      const endTime = c.endTime && c.endTime > startTime ? c.endTime : computeEndTime(startTime, duration);

      return {
        id: c.id,
        s: studentName,
        d: c.date,
        t: startTime,
        e: endTime,
        u: duration,
        p: c.isPaid ? 1 : 0,
        l: loc,
        n: c.notes || '',
      };
    });

  if (compact.length === 0) return '';

  try {
    const jsonStr = JSON.stringify(compact);
    if (typeof window !== 'undefined' && window.btoa) {
      return encodeURIComponent(window.btoa(unescape(encodeURIComponent(jsonStr))));
    }
    return '';
  } catch {
    return '';
  }
};

/**
 * Obtiene la URL de suscripción para Apple Calendar (webcal://)
 * Utiliza la ruta limpia /calendar.ics para que Apple Calendar consulte siempre el feed en vivo
 */
export const getCalendarSubscriptionUrl = (feedKey: string = 'cristian'): string => {
  if (typeof window === 'undefined') return '';
  const host = window.location.host;
  return `webcal://${host}/calendar.ics`;
};

/**
 * Obtiene la URL limpia de suscripción (sin parámetros largos)
 */
export const getCleanSubscriptionUrl = (feedKey: string = 'cristian'): string => {
  if (typeof window === 'undefined') return '';
  const host = window.location.host;
  return `webcal://${host}/calendar.ics`;
};

/**
 * Obtiene la URL HTTPS estándar para el feed .ics en vivo
 */
export const getCalendarHttpsUrl = (feedKey: string = 'cristian'): string => {
  if (typeof window === 'undefined') return '';
  const origin = window.location.origin;
  return `${origin}/calendar.ics`;
};

/**
 * Obtiene la URL HTTPS limpia para copiar y pegar en Ajustes de iPhone
 */
export const getCleanHttpsUrl = (feedKey: string = 'cristian'): string => {
  if (typeof window === 'undefined') return '';
  const origin = window.location.origin;
  return `${origin}/calendar.ics`;
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

    const [apiRes] = await Promise.allSettled([
      fetch(`/api/calendar?key=${feedKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: feedKey,
          ics: icsContent,
          updatedAt: new Date().toISOString(),
        }),
      }),
      fetch(`https://ntfy.sh/tutorapp_cal_${feedKey}_v2`, {
        method: 'POST',
        body: icsContent,
        headers: {
          'Title': 'TutorApp Calendar Sync',
          'Tags': 'calendar',
          'Filename': 'calendar.ics',
        },
      }),
      fetch(`https://ntfy.sh/tutorapp_cal_${feedKey}`, {
        method: 'POST',
        body: icsContent,
        headers: {
          'Title': 'TutorApp Calendar Sync',
          'Tags': 'calendar',
          'Filename': 'calendar.ics',
        },
      }),
    ]);

    return apiRes.status === 'fulfilled' && apiRes.value.ok;
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
  setTimeout(() => {
    try {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      // Ignorar si ya fue removido
    }
  }, 100);
};
