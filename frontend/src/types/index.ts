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
  carreraId?: string; // NUEVO - Relación normalizada con Career
  semestre: number;
  estatus: string;
  curp?: string;
  
  // NUEVOS CAMPOS (Fase 1, 4) - Contacto e información personal
  email?: string;
  telefono?: string;
  telefonoEmergencia?: string;
  fechaNacimiento?: string;
  genero?: 'MASCULINO' | 'FEMENINO' | 'OTRO' | 'PREFIERO_NO_DECIR';
  nacionalidad?: string;
  lugarNacimiento?: string;
  direccion?: string;
  ciudad?: string;
  estado?: string;
  codigoPostal?: string;
  pais?: string;
  tipoIngreso?: 'NUEVO_INGRESO' | 'REINGRESO' | 'TRANSFERENCIA' | 'EQUIVALENCIA';
  fechaIngreso?: string;
  fechaEgreso?: string;
  promedioGeneral?: number;
  promedioIngles?: number; // RB-037: Promedio de inglés (independiente del promedio general)
  creditosCursados?: number;
  creditosAprobados?: number;
  creditosTotales?: number;
  beca?: boolean;
  tipoBeca?: string;
  observaciones?: string;
  // RB-038: Información de inglés del estudiante
  nivelInglesActual?: number;
  nivelInglesCertificado?: number;
  fechaExamenDiagnostico?: string;
  porcentajeIngles?: number;
  cumpleRequisitoIngles?: boolean;
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
  
  // NUEVOS CAMPOS (Fase 1, 4) - Información de contacto
  email?: string;
  telefono?: string;
  
  // NUEVOS CAMPOS (Fase 4) - Información personal
  fechaNacimiento?: string;
  genero?: 'MASCULINO' | 'FEMENINO' | 'OTRO' | 'PREFIERO_NO_DECIR';
  nacionalidad?: string;
  direccion?: string;
  ciudad?: string;
  estado?: string;
  codigoPostal?: string;
  pais?: string;
  
  // NUEVOS CAMPOS (Fase 1, 4) - Información académica y laboral
  gradoAcademico?: string;
  especialidad?: string;
  cedulaProfesional?: string;
  universidad?: string;
  tipoContrato?: 'TIEMPO_COMPLETO' | 'MEDIO_TIEMPO' | 'POR_HONORARIOS' | 'INTERINO';
  fechaContratacion?: string;
  estatus?: 'ACTIVO' | 'INACTIVO' | 'JUBILADO' | 'LICENCIA';
  salario?: number;
  gruposAsignados?: number;
  estudiantesTotal?: number;
  observaciones?: string;
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

// Subject types (basic definition - extended below)
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
  
  // NUEVOS CAMPOS (Fase 2) - Gestión de cupos y horarios
  codigo?: string; // Código único del grupo
  cupoMaximo?: number;
  cupoMinimo?: number;
  cupoActual?: number;
  horario?: string;
  aula?: string;
  edificio?: string;
  modalidad?: 'PRESENCIAL' | 'VIRTUAL' | 'HIBRIDO' | 'SEMIPRESENCIAL';
  estatus?: 'ABIERTO' | 'CERRADO' | 'CANCELADO' | 'EN_CURSO' | 'FINALIZADO';
  periodoId?: string; // Relación con AcademicPeriod
  fechaInicio?: string;
  fechaFin?: string;
  
  // Campos para cursos de inglés
  nivelIngles?: number;
  fechaInscripcionInicio?: string;
  fechaInscripcionFin?: string;
  esCursoIngles?: boolean;
  
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
  codigo?: string;
  cupoMaximo?: number;
  cupoActual?: number;
  modalidad?: string;
  estatus?: string;
  subject: GroupSubject;
  teacher: GroupTeacher;
};

