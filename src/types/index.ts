// =============================================================================
// TutorApp - Type Definitions
// Complete TypeScript interfaces for the entire application
// =============================================================================

// -----------------------------------------------------------------------------
// Student
// -----------------------------------------------------------------------------
export interface ScheduleSlot {
  day: number; // 1 = Lunes, 2 = Martes, ..., 7 = Domingo
  time: string; // ej: "17:00"
  duration?: number; // minutos (opcional, ej: 60)
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  course?: string; // Curso escolar del alumno (e.g. 2º Bachillerato, 3º ESO)
  accessCode?: string; // Código de acceso único para estudiante y padres (ej: ALE-7821)
  email?: string;
  phone?: string;
  parentName?: string;
  parentPhone?: string;
  address?: string;
  birthDate?: string;
  notes: string;
  active: boolean;
  avatarColor: string;
  // Horario semanal asignado al alumno:
  scheduleSlots?: ScheduleSlot[]; // Horario semanal con hora específica para cada día (ej: Lunes 16:30, Miércoles 18:00)
  scheduleDays?: number[]; // [1, 3] = Lunes y Miércoles (1=Lunes, 7=Domingo)
  scheduleTime?: string; // ej: "17:00"
  scheduleDuration?: number; // minutos (ej: 60)
  scheduleRate?: number; // precio habitual por clase (ej: 15)
  scheduleSubjectId?: string; // ID asignatura habitual
  createdAt: string;
  updatedAt: string;
}

// -----------------------------------------------------------------------------
// App Roles (Profesor, Estudiante, Padre)
// -----------------------------------------------------------------------------
export type AppRole = 'profesor' | 'estudiante' | 'padre';

export interface UserSession {
  role: AppRole;
  studentId?: string; // Vinculado al estudiante cuando entra como alumno o padre
}

// -----------------------------------------------------------------------------
// Subject / Course
// -----------------------------------------------------------------------------
export interface Subject {
  id: string;
  name: string;
  description: string;
  level: string; // ESO, Bachillerato, Universidad, etc.
  defaultRate: number; // €/hour
  color: string;
  icon: string;
  active: boolean;
  createdAt: string;
}

// -----------------------------------------------------------------------------
// Class Session
// -----------------------------------------------------------------------------
export interface ClassSession {
  id: string;
  studentId: string;
  subjectId: string;
  date: string; // ISO date
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  duration: number; // minutes
  rate: number; // €/hour for this session
  totalAmount: number; // calculated
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  location: 'presencial' | 'online' | 'domicilio';
  notes: string;
  homework?: string;
  recurringGroupId?: string; // ID del grupo de clases repetidas
  cancelReason?: string; // Motivo de la cancelación (e.g. 'Festivo nacional', 'Enfermedad', etc.)
  rescheduledFromDate?: string; // Fecha original si la clase fue cambiada
  rescheduledFromTime?: string; // Hora original si la clase fue cambiada
  isRescheduled?: boolean; // Indica si ha sido reprogramada
  isPaid?: boolean; // Indica si la clase está cobrada/pagada (se muestra en verde)
  paymentId?: string; // ID del pago vinculado
  createdAt: string;
  updatedAt: string;
}

// -----------------------------------------------------------------------------
// Payment
// -----------------------------------------------------------------------------
export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  date: string;
  method: 'efectivo' | 'transferencia' | 'bizum' | 'paypal' | 'otro';
  concept: string;
  classSessionIds: string[]; // linked sessions
  status: 'pendiente' | 'cobrado' | 'cancelado';
  receiptNumber?: string;
  notes: string;
  createdAt: string;
}

// -----------------------------------------------------------------------------
// Dashboard Stats
// -----------------------------------------------------------------------------
export interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  totalClassesThisMonth: number;
  totalClassesThisWeek: number;
  totalIncomeThisMonth: number;
  pendingPayments: number;
  pendingPaymentAmount: number;
  upcomingClasses: ClassSession[];
  recentPayments: Payment[];
  monthlyIncome: { month: string; amount: number }[];
}

// -----------------------------------------------------------------------------
// Settings
// -----------------------------------------------------------------------------
export interface AppSettings {
  businessName: string;
  teacherName: string;
  email: string;
  phone?: string;
  defaultRate: number;
  currency: string;
  theme: 'light' | 'dark' | 'system';
  language: 'es' | 'en';
  notifications: boolean;
  autoBackup: boolean;
}

// -----------------------------------------------------------------------------
// Form types for creating/editing (omit auto-generated fields)
// -----------------------------------------------------------------------------
export type StudentFormData = Omit<Student, 'id' | 'createdAt' | 'updatedAt' | 'avatarColor'>;
export type SubjectFormData = Omit<Subject, 'id' | 'createdAt'>;
export type ClassSessionFormData = Omit<ClassSession, 'id' | 'createdAt' | 'updatedAt' | 'totalAmount'>;
export type PaymentFormData = Omit<Payment, 'id' | 'createdAt' | 'receiptNumber'>;

// -----------------------------------------------------------------------------
// Type Aliases for flexibility
// -----------------------------------------------------------------------------
export type Class = ClassSession;
export type Settings = AppSettings;

// -----------------------------------------------------------------------------
// Enriched Student (with computed details)
// -----------------------------------------------------------------------------
export type StudentWithDetails = Student & {
  subjects: Subject[];
  totalClasses: number;
  totalPaid: number;
  totalPending: number;
};

// -----------------------------------------------------------------------------
// Filter types
// -----------------------------------------------------------------------------
export interface ClassFilter {
  studentId?: string;
  subjectId?: string;
  status?: ClassSession['status'];
  dateFrom?: string;
  dateTo?: string;
}

export interface PaymentFilter {
  studentId?: string;
  status?: Payment['status'];
  method?: Payment['method'];
  dateFrom?: string;
  dateTo?: string;
}

// -----------------------------------------------------------------------------
// Student-Subject junction (for many-to-many relationship)
// -----------------------------------------------------------------------------
export interface StudentSubject {
  studentId: string;
  subjectId: string;
  customRate?: number; // optional per-student rate override
  createdAt: string;
}

// -----------------------------------------------------------------------------
// Monthly/Weekly report types
// -----------------------------------------------------------------------------
export interface MonthlyReport {
  month: string;
  totalClasses: number;
  totalHours: number;
  totalIncome: number;
  totalPaid: number;
  totalPending: number;
}

export interface StudentBalance {
  student: Student;
  totalCharged: number;
  totalPaid: number;
  balance: number; // positive = student owes, negative = overpaid
}
