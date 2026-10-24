import React, { createContext, useContext, useEffect, useState, useMemo, ReactNode } from 'react';
import * as db from '../database/database';
import { seedDatabase } from '../database/seed';
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
}

const DatabaseContext = createContext<DatabaseContextType | null>(null);

export function DatabaseProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        await db.initializeDatabase();
        const empty = await db.isDatabaseEmpty();
        if (empty) {
          await seedDatabase();
        }
        if (mounted) setIsReady(true);
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
      deleteStudent: async (id: string) => db.deleteStudent(id),
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
      createClass: async (data: ClassSessionFormData) => db.createClassSession(data),
      createClassesBatch: async (dataList: ClassSessionFormData[]) => db.createClassesBatch(dataList),
      updateClass: async (id: string, data: Partial<ClassSessionFormData>) => db.updateClassSession(id, data),
      cancelClass: async (id: string, reason: string) => db.cancelClassSession(id, reason),
      rescheduleClass: async (
        id: string,
        newDate: string,
        newStartTime: string,
        newEndTime: string,
        newDuration?: number,
        reason?: string
      ) => db.rescheduleClassSession(id, newDate, newStartTime, newEndTime, newDuration, reason),
      deleteClass: async (id: string) => db.deleteClassSession(id),
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
      clearAllData: async () => db.clearAllData(),
      resetWithSeed: async () => {
        await db.clearAllData();
        await seedDatabase();
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
      },
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
