# TutorApp 📚

> Aplicación profesional para la gestión de clases particulares, alumnos y finanzas.
> Multiplataforma: **iOS (iPhone / iPad)**, **Android** y **Web (Navegador)**.

[![GitHub Repo](https://img.shields.io/badge/GitHub-Cristiangarcia913%2Ftutor--app-181717?logo=github)](https://github.com/Cristiangarcia913/tutor-app)
![React Native](https://img.shields.io/badge/React%20Native-0.76-61DAFB?logo=react&logoColor=black)
![Expo](https://img.shields.io/badge/Expo-SDK%2052-000020?logo=expo)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript&logoColor=white)
![iOS Ready](https://img.shields.io/badge/iOS-iPhone%2013%20Compatible-000000?logo=apple&logoColor=white)
![Android Ready](https://img.shields.io/badge/Android-APK%20Ready-3DDC84?logo=android&logoColor=white)
![Web Ready](https://img.shields.io/badge/Web-Responsive-FF4088?logo=google-chrome&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 📱 ¿Qué es TutorApp?

**TutorApp** es una solución integral diseñada específicamente para **profesores particulares, tutores y formadores** que necesitan llevar un control riguroso, ágil y profesional de sus estudiantes, el calendario de clases y la facturación/cobros en el día a día.

Diseñada con estándares de diseño nativos de **iOS (Human Interface Guidelines)**, ofrece una experiencia fluida tanto en móviles como en el navegador web.

---

## ✨ Características Principales

### 👥 Gestión de Alumnos
- **Ficha completa:** Nombre, apellidos, teléfono, correo electrónico, dirección y fecha de nacimiento.
- **Contacto de Padres/Tutores:** Registro del nombre y teléfono del tutor con acceso rápido para llamadas/mensajes.
- **Historial individual:** Acceso instantáneo a todas las clases impartidas y pagos recibidos del alumno.
- **Control de saldo en tiempo real:** Cálculo automático de balance facturado, cobrado y pendiente de pago.
- **Búsqueda y filtros:** Filtrado rápido por estado (Activos/Inactivos) y buscador en tiempo real.

### 📅 Control y Programación de Clases
- **Planificador:** Asignación de alumno, asignatura, fecha y horarios (inicio y fin con cálculo automático de duración en minutos).
- **Tarifas dinámicas:** Precio por hora (€/h) con cálculo en vivo del importe total según la duración de la sesión.
- **Modalidades de clase:** Presencial, Online (videollamada) o A domicilio.
- **Ciclo de estados:** *Programada*, *Completada*, *Cancelada* y *No asistió el alumno*.
- **Seguimiento pedagógico:** Registro de notas de la clase y tareas/deberes asignados para la siguiente sesión.

### 💰 Gestión Financiera y Cobros
- **Registro de pagos:** Importe, fecha, método de pago, concepto y notas del comprobante.
- **Métodos soportados:** Bizum, Efectivo, Transferencia bancaria, PayPal y Otros.
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

### 📱 A. Cómo Usarlo en iPhone (iOS / iPhone 13)

Tienes dos métodos disponibles:

#### Método 1: Inmediato con Expo Go (El más rápido, sin registro de desarrollador)
1. En tu **iPhone 13**, abre la App Store y descarga la aplicación gratuita **[Expo Go](https://apps.apple.com/app/expo-go/id982107779)**.
2. En tu ordenador, arranca el servidor de desarrollo en la carpeta del proyecto:
   ```bash
   npx expo start
   ```
   *(Si tu ordenador y tu iPhone están en redes Wi-Fi diferentes, usa `npx expo start --tunnel`).*
3. Abre la app **Cámara** en tu iPhone y enfoca el **código QR** que aparece en la terminal de tu ordenador.
4. Toca en el aviso que dice *"Abrir en Expo Go"*.
5. ¡Listo! La app cargará en tu iPhone 13 con rendimiento nativo, animaciones y gestos táctiles.

#### Método 2: Instalar como App Nativa (.ipa) mediante EAS Build
Si quieres que la app aparezca instalada en la pantalla de inicio de tu iPhone de forma permanente:
```bash
# Instalar EAS CLI de Expo
npm install -g eas-cli

# Iniciar sesión con tu cuenta gratuita de Expo
eas login

# Configurar y compilar para iOS (genera el perfil de desarrollo para tu iPhone)
eas build --platform ios --profile development
```
Al finalizar la compilación en la nube, EAS te entregará un enlace y código QR para instalar el archivo directamente en tu iPhone 13.

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

#### Compilar y Desplegar en Producción Web:
Para publicar la app en servicios como **Vercel**, **Netlify** o **GitHub Pages**:
```bash
# Exportar la versión web estática optimizada
npx expo export -p web
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
│   │   ├── common/               # Botones, Cards, Inputs, Modales, Pickers
│   │   ├── students/             # Tarjetas de estudiante
│   │   ├── classes/              # Tarjetas de sesión de clase
│   │   └── finances/             # Tarjetas de pago y gráficos
│   ├── constants/                # Tokens de diseño (Colors, Spacing, Theme)
│   ├── database/                 # Capa SQLite y script de datos iniciales
│   ├── hooks/                    # Hook useDatabase() con contexto global
│   └── types/                    # Definiciones TypeScript de entidades
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
