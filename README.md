# TutorApp 📚

> Aplicación profesional para la gestión de clases particulares, alumnos y finanzas.
> Multiplataforma: **iOS (iPhone / iPad)**, **Android** y **Web (Navegador)**.

[![GitHub Repo](https://img.shields.io/badge/GitHub-Cristiangarcia913%2Ftutor--app-181717?logo=github)](https://github.com/Cristiangarcia913/tutor-app)
![React Native](https://img.shields.io/badge/React%20Native-0.76-61DAFB?logo=react&logoColor=black)
![Expo](https://img.shields.io/badge/Expo-SDK%2052-000020?logo=expo)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript&logoColor=white)
![iOS Universal](https://img.shields.io/badge/iOS-Universal%20(Todos%20los%20iPhone%20y%20iPad)-000000?logo=apple&logoColor=white)
![Android Ready](https://img.shields.io/badge/Android-APK%20Ready-3DDC84?logo=android&logoColor=white)
![Web Ready](https://img.shields.io/badge/Web-Responsive-FF4088?logo=google-chrome&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 📱 ¿Qué es TutorApp?

**TutorApp** es una solución integral diseñada específicamente para **profesores particulares, tutores y formadores** que necesitan llevar un control riguroso, ágil y profesional de sus estudiantes, el calendario de clases y la facturación/cobros en el día a día.

Diseñada con estándares de diseño nativos de **iOS (Human Interface Guidelines)**, ofrece una experiencia fluida tanto en móviles como en el navegador web.

---

## ✨ Características Principales

### 👥 Gestión Personal de Alumnos y Asignación de Tutor
- **Ficha completa y directa:** Nombre del alumno, curso escolar, dirección, teléfono del estudiante y **teléfono de su tutor (padre/madre)** para contacto directo y WhatsApp.
- **Historial individual:** Acceso instantáneo a todas las clases impartidas, canceladas o reprogramadas, y pagos recibidos del alumno.
- **Control de saldo en tiempo real:** Cálculo automático de balance facturado, cobrado y pendiente de pago.
- **Búsqueda y filtros:** Filtrado rápido por estado (Activos/Inactivos) y buscador en tiempo real.

### 📲 Resumen de Clases y Cobro por WhatsApp Automatizado
- **Envío en 1 clic al Tutor:** Generación instantánea del mensaje mensual con el desglose de clases impartidas, canceladas y reprogramadas, junto al importe total a abonar.
- **Selector de periodo flexible:** Permite alternar entre **Mes Actual** y **Mes Anterior** para enviar la cuenta a finales o a primeros de mes.
- **Formato transparente y profesional para los padres:**
  ```text
  👋 ¡Buenos días Carmen!

  Te mando el resumen de las clases de Alejandro de este mes (Octubre) y el total a abonar:

  • Día 1 (Mar): Clase 17:00 - 15,00 €
  • Día 8 (Mar): Clase 17:00 - 15,00 €
  • Día 15 (Mar): ❌ Clase cancelada - Motivo: Festivo nacional
  • Día 17 (Jue): 🔄 Clase cambiada a las 17:30 (cambiada del día 15) - 15,00 €
  • Día 22 (Mar): Clase 17:00 - 15,00 €

  💰 Total a abonar: 60,00 €
  (4 clases realizadas, 1 cancelada)

  📱 Pago por Bizum al teléfono: +34 600 000 000
  (Concepto: Clases Alejandro)
  💵 O en efectivo en la próxima clase.

  ¡Muchas gracias y buen día!
  ```
- **Disponible en múltiples vistas:** Accesible directamente desde la ficha de cada alumno y desde la tabla de balances en la pestaña de Finanzas.

### 📅 Control, Reprogramación y Cancelación de Clases
- **Programador flexible:** Asignación de alumno, días, horas, hasta cuándo dar clase (1 mes, trimestre o fin de curso en junio) y el precio por hora o sesión.
- **Cancelar clase con motivo:** Opciones rápidas de motivos (Festivo nacional/escolar, Alumno enfermo, Imprevisto del profesor, Examen escolar, Aviso previo) o motivo personalizado, reflejado automáticamente en la cuenta del mes.
- **Cambiar / Reprogramar clase:** Permite mover la sesión a un nuevo día y hora conservando el registro de la fecha original.
- **Calendario escolar inteligente:** Opción para respetar el calendario escolar español y omitir automáticamente festivos y vacaciones.
- **Ciclo de estados:** *Programada*, *Completada*, *Cancelada* y *No asistió el alumno*.

### 🔔 Alertas y Recordatorios de Clase con Ubicación
- **Notificaciones inteligentes de clase:** Avisos que recuerdan el horario de inicio y la modalidad/ubicación exacta de la sesión:
  - 📍 **Presencial:** Dirección del centro o aula de estudio.
  - 🏠 **A Domicilio:** Dirección del alumno.
  - 💻 **Online:** Enlace y plataforma de videollamada.
- **Acción en 1 clic de aviso por WhatsApp:** Permite enviar un recordatorio rápido antes de la clase.
- **Recordatorios locales en el dispositivo:** Botón para activar alertas del sistema en el móvil (iOS y Android) o navegador web con 1 hora de antelación.

### 💰 Gestión Financiera Simplificada
- **Métodos de pago adaptados a la realidad:** Bizum y Efectivo como medios prioritarios.
- **Balance por alumno:** Tabla de control que distingue alumnos al día de alumnos con pagos pendientes, con botón directo de cobro.
- **Gráficos evolutivos:** Gráfico de barras mensual para analizar la progresión de ingresos.

### 📊 Dashboard e Informes
- **Panel de control:** KPIs con alumnos activos, clases del mes, ingresos facturados e importes pendientes.
- **Próximas clases y cobros recientes:** Accesos directos para la gestión del día a día.
- **Informes analíticos:** Horas totales impartidas, media de precio por clase y desglose de ingresos por materia.
- **Copia de seguridad:** Exportación de toda la base de datos en formato JSON para respaldos o migración.

---

## 🚀 Cómo Usar TutorApp

### 1. Clonar e Instalar

```bash
# Clonar el repositorio oficial
git clone https://github.com/Cristiangarcia913/tutor-app.git
cd tutor-app

# Instalar dependencias
npm install
```

---

### 📱 A. Cómo Usarlo en Cualquier Dispositivo iOS (iPhone y iPad)

TutorApp es completamente **Universal** y está optimizada para **todos los modelos de iPhone** (iPhone SE, iPhone 8, X, 11, 12, 13, 14, 15, 16, Pro, Plus y Pro Max) así como para **iPad y iPad Pro** (iOS/iPadOS 15.1 o superior).

Tienes dos métodos disponibles:

#### Método 1: Inmediato con Expo Go (El más rápido, sin registro de desarrollador)
1. En tu **iPhone o iPad**, abre la App Store y descarga la aplicación gratuita **[Expo Go](https://apps.apple.com/app/expo-go/id982107779)**.
2. En tu ordenador, arranca el servidor de desarrollo en la carpeta del proyecto:
   ```bash
   npx expo start
   ```
   *(Si tu ordenador y tu móvil están en redes Wi-Fi diferentes o datos móviles, usa `npx expo start --tunnel`).*
3. Abre la app **Cámara** en tu iPhone o iPad y enfoca el **código QR** que aparece en la terminal de tu ordenador.
4. Toca en el aviso que dice *"Abrir en Expo Go"*.
5. ¡Listo! La app cargará en tu dispositivo iOS con rendimiento nativo fluido, animaciones y soporte para gestos.

#### Método 2: Instalar como App Nativa (.ipa) mediante EAS Build
Si quieres que la app aparezca instalada en la pantalla de inicio de tu iPhone o iPad de forma permanente:
```bash
# Instalar EAS CLI de Expo
npm install -g eas-cli

# Iniciar sesión con tu cuenta gratuita de Expo
eas login

# Configurar y compilar para iOS (genera el perfil de desarrollo para tus dispositivos)
eas build --platform ios --profile development
```
Al finalizar la compilación en la nube, EAS te entregará un enlace y código QR para instalar el archivo directamente en tu iPhone o iPad.

---

### 🤖 B. Cómo Usarlo en Android

#### Método 1: Con Expo Go
1. En tu dispositivo Android, instala **Expo Go** desde Google Play Store.
2. En tu ordenador, ejecuta:
   ```bash
   npx expo start
   ```
3. Abre **Expo Go** en tu Android, pulsa en *"Scan QR code"* y apunta a la pantalla.

#### Método 2: Generar APK directo instalable
Puedes compilar un archivo `.apk` autónomo sin necesidad de Android Studio:
```bash
eas build --platform android --profile preview
```
Al terminar, descarga el archivo `.apk` directamente en tu teléfono e instálalo.

---

### 🌐 C. Cómo Usarlo desde la Web (Navegador en PC, Mac o Tablet)

TutorApp está optimizada con **React Native for Web**, lo que permite usarla desde cualquier navegador moderno (Chrome, Safari, Edge, Firefox) con diseño adaptativo.

#### Ejecutar localmente en Web:
```bash
# Iniciar servidor web de desarrollo
npm run web
# o bien:
npx expo start --web
```
Se abrirá automáticamente tu navegador en `http://localhost:8081` (o presiona la tecla `w` en la consola de Expo).

#### Despliegue en Vercel (Recomendado para tener la app 24/7 en tu iPhone):
El repositorio ya incluye la configuración lista en `vercel.json` y el script de compilación:
1. Ve a [vercel.com](https://vercel.com) e inicia sesión con tu cuenta de **GitHub**.
2. Haz clic en **"Add New..."** > **"Project"** e importa el repositorio `Cristiangarcia913/tutor-app`.
3. Deja los ajustes predeterminados (Vercel lee automáticamente `vercel.json` con `npm run build` y la carpeta `dist`).
4. Haz clic en **"Deploy"**.
5. En tu **iPhone**, abre la URL asignada (ej. `https://tutor-app-xxx.vercel.app`) en **Safari**.
6. Pulsa el botón **Compartir** (icono cuadrado con flecha hacia arriba) y selecciona **"Añadir a pantalla de inicio"**.
7. ¡Listo! TutorApp funcionará a pantalla completa como una app nativa 24/7 sin depender de tu ordenador.

#### Compilar y Desplegar manualmente en Producción Web:
Para publicar la app en cualquier otro servidor estático:
```bash
# Exportar la versión web estática optimizada
npm run build
```
La carpeta generada `dist/` contiene el sitio web listo para subirse a cualquier hosting estático o servidor.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Función |
|---|---|---|
| **Framework UI** | React Native 0.76 | Componentes nativos móviles |
| **Plataforma** | Expo SDK 52 | Herramientas de build y runtime |
| **Enrutamiento** | Expo Router v4 | Navegación basada en sistema de archivos |
| **Base de Datos** | Expo SQLite (Next) | Persistencia local offline de alto rendimiento |
| **Lenguaje** | TypeScript 5.3 | Tipado estático y robustez |
| **Iconografía** | @expo/vector-icons (Ionicons) | Iconos nativos de alta fidelidad |
| **Web Runtime** | React Native Web + Metro | Adaptación y renderizado en navegadores |
| **Build Service** | EAS Build (Expo Application Services) | Compilación en la nube de binarios iOS/Android |

---

## 📁 Estructura del Código

```text
tutor-app/
├── app/                          # Pantallas y rutas (Expo Router)
│   ├── (tabs)/                   # Navegación por pestañas inferiores
│   │   ├── _layout.tsx           # Configuración de la barra de pestañas
│   │   ├── index.tsx             # Inicio / Dashboard principal
│   │   ├── students.tsx          # Directorio de alumnos
│   │   ├── classes.tsx           # Calendario y listado de clases
│   │   └── finances.tsx          # Gestión de cobros y balances
│   ├── student/
│   │   ├── [id].tsx              # Ficha y perfil detallado del alumno
│   │   ├── new.tsx               # Formulario de alta de alumno
│   │   └── edit/[id].tsx         # Formulario de edición
│   ├── class/
│   │   ├── [id].tsx              # Detalle de clase (notas, tareas, estado)
│   │   └── new.tsx               # Programador de nueva clase
│   ├── payment/
│   │   ├── [id].tsx              # Recibo y detalle de transacción
│   │   └── new.tsx               # Registro de nuevo cobro
│   ├── subject/
│   │   └── manage.tsx            # Gestor de asignaturas y tarifas
│   ├── reports.tsx               # Informes analíticos y exportación
│   ├── settings.tsx              # Ajustes de perfil y preferencias
│   └── _layout.tsx               # Enrutador raíz y Stack navigation
├── src/
│   ├── components/               # Componentes UI modulares
│   │   ├── common/               # Botones, Cards, Inputs, Modales, RoleSwitcherBar
│   │   ├── roles/                # Vistas de portal de Estudiante y Familia (Padres)
│   │   ├── students/             # Tarjetas y listados de estudiante
│   │   ├── classes/              # Tarjetas de sesión de clase y selectores
│   │   └── finances/             # Tarjetas de pago y gráficos
│   ├── constants/                # Tokens de diseño (Colors, Spacing, Theme)
│   ├── database/                 # Capa SQLite/Web y migraciones con Access Codes
│   ├── hooks/                    # Hooks useDatabase() y useAuthRole()
│   ├── utils/                    # Motor de calendario escolar y festivos en España
│   └── types/                    # Definiciones TypeScript de entidades y roles
├── assets/                       # Iconos, SplashScreen y recursos gráficos
├── app.json                      # Manifiesto de Expo y bundle identifiers
├── eas.json                      # Perfiles de compilación para iOS y Android
└── package.json                  # Dependencias y scripts del proyecto
```

---

## 📄 Licencia

Este proyecto está bajo la Licencia **MIT**. Consulta el archivo [LICENSE](LICENSE) para más información.

## 👨‍💻 Autor

Desarrollado por [Cristian García Del Olmo](https://github.com/Cristiangarcia913).
