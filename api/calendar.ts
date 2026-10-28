import fs from 'fs';
import path from 'path';

interface ApiRequest {
  method?: string;
  query: Record<string, string | string[] | undefined>;
  headers?: Record<string, string | string[] | undefined>;
  body: any;
}

interface ApiResponse {
  status: (code: number) => ApiResponse;
  setHeader: (name: string, value: string) => void;
  json: (data: any) => void;
  send?: (data: any) => void;
  end: (data?: any) => void;
}

interface CompactClassItem {
  id: string;
  s?: string;
  studentName?: string;
  d: string;
  t: string;
  e?: string;
  u?: number;
  duration?: number;
  p?: number | boolean;
  isPaid?: boolean;
  l?: string;
  location?: string;
  n?: string;
  notes?: string;
}

// En memoria para respuestas inmediatas dentro de la misma instancia serverless
const memoryCache: Record<string, string> = {};

const getCacheFilePath = (key: string) => {
  const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, '') || 'default';
  return path.join('/tmp', `tutorapp_cal_${safeKey}.ics`);
};

// Lista de UIDs ficticios generados por el seeder demo que deben ser cancelados explícitamente en Apple Calendar
const FAKE_UIDS_TO_CANCEL = [
  'tutorapp-mvplw1m790irna-2026-10-31@tutorapp.es',
  'tutorapp-mvplw1m74roglw-2026-10-29@tutorapp.es',
  'tutorapp-mvplw1m71x71is-2026-10-28@tutorapp.es',
  'tutorapp-mvplw1m7dkv638-2026-10-27@tutorapp.es',
  'tutorapp-mvplw1m7k8uf7b-2026-10-26@tutorapp.es',
  'tutorapp-mvplw1m7fpcm8j-2026-10-24@tutorapp.es',
  'tutorapp-mvplw1m6kv36x9-2026-10-21@tutorapp.es',
  'tutorapp-mvplw1m6q1t547-2026-10-19@tutorapp.es',
  'tutorapp-mvplw1m60fsxky-2026-10-16@tutorapp.es',
  'tutorapp-mvplw1m6rdnkan-2026-10-14@tutorapp.es',
  'tutorapp-mvplw1m6nrn9lq-2026-10-12@tutorapp.es',
  'tutorapp-mvplw1m5j07s6x-2026-10-09@tutorapp.es',
  'tutorapp-mvplw1ls2d285a-2026-10-08@tutorapp.es',
  'tutorapp-mvplw1lrtmz9im-2026-10-05@tutorapp.es',
  'tutorapp-cls_1-2026-10-26@tutorapp.es',
  'tutorapp-cls_2-2026-10-26@tutorapp.es',
  'tutorapp-cls_3-2026-10-18@tutorapp.es',
  'tutorapp-bienvenida@tutorapp.es',
];

const isDemoStudent = (text: string): boolean => {
  if (!text) return false;
  const t = text.toLowerCase();
  return (
    t.includes('sofía') ||
    t.includes('sofia') ||
    t.includes('pablo') ||
    t.includes('carlos') ||
    t.includes('maría') ||
    t.includes('maria') ||
    t.includes('laura') ||
    t.includes('alejandro') ||
    t.includes('lucía') ||
    t.includes('lucia') ||
    t.includes('marcos')
  );
};

