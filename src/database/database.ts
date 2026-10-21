// =============================================================================
// TutorApp - Database Service
// Complete SQLite database layer using expo-sqlite async API
// =============================================================================

import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';
import * as web from './webStorage';
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
import { Colors } from '../constants/theme';

// -----------------------------------------------------------------------------
// UUID Generator
// -----------------------------------------------------------------------------
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// -----------------------------------------------------------------------------
// Database instance (singleton)
// -----------------------------------------------------------------------------
let db: SQLite.SQLiteDatabase | null = null;

/**
 * Get or open the database connection
 */
const getDb = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!db) {
    db = await SQLite.openDatabaseAsync('tutorapp.db');
  }
  return db;
};

// =============================================================================
// DATABASE INITIALIZATION
// =============================================================================

/**
 * Initialize the database: create all tables if they don't exist
 */
export const initializeDatabase = async (): Promise<void> => {
  if (Platform.OS === 'web') {
    return web.webInit();
  }
  const database = await getDb();

  // Enable WAL mode for better performance
  await database.execAsync('PRAGMA journal_mode = WAL;');

  // Create Students table
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY NOT NULL,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      course TEXT DEFAULT '',
      email TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      parentName TEXT,
      parentPhone TEXT,
      address TEXT,
      birthDate TEXT,
      notes TEXT DEFAULT '',
      active INTEGER DEFAULT 1,
      avatarColor TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `);

  try {
    await database.execAsync("ALTER TABLE students ADD COLUMN course TEXT DEFAULT '';");
  } catch {
    // Column already exists
  }

  // Create Subjects table
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      level TEXT DEFAULT '',
      defaultRate REAL DEFAULT 0,
      color TEXT NOT NULL,
      icon TEXT DEFAULT 'book',
      active INTEGER DEFAULT 1,
      createdAt TEXT NOT NULL
    );
  `);

  // Create Student-Subjects junction table
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS student_subjects (
      studentId TEXT NOT NULL,
      subjectId TEXT NOT NULL,
      customRate REAL,
      createdAt TEXT NOT NULL,
      PRIMARY KEY (studentId, subjectId),
      FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (subjectId) REFERENCES subjects(id) ON DELETE CASCADE
    );
  `);

  // Create Class Sessions table
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS class_sessions (
      id TEXT PRIMARY KEY NOT NULL,
      studentId TEXT NOT NULL,
      subjectId TEXT NOT NULL,
      date TEXT NOT NULL,
      startTime TEXT NOT NULL,
      endTime TEXT NOT NULL,
      duration INTEGER NOT NULL,
      rate REAL NOT NULL,
      totalAmount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'scheduled',
      location TEXT NOT NULL DEFAULT 'presencial',
      notes TEXT DEFAULT '',
      homework TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (subjectId) REFERENCES subjects(id) ON DELETE CASCADE
    );
  `);

  // Create Payments table
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY NOT NULL,
      studentId TEXT NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      method TEXT NOT NULL DEFAULT 'efectivo',
      concept TEXT DEFAULT '',
      classSessionIds TEXT DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'pendiente',
      receiptNumber TEXT,
      notes TEXT DEFAULT '',
      createdAt TEXT NOT NULL,
      FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE
    );
  `);

  // Create Settings table (single row)
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      businessName TEXT DEFAULT 'Mi Academia',
      teacherName TEXT DEFAULT '',
      email TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      defaultRate REAL DEFAULT 15,
      currency TEXT DEFAULT 'EUR',
      theme TEXT DEFAULT 'system',
      language TEXT DEFAULT 'es',
      notifications INTEGER DEFAULT 1,
      autoBackup INTEGER DEFAULT 0
    );
  `);

  // Insert default settings if not present
  await database.runAsync(`
    INSERT OR IGNORE INTO settings (id, businessName, teacherName, defaultRate, currency, theme, language, notifications, autoBackup)
    VALUES (1, 'Mi Academia', '', 15, 'EUR', 'system', 'es', 1, 0);
  `);

  // Create indexes for performance
  await database.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_class_sessions_date ON class_sessions(date);
    CREATE INDEX IF NOT EXISTS idx_class_sessions_studentId ON class_sessions(studentId);
    CREATE INDEX IF NOT EXISTS idx_class_sessions_status ON class_sessions(status);
    CREATE INDEX IF NOT EXISTS idx_payments_studentId ON payments(studentId);
    CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
    CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(date);
  `);
};

/**
 * Check if the database has any data (useful for seeding)
 */
export const isDatabaseEmpty = async (): Promise<boolean> => {
  const database = await getDb();
  const result = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM students'
  );
  return (result?.count ?? 0) === 0;
};

// =============================================================================
// STUDENTS CRUD
// =============================================================================

/**
 * Create a new student
 */
export const createStudent = async (data: StudentFormData): Promise<Student> => {
  const database = await getDb();
  const id = generateId();
  const now = new Date().toISOString();
  const avatarColor = Colors.avatarColors[Math.floor(Math.random() * Colors.avatarColors.length)];

  await database.runAsync(
    `INSERT INTO students (id, firstName, lastName, course, email, phone, parentName, parentPhone, address, birthDate, notes, active, avatarColor, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    data.firstName,
    data.lastName,
    data.course || '',
    data.email || '',
    data.phone || '',
    data.parentName || null,
    data.parentPhone || null,
    data.address || null,
    data.birthDate || null,
    data.notes || '',
    data.active ? 1 : 0,
    avatarColor,
    now,
    now
  );

  return getStudentById(id) as Promise<Student>;
};

