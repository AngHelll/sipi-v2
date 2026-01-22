// DTOs (Data Transfer Objects) for Exam Periods module
// Request and response type definitions

/**
 * Request body for POST /api/academic-activities/exam-periods
 * Creates a new exam period
 */
export interface CreateExamPeriodDto {
  nombre: string;
  descripcion?: string;
  fechaInicio: string; // ISO date string
  fechaFin: string; // ISO date string
  fechaInscripcionInicio: string; // ISO date string
  fechaInscripcionFin: string; // ISO date string
  cupoMaximo?: number;
  requierePago?: boolean;
  montoPago?: number;
  observaciones?: string;
}

/**
 * Request body for PUT /api/academic-activities/exam-periods/:id
 * Only includes fields that can be updated
 */
export interface UpdateExamPeriodDto {
  nombre?: string;
  descripcion?: string;
  fechaInicio?: string; // ISO date string
  fechaFin?: string; // ISO date string
  fechaInscripcionInicio?: string; // ISO date string
  fechaInscripcionFin?: string; // ISO date string
  cupoMaximo?: number;
  estatus?: 'PLANEADO' | 'ABIERTO' | 'CERRADO' | 'EN_PROCESO' | 'FINALIZADO';
  requierePago?: boolean;
  montoPago?: number;
  observaciones?: string;
}

/**
 * Query parameters for GET /api/academic-activities/exam-periods
 * All filters are optional
 */
export interface ExamPeriodQueryDto {
  estatus?: 'PLANEADO' | 'ABIERTO' | 'CERRADO' | 'EN_PROCESO' | 'FINALIZADO';
  // Pagination
  page?: number;
  limit?: number;
  // Sorting
  sortBy?: 'nombre' | 'fechaInicio' | 'fechaInscripcionInicio' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Exam Period response DTO
 * Used for GET /api/academic-activities/exam-periods responses
 */
export interface ExamPeriodResponseDto {
  id: string;
  nombre: string;
  descripcion?: string;
  fechaInicio: string; // ISO date string
  fechaFin: string; // ISO date string
  fechaInscripcionInicio: string; // ISO date string
  fechaInscripcionFin: string; // ISO date string
  cupoMaximo: number;
  cupoActual: number;
  estatus: 'PLANEADO' | 'ABIERTO' | 'CERRADO' | 'EN_PROCESO' | 'FINALIZADO';
  requierePago: boolean;
  montoPago?: number;
  observaciones?: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

/**
 * Paginated response for GET /api/academic-activities/exam-periods
 */
export interface ExamPeriodsListResponseDto {
  periods: ExamPeriodResponseDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Response for available exam periods (for students)
 */
export interface AvailableExamPeriodResponseDto {
  id: string;
  nombre: string;
  descripcion?: string;
  fechaInicio: string;
  fechaFin: string;
  fechaInscripcionInicio: string;
  fechaInscripcionFin: string;
  cupoMaximo: number;
  cupoActual: number;
  cuposDisponibles: number;
  requierePago: boolean;
  montoPago?: number;
  estaDisponible: boolean; // true if inscripciones abiertas y hay cupo
}


