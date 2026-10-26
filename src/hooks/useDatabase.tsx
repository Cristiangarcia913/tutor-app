import React, { createContext, useContext, useEffect, useState, useMemo, ReactNode } from 'react';
import * as db from '../database/database';
import { seedDatabase } from '../database/seed';
import { syncCalendarToServer } from '../utils/calendarSync';
import {
  Student,
  Subject,
  ClassSession,
  Payment,
  AppSettings,
  DashboardStats,
  StudentFormData,
  SubjectFormData,
  ClassSessionFormData,
  PaymentFormData,
  ClassFilter,
  PaymentFilter,
  StudentWithDetails,
  StudentBalance,
  MonthlyReport,
} from '../types';

interface DatabaseContextType {
  isReady: boolean;
  // Students
  students: Student[];
  loadStudents: (activeOnly?: boolean) => Promise<Student[]>;
  getStudents: (activeOnly?: boolean) => Promise<Student[]>;
  getStudent: (id: string) => Promise<Student | null>;
  getStudentByAccessCode: (code: string) => Promise<Student | null>;
  getStudentWithDetails: (id: string) => Promise<StudentWithDetails | null>;
  createStudent: (data: StudentFormData) => Promise<Student>;
  updateStudent: (id: string, data: Partial<StudentFormData>) => Promise<Student | null>;
  deleteStudent: (id: string) => Promise<void>;
  searchStudents: (query: string) => Promise<Student[]>;

  // Subjects
  subjects: Subject[];
  loadSubjects: (activeOnly?: boolean) => Promise<Subject[]>;
  getSubjects: (activeOnly?: boolean) => Promise<Subject[]>;
  getSubject: (id: string) => Promise<Subject | null>;
  createSubject: (data: SubjectFormData) => Promise<Subject>;
  updateSubject: (id: string, data: Partial<SubjectFormData>) => Promise<Subject | null>;
  deleteSubject: (id: string) => Promise<void>;
  getSubjectsForStudent: (studentId: string) => Promise<Subject[]>;
  assignSubjectToStudent: (studentId: string, subjectId: string, customRate?: number) => Promise<void>;
  removeSubjectFromStudent: (studentId: string, subjectId: string) => Promise<void>;

  // Classes
  classes: ClassSession[];
  loadClasses: (filter?: ClassFilter) => Promise<ClassSession[]>;
  getClasses: (filter?: ClassFilter) => Promise<ClassSession[]>;
  getClass: (id: string) => Promise<ClassSession | null>;
  getClassesByStudent: (studentId: string) => Promise<ClassSession[]>;
  createClass: (data: ClassSessionFormData) => Promise<ClassSession>;
  createClassesBatch: (dataList: ClassSessionFormData[]) => Promise<ClassSession[]>;
  updateClass: (id: string, data: Partial<ClassSessionFormData>) => Promise<ClassSession | null>;
  cancelClass: (id: string, reason: string) => Promise<ClassSession | null>;
  rescheduleClass: (
    id: string,
    newDate: string,
    newStartTime: string,
    newEndTime: string,
    newDuration?: number,
    reason?: string
  ) => Promise<ClassSession | null>;
  deleteClass: (id: string) => Promise<void>;
  toggleClassPaid: (id: string, method?: 'bizum' | 'efectivo') => Promise<{ classSession: ClassSession | null; payment?: Payment }>;
  generateMonthClassesForStudent: (studentId: string, year: number, month: number) => Promise<ClassSession[]>;
  getUpcomingClasses: (limit?: number) => Promise<ClassSession[]>;
  getTodayClasses: () => Promise<ClassSession[]>;

  // Payments
  payments: Payment[];
  loadPayments: (filter?: PaymentFilter) => Promise<Payment[]>;
  getPayments: (filter?: PaymentFilter) => Promise<Payment[]>;
  getPayment: (id: string) => Promise<Payment | null>;
  getPaymentsByStudent: (studentId: string) => Promise<Payment[]>;
  createPayment: (data: PaymentFormData) => Promise<Payment>;
  updatePayment: (id: string, data: Partial<PaymentFormData>) => Promise<Payment | null>;
  deletePayment: (id: string) => Promise<void>;
  getRecentPayments: (limit?: number) => Promise<Payment[]>;
  getPendingPayments: () => Promise<Payment[]>;
  getStudentBalance: (studentId: string) => Promise<{ charged: number; paid: number; pending: number }>;
  getStudentBalances: () => Promise<StudentBalance[]>;