/**
 * Get all students, optionally filtering by active status
 */
export const getAllStudents = async (activeOnly: boolean = false): Promise<Student[]> => {
  const database = await getDb();
  let query = 'SELECT * FROM students';
  if (activeOnly) {
    query += ' WHERE active = 1';
  }
  query += ' ORDER BY firstName ASC, lastName ASC';

  const rows = await database.getAllAsync<any>(query);
  return rows.map(mapRowToStudent);
};

/**
 * Get a single student by ID
 */
export const getStudentById = async (id: string): Promise<Student | null> => {
  const database = await getDb();
  const row = await database.getFirstAsync<any>(
    'SELECT * FROM students WHERE id = ?',
    id
  );
  return row ? mapRowToStudent(row) : null;
};

/**
 * Update a student
 */
export const updateStudent = async (id: string, data: Partial<StudentFormData>): Promise<Student | null> => {
  const database = await getDb();
  const now = new Date().toISOString();

  const fields: string[] = [];
  const values: any[] = [];

  if (data.firstName !== undefined) { fields.push('firstName = ?'); values.push(data.firstName); }
  if (data.lastName !== undefined) { fields.push('lastName = ?'); values.push(data.lastName); }
  if (data.course !== undefined) { fields.push('course = ?'); values.push(data.course); }
  if (data.email !== undefined) { fields.push('email = ?'); values.push(data.email); }
  if (data.phone !== undefined) { fields.push('phone = ?'); values.push(data.phone); }
  if (data.parentName !== undefined) { fields.push('parentName = ?'); values.push(data.parentName || null); }
  if (data.parentPhone !== undefined) { fields.push('parentPhone = ?'); values.push(data.parentPhone || null); }
  if (data.address !== undefined) { fields.push('address = ?'); values.push(data.address || null); }
  if (data.birthDate !== undefined) { fields.push('birthDate = ?'); values.push(data.birthDate || null); }
  if (data.notes !== undefined) { fields.push('notes = ?'); values.push(data.notes); }
  if (data.active !== undefined) { fields.push('active = ?'); values.push(data.active ? 1 : 0); }

  if (fields.length === 0) return getStudentById(id);

  fields.push('updatedAt = ?');
  values.push(now);
  values.push(id);

  await database.runAsync(
    `UPDATE students SET ${fields.join(', ')} WHERE id = ?`,
    ...values
  );

  return getStudentById(id);
};

/**
 * Delete a student (and cascade delete related data)
 */
export const deleteStudent = async (id: string): Promise<void> => {
  const database = await getDb();
  // Delete related records first (in case foreign keys aren't enforced)
  await database.runAsync('DELETE FROM student_subjects WHERE studentId = ?', id);
  await database.runAsync('DELETE FROM class_sessions WHERE studentId = ?', id);
  await database.runAsync('DELETE FROM payments WHERE studentId = ?', id);
  await database.runAsync('DELETE FROM students WHERE id = ?', id);
};

/**
 * Search students by name or email
 */
export const searchStudents = async (query: string): Promise<Student[]> => {
  const database = await getDb();
  const searchTerm = `%${query}%`;
  const rows = await database.getAllAsync<any>(
    `SELECT * FROM students
     WHERE firstName LIKE ? OR lastName LIKE ? OR email LIKE ?
     ORDER BY firstName ASC, lastName ASC`,
    searchTerm,
    searchTerm,
    searchTerm
  );
  return rows.map(mapRowToStudent);
};

/**
 * Get student with enriched details (subjects, totals)
 */
