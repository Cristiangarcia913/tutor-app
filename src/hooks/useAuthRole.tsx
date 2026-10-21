// =============================================================================
// TutorApp - Authentication & Role Context
// Gestiona los 3 roles: Profesor, Estudiante y Padre
// =============================================================================

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { AppRole, Student } from '../types';
import { useDatabase } from './useDatabase';

interface AuthRoleContextType {
  role: AppRole;
  activeStudent: Student | null;
  activeStudentId: string | null;
  isTeacher: boolean;
  isStudent: boolean;
  isParent: boolean;
  loginAsTeacher: () => void;
  loginWithCode: (code: string, targetRole: 'estudiante' | 'padre') => Promise<{ success: boolean; message?: string }>;
  switchRole: (newRole: AppRole, studentId?: string) => Promise<void>;
  logout: () => void;
}

const AuthRoleContext = createContext<AuthRoleContextType | null>(null);

const STORAGE_ROLE_KEY = 'tutorapp_active_role';
const STORAGE_STUDENT_ID_KEY = 'tutorapp_active_student_id';

export function AuthRoleProvider({ children }: { children: ReactNode }) {
  const db = useDatabase();
  const [role, setRole] = useState<AppRole>('profesor');
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);

  // Cargar estado inicial
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const savedRole = window.localStorage.getItem(STORAGE_ROLE_KEY) as AppRole | null;
        const savedStudentId = window.localStorage.getItem(STORAGE_STUDENT_ID_KEY);
        if (savedRole) setRole(savedRole);
        if (savedStudentId) setActiveStudentId(savedStudentId);
      }
    } catch {
      // Ignorar fallback
    }
  }, []);

  // Cargar información del alumno activo cuando cambia el ID
  useEffect(() => {
    async function fetchStudent() {
      if (activeStudentId && db.isReady) {
        try {
          const s = await db.getStudent(activeStudentId);
          setActiveStudent(s);
        } catch (e) {
          console.error('Error fetching student for role:', e);
        }
      } else {
        setActiveStudent(null);
      }
    }
    fetchStudent();
  }, [activeStudentId, db]);

  const loginAsTeacher = () => {
    setRole('profesor');
    setActiveStudentId(null);
    setActiveStudent(null);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_ROLE_KEY, 'profesor');
        window.localStorage.removeItem(STORAGE_STUDENT_ID_KEY);
      }
    } catch {}
  };

  const loginWithCode = async (
    code: string,
    targetRole: 'estudiante' | 'padre'
  ): Promise<{ success: boolean; message?: string }> => {
    if (!code.trim()) {
      return { success: false, message: 'Por favor introduce el código de acceso' };
    }

    try {
      const student = await db.getStudentByAccessCode(code);
      if (!student) {
        return {
          success: false,
          message: 'Código de acceso no válido. El profesor debe dar de alta al alumno primero.',
        };
      }

      setRole(targetRole);
      setActiveStudentId(student.id);
      setActiveStudent(student);

      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(STORAGE_ROLE_KEY, targetRole);
          window.localStorage.setItem(STORAGE_STUDENT_ID_KEY, student.id);
        }
      } catch {}

      return { success: true };
    } catch (e) {
      console.error('Error during login with code:', e);
      return { success: false, message: 'Ocurrió un error al validar el código' };
    }
  };

  const switchRole = async (newRole: AppRole, studentId?: string) => {
    setRole(newRole);
    let targetSid = studentId || null;

    // Si cambiamos a estudiante o padre y no hay ID, cogemos el primer alumno disponible
    if (newRole !== 'profesor' && !targetSid) {
      const list = await db.loadStudents(true);
      if (list.length > 0) {
        targetSid = list[0].id;
      }
    }

    setActiveStudentId(targetSid);
    if (targetSid) {
      const s = await db.getStudent(targetSid);
      setActiveStudent(s);
    } else {
      setActiveStudent(null);
    }

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_ROLE_KEY, newRole);
        if (targetSid) {
          window.localStorage.setItem(STORAGE_STUDENT_ID_KEY, targetSid);
        } else {
          window.localStorage.removeItem(STORAGE_STUDENT_ID_KEY);
        }
      }
    } catch {}
  };

  const logout = () => {
    loginAsTeacher();
  };

  return (
    <AuthRoleContext.Provider
      value={{
        role,
        activeStudent,
        activeStudentId,
        isTeacher: role === 'profesor',
        isStudent: role === 'estudiante',
        isParent: role === 'padre',
        loginAsTeacher,
        loginWithCode,
        switchRole,
        logout,
      }}
    >
      {children}
    </AuthRoleContext.Provider>
  );
}

export function useAuthRole(): AuthRoleContextType {
  const context = useContext(AuthRoleContext);
  if (!context) {
    throw new Error('useAuthRole must be used within an AuthRoleProvider');
  }
  return context;
}
