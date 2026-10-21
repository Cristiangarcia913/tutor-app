// =============================================================================
// TutorApp - Type Definitions
// Complete TypeScript interfaces for the entire application
// =============================================================================

// -----------------------------------------------------------------------------
// Student
// -----------------------------------------------------------------------------
export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  course?: string; // Curso escolar del alumno (e.g. 2º Bachillerato, 3º ESO)
  email?: string;
  phone: string;
  parentName?: string;
  parentPhone?: string;
  address?: string;
  birthDate?: string;
  notes: string;
  active: boolean;
  avatarColor: string;
  createdAt: string;
  updatedAt: string;
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
  phone: string;
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
