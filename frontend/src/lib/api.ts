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
    case 429:
      return new Error('Demasiadas solicitudes. Por favor intenta más tarde.');
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
    };
    teacher: {
      nombre: string;
      apellidoPaterno: string;
      apellidoMaterno: string;
      departamento: string;
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
   * Create a new group (ADMIN only)
   */
  create: async (data: {
    subjectId: string;
    teacherId: string;
    nombre: string;
    periodo: string;
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
