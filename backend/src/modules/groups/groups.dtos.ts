// DTOs (Data Transfer Objects) for Groups module
// Request and response type definitions

/**
 * Request body for POST /api/groups
 * Creates a new group
 */
export interface CreateGroupDto {
  subjectId: string;
  teacherId: string;
  nombre: string;
  periodo: string;
  // Campos opcionales para cursos de inglés
  nivelIngles?: number; // Nivel del curso (1-6) si es curso de inglés
  fechaInscripcionInicio?: string; // ISO date string
  fechaInscripcionFin?: string; // ISO date string
  esCursoIngles?: boolean; // Flag para identificar cursos de inglés
}

/**
 * Request body for PUT /api/groups/:id
 * Only includes fields that can be updated
 */
export interface UpdateGroupDto {
  nombre?: string;
  periodo?: string;
  subjectId?: string;
  teacherId?: string;
  cupoMaximo?: number;
  cupoMinimo?: number;
  horario?: string;
  aula?: string;
  edificio?: string;
  modalidad?: 'PRESENCIAL' | 'VIRTUAL' | 'HIBRIDO' | 'SEMIPRESENCIAL';
  estatus?: 'ABIERTO' | 'CERRADO' | 'CANCELADO' | 'EN_CURSO' | 'FINALIZADO';
  // Campos para cursos de inglés
  nivelIngles?: number;
  fechaInscripcionInicio?: string; // ISO date string
  fechaInscripcionFin?: string; // ISO date string
  esCursoIngles?: boolean;
}

/**
 * Query parameters for GET /api/groups
 * All filters are optional
 */
export interface GroupQueryDto {
  periodo?: string;
  subjectId?: string;
  esCursoIngles?: boolean; // Filtrar por cursos de inglés
  nivelIngles?: number; // Filtrar por nivel de inglés
  // Pagination
  page?: number;
  limit?: number;
  // Sorting
  sortBy?: 'nombre' | 'periodo' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Subject information in group response
 */
export interface GroupSubjectDto {
  id: string;
  clave: string;
  nombre: string;
  creditos: number;
}

/**
 * Teacher information in group response
 */
export interface GroupTeacherDto {
  id: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  departamento: string;
}

/**
 * Group response DTO
 * Used for GET /api/groups responses
 */
export interface GroupResponseDto {
  id: string;
  subjectId: string;
  teacherId: string;
  nombre: string;
  periodo: string;
  codigo?: string; // Group unique code
  cupoMaximo?: number;
  cupoMinimo?: number;
  cupoActual?: number;
  horario?: string;
  aula?: string;
  edificio?: string;
  modalidad?: 'PRESENCIAL' | 'VIRTUAL' | 'HIBRIDO' | 'SEMIPRESENCIAL';
  estatus?: 'ABIERTO' | 'CERRADO' | 'CANCELADO' | 'EN_CURSO' | 'FINALIZADO';
  // Campos para cursos de inglés
  nivelIngles?: number;
  fechaInscripcionInicio?: string; // ISO date string
  fechaInscripcionFin?: string; // ISO date string
  esCursoIngles?: boolean;
  subject?: GroupSubjectDto; // Optional: included when needed
  teacher?: GroupTeacherDto; // Optional: included when needed
}

/**
 * Paginated response for GET /api/groups
 */
export interface GroupsListResponseDto {
  groups: GroupResponseDto[];
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
export interface GroupErrorResponseDto {
  error: string;
  details?: string | Record<string, unknown>;
}