export const getStudentWithDetails = async (id: string): Promise<StudentWithDetails | null> => {
  const student = await getStudentById(id);
  if (!student) return null;

  const subjects = await getSubjectsForStudent(id);
  const database = await getDb();

  const classCount = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM class_sessions WHERE studentId = ?',
    id
  );

  const paidResult = await database.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE studentId = ? AND status = 'cobrado'`,
    id
  );

  const chargedResult = await database.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(totalAmount), 0) as total FROM class_sessions WHERE studentId = ? AND status = 'completed'`,
    id
  );

  return {
    ...student,
    subjects,
    totalClasses: classCount?.count ?? 0,
    totalPaid: paidResult?.total ?? 0,
    totalPending: (chargedResult?.total ?? 0) - (paidResult?.total ?? 0),
  };
};

// Helper: Map a database row to a Student object
const mapRowToStudent = (row: any): Student => ({
  id: row.id,
  firstName: row.firstName,
  lastName: row.lastName,
  course: row.course || undefined,
  email: row.email || '',
  phone: row.phone || '',
  parentName: row.parentName || undefined,
  parentPhone: row.parentPhone || undefined,
  address: row.address || undefined,
  birthDate: row.birthDate || undefined,
  notes: row.notes || '',
  active: row.active === 1,
  avatarColor: row.avatarColor,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

// =============================================================================
// SUBJECTS CRUD
// =============================================================================

/**
 * Create a new subject
 */
export const createSubject = async (data: SubjectFormData): Promise<Subject> => {
  const database = await getDb();
  const id = generateId();
  const now = new Date().toISOString();

  await database.runAsync(
    `INSERT INTO subjects (id, name, description, level, defaultRate, color, icon, active, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    data.name,
    data.description || '',
    data.level || '',
    data.defaultRate,
    data.color,
    data.icon || 'book',
    data.active ? 1 : 0,
    now
  );

  return getSubjectById(id) as Promise<Subject>;
};

/**
 * Get all subjects
 */
export const getAllSubjects = async (activeOnly: boolean = false): Promise<Subject[]> => {
  const database = await getDb();
  let query = 'SELECT * FROM subjects';
  if (activeOnly) {
    query += ' WHERE active = 1';
  }
  query += ' ORDER BY name ASC';

  const rows = await database.getAllAsync<any>(query);
  return rows.map(mapRowToSubject);
};

/**
 * Get a single subject by ID
 */
export const getSubjectById = async (id: string): Promise<Subject | null> => {
  const database = await getDb();
  const row = await database.getFirstAsync<any>(
    'SELECT * FROM subjects WHERE id = ?',
    id
  );
  return row ? mapRowToSubject(row) : null;
};

/**
 * Update a subject
 */
export const updateSubject = async (id: string, data: Partial<SubjectFormData>): Promise<Subject | null> => {
  const database = await getDb();

  const fields: string[] = [];
  const values: any[] = [];

  if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
  if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
  if (data.level !== undefined) { fields.push('level = ?'); values.push(data.level); }
  if (data.defaultRate !== undefined) { fields.push('defaultRate = ?'); values.push(data.defaultRate); }
  if (data.color !== undefined) { fields.push('color = ?'); values.push(data.color); }
  if (data.icon !== undefined) { fields.push('icon = ?'); values.push(data.icon); }
  if (data.active !== undefined) { fields.push('active = ?'); values.push(data.active ? 1 : 0); }

  if (fields.length === 0) return getSubjectById(id);

  values.push(id);

  await database.runAsync(
    `UPDATE subjects SET ${fields.join(', ')} WHERE id = ?`,
    ...values
  );

  return getSubjectById(id);
};

/**
 * Delete a subject
 */
export const deleteSubject = async (id: string): Promise<void> => {
  const database = await getDb();
  await database.runAsync('DELETE FROM student_subjects WHERE subjectId = ?', id);
  await database.runAsync('DELETE FROM subjects WHERE id = ?', id);
};

/**
 * Get subjects assigned to a student
 */
export const getSubjectsForStudent = async (studentId: string): Promise<Subject[]> => {
  const database = await getDb();
  const rows = await database.getAllAsync<any>(
    `SELECT s.* FROM subjects s
     INNER JOIN student_subjects ss ON s.id = ss.subjectId
     WHERE ss.studentId = ?
     ORDER BY s.name ASC`,
    studentId
  );
  return rows.map(mapRowToSubject);
};

/**
 * Assign a subject to a student
 */
export const assignSubjectToStudent = async (
  studentId: string,
  subjectId: string,
  customRate?: number
): Promise<void> => {
  const database = await getDb();
  const now = new Date().toISOString();
  await database.runAsync(
    `INSERT OR REPLACE INTO student_subjects (studentId, subjectId, customRate, createdAt)
     VALUES (?, ?, ?, ?)`,
    studentId,
    subjectId,
    customRate ?? null,
    now
  );
};

/**
 * Remove a subject assignment from a student
 */
export const removeSubjectFromStudent = async (
  studentId: string,
  subjectId: string
): Promise<void> => {
  const database = await getDb();
  await database.runAsync(
    'DELETE FROM student_subjects WHERE studentId = ? AND subjectId = ?',
    studentId,
    subjectId
  );
};

// Helper: Map a database row to a Subject object
const mapRowToSubject = (row: any): Subject => ({
  id: row.id,
  name: row.name,
  description: row.description || '',
  level: row.level || '',
  defaultRate: row.defaultRate || 0,
  color: row.color,
  icon: row.icon || 'book',
  active: row.active === 1,
  createdAt: row.createdAt,
});

// =============================================================================
// CLASS SESSIONS CRUD
// =============================================================================

/**
 * Create a new class session
 */
export const createClassSession = async (data: ClassSessionFormData): Promise<ClassSession> => {
  const database = await getDb();
  const id = generateId();
  const now = new Date().toISOString();
  const totalAmount = (data.duration / 60) * data.rate;

  await database.runAsync(
    `INSERT INTO class_sessions (id, studentId, subjectId, date, startTime, endTime, duration, rate, totalAmount, status, location, notes, homework, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    data.studentId,
    data.subjectId,
    data.date,
    data.startTime,
    data.endTime,
    data.duration,
    data.rate,
    totalAmount,
    data.status || 'scheduled',
    data.location || 'presencial',
    data.notes || '',
    data.homework || null,
    now,
    now
  );

  return getClassSessionById(id) as Promise<ClassSession>;
};

/**
 * Get all class sessions with optional filtering
 */
export const getAllClassSessions = async (filter?: ClassFilter): Promise<ClassSession[]> => {
  const database = await getDb();
  const conditions: string[] = [];
  const values: any[] = [];

  if (filter?.studentId) { conditions.push('studentId = ?'); values.push(filter.studentId); }
  if (filter?.subjectId) { conditions.push('subjectId = ?'); values.push(filter.subjectId); }
  if (filter?.status) { conditions.push('status = ?'); values.push(filter.status); }
  if (filter?.dateFrom) { conditions.push('date >= ?'); values.push(filter.dateFrom); }
  if (filter?.dateTo) { conditions.push('date <= ?'); values.push(filter.dateTo); }

  let query = 'SELECT * FROM class_sessions';
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  query += ' ORDER BY date DESC, startTime DESC';

  const rows = await database.getAllAsync<any>(query, ...values);
  return rows.map(mapRowToClassSession);
};

/**
 * Get class sessions for a specific date range (for calendar views)
 */
export const getClassSessionsByDateRange = async (
  dateFrom: string,
  dateTo: string
): Promise<ClassSession[]> => {
  const database = await getDb();
  const rows = await database.getAllAsync<any>(
    `SELECT * FROM class_sessions
     WHERE date >= ? AND date <= ?
     ORDER BY date ASC, startTime ASC`,
    dateFrom,
    dateTo
  );
  return rows.map(mapRowToClassSession);
};

/**
 * Get a single class session by ID
 */
export const getClassSessionById = async (id: string): Promise<ClassSession | null> => {
  const database = await getDb();
  const row = await database.getFirstAsync<any>(
    'SELECT * FROM class_sessions WHERE id = ?',
    id
  );
  return row ? mapRowToClassSession(row) : null;
};

/**
 * Update a class session
 */
export const updateClassSession = async (
  id: string,
  data: Partial<ClassSessionFormData>
): Promise<ClassSession | null> => {
  const database = await getDb();
  const now = new Date().toISOString();

  // First get the current session to calculate totalAmount if rate/duration changes
  const current = await getClassSessionById(id);
  if (!current) return null;

  const newDuration = data.duration ?? current.duration;
  const newRate = data.rate ?? current.rate;
  const totalAmount = (newDuration / 60) * newRate;

  const fields: string[] = [];
  const values: any[] = [];

  if (data.studentId !== undefined) { fields.push('studentId = ?'); values.push(data.studentId); }
  if (data.subjectId !== undefined) { fields.push('subjectId = ?'); values.push(data.subjectId); }
  if (data.date !== undefined) { fields.push('date = ?'); values.push(data.date); }
  if (data.startTime !== undefined) { fields.push('startTime = ?'); values.push(data.startTime); }
  if (data.endTime !== undefined) { fields.push('endTime = ?'); values.push(data.endTime); }
  if (data.duration !== undefined) { fields.push('duration = ?'); values.push(data.duration); }
  if (data.rate !== undefined) { fields.push('rate = ?'); values.push(data.rate); }
  if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status); }
  if (data.location !== undefined) { fields.push('location = ?'); values.push(data.location); }
  if (data.notes !== undefined) { fields.push('notes = ?'); values.push(data.notes); }
  if (data.homework !== undefined) { fields.push('homework = ?'); values.push(data.homework || null); }

  // Always recalculate totalAmount
  fields.push('totalAmount = ?');
  values.push(totalAmount);
  fields.push('updatedAt = ?');
  values.push(now);
  values.push(id);

  await database.runAsync(
    `UPDATE class_sessions SET ${fields.join(', ')} WHERE id = ?`,
    ...values
  );

  return getClassSessionById(id);
};

/**
 * Delete a class session
 */
export const deleteClassSession = async (id: string): Promise<void> => {
  const database = await getDb();
  await database.runAsync('DELETE FROM class_sessions WHERE id = ?', id);
};

/**
 * Get upcoming classes (scheduled in the future)
 */
export const getUpcomingClasses = async (limit: number = 5): Promise<ClassSession[]> => {
  const database = await getDb();
  const today = new Date().toISOString().split('T')[0];
  const rows = await database.getAllAsync<any>(
    `SELECT * FROM class_sessions
     WHERE date >= ? AND status = 'scheduled'
     ORDER BY date ASC, startTime ASC
     LIMIT ?`,
    today,
    limit
  );
  return rows.map(mapRowToClassSession);
};

/**
 * Get classes for today
 */
export const getTodayClasses = async (): Promise<ClassSession[]> => {
  const database = await getDb();
  const today = new Date().toISOString().split('T')[0];
  const rows = await database.getAllAsync<any>(
    `SELECT * FROM class_sessions
     WHERE date = ?
     ORDER BY startTime ASC`,
    today
  );
  return rows.map(mapRowToClassSession);
};

/**
 * Get class count for a student
 */
export const getClassCountForStudent = async (studentId: string): Promise<number> => {
  const database = await getDb();
  const result = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM class_sessions WHERE studentId = ?',
    studentId
  );
  return result?.count ?? 0;
};

