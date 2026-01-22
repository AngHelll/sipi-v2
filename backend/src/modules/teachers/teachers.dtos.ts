// DTOs (Data Transfer Objects) for Teachers module
// Request and response type definitions

/**
 * User data for creating a new teacher
 */
export interface CreateUserDto {
  username: string;
  password: string;
  role: 'TEACHER';
}

/**
 * Teacher data for creating a new teacher
 */
export interface CreateTeacherDataDto {
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  departamento: string;
  // Optional personal information
  fechaNacimiento?: string; // ISO date string
  genero?: 'MASCULINO' | 'FEMENINO' | 'OTRO' | 'PREFIERO_NO_DECIR';
  nacionalidad?: string;
  lugarNacimiento?: string;
  direccion?: string;
  ciudad?: string;
  estado?: string;
  codigoPostal?: string;
  pais?: string;
  // Optional contact information
  email?: string;
  telefono?: string;
  // Optional academic information
  gradoAcademico?: string;
  especialidad?: string;
  cedulaProfesional?: string;
  universidad?: string;
  // Optional employment information
  tipoContrato?: 'TIEMPO_COMPLETO' | 'MEDIO_TIEMPO' | 'POR_HONORARIOS' | 'INTERINO';
  fechaContratacion?: string; // ISO date string
  estatus?: 'ACTIVO' | 'INACTIVO' | 'JUBILADO' | 'LICENCIA';
  salario?: number;
}

/**
 * Request body for POST /api/teachers
 * Creates a new teacher with associated user account
 */
export interface CreateTeacherDto {
  user: CreateUserDto;
  teacher: CreateTeacherDataDto;
}

/**
 * Request body for PUT /api/teachers/:id
 * Only includes fields that can be updated
 */
export interface UpdateTeacherDto {
  nombre?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  departamento?: string;
  // Contact information
  email?: string;
  telefono?: string;
  // Personal information
  fechaNacimiento?: string; // ISO date string
  genero?: 'MASCULINO' | 'FEMENINO' | 'OTRO' | 'PREFIERO_NO_DECIR';
  nacionalidad?: string;
  lugarNacimiento?: string;
  direccion?: string;
  ciudad?: string;
  estado?: string;
  codigoPostal?: string;
  pais?: string;
  // Academic information
  gradoAcademico?: string;
  especialidad?: string;
  cedulaProfesional?: string;
  universidad?: string;
  // Employment information
  tipoContrato?: 'TIEMPO_COMPLETO' | 'MEDIO_TIEMPO' | 'POR_HONORARIOS' | 'INTERINO';
  fechaContratacion?: string; // ISO date string
  estatus?: 'ACTIVO' | 'INACTIVO' | 'JUBILADO' | 'LICENCIA';
  salario?: number;
  observaciones?: string;
}

/**
 * Query parameters for GET /api/teachers
 * All filters are optional
 */
export interface TeacherQueryDto {
  nombre?: string; // Search by nombre (partial match)
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  departamento?: string;
  // Pagination
  page?: number;
  limit?: number;
  // Sorting
  sortBy?: 'nombre' | 'apellidoPaterno' | 'departamento' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * User information in teacher response
 */
export interface TeacherUserDto {
  id: string;
  username: string;
  role: 'TEACHER';
  createdAt: string;
  updatedAt: string;
}

/**
 * Teacher response DTO
 * Used for GET /api/teachers and PUT /api/teachers/:id responses
 */
export interface TeacherResponseDto {
  id: string;
  userId: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  departamento: string;
  // Contact information
  email?: string;
  telefono?: string;
  // Personal information
  fechaNacimiento?: string;
  genero?: 'MASCULINO' | 'FEMENINO' | 'OTRO' | 'PREFIERO_NO_DECIR';
  nacionalidad?: string;
  lugarNacimiento?: string;
  direccion?: string;
  ciudad?: string;
  estado?: string;
  codigoPostal?: string;
  pais?: string;
  // Academic information
  gradoAcademico?: string;
  especialidad?: string;
  cedulaProfesional?: string;
  universidad?: string;
  // Employment information
  tipoContrato?: 'TIEMPO_COMPLETO' | 'MEDIO_TIEMPO' | 'POR_HONORARIOS' | 'INTERINO';
  fechaContratacion?: string;
  estatus?: 'ACTIVO' | 'INACTIVO' | 'JUBILADO' | 'LICENCIA';
  salario?: number;
  gruposAsignados?: number;
  estudiantesTotal?: number;
  observaciones?: string;
  user?: TeacherUserDto; // Optional: included when needed
}

/**
 * Paginated response for GET /api/teachers
 */
export interface TeachersListResponseDto {
  teachers: TeacherResponseDto[];
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
export interface TeacherErrorResponseDto {
  error: string;
  details?: string | Record<string, unknown>;
}