export type Enrollment = {
  id: string;
  studentId: string;
  groupId: string;
  calificacion: number | null;
  
  // NUEVOS CAMPOS (Fase 2) - Seguimiento detallado
  codigo?: string;
  fechaInscripcion?: string;
  fechaBaja?: string;
  tipoInscripcion?: 'NORMAL' | 'ESPECIAL' | 'REPETICION' | 'EQUIVALENCIA' | 'EXAMEN_DIAGNOSTICO' | 'CURSO_INGLES';
  estatus?: 'INSCRITO' | 'EN_CURSO' | 'BAJA' | 'APROBADO' | 'REPROBADO' | 'CANCELADO' | 'PENDIENTE_PAGO' | 'PAGO_PENDIENTE_APROBACION' | 'PAGO_APROBADO';
  calificacionParcial1?: number;
  calificacionParcial2?: number;
  calificacionParcial3?: number;
  calificacionFinal?: number;
  calificacionExtra?: number;
  asistencias?: number;
  faltas?: number;
  retardos?: number;
  porcentajeAsistencia?: number;
  aprobado?: boolean;
  fechaAprobacion?: string;
  observaciones?: string;
  // RB-038: Campos específicos para inglés
  nivelIngles?: number | null;
  esExamenDiagnostico?: boolean;
  requierePago?: boolean;
  pagoAprobado?: boolean | null;
  fechaPagoAprobado?: string;
  montoPago?: number | null;
  comprobantePago?: string | null;
  
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

// ============================================
// V2: Academic Activities Types
// ============================================

export type ActivityType = 'ENROLLMENT' | 'EXAM' | 'SPECIAL_COURSE' | 'SOCIAL_SERVICE' | 'PROFESSIONAL_PRACTICE';

export type ActivityStatus = 
  | 'INSCRITO' 
  | 'EN_CURSO' 
  | 'BAJA' 
  | 'APROBADO' 
  | 'REPROBADO' 
  | 'CANCELADO' 
  | 'PENDIENTE_PAGO' 
  | 'PAGO_PENDIENTE_APROBACION' 
  | 'PAGO_APROBADO' 
  | 'COMPLETADO' 
  | 'EN_REVISION';

export type ExamType = 
  | 'DIAGNOSTICO' 
  | 'ADMISION' 
  | 'CERTIFICACION' 
  | 'EXTRAORDINARIO' 
  | 'REGULAR' 
  | 'RECUPERACION' 
  | 'TITULACION';

export type SpecialCourseType = 
  | 'INGLES' 
  | 'VERANO' 
  | 'EXTRACURRICULAR' 
  | 'TALLER' 
  | 'SEMINARIO' 
  | 'DIPLOMADO' 
  | 'CERTIFICACION';

// Base Academic Activity
export type AcademicActivity = {
  id: string;
  studentId: string;
  activityType: ActivityType;
  codigo: string;
  estatus: ActivityStatus;
  fechaInscripcion: string;
  fechaBaja?: string;
  observaciones?: string;
  createdAt: string;
  updatedAt: string;
};

// Exam Activity
export type Exam = {
  id: string;
  activityId: string;
  examType: ExamType;
  subjectId?: string;
  nivelIngles?: number;
  periodId?: string; // Relación con período de exámenes
  resultado?: number;
  fechaExamen?: string;
  fechaResultado?: string;
  requierePago: boolean;
  pagoAprobado?: boolean;
  fechaPagoAprobado?: string;
  montoPago?: number;
  comprobantePago?: string;
  subject?: {
    id: string;
    clave: string;
    nombre: string;
  };
};

export type ExamActivity = AcademicActivity & {
  exam: Exam;
};

// Special Course Activity
export type SpecialCourse = {
  id: string;
  activityId: string;
  courseType: SpecialCourseType;
  nivelIngles?: number;
  groupId?: string;
  calificacion?: number;
  aprobado?: boolean;
  fechaAprobacion?: string;
  requierePago: boolean;
  pagoAprobado?: boolean;
  fechaPagoAprobado?: string;
  montoPago?: number;
  comprobantePago?: string;
  group?: {
    id: string;
    nombre: string;
    codigo: string;
    subject?: {
      id: string;
      clave: string;
      nombre: string;
    };
  };
};

export type SpecialCourseActivity = AcademicActivity & {
  specialCourse: SpecialCourse;
};

// Exam Period Types
export type ExamPeriodStatus = 'PLANEADO' | 'ABIERTO' | 'CERRADO' | 'EN_PROCESO' | 'FINALIZADO';

export type ExamPeriod = {
  id: string;
  nombre: string;
  descripcion?: string;
  fechaInicio: string;
  fechaFin: string;
  fechaInscripcionInicio: string;
  fechaInscripcionFin: string;
  cupoMaximo: number;
  cupoActual: number;
  estatus: ExamPeriodStatus;
  requierePago: boolean;
  montoPago?: number;
  observaciones?: string;
  createdAt: string;
  updatedAt: string;
};

export type AvailableExamPeriod = ExamPeriod & {
  cuposDisponibles: number;
  estaDisponible: boolean;
};

export type ExamPeriodsListResponse = {
  periods: ExamPeriod[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type CreateExamPeriodRequest = {
  nombre: string;
  descripcion?: string;
  fechaInicio: string;
  fechaFin: string;
  fechaInscripcionInicio: string;
  fechaInscripcionFin: string;
  cupoMaximo?: number;
  requierePago?: boolean;
  montoPago?: number;
  observaciones?: string;
};

export type UpdateExamPeriodRequest = {
  nombre?: string;
  descripcion?: string;
  fechaInicio?: string;
  fechaFin?: string;
  fechaInscripcionInicio?: string;
  fechaInscripcionFin?: string;
  cupoMaximo?: number;
  estatus?: ExamPeriodStatus;
  requierePago?: boolean;
  montoPago?: number;
  observaciones?: string;
};

// Request/Response DTOs
export type CreateExamRequest = {
  examType: ExamType;
  subjectId?: string;
  nivelIngles?: number;
  periodId?: string; // Opcional: asociar a un período
};

export type ProcessExamResultRequest = {
  resultado: number;
  nivelIngles?: number; // Final level (1-6) where student will be positioned
  calificacionesPorNivel?: Record<number, number>; // Grades for each level that will be completed (level -> grade)
};

export type CreateSpecialCourseRequest = {
  courseType: SpecialCourseType;
  nivelIngles?: number;
  groupId?: string;
  requierePago?: boolean;
};

export type SubmitPaymentRequest = {
  montoPago: number;
  comprobantePago: string;
};

export type RejectPaymentRequest = {
  motivo: string;
};

export type CompleteCourseRequest = {
  calificacion: number;
};

// NUEVOS TIPOS (Fase 3, 5)
export type Career = {
  id: string;
  codigo: string;
  nombre: string;
  nombreCorto?: string;
  area?: string;
  duracionSemestres: number;
  creditosTotales?: number;
  estatus: string;
};

export type AcademicPeriod = {
  id: string;
  codigo: string;
  nombre: string;
  tipo: 'SEMESTRAL' | 'TRIMESTRAL' | 'CUATRIMESTRAL' | 'ANUAL';
  fechaInicio: string;
  fechaFin: string;
  fechaInscripcionInicio?: string;
  fechaInscripcionFin?: string;
  estatus: 'PLANEADO' | 'INSCRIPCIONES' | 'EN_CURSO' | 'FINALIZADO' | 'CERRADO';
};

export type Subject = {
  id: string;
  clave: string;
  nombre: string;
  creditos: number;
  tipo?: 'OBLIGATORIA' | 'OPTATIVA' | 'ELECTIVA' | 'SERVICIO_SOCIAL';
  estatus?: 'ACTIVA' | 'INACTIVA' | 'DESCONTINUADA' | 'EN_REVISION';
  nivel?: number;
  horasTeoria?: number;
  horasPractica?: number;
  horasLaboratorio?: number;
  carreraId?: string;
};

export type StudentDocument = {
  id: string;
  studentId: string;
  tipo: 'ACTA_NACIMIENTO' | 'CURP' | 'CERTIFICADO_PREPARATORIA' | 'FOTOGRAFIA' | 'COMPROBANTE_DOMICILIO' | 'CARTA_NO_ADECUDO' | 'CERTIFICADO_MEDICO' | 'OTRO';
  nombre: string;
  estatus: 'PENDIENTE' | 'EN_REVISION' | 'APROBADO' | 'RECHAZADO' | 'VENCIDO';
  archivoUrl?: string;
  fechaVencimiento?: string;
  fechaAprobacion?: string;
};
