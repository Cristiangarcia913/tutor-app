// =============================================================================
// TutorApp - Calendario Académico y Festivos Escolares (España)
// Detecta festivos nacionales, puentes y vacaciones escolares para no dar clase
// =============================================================================

export interface Holiday {
  date: string; // YYYY-MM-DD
  name: string;
  type: 'festivo' | 'vacaciones';
}

// Festivos y periodos vacacionales estándar para el curso 2026/2027
export const ACADEMIC_HOLIDAYS: Holiday[] = [
  // Festivos del primer trimestre
  { date: '2026-10-12', name: 'Fiesta Nacional de España', type: 'festivo' },
  { date: '2026-11-01', name: 'Día de Todos los Santos', type: 'festivo' },
  { date: '2026-11-02', name: 'Lunes siguiente a Todos los Santos', type: 'festivo' },
  { date: '2026-12-06', name: 'Día de la Constitución Española', type: 'festivo' },
  { date: '2026-12-07', name: 'Puente de la Constitución', type: 'festivo' },
  { date: '2026-12-08', name: 'Inmaculada Concepción', type: 'festivo' },

  // Vacaciones de Navidad (23 de Diciembre a 7 de Enero)
  { date: '2026-12-23', name: 'Vacaciones de Navidad', type: 'vacaciones' },
  { date: '2026-12-24', name: 'Nochebuena', type: 'vacaciones' },
  { date: '2026-12-25', name: 'Navidad', type: 'festivo' },
  { date: '2026-12-26', name: 'Vacaciones de Navidad', type: 'vacaciones' },
  { date: '2026-12-27', name: 'Vacaciones de Navidad', type: 'vacaciones' },
  { date: '2026-12-28', name: 'Vacaciones de Navidad', type: 'vacaciones' },
  { date: '2026-12-29', name: 'Vacaciones de Navidad', type: 'vacaciones' },
  { date: '2026-12-30', name: 'Vacaciones de Navidad', type: 'vacaciones' },
  { date: '2026-12-31', name: 'Nochevieja', type: 'vacaciones' },
  { date: '2027-01-01', name: 'Año Nuevo', type: 'festivo' },
  { date: '2027-01-02', name: 'Vacaciones de Navidad', type: 'vacaciones' },
  { date: '2027-01-03', name: 'Vacaciones de Navidad', type: 'vacaciones' },
  { date: '2027-01-04', name: 'Vacaciones de Navidad', type: 'vacaciones' },
  { date: '2027-01-05', name: 'Vacaciones de Navidad', type: 'vacaciones' },
  { date: '2027-01-06', name: 'Epifanía del Señor (Reyes Magos)', type: 'festivo' },
  { date: '2027-01-07', name: 'Vacaciones de Navidad', type: 'vacaciones' },

  // Segundo Trimestre y Semana Santa
  { date: '2027-02-28', name: 'Día de la Comunidad / Semana Blanca', type: 'vacaciones' },
  { date: '2027-03-19', name: 'San José', type: 'festivo' },
  // Semana Santa 2027 (22 Marzo al 29 Marzo aprox)
  { date: '2027-03-22', name: 'Lunes Santo (Semana Santa)', type: 'vacaciones' },
  { date: '2027-03-23', name: 'Martes Santo (Semana Santa)', type: 'vacaciones' },
  { date: '2027-03-24', name: 'Miércoles Santo (Semana Santa)', type: 'vacaciones' },
  { date: '2027-03-25', name: 'Jueves Santo', type: 'festivo' },
  { date: '2027-03-26', name: 'Viernes Santo', type: 'festivo' },
  { date: '2027-03-27', name: 'Sábado Santo', type: 'vacaciones' },
  { date: '2027-03-28', name: 'Domingo de Resurrección', type: 'vacaciones' },
  { date: '2027-03-29', name: 'Lunes de Pascua', type: 'vacaciones' },

  // Tercer Trimestre
  { date: '2027-05-01', name: 'Fiesta del Trabajo', type: 'festivo' },
  { date: '2027-05-02', name: 'Fiesta de la Comunidad', type: 'festivo' },
  { date: '2027-05-03', name: 'Lunes festivo puente de Mayo', type: 'festivo' },
];

/**
 * Comprueba si una fecha concreta coincide con un festivo o periodo vacacional
 */
export function checkAcademicHoliday(dateStr: string): { isOff: boolean; holiday?: Holiday } {
  // Comprobar coincidencia exacta por fecha
  const found = ACADEMIC_HOLIDAYS.find((h) => h.date === dateStr);
  if (found) {
    return { isOff: true, holiday: found };
  }

  // Comprobar fines de semana por defecto si se requiere
  return { isOff: false };
}

export interface RecurrenceConfig {
  startDate: string; // YYYY-MM-DD
  frequency: 'weekly' | 'biweekly';
  period: '1month' | '3months' | 'course_end';
  customEndDate?: string;
  skipHolidays: boolean; // omitir festivos escolares
}

export interface ScheduleCalculationResult {
  validDates: string[];
  skippedDates: { date: string; reason: string }[];
}

/**
 * Genera el calendario de clases recurrentes saltando automáticamente
 * los festivos y vacaciones escolares del calendario académico.
 */
export function generateRecurringClassDates(config: RecurrenceConfig): ScheduleCalculationResult {
  const validDates: string[] = [];
  const skippedDates: { date: string; reason: string }[] = [];

  const start = new Date(config.startDate + 'T00:00:00');
  let end = new Date(start);

  if (config.period === '1month') {
    end.setMonth(end.getMonth() + 1);
  } else if (config.period === '3months') {
    end.setMonth(end.getMonth() + 3);
  } else if (config.period === 'course_end') {
    // Fin de curso escolar: 22 de Junio
    const year = start.getMonth() >= 8 ? start.getFullYear() + 1 : start.getFullYear();
    end = new Date(`${year}-06-22T23:59:59`);
  } else if (config.customEndDate) {
    end = new Date(config.customEndDate + 'T23:59:59');
  }

  const stepDays = config.frequency === 'biweekly' ? 14 : 7;
  const current = new Date(start);

  // Generamos hasta un máximo de 40 sesiones
  let iterations = 0;
  while (current <= end && iterations < 40) {
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, '0');
    const dd = String(current.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    if (config.skipHolidays) {
      const holidayCheck = checkAcademicHoliday(dateStr);
      if (holidayCheck.isOff && holidayCheck.holiday) {
        skippedDates.push({
          date: dateStr,
          reason: holidayCheck.holiday.name,
        });
        current.setDate(current.getDate() + stepDays);
        iterations++;
        continue;
      }
    }

    validDates.push(dateStr);
    current.setDate(current.getDate() + stepDays);
    iterations++;
  }

  return { validDates, skippedDates };
}