// Helper: Map a database row to a ClassSession object
const mapRowToClassSession = (row: any): ClassSession => ({
  id: row.id,
  studentId: row.studentId,
  subjectId: row.subjectId,
  date: row.date,
  startTime: row.startTime,
  endTime: row.endTime,
  duration: row.duration,
  rate: row.rate,
  totalAmount: row.totalAmount,
  status: row.status,
  location: row.location,
  notes: row.notes || '',
  homework: row.homework || undefined,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

// =============================================================================
// PAYMENTS CRUD
// =============================================================================

/**
 * Create a new payment
 */
export const createPayment = async (data: PaymentFormData): Promise<Payment> => {
  const database = await getDb();
  const id = generateId();
  const now = new Date().toISOString();

  // Generate a receipt number (format: REC-YYYYMMDD-XXXX)
  const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const receiptNumber = `REC-${dateStr}-${random}`;

  await database.runAsync(
    `INSERT INTO payments (id, studentId, amount, date, method, concept, classSessionIds, status, receiptNumber, notes, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    data.studentId,
    data.amount,
    data.date,
    data.method || 'efectivo',
    data.concept || '',
    JSON.stringify(data.classSessionIds || []),
    data.status || 'pendiente',
    receiptNumber,
    data.notes || '',
    now
  );

  return getPaymentById(id) as Promise<Payment>;
};

/**
 * Get all payments with optional filtering
 */
export const getAllPayments = async (filter?: PaymentFilter): Promise<Payment[]> => {
  const database = await getDb();
  const conditions: string[] = [];
  const values: any[] = [];

  if (filter?.studentId) { conditions.push('studentId = ?'); values.push(filter.studentId); }
  if (filter?.status) { conditions.push('status = ?'); values.push(filter.status); }
  if (filter?.method) { conditions.push('method = ?'); values.push(filter.method); }
  if (filter?.dateFrom) { conditions.push('date >= ?'); values.push(filter.dateFrom); }
  if (filter?.dateTo) { conditions.push('date <= ?'); values.push(filter.dateTo); }

  let query = 'SELECT * FROM payments';
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  query += ' ORDER BY date DESC, createdAt DESC';

  const rows = await database.getAllAsync<any>(query, ...values);
  return rows.map(mapRowToPayment);
};

/**
 * Get a single payment by ID
 */
export const getPaymentById = async (id: string): Promise<Payment | null> => {
  const database = await getDb();
  const row = await database.getFirstAsync<any>(
    'SELECT * FROM payments WHERE id = ?',
    id
  );
  return row ? mapRowToPayment(row) : null;
};

/**
 * Update a payment
 */
export const updatePayment = async (
  id: string,
  data: Partial<PaymentFormData>
): Promise<Payment | null> => {
  const database = await getDb();

  const fields: string[] = [];
  const values: any[] = [];

  if (data.studentId !== undefined) { fields.push('studentId = ?'); values.push(data.studentId); }
  if (data.amount !== undefined) { fields.push('amount = ?'); values.push(data.amount); }
  if (data.date !== undefined) { fields.push('date = ?'); values.push(data.date); }
  if (data.method !== undefined) { fields.push('method = ?'); values.push(data.method); }
  if (data.concept !== undefined) { fields.push('concept = ?'); values.push(data.concept); }
  if (data.classSessionIds !== undefined) { fields.push('classSessionIds = ?'); values.push(JSON.stringify(data.classSessionIds)); }
  if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status); }
  if (data.notes !== undefined) { fields.push('notes = ?'); values.push(data.notes); }

  if (fields.length === 0) return getPaymentById(id);

  values.push(id);

  await database.runAsync(
    `UPDATE payments SET ${fields.join(', ')} WHERE id = ?`,
    ...values
  );

  return getPaymentById(id);
};

/**
 * Delete a payment
 */
export const deletePayment = async (id: string): Promise<void> => {
  const database = await getDb();
  await database.runAsync('DELETE FROM payments WHERE id = ?', id);
};

/**
 * Get recent payments
 */
export const getRecentPayments = async (limit: number = 5): Promise<Payment[]> => {
  const database = await getDb();
  const rows = await database.getAllAsync<any>(
    `SELECT * FROM payments
     ORDER BY date DESC, createdAt DESC
     LIMIT ?`,
    limit
  );
  return rows.map(mapRowToPayment);
};

/**
 * Get pending payments
 */
export const getPendingPayments = async (): Promise<Payment[]> => {
  const database = await getDb();
  const rows = await database.getAllAsync<any>(
    `SELECT * FROM payments WHERE status = 'pendiente' ORDER BY date DESC`
  );
  return rows.map(mapRowToPayment);
};

// Helper: Map a database row to a Payment object
const mapRowToPayment = (row: any): Payment => ({
  id: row.id,
  studentId: row.studentId,
  amount: row.amount,
  date: row.date,
  method: row.method,
  concept: row.concept || '',
  classSessionIds: JSON.parse(row.classSessionIds || '[]'),
  status: row.status,
  receiptNumber: row.receiptNumber || undefined,
  notes: row.notes || '',
  createdAt: row.createdAt,
});

// =============================================================================
// SETTINGS
// =============================================================================

/**
 * Get the app settings
 */
export const getSettings = async (): Promise<AppSettings> => {
  const database = await getDb();
  const row = await database.getFirstAsync<any>('SELECT * FROM settings WHERE id = 1');

  if (!row) {
    // Return defaults if no settings row exists
    return {
      businessName: 'Mi Academia',
      teacherName: '',
      email: '',
      phone: '',
      defaultRate: 15,
      currency: 'EUR',
      theme: 'system',
      language: 'es',
      notifications: true,
      autoBackup: false,
    };
  }

  return {
    businessName: row.businessName || 'Mi Academia',
    teacherName: row.teacherName || '',
    email: row.email || '',
    phone: row.phone || '',
    defaultRate: row.defaultRate || 15,
    currency: row.currency || 'EUR',
    theme: row.theme || 'system',
    language: row.language || 'es',
    notifications: row.notifications === 1,
    autoBackup: row.autoBackup === 1,
  };
};

/**
 * Update settings
 */
export const updateSettings = async (data: Partial<AppSettings>): Promise<AppSettings> => {
  const database = await getDb();

  const fields: string[] = [];
  const values: any[] = [];

  if (data.businessName !== undefined) { fields.push('businessName = ?'); values.push(data.businessName); }
  if (data.teacherName !== undefined) { fields.push('teacherName = ?'); values.push(data.teacherName); }
  if (data.email !== undefined) { fields.push('email = ?'); values.push(data.email); }
  if (data.phone !== undefined) { fields.push('phone = ?'); values.push(data.phone); }
  if (data.defaultRate !== undefined) { fields.push('defaultRate = ?'); values.push(data.defaultRate); }
  if (data.currency !== undefined) { fields.push('currency = ?'); values.push(data.currency); }
  if (data.theme !== undefined) { fields.push('theme = ?'); values.push(data.theme); }
  if (data.language !== undefined) { fields.push('language = ?'); values.push(data.language); }
  if (data.notifications !== undefined) { fields.push('notifications = ?'); values.push(data.notifications ? 1 : 0); }
  if (data.autoBackup !== undefined) { fields.push('autoBackup = ?'); values.push(data.autoBackup ? 1 : 0); }

  if (fields.length > 0) {
    values.push(1); // WHERE id = 1
    await database.runAsync(
      `UPDATE settings SET ${fields.join(', ')} WHERE id = ?`,
      ...values
    );
  }

  return getSettings();
};

// =============================================================================
// DASHBOARD & STATISTICS
// =============================================================================

/**
 * Get dashboard statistics
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const database = await getDb();
  const now = new Date();

  // Current month range
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  // Current week range (Monday to Sunday)
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + mondayOffset);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const weekStartStr = weekStart.toISOString().split('T')[0];
  const weekEndStr = weekEnd.toISOString().split('T')[0];

  // Total students
  const totalStudentsResult = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM students'
  );

  // Active students
  const activeStudentsResult = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM students WHERE active = 1'
  );

  // Classes this month
  const classesThisMonthResult = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM class_sessions WHERE date >= ? AND date <= ?',
    monthStart,
    monthEnd
  );

  // Classes this week
  const classesThisWeekResult = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM class_sessions WHERE date >= ? AND date <= ?',
    weekStartStr,
    weekEndStr
  );

  // Income this month (from completed sessions)
  const incomeThisMonthResult = await database.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total FROM payments
     WHERE status = 'cobrado' AND date >= ? AND date <= ?`,
    monthStart,
    monthEnd
  );

  // Pending payments
  const pendingPaymentsResult = await database.getFirstAsync<{ count: number; total: number }>(
    `SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'pendiente'`
  );

  // Upcoming classes
  const upcomingClasses = await getUpcomingClasses(5);

  // Recent payments
  const recentPayments = await getRecentPayments(5);

  // Monthly income for the last 6 months
  const monthlyIncome: { month: string; amount: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mStart = d.toISOString().split('T')[0];
    const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    const result = await database.getFirstAsync<{ total: number }>(
      `SELECT COALESCE(SUM(amount), 0) as total FROM payments
       WHERE status = 'cobrado' AND date >= ? AND date <= ?`,
      mStart,
      mEnd
    );

    monthlyIncome.push({
      month: monthKey,
      amount: result?.total ?? 0,
    });
  }

  return {
    totalStudents: totalStudentsResult?.count ?? 0,
    activeStudents: activeStudentsResult?.count ?? 0,
    totalClassesThisMonth: classesThisMonthResult?.count ?? 0,
    totalClassesThisWeek: classesThisWeekResult?.count ?? 0,
    totalIncomeThisMonth: incomeThisMonthResult?.total ?? 0,
    pendingPayments: pendingPaymentsResult?.count ?? 0,
    pendingPaymentAmount: pendingPaymentsResult?.total ?? 0,
    upcomingClasses,
    recentPayments,
    monthlyIncome,
  };
};

// =============================================================================
// FINANCIAL REPORTS
// =============================================================================

/**
 * Get monthly financial report
 */
export const getMonthlyReport = async (year: number, month: number): Promise<MonthlyReport> => {
  const database = await getDb();
  const monthStart = new Date(year, month - 1, 1).toISOString().split('T')[0];
  const monthEnd = new Date(year, month, 0).toISOString().split('T')[0];
  const monthKey = `${year}-${String(month).padStart(2, '0')}`;

  // Total classes
  const classesResult = await database.getFirstAsync<{ count: number; hours: number; income: number }>(
    `SELECT 
       COUNT(*) as count,
       COALESCE(SUM(duration), 0) as hours,
       COALESCE(SUM(totalAmount), 0) as income
     FROM class_sessions 
     WHERE date >= ? AND date <= ? AND status = 'completed'`,
    monthStart,
    monthEnd
  );

  // Total paid
  const paidResult = await database.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total FROM payments
     WHERE status = 'cobrado' AND date >= ? AND date <= ?`,
    monthStart,
    monthEnd
  );

  // Total pending
  const pendingResult = await database.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total FROM payments
     WHERE status = 'pendiente' AND date >= ? AND date <= ?`,
    monthStart,
    monthEnd
  );

  return {
    month: monthKey,
    totalClasses: classesResult?.count ?? 0,
    totalHours: (classesResult?.hours ?? 0) / 60,
    totalIncome: classesResult?.income ?? 0,
    totalPaid: paidResult?.total ?? 0,
    totalPending: pendingResult?.total ?? 0,
  };
};

/**
 * Get income per month for a year (for charts)
 */
export const getYearlyIncomeByMonth = async (year: number): Promise<{ month: string; amount: number }[]> => {
  const results: { month: string; amount: number }[] = [];
  const database = await getDb();

  for (let month = 1; month <= 12; month++) {
    const monthStart = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const monthEnd = new Date(year, month, 0).toISOString().split('T')[0];
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;

    const result = await database.getFirstAsync<{ total: number }>(
      `SELECT COALESCE(SUM(amount), 0) as total FROM payments
       WHERE status = 'cobrado' AND date >= ? AND date <= ?`,
      monthStart,
      monthEnd
    );

    results.push({
      month: monthKey,
      amount: result?.total ?? 0,
    });
  }

  return results;
};

/**
 * Get per-student balance (how much each student owes or has overpaid)
 */
export const getStudentBalances = async (): Promise<StudentBalance[]> => {
  const database = await getDb();
  const students = await getAllStudents(true); // only active students
  const balances: StudentBalance[] = [];

  for (const student of students) {
    // Total charged (completed sessions)
    const chargedResult = await database.getFirstAsync<{ total: number }>(
      `SELECT COALESCE(SUM(totalAmount), 0) as total FROM class_sessions
       WHERE studentId = ? AND status = 'completed'`,
      student.id
    );

    // Total paid
    const paidResult = await database.getFirstAsync<{ total: number }>(
      `SELECT COALESCE(SUM(amount), 0) as total FROM payments
       WHERE studentId = ? AND status = 'cobrado'`,
      student.id
    );

    const totalCharged = chargedResult?.total ?? 0;
    const totalPaid = paidResult?.total ?? 0;

    balances.push({
      student,
      totalCharged,
      totalPaid,
      balance: totalCharged - totalPaid, // positive = student owes money
    });
  }

  // Sort by balance descending (who owes the most first)
  balances.sort((a, b) => b.balance - a.balance);

  return balances;
};

/**
 * Get weekly income for the current week
 */
export const getWeeklyIncome = async (): Promise<number> => {
  const database = await getDb();
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + mondayOffset);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const result = await database.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total FROM payments
     WHERE status = 'cobrado' AND date >= ? AND date <= ?`,
    weekStart.toISOString().split('T')[0],
    weekEnd.toISOString().split('T')[0]
  );

  return result?.total ?? 0;
};

/**
 * Get total income for a student
 */
export const getStudentTotalPaid = async (studentId: string): Promise<number> => {
  const database = await getDb();
  const result = await database.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total FROM payments
     WHERE studentId = ? AND status = 'cobrado'`,
    studentId
  );
  return result?.total ?? 0;
};

