import { UserRole } from '../types';

export interface NavItem {
  label: string;
  path: string;
  roles: UserRole[];
  icon: string;
  isMain?: boolean; // Determines if it goes to the top/bottom direct bar or sub-menu
}

export const navItems: NavItem[] = [
  // Common Main
  { label: 'Dashboard', path: '/dashboard', roles: [UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN], icon: 'dashboard', isMain: true },
  
  // Student & Teacher Main
  { label: 'Mis Grupos', path: '/admin/groups', roles: [UserRole.STUDENT, UserRole.TEACHER], icon: 'groups', isMain: true },
  
  // Student Specific
  { label: 'Calificaciones', path: '/student/enrollments', roles: [UserRole.STUDENT], icon: 'auto_stories', isMain: true },
  { label: 'Solicitar Examen', path: '/student/english/request-exam', roles: [UserRole.STUDENT], icon: 'edit_document', isMain: false },
  { label: 'Solicitar Curso', path: '/student/english/request-course', roles: [UserRole.STUDENT], icon: 'library_books', isMain: false },
  
  // Teacher Specific
  { label: 'Gestión Calificaciones', path: '/teacher/grades', roles: [UserRole.TEACHER], icon: 'grading', isMain: false },

  // Admin Main
  { label: 'Materias', path: '/admin/subjects', roles: [UserRole.ADMIN], icon: 'auto_stories', isMain: true },
  { label: 'Grupos', path: '/admin/groups', roles: [UserRole.ADMIN], icon: 'groups', isMain: true },
  
  // Admin Sub-menus
  { label: 'Estudiantes', path: '/admin/students', roles: [UserRole.ADMIN], icon: 'school', isMain: false },
  { label: 'Maestros', path: '/admin/teachers', roles: [UserRole.ADMIN], icon: 'person', isMain: false },
  { label: 'Inscripciones', path: '/admin/enrollments', roles: [UserRole.ADMIN], icon: 'list_alt', isMain: false },
  { label: 'Cursos Especiales', path: '/admin/special-courses', roles: [UserRole.ADMIN], icon: 'star', isMain: false },
  { label: 'Periodos de Examen', path: '/admin/exam-periods', roles: [UserRole.ADMIN], icon: 'event', isMain: false },
  { label: 'Exámenes', path: '/admin/exams', roles: [UserRole.ADMIN], icon: 'quiz', isMain: false },
  { label: 'Aprobaciones Inglés', path: '/admin/english/payment-approvals', roles: [UserRole.ADMIN], icon: 'payments', isMain: false },
];
