// =============================================================================
// TutorApp - Web Storage Adapter (HTML5 localStorage / Memory fallback)
// Enables full offline functionality when running in a Web browser
// =============================================================================

import type {
  Student,
  StudentFormData,
  Subject,
  SubjectFormData,
  ClassSession,
  ClassSessionFormData,
  Payment,
  PaymentFormData,
  AppSettings,
  DashboardStats,
  ClassFilter,
  PaymentFilter,
  StudentWithDetails,
  StudentBalance,
  MonthlyReport,
} from '../types';

const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
};

// Default initial seed data for web preview
const INITIAL_SUBJECTS: Subject[] = [
  {
    id: 'sub_matematicas',
    name: 'Matemáticas',
    description: 'Álgebra, geometría, cálculo y análisis',
    level: 'Bachillerato',
    defaultRate: 20,
    color: '#4F46E5',
    icon: 'calculator',
    active: true,
    createdAt: '2026-10-01T10:00:00.000Z',
  },
  {
    id: 'sub_fisica',
    name: 'Física y Química',
    description: 'Mecánica, termodinámica y formulación',
    level: 'ESO / Bachillerato',
    defaultRate: 22,
    color: '#0EA5E9',
    icon: 'flask',
    active: true,
    createdAt: '2026-10-01T10:00:00.000Z',
  },
  {
    id: 'sub_ingles',
    name: 'Inglés',
    description: 'Gramática, conversación y preparación de exámenes B2/C1',
    level: 'Todos los niveles',
    defaultRate: 18,
    color: '#10B981',
    icon: 'globe',
    active: true,
    createdAt: '2026-10-01T10:00:00.000Z',
  },
  {
    id: 'sub_programacion',
    name: 'Programación',
    description: 'Python, JavaScript, algoritmos y desarrollo web',
    level: 'Universidad',
    defaultRate: 25,
    color: '#8B5CF6',
    icon: 'code-slash',
    active: true,
    createdAt: '2026-10-01T10:00:00.000Z',
  },
];

const INITIAL_STUDENTS: Student[] = [
  {
    id: 'stu_alejandro',
    firstName: 'Alejandro',
    lastName: 'Martínez Ruiz',
    email: 'alejandro.martinez@gmail.com',
    phone: '+34 612 345 678',
    parentName: 'Carmen Ruiz (Madre)',
    parentPhone: '+34 678 901 234',
    address: 'Calle Mayor 14, 3ºB, Madrid',
    birthDate: '2008-04-12',
    notes: 'Preparando selectividad (EBAU). Necesita refuerzo en matrices e integrales.',
    active: true,
    avatarColor: '#4F46E5',
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
  },
  {
    id: 'stu_lucia',
    firstName: 'Lucía',
    lastName: 'Gómez Fernández',
    email: 'lucia.gomez@gmail.com',
    phone: '+34 623 456 789',
    parentName: 'Antonio Gómez (Padre)',
    parentPhone: '+34 689 012 345',
    address: 'Av. de América 32, Madrid',
    birthDate: '2010-09-22',
    notes: '3º de ESO. Muy participativa, trabajando formulación química.',
    active: true,
    avatarColor: '#10B981',
    createdAt: '2026-10-02T10:00:00.000Z',
    updatedAt: '2026-10-02T10:00:00.000Z',
  },
  {
    id: 'stu_marcos',
    firstName: 'Marcos',
    lastName: 'Navarro Sanz',
    email: 'marcos.navarro@outlook.es',
    phone: '+34 634 567 890',
    parentName: 'Laura Sanz',
    parentPhone: '+34 690 123 456',
    address: 'Calle Alcalá 120, Madrid',
    birthDate: '2007-01-15',
    notes: '2º de Bachillerato. Refuerzo semanal de física.',
    active: true,
    avatarColor: '#0EA5E9',
    createdAt: '2026-10-03T10:00:00.000Z',
    updatedAt: '2026-10-03T10:00:00.000Z',
  },
];

const now = new Date();
const todayStr = now.toISOString().split('T')[0];

