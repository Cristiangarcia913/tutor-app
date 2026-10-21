# TutorApp 📚

> Aplicación profesional para la gestión de clases particulares

![React Native](https://img.shields.io/badge/React%20Native-0.76-blue)
![Expo](https://img.shields.io/badge/Expo-SDK%2052-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## 📱 Descripción

**TutorApp** es una aplicación móvil completa diseñada para profesores particulares que necesitan gestionar sus clases, alumnos y finanzas de forma profesional. Construida con React Native y Expo, compatible con iOS y Android.

## ✨ Características

### 👥 Gestión de Alumnos
- Registro completo de alumnos con datos de contacto
- Información de padres/tutores
- Historial de clases por alumno
- Balance financiero por alumno
- Búsqueda y filtrado avanzado
- Estado activo/inactivo

### 📅 Gestión de Clases
- Programación de clases con fecha, hora y duración
- Asignación de asignatura y alumno
- Modalidad: presencial, online o a domicilio
- Estados: programada, completada, cancelada, no asistió
- Registro de deberes y notas por clase
- Cálculo automático del importe

### 💰 Gestión Financiera
- Registro de pagos con múltiples métodos (efectivo, transferencia, Bizum, PayPal)
- Estado de pagos: pendiente, cobrado, cancelado
- Balance por alumno
- Resumen de ingresos mensuales
- Gráficos de evolución de ingresos

### 📊 Dashboard
- Vista general con estadísticas clave
- Próximas clases programadas
- Pagos recientes
- Gráfico de ingresos mensuales
- Indicadores de rendimiento

### 📈 Informes
- Informe por período personalizable
- Desglose por asignatura
- Desglose por alumno
- Exportación de datos en JSON

### ⚙️ Configuración
- Perfil del profesor
- Tarifa por defecto
- Gestión de asignaturas
- Exportación/importación de datos
- Datos de ejemplo para pruebas

## 🛠️ Tecnologías

| Tecnología | Uso |
|---|---|
| **React Native** | Framework UI multiplataforma |
| **Expo SDK 52** | Plataforma de desarrollo |
| **TypeScript** | Tipado estático |
| **Expo Router** | Navegación basada en archivos |
| **Expo SQLite** | Base de datos local |
| **@expo/vector-icons** | Iconografía (Ionicons) |

## 📁 Estructura del Proyecto

```
tutor-app/
├── app/                          # Pantallas (Expo Router)
│   ├── (tabs)/                   # Pestañas principales
│   │   ├── _layout.tsx           # Layout de tabs
│   │   ├── index.tsx             # Dashboard
│   │   ├── students.tsx          # Lista de alumnos
│   │   ├── classes.tsx           # Lista de clases
│   │   └── finances.tsx          # Finanzas
│   ├── student/                  # Pantallas de alumno
│   │   ├── [id].tsx              # Detalle de alumno
│   │   ├── new.tsx               # Nuevo alumno
│   │   └── edit/[id].tsx         # Editar alumno
│   ├── class/                    # Pantallas de clase
│   │   ├── [id].tsx              # Detalle de clase
│   │   └── new.tsx               # Nueva clase
│   ├── payment/                  # Pantallas de pago
│   │   ├── [id].tsx              # Detalle de pago
│   │   └── new.tsx               # Nuevo pago
│   ├── subject/
│   │   └── manage.tsx            # Gestión de asignaturas
│   ├── reports.tsx               # Informes
│   ├── settings.tsx              # Ajustes
│   └── _layout.tsx               # Layout raíz
├── src/
│   ├── components/               # Componentes reutilizables
│   │   ├── common/               # Componentes base
│   │   ├── students/             # Componentes de alumnos
│   │   ├── classes/              # Componentes de clases
│   │   └── finances/             # Componentes de finanzas
│   ├── constants/                # Tema, colores, iconos
│   ├── database/                 # Servicio de base de datos
│   ├── hooks/                    # Custom hooks
│   └── types/                    # Tipos TypeScript
├── assets/                       # Imágenes y recursos
├── app.json                      # Configuración de Expo
├── package.json
├── tsconfig.json
└── eas.json                      # Configuración de EAS Build
```

## 🚀 Instalación

### Requisitos previos
- Node.js 18+
- npm o yarn
- Expo CLI (`npm install -g expo-cli`)
- Cuenta de Expo (para builds de iOS)

### Pasos

1. **Clonar el repositorio**
```bash
git clone https://github.com/tu-usuario/tutor-app.git
cd tutor-app
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Iniciar el servidor de desarrollo**
```bash
npx expo start
```

4. **Ejecutar en el dispositivo**
   - Escanea el código QR con la app **Expo Go** en tu iPhone
   - O presiona `i` para abrir en el simulador de iOS

## 📲 Instalación en iPhone

### Opción 1: Expo Go (Desarrollo)
1. Descarga **Expo Go** desde la App Store
2. Ejecuta `npx expo start` en tu ordenador
3. Escanea el código QR con la cámara del iPhone

### Opción 2: Build de desarrollo (Recomendado)
```bash
# Instalar EAS CLI
npm install -g eas-cli

# Iniciar sesión en Expo
eas login

# Crear build de desarrollo para iOS
eas build --profile development --platform ios
```

### Opción 3: Build de producción
```bash
# Build de producción para iOS
eas build --profile production --platform ios

# Subir a TestFlight
eas submit --platform ios
```

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

## 👨‍💻 Autor

Desarrollado con ❤️ para profesores particulares.

---

**TutorApp** - Gestiona tus clases particulares de forma profesional 📚
