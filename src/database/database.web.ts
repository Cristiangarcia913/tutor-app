// =============================================================================
// TutorApp - Database Web Implementation (database.web.ts)
// Automatically selected by Metro bundler when running on the Web platform.
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
  StudentSubject,
  MonthlyReport,
  StudentBalance,
} from '../types';

import * as web from './webStorage';

export const computeEndTime = web.computeEndTime;

export const initializeDatabase = async (): Promise<void> => {
  return web.webInit();
};

export const isDatabaseEmpty = async (): Promise<boolean> => {
  const list = await web.webGetAllStudents();
  return list.length === 0;
};

// Students
export const createStudent = async (data: StudentFormData): Promise<Student> => {
  return web.webCreateStudent(data);
};

export const getAllStudents = async (activeOnly: boolean = false): Promise<Student[]> => {
  return web.webGetAllStudents(activeOnly);
};

export const getStudentById = async (id: string): Promise<Student | null> => {
  return web.webGetStudentById(id);
};

export const getStudentByAccessCode = async (code: string): Promise<Student | null> => {
  return web.webGetStudentByAccessCode(code);
};

export const updateStudent = async (
  id: string,
  data: Partial<StudentFormData>
): Promise<Student | null> => {
  return web.webUpdateStudent(id, data);
};

export const deleteStudent = async (id: string): Promise<void> => {
  return web.webDeleteStudent(id);
};

export const searchStudents = async (query: string): Promise<Student[]> => {
  const all = await web.webGetAllStudents();
  const q = query.toLowerCase().trim();
  if (!q) return all;
  return all.filter((s) => {
    const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
    const email = (s.email || '').toLowerCase();
    const phone = s.phone || '';
    return fullName.includes(q) || email.includes(q) || phone.includes(q);
  });
};

export const getStudentWithDetails = async (id: string): Promise<StudentWithDetails | null> => {
  const student = await web.webGetStudentById(id);
  if (!student) return null;

  const classes = await web.webGetAllClasses({ studentId: id });
  const payments = await web.webGetAllPayments({ studentId: id });
  const subjects = await web.webGetAllSubjects();

  const totalCharged = classes.reduce((sum, c) => sum + c.totalAmount, 0);
  const totalPaid = payments
    .filter((p) => p.status === 'cobrado')
    .reduce((sum, p) => sum + p.amount, 0);

  return {
    ...student,
    subjects,
    totalClasses: classes.length,
    totalPaid,
    totalPending: Math.max(totalCharged - totalPaid, 0),
  };
};

// Subjects
export const createSubject = async (data: SubjectFormData): Promise<Subject> => {
  return web.webCreateSubject(data);
};

export const getAllSubjects = async (activeOnly: boolean = false): Promise<Subject[]> => {
  return web.webGetAllSubjects(activeOnly);
};

export const getSubjectById = async (id: string): Promise<Subject | null> => {
  return web.webGetSubjectById(id);
};

export const updateSubject = async (
  id: string,
  data: Partial<SubjectFormData>
): Promise<Subject | null> => {
  return web.webUpdateSubject(id, data);
};

export const deleteSubject = async (id: string): Promise<void> => {
  return web.webDeleteSubject(id);
};

export const getSubjectsForStudent = async (studentId: string): Promise<Subject[]> => {
  return web.webGetAllSubjects(true);
};

export const assignSubjectToStudent = async (
  studentId: string,
  subjectId: string,
  customRate?: number
): Promise<void> => {
  // Web no-op / handled by classes
};

export const removeSubjectFromStudent = async (
  studentId: string,
  subjectId: string
): Promise<void> => {
  // Web no-op
};

// Classes
export const createClassSession = async (data: ClassSessionFormData): Promise<ClassSession> => {
  return web.webCreateClass(data);
};

export const createClassesBatch = async (dataList: ClassSessionFormData[]): Promise<ClassSession[]> => {
  return web.webCreateClassesBatch(dataList);
};

export const getAllClassSessions = async (filter?: ClassFilter): Promise<ClassSession[]> => {
  return web.webGetAllClasses(filter);
};

export const getClassSessionsByDateRange = async (
  startDate: string,
  endDate: string
): Promise<ClassSession[]> => {
  const all = await web.webGetAllClasses();
  return all.filter((c) => c.date >= startDate && c.date <= endDate);
};

export const getClassSessionById = async (id: string): Promise<ClassSession | null> => {
  return web.webGetClassById(id);
};

export const updateClassSession = async (
  id: string,
  data: Partial<ClassSessionFormData>
): Promise<ClassSession | null> => {
  return web.webUpdateClass(id, data);
};

export const cancelClassSession = async (
  id: string,
  reason: string
): Promise<ClassSession | null> => {
  return web.webCancelClass(id, reason);
};

export const rescheduleClassSession = async (
  id: string,
  newDate: string,
  newStartTime: string,
  newEndTime: string,
  newDuration?: number,
  reason?: string
): Promise<ClassSession | null> => {
  return web.webRescheduleClass(id, newDate, newStartTime, newEndTime, newDuration, reason);
};

