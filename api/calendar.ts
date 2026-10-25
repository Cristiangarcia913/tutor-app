import fs from 'fs';
import path from 'path';

interface ApiRequest {
  method?: string;
  query: Record<string, string | string[] | undefined>;
  body: any;
}

interface ApiResponse {
  status: (code: number) => ApiResponse;
  setHeader: (name: string, value: string) => void;
  json: (data: any) => void;
  send?: (data: any) => void;
  end: (data?: any) => void;
}

// En memoria para respuestas inmediatas dentro de la misma instancia
const memoryCache: Record<string, string> = {};

const getCacheFilePath = (key: string) => {
  const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, '') || 'default';
  return path.join('/tmp', `tutorapp_cal_${safeKey}.ics`);
};

const escapeICalText = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n');
};

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

const buildICalFromItems = (
  items: Array<{
    id?: string;
    studentName: string;
    date: string;
    startTime: string;
    endTime: string;
    duration?: number;
    isPaid?: boolean;
    location?: string;
    notes?: string;
  }>
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

  if (!items || items.length === 0) {
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    lines.push('BEGIN:VEVENT');
    lines.push('UID:tutorapp-bienvenida@tutorapp.es');
    lines.push(`DTSTAMP:${now}`);
    lines.push(`DTSTART;TZID=Europe/Madrid:${today}T170000`);
    lines.push(`DTEND;TZID=Europe/Madrid:${today}T180000`);
    lines.push('SUMMARY:TutorApp - Calendario Conectado');
    lines.push('DESCRIPTION:Tus clases de matemáticas se sincronizarán aquí automáticamente.');
    lines.push('STATUS:CONFIRMED');
    lines.push('END:VEVENT');
  } else {
    items.forEach((item, idx) => {
      const studentName = item.studentName || 'Alumno';
      const startStr = formatICalDate(item.date, item.startTime);
      const endStr = formatICalDate(item.date, item.endTime || '18:00');
      const paymentStatus = item.isPaid ? 'Pagada ✓' : 'Pendiente de cobro ⏳';
      const desc = `Clase de Matemáticas con ${studentName}\\nEstado: ${paymentStatus}\\nDuración: ${item.duration || 60} min${item.notes ? '\\nNotas: ' + item.notes : ''}`;

      lines.push('BEGIN:VEVENT');
      lines.push(`UID:tutorapp-${item.id || idx}-${item.date}@tutorapp.es`);
      lines.push(`DTSTAMP:${now}`);
      lines.push(`DTSTART;TZID=Europe/Madrid:${startStr}`);
      lines.push(`DTEND;TZID=Europe/Madrid:${endStr}`);
      lines.push(`SUMMARY:${escapeICalText(`Matemáticas - ${studentName}`)}`);
      lines.push(`LOCATION:${escapeICalText(item.location || 'Presencial')}`);
      lines.push(`DESCRIPTION:${escapeICalText(desc)}`);
      lines.push('STATUS:CONFIRMED');
      lines.push('END:VEVENT');
    });
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
};

const decodeClassesFromUrl = (dStr: string): any[] => {
  try {
    const raw = decodeURIComponent(dStr);
    let jsonStr = '';
    try {
      jsonStr = Buffer.from(raw, 'base64').toString('utf8');
    } catch {
      jsonStr = decodeURIComponent(escape(Buffer.from(raw, 'base64').toString('binary')));
    }
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed)) {
      return parsed.map((c: any) => ({
        id: c.id,
        studentName: c.s,
        date: c.d,
        startTime: c.t,
        endTime: c.e,
        duration: c.u,
        isPaid: c.p === 1,
        location: c.l,
        notes: c.n,
      }));
    }
    return [];
  } catch (err) {
    return [];
  }
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  // Configurar CORS para permitir peticiones desde la PWA
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200);
    return res.end();
  }

  const key = (req.query.key as string) || 'cristian';

  // POST: La app envía los datos actualizados del calendario
  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const icsData = body?.ics || '';

      if (!icsData) {
        res.status(400);
        return res.json({ error: 'Faltan datos ICS' });
      }

      memoryCache[key] = icsData;

      try {
        fs.writeFileSync(getCacheFilePath(key), icsData, 'utf8');
      } catch (fsErr) {
        // Ignorar restricciones en entornos de solo lectura
      }

      res.status(200);
      return res.json({ success: true, updated: new Date().toISOString() });
    } catch (e: any) {
      res.status(500);
      return res.json({ error: e?.message || 'Error al procesar el calendario' });
    }
  }

  // GET: Apple Calendar o cualquier cliente iCal solicita el feed de suscripción
  if (req.method === 'GET' || !req.method) {
    let icsContent = '';

    // 1. Si la URL incluye clases codificadas en el parámetro 'd', decodificarlas directamente
    const dParam = (req.query.d as string) || '';
    if (dParam) {
      const decodedItems = decodeClassesFromUrl(dParam);
      if (decodedItems.length > 0) {
        icsContent = buildICalFromItems(decodedItems);
        // Guardar en cache para peticiones posteriores sin parámetro
        memoryCache[key] = icsContent;
      }
    }

    // 2. Si no hay 'd' o no se pudo decodificar, buscar en memoria o archivo local
    if (!icsContent) {
      icsContent = memoryCache[key];
    }

    if (!icsContent) {
      try {
        const filePath = getCacheFilePath(key);
        if (fs.existsSync(filePath)) {
          icsContent = fs.readFileSync(filePath, 'utf8');
        }
      } catch (readErr) {
        // Ignorar error de lectura
      }
    }

    // 3. Fallback: generar calendario inicial perfectamente válido con VTIMEZONE
    if (!icsContent) {
      icsContent = buildICalFromItems([]);
    }

    // Cabeceras estándares RFC 5545 para Apple Calendar
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'inline; filename="clases_cristian.ics"');
    res.setHeader('Cache-Control', 'no-cache, no-store, max-age=0, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    res.status(200);
    return res.end(icsContent);
  }

  res.status(405);
  return res.json({ error: 'Método no permitido' });
}