const INITIAL_CLASSES: ClassSession[] = [
  {
    id: 'cls_1',
    studentId: 'stu_alejandro',
    subjectId: 'sub_matematicas',
    date: todayStr,
    startTime: '17:00',
    endTime: '18:30',
    duration: 90,
    rate: 20,
    totalAmount: 30,
    status: 'scheduled',
    location: 'presencial',
    notes: 'Resolución de exámenes de selectividad año 2025.',
    homework: 'Ejercicios 3, 4 y 7 del tema 4.',
    createdAt: '2026-10-15T10:00:00.000Z',
    updatedAt: '2026-10-15T10:00:00.000Z',
  },
  {
    id: 'cls_2',
    studentId: 'stu_lucia',
    subjectId: 'sub_fisica',
    date: todayStr,
    startTime: '19:00',
    endTime: '20:00',
    duration: 60,
    rate: 22,
    totalAmount: 22,
    status: 'scheduled',
    location: 'online',
    notes: 'Formulación de óxidos e hidróxidos.',
    homework: 'Ficha práctica de ejercicios.',
    createdAt: '2026-10-16T10:00:00.000Z',
    updatedAt: '2026-10-16T10:00:00.000Z',
  },
  {
    id: 'cls_3',
    studentId: 'stu_marcos',
    subjectId: 'sub_fisica',
    date: '2026-10-18',
    startTime: '16:00',
    endTime: '17:30',
    duration: 90,
    rate: 20,
    totalAmount: 30,
    status: 'completed',
    location: 'domicilio',
    notes: 'Campo gravitatorio y leyes de Kepler.',
    homework: 'Problemas página 89.',
    createdAt: '2026-10-14T10:00:00.000Z',
    updatedAt: '2026-10-18T17:35:00.000Z',
  },
];

const INITIAL_PAYMENTS: Payment[] = [
  {
    id: 'pay_1',
    studentId: 'stu_marcos',
    amount: 30,
    date: '2026-10-18',
    method: 'bizum',
    concept: 'Clase de física 18/10',
    classSessionIds: ['cls_3'],
    status: 'cobrado',
    receiptNumber: 'BZ-20261018-01',
    notes: 'Cobrado por Bizum',
    createdAt: '2026-10-18T18:00:00.000Z',
  },
  {
    id: 'pay_2',
    studentId: 'stu_alejandro',
    amount: 30,
    date: todayStr,
    method: 'efectivo',
    concept: 'Clase de matemáticas',
    classSessionIds: ['cls_1'],
    status: 'pendiente',
    notes: 'Pendiente de cobro al terminar la sesión',
    createdAt: '2026-10-21T10:00:00.000Z',
  },
];

const INITIAL_SETTINGS: AppSettings = {
  businessName: 'TutorApp Clases',
  teacherName: 'Cristian',
  email: 'cristiangarciadelolmo06@gmail.com',
  phone: '+34 600 000 000',
  defaultRate: 20,
  currency: 'EUR',
  theme: 'light',
  language: 'es',
  notifications: true,
  autoBackup: true,
};

// Local storage helper
class WebStorageManager {
  private memory: Record<string, string> = {};

  getItem(key: string): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return this.memory[key] || null;
      }
    }
    return this.memory[key] || null;
  }

  setItem(key: string, value: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        this.memory[key] = value;
      }
    } else {
      this.memory[key] = value;
    }
  }

  get<T>(key: string, fallback: T): T {
    const raw = this.getItem(key);
    if (!raw) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  set<T>(key: string, data: T): void {
    this.setItem(key, JSON.stringify(data));
  }
}

const storage = new WebStorageManager();

// Web API implementations
export const webInit = async (): Promise<void> => {
  if (!storage.getItem('tutorapp_initialized')) {
    storage.set('tutorapp_students', INITIAL_STUDENTS);
    storage.set('tutorapp_subjects', INITIAL_SUBJECTS);
    storage.set('tutorapp_classes', INITIAL_CLASSES);
    storage.set('tutorapp_payments', INITIAL_PAYMENTS);
    storage.set('tutorapp_settings', INITIAL_SETTINGS);
    storage.setItem('tutorapp_initialized', 'true');
  }
};

export const webGetAllStudents = async (activeOnly: boolean = false): Promise<Student[]> => {
  const list = storage.get<Student[]>('tutorapp_students', INITIAL_STUDENTS);
  if (activeOnly) return list.filter((s) => s.active);
  return list;
};

export const webGetStudentById = async (id: string): Promise<Student | null> => {
  const list = await webGetAllStudents();
  return list.find((s) => s.id === id) || null;
};

