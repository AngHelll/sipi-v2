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
}

/**
 * Request body for PUT /api/enrollments/:id
 * TEACHER can only update calificacion
 * ADMIN can update all fields
 */
export interface UpdateEnrollmentDto {
  calificacion?: number;
  studentId?: string; // Only ADMIN
  groupId?: string; // Only ADMIN
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

