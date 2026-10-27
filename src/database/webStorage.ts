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

export const generateAccessCode = (name: string): string => {
  const prefix = (name.replace(/[^a-zA-Z]/g, '').substring(0, 3) || 'ALU').toUpperCase();
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${num}`;
};

export const computeEndTime = (startTime: string, durationMinutes: number = 60): string => {
  try {
    const [h, m] = (startTime || '17:00').split(':').map(Number);
    const total = (isNaN(h) ? 17 : h) * 60 + (isNaN(m) ? 0 : m) + (durationMinutes || 60);
    const endH = Math.floor(total / 60) % 24;
    const endM = total % 60;
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  } catch {
    return '18:00';
  }
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

const INITIAL_STUDENTS: Student[] = [];

const now = new Date();
const todayStr = now.toISOString().split('T')[0];

export const getTodayString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const isClassGiven = (c: ClassSession, today: string = getTodayString()): boolean => {
  if (c.status === 'cancelled' || Boolean(c.cancelReason)) return false;
  if (c.status === 'completed') return true;
  return c.date <= today;
};

const INITIAL_CLASSES: ClassSession[] = [];

const INITIAL_PAYMENTS: Payment[] = [];

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
    storage.set('tutorapp_students', []);
    storage.set('tutorapp_subjects', INITIAL_SUBJECTS);
    storage.set('tutorapp_classes', []);
    storage.set('tutorapp_payments', []);
    storage.set('tutorapp_settings', INITIAL_SETTINGS);
    storage.setItem('tutorapp_initialized', 'true');
  }
};

export const webGetAllStudents = async (activeOnly: boolean = false): Promise<Student[]> => {
  let list = storage.get<Student[]>('tutorapp_students', []);
  // Limpieza de cualquier alumno demo residual (Alejandro Montes, Lucía Gómez) si existiera
  if (list.some((s) => s.id === 'stu_alejandro' || s.id === 'stu_lucia' || s.id === 'stu_marcos')) {
    list = list.filter((s) => s.id !== 'stu_alejandro' && s.id !== 'stu_lucia' && s.id !== 'stu_marcos');
    storage.set('tutorapp_students', list);
  }
  if (activeOnly) return list.filter((s) => s.active);
  return list;
};

export const webGetStudentById = async (id: string): Promise<Student | null> => {
  const list = await webGetAllStudents();
  return list.find((s) => s.id === id) || null;
};

export const webGetStudentByAccessCode = async (code: string): Promise<Student | null> => {
  const list = await webGetAllStudents();
  const clean = code.trim().toUpperCase();
  return list.find((s) => s.accessCode?.toUpperCase() === clean) || null;
};

export const webCreateStudent = async (data: StudentFormData): Promise<Student> => {
  const list = await webGetAllStudents();
  const created: Student = {
    ...data,
    id: generateId(),
    accessCode: generateAccessCode(data.firstName),
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
  // 1. Eliminar al alumno
  const list = await webGetAllStudents();
  const filtered = list.filter((s) => s.id !== id);
  storage.set('tutorapp_students', filtered);

  // 2. Eliminar todas sus clases en cascada
  const classes = storage.get<ClassSession[]>('tutorapp_classes', INITIAL_CLASSES);
  storage.set('tutorapp_classes', classes.filter((c) => c.studentId !== id));

  // 3. Eliminar todos sus cobros / pagos en cascada
  const payments = storage.get<Payment[]>('tutorapp_payments', INITIAL_PAYMENTS);
  storage.set('tutorapp_payments', payments.filter((p) => p.studentId !== id));
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
  let list = storage.get<ClassSession[]>('tutorapp_classes', []);
  let modified = false;

  // Limpieza automática de clases demo residuales
  if (list.some((c) => c.studentId === 'stu_alejandro' || c.studentId === 'stu_lucia' || c.studentId === 'stu_marcos')) {
    list = list.filter((c) => c.studentId !== 'stu_alejandro' && c.studentId !== 'stu_lucia' && c.studentId !== 'stu_marcos');
    modified = true;
  }

  // Limpieza automática de clases huérfanas si el alumno fue eliminado
  const students = await webGetAllStudents();
  const studentIds = new Set(students.map((s) => s.id));

  if (list.some((c) => !studentIds.has(c.studentId))) {
    list = list.filter((c) => studentIds.has(c.studentId));
    modified = true;
  }

  // Saneamiento automático de horas y montos
  list.forEach((c) => {
    const duration = c.duration || 60;
    const computedEnd = computeEndTime(c.startTime || '17:00', duration);
    if (!c.endTime || c.endTime <= c.startTime) {
      c.endTime = computedEnd;
      modified = true;
    }
    const expectedTotal = (duration / 60) * (c.rate || 0);
    if (c.totalAmount === undefined || (c.rate && c.totalAmount === 0)) {
      c.totalAmount = expectedTotal;
      modified = true;
    }
  });

  if (modified) {
    storage.set('tutorapp_classes', list);
  }

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
  const startTime = data.startTime || '17:00';
  const endTime = data.endTime && data.endTime > startTime
    ? data.endTime
    : computeEndTime(startTime, duration);
  const totalAmount = (duration / 60) * (data.rate || 0);

  const created: ClassSession = {
    ...data,
    startTime,
    endTime,
    duration,
    id: generateId(),
    totalAmount,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  list.unshift(created);
  storage.set('tutorapp_classes', list);
  return created;
};

export const webCreateClassesBatch = async (
  classesData: ClassSessionFormData[]
): Promise<ClassSession[]> => {
  const list = await webGetAllClasses();
  const now = new Date().toISOString();
  const createdList: ClassSession[] = classesData.map((data) => {
    const duration = data.duration || 60;
    const startTime = data.startTime || '17:00';
    const endTime = data.endTime && data.endTime > startTime
      ? data.endTime
      : computeEndTime(startTime, duration);
    const totalAmount = (duration / 60) * (data.rate || 0);
    return {
      ...data,
      startTime,
      endTime,
      duration,
      id: generateId(),
      totalAmount,
      createdAt: now,
      updatedAt: now,
    };
  });
  list.unshift(...createdList);
  storage.set('tutorapp_classes', list);
  return createdList;
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

  const updatedStartTime = data.startTime !== undefined ? data.startTime : current.startTime;
  let updatedEndTime = data.endTime !== undefined ? data.endTime : current.endTime;
  if (!updatedEndTime || data.startTime !== undefined || data.duration !== undefined) {
    if (!data.endTime || data.endTime <= updatedStartTime) {
      updatedEndTime = computeEndTime(updatedStartTime, updatedDuration);
    }
  }

  list[idx] = {
    ...current,
    ...data,
    startTime: updatedStartTime,
    endTime: updatedEndTime,
    rate: updatedRate,
    duration: updatedDuration,
    totalAmount: updatedTotal,
    updatedAt: new Date().toISOString(),
  };
  storage.set('tutorapp_classes', list);
  return list[idx];
};

export const webCancelClass = async (
  id: string,
  reason: string
): Promise<ClassSession | null> => {
  const payments = await webGetAllPayments();
  const filteredPayments = payments.filter((p) => {
    if (p.classSessionIds && p.classSessionIds.includes(id)) {
      return false;
    }
    return true;
  });
  storage.set('tutorapp_payments', filteredPayments);

  return webUpdateClass(id, {
    status: 'cancelled',
    cancelReason: reason,
    isPaid: false,
  });
};

export const webRescheduleClass = async (
  id: string,
  newDate: string,
  newStartTime: string,
  newEndTime: string,
  newDuration?: number,
  reason?: string
): Promise<ClassSession | null> => {
  const current = await webGetClassById(id);
  if (!current) return null;

  const duration = newDuration ?? current.duration ?? 60;
  const safeEndTime = newEndTime && newEndTime > newStartTime
    ? newEndTime
    : computeEndTime(newStartTime, duration);

  return webUpdateClass(id, {
    date: newDate,
    startTime: newStartTime,
    endTime: safeEndTime,
    duration,
    status: 'scheduled',
    rescheduledFromDate: current.date,
    rescheduledFromTime: current.startTime,
    isRescheduled: true,
    notes: reason
      ? `${current.notes ? current.notes + ' • ' : ''}Reprogramada del ${current.date} (${reason})`
      : current.notes,
  });
};

export const webDeleteClass = async (id: string): Promise<void> => {
  const list = await webGetAllClasses();
  const filtered = list.filter((c) => c.id !== id);
  storage.set('tutorapp_classes', filtered);
};

export const webToggleClassPaid = async (
  id: string,
  method: 'bizum' | 'efectivo' = 'bizum'
): Promise<{ classSession: ClassSession | null; payment?: Payment }> => {
  const list = await webGetAllClasses();
  const idx = list.findIndex((c) => c.id === id);
  if (idx === -1) return { classSession: null };

  const current = list[idx];
  const newPaidStatus = !current.isPaid;
  list[idx] = {
    ...current,
    isPaid: newPaidStatus,
    status: newPaidStatus ? 'completed' : current.status,
    updatedAt: new Date().toISOString(),
  };

  let createdPayment: Payment | undefined;
  const payments = await webGetAllPayments();

  if (newPaidStatus) {
    // Si ya existía un pago pendiente para esta clase, actualizarlo a cobrado
    const existingPending = payments.find(
      (p) => p.classSessionIds.includes(id) && p.status === 'pendiente'
    );
    if (existingPending) {
      existingPending.status = 'cobrado';
      existingPending.method = method;
      existingPending.notes = `Cobrado por ${method}`;
      existingPending.amount = current.totalAmount;
      storage.set('tutorapp_payments', payments);
      list[idx].paymentId = existingPending.id;
      createdPayment = existingPending;
    } else {
      const existingCobrado = payments.find(
        (p) => p.classSessionIds.includes(id) && p.status === 'cobrado'
      );
      if (!existingCobrado) {
        createdPayment = await webCreatePayment({
          studentId: current.studentId,
          amount: current.totalAmount,
          date: current.date,
          method: method,
          concept: `Clase ${current.date} (${current.startTime})`,
          classSessionIds: [id],
          status: 'cobrado',
          notes: `Cobrado por ${method}`,
        });
        list[idx].paymentId = createdPayment.id;
      } else {
        createdPayment = existingCobrado;
        list[idx].paymentId = existingCobrado.id;
      }
    }
  } else {
    // Si se desmarca como pagada, eliminar o desvincular el cobro asociado
    const filteredPayments = payments.filter((p) => {
      if (current.paymentId && p.id === current.paymentId) return false;
      if (p.classSessionIds.includes(id) && p.status === 'cobrado') return false;
      return true;
    });
    storage.set('tutorapp_payments', filteredPayments);
    list[idx].paymentId = undefined;
  }

  storage.set('tutorapp_classes', list);
  return { classSession: list[idx], payment: createdPayment };
};

export const webGenerateMonthClassesForStudent = async (
  studentId: string,
  year: number,
  month: number
): Promise<ClassSession[]> => {
  const student = await webGetStudentById(studentId);
  if (!student) return [];

  // Recoger los horarios específicos por día (o fallback a los días generales)
  let slots: Array<{ day: number; time: string; duration?: number }> = [];
  if (student.scheduleSlots && student.scheduleSlots.length > 0) {
    slots = student.scheduleSlots;
  } else if (student.scheduleDays && student.scheduleDays.length > 0) {
    const defaultTime = student.scheduleTime || '17:00';
    slots = student.scheduleDays.map((d) => ({
      day: d,
      time: defaultTime,
      duration: student.scheduleDuration || 60,
    }));
  }

  if (slots.length === 0) {
    return [];
  }

  let allExisting = await webGetAllClasses();
  const subjects = await webGetAllSubjects();
  const subjectId = student.scheduleSubjectId || (subjects.length > 0 ? subjects[0].id : 'sub_matematicas');

  const defaultDuration = student.scheduleDuration || 60;
  const rate = student.scheduleRate !== undefined ? student.scheduleRate : 15;

  const daysInMonth = new Date(year, month, 0).getDate();
  const newClasses: ClassSessionFormData[] = [];
  const modifiedExisting: ClassSession[] = [];
  const idsToDelete = new Set<string>();

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dateObj = new Date(year, month - 1, day);
    const dayOfWeek = dateObj.getDay() === 0 ? 7 : dateObj.getDay();

    const daySlots = slots.filter((s) => s.day === dayOfWeek);

    if (daySlots.length > 0) {
      const classesOnDay = allExisting.filter(
        (c) => c.studentId === student.id && c.date === dateStr && c.status !== 'cancelled'
      );

      for (let sIdx = 0; sIdx < daySlots.length; sIdx++) {
        const slot = daySlots[sIdx];
        const startTime = slot.time || '17:00';
        const duration = slot.duration || defaultDuration;
        const endTime = computeEndTime(startTime, duration);
        const totalAmount = (duration / 60) * rate;

        if (sIdx < classesOnDay.length) {
          const existingCls = classesOnDay[sIdx];
          if (!existingCls.isPaid) {
            existingCls.startTime = startTime;
            existingCls.endTime = endTime;
            existingCls.duration = duration;
            existingCls.rate = rate;
            existingCls.totalAmount = totalAmount;
            existingCls.updatedAt = new Date().toISOString();
            modifiedExisting.push(existingCls);
          }
        } else {
          newClasses.push({
            studentId: student.id,
            subjectId,
            date: dateStr,
            startTime,
            endTime,
            duration,
            rate,
            status: 'scheduled',
            location: 'presencial',
            notes: 'Clase programada según horario habitual',
            isPaid: false,
          });
        }
      }

      // Eliminar duplicados no pagados en el mismo día
      if (classesOnDay.length > daySlots.length) {
        for (let extra = daySlots.length; extra < classesOnDay.length; extra++) {
          const extraCls = classesOnDay[extra];
          if (!extraCls.isPaid && extraCls.status === 'scheduled') {
            idsToDelete.add(extraCls.id);
          }
        }
      }
    }
  }

  if (idsToDelete.size > 0) {
    allExisting = allExisting.filter((c) => !idsToDelete.has(c.id));
  }

  if (modifiedExisting.length > 0 || idsToDelete.size > 0) {
    storage.set('tutorapp_classes', allExisting);
  }

  if (newClasses.length > 0) {
    const created = await webCreateClassesBatch(newClasses);
    return [...modifiedExisting, ...created];
  }

  return modifiedExisting;
};

export const webGetAllPayments = async (filter?: PaymentFilter): Promise<Payment[]> => {
  let list = storage.get<Payment[]>('tutorapp_payments', []);

  // Limpieza automática de cobros de alumnos demo
  if (list.some((p) => p.studentId === 'stu_alejandro' || p.studentId === 'stu_lucia' || p.studentId === 'stu_marcos')) {
    list = list.filter((p) => p.studentId !== 'stu_alejandro' && p.studentId !== 'stu_lucia' && p.studentId !== 'stu_marcos');
    storage.set('tutorapp_payments', list);
  }

  // Limpieza automática de cobros huérfanos si el alumno fue eliminado
  const students = await webGetAllStudents();
  const studentIds = new Set(students.map((s) => s.id));
  if (list.some((p) => !studentIds.has(p.studentId))) {
    list = list.filter((p) => studentIds.has(p.studentId));
    storage.set('tutorapp_payments', list);
  }

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

  // Sincronizar automáticamente con las clases del alumno
  const classesList = await webGetAllClasses();
  let classesModified = false;

  if (created.status === 'cobrado') {
    if (created.classSessionIds && created.classSessionIds.length > 0) {
      classesList.forEach((c) => {
        if (created.classSessionIds.includes(c.id)) {
          c.isPaid = true;
          c.paymentId = created.id;
          c.status = 'completed';
          c.updatedAt = new Date().toISOString();
          classesModified = true;
        }
      });
    } else {
      // Auto-asociar clases pendientes más antiguas de este alumno hasta cubrir el importe
      let remaining = created.amount;
      const unpaid = classesList
        .filter((c) => c.studentId === created.studentId && !c.isPaid && c.status !== 'cancelled')
        .sort((a, b) => a.date.localeCompare(b.date));

      const matchedIds: string[] = [];
      for (const cls of unpaid) {
        if (remaining <= 0) break;
        cls.isPaid = true;
        cls.paymentId = created.id;
        cls.status = 'completed';
        cls.updatedAt = new Date().toISOString();
        matchedIds.push(cls.id);
        remaining -= cls.totalAmount;
        classesModified = true;
      }
      if (matchedIds.length > 0) {
        created.classSessionIds = matchedIds;
      }
    }
  }

  list.unshift(created);
  storage.set('tutorapp_payments', list);
  if (classesModified) {
    storage.set('tutorapp_classes', classesList);
  }
  return created;
};

export const webUpdatePayment = async (
  id: string,
  data: Partial<PaymentFormData>
): Promise<Payment | null> => {
  const list = await webGetAllPayments();
  const idx = list.findIndex((p) => p.id === id);
  if (idx === -1) return null;

  const prevPayment = list[idx];
  const updatedPayment: Payment = { ...prevPayment, ...data };
  list[idx] = updatedPayment;

  // Sincronizar estado de las clases
  const classesList = await webGetAllClasses();
  let classesModified = false;

  if (data.status !== undefined && data.status !== prevPayment.status) {
    if (data.status === 'cobrado') {
      if (updatedPayment.classSessionIds && updatedPayment.classSessionIds.length > 0) {
        classesList.forEach((c) => {
          if (updatedPayment.classSessionIds.includes(c.id)) {
            c.isPaid = true;
            c.paymentId = id;
            c.status = 'completed';
            c.updatedAt = new Date().toISOString();
            classesModified = true;
          }
        });
      } else {
        let remaining = updatedPayment.amount;
        const unpaid = classesList
          .filter((c) => c.studentId === updatedPayment.studentId && !c.isPaid && c.status !== 'cancelled')
          .sort((a, b) => a.date.localeCompare(b.date));
        const matchedIds: string[] = [];
        for (const cls of unpaid) {
          if (remaining <= 0) break;
          cls.isPaid = true;
          cls.paymentId = id;
          cls.status = 'completed';
          cls.updatedAt = new Date().toISOString();
          matchedIds.push(cls.id);
          remaining -= cls.totalAmount;
          classesModified = true;
        }
        if (matchedIds.length > 0) {
          updatedPayment.classSessionIds = matchedIds;
          list[idx].classSessionIds = matchedIds;
        }
      }
    } else {
      // Si pasa a pendiente o cancelado, desmarcar de pagado en las clases
      classesList.forEach((c) => {
        if (c.paymentId === id || (updatedPayment.classSessionIds && updatedPayment.classSessionIds.includes(c.id))) {
          c.isPaid = false;
          c.paymentId = undefined;
          c.updatedAt = new Date().toISOString();
          classesModified = true;
        }
      });
    }
  }

  storage.set('tutorapp_payments', list);
  if (classesModified) {
    storage.set('tutorapp_classes', classesList);
  }

  return updatedPayment;
};

export const webDeletePayment = async (id: string): Promise<void> => {
  const list = await webGetAllPayments();
  const paymentToDelete = list.find((p) => p.id === id);
  const filtered = list.filter((p) => p.id !== id);
  storage.set('tutorapp_payments', filtered);

  // Desvincular de las clases asociadas
  const classesList = await webGetAllClasses();
  let classesModified = false;
  classesList.forEach((c) => {
    if (c.paymentId === id || (paymentToDelete?.classSessionIds && paymentToDelete.classSessionIds.includes(c.id))) {
      c.isPaid = false;
      c.paymentId = undefined;
      c.updatedAt = new Date().toISOString();
      classesModified = true;
    }
  });

  if (classesModified) {
    storage.set('tutorapp_classes', classesList);
  }
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
  const currentTodayStr = getTodayString();
  const currentMonth = currentTodayStr.substring(0, 7);

  const classesThisMonth = classes.filter(
    (c) => c.date.startsWith(currentMonth) && c.status !== 'cancelled' && !c.cancelReason
  ).length;

  // Ingresos reales cobrados este mes (de clases pagadas + cobros sueltos)
  const paidClassesThisMonth = classes.filter(
    (c) => c.isPaid && c.status !== 'cancelled' && !c.cancelReason && c.date.startsWith(currentMonth)
  );
  const paidClassesAmount = paidClassesThisMonth.reduce((sum, c) => sum + c.totalAmount, 0);

  const standalonePaymentsThisMonth = payments.filter(
    (p) =>
      p.status === 'cobrado' &&
      p.date.startsWith(currentMonth) &&
      (!p.classSessionIds || p.classSessionIds.length === 0)
  );
  const totalIncomeThisMonth = paidClassesAmount + standalonePaymentsThisMonth.reduce((sum, p) => sum + p.amount, 0);

  // Clases dadas reales no pagadas (a deber por el alumno)
  // Las clases futuras programadas NO se consideran a deber, pero pueden cobrarse por adelantado
  const owedClasses = classes.filter(
    (c) => !c.isPaid && isClassGiven(c, currentTodayStr)
  );
  const pendingPaymentAmount = owedClasses.reduce((sum, c) => sum + c.totalAmount, 0);
  const pendingPayments = owedClasses.length;

  const upcomingClasses = classes
    .filter((c) => c.status === 'scheduled')
    .slice(0, 5);

  const recentPayments = payments.filter((p) => p.status === 'cobrado').slice(0, 5);

  // Evolución mensual REAL: partir del primer mes con actividad (no inventar meses previos a octubre)
  const activityMonths = new Set<string>();
  classes.forEach((c) => {
    if (c.date) activityMonths.add(c.date.substring(0, 7));
  });
  payments.forEach((p) => {
    if (p.date) activityMonths.add(p.date.substring(0, 7));
  });
  activityMonths.add(currentMonth);

  const sortedMonths = Array.from(activityMonths).sort();
  // El primer mes con clases/cobros
  const startMonthStr = sortedMonths[0] || currentMonth;

  const monthlyIncome: { month: string; amount: number }[] = [];
  const [startYear, startM] = startMonthStr.split('-').map(Number);
  const [endYear, endM] = currentMonth.split('-').map(Number);

  let y = startYear;
  let m = startM;
  while (y < endYear || (y === endYear && m <= endM)) {
    const mStr = `${y}-${String(m).padStart(2, '0')}`;
    const mPaidClasses = classes.filter(
      (c) => c.isPaid && c.status !== 'cancelled' && !c.cancelReason && c.date.startsWith(mStr)
    );
    const mClassesTotal = mPaidClasses.reduce((sum, c) => sum + c.totalAmount, 0);

    const mStandalone = payments.filter(
      (p) =>
        p.status === 'cobrado' &&
        p.date.startsWith(mStr) &&
        (!p.classSessionIds || p.classSessionIds.length === 0)
    );
    const mPaymentsTotal = mStandalone.reduce((sum, p) => sum + p.amount, 0);

    monthlyIncome.push({
      month: mStr,
      amount: mClassesTotal + mPaymentsTotal,
    });

    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }

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
  const currentTodayStr = getTodayString();

  return students.map((student) => {
    const studentClasses = classes.filter(
      (c) => c.studentId === student.id && c.status !== 'cancelled' && !c.cancelReason
    );

    // Clases ya impartidas
    const givenClasses = studentClasses.filter((c) => isClassGiven(c, currentTodayStr));
    const totalCharged = givenClasses.reduce((sum, c) => sum + c.totalAmount, 0);

    // Solo se debe el importe de las clases dadas no pagadas
    const unpaidGivenClasses = givenClasses.filter((c) => !c.isPaid);
    const balance = unpaidGivenClasses.reduce((sum, c) => sum + c.totalAmount, 0);

    // Total pagado por el alumno (incluye posibles pagos por adelantado de clases futuras)
    const paidClasses = studentClasses.filter((c) => c.isPaid);
    const totalPaid = paidClasses.reduce((sum, c) => sum + c.totalAmount, 0);

    return {
      student,
      totalCharged: Math.max(totalCharged, totalPaid),
      totalPaid,
      balance,
    };
  });
};

export const webGetMonthlyIncome = async (
  monthsCount: number = 6
): Promise<{ month: string; amount: number }[]> => {
  const stats = await webGetDashboardStats();
  return stats.monthlyIncome.slice(-monthsCount);
};

export const webExportData = async (): Promise<any> => {
  return {
    exportDate: new Date().toISOString(),
    version: '1.2.0',
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
