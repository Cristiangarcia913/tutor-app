import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
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
  updateClass: (id: string, data: Partial<ClassSessionFormData>) => Promise<ClassSession | null>;
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
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  const initDatabase = async () => {
    try {
      await db.initializeDatabase();
      const empty = await db.isDatabaseEmpty();
      if (empty) {
        await seedDatabase();
      }
      setIsReady(true);
      await refreshAll();
    } catch (error) {
      console.error('Failed to initialize database:', error);
      setIsReady(true);
    }
  };

  useEffect(() => {
    initDatabase();
  }, []);

  // Students
  const loadStudents = useCallback(async (activeOnly: boolean = false) => {
    const list = await db.getAllStudents(activeOnly);
    setStudents(list);
    return list;
  }, []);

  const getStudent = useCallback(async (id: string) => {
    return db.getStudentById(id);
  }, []);

  const getStudentWithDetails = useCallback(async (id: string) => {
    return db.getStudentWithDetails(id);
  }, []);

  const createStudent = useCallback(async (data: StudentFormData) => {
    const created = await db.createStudent(data);
    await loadStudents();
    return created;
  }, [loadStudents]);

  const updateStudent = useCallback(async (id: string, data: Partial<StudentFormData>) => {
    const updated = await db.updateStudent(id, data);
    await loadStudents();
    return updated;
  }, [loadStudents]);

  const deleteStudent = useCallback(async (id: string) => {
    await db.deleteStudent(id);
    await loadStudents();
  }, [loadStudents]);

  const searchStudents = useCallback(async (query: string) => {
    return db.searchStudents(query);
  }, []);

  // Subjects
  const loadSubjects = useCallback(async (activeOnly: boolean = false) => {
    const list = await db.getAllSubjects(activeOnly);
    setSubjects(list);
    return list;
  }, []);

  const getSubject = useCallback(async (id: string) => {
    return db.getSubjectById(id);
  }, []);

  const createSubject = useCallback(async (data: SubjectFormData) => {
    const created = await db.createSubject(data);
    await loadSubjects();
    return created;
  }, [loadSubjects]);

  const updateSubject = useCallback(async (id: string, data: Partial<SubjectFormData>) => {
    const updated = await db.updateSubject(id, data);
    await loadSubjects();
    return updated;
  }, [loadSubjects]);

  const deleteSubject = useCallback(async (id: string) => {
    await db.deleteSubject(id);
    await loadSubjects();
  }, [loadSubjects]);

  const getSubjectsForStudent = useCallback(async (studentId: string) => {
    return db.getSubjectsForStudent(studentId);
  }, []);

  const assignSubjectToStudent = useCallback(async (studentId: string, subjectId: string, customRate?: number) => {
    await db.assignSubjectToStudent(studentId, subjectId, customRate);
  }, []);

  const removeSubjectFromStudent = useCallback(async (studentId: string, subjectId: string) => {
    await db.removeSubjectFromStudent(studentId, subjectId);
  }, []);

  // Classes
  const loadClasses = useCallback(async (filter?: ClassFilter) => {
    const list = await db.getAllClassSessions(filter);
    setClasses(list);
    return list;
  }, []);

  const getClass = useCallback(async (id: string) => {
    return db.getClassSessionById(id);
  }, []);

  const createClass = useCallback(async (data: ClassSessionFormData) => {
    const created = await db.createClassSession(data);
    await loadClasses();
    return created;
  }, [loadClasses]);

  const updateClass = useCallback(async (id: string, data: Partial<ClassSessionFormData>) => {
    const updated = await db.updateClassSession(id, data);
    await loadClasses();
    return updated;
  }, [loadClasses]);

  const deleteClass = useCallback(async (id: string) => {
    await db.deleteClassSession(id);
    await loadClasses();
  }, [loadClasses]);

  const getUpcomingClasses = useCallback(async (limit: number = 5) => {
    return db.getUpcomingClasses(limit);
  }, []);

  const getTodayClasses = useCallback(async () => {
    return db.getTodayClasses();
  }, []);

  const getClassesByStudent = useCallback(async (studentId: string) => {
    return db.getAllClassSessions({ studentId });
  }, []);

  // Payments
  const loadPayments = useCallback(async (filter?: PaymentFilter) => {
    const list = await db.getAllPayments(filter);
    setPayments(list);
    return list;
  }, []);

  const getPayment = useCallback(async (id: string) => {
    return db.getPaymentById(id);
  }, []);

  const getPaymentsByStudent = useCallback(async (studentId: string) => {
    return db.getAllPayments({ studentId });
  }, []);

  const createPayment = useCallback(async (data: PaymentFormData) => {
    const created = await db.createPayment(data);
    await loadPayments();
    return created;
  }, [loadPayments]);

  const updatePayment = useCallback(async (id: string, data: Partial<PaymentFormData>) => {
    const updated = await db.updatePayment(id, data);
    await loadPayments();
    return updated;
  }, [loadPayments]);

  const deletePayment = useCallback(async (id: string) => {
    await db.deletePayment(id);
    await loadPayments();
  }, [loadPayments]);

  const getRecentPayments = useCallback(async (limit: number = 5) => {
    return db.getRecentPayments(limit);
  }, []);

  const getPendingPayments = useCallback(async () => {
    return db.getPendingPayments();
  }, []);

  const getStudentBalance = useCallback(async (studentId: string) => {
    const paid = await db.getStudentTotalPaid(studentId);
    const pending = await db.getStudentPendingAmount(studentId);
    return { charged: paid + pending, paid, pending };
  }, []);

  const getStudentBalances = useCallback(async () => {
    return db.getStudentBalances();
  }, []);

  // Dashboard & Reports
  const loadDashboardStats = useCallback(async () => {
    const stats = await db.getDashboardStats();
    setDashboardStats(stats);
    return stats;
  }, []);

  const getMonthlyIncome = useCallback(async (monthsCount: number = 6) => {
    const currentYear = new Date().getFullYear();
    const yearly = await db.getYearlyIncomeByMonth(currentYear);
    return yearly.slice(-monthsCount);
  }, []);

  const getMonthlyReport = useCallback(async (year: number, month: number) => {
    return db.getMonthlyReport(year, month);
  }, []);

  // Settings
  const loadSettings = useCallback(async () => {
    const s = await db.getSettings();
    setSettings(s);
    return s;
  }, []);

  const updateSettings = useCallback(async (data: Partial<AppSettings>) => {
    const updated = await db.updateSettings(data);
    setSettings(updated);
    return updated;
  }, []);

  // Utils
  const exportData = useCallback(async () => {
    return db.exportData();
  }, []);

  const clearAllData = useCallback(async () => {
    await db.clearAllData();
    await refreshAll();
  }, []);

  const resetWithSeed = useCallback(async () => {
    await db.clearAllData();
    await seedDatabase();
    await refreshAll();
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      loadStudents(),
      loadSubjects(),
      loadClasses(),
      loadPayments(),
      loadDashboardStats(),
      loadSettings(),
    ]);
  }, [loadStudents, loadSubjects, loadClasses, loadPayments, loadDashboardStats, loadSettings]);

  return (
    <DatabaseContext.Provider
      value={{
        isReady,
        students,
        loadStudents,
        getStudents: loadStudents,
        getStudent,
        getStudentWithDetails,
        createStudent,
        updateStudent,
        deleteStudent,
        searchStudents,
        subjects,
        loadSubjects,
        getSubjects: loadSubjects,
        getSubject,
        createSubject,
        updateSubject,
        deleteSubject,
        getSubjectsForStudent,
        assignSubjectToStudent,
        removeSubjectFromStudent,
        classes,
        loadClasses,
        getClasses: loadClasses,
        getClass,
        createClass,
        updateClass,
        deleteClass,
        getUpcomingClasses,
        getTodayClasses,
        getClassesByStudent,
        payments,
        loadPayments,
        getPayments: loadPayments,
        getPayment,
        getPaymentsByStudent,
        createPayment,
        updatePayment,
        deletePayment,
        getRecentPayments,
        getPendingPayments,
        getStudentBalance,
        getStudentBalances,
        dashboardStats,
        loadDashboardStats,
        getMonthlyIncome,
        getMonthlyReport,
        settings,
        loadSettings,
        updateSettings,
        exportData,
        clearAllData,
        resetWithSeed,
        refreshAll,
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase(): DatabaseContextType {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
}
