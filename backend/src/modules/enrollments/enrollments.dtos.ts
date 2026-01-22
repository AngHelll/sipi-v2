// DTOs (Data Transfer Objects) for Enrollments module
// Request and response type definitions

/**
 * Request body for POST /api/enrollments
 * Creates a new enrollment (student enrollment in a group)
 */
export interface CreateEnrollmentDto {
  studentId: string;
  groupId: string;
  calificacion?: number; // Optional, can be set later by teacher
  // New fields (Phase 2) - all optional with defaults
  tipoInscripcion?: 'NORMAL' | 'ESPECIAL' | 'REPETICION' | 'EQUIVALENCIA' | 'EXAMEN_DIAGNOSTICO' | 'CURSO_INGLES';
  estatus?: 'INSCRITO' | 'EN_CURSO' | 'BAJA' | 'APROBADO' | 'REPROBADO' | 'CANCELADO' | 'PENDIENTE_PAGO' | 'PAGO_PENDIENTE_APROBACION' | 'PAGO_APROBADO';
  // RB-038: English enrollment fields
  nivelIngles?: number;
  esExamenDiagnostico?: boolean;
  requierePago?: boolean;
  montoPago?: number;
  comprobantePago?: string;
  // Note: academicPeriodId is not in enrollments model - access via groups.periodoId if needed
  // Partial grades
  calificacionParcial1?: number;
  calificacionParcial2?: number;
  calificacionParcial3?: number;
  calificacionFinal?: number;
  calificacionExtra?: number;
  // Attendance
  asistencias?: number;
  faltas?: number;
  retardos?: number;
  porcentajeAsistencia?: number;
  // Evaluation
  aprobado?: boolean;
  fechaAprobacion?: string; // ISO date string
  observaciones?: string;
}

/**
 * Request body for PUT /api/enrollments/:id
 * TEACHER can only update calificacion and attendance
 * ADMIN can update all fields
 */
export interface UpdateEnrollmentDto {
  calificacion?: number;
  studentId?: string; // Only ADMIN
  groupId?: string; // Only ADMIN
  // New fields (Phase 2)
  tipoInscripcion?: 'NORMAL' | 'ESPECIAL' | 'REPETICION' | 'EQUIVALENCIA' | 'EXAMEN_DIAGNOSTICO' | 'CURSO_INGLES';
  estatus?: 'INSCRITO' | 'EN_CURSO' | 'BAJA' | 'APROBADO' | 'REPROBADO' | 'CANCELADO' | 'PENDIENTE_PAGO' | 'PAGO_PENDIENTE_APROBACION' | 'PAGO_APROBADO';
  // RB-038: English enrollment fields
  nivelIngles?: number;
  esExamenDiagnostico?: boolean;
  requierePago?: boolean;
  pagoAprobado?: boolean;
  montoPago?: number;
  comprobantePago?: string;
  fechaBaja?: string; // ISO date string
  // Partial grades
  calificacionParcial1?: number;
  calificacionParcial2?: number;
  calificacionParcial3?: number;
  calificacionFinal?: number;
  calificacionExtra?: number;
  // Attendance
  asistencias?: number;
  faltas?: number;
  retardos?: number;
  porcentajeAsistencia?: number;
  // Evaluation
  aprobado?: boolean;
  fechaAprobacion?: string; // ISO date string
  observaciones?: string;
}

/**
 * Student information in enrollment response
 */
export interface EnrollmentStudentDto {
  id: string;
  matricula: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  carrera: string;
  semestre: number;
  estatus: string; // Keep as string for API compatibility, will be converted from enum
}

/**
 * Group information in enrollment response
 */
export interface EnrollmentGroupDto {
  id: string;
  nombre: string;
  periodo: string;
  subject: {
    id: string;
    clave: string;
    nombre: string;
    creditos: number;
  };
  teacher: {
    id: string;
    nombre: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    departamento: string;
  };
}

/**
 * Enrollment response DTO
 */
export interface EnrollmentResponseDto {
  id: string;
  studentId: string;
  groupId: string;
  calificacion: number | null;
  // New fields (Phase 2)
  codigo?: string;
  fechaInscripcion?: string;
  fechaBaja?: string;
  tipoInscripcion?: 'NORMAL' | 'ESPECIAL' | 'REPETICION' | 'EQUIVALENCIA' | 'EXAMEN_DIAGNOSTICO' | 'CURSO_INGLES';
  estatus?: 'INSCRITO' | 'EN_CURSO' | 'BAJA' | 'APROBADO' | 'REPROBADO' | 'CANCELADO' | 'PENDIENTE_PAGO' | 'PAGO_PENDIENTE_APROBACION' | 'PAGO_APROBADO';
  // RB-038: English enrollment fields
  nivelIngles?: number | null;
  esExamenDiagnostico?: boolean;
  requierePago?: boolean;
  pagoAprobado?: boolean | null;
  fechaPagoAprobado?: string;
  montoPago?: number | null;
  comprobantePago?: string | null;
  // Partial grades
  calificacionParcial1?: number;
  calificacionParcial2?: number;
  calificacionParcial3?: number;
  calificacionFinal?: number;
  calificacionExtra?: number;
  // Attendance
  asistencias?: number;
  faltas?: number;
  retardos?: number;
  porcentajeAsistencia?: number;
  // Evaluation
  aprobado?: boolean;
  fechaAprobacion?: string;
  observaciones?: string;
  student?: EnrollmentStudentDto; // Optional: included when needed
  group?: EnrollmentGroupDto; // Optional: included when needed
}

/**
 * Paginated response for GET /api/enrollments/me
 */
export interface EnrollmentsListResponseDto {
  enrollments: EnrollmentResponseDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Error response DTO
 */
export interface EnrollmentErrorResponseDto {
  error: string;
  details?: string | Record<string, unknown>;
}

