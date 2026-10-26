# Changelog

Todas las novedades, mejoras y correcciones notables de **TutorApp** se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y este proyecto se adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [1.2.0] - 2026-10-26

### Añadido
- **Cobro anticipado de clases:** Posibilidad de registrar pagos de clases programadas en el futuro sin que computen erróneamente como deuda.
- **Filtros completos en el perfil del alumno:** Pestañas de filtrado para clases *Todas*, *A deber*, *Próximas*, *Pagadas* y *Canceladas*.
- **Indicadores visuales de estado:** Nuevos badges en tarjetas de clase para diferenciar clases ya impartidas (`⏳ A deber`), clases próximas (`📅 Próxima`) y clases pagadas (`✓ Pagada`).
- **Resumen WhatsApp detallado:** Desglose mensual que distingue clases impartidas de programadas futuras y calcula el importe exacto pendiente a liquidar.

### Modificado
- **Cálculo de deuda pendiente:** El balance de alumnos, el indicador *Por cobrar* del dashboard y los balances financieros ahora únicamente contabilizan como saldo a deber las clases efectivamente impartidas (`fecha <= hoy` o completadas).
- **Acciones por lote en Finanzas:** El botón de cobro rápido en la ficha del alumno cobra exclusivamente la deuda vencida sin obligar a facturar clases futuras.

### Corregido
- Corrección de sincronización en el cálculo de horas y días de clases en la vista web.
- Corrección de expiración nocturna del calendario en iPhone mediante almacenamiento cloud persistente permanente.
- Exclusión estricta de sesiones canceladas en las métricas de ingresos y balances pendientes.

---

## [1.1.0] - 2026-10-25

### Añadido
- **Sincronización en vivo con Apple Calendar:** Exportación dinámica compatible con RFC 5545 y soporte de zona horaria `Europe/Madrid` (`VTIMEZONE`).
- **Formato unificado de eventos:** Normalización de nombres de evento a `Clase - {Nombre del Alumno}` para mayor claridad en el calendario personal.
- **Desglose en acordeón en Finanzas:** Organización de cobros agrupados por alumno con vista expandible.
- **KPIs interactivos en Inicio:** Acceso directo a cada sección desde las tarjetas estadísticas del dashboard.

### Modificado
- Adaptación completa de interfaz móvil para iPhone y dispositivos táctiles.
- Selector de horario con intervalos precisos de 15 y 45 minutos.

### Corregido
- Eliminación de clases de demostración que podían reaparecer al reiniciar la app sin autenticación.
- Ajuste del selector de fechas para evitar desfases horarios por UTC en navegadores web.

---

## [1.0.0] - 2026-10-21

### Añadido
- **Lanzamiento inicial de TutorApp:** Solución integral para profesores particulares y tutores.
- **Gestión de Alumnos:** Ficha detallada con cursos, contacto de tutores/padres y observaciones.
- **Programación de Clases:** Calendario mensual, asignación recurrente de horarios y control de asistencia.
- **Control de Finanzas:** Registro de ingresos, facturación, métodos de pago (Bizum y Efectivo) y balances por alumno.
- **Informes Mensuales:** Generación de resúmenes formateados listos para enviar a padres por WhatsApp.
- **Arquitectura Multiplataforma:** Soporte universal nativo para iOS, Android y versión Web responsive con persistencia offline en SQLite / WebStorage.