export const webCreateStudent = async (data: StudentFormData): Promise<Student> => {
  const list = await webGetAllStudents();
  const created: Student = {
    ...data,
    id: generateId(),
    avatarColor: '#4F46E5',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  list.unshift(created);
  storage.set('tutorapp_students', list);
  return created;
};

export const webUpdateStudent = async (
  id: string,
  data: Partial<StudentFormData>
): Promise<Student | null> => {
  const list = await webGetAllStudents();
  const idx = list.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  list[idx] = {
    ...list[idx],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  storage.set('tutorapp_students', list);
  return list[idx];
};

export const webDeleteStudent = async (id: string): Promise<void> => {
  const list = await webGetAllStudents();
  const filtered = list.filter((s) => s.id !== id);
  storage.set('tutorapp_students', filtered);
};

export const webGetAllSubjects = async (activeOnly: boolean = false): Promise<Subject[]> => {
  const list = storage.get<Subject[]>('tutorapp_subjects', INITIAL_SUBJECTS);
  if (activeOnly) return list.filter((s) => s.active);
  return list;
};

export const webGetSubjectById = async (id: string): Promise<Subject | null> => {
  const list = await webGetAllSubjects();
  return list.find((s) => s.id === id) || null;
};

export const webCreateSubject = async (data: SubjectFormData): Promise<Subject> => {
  const list = await webGetAllSubjects();
  const created: Subject = {
    ...data,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  list.push(created);
  storage.set('tutorapp_subjects', list);
  return created;
};

export const webUpdateSubject = async (
  id: string,
  data: Partial<SubjectFormData>
): Promise<Subject | null> => {
  const list = await webGetAllSubjects();
  const idx = list.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], ...data };
  storage.set('tutorapp_subjects', list);
  return list[idx];
};

export const webDeleteSubject = async (id: string): Promise<void> => {
  const list = await webGetAllSubjects();
  const filtered = list.filter((s) => s.id !== id);
  storage.set('tutorapp_subjects', filtered);
};

export const webGetAllClasses = async (filter?: ClassFilter): Promise<ClassSession[]> => {
  let list = storage.get<ClassSession[]>('tutorapp_classes', INITIAL_CLASSES);
  if (filter?.studentId) list = list.filter((c) => c.studentId === filter.studentId);
  if (filter?.subjectId) list = list.filter((c) => c.subjectId === filter.subjectId);
  if (filter?.status) list = list.filter((c) => c.status === filter.status);
  return list.sort((a, b) => b.date.localeCompare(a.date));
};

export const webGetClassById = async (id: string): Promise<ClassSession | null> => {
  const list = await webGetAllClasses();
  return list.find((c) => c.id === id) || null;
};

export const webCreateClass = async (data: ClassSessionFormData): Promise<ClassSession> => {
  const list = await webGetAllClasses();
  const duration = data.duration || 60;
  const totalAmount = (duration / 60) * (data.rate || 0);

  const created: ClassSession = {
    ...data,
    id: generateId(),
    totalAmount,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  list.unshift(created);
  storage.set('tutorapp_classes', list);
  return created;
};

export const webUpdateClass = async (
  id: string,
  data: Partial<ClassSessionFormData>
): Promise<ClassSession | null> => {
  const list = await webGetAllClasses();
  const idx = list.findIndex((c) => c.id === id);
  if (idx === -1) return null;

  const current = list[idx];
  const updatedRate = data.rate !== undefined ? data.rate : current.rate;
  const updatedDuration = data.duration !== undefined ? data.duration : current.duration;
  const updatedTotal = (updatedDuration / 60) * updatedRate;

  list[idx] = {
    ...current,
    ...data,
    rate: updatedRate,
    duration: updatedDuration,
    totalAmount: updatedTotal,
    updatedAt: new Date().toISOString(),
  };
  storage.set('tutorapp_classes', list);
  return list[idx];
};

export const webDeleteClass = async (id: string): Promise<void> => {
  const list = await webGetAllClasses();
  const filtered = list.filter((c) => c.id !== id);
  storage.set('tutorapp_classes', filtered);
};

export const webGetAllPayments = async (filter?: PaymentFilter): Promise<Payment[]> => {
  let list = storage.get<Payment[]>('tutorapp_payments', INITIAL_PAYMENTS);
  if (filter?.studentId) list = list.filter((p) => p.studentId === filter.studentId);
  if (filter?.status) list = list.filter((p) => p.status === filter.status);
  if (filter?.method) list = list.filter((p) => p.method === filter.method);
  return list.sort((a, b) => b.date.localeCompare(a.date));
};

export const webGetPaymentById = async (id: string): Promise<Payment | null> => {
  const list = await webGetAllPayments();
  return list.find((p) => p.id === id) || null;
};

export const webCreatePayment = async (data: PaymentFormData): Promise<Payment> => {
  const list = await webGetAllPayments();
  const created: Payment = {
    ...data,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  list.unshift(created);
  storage.set('tutorapp_payments', list);
  return created;
};

export const webUpdatePayment = async (
  id: string,
  data: Partial<PaymentFormData>
): Promise<Payment | null> => {
  const list = await webGetAllPayments();
  const idx = list.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], ...data };
  storage.set('tutorapp_payments', list);
  return list[idx];
};

export const webDeletePayment = async (id: string): Promise<void> => {
  const list = await webGetAllPayments();
  const filtered = list.filter((p) => p.id !== id);
  storage.set('tutorapp_payments', filtered);
};

export const webGetSettings = async (): Promise<AppSettings> => {
  return storage.get<AppSettings>('tutorapp_settings', INITIAL_SETTINGS);
};

export const webUpdateSettings = async (data: Partial<AppSettings>): Promise<AppSettings> => {
  const current = await webGetSettings();
  const updated = { ...current, ...data };
  storage.set('tutorapp_settings', updated);
  return updated;
};

export const webGetDashboardStats = async (): Promise<DashboardStats> => {
  const students = await webGetAllStudents();
  const classes = await webGetAllClasses();
  const payments = await webGetAllPayments();

  const activeStudents = students.filter((s) => s.active).length;
  const currentMonth = todayStr.substring(0, 7);

  const classesThisMonth = classes.filter((c) => c.date.startsWith(currentMonth)).length;

  const totalIncomeThisMonth = payments
    .filter((p) => p.status === 'cobrado' && p.date.startsWith(currentMonth))
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingPaymentsList = payments.filter((p) => p.status === 'pendiente');
  const pendingPayments = pendingPaymentsList.length;
  const pendingPaymentAmount = pendingPaymentsList.reduce((sum, p) => sum + p.amount, 0);

  const upcomingClasses = classes
    .filter((c) => c.status === 'scheduled')
    .slice(0, 5);

  const recentPayments = payments.slice(0, 5);

  const monthlyIncome = [
    { month: '2026-05', amount: 180 },
    { month: '2026-06', amount: 240 },
    { month: '2026-07', amount: 150 },
    { month: '2026-08', amount: 90 },
    { month: '2026-09', amount: 320 },
    { month: '2026-10', amount: totalIncomeThisMonth || 82 },
  ];

  return {
    totalStudents: students.length,
    activeStudents,
    totalClassesThisMonth: classesThisMonth,
    totalClassesThisWeek: classes.length,
    totalIncomeThisMonth,
    pendingPayments,
    pendingPaymentAmount,
    upcomingClasses,
    recentPayments,
    monthlyIncome,
  };
};

export const webGetStudentBalances = async (): Promise<StudentBalance[]> => {
  const students = await webGetAllStudents();
  const classes = await webGetAllClasses();
  const payments = await webGetAllPayments();

  return students.map((student) => {
    const studentClasses = classes.filter((c) => c.studentId === student.id && c.status === 'completed');
    const studentPayments = payments.filter((p) => p.studentId === student.id && p.status === 'cobrado');

    const totalCharged = studentClasses.reduce((sum, c) => sum + c.totalAmount, 0);
    const totalPaid = studentPayments.reduce((sum, p) => sum + p.amount, 0);
    const balance = Math.max(totalCharged - totalPaid, 0);

    return {
      student,
      totalCharged,
      totalPaid,
      balance,
    };
  });
};

export const webExportData = async (): Promise<any> => {
  return {
    exportDate: new Date().toISOString(),
    version: '1.0.0',
    students: await webGetAllStudents(),
    subjects: await webGetAllSubjects(),
    classSessions: await webGetAllClasses(),
    payments: await webGetAllPayments(),
    settings: await webGetSettings(),
  };
};

export const webResetData = async (): Promise<void> => {
  storage.set('tutorapp_students', INITIAL_STUDENTS);
  storage.set('tutorapp_subjects', INITIAL_SUBJECTS);
  storage.set('tutorapp_classes', INITIAL_CLASSES);
  storage.set('tutorapp_payments', INITIAL_PAYMENTS);
  storage.set('tutorapp_settings', INITIAL_SETTINGS);
};
