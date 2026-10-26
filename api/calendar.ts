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

const computeEndTime = (startTime: string, durationMinutes: number = 60): string => {
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
    lines.push(`DTSTART:${today}T170000`);
    lines.push(`DTEND:${today}T180000`);
    lines.push('SUMMARY:TutorApp - Calendario Conectado');
    lines.push('DESCRIPTION:Tus clases de matemáticas se sincronizarán aquí automáticamente.');
    lines.push('STATUS:CONFIRMED');
    lines.push('END:VEVENT');
  } else {
    items.forEach((item, idx) => {
      const studentName = item.studentName || 'Alumno';
      const effectiveEndTime = item.endTime && item.endTime > item.startTime
        ? item.endTime
        : computeEndTime(item.startTime, item.duration || 60);
      const startStr = formatICalDate(item.date, item.startTime);
      const endStr = formatICalDate(item.date, effectiveEndTime);
      const paymentStatus = item.isPaid ? 'Pagada ✓' : 'Pendiente de cobro ⏳';
      const desc = `Clase con ${studentName}\\nEstado: ${paymentStatus}\\nDuración: ${item.duration || 60} min${item.notes ? '\\nNotas: ' + item.notes : ''}`;

      lines.push('BEGIN:VEVENT');
      lines.push(`UID:tutorapp-${item.id || idx}-${item.date}@tutorapp.es`);
      lines.push(`DTSTAMP:${now}`);
      lines.push(`DTSTART:${startStr}`);
      lines.push(`DTEND:${endStr}`);
      lines.push(`SUMMARY:${escapeICalText(`Clase - ${studentName}`)}`);
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

      // Sincronizar en la nube permanente (restful-api) y en tiempo real (ntfy.sh)
      try {
        await Promise.allSettled([
          fetch('https://api.restful-api.dev/objects/ff808181a09d98f701a1780e32f514cd', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: `tutorapp_cal_${key}`,
              data: { ics: icsData },
            }),
          }),
          fetch(`https://ntfy.sh/tutorapp_cal_${key}_v2`, {
            method: 'POST',
            body: icsData,
            headers: {
              'Title': 'TutorApp Calendar Sync',
              'Tags': 'calendar',
              'Filename': 'calendar.ics',
            },
          }),
          fetch(`https://ntfy.sh/tutorapp_cal_${key}`, {
            method: 'POST',
            body: icsData,
            headers: {
              'Title': 'TutorApp Calendar Sync',
              'Tags': 'calendar',
              'Filename': 'calendar.ics',
            },
          }),
        ]);
      } catch (cloudErr) {
        // Fallback silencioso si falla la conexión externa
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
    let icsContent = memoryCache[key];

    // 1. Si no está en memoria, comprobar en /tmp local
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

    // 2. Si no está en memoria ni /tmp, consultar almacenamiento permanente en la nube (restful-api)
    if (!icsContent) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const persistentRes = await fetch(
          'https://api.restful-api.dev/objects/ff808181a09d98f701a1780e32f514cd',
          { signal: controller.signal }
        );
        clearTimeout(timeoutId);
        if (persistentRes.ok) {
          const json = await persistentRes.json();
          if (json?.data?.ics && json.data.ics.includes('BEGIN:VCALENDAR')) {
            icsContent = json.data.ics;
            memoryCache[key] = icsContent;
            try {
              fs.writeFileSync(getCacheFilePath(key), icsContent, 'utf8');
            } catch {}
          }
        }
      } catch (persistentErr) {
        // Continuar al fallback de ntfy
      }
    }

    // 3. Fallback: consultar la nube en tiempo real (ntfy.sh)
    if (!icsContent) {
      const topics = [`tutorapp_cal_${key}_v2`, `tutorapp_cal_${key}`];
      for (const topic of topics) {
        if (icsContent) break;
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3500);
          const cloudRes = await fetch(`https://ntfy.sh/${topic}/json?poll=1`, {
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (cloudRes.ok) {
            const rawText = await cloudRes.text();
            const lines = rawText.trim().split('\n');
            for (let i = lines.length - 1; i >= 0; i--) {
              try {
                const msg = JSON.parse(lines[i]);

                // A) Si ntfy lo almacenó como archivo adjunto (cuando el ICS supera los 4KB)
                if (msg.attachment?.url) {
                  try {
                    const attRes = await fetch(msg.attachment.url);
                    if (attRes.ok) {
                      const attText = await attRes.text();
                      if (attText.includes('BEGIN:VCALENDAR')) {
                        icsContent = attText;
                        memoryCache[key] = icsContent;
                        try {
                          fs.writeFileSync(getCacheFilePath(key), icsContent, 'utf8');
                        } catch {}
                        break;
                      }
                    }
                  } catch (attErr) {}
                }

                // B) Si vino directamente en el cuerpo del mensaje
                if (msg.message && msg.message.includes('BEGIN:VCALENDAR')) {
                  // Descartar mensajes antiguos de prueba que contengan alumnos demo
                  if (msg.message.includes('Alejandro Martínez') || msg.message.includes('Lucía Gómez')) {
                    continue;
                  }
                  icsContent = msg.message;
                  memoryCache[key] = icsContent;
                  try {
                    fs.writeFileSync(getCacheFilePath(key), icsContent, 'utf8');
                  } catch {}
                  break;
                }
              } catch {}
            }
          }
        } catch (cloudGetErr) {
          // Continuar al siguiente topic o fallback
        }
      }
    }

    // 3. Si aún no hay datos y la petición incluye el parámetro de respaldo 'd', decodificarlo
    if (!icsContent && req.query.d) {
      const decodedItems = decodeClassesFromUrl(req.query.d as string);
      if (decodedItems.length > 0) {
        icsContent = buildICalFromItems(decodedItems);
        memoryCache[key] = icsContent;
      }
    }

    // 4. Si aún no hay nada (primer arranque sin clases), devolver evento de bienvenida válido
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
