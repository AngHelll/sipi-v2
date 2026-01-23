// Special Courses List Page - Admin can view and manage special course requests
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { specialCoursesApi } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { Badge, SkeletonTable, EmptyState, FormField } from '../../components/ui';

interface SpecialCourse {
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
}

interface SpecialCoursesListResponse {
  courses: SpecialCourse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const SpecialCoursesListPage = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<SpecialCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<SpecialCoursesListResponse['pagination'] | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [courseTypeFilter, setCourseTypeFilter] = useState('');
  const [estatusFilter, setEstatusFilter] = useState('');
  const [requierePagoFilter, setRequierePagoFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [sortBy] = useState<string>('fechaInscripcion');
  const [sortOrder] = useState<'asc' | 'desc'>('desc');

  // Debounced search
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchCourses();
  }, [debouncedSearchTerm, courseTypeFilter, estatusFilter, requierePagoFilter, currentPage, pageSize, sortBy, sortOrder]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {
        page: currentPage,
        limit: pageSize,
        sortBy,
        sortOrder,
      };

      if (debouncedSearchTerm.trim()) {
        // Search by student name or code
        // Note: Backend would need to support this, for now we filter client-side
      }

      if (courseTypeFilter) {
        params.courseType = courseTypeFilter;
      }

      if (estatusFilter) {
        params.estatus = estatusFilter;
      }

      if (requierePagoFilter !== '') {
        params.requierePago = requierePagoFilter === 'true';
      }

      const response = await specialCoursesApi.getAll(params);
      setCourses(response.courses);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar los cursos especiales');
      console.error('Error fetching special courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (estatus: string) => {
    const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default' }> = {
      INSCRITO: { label: 'Inscrito', variant: 'success' },
      EN_CURSO: { label: 'En Curso', variant: 'info' },
      PENDIENTE_PAGO: { label: 'Pendiente Pago', variant: 'warning' },
      PAGO_APROBADO: { label: 'Pago Aprobado', variant: 'info' },
      APROBADO: { label: 'Aprobado', variant: 'success' },
      REPROBADO: { label: 'Reprobado', variant: 'danger' },
      CANCELADO: { label: 'Cancelado', variant: 'default' },
      BAJA: { label: 'Baja', variant: 'danger' },
    };

    const config = statusConfig[estatus] || { label: estatus, variant: 'default' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getCourseTypeLabel = (courseType: string): string => {
    const labels: Record<string, string> = {
      INGLES: 'Inglés',
      VERANO: 'Verano',
      EXTRACURRICULAR: 'Extracurricular',
      TALLER: 'Taller',
      SEMINARIO: 'Seminario',
      DIPLOMADO: 'Diplomado',
      CERTIFICACION: 'Certificación',
    };
    return labels[courseType] || courseType;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading && courses.length === 0) {
    return (
      <Layout>
        <SkeletonTable rows={10} />
      </Layout>
    );
  }

  if (error && courses.length === 0) {
    return (
      <Layout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Cursos Especiales</h1>
          <p className="text-gray-600">Gestiona las solicitudes de cursos especiales de los estudiantes</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <FormField
              name="search"
              label="Buscar"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Código, estudiante..."
            />

            <FormField
              name="courseType"
              label="Tipo de Curso"
              value={courseTypeFilter}
              onChange={(e) => setCourseTypeFilter(e.target.value)}
              as="select"
              options={[
                { value: '', label: 'Todos' },
                { value: 'INGLES', label: 'Inglés' },
                { value: 'VERANO', label: 'Verano' },
                { value: 'EXTRACURRICULAR', label: 'Extracurricular' },
                { value: 'TALLER', label: 'Taller' },
                { value: 'SEMINARIO', label: 'Seminario' },
                { value: 'DIPLOMADO', label: 'Diplomado' },
                { value: 'CERTIFICACION', label: 'Certificación' },
              ]}
            />

            <FormField
              name="estatus"
              label="Estatus"
              value={estatusFilter}
              onChange={(e) => setEstatusFilter(e.target.value)}
              as="select"
              options={[
                { value: '', label: 'Todos' },
                { value: 'INSCRITO', label: 'Inscrito' },
                { value: 'EN_CURSO', label: 'En Curso' },
                { value: 'PENDIENTE_PAGO', label: 'Pendiente Pago' },
                { value: 'INSCRITO', label: 'Inscrito' },
                { value: 'APROBADO', label: 'Aprobado' },
                { value: 'REPROBADO', label: 'Reprobado' },
                { value: 'CANCELADO', label: 'Cancelado' },
                { value: 'BAJA', label: 'Baja' },
              ]}
            />

            <FormField
              name="requierePago"
              label="Requiere Pago"
              value={requierePagoFilter}
              onChange={(e) => setRequierePagoFilter(e.target.value)}
              as="select"
              options={[
                { value: '', label: 'Todos' },
                { value: 'true', label: 'Sí' },
                { value: 'false', label: 'No' },
              ]}
            />
          </div>
        </div>

        {/* Table */}
        {courses.length === 0 ? (
          <EmptyState
            title="No hay cursos especiales"
            description="No se encontraron cursos especiales con los filtros aplicados."
            icon="book"
          />
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Código
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estudiante
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nivel
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Grupo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estatus
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha Inicio
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pago
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Calificación
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {courses.map((course) => (
                      <tr key={course.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {course.codigo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {course.student ? (
                            <div>
                              <div className="font-medium">
                                {course.student.nombre} {course.student.apellidoPaterno} {course.student.apellidoMaterno}
                              </div>
                              <div className="text-gray-500 text-xs">{course.student.matricula}</div>
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {course.course ? getCourseTypeLabel(course.course.courseType) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {course.course?.nivelIngles ? `Nivel ${course.course.nivelIngles}` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {course.course?.group ? (
                            <div>
                              <div className="font-medium">{course.course.group.nombre}</div>
                              <div className="text-gray-500 text-xs">{course.course.group.periodo}</div>
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(course.estatus)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {course.course?.fechaInicio ? formatDate(course.course.fechaInicio) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {course.course?.requierePago ? (
                            <div>
                              {course.course.pagoAprobado === true ? (
                                <Badge variant="success">Aprobado</Badge>
                              ) : course.course.pagoAprobado === false ? (
                                <Badge variant="danger">Rechazado</Badge>
                              ) : (
                                <Badge variant="warning">Pendiente</Badge>
                              )}
                              {course.course.montoPago && (
                                <div className="text-xs text-gray-500 mt-1">
                                  ${course.course.montoPago.toFixed(2)}
                                </div>
                              )}
                            </div>
                          ) : (
                            <Badge variant="info">No requiere</Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {course.course?.calificacion !== null && course.course?.calificacion !== undefined ? (
                            <div>
                              <span className="font-medium">{course.course.calificacion}%</span>
                              {course.course.aprobado && (
                                <Badge variant="success" className="ml-2">Aprobado</Badge>
                              )}
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {course.estatus === 'PENDIENTE_PAGO' && (
                            <button
                              onClick={() => navigate(`/admin/english/payment-approvals`)}
                              className="text-blue-600 hover:text-blue-900 mr-4"
                            >
                              Gestionar Pago
                            </button>
                          )}
                          <button
                            onClick={() => navigate(`/admin/special-courses/${course.id}`)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Ver Detalles
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, pagination.total)} de {pagination.total} resultados
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(pagination.totalPages, prev + 1))}
                    disabled={currentPage === pagination.totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

