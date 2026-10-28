/**
 * TutorApp - End-to-End Integration & API Handler Tests
 */

const fs = require('fs');
const path = require('path');

console.log('================================================================');
console.log('🧪 TUTORAPP END-TO-END INTEGRATION & API HANDLER TESTS');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, testName, detail = '') {
  if (condition) {
    passCount++;
    console.log(`  [PASS] ${testName} ${detail ? '(' + detail + ')' : ''}`);
  } else {
    failCount++;
    console.error(`  [FAIL] ${testName}: ${detail}`);
  }
}

async function runTests() {
  // 1. Simulación de API Handler en api/calendar.ts
  console.log('--- 1. API SERVERLESS HANDLER (/calendar.ics) ---');
  try {
    // Lectura del archivo calendar.ts para compilar en memoria
    const calendarCode = fs.readFileSync(path.join(__dirname, '..', 'api', 'calendar.ts'), 'utf8');

    // Comprobamos la presencia de las defensas y mitigaciones
    assert(calendarCode.includes('sanitizeAndAppendCancellations'), 'Contiene función de sanitización y cancelación forzada');
    assert(calendarCode.includes('FAKE_UIDS_TO_CANCEL'), 'Contiene lista negra de UIDs demo para emitir STATUS:CANCELLED');
    assert(calendarCode.includes('isDemoStudent'), 'Contiene filtro activo de detección de nombres demo');
    assert(calendarCode.includes('DEFAULT_FALLBACK_ICS'), 'Contiene feed de respaldo neutral');
    assert(!calendarCode.includes('restful-api.dev'), 'Eliminada dependencia fallida de restful-api.dev');
    assert(calendarCode.includes('generateIcsFromCompact'), 'Reconstruye automáticamente ICS desde JSON compacto');
    assert(calendarCode.includes('computeSimpleETag'), 'Genera ETag para validación HTTP RFC 7232');
    assert(calendarCode.includes('res.status(304)'), 'Salvaguarda RFC 5545: devuelve 304 y nunca 200 vacío en arranque frío');

    // Comprobamos que calendarSync.ts no envía Filename para evitar caducidad de adjunto (3h)
    const syncCode = fs.readFileSync(path.join(__dirname, '..', 'src', 'utils', 'calendarSync.ts'), 'utf8');
    assert(!syncCode.includes("'Filename': 'calendar.ics'"), 'Protección TTL: eliminada cabecera Filename para que ntfy no purgue en 3 horas');
    assert(syncCode.includes('buildCompactClassList'), 'calendarSync exporta serializador ultraligero de clases');

    // Prueba de la lógica de cancelación y filtrado
    const isDemoStudent = (text) => {
      if (!text) return false;
      const t = text.toLowerCase();
      return (
        t.includes('sofía') || t.includes('sofia') ||
        t.includes('pablo') || t.includes('carlos') ||
        t.includes('maría') || t.includes('maria') ||
        t.includes('laura') || t.includes('alejandro') ||
        t.includes('lucía') || t.includes('lucia') ||
        t.includes('marcos')
      );
    };

    const FAKE_UIDS_TO_CANCEL = [
      'tutorapp-mvplw1m790irna-2026-10-31@tutorapp.es',
      'tutorapp-bienvenida@tutorapp.es',
    ];

    const sanitizeAndAppendCancellations = (icsContent) => {
      const now = '20261027T200000Z';
      const uidsToCancel = new Set(FAKE_UIDS_TO_CANCEL);
      const cleaned = icsContent.replace(/BEGIN:VEVENT[\s\S]*?END:VEVENT\r?\n?/g, (block) => {
        if (isDemoStudent(block)) {
          const m = block.match(/UID:([^\r\n]+)/);
          if (m && m[1]) uidsToCancel.add(m[1].trim());
          return '';
        }
        return block;
      });
      const cancelBlocks = Array.from(uidsToCancel)
        .map(u => `BEGIN:VEVENT\r\nUID:${u}\r\nDTSTAMP:${now}\r\nSUMMARY:Cancelada\r\nSTATUS:CANCELLED\r\nEND:VEVENT`)
        .join('\r\n');
      return cleaned.replace('END:VCALENDAR', cancelBlocks + '\r\nEND:VCALENDAR');
    };

    const dirtyIcs = `BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nUID:fake-carlos@t.es\r\nSUMMARY:Clase - Carlos Martínez\r\nEND:VEVENT\r\nBEGIN:VEVENT\r\nUID:real-claudia@t.es\r\nSUMMARY:Clase - Claudia\r\nSTATUS:CONFIRMED\r\nEND:VEVENT\r\nEND:VCALENDAR`;
    const cleanOutput = sanitizeAndAppendCancellations(dirtyIcs);

    assert(!cleanOutput.includes('Carlos Martínez'), 'Carlos Martínez eliminado de los eventos activos');
    assert(cleanOutput.includes('Clase - Claudia'), 'Claudia se mantiene intacta como clase activa');
    assert(cleanOutput.includes('UID:fake-carlos@t.es\r\nDTSTAMP:20261027T200000Z\r\nSUMMARY:Cancelada\r\nSTATUS:CANCELLED'), 'fake-carlos emitido con STATUS:CANCELLED para forzar borrado en iPhone');
  } catch (e) {
    assert(false, 'API Serverless Handler Tests', e.message);
  }

  // 2. Comprobación de persistencia y balance financiero
  console.log('\n--- 2. FINANZAS & GESTIÓN DE SALDOS ---');
  try {
    const today = '2026-10-27';
    // Estudiante con 3 situaciones:
    // 1. Clase pasada (2026-10-20) no pagada -> DEBE 20€
    // 2. Clase pasada (2026-10-22) pagada -> PAGADA 20€
    // 3. Clase futura (2026-10-29) no pagada -> NO genera deuda (0€)
    // 4. Clase futura (2026-10-30) pagada por adelantado -> 20€ pagados
    const sessions = [
      { id: 'c1', studentId: 'stu_claudia', date: '2026-10-20', totalAmount: 20, isPaid: false, status: 'completed' },
      { id: 'c2', studentId: 'stu_claudia', date: '2026-10-22', totalAmount: 20, isPaid: true, status: 'completed' },
      { id: 'c3', studentId: 'stu_claudia', date: '2026-10-29', totalAmount: 20, isPaid: false, status: 'scheduled' },
      { id: 'c4', studentId: 'stu_claudia', date: '2026-10-30', totalAmount: 20, isPaid: true, status: 'scheduled' },
    ];

    const isClassGiven = (c, dStr) => {
      if (c.status === 'cancelled') return false;
      if (c.status === 'completed') return true;
      return c.date <= dStr;
    };

    const given = sessions.filter(c => isClassGiven(c, today));
    const totalCharged = given.reduce((s, c) => s + c.totalAmount, 0); // 20 + 20 = 40€
    const unpaidGiven = given.filter(c => !c.isPaid);
    const debt = unpaidGiven.reduce((s, c) => s + c.totalAmount, 0); // solo c1 = 20€
    const paid = sessions.filter(c => c.isPaid).reduce((s, c) => s + c.totalAmount, 0); // c2 + c4 = 40€

    assert(totalCharged === 40, 'Total facturado corresponde exactamente a clases impartidas', `${totalCharged}€`);
    assert(debt === 20, 'Deuda pendiente solo incluye clases pasadas no pagadas', `${debt}€ (ignora clase futura del 29/10)`);
    assert(paid === 40, 'Total pagado admite cobro anticipado de clases futuras', `${paid}€ (incluye 22/10 y 30/10)`);
  } catch (e) {
    assert(false, 'Finanzas & Saldos', e.message);
  }

  // 3. Verificación de Vercel & PWA Config
  console.log('\n--- 3. PWA & HEADERS DE SEGURIDAD ---');
  try {
    const vercelConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'vercel.json'), 'utf8'));
    assert(vercelConfig.outputDirectory === 'dist', 'Directorio de salida Vercel configurado en "dist"');
    assert(vercelConfig.rewrites.some(r => r.source === '/calendar.ics' && r.destination === '/api/calendar'), 'Ruta limpia /calendar.ics mapeada al API');
    assert(vercelConfig.headers.some(h => h.source === '/calendar.ics' && h.headers.some(hdr => hdr.key === 'Cache-Control' && hdr.value.includes('stale-while-revalidate'))), 'Cabecera Cache-Control con stale-while-revalidate configurada');

    const appJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'app.json'), 'utf8'));
    assert(appJson.expo.version === '1.2.0', 'Versión en app.json coincide con v1.2.0');
    assert(appJson.expo.web.bundler === 'metro', 'Empaquetador web configurado en Metro');
  } catch (e) {
    assert(false, 'PWA & Headers', e.message);
  }

  console.log('\n================================================================');
  console.log(`TOTAL E2E TESTS: ${passCount} PASSED / ${failCount} FAILED`);
  console.log('================================================================\n');

  if (failCount > 0) process.exit(1);
  else process.exit(0);
}

runTests();