const sanitizeAndAppendCancellations = (icsContent: string): string => {
  if (!icsContent || !icsContent.includes('BEGIN:VCALENDAR')) {
    return icsContent;
  }

  const now = new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .split('.')[0] + 'Z';

  const uidsToCancel = new Set<string>(FAKE_UIDS_TO_CANCEL);

  // 1. Purgar eventos demo y registrar sus UIDs para forzar cancelación
  const cleanedIcs = icsContent.replace(/BEGIN:VEVENT[\s\S]*?END:VEVENT\r?\n?/g, (eventBlock) => {
    if (isDemoStudent(eventBlock)) {
      const match = eventBlock.match(/UID:([^\r\n]+)/);
      if (match && match[1]) {
        uidsToCancel.add(match[1].trim());
      }
      return '';
    }
    return eventBlock;
  });

  // 2. Construir los bloques STATUS:CANCELLED para que el iPhone borre inmediatamente los eventos ficticios
  const cancelBlocks = Array.from(uidsToCancel)
    .map((uid) =>
      [
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${now}`,
        'SUMMARY:Cancelada',
        'STATUS:CANCELLED',
        'END:VEVENT',
      ].join('\r\n')
    )
    .join('\r\n');

  if (cleanedIcs.includes('END:VCALENDAR')) {
    return cleanedIcs.replace('END:VCALENDAR', `${cancelBlocks}\r\nEND:VCALENDAR`);
  }

  return cleanedIcs;
};

// Generador de iCalendar RFC 5545 a partir de payload JSON compacto (< 3KB)
const generateIcsFromCompact = (items: CompactClassItem[]): string => {
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

  for (const item of items) {
    const studentName = item.s || item.studentName || 'Alumno';
    const date = item.d || '';
    const startTime = item.t || '17:00';
    let endTime = item.e || '';
    if (!endTime || endTime <= startTime) {
      const dur = item.u || item.duration || 60;
      const [h, m] = startTime.split(':').map(Number);
      const total = (isNaN(h) ? 17 : h) * 60 + (isNaN(m) ? 0 : m) + dur;
      const endH = Math.floor(total / 60) % 24;
      const endM = total % 60;
      endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
    }

    const [y, m, d] = date.split('-');
    const [sh, sm] = startTime.split(':');
    const [eh, em] = endTime.split(':');
    const startStr = `${y || '2026'}${(m || '01').padStart(2, '0')}${(d || '01').padStart(2, '0')}T${(sh || '17').padStart(2, '0')}${(sm || '00').padStart(2, '0')}00`;
    const endStr = `${y || '2026'}${(m || '01').padStart(2, '0')}${(d || '01').padStart(2, '0')}T${(eh || '18').padStart(2, '0')}${(em || '00').padStart(2, '0')}00`;

    const isPaid = item.p === 1 || item.p === true || item.isPaid === true;
    const paymentStatus = isPaid ? 'Pagada ✓' : 'Pendiente de cobro ⏳';
    const location = item.l || item.location || 'Presencial';
    const notes = item.n || item.notes || '';
    const desc = `Clase con ${studentName}\\nEstado: ${paymentStatus}\\nDuración: ${item.u || item.duration || 60} min${notes ? '\\nNotas: ' + notes : ''}`;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:tutorapp-${item.id}-${date}@tutorapp.es`);
    lines.push(`DTSTAMP:${now}`);
    lines.push(`DTSTART:${startStr}`);
    lines.push(`DTEND:${endStr}`);
    lines.push(`SUMMARY:Clase - ${studentName}`);
    lines.push(`LOCATION:${location}`);
    lines.push(`DESCRIPTION:${desc}`);
    lines.push('STATUS:CONFIRMED');
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
};

const computeSimpleETag = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return `W/"tutorapp-${Math.abs(hash).toString(36)}-${str.length}"`;
};