export const deleteClassSession = async (id: string): Promise<void> => {
  return web.webDeleteClass(id);
};

export const toggleClassPaid = async (
  id: string,
  method: 'bizum' | 'efectivo' = 'bizum'
): Promise<{ classSession: ClassSession | null; payment?: Payment }> => {
  return web.webToggleClassPaid(id, method);
};

export const generateMonthClassesForStudent = async (
  studentId: string,
  year: number,
  month: number
): Promise<ClassSession[]> => {
  return web.webGenerateMonthClassesForStudent(studentId, year, month);
};

export const getUpcomingClasses = async (limit: number = 5): Promise<ClassSession[]> => {
  const all = await web.webGetAllClasses();
  return all.filter((c) => c.status === 'scheduled').slice(0, limit);
};

export const getTodayClasses = async (): Promise<ClassSession[]> => {
  const today = new Date().toISOString().split('T')[0];
  const all = await web.webGetAllClasses();
  return all.filter((c) => c.date === today);
};

export const getClassCountForStudent = async (studentId: string): Promise<number> => {
  const all = await web.webGetAllClasses({ studentId });
  return all.length;
};

// Payments
export const createPayment = async (data: PaymentFormData): Promise<Payment> => {
  return web.webCreatePayment(data);
};

export const getAllPayments = async (filter?: PaymentFilter): Promise<Payment[]> => {
  return web.webGetAllPayments(filter);
};

export const getPaymentById = async (id: string): Promise<Payment | null> => {
  return web.webGetPaymentById(id);
};

export const updatePayment = async (
  id: string,
  data: Partial<PaymentFormData>
): Promise<Payment | null> => {
  return web.webUpdatePayment(id, data);
};

export const deletePayment = async (id: string): Promise<void> => {
  return web.webDeletePayment(id);
};

export const getRecentPayments = async (limit: number = 5): Promise<Payment[]> => {
  const all = await web.webGetAllPayments();
  return all.slice(0, limit);
};

export const getPendingPayments = async (): Promise<Payment[]> => {
  const all = await web.webGetAllPayments();
  return all.filter((p) => p.status === 'pendiente');
};

// Settings
export const getSettings = async (): Promise<AppSettings> => {
  return web.webGetSettings();
};

export const updateSettings = async (data: Partial<AppSettings>): Promise<AppSettings> => {
  return web.webUpdateSettings(data);
};

// Dashboard
export const getDashboardStats = async (): Promise<DashboardStats> => {
  return web.webGetDashboardStats();
};

export const getMonthlyReport = async (year: number, month: number): Promise<MonthlyReport> => {
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;
  const classes = (await web.webGetAllClasses()).filter((c) => c.date.startsWith(monthStr));
  const payments = (await web.webGetAllPayments()).filter((p) => p.date.startsWith(monthStr));

  const totalHours = classes.reduce((sum, c) => sum + c.duration, 0) / 60;
  const totalIncome = classes.reduce((sum, c) => sum + c.totalAmount, 0);
  const totalPaid = payments
    .filter((p) => p.status === 'cobrado')
    .reduce((sum, p) => sum + p.amount, 0);

  return {
    month: monthStr,
    totalClasses: classes.length,
    totalHours,
    totalIncome,
    totalPaid,
    totalPending: Math.max(totalIncome - totalPaid, 0),
  };
};

export const getYearlyIncomeByMonth = async (
  year: number
): Promise<{ month: string; amount: number }[]> => {
  const stats = await web.webGetDashboardStats();
  return stats.monthlyIncome;
};

export const getStudentBalances = async (): Promise<StudentBalance[]> => {
  return web.webGetStudentBalances();
};

export const getWeeklyIncome = async (): Promise<number> => {
  const payments = await web.webGetAllPayments();
  return payments
    .filter((p) => p.status === 'cobrado')
    .reduce((sum, p) => sum + p.amount, 0);
};

export const getStudentTotalPaid = async (studentId: string): Promise<number> => {
  const classes = await web.webGetAllClasses({ studentId });
  const activeClasses = classes.filter((c) => c.status !== 'cancelled' && !c.cancelReason);
  const paidClassesAmount = activeClasses
    .filter((c) => c.isPaid)
    .reduce((sum, c) => sum + c.totalAmount, 0);

  const payments = await web.webGetAllPayments({ studentId });
  const standalonePayments = payments
    .filter((p) => p.status === 'cobrado' && (!p.classSessionIds || p.classSessionIds.length === 0))
    .reduce((sum, p) => sum + p.amount, 0);

  return paidClassesAmount + standalonePayments;
};

export const getStudentPendingAmount = async (studentId: string): Promise<number> => {
  const classes = await web.webGetAllClasses({ studentId });
  const activeClasses = classes.filter((c) => c.status !== 'cancelled' && !c.cancelReason);
  return activeClasses
    .filter((c) => !c.isPaid)
    .reduce((sum, c) => sum + c.totalAmount, 0);
};

export const exportData = async (): Promise<any> => {
  return web.webExportData();
};

export const clearAllData = async (): Promise<void> => {
  return web.webResetData();
};

export const closeDatabase = async (): Promise<void> => {
  // Web no-op
};
