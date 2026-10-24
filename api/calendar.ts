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
  send: (data: any) => void;
  end: () => void;
}

// En memoria para respuestas inmediatas
const memoryCache: Record<string, string> = {};

const getCacheFilePath = (key: string) => {
  const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, '') || 'default';
  return path.join('/tmp', `tutorapp_cal_${safeKey}.ics`);
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  // Configurar CORS para permitir peticiones desde la PWA
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const key = (req.query.key as string) || 'cristian';

  // POST: La app envía los datos actualizados del calendario
  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const icsData = body?.ics || '';

      if (!icsData) {
        return res.status(400).json({ error: 'Faltan datos ICS' });
      }

      memoryCache[key] = icsData;

      try {
        fs.writeFileSync(getCacheFilePath(key), icsData, 'utf8');
      } catch (fsErr) {
        // En algunos entornos /tmp puede tener restricciones, la memoria sirve de fallback
      }

      return res.status(200).json({ success: true, updated: new Date().toISOString() });
    } catch (e: any) {
      return res.status(500).json({ error: e?.message || 'Error al procesar el calendario' });
    }
  }

  // GET: Apple Calendar o cualquier cliente iCal solicita el feed de suscripción
  if (req.method === 'GET') {
    let icsContent = memoryCache[key];

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

    // Si aún no se ha subido ningún calendario, devolver un calendario inicial válido
    if (!icsContent) {
      icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//TutorApp//ES',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'X-WR-CALNAME:Clases Cristian',
        'X-WR-TIMEZONE:Europe/Madrid',
        'BEGIN:VEVENT',
        `UID:welcome-${Date.now()}@tutorapp.es`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `DTSTART:${new Date().toISOString().replace(/[-:]/g, '').split('T')[0].replace(/-/g, '')}T170000`,
        `DTEND:${new Date().toISOString().replace(/[-:]/g, '').split('T')[0].replace(/-/g, '')}T180000`,
        'SUMMARY:Calendario Conectado - TutorApp',
        'DESCRIPTION:Tus clases se sincronizarán aquí automáticamente.',
        'STATUS:CONFIRMED',
        'END:VEVENT',
        'END:VCALENDAR',
      ].join('\r\n');
    }

    // Cabeceras estándares RFC 5545 para Apple Calendar
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'inline; filename="clases_cristian.ics"');
    res.setHeader('Cache-Control', 'no-cache, no-store, max-age=0, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    return res.status(200).send(icsContent);
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
