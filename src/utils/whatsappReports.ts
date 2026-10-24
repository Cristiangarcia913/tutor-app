import { Linking, Alert, Clipboard } from 'react-native';
import type { Student, ClassSession } from '../types';

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const WEEKDAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export interface MonthlyBreakdownResult {
  monthName: string;
  year: number;
  classesCount: number;
  cancelledCount: number;
  totalAmount: number;
  messageText: string;
}

/**
 * Genera el informe mensual de clases y cobros formateado para WhatsApp
 */
export function buildMonthlyWhatsAppReport(params: {
  student: Student;
  classes: ClassSession[];
  year: number;
  monthIndex: number; // 0-11
  teacherName?: string;
  teacherPhone?: string;
  customNote?: string;
}): MonthlyBreakdownResult {
  const { student, classes, year, monthIndex, teacherName, teacherPhone, customNote } = params;

  const monthStr = (monthIndex + 1).toString().padStart(2, '0');
  const targetPrefix = `${year}-${monthStr}`;
  const monthName = `${MONTH_NAMES[monthIndex]} de ${year}`;

  // Filtrar clases pertenecientes a este mes y año
  const monthClasses = classes
    .filter((c) => c.date.startsWith(targetPrefix))
    .sort((a, b) => a.date.localeCompare(b.date));

  let totalAmount = 0;
  let classesCount = 0;
  let cancelledCount = 0;

  const lines: string[] = [];

  for (const cls of monthClasses) {
    const dateObj = new Date(`${cls.date}T00:00:00`);
    const dayNumber = parseInt(cls.date.split('-')[2], 10);
    const dayName = WEEKDAY_NAMES[dateObj.getDay()];

    if (cls.status === 'cancelled') {
      cancelledCount++;
      const reason = cls.cancelReason?.trim() || 'Aviso previo / Festivo';
      lines.push(`• Día ${dayNumber} (${dayName}): ❌ Clase cancelada - Motivo: ${reason}`);
    } else if (cls.isRescheduled || cls.rescheduledFromDate) {
      classesCount++;
      totalAmount += cls.totalAmount;
      const originalDay = cls.rescheduledFromDate
        ? parseInt(cls.rescheduledFromDate.split('-')[2], 10)
        : '';
      const originNote = originalDay ? ` (cambiada del día ${originalDay})` : '';
      const paidNote = cls.isPaid ? ' [✓ Pagada]' : '';
      lines.push(
        `• Día ${dayNumber} (${dayName}): 🔄 Clase cambiada a las ${cls.startTime}${originNote} - ${cls.totalAmount.toFixed(2).replace('.', ',')} €${paidNote}`
      );
    } else {
      classesCount++;
      totalAmount += cls.totalAmount;
      const paidNote = cls.isPaid ? ' [✓ Pagada]' : '';
      lines.push(
        `• Día ${dayNumber} (${dayName}): Clase ${cls.startTime} - ${cls.totalAmount.toFixed(2).replace('.', ',')} €${paidNote}`
      );
    }
  }

  const tutorGreetingName = student.parentName?.trim() || student.firstName;
  const formattedTotal = totalAmount.toFixed(2).replace('.', ',') + ' €';

  let msg = `👋 ¡Buenos días ${tutorGreetingName}!\n\n`;
  msg += `Te mando el resumen de las clases de ${student.firstName} de este mes (${MONTH_NAMES[monthIndex]}) y el total a abonar:\n\n`;

  if (lines.length > 0) {
    msg += lines.join('\n') + '\n\n';
  } else {
    msg += `• No hay sesiones registradas en este periodo.\n\n`;
  }

  msg += `💰 Total a abonar: ${formattedTotal}\n`;
  msg += `(${classesCount} ${classesCount === 1 ? 'clase realizada' : 'clases realizadas'}${cancelledCount > 0 ? `, ${cancelledCount} cancelada(s)` : ''})\n\n`;

  if (teacherPhone) {
    msg += `📱 Pago por Bizum al teléfono: ${teacherPhone}\n`;
    msg += `(Concepto: Clases ${student.firstName})\n`;
  }
  msg += `💵 O en efectivo en la próxima clase.\n`;

  if (customNote && customNote.trim().length > 0) {
    msg += `\nNota: ${customNote.trim()}\n`;
  }

  msg += `\n¡Muchas gracias y buen día!\n`;
  if (teacherName) {
    msg += `${teacherName}`;
  }

  return {
    monthName,
    year,
    classesCount,
    cancelledCount,
    totalAmount,
    messageText: msg.trim(),
  };
}

/**
 * Normaliza el número de teléfono para enviar por WhatsApp (+34 por defecto para España si son 9 dígitos)
 */
export function formatPhoneForWhatsApp(rawPhone: string): string {
  let cleaned = rawPhone.replace(/[^0-9]/g, '');
  if (cleaned.length === 9 && (cleaned.startsWith('6') || cleaned.startsWith('7') || cleaned.startsWith('8') || cleaned.startsWith('9'))) {
    cleaned = '34' + cleaned;
  }
  return cleaned;
}

/**
 * Abre WhatsApp con el destinatario y el texto listo para enviar
 */
export async function openWhatsAppMessage(phone: string, text: string): Promise<boolean> {
  const cleanPhone = formatPhoneForWhatsApp(phone);
  const encoded = encodeURIComponent(text);

  if (!cleanPhone) {
    Alert.alert(
      'Teléfono no configurado',
      'El alumno o su tutor no tienen un teléfono guardado. Hemos copiado el mensaje en el portapapeles.',
      [{ text: 'Entendido' }]
    );
    return false;
  }

  const webUrl = `https://wa.me/${cleanPhone}?text=${encoded}`;
  const appUrl = `whatsapp://send?phone=${cleanPhone}&text=${encoded}`;

  try {
    const canOpen = await Linking.canOpenURL(appUrl);
    if (canOpen) {
      await Linking.openURL(appUrl);
      return true;
    } else {
      await Linking.openURL(webUrl);
      return true;
    }
  } catch (err) {
    try {
      await Linking.openURL(webUrl);
      return true;
    } catch {
      Alert.alert('Error', 'No se pudo abrir WhatsApp en este dispositivo.');
      return false;
    }
  }
}
