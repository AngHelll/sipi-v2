// DTOs (Data Transfer Objects) for Students module
// Request and response type definitions
import { students_estatus } from '@prisma/client';

/**
 * User data for creating a new student
 */
export interface CreateUserDto {
  username: string;
  password: string;
  role: 'STUDENT';
}

/**
 * Student data for creating a new student
 */
export interface CreateStudentDataDto {
  matricula: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  carrera: string;
  semestre: number;
  estatus: students_estatus; // Enum: ACTIVO, INACTIVO, EGRESADO
  curp?: string; // Optional: Clave Única de Registro de Población
}

/**
 * Request body for POST /api/students
 * Creates a new student with associated user account
 */
export interface CreateStudentDto {
  user: CreateUserDto;
  student: CreateStudentDataDto;
}

/**
 * Request body for PUT /api/students/:id
 * Only includes fields that can be updated
 */
export interface UpdateStudentDto {
  nombre?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  carrera?: string;
  semestre?: number;
  estatus?: students_estatus;
  curp?: string;
  // Contact information
  email?: string;
  telefono?: string;
  telefonoEmergencia?: string;
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
  tipoIngreso?: 'NUEVO_INGRESO' | 'REINGRESO' | 'TRANSFERENCIA' | 'EQUIVALENCIA';
  fechaIngreso?: string; // ISO date string
  fechaEgreso?: string; // ISO date string
  promedioGeneral?: number;
  promedioIngles?: number; // RB-037: Promedio de inglés (independiente del promedio general)
  creditosCursados?: number;
  creditosAprobados?: number;
  creditosTotales?: number;
  // Administrative information
  beca?: boolean;
  tipoBeca?: string;
  observaciones?: string;
  carreraId?: string; // Normalized career relation
}

/**
 * Query parameters for GET /api/students
 * All filters are optional
 */
export interface StudentQueryDto {
  matricula?: string;
  carrera?: string;
  semestre?: number;
  estatus?: students_estatus;
  nombre?: string; // Search by nombre (partial match)
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  curp?: string;
  // Pagination
  page?: number;
  limit?: number;
  // Sorting
  sortBy?: 'matricula' | 'nombre' | 'carrera' | 'semestre' | 'estatus' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * User information in student response
 */
export interface StudentUserDto {
  id: string;
  username: string;
  role: 'STUDENT';
  createdAt: string;
  updatedAt: string;
}

/**
 * Student response DTO
 * Used for GET /api/students and PUT /api/students/:id responses
 */
export interface StudentResponseDto {
  id: string;
  userId: string;
  matricula: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  carrera: string;
  carreraId?: string;
  semestre: number;
  estatus: students_estatus;
  curp?: string;
  // Contact information
  email?: string;
  telefono?: string;
  telefonoEmergencia?: string;
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
  tipoIngreso?: 'NUEVO_INGRESO' | 'REINGRESO' | 'TRANSFERENCIA' | 'EQUIVALENCIA';
  fechaIngreso?: string;
  fechaEgreso?: string;
  promedioGeneral?: number;
  promedioIngles?: number; // RB-037: Promedio de inglés (independiente del promedio general)
  creditosCursados?: number;
  creditosAprobados?: number;
  creditosTotales?: number;
  // Administrative information
  beca?: boolean;
  tipoBeca?: string;
  observaciones?: string;
  // RB-038: Información de inglés del estudiante
  nivelInglesActual?: number;
  nivelInglesCertificado?: number;
  fechaExamenDiagnostico?: string;
  porcentajeIngles?: number;
  cumpleRequisitoIngles?: boolean;
  user?: StudentUserDto; // Optional: included when needed
}

/**
 * Complete student information response
 * Used for GET /api/students/me
 * Includes full user information and student data
 */
export interface StudentMeResponseDto {
  id: string;
  userId: string;
  matricula: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  carrera: string;
  semestre: number;
  estatus: students_estatus;
  curp?: string;
  user: StudentUserDto;
}

/**
 * Paginated response for GET /api/students
 */
export interface StudentsListResponseDto {
  students: StudentResponseDto[];
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
export interface StudentErrorResponseDto {
  error: string;
  details?: string | Record<string, unknown>;
}

