// DTOs (Data Transfer Objects) for Subjects module
// Request and response type definitions

/**
 * Subject data for creating a new subject
 */
export interface CreateSubjectDto {
  clave: string;
  nombre: string;
  creditos: number;
}

/**
 * Request body for PUT /api/subjects/:id
 * Only includes fields that can be updated
 */
export interface UpdateSubjectDto {
  nombre?: string;
  creditos?: number;
  // Note: clave cannot be updated (unique identifier)
}

/**
 * Query parameters for GET /api/subjects
 * All filters are optional
 */
export interface SubjectQueryDto {
  clave?: string;
  nombre?: string; // Search by nombre (partial match)
  creditos?: number;
  // Pagination
  page?: number;
  limit?: number;
  // Sorting
  sortBy?: 'clave' | 'nombre' | 'creditos' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Subject response DTO
 * Used for GET /api/subjects and PUT /api/subjects/:id responses
 */
export interface SubjectResponseDto {
  id: string;
  clave: string;
  nombre: string;
  creditos: number;
}

/**
 * Paginated response for GET /api/subjects
 */
export interface SubjectsListResponseDto {
  subjects: SubjectResponseDto[];
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
export interface SubjectErrorResponseDto {
  error: string;
  details?: string | Record<string, unknown>;
}

