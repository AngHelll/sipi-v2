// Type definitions for the frontend application

export const UserRole = {
  STUDENT: 'STUDENT',
  TEACHER: 'TEACHER',
  ADMIN: 'ADMIN',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export type User = {
  id: string;
  username: string;
  role: UserRole;
};

export type AuthResponse = {
  message: string;
  user: User;
};

export type LoginCredentials = {
  username: string;
  password: string;
};

// Search types
export type SearchResultItem = {
  type: 'student' | 'teacher' | 'subject' | 'group';
  id: string;
  title: string;
  subtitle?: string;
  metadata?: Record<string, unknown>;
};

export type SearchResponse = {
  results: SearchResultItem[];
  total: number;
  query: string;
};

// Student types
export type Student = {
  id: string;
  userId: string;
  matricula: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  carrera: string;
  semestre: number;
  estatus: string;
  curp?: string;
};

export type StudentsListResponse = {
  students: Student[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

// Teacher types
export type Teacher = {
  id: string;
  userId: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  departamento: string;
};

export type TeachersListResponse = {
  teachers: Teacher[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

// Subject types
export type Subject = {
  id: string;
  clave: string;
  nombre: string;
  creditos: number;
};

export type SubjectsListResponse = {
  subjects: Subject[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

// Group types
export type GroupSubject = {
  id: string;
  clave: string;
  nombre: string;
  creditos: number;
};

export type GroupTeacher = {
  id: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  departamento: string;
};

export type Group = {
  id: string;
  subjectId: string;
  teacherId: string;
  nombre: string;
  periodo: string;
  subject?: GroupSubject;
  teacher?: GroupTeacher;
};

export type GroupsListResponse = {
  groups: Group[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

// Enrollment types
export type EnrollmentStudent = {
  id: string;
  matricula: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  carrera: string;
  semestre: number;
  estatus: string;
};

export type EnrollmentGroup = {
  id: string;
  nombre: string;
  periodo: string;
  subject: GroupSubject;
  teacher: GroupTeacher;
};

export type Enrollment = {
  id: string;
  studentId: string;
  groupId: string;
  calificacion: number | null;
  student?: EnrollmentStudent;
  group?: EnrollmentGroup;
};

export type EnrollmentsListResponse = {
  enrollments: Enrollment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