  // Dashboard & Stats
  dashboardStats: DashboardStats | null;
  loadDashboardStats: () => Promise<DashboardStats>;
  getMonthlyIncome: (monthsCount?: number) => Promise<{ month: string; amount: number }[]>;
  getMonthlyReport: (year: number, month: number) => Promise<MonthlyReport>;

  // Settings
  settings: AppSettings | null;
  loadSettings: () => Promise<AppSettings>;
  updateSettings: (data: Partial<AppSettings>) => Promise<AppSettings>;

  // Utils & Management
  exportData: () => Promise<any>;
  clearAllData: () => Promise<void>;
  resetWithSeed: () => Promise<void>;
  refreshAll: () => Promise<void>;
  syncCalendarNow: () => Promise<boolean>;
}

const DatabaseContext = createContext<DatabaseContextType | null>(null);

export function DatabaseProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  const triggerCalendarSync = async (): Promise<boolean> => {
    try {
      const [allClasses, allStudents, allSubjects, appSettings] = await Promise.all([
        db.getAllClassSessions(),
        db.getAllStudents(),
        db.getAllSubjects(),
        db.getSettings(),
      ]);
      // Si no hay alumnos reales (p. ej. primer arranque en nuevo navegador o crawler), NO sobreescribir el calendario
      if (!allStudents || allStudents.length === 0) {
        return false;
      }
      const studentMap: Record<string, Student> = {};
      allStudents.forEach((s) => {
        studentMap[s.id] = s;
      });
      const subjectMap: Record<string, Subject> = {};
      allSubjects.forEach((s) => {
        subjectMap[s.id] = s;
      });
      return await syncCalendarToServer(
        allClasses,
        studentMap,
        subjectMap,
        appSettings?.teacherName || 'Cristian'
      );
    } catch (err) {
      console.warn('Auto calendar sync error:', err);
      return false;
    }
  };

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        await db.initializeDatabase();
        // NUNCA auto-seed de alumnos demo en producción
        if (mounted) {
          setIsReady(true);
          triggerCalendarSync();
        }
      } catch (error) {
        console.error('Database initialization error:', error);
        if (mounted) setIsReady(true);
      }
    };
    init();
    return () => {
      mounted = false;
    };
  }, []);

  const value: DatabaseContextType = useMemo(() => {
    const loadStudents = async (activeOnly: boolean = false) => {
      return db.getAllStudents(activeOnly);
    };

    const loadSubjects = async (activeOnly: boolean = false) => {
      return db.getAllSubjects(activeOnly);
    };

    const loadClasses = async (filter?: ClassFilter) => {
      return db.getAllClassSessions(filter);
    };

    const loadPayments = async (filter?: PaymentFilter) => {
      return db.getAllPayments(filter);
    };

    const loadDashboardStats = async () => {
      return db.getDashboardStats();
    };

    const loadSettings = async () => {
      return db.getSettings();
    };

    return {
      isReady,
      students: [],
      loadStudents,
      getStudents: loadStudents,
      getStudent: async (id: string) => db.getStudentById(id),
      getStudentByAccessCode: async (code: string) => db.getStudentByAccessCode(code),
      getStudentWithDetails: async (id: string) => db.getStudentWithDetails(id),
      createStudent: async (data: StudentFormData) => db.createStudent(data),
      updateStudent: async (id: string, data: Partial<StudentFormData>) => db.updateStudent(id, data),
      deleteStudent: async (id: string) => {
        await db.deleteStudent(id);
        triggerCalendarSync();
      },
      searchStudents: async (query: string) => db.searchStudents(query),

      subjects: [],
      loadSubjects,
      getSubjects: loadSubjects,
      getSubject: async (id: string) => db.getSubjectById(id),
      createSubject: async (data: SubjectFormData) => db.createSubject(data),
      updateSubject: async (id: string, data: Partial<SubjectFormData>) => db.updateSubject(id, data),
      deleteSubject: async (id: string) => db.deleteSubject(id),
      getSubjectsForStudent: async (studentId: string) => db.getSubjectsForStudent(studentId),
      assignSubjectToStudent: async (studentId: string, subjectId: string, customRate?: number) =>
        db.assignSubjectToStudent(studentId, subjectId, customRate),
      removeSubjectFromStudent: async (studentId: string, subjectId: string) =>
        db.removeSubjectFromStudent(studentId, subjectId),

      classes: [],
      loadClasses,
      getClasses: loadClasses,
      getClass: async (id: string) => db.getClassSessionById(id),
      getClassesByStudent: async (studentId: string) => db.getAllClassSessions({ studentId }),
      createClass: async (data: ClassSessionFormData) => {
        const res = await db.createClassSession(data);
        triggerCalendarSync();
        return res;
      },
      createClassesBatch: async (dataList: ClassSessionFormData[]) => {
        const res = await db.createClassesBatch(dataList);
        triggerCalendarSync();
        return res;
      },
      updateClass: async (id: string, data: Partial<ClassSessionFormData>) => {
        const res = await db.updateClassSession(id, data);
        triggerCalendarSync();
        return res;
      },
      cancelClass: async (id: string, reason: string) => {
        const res = await db.cancelClassSession(id, reason);
        triggerCalendarSync();
        return res;
      },
      rescheduleClass: async (
        id: string,
        newDate: string,
        newStartTime: string,
        newEndTime: string,
        newDuration?: number,
        reason?: string
      ) => {
        const res = await db.rescheduleClassSession(id, newDate, newStartTime, newEndTime, newDuration, reason);
        triggerCalendarSync();
        return res;
      },
      deleteClass: async (id: string) => {
        await db.deleteClassSession(id);
        triggerCalendarSync();
      },
      toggleClassPaid: async (id: string, method?: 'bizum' | 'efectivo') => {
        const res = await db.toggleClassPaid(id, method);
        triggerCalendarSync();
        return res;
      },
      generateMonthClassesForStudent: async (studentId: string, year: number, month: number) => {
        const res = await db.generateMonthClassesForStudent(studentId, year, month);
        triggerCalendarSync();
        return res;
      },
      getUpcomingClasses: async (limit: number = 5) => db.getUpcomingClasses(limit),
      getTodayClasses: async () => db.getTodayClasses(),

      payments: [],
      loadPayments,
      getPayments: loadPayments,
      getPayment: async (id: string) => db.getPaymentById(id),
      getPaymentsByStudent: async (studentId: string) => db.getAllPayments({ studentId }),
      createPayment: async (data: PaymentFormData) => db.createPayment(data),
      updatePayment: async (id: string, data: Partial<PaymentFormData>) => db.updatePayment(id, data),
      deletePayment: async (id: string) => db.deletePayment(id),
      getRecentPayments: async (limit: number = 5) => db.getRecentPayments(limit),
      getPendingPayments: async () => db.getPendingPayments(),
      getStudentBalance: async (studentId: string) => {
        const paid = await db.getStudentTotalPaid(studentId);
        const pending = await db.getStudentPendingAmount(studentId);
        return { charged: paid + pending, paid, pending };
      },
      getStudentBalances: async () => db.getStudentBalances(),

      dashboardStats: null,
      loadDashboardStats,
      getMonthlyIncome: async (monthsCount: number = 6) => {
        const currentYear = new Date().getFullYear();
        const yearly = await db.getYearlyIncomeByMonth(currentYear);
        return yearly.slice(-monthsCount);
      },
      getMonthlyReport: async (year: number, month: number) => db.getMonthlyReport(year, month),

      settings: null,
      loadSettings,
      updateSettings: async (data: Partial<AppSettings>) => db.updateSettings(data),

      exportData: async () => db.exportData(),
      clearAllData: async () => {
        await db.clearAllData();
        triggerCalendarSync();
      },
      resetWithSeed: async () => {
        await db.clearAllData();
        await seedDatabase();
        triggerCalendarSync();
      },
      refreshAll: async () => {
        await Promise.all([
          loadStudents(),
          loadSubjects(),
          loadClasses(),
          loadPayments(),
          loadDashboardStats(),
          loadSettings(),
        ]);
        triggerCalendarSync();
      },
      syncCalendarNow: triggerCalendarSync,
    };
  }, [isReady]);

  return <DatabaseContext.Provider value={value}>{children}</DatabaseContext.Provider>;
}

export function useDatabase(): DatabaseContextType {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
}
