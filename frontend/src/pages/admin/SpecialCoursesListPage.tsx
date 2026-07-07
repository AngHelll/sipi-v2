// Special Courses List Page - Admin can view and manage special course requests
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { specialCoursesApi } from '../../lib/api';
import { Badge, SkeletonTable, EmptyState, FormField } from '../../components/ui';
import { ds } from '../../lib/designSystem';

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

interface WaitlistSummary {
  total: number;
  demand: Array<{ courseType: string; nivelIngles: number | null; count: number }>;
}

export const SpecialCoursesListPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [courses, setCourses] = useState<SpecialCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<SpecialCoursesListResponse['pagination'] | null>(null);
  const [waitlist, setWaitlist] = useState<WaitlistSummary | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [courseTypeFilter, setCourseTypeFilter] = useState('');
  const [estatusFilter, setEstatusFilter] = useState(searchParams.get('estatus') || '');
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

  useEffect(() => {
    specialCoursesApi
      .getWaitlistSummary()
      .then(setWaitlist)
      .catch((err) => console.error('Error fetching waitlist summary:', err));
  }, []);

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
      LISTA_ESPERA: { label: 'Lista de Espera', variant: 'info' },
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
          <div className={`${ds.banner.error} px-4 py-3 rounded-lg`}>
            {error}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={ds.admin.pageShell}>
        <div className="mb-8">
          <h1 className={ds.admin.pageTitle}>Cursos Especiales</h1>
          <p className={ds.admin.pageSubtitle}>Gestiona las solicitudes de cursos especiales de los estudiantes</p>
        </div>

        {waitlist && waitlist.total > 0 && (
          <div className={`mb-6 ${ds.admin.waitlistBanner}`}>
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h2 className={`${ds.admin.waitlistTitle} mb-1`}>
                  Lista de espera: {waitlist.total} solicitud{waitlist.total === 1 ? '' : 'es'} sin grupo
                </h2>
                <div className="flex flex-wrap gap-2 mt-2">
                  {waitlist.demand.map((d) => (
                    <Badge key={`${d.courseType}-${d.nivelIngles}`} variant="info">
                      {getCourseTypeLabel(d.courseType)}
                      {d.nivelIngles ? ` Nivel ${d.nivelIngles}` : ''}: {d.count} interesado{d.count === 1 ? '' : 's'}
                    </Badge>
                  ))}
                </div>
                <p className={ds.admin.waitlistHint}>
                  Si hay suficientes interesados, crea un grupo del nivel y asígnalos desde el detalle de cada solicitud.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEstatusFilter('LISTA_ESPERA')}
                  className={ds.admin.btnSmPrimary}
                >
                  Ver solicitudes
                </button>
                <button
                  onClick={() => navigate('/admin/groups/new')}
                  className={ds.admin.btnSmSecondary}
                >
                  Crear grupo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className={ds.admin.filterPanel}>
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
                // Otros SpecialCourseType (verano, taller, etc.) viven solo en schema:
                // no se exponen en la UI hasta que tengan caso de negocio (Capa 0).
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
                { value: 'LISTA_ESPERA', label: 'Lista de Espera' },
                { value: 'INSCRITO', label: 'Inscrito' },
                { value: 'EN_CURSO', label: 'En Curso' },
                { value: 'PENDIENTE_PAGO', label: 'Pendiente Pago' },
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
            <div className={ds.admin.tableWrap}>
              <div className="overflow-x-auto">
                <table className={ds.admin.table}>
                  <thead className={ds.admin.thead}>
                    <tr>
                      <th className={ds.admin.th}>
                        Código
                      </th>
                      <th className={ds.admin.th}>
                        Estudiante
                      </th>
                      <th className={ds.admin.th}>
                        Tipo
                      </th>
                      <th className={ds.admin.th}>
                        Nivel
                      </th>
                      <th className={ds.admin.th}>
                        Grupo
                      </th>
                      <th className={ds.admin.th}>
                        Estatus
                      </th>
                      <th className={ds.admin.th}>
                        Fecha Inicio
                      </th>
                      <th className={ds.admin.th}>
                        Pago
                      </th>
                      <th className={ds.admin.th}>
                        Calificación
                      </th>
                      <th className={ds.admin.th}>
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className={ds.admin.tbody}>
                    {courses.map((course) => (
                      <tr key={course.id} className={ds.admin.trHover}>
                        <td className={`${ds.admin.td} font-medium`}>
                          {course.codigo}
                        </td>
                        <td className={ds.admin.td}>
                          {course.student ? (
                            <div>
                              <div className="font-medium">
                                {course.student.nombre} {course.student.apellidoPaterno} {course.student.apellidoMaterno}
                              </div>
                              <div className="text-on-surface-variant text-xs">{course.student.matricula}</div>
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className={ds.admin.td}>
                          {course.course ? getCourseTypeLabel(course.course.courseType) : '-'}
                        </td>
                        <td className={ds.admin.td}>
                          {course.course?.nivelIngles ? `Nivel ${course.course.nivelIngles}` : '-'}
                        </td>
                        <td className={ds.admin.td}>
                          {course.course?.group ? (
                            <div>
                              <div className="font-medium">{course.course.group.nombre}</div>
                              <div className="text-on-surface-variant text-xs">{course.course.group.periodo}</div>
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className={ds.admin.td}>
                          {getStatusBadge(course.estatus)}
                        </td>
                        <td className={ds.admin.td}>
                          {course.course?.fechaInicio ? formatDate(course.course.fechaInicio) : '-'}
                        </td>
                        <td className={ds.admin.td}>
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
                                <div className="text-xs text-on-surface-variant mt-1">
                                  ${course.course.montoPago.toFixed(2)}
                                </div>
                              )}
                            </div>
                          ) : (
                            <Badge variant="info">No requiere</Badge>
                          )}
                        </td>
                        <td className={ds.admin.td}>
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
                        <td className={`${ds.admin.td} font-medium`}>
                          {course.estatus === 'PENDIENTE_PAGO' && (
                            <button
                              onClick={() => navigate(`/admin/english/payment-approvals`)}
                              className={`${ds.admin.actionLink} mr-4`}
                            >
                              Gestionar Pago
                            </button>
                          )}
                          <button
                            onClick={() => navigate(`/admin/special-courses/${course.id}`)}
                            className={ds.admin.actionLink}
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
                <div className={ds.admin.paginationText}>
                  Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, pagination.total)} de {pagination.total} resultados
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={ds.admin.paginationBtn}
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(pagination.totalPages, prev + 1))}
                    disabled={currentPage === pagination.totalPages}
                    className={ds.admin.paginationBtn}
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