/**
 * Get total pending amount for a student
 */
export const getStudentPendingAmount = async (studentId: string): Promise<number> => {
  const database = await getDb();

  const chargedResult = await database.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(totalAmount), 0) as total FROM class_sessions
     WHERE studentId = ? AND status = 'completed'`,
    studentId
  );

  const paidResult = await database.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total FROM payments
     WHERE studentId = ? AND status = 'cobrado'`,
    studentId
  );

  return (chargedResult?.total ?? 0) - (paidResult?.total ?? 0);
};

// =============================================================================
// DATA EXPORT
// =============================================================================

/**
 * Export all data as a JSON object (for backup/export)
 */
export const exportData = async (): Promise<{
  exportDate: string;
  version: string;
  students: Student[];
  subjects: Subject[];
  classSessions: ClassSession[];
  payments: Payment[];
  settings: AppSettings;
  studentSubjects: StudentSubject[];
}> => {
  const database = await getDb();

  const students = await getAllStudents();
  const subjects = await getAllSubjects();
  const classSessions = await getAllClassSessions();
  const payments = await getAllPayments();
  const settings = await getSettings();

  // Get student-subject assignments
  const ssRows = await database.getAllAsync<any>('SELECT * FROM student_subjects');
  const studentSubjects: StudentSubject[] = ssRows.map((row: any) => ({
    studentId: row.studentId,
    subjectId: row.subjectId,
    customRate: row.customRate || undefined,
    createdAt: row.createdAt,
  }));

  return {
    exportDate: new Date().toISOString(),
    version: '1.0.0',
    students,
    subjects,
    classSessions,
    payments,
    settings,
    studentSubjects,
  };
};

// =============================================================================
// DATABASE MANAGEMENT
// =============================================================================

/**
 * Delete all data from the database (dangerous - for testing/reset only)
 */
export const clearAllData = async (): Promise<void> => {
  const database = await getDb();
  await database.execAsync('DELETE FROM student_subjects');
  await database.execAsync('DELETE FROM payments');
  await database.execAsync('DELETE FROM class_sessions');
  await database.execAsync('DELETE FROM subjects');
  await database.execAsync('DELETE FROM students');
  // Keep settings
};

/**
 * Close the database connection
 */
export const closeDatabase = async (): Promise<void> => {
  if (db) {
    await db.closeAsync();
    db = null;
  }
};
