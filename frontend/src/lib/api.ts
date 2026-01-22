// API client for backend communication with improved error handling and retries
import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { LoginCredentials, AuthResponse, User } from '../types';

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Check if error is retryable (network errors, 5xx, but NOT 429)
const isRetryableError = (error: AxiosError): boolean => {
  if (!error.response) {
    // Network error - always retryable
    return true;
  }
  const status = error.response.status;
  // Don't retry on 429 (Too Many Requests) - rate limiting
  // Retrying would make it worse
  if (status === 429) {
    return false;
  }
  // Retry on 5xx server errors
  return status >= 500;
};

// Calculate delay for retry (exponential backoff)
const getRetryDelay = (attempt: number): number => {
  return RETRY_DELAY * Math.pow(2, attempt);
};

// Retry request with exponential backoff
const retryRequest = async (
  config: InternalAxiosRequestConfig,
  retryCount: number = 0
): Promise<any> => {
  if (retryCount >= MAX_RETRIES) {
    throw new Error('Max retries exceeded');
  }

  const delay = getRetryDelay(retryCount);
  await new Promise((resolve) => setTimeout(resolve, delay));

  try {
    return await axios.request(config);
  } catch (error) {
    const axiosError = error as AxiosError;
    if (isRetryableError(axiosError) && retryCount < MAX_RETRIES - 1) {
      return retryRequest(config, retryCount + 1);
    }
    throw error;
  }
};

// Create axios instance with default config
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  withCredentials: true, // Important: enables sending cookies (HTTP-only cookies)
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
});

// Request interceptor - add auth token if needed
api.interceptors.request.use(
  (config) => {
    // You can add auth tokens here if needed in the future
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors and retries
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized - redirect to login
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Clear any auth state
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    // Handle network errors and retryable errors
    if (isRetryableError(error) && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        return await retryRequest(originalRequest);
      } catch (retryError) {
        return Promise.reject(retryError);
      }
    }

    // Transform error for better error messages
    const transformedError = transformError(error);
    return Promise.reject(transformedError);
  }
);

// Transform axios errors to more user-friendly messages
const transformError = (error: AxiosError): Error => {
  if (!error.response) {
    // Network error
    return new Error(
      'Error de conexión. Por favor verifica tu conexión a internet e intenta de nuevo.'
    );
  }

  const status = error.response.status;
  const data = error.response.data as any;

  switch (status) {
    case 400:
      return new Error(
        data?.error || 'Solicitud inválida. Por favor verifica los datos ingresados.'
      );
    case 401:
      return new Error('No autorizado. Por favor inicia sesión nuevamente.');
    case 429:
      return new Error(
        data?.error || 'Demasiadas solicitudes. Por favor espera un momento e intenta de nuevo.'
      );
    case 403:
      return new Error('No tienes permisos para realizar esta acción.');
    case 404:
      return new Error(data?.error || 'Recurso no encontrado.');
    case 409:
      return new Error(data?.error || 'Conflicto. El recurso ya existe o está en uso.');
    case 422:
      return new Error(
        data?.error || 'Error de validación. Por favor verifica los datos ingresados.'
      );
    case 500:
      return new Error(
        'Error del servidor. Por favor intenta más tarde o contacta al administrador.'
      );
    case 503:
      return new Error('Servicio no disponible. Por favor intenta más tarde.');
    default:
      return new Error(
        data?.error || `Error ${status}: ${error.message || 'Ha ocurrido un error inesperado'}`
      );
  }
};

// Auth API endpoints
export const authApi = {
  /**
   * Login with username and password
   * Sets HTTP-only cookie automatically
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  /**
   * Logout current user
   * Clears HTTP-only cookie
   */
  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  /**
   * Get current authenticated user
   */
  getMe: async (): Promise<{ user: User }> => {
    const response = await api.get<{ user: User }>('/auth/me');
    return response.data;
  },
};