// Calendario base de bienvenida para nuevas suscripciones vacías
const DEFAULT_FALLBACK_ICS = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//TutorApp//Clases Particulares//ES
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:TutorApp Clases
X-WR-CALDESC:Sincronización de Clases Particulares
X-WR-TIMEZONE:Europe/Madrid
BEGIN:VTIMEZONE
TZID:Europe/Madrid
X-LIC-LOCATION:Europe/Madrid
BEGIN:DAYLIGHT
TZOFFSETFROM:+0100
TZOFFSETTO:+0200
TZNAME:CEST
DTSTART:19700329T020000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU
END:DAYLIGHT
BEGIN:STANDARD
TZOFFSETFROM:+0200
TZOFFSETTO:+0100
TZNAME:CET
DTSTART:19701025T030000
RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU
END:STANDARD
END:VTIMEZONE
BEGIN:VEVENT
UID:tutorapp-bienvenida@tutorapp.es
DTSTAMP:20261027T200000Z
DTSTART:20261028T170000
DTEND:20261028T180000
SUMMARY:TutorApp - Calendario Conectado
LOCATION:Presencial
DESCRIPTION:Tus clases sincronizadas se mostrarán aquí automáticamente.
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, If-None-Match, If-Modified-Since');

  if (req.method === 'OPTIONS') {
    res.status(200);
    return res.end();
  }

  const key = (req.query.key as string) || 'cristian';

  // POST: La aplicación sincroniza su estado de clases
  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const rawIcs = body?.ics || '';
      const compactData = body?.compact || null;

      if (!rawIcs && !compactData) {
        res.status(400);
        return res.json({ error: 'Faltan datos de sincronización (ICS o Compact)' });
      }

      let generatedFromCompact = '';
      if (!rawIcs && Array.isArray(compactData)) {
        generatedFromCompact = generateIcsFromCompact(compactData);
      }

      const sanitizedIcs = sanitizeAndAppendCancellations(rawIcs || generatedFromCompact);
      memoryCache[key] = sanitizedIcs;

      try {
        fs.writeFileSync(getCacheFilePath(key), sanitizedIcs, 'utf8');
      } catch (fsErr) {
        // Ignorar restricciones en entornos serverless de solo lectura
      }

      // Sincronizar en la nube en tiempo real SIN cabecera 'Filename' para evitar expiración de adjunto (3h)
      // Usar payload JSON compacto (< 3KB) como garantía permanente que nunca se convierte en adjunto
      const compactJsonStr = compactData ? JSON.stringify(compactData) : '';
      const cloudPromises: Promise<any>[] = [];

      // 1. Canal JSON compacto ultraligero
      if (compactJsonStr) {
        cloudPromises.push(
          fetch(`https://ntfy.sh/tutorapp_cal_json_${key}`, {
            method: 'POST',
            body: compactJsonStr,
            headers: {
              Title: 'TutorApp JSON Sync',
              Tags: 'calendar',
            },
          })
        );
      }

      // 2. Canales ICS estándar como mensaje de texto directo (sin Filename)
      const textBody = sanitizedIcs.length < 3900 ? sanitizedIcs : compactJsonStr || sanitizedIcs;
      cloudPromises.push(
        fetch(`https://ntfy.sh/tutorapp_cal_${key}_v3`, {
          method: 'POST',
          body: textBody,
          headers: {
            Title: 'TutorApp Calendar Sync',
            Tags: 'calendar',
          },
        }),
        fetch(`https://ntfy.sh/tutorapp_cal_${key}_v2`, {
          method: 'POST',
          body: textBody,
          headers: {
            Title: 'TutorApp Calendar Sync',
            Tags: 'calendar',
          },
        })
      );

      try {
        await Promise.allSettled(cloudPromises);
      } catch (cloudErr) {
        // Fallback silencioso si falla la red externa
      }

      res.status(200);
      return res.json({ success: true, updated: new Date().toISOString() });
    } catch (e: any) {
      res.status(500);
      return res.json({ error: e?.message || 'Error al procesar el calendario' });
    }
  }

  // GET: Apple Calendar o cualquier cliente iCal solicita la suscripción
  if (req.method === 'GET' || !req.method) {
    let icsContent = memoryCache[key];

    // 1. Memoria local en caliente
    if (icsContent && isDemoStudent(icsContent)) {
      icsContent = '';
    }

    // 2. Archivo en /tmp local
    if (!icsContent) {
      try {
        const filePath = getCacheFilePath(key);
        if (fs.existsSync(filePath)) {
          const cached = fs.readFileSync(filePath, 'utf8');
          if (cached && !isDemoStudent(cached)) {
            icsContent = cached;
          }
        }
      } catch (readErr) {
        // Continuar al siguiente paso
      }
    }

    // 3. Consultar la nube JSON compacto persistente (< 3KB nunca expira por adjunto)
    if (!icsContent) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);
        const jsonRes = await fetch(`https://ntfy.sh/tutorapp_cal_json_${key}/json?poll=1`, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (jsonRes.ok) {
          const rawText = await jsonRes.text();
          const lines = rawText.trim().split('\n');
          for (let i = lines.length - 1; i >= 0; i--) {
            try {
              const msg = JSON.parse(lines[i]);
              const payloadText = msg.message || '';
              if (payloadText.startsWith('[') || payloadText.startsWith('{')) {
                const parsed = JSON.parse(payloadText);
                const items: CompactClassItem[] = Array.isArray(parsed)
                  ? parsed
                  : parsed.classes || [];
                if (items.length > 0) {
                  icsContent = generateIcsFromCompact(items);
                  memoryCache[key] = icsContent;
                  try {
                    fs.writeFileSync(getCacheFilePath(key), icsContent, 'utf8');
                  } catch {}
                  break;
                }
              }
            } catch {}
          }
        }
      } catch (jsonFetchErr) {
        // Continuar al siguiente topic
      }
    }

    // 4. Consultar topics v3 y v2
    if (!icsContent) {
      const topics = [`tutorapp_cal_${key}_v3`, `tutorapp_cal_${key}_v2`];
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

                // A) Si vino directamente en el cuerpo del mensaje
                if (msg.message && !isDemoStudent(msg.message)) {
                  if (msg.message.includes('BEGIN:VCALENDAR')) {
                    icsContent = msg.message;
                    memoryCache[key] = icsContent;
                    try {
                      fs.writeFileSync(getCacheFilePath(key), icsContent, 'utf8');
                    } catch {}
                    break;
                  } else if (msg.message.startsWith('[') || msg.message.startsWith('{')) {
                    const parsed = JSON.parse(msg.message);
                    const items: CompactClassItem[] = Array.isArray(parsed)
                      ? parsed
                      : parsed.classes || [];
                    if (items.length > 0) {
                      icsContent = generateIcsFromCompact(items);
                      memoryCache[key] = icsContent;
                      try {
                        fs.writeFileSync(getCacheFilePath(key), icsContent, 'utf8');
                      } catch {}
                      break;
                    }
                  }
                }

                // B) Si vino en adjunto (para compatibilidad hacia atrás)
                if (msg.attachment?.url) {
                  try {
                    const attRes = await fetch(msg.attachment.url);
                    if (attRes.ok) {
                      const attText = await attRes.text();
                      if (attText.includes('BEGIN:VCALENDAR') && !isDemoStudent(attText)) {
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
              } catch {}
            }
          }
        } catch (cloudGetErr) {
          // Continuar al siguiente topic o fallback
        }
      }
    }

    // 5. EVALUACIÓN Y SALVAGUARDA RFC 5545 / WebCal
    if (icsContent && icsContent.includes('BEGIN:VCALENDAR')) {
      const finalIcs = sanitizeAndAppendCancellations(icsContent);
      memoryCache[key] = finalIcs;

      const etag = computeSimpleETag(finalIcs);
      const reqHeaders = req.headers || {};
      const clientEtag = (reqHeaders['if-none-match'] || reqHeaders['If-None-Match']) as string;

      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', 'inline; filename="clases_cristian.ics"');
      res.setHeader('Cache-Control', 'public, max-age=900, stale-while-revalidate=86400');
      res.setHeader('ETag', etag);

      if (clientEtag && (clientEtag === etag || clientEtag.includes(etag))) {
        res.status(304);
        return res.end();
      }

      res.status(200);
      return res.end(finalIcs);
    }

    // SALVAGUARDA CRÍTICA:
    // Si la instancia se reinició y la nube aún no ha recibido el sync de hoy:
    // NUNCA devolver HTTP 200 con un calendario vacío a una suscripción existente,
    // ya que Apple Calendar borraría todas las clases de la memoria del iPhone.
    if (req.query.welcome === '1') {
      const welcomeIcs = sanitizeAndAppendCancellations(DEFAULT_FALLBACK_ICS);
      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=300');
      res.status(200);
      return res.end(welcomeIcs);
    }

    // Devolver HTTP 304 Not Modified con cabeceras de reintento.
    // Esto garantiza por estándar WebCal que Apple Calendar mantenga 100% intactas
    // todas las clases que ya tiene guardadas en el iPhone y vuelva a consultar más tarde.
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=86400');
    res.setHeader('Retry-After', '300');
    res.status(304);
    return res.end();
  }

  res.status(405);
  return res.json({ error: 'Método no permitido' });
}
