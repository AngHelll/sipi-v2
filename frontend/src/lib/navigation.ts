import { UserRole } from '../types';

export interface NavItem {
  label: string;
  path: string;
  roles: UserRole[];
  icon: string;
  isMain?: boolean; // Determines if it goes to the top/bottom direct bar or sub-menu
  /** Agrupa el ítem bajo un encabezado en el sidebar. Sin sección = bloque superior. */
  section?: string;
}

export const navItems: NavItem[] = [
  // Common Main
  { label: 'Dashboard', path: '/dashboard', roles: [UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN], icon: 'dashboard', isMain: true },
  
  // Teacher Main
  { label: 'Mis Grupos', path: '/admin/groups', roles: [UserRole.TEACHER], icon: 'groups', isMain: true },
  
  // Student Specific — el alumno se centra en el producto (inglés). Las
  // calificaciones de materias regulares (SIS) quedan fuera de alcance por ahora.
  // El flujo de inglés vive en "Mi Inglés" (hub único): las solicitudes de
  // examen/curso se piden desde ahí según elegibilidad.
  { label: 'Mi Inglés', path: '/student/english/status', roles: [UserRole.STUDENT], icon: 'translate', isMain: true },
  
  // Teacher Specific
  { label: 'Gestión Calificaciones', path: '/teacher/grades', roles: [UserRole.TEACHER], icon: 'grading', isMain: false },

  // Admin — General (SIS de soporte)
  { label: 'Materias', path: '/admin/subjects', roles: [UserRole.ADMIN], icon: 'auto_stories', isMain: true, section: 'General' },
  { label: 'Grupos', path: '/admin/groups', roles: [UserRole.ADMIN], icon: 'groups', isMain: true, section: 'General' },
  { label: 'Estudiantes', path: '/admin/students', roles: [UserRole.ADMIN], icon: 'school', isMain: false, section: 'General' },
  { label: 'Maestros', path: '/admin/teachers', roles: [UserRole.ADMIN], icon: 'person', isMain: false, section: 'General' },
  { label: 'Inscripciones', path: '/admin/enrollments', roles: [UserRole.ADMIN], icon: 'list_alt', isMain: false, section: 'General' },

  // Admin — SIPI Inglés (el producto)
  { label: 'Cursos de inglés', path: '/admin/special-courses', roles: [UserRole.ADMIN], icon: 'library_books', isMain: false, section: 'SIPI Inglés' },
  { label: 'Periodos de diagnóstico', path: '/admin/exam-periods', roles: [UserRole.ADMIN], icon: 'event', isMain: false, section: 'SIPI Inglés' },
  { label: 'Exámenes de diagnóstico', path: '/admin/exams', roles: [UserRole.ADMIN], icon: 'quiz', isMain: false, section: 'SIPI Inglés' },
  { label: 'Aprobaciones de pago', path: '/admin/english/payment-approvals', roles: [UserRole.ADMIN], icon: 'payments', isMain: false, section: 'SIPI Inglés' },
];
