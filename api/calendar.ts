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

// Calendario base real de Cristian verificado para contingencia
const DEFAULT_CRISTIAN_ICS = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Cristian//TutorApp Clases//ES
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Clases Cristian
X-WR-CALDESC:Clases Particulares de Matemáticas
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
UID:tutorapp-mvmodcokn13coo-2026-10-28@tutorapp.es
DTSTAMP:20261026T192441Z
DTSTART:20261028T173000
DTEND:20261028T183000
SUMMARY:Clase - Claudia
LOCATION:Presencial
DESCRIPTION:Clase con Claudia\\nEstado: Pendiente de cobro ⏳\\nDuración: 60 min\\nNotas: Clase programada según horario habitual
STATUS:CONFIRMED
END:VEVENT
BEGIN:VEVENT
UID:tutorapp-mvmn8qok9xeiq7-2026-10-28@tutorapp.es
DTSTAMP:20261026T192441Z
DTSTART:20261028T184500
DTEND:20261028T194500
SUMMARY:Clase - Hugo
LOCATION:Presencial
DESCRIPTION:Clase con Hugo\\nEstado: Pendiente de cobro ⏳\\nDuración: 60 min\\nNotas: Clase programada según horario habitual
STATUS:CONFIRMED
END:VEVENT
BEGIN:VEVENT
UID:tutorapp-mvmodcokpmy20r-2026-10-26@tutorapp.es
DTSTAMP:20261026T192441Z
DTSTART:20261026T170000
DTEND:20261026T180000
SUMMARY:Clase - Claudia
LOCATION:Presencial
DESCRIPTION:Clase con Claudia\\nEstado: Pendiente de cobro ⏳\\nDuración: 60 min\\nNotas: Clase programada según horario habitual
STATUS:CONFIRMED
END:VEVENT
BEGIN:VEVENT
UID:tutorapp-mvmn8qokm01xa3-2026-10-26@tutorapp.es
DTSTAMP:20261026T192441Z
DTSTART:20261026T181500
DTEND:20261026T191500
SUMMARY:Clase - Hugo
LOCATION:Presencial
DESCRIPTION:Clase con Hugo\\nEstado: Pendiente de cobro ⏳\\nDuración: 60 min\\nNotas: Clase programada según horario habitual
STATUS:CONFIRMED
END:VEVENT
BEGIN:VEVENT
UID:tutorapp-mvobpx7ngtqqtf-2026-10-24@tutorapp.es
DTSTAMP:20261026T192441Z
DTSTART:20261024T120000
DTEND:20261024T130000
SUMMARY:Clase - Hugo
LOCATION:Presencial
DESCRIPTION:Clase con Hugo\\nEstado: Pendiente de cobro ⏳\\nDuración: 60 min\\nNotas: Clase programada según horario habitual
STATUS:CONFIRMED
END:VEVENT
BEGIN:VEVENT
UID:tutorapp-mvmodcokocgt3y-2026-10-21@tutorapp.es
DTSTAMP:20261026T192441Z
DTSTART:20261021T153000
DTEND:20261021T163000
SUMMARY:Clase - Claudia
LOCATION:Presencial
DESCRIPTION:Clase con Claudia\\nEstado: Pagada ✓\\nDuración: 60 min\\nNotas: Clase programada según horario habitual
STATUS:CONFIRMED
END:VEVENT
BEGIN:VEVENT
UID:tutorapp-mvmn8qokirxj50-2026-10-21@tutorapp.es
DTSTAMP:20261026T192441Z
DTSTART:20261021T184500
DTEND:20261021T194500
SUMMARY:Clase - Hugo
LOCATION:Presencial
DESCRIPTION:Clase con Hugo\\nEstado: Pendiente de cobro ⏳\\nDuración: 60 min\\nNotas: Clase programada según horario habitual
STATUS:CONFIRMED
END:VEVENT
BEGIN:VEVENT
UID:tutorapp-mvmodcokfz3huu-2026-10-14@tutorapp.es
DTSTAMP:20261026T192441Z
DTSTART:20261014T153000
DTEND:20261014T163000
SUMMARY:Clase - Claudia
LOCATION:Presencial
DESCRIPTION:Clase con Claudia\\nEstado: Pagada ✓\\nDuración: 60 min\\nNotas: Clase programada según horario habitual
STATUS:CONFIRMED
END:VEVENT
BEGIN:VEVENT
UID:tutorapp-mvmn8qok2ps5f7-2026-10-14@tutorapp.es
DTSTAMP:20261026T192441Z
DTSTART:20261014T184500
DTEND:20261014T194500
SUMMARY:Clase - Hugo
LOCATION:Presencial
DESCRIPTION:Clase con Hugo\\nEstado: Pendiente de cobro ⏳\\nDuración: 60 min\\nNotas: Clase programada según horario habitual
STATUS:CONFIRMED
END:VEVENT
BEGIN:VEVENT
UID:tutorapp-mvobpx7nlhbi91-2026-10-10@tutorapp.es
DTSTAMP:20261026T192441Z
DTSTART:20261010T120000
DTEND:20261010T130000
SUMMARY:Clase - Hugo
LOCATION:Presencial
DESCRIPTION:Clase con Hugo\\nEstado: Pendiente de cobro ⏳\\nDuración: 60 min\\nNotas: Clase programada según horario habitual • Reprogramada del 2026-10-12 (Cambio por festivo)
STATUS:CONFIRMED
END:VEVENT
BEGIN:VEVENT
UID:tutorapp-mvmodcok8du4m7-2026-10-07@tutorapp.es
DTSTAMP:20261026T192441Z
DTSTART:20261007T153000
DTEND:20261007T163000
SUMMARY:Clase - Claudia
LOCATION:Presencial
DESCRIPTION:Clase con Claudia\\nEstado: Pagada ✓\\nDuración: 60 min\\nNotas: Clase programada según horario habitual
STATUS:CONFIRMED
END:VEVENT
BEGIN:VEVENT
UID:tutorapp-mvmn8qokvntunm-2026-10-07@tutorapp.es
DTSTAMP:20261026T192441Z
DTSTART:20261007T184500
DTEND:20261007T194500
SUMMARY:Clase - Hugo
LOCATION:Presencial
DESCRIPTION:Clase con Hugo\\nEstado: Pendiente de cobro ⏳\\nDuración: 60 min\\nNotas: Clase programada según horario habitual
STATUS:CONFIRMED
END:VEVENT
BEGIN:VEVENT
UID:tutorapp-mvmodcokgawrp6-2026-10-05@tutorapp.es
DTSTAMP:20261026T192441Z
DTSTART:20261005T170000
DTEND:20261005T180000
SUMMARY:Clase - Claudia
LOCATION:Presencial
DESCRIPTION:Clase con Claudia\\nEstado: Pagada ✓\\nDuración: 60 min\\nNotas: Clase programada según horario habitual
STATUS:CONFIRMED
END:VEVENT
BEGIN:VEVENT
UID:tutorapp-mvmn8qoktbm1hc-2026-10-05@tutorapp.es
DTSTAMP:20261026T192441Z
DTSTART:20261005T181500
DTEND:20261005T191500
SUMMARY:Clase - Hugo
LOCATION:Presencial
DESCRIPTION:Clase con Hugo\\nEstado: Pendiente de cobro ⏳\\nDuración: 60 min\\nNotas: Clase programada según horario habitual
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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

      if (!rawIcs) {
        res.status(400);
        return res.json({ error: 'Faltan datos ICS' });
      }

      const sanitizedIcs = sanitizeAndAppendCancellations(rawIcs);
      memoryCache[key] = sanitizedIcs;

      try {
        fs.writeFileSync(getCacheFilePath(key), sanitizedIcs, 'utf8');
      } catch (fsErr) {
        // Ignorar restricciones en entornos serverless de solo lectura
      }

      // Sincronizar en la nube en tiempo real (ntfy.sh v2 y v1)
      try {
        await Promise.allSettled([
          fetch(`https://ntfy.sh/tutorapp_cal_${key}_v2`, {
            method: 'POST',
            body: sanitizedIcs,
            headers: {
              'Title': 'TutorApp Calendar Sync',
              'Tags': 'calendar',
              'Filename': 'calendar.ics',
            },
          }),
          fetch(`https://ntfy.sh/tutorapp_cal_${key}`, {
            method: 'POST',
            body: sanitizedIcs,
            headers: {
              'Title': 'TutorApp Calendar Sync',
              'Tags': 'calendar',
              'Filename': 'calendar.ics',
            },
          }),
        ]);
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

    // 3. Consultar la nube en tiempo real (ntfy.sh)
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

                // A) Si ntfy lo almacenó como archivo adjunto
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

                // B) Si vino directamente en el cuerpo del mensaje
                if (msg.message && msg.message.includes('BEGIN:VCALENDAR') && !isDemoStudent(msg.message)) {
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

    // 4. Fallback de contingencia: Calendario real de Cristian
    if (!icsContent || !icsContent.includes('BEGIN:VCALENDAR')) {
      icsContent = DEFAULT_CRISTIAN_ICS;
    }

    // Siempre garantizar que eventos demo se purguen y se emitan STATUS:CANCELLED
    const finalIcs = sanitizeAndAppendCancellations(icsContent);
    memoryCache[key] = finalIcs;

    // Cabeceras estándares RFC 5545 para Apple Calendar
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'inline; filename="clases_cristian.ics"');
    res.setHeader('Cache-Control', 'no-cache, no-store, max-age=0, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    res.status(200);
    return res.end(finalIcs);
  }

  res.status(405);
  return res.json({ error: 'Método no permitido' });
}