// Students API endpoints
export const studentsApi = {
  /**
   * Get all students with optional filters and pagination
   */
  getAll: async (params?: {
    matricula?: string;
    carrera?: string;
    semestre?: number;
    estatus?: string;
    nombre?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<import('../types').StudentsListResponse> => {
    const response = await api.get<import('../types').StudentsListResponse>(
      '/students',
      { params }
    );
    return response.data;
  },

  /**
   * Get student by ID
   */
  getById: async (id: string): Promise<import('../types').Student> => {
    const response = await api.get<import('../types').Student>(`/students/${id}`);
    return response.data;
  },

  /**
   * Create a new student
   */
  create: async (data: {
    user: {
      username: string;
      password: string;
      role: 'STUDENT';
    };
    student: {
      matricula: string;
      nombre: string;
      apellidoPaterno: string;
      apellidoMaterno: string;
      carrera: string;
      semestre: number;
      estatus: string;
      curp?: string;
    };
  }): Promise<import('../types').Student> => {
    const response = await api.post<import('../types').Student>(
      '/students',
      data
    );
    return response.data;
  },

  /**
   * Update student
   */
  update: async (
    id: string,
    data: {
      nombre?: string;
      apellidoPaterno?: string;
      apellidoMaterno?: string;
      carrera?: string;
      semestre?: number;
      estatus?: string;
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
      creditosCursados?: number;
      creditosAprobados?: number;
      creditosTotales?: number;
      // Administrative information
      beca?: boolean;
      tipoBeca?: string;
      observaciones?: string;
    }
  ): Promise<import('../types').Student> => {
    const response = await api.put<import('../types').Student>(
      `/students/${id}`,
      data
    );
    return response.data;
  },

  /**
   * Get current student (for STUDENT role)
   */
  getMe: async (): Promise<import('../types').Student & { user: User }> => {
    const response = await api.get<
      import('../types').Student & { user: User }
    >('/students/me');
    return response.data;
  },

  /**
   * Delete student (ADMIN only)
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/students/${id}`);
  },
};

// Teachers API endpoints
export const teachersApi = {
  /**
   * Get all teachers with optional filters and pagination
   */
  getAll: async (params?: {
    nombre?: string;
    apellidoPaterno?: string;
    apellidoMaterno?: string;
    departamento?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<import('../types').TeachersListResponse> => {
    const response = await api.get<import('../types').TeachersListResponse>(
      '/teachers',
      { params }
    );
    return response.data;
  },

  /**
   * Get teacher by ID
   */
  getById: async (id: string): Promise<import('../types').Teacher> => {
    const response = await api.get<import('../types').Teacher>(`/teachers/${id}`);
    return response.data;
  },

  /**
   * Create a new teacher
   */
  create: async (data: {
    user: {
      username: string;
      password: string;
      role: 'TEACHER';
      email?: string;
      telefono?: string;
    };
    teacher: {
      nombre: string;
      apellidoPaterno: string;
      apellidoMaterno: string;
      departamento: string;
      email?: string;
      telefono?: string;
      fechaNacimiento?: Date;
      genero?: 'MASCULINO' | 'FEMENINO' | 'OTRO' | 'PREFIERO_NO_DECIR';
      nacionalidad?: string;
      direccion?: string;
      ciudad?: string;
      estado?: string;
      codigoPostal?: string;
      pais?: string;
      gradoAcademico?: string;
      especialidad?: string;
      cedulaProfesional?: string;
      universidad?: string;
      tipoContrato?: 'TIEMPO_COMPLETO' | 'MEDIO_TIEMPO' | 'POR_HONORARIOS' | 'INTERINO';
      fechaContratacion?: Date;
      estatus?: 'ACTIVO' | 'INACTIVO' | 'JUBILADO' | 'LICENCIA';
      salario?: number;
      gruposAsignados?: number;
      horasClaseSemanal?: number;
      observaciones?: string;
    };
  }): Promise<import('../types').Teacher> => {
    const response = await api.post<import('../types').Teacher>(
      '/teachers',
      data
    );
    return response.data;
  },

  /**
   * Update teacher
   */
  update: async (
    id: string,
    data: {
      nombre?: string;
      apellidoPaterno?: string;
      apellidoMaterno?: string;
      departamento?: string;
      email?: string;
      telefono?: string;
      fechaNacimiento?: Date;
      genero?: 'MASCULINO' | 'FEMENINO' | 'OTRO' | 'PREFIERO_NO_DECIR';
      nacionalidad?: string;
      direccion?: string;
      ciudad?: string;
      estado?: string;
      codigoPostal?: string;
      pais?: string;
      gradoAcademico?: string;
      especialidad?: string;
      cedulaProfesional?: string;
      universidad?: string;
      tipoContrato?: 'TIEMPO_COMPLETO' | 'MEDIO_TIEMPO' | 'POR_HONORARIOS' | 'INTERINO';
      fechaContratacion?: Date;
      estatus?: 'ACTIVO' | 'INACTIVO' | 'JUBILADO' | 'LICENCIA';
      salario?: number;
      gruposAsignados?: number;
      horasClaseSemanal?: number;
      observaciones?: string;
    }
  ): Promise<import('../types').Teacher> => {
    const response = await api.put<import('../types').Teacher>(
      `/teachers/${id}`,
      data
    );
    return response.data;
  },

  /**
   * Delete teacher (ADMIN only)
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/teachers/${id}`);
  },
};

// Subjects API endpoints
export const subjectsApi = {
  /**
   * Get all subjects with optional filters and pagination
   */
  getAll: async (params?: {
    clave?: string;
    nombre?: string;
    creditos?: number;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<import('../types').SubjectsListResponse> => {
    const response = await api.get<import('../types').SubjectsListResponse>(
      '/subjects',
      { params }
    );
    return response.data;
  },

  /**
   * Get subject by ID
   */
  getById: async (id: string): Promise<import('../types').Subject> => {
    const response = await api.get<import('../types').Subject>(`/subjects/${id}`);
    return response.data;
  },

  /**
   * Create a new subject
   */
  create: async (data: {
    clave: string;
    nombre: string;
    creditos: number;
    tipo?: 'OBLIGATORIA' | 'OPTATIVA' | 'ELECTIVA' | 'SERVICIO_SOCIAL';
    estatus?: 'ACTIVA' | 'INACTIVA' | 'DESCONTINUADA' | 'EN_REVISION';
    nivel?: number;
    horasTeoria?: number;
    horasPractica?: number;
    horasLaboratorio?: number;
    descripcion?: string;
    carreraId?: string;
  }): Promise<import('../types').Subject> => {
    const response = await api.post<import('../types').Subject>(
      '/subjects',
      data
    );
    return response.data;
  },

  /**
   * Update subject
   */
  update: async (
    id: string,
    data: {
      nombre?: string;
      creditos?: number;
      tipo?: 'OBLIGATORIA' | 'OPTATIVA' | 'ELECTIVA' | 'SERVICIO_SOCIAL';
      estatus?: 'ACTIVA' | 'INACTIVA' | 'DESCONTINUADA' | 'EN_REVISION';
      nivel?: number;
      horasTeoria?: number;
      horasPractica?: number;
      horasLaboratorio?: number;
      descripcion?: string;
      carreraId?: string;
    }
  ): Promise<import('../types').Subject> => {
    const response = await api.put<import('../types').Subject>(
      `/subjects/${id}`,
      data
    );
    return response.data;
  },

  /**
   * Delete subject (ADMIN only)
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/subjects/${id}`);
  },
};

// Groups API endpoints
export const groupsApi = {
  /**
   * Get all groups with optional filters and pagination
   * Role-based: ADMIN sees all, TEACHER sees only their groups, STUDENT sees enrolled groups
   */
  getAll: async (params?: {
    periodo?: string;
    subjectId?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<import('../types').GroupsListResponse> => {
    const response = await api.get<import('../types').GroupsListResponse>(
      '/groups',
      { params }
    );
    return response.data;
  },

  /**
   * Get group by ID
   */
  getById: async (id: string): Promise<import('../types').Group> => {
    const response = await api.get<import('../types').Group>(`/groups/${id}`);
    return response.data;
  },

  /**
   * Get available English courses (STUDENT only)
   * Returns courses that are open, within registration period, and have available capacity
   */
  getAvailableEnglishCourses: async (): Promise<{
    courses: import('../types').Group[];
    total: number;
  }> => {
    const response = await api.get('/groups/available/english-courses');
    return response.data;
  },

  /**
   * Create a new group (ADMIN only)
   */
  create: async (data: {
    subjectId: string;
    teacherId: string;
    nombre: string;
    periodo: string;
    cupoMaximo?: number;
    cupoMinimo?: number;
    horario?: string;
    aula?: string;
    edificio?: string;
    modalidad?: 'PRESENCIAL' | 'VIRTUAL' | 'HIBRIDO' | 'SEMIPRESENCIAL';
    estatus?: 'ABIERTO' | 'CERRADO' | 'CANCELADO' | 'EN_CURSO' | 'FINALIZADO';
    // Campos para cursos de inglés
    nivelIngles?: number;
    fechaInscripcionInicio?: string;
    fechaInscripcionFin?: string;
    esCursoIngles?: boolean;
  }): Promise<import('../types').Group> => {
    const response = await api.post<import('../types').Group>(
      '/groups',
      data
    );
    return response.data;
  },

  /**
   * Update group (ADMIN only)
   */
  update: async (
    id: string,
    data: {
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
      fechaInscripcionInicio?: string;
      fechaInscripcionFin?: string;
      esCursoIngles?: boolean;
    }
  ): Promise<import('../types').Group> => {
    const response = await api.put<import('../types').Group>(
      `/groups/${id}`,
      data
    );
    return response.data;
  },

  /**
   * Delete group (ADMIN only)
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/groups/${id}`);
  },
};

// Enrollments API endpoints
export const enrollmentsApi = {
  /**
   * Get all enrollments (ADMIN only)
   */
  getAll: async (params?: {
    page?: number;
    limit?: number;
    studentId?: string;
    groupId?: string;
    estatus?: string;
    tipoInscripcion?: string;
    aprobado?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<import('../types').EnrollmentsListResponse> => {
    const response = await api.get<import('../types').EnrollmentsListResponse>(
      '/enrollments',
      { params }
    );
    return response.data;
  },

  /**
   * Get current student's enrollments (STUDENT only)
   */
  getMe: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<import('../types').EnrollmentsListResponse> => {
    const response = await api.get<import('../types').EnrollmentsListResponse>(
      '/enrollments/me',
      { params }
    );
    return response.data;
  },

  /**
   * Get enrollment by ID
   * ADMIN can access any enrollment
   * TEACHER can only access enrollments for their own groups
   * STUDENT can only access their own enrollments
   */
  getById: async (id: string): Promise<import('../types').Enrollment> => {
    const response = await api.get<import('../types').Enrollment>(
      `/enrollments/${id}`
    );
    return response.data;
  },

  /**
   * Get enrollments for a specific group
   * TEACHER can only access enrollments for their own groups
   * ADMIN can access enrollments for any group
   */
  getByGroup: async (groupId: string): Promise<import('../types').EnrollmentsListResponse> => {
    const response = await api.get<import('../types').EnrollmentsListResponse>(
      `/enrollments/group/${groupId}`
    );
    return response.data;
  },

  /**
   * Create a new enrollment (ADMIN only)
   */
  create: async (data: {
    studentId: string;
    groupId: string;
    calificacion?: number;
    codigo?: string;
    fechaInscripcion?: Date;
    fechaBaja?: Date;
    tipoInscripcion?: 'NORMAL' | 'ESPECIAL' | 'REPETICION' | 'EQUIVALENCIA';
    estatus?: 'INSCRITO' | 'EN_CURSO' | 'BAJA' | 'APROBADO' | 'REPROBADO' | 'CANCELADO';
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
    fechaAprobacion?: Date;
    observaciones?: string;
  }): Promise<import('../types').Enrollment> => {
    const response = await api.post<import('../types').Enrollment>(
      '/enrollments',
      data
    );
    return response.data;
  },

  /**
   * Update enrollment
   * TEACHER can only update calificacion (for their groups)
   * ADMIN can update all fields
   */
  update: async (
    id: string,
    data: {
      calificacion?: number;
      studentId?: string; // ADMIN only
      groupId?: string; // ADMIN only
      fechaBaja?: Date;
      tipoInscripcion?: 'NORMAL' | 'ESPECIAL' | 'REPETICION' | 'EQUIVALENCIA';
      estatus?: 'INSCRITO' | 'EN_CURSO' | 'BAJA' | 'APROBADO' | 'REPROBADO' | 'CANCELADO';
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
      fechaAprobacion?: Date;
      observaciones?: string;
    }
  ): Promise<import('../types').Enrollment> => {
    const response = await api.put<import('../types').Enrollment>(
      `/enrollments/${id}`,
      data
    );
    return response.data;
  },

  /**
   * Delete enrollment (ADMIN only)
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/enrollments/${id}`);
  },
};

// English Enrollments API endpoints (RB-038)
// ============================================
// V2: Academic Activities API
// ============================================

/**
 * Exams API - V2: Exámenes (NO requieren grupo)
 */
export const examsApi = {
  /**
   * Create diagnostic exam (STUDENT only)
   * NO requiere grupo
   */
  createDiagnosticExam: async (data: import('../types').CreateExamRequest): Promise<{
    message: string;
    activity: {
      id: string;
      codigo: string;
      estatus: string;
      examType: string;
      nivelIngles?: number;
      periodId?: string;
    };
  }> => {
    const response = await api.post('/academic-activities/exams', data);
    return response.data;
  },

  /**
   * Get exam by ID (ADMIN only)
   */
  getById: async (id: string): Promise<{
    id: string;
    codigo: string;
    estatus: string;
    fechaInscripcion: string;
    student: {
      id: string;
      matricula: string;
      nombre: string;
      apellidoPaterno: string;
      apellidoMaterno: string;
    } | null;
    exam: {
      examType: string;
      nivelIngles?: number;
      resultado?: number;
      fechaExamen?: string;
      fechaResultado?: string;
      periodId?: string;
      period?: {
        id: string;
        nombre: string;
      };
      subject?: {
        id: string;
        clave: string;
        nombre: string;
      };
    } | null;
  }> => {
    const response = await api.get(`/academic-activities/exams/${id}`);
    return response.data;
  },

  /**
   * Get all exams with filters and pagination (ADMIN only)
   */
  getAll: async (params?: {
    page?: number;
    limit?: number;
    studentId?: string;
    periodId?: string;
    examType?: 'DIAGNOSTICO' | 'ADMISION' | 'CERTIFICACION';
    estatus?: string;
    fechaInicio?: string;
    fechaFin?: string;
    sortBy?: 'fechaInscripcion' | 'estatus' | 'examType';
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    exams: Array<{
      id: string;
      codigo: string;
      estatus: string;
      fechaInscripcion: string;
      student: {
        id: string;
        matricula: string;
        nombre: string;
        apellidoPaterno: string;
        apellidoMaterno: string;
      } | null;
      exam: {
        examType: string;
        nivelIngles?: number;
        resultado?: number;
        fechaExamen?: string;
        fechaResultado?: string;
        periodId?: string;
        period?: {
          id: string;
          nombre: string;
        };
        subject?: {
          id: string;
          clave: string;
          nombre: string;
        };
      } | null;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> => {
    const response = await api.get('/academic-activities/exams', { params });
    return response.data;
  },

  /**
   * Process exam result (TEACHER/ADMIN only)
   */
  processExamResult: async (
    activityId: string,
    data: import('../types').ProcessExamResultRequest
  ): Promise<{
    message: string;
    result: {
      activityId: string;
      resultado: number;
      estatus: string;
      nivelIngles?: number;
      isPerfectScore?: boolean;
    };
  }> => {
    const response = await api.put(`/academic-activities/exams/${activityId}/result`, data);
    return response.data;
  },

  /**
   * Get exams by student (STUDENT only)
   */
  getExamsByStudent: async (): Promise<{
    exams: import('../types').ExamActivity[];
    total: number;
  }> => {
    const response = await api.get('/academic-activities/exams/student');
    return response.data;
  },

  /**
   * Receive physical payment proof and approve exam payment (ADMIN only)
   */
  receiveAndApproveExamPayment: async (
    activityId: string,
    data: { montoPago: number; observaciones?: string }
  ): Promise<{
    message: string;
    result: {
      id: string;
      codigo: string;
      estatus: string;
      pagoAprobado: boolean;
      montoPago: number;
    };
  }> => {
    const response = await api.put(`/academic-activities/exams/${activityId}/receive-and-approve-payment`, data);
    return response.data;
  },

  /**
   * Reject exam payment (ADMIN only)
   */
  rejectExamPayment: async (
    activityId: string,
    motivo: string
  ): Promise<{
    message: string;
    result: {
      id: string;
      codigo: string;
      estatus: string;
      pagoAprobado: boolean;
    };
  }> => {
    const response = await api.put(`/academic-activities/exams/${activityId}/reject-payment`, { motivo });
    return response.data;
  },

  /**
   * Get student English status V2 (STUDENT only) - includes V2 exams and courses
   */
  getStudentEnglishStatusV2: async (): Promise<{
    student: {
      id: string;
      matricula: string;
      nombre: string;
      apellidoPaterno: string;
      apellidoMaterno: string;
    };
    nivelInglesActual: number | null;
    nivelInglesCertificado: number | null;
    porcentajeIngles: number | null;
    cumpleRequisitoIngles: boolean;
    fechaExamenDiagnostico: string | null;
    diagnosticExams: Array<{
      id: string;
      codigo: string;
      fechaInscripcion: string;
      estatus: string;
      calificacion: number | null;
      nivelIngles: number | null;
      subject: string;
      period: {
        id: string;
        nombre: string;
      } | null;
      fechaExamen: string | null;
      fechaResultado: string | null;
      requierePago: boolean;
      pagoAprobado: boolean | null;
      montoPago: number | null;
    }>;
    englishCourses: Array<{
      id: string;
      codigo: string;
      nivelIngles: number | null;
      fechaInscripcion: string;
      estatus: string;
      pagoAprobado: boolean | null;
      calificacion: number | null;
      subject: string;
      groupId: string | null;
      completadoPorDiagnostico: boolean;
    }>;
    completedLevels: number[];
    missingLevels: number[];
    pendingExam: {
      id: string;
      codigo: string;
      fechaInscripcion: string;
      estatus: string;
      period: {
        id: string;
        nombre: string;
      } | null;
      requierePago: boolean;
      pagoAprobado: boolean | null;
      montoPago: number | null;
    } | null;
    progress: {
      totalLevels: number;
      completed: number;
      percentage: number;
    };
  }> => {
    const response = await api.get('/academic-activities/exams/student/english-status');
    return response.data;
  },
};

/**
 * Special Courses API - V2: Cursos especiales (grupo opcional)
 */
export const specialCoursesApi = {
  /**
   * Get all special courses (ADMIN only)
   */
  getAll: async (params?: {
    page?: number;
    limit?: number;
    studentId?: string;
    courseType?: string;
    nivelIngles?: number;
    estatus?: string;
    requierePago?: boolean;
    fechaInicio?: string;
    fechaFin?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    courses: Array<{
      id: string;
      codigo: string;
      estatus: string;
      fechaInscripcion: string;
      observaciones: string | null;
      student: {
        id: string;
        matricula: string;
        nombre: string;
        apellidoPaterno: string;
        apellidoMaterno: string;
      } | null;
      course: {
        courseType: string;
        nivelIngles: number | null;
        groupId: string | null;
        group: {
          id: string;
          nombre: string;
          periodo: string;
        } | null;
        calificacion: number | null;
        aprobado: boolean | null;
        fechaAprobacion: string | null;
        requierePago: boolean;
        pagoAprobado: boolean | null;
        fechaPagoAprobado: string | null;
        montoPago: number | null;
        fechaInicio: string | null;
      } | null;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> => {
    const response = await api.get('/academic-activities/special-courses', { params });
    return response.data;
  },

  /**
   * Get special course by ID (ADMIN only)
   */
  getById: async (activityId: string): Promise<{
    id: string;
    codigo: string;
    estatus: string;
    fechaInscripcion: string;
    observaciones: string | null;
    student: {
      id: string;
      matricula: string;
      nombre: string;
      apellidoPaterno: string;
      apellidoMaterno: string;
    } | null;
    course: {
      courseType: string;
      nivelIngles: number | null;
      groupId: string | null;
      group: {
        id: string;
        nombre: string;
        periodo: string;
      } | null;
      calificacion: number | null;
      aprobado: boolean | null;
      fechaAprobacion: string | null;
      requierePago: boolean;
      pagoAprobado: boolean | null;
      fechaPagoAprobado: string | null;
      montoPago: number | null;
      fechaInicio: string | null;
    } | null;
  }> => {
    const response = await api.get(`/academic-activities/special-courses/${activityId}`);
    return response.data;
  },

  /**
   * Create special course enrollment (STUDENT only)
   * Grupo es opcional
   */
  createSpecialCourse: async (data: import('../types').CreateSpecialCourseRequest): Promise<{
    message: string;
    activity: {
      id: string;
      codigo: string;
      estatus: string;
      courseType: string;
      nivelIngles?: number;
      requierePago: boolean;
    };
  }> => {
    const response = await api.post('/academic-activities/special-courses', data);
    return response.data;
  },

  /**
   * Submit payment proof (STUDENT only)
   */
  /**
   * Receive physical payment proof and approve payment (ADMIN only)
   */
  receiveAndApprovePayment: async (
    activityId: string,
    data: { montoPago: number; observaciones?: string; fechaInicio?: string }
  ): Promise<{
    message: string;
    result: {
      activityId: string;
      estatus: string;
      montoPago: number;
    };
  }> => {
    const response = await api.put(`/academic-activities/special-courses/${activityId}/receive-and-approve-payment`, data);
    return response.data;
  },

  /**
   * Reject payment (ADMIN only)
   */
  rejectPayment: async (
    activityId: string,
    data: import('../types').RejectPaymentRequest
  ): Promise<{
    message: string;
    result: {
      activityId: string;
      estatus: string;
    };
  }> => {
    const response = await api.put(`/academic-activities/special-courses/${activityId}/reject-payment`, data);
    return response.data;
  },

  /**
   * Complete special course (TEACHER/ADMIN only)
   */
  completeCourse: async (
    activityId: string,
    data: import('../types').CompleteCourseRequest
  ): Promise<{
    message: string;
    result: {
      activityId: string;
      calificacion: number;
      aprobado: boolean;
      estatus: string;
    };
  }> => {
    const response = await api.put(`/academic-activities/special-courses/${activityId}/complete`, data);
    return response.data;
  },
};

// ============================================
// Exam Periods API
// ============================================

export const examPeriodsApi = {
  /**
   * Get all exam periods (ADMIN/TEACHER only)
   */
  getAllPeriods: async (params?: {
    estatus?: import('../types').ExamPeriodStatus;
    page?: number;
    limit?: number;
    sortBy?: 'nombre' | 'fechaInicio' | 'fechaInscripcionInicio' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
  }): Promise<import('../types').ExamPeriodsListResponse> => {
    const response = await api.get('/academic-activities/exam-periods', { params });
    return response.data;
  },

  /**
   * Get available exam periods (STUDENT only)
   */
  getAvailablePeriods: async (): Promise<{
    periods: import('../types').AvailableExamPeriod[];
    total: number;
  }> => {
    const response = await api.get('/academic-activities/exam-periods/available');
    return response.data;
  },

  /**
   * Get exam period by ID (ADMIN/TEACHER only)
   */
  getPeriodById: async (id: string): Promise<import('../types').ExamPeriod> => {
    const response = await api.get(`/academic-activities/exam-periods/${id}`);
    return response.data;
  },

  /**
   * Create exam period (ADMIN only)
   */
  createPeriod: async (data: import('../types').CreateExamPeriodRequest): Promise<{
    message: string;
    period: import('../types').ExamPeriod;
  }> => {
    const response = await api.post('/academic-activities/exam-periods', data);
    return response.data;
  },

  /**
   * Update exam period (ADMIN only)
   */
  updatePeriod: async (
    id: string,
    data: import('../types').UpdateExamPeriodRequest
  ): Promise<{
    message: string;
    period: import('../types').ExamPeriod;
  }> => {
    const response = await api.put(`/academic-activities/exam-periods/${id}`, data);
    return response.data;
  },

  /**
   * Open exam period (ADMIN only)
   */
  openPeriod: async (id: string): Promise<{
    message: string;
    period: import('../types').ExamPeriod;
  }> => {
    const response = await api.put(`/academic-activities/exam-periods/${id}/open`);
    return response.data;
  },

  /**
   * Close exam period (ADMIN only)
   */
  closePeriod: async (id: string): Promise<{
    message: string;
    period: import('../types').ExamPeriod;
  }> => {
    const response = await api.put(`/academic-activities/exam-periods/${id}/close`);
    return response.data;
  },
};

// ============================================
// V1: English Enrollments API (Deprecated - mantener por compatibilidad)
// ============================================

export const englishEnrollmentsApi = {
  /**
   * Request diagnostic exam enrollment (STUDENT only)
   */
  requestDiagnosticExam: async (groupId: string): Promise<{ message: string; enrollment: import('../types').Enrollment }> => {
    const response = await api.post<{ message: string; enrollment: import('../types').Enrollment }>(
      '/enrollments/english/exam',
      { groupId }
    );
    return response.data;
  },

  /**
   * Request English course enrollment (STUDENT only)
   */
  requestEnglishCourse: async (groupId: string, nivelIngles: number): Promise<{ message: string; enrollment: import('../types').Enrollment }> => {
    const response = await api.post<{ message: string; enrollment: import('../types').Enrollment }>(
      '/enrollments/english/course',
      { groupId, nivelIngles }
    );
    return response.data;
  },

  /**
   * Submit payment proof (STUDENT only)
   */
  submitPaymentProof: async (enrollmentId: string, montoPago: number, comprobantePago: string): Promise<{ message: string; enrollment: import('../types').Enrollment }> => {
    const response = await api.post<{ message: string; enrollment: import('../types').Enrollment }>(
      `/enrollments/english/${enrollmentId}/payment`,
      { montoPago, comprobantePago }
    );
    return response.data;
  },

  /**
   * Approve payment (ADMIN only)
   */
  approvePayment: async (enrollmentId: string): Promise<{ message: string; enrollment: import('../types').Enrollment }> => {
    const response = await api.put<{ message: string; enrollment: import('../types').Enrollment }>(
      `/enrollments/english/${enrollmentId}/approve-payment`
    );
    return response.data;
  },

  /**
   * Reject payment (ADMIN only)
   */
  rejectPayment: async (enrollmentId: string, motivo: string): Promise<{ message: string; enrollment: import('../types').Enrollment }> => {
    const response = await api.put<{ message: string; enrollment: import('../types').Enrollment }>(
      `/enrollments/english/${enrollmentId}/reject-payment`,
      { motivo }
    );
    return response.data;
  },

  /**
   * Process diagnostic exam result (TEACHER/ADMIN)
   */
  processDiagnosticExamResult: async (enrollmentId: string, examGrade: number): Promise<{ message: string; enrollment: import('../types').Enrollment }> => {
    const response = await api.put<{ message: string; enrollment: import('../types').Enrollment }>(
      `/enrollments/english/${enrollmentId}/exam-result`,
      { examGrade }
    );
    return response.data;
  },

  /**
   * Process English course completion (TEACHER/ADMIN)
   */
  processEnglishCourseCompletion: async (enrollmentId: string, finalGrade: number): Promise<{ message: string; enrollment: import('../types').Enrollment }> => {
    const response = await api.put<{ message: string; enrollment: import('../types').Enrollment }>(
      `/enrollments/english/${enrollmentId}/course-completion`,
      { finalGrade }
    );
    return response.data;
  },

  /**
   * Get student English status V2 (STUDENT only) - includes V2 exams and courses
   */
  getStudentEnglishStatusV2: async (): Promise<{
    student: {
      id: string;
      matricula: string;
      nombre: string;
      apellidoPaterno: string;
      apellidoMaterno: string;
    };
    nivelInglesActual: number | null;
    nivelInglesCertificado: number | null;
    porcentajeIngles: number | null;
    cumpleRequisitoIngles: boolean;
    fechaExamenDiagnostico: string | null;
    diagnosticExams: Array<{
      id: string;
      codigo: string;
      fechaInscripcion: string;
      estatus: string;
      calificacion: number | null;
      nivelIngles: number | null;
      subject: string;
      period: {
        id: string;
        nombre: string;
      } | null;
      fechaExamen: string | null;
      fechaResultado: string | null;
    }>;
    englishCourses: Array<{
      id: string;
      codigo: string;
      nivelIngles: number | null;
      fechaInscripcion: string;
      estatus: string;
      pagoAprobado: boolean | null;
      calificacion: number | null;
      subject: string;
      groupId: string | null;
      completadoPorDiagnostico: boolean;
    }>;
    completedLevels: number[];
    missingLevels: number[];
    pendingExam: {
      id: string;
      codigo: string;
      fechaInscripcion: string;
      estatus: string;
      period: {
        id: string;
        nombre: string;
      } | null;
    } | null;
    progress: {
      totalLevels: number;
      completed: number;
      percentage: number;
    };
  }> => {
    const response = await api.get('/academic-activities/exams/student/english-status');
    return response.data;
  },

  /**
   * Get student English status (STUDENT only) - Legacy endpoint
   */
  getStudentEnglishStatus: async (): Promise<{
    student: {
      id: string;
      matricula: string;
      nombre: string;
      apellidoPaterno: string;
      apellidoMaterno: string;
    };
    nivelInglesActual: number | null;
    nivelInglesCertificado: number | null;
    porcentajeIngles: number | null;
    cumpleRequisitoIngles: boolean;
    fechaExamenDiagnostico: string | null;
    diagnosticExams: Array<{
      id: string;
      fechaInscripcion: string;
      estatus: string;
      calificacion: number | null;
      subject: string;
    }>;
    englishCourses: Array<{
      id: string;
      nivelIngles: number | null;
      fechaInscripcion: string;
      estatus: string;
      pagoAprobado: boolean | null;
      calificacion: number | null;
      subject: string;
    }>;
    completedLevels: number[];
    missingLevels: number[];
    progress: {
      totalLevels: number;
      completed: number;
      percentage: number;
    };
  }> => {
    const response = await api.get('/enrollments/english/student-status');
    return response.data;
  },

  /**
   * Get pending payment approvals (ADMIN only)
   */
  getPendingPaymentApprovals: async (): Promise<{
    enrollments: Array<{
      id: string;
      codigo: string;
      fechaInscripcion: string;
      nivelIngles: number | null;
      montoPago: number | null;
      comprobantePago: string | null;
      student: {
        id: string;
        matricula: string;
        nombre: string;
        carrera: string;
      };
      subject: {
        id: string;
        clave: string;
        nombre: string;
      };
    }>;
    total: number;
  }> => {
    const response = await api.get('/enrollments/english/pending-approvals');
    return response.data;
  },
};

// Search API endpoints
export const searchApi = {
  /**
   * Global search across all entities
   */
  search: async (params: {
    q: string;
    limit?: number;
    types?: Array<'student' | 'teacher' | 'subject' | 'group'>;
  }): Promise<import('../types').SearchResponse> => {
    const response = await api.get<import('../types').SearchResponse>(
      '/search',
      { params }
    );
    return response.data;
  },
};

// Export API endpoints
export const exportApi = {
  /**
   * Export students to Excel
   */
  exportStudents: async (filters?: {
    carrera?: string;
    semestre?: number;
    estatus?: string;
  }): Promise<Blob> => {
    const response = await api.get('/export/students', {
      params: filters,
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Export teachers to Excel
   */
  exportTeachers: async (filters?: {
    departamento?: string;
  }): Promise<Blob> => {
    const response = await api.get('/export/teachers', {
      params: filters,
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Export subjects to Excel
   */
  exportSubjects: async (): Promise<Blob> => {
    const response = await api.get('/export/subjects', {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Export groups to Excel
   */
  exportGroups: async (filters?: {
    periodo?: string;
    subjectId?: string;
  }): Promise<Blob> => {
    const response = await api.get('/export/groups', {
      params: filters,
      responseType: 'blob',
    });
    return response.data;
  },
};

export default api;
