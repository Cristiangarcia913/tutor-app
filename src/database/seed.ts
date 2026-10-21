// =============================================================================
// TutorApp - Seed Data
// Populates the database with sample data for development and testing
// =============================================================================

import {
  createStudent,
  createSubject,
  createClassSession,
  createPayment,
  updateSettings,
  assignSubjectToStudent,
  isDatabaseEmpty,
  getAllStudents,
  getAllSubjects,
} from './database';
import type {
  StudentFormData,
  SubjectFormData,
  ClassSessionFormData,
  PaymentFormData,
} from '../types';

// Helper to generate dates relative to today
const daysAgo = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
};

const daysFromNow = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

const today = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Seed the database with sample data.
 * Only runs if the database is empty.
 */
export const seedDatabase = async (): Promise<void> => {
  const empty = await isDatabaseEmpty();
  if (!empty) {
    console.log('[Seed] Database already has data, skipping seed.');
    return;
  }

  console.log('[Seed] Seeding database with sample data...');

  // -------------------------------------------------------------------------
  // 1. Create Subjects (8 subjects)
  // -------------------------------------------------------------------------
  const subjectsData: SubjectFormData[] = [
    {
      name: 'Matemáticas',
      description: 'Álgebra, geometría, cálculo y estadística',
      level: 'ESO/Bachillerato',
      defaultRate: 18,
      color: '#4F46E5',
      icon: 'calculator',
      active: true,
    },
    {
      name: 'Física',
      description: 'Mecánica, termodinámica, electromagnetismo',
      level: 'Bachillerato',
      defaultRate: 20,
      color: '#0EA5E9',
      icon: 'flask',
      active: true,
    },
    {
      name: 'Inglés',
      description: 'Gramática, conversación, preparación de exámenes',
      level: 'Todos los niveles',
      defaultRate: 15,
      color: '#10B981',
      icon: 'globe',
      active: true,
    },
    {
      name: 'Lengua y Literatura',
      description: 'Comprensión lectora, redacción, sintaxis',
      level: 'ESO/Bachillerato',
      defaultRate: 15,
      color: '#F59E0B',
      icon: 'book',
      active: true,
    },
    {
      name: 'Química',
      description: 'Química orgánica e inorgánica, estequiometría',
      level: 'Bachillerato',
      defaultRate: 20,
      color: '#EF4444',
      icon: 'flask',
      active: true,
    },
    {
      name: 'Programación',
      description: 'Python, JavaScript, algoritmos y estructuras de datos',
      level: 'Universidad',
      defaultRate: 25,
      color: '#8B5CF6',
      icon: 'code-slash',
      active: true,
    },
    {
      name: 'Economía',
      description: 'Micro y macroeconomía, contabilidad',
      level: 'Bachillerato/Universidad',
      defaultRate: 18,
      color: '#EC4899',
      icon: 'trending-up',
      active: true,
    },
    {
      name: 'Historia',
      description: 'Historia de España y universal, historia del arte',
      level: 'ESO/Bachillerato',
      defaultRate: 15,
      color: '#14B8A6',
      icon: 'library',
      active: true,
    },
  ];

  const subjects = [];
  for (const subjectData of subjectsData) {
    const subject = await createSubject(subjectData);
    subjects.push(subject);
  }
  console.log(`[Seed] Created ${subjects.length} subjects.`);

  // -------------------------------------------------------------------------
  // 2. Create Students (5 students)
  // -------------------------------------------------------------------------
  const studentsData: StudentFormData[] = [
    {
      firstName: 'María',
      lastName: 'García López',
      email: 'maria.garcia@email.com',
      phone: '612345678',
      parentName: 'Carmen López',
      parentPhone: '698765432',
      address: 'Calle Mayor 15, 2ºA, Madrid',
      birthDate: '2008-03-15',
      notes: 'Estudiante muy aplicada. Necesita refuerzo en álgebra.',
      active: true,
    },
    {
      firstName: 'Carlos',
      lastName: 'Martínez Ruiz',
      email: 'carlos.martinez@email.com',
      phone: '623456789',
      parentName: 'Pedro Martínez',
      parentPhone: '687654321',
      address: 'Avenida de la Constitución 8, Madrid',
      birthDate: '2007-07-22',
      notes: 'Preparando selectividad. Clases de Física y Matemáticas.',
      active: true,
    },
    {
      firstName: 'Laura',
      lastName: 'Fernández Torres',
      email: 'laura.fernandez@email.com',
      phone: '634567890',
      parentName: undefined,
      parentPhone: undefined,
      address: 'Plaza España 3, 1ºB, Madrid',
      birthDate: '2001-11-08',
      notes: 'Estudiante universitaria. Clases de Programación.',
      active: true,
    },
    {
      firstName: 'Pablo',
      lastName: 'Sánchez Moreno',
      email: 'pablo.sanchez@email.com',
      phone: '645678901',
      parentName: 'Ana Moreno',
      parentPhone: '676543210',
      address: 'Calle Alcalá 42, Madrid',
      birthDate: '2009-05-30',
      notes: 'Clase de inglés para preparar Cambridge B2.',
      active: true,
    },
    {
      firstName: 'Sofía',
      lastName: 'Rodríguez Díaz',
      email: 'sofia.rodriguez@email.com',
      phone: '656789012',
      parentName: 'Miguel Rodríguez',
      parentPhone: '665432109',
      address: 'Calle Gran Vía 20, Madrid',
      birthDate: '2008-09-12',
      notes: 'Necesita apoyo en Lengua y Economía. Muy puntual.',
      active: true,
    },
  ];

  const students = [];
  for (const studentData of studentsData) {
    const student = await createStudent(studentData);
    students.push(student);
  }
  console.log(`[Seed] Created ${students.length} students.`);

  // -------------------------------------------------------------------------
  // 3. Assign subjects to students
  // -------------------------------------------------------------------------
  // María: Matemáticas, Física
  await assignSubjectToStudent(students[0].id, subjects[0].id); // Matemáticas
  await assignSubjectToStudent(students[0].id, subjects[1].id); // Física

  // Carlos: Física, Matemáticas, Química
  await assignSubjectToStudent(students[1].id, subjects[1].id); // Física
  await assignSubjectToStudent(students[1].id, subjects[0].id); // Matemáticas
  await assignSubjectToStudent(students[1].id, subjects[4].id); // Química

  // Laura: Programación, Inglés
  await assignSubjectToStudent(students[2].id, subjects[5].id); // Programación
  await assignSubjectToStudent(students[2].id, subjects[2].id); // Inglés

  // Pablo: Inglés, Lengua
  await assignSubjectToStudent(students[3].id, subjects[2].id); // Inglés
  await assignSubjectToStudent(students[3].id, subjects[3].id); // Lengua

  // Sofía: Lengua, Economía, Historia
  await assignSubjectToStudent(students[4].id, subjects[3].id); // Lengua
  await assignSubjectToStudent(students[4].id, subjects[6].id); // Economía
  await assignSubjectToStudent(students[4].id, subjects[7].id); // Historia

  console.log('[Seed] Assigned subjects to students.');

  // -------------------------------------------------------------------------
  // 4. Create Class Sessions (15 sessions)
  // -------------------------------------------------------------------------
  const sessionsData: ClassSessionFormData[] = [
    // Past sessions (completed)
    {
      studentId: students[0].id,
      subjectId: subjects[0].id, // Matemáticas
      date: daysAgo(21),
      startTime: '16:00',
      endTime: '17:30',
      duration: 90,
      rate: 18,
      status: 'completed',
      location: 'presencial',
      notes: 'Repaso de ecuaciones de segundo grado.',
      homework: 'Ejercicios pág. 45-47',
    },
    {
      studentId: students[0].id,
      subjectId: subjects[1].id, // Física
      date: daysAgo(18),
      startTime: '17:30',
      endTime: '19:00',
      duration: 90,
      rate: 20,
      status: 'completed',
      location: 'presencial',
      notes: 'Cinemática: movimiento rectilíneo uniforme.',
      homework: 'Problemas del tema 3',
    },
    {
      studentId: students[1].id,
      subjectId: subjects[1].id, // Física
      date: daysAgo(17),
      startTime: '10:00',
      endTime: '11:30',
      duration: 90,
      rate: 20,
      status: 'completed',
      location: 'presencial',
      notes: 'Dinámica: leyes de Newton.',
    },
    {
      studentId: students[2].id,
      subjectId: subjects[5].id, // Programación
      date: daysAgo(14),
      startTime: '18:00',
      endTime: '20:00',
      duration: 120,
      rate: 25,
      status: 'completed',
      location: 'online',
      notes: 'Introducción a React. Componentes funcionales y hooks.',
      homework: 'Crear una app de lista de tareas',
    },
    {
      studentId: students[3].id,
      subjectId: subjects[2].id, // Inglés
      date: daysAgo(12),
      startTime: '16:00',
      endTime: '17:00',
      duration: 60,
      rate: 15,
      status: 'completed',
      location: 'presencial',
      notes: 'Reading comprehension y vocabulario B2.',
    },
    {
      studentId: students[4].id,
      subjectId: subjects[3].id, // Lengua
      date: daysAgo(10),
      startTime: '17:00',
      endTime: '18:30',
      duration: 90,
      rate: 15,
      status: 'completed',
      location: 'domicilio',
      notes: 'Análisis sintáctico de oraciones compuestas.',
      homework: 'Analizar 10 oraciones del ejercicio 5',
    },
    {
      studentId: students[1].id,
      subjectId: subjects[0].id, // Matemáticas
      date: daysAgo(7),
      startTime: '10:00',
      endTime: '11:30',
      duration: 90,
      rate: 18,
      status: 'completed',
      location: 'presencial',
      notes: 'Derivadas: regla de la cadena.',
    },
    {
      studentId: students[4].id,
      subjectId: subjects[6].id, // Economía
      date: daysAgo(5),
      startTime: '16:00',
      endTime: '17:30',
      duration: 90,
      rate: 18,
      status: 'completed',
      location: 'presencial',
      notes: 'Oferta y demanda. Equilibrio de mercado.',
    },
    // Cancelled session
    {
      studentId: students[3].id,
      subjectId: subjects[2].id, // Inglés
      date: daysAgo(3),
      startTime: '16:00',
      endTime: '17:00',
      duration: 60,
      rate: 15,
      status: 'cancelled',
      location: 'presencial',
      notes: 'Cancelada por enfermedad del alumno.',
    },
    // No-show session
    {
      studentId: students[0].id,
      subjectId: subjects[0].id, // Matemáticas
      date: daysAgo(2),
      startTime: '16:00',
      endTime: '17:30',
      duration: 90,
      rate: 18,
      status: 'no-show',
      location: 'presencial',
      notes: 'No se presentó. Contactar con la madre.',
    },
    // Today's session
    {
      studentId: students[2].id,
      subjectId: subjects[5].id, // Programación
      date: today(),
      startTime: '18:00',
      endTime: '20:00',
      duration: 120,
      rate: 25,
      status: 'scheduled',
      location: 'online',
      notes: 'Continuar con React: estado y efectos.',
    },
    // Upcoming sessions
    {
      studentId: students[0].id,
      subjectId: subjects[0].id, // Matemáticas
      date: daysFromNow(1),
      startTime: '16:00',
      endTime: '17:30',
      duration: 90,
      rate: 18,
      status: 'scheduled',
      location: 'presencial',
      notes: 'Repaso antes del examen.',
    },
    {
      studentId: students[1].id,
      subjectId: subjects[4].id, // Química
      date: daysFromNow(2),
      startTime: '10:00',
      endTime: '11:30',
      duration: 90,
      rate: 20,
      status: 'scheduled',
      location: 'presencial',
      notes: 'Enlace químico: iónico y covalente.',
    },
    {
      studentId: students[3].id,
      subjectId: subjects[2].id, // Inglés
      date: daysFromNow(3),
      startTime: '16:00',
      endTime: '17:00',
      duration: 60,
      rate: 15,
      status: 'scheduled',
      location: 'presencial',
      notes: 'Práctica de writing y use of English.',
    },
    {
      studentId: students[4].id,
      subjectId: subjects[7].id, // Historia
      date: daysFromNow(5),
      startTime: '17:00',
      endTime: '18:30',
      duration: 90,
      rate: 15,
      status: 'scheduled',
      location: 'domicilio',
      notes: 'La Guerra Civil Española.',
    },
  ];

  const sessions = [];
  for (const sessionData of sessionsData) {
    const session = await createClassSession(sessionData);
    sessions.push(session);
  }
  console.log(`[Seed] Created ${sessions.length} class sessions.`);

  // -------------------------------------------------------------------------
  // 5. Create Payments (8 payments)
  // -------------------------------------------------------------------------
  const paymentsData: PaymentFormData[] = [
    // Paid payments
    {
      studentId: students[0].id,
      amount: 57, // 90min Mates (27) + 90min Física (30)
      date: daysAgo(15),
      method: 'bizum',
      concept: 'Clases de Matemáticas y Física - Semana del ' + daysAgo(21),
      classSessionIds: [sessions[0].id, sessions[1].id],
      status: 'cobrado',
      notes: 'Pagado por la madre.',
    },
    {
      studentId: students[1].id,
      amount: 30, // 90min Física (30)
      date: daysAgo(14),
      method: 'efectivo',
      concept: 'Clase de Física - ' + daysAgo(17),
      classSessionIds: [sessions[2].id],
      status: 'cobrado',
      notes: '',
    },
    {
      studentId: students[2].id,
      amount: 50, // 120min Programación (50)
      date: daysAgo(12),
      method: 'transferencia',
      concept: 'Clase de Programación - ' + daysAgo(14),
      classSessionIds: [sessions[3].id],
      status: 'cobrado',
      notes: 'Transferencia recibida.',
    },
    {
      studentId: students[3].id,
      amount: 15, // 60min Inglés (15)
      date: daysAgo(10),
      method: 'efectivo',
      concept: 'Clase de Inglés - ' + daysAgo(12),
      classSessionIds: [sessions[4].id],
      status: 'cobrado',
      notes: '',
    },
    {
      studentId: students[4].id,
      amount: 22.5, // 90min Lengua (22.5)
      date: daysAgo(8),
      method: 'bizum',
      concept: 'Clase de Lengua - ' + daysAgo(10),
      classSessionIds: [sessions[5].id],
      status: 'cobrado',
      notes: '',
    },
    // Pending payments
    {
      studentId: students[1].id,
      amount: 27, // 90min Mates (27)
      date: daysAgo(5),
      method: 'efectivo',
      concept: 'Clase de Matemáticas - ' + daysAgo(7),
      classSessionIds: [sessions[6].id],
      status: 'pendiente',
      notes: 'Pendiente de cobro. Traerá el dinero la próxima clase.',
    },
    {
      studentId: students[4].id,
      amount: 27, // 90min Economía (27)
      date: daysAgo(3),
      method: 'bizum',
      concept: 'Clase de Economía - ' + daysAgo(5),
      classSessionIds: [sessions[7].id],
      status: 'pendiente',
      notes: 'Enviar recordatorio por WhatsApp.',
    },
    {
      studentId: students[0].id,
      amount: 27, // No-show but charged
      date: daysAgo(1),
      method: 'transferencia',
      concept: 'Clase no asistida - ' + daysAgo(2),
      classSessionIds: [sessions[9].id],
      status: 'pendiente',
      notes: 'Cobrar por no-show según política.',
    },
  ];

  const payments = [];
  for (const paymentData of paymentsData) {
    const payment = await createPayment(paymentData);
    payments.push(payment);
  }
  console.log(`[Seed] Created ${payments.length} payments.`);

  // -------------------------------------------------------------------------
  // 6. Set default settings
  // -------------------------------------------------------------------------
  await updateSettings({
    businessName: 'Academia TutorPro',
    teacherName: 'Profesor Demo',
    email: 'profesor@tutorpro.es',
    phone: '600123456',
    defaultRate: 18,
    currency: 'EUR',
    theme: 'system',
    language: 'es',
    notifications: true,
    autoBackup: false,
  });
  console.log('[Seed] Settings configured.');

  console.log('[Seed] ✅ Database seeding complete!');
};
