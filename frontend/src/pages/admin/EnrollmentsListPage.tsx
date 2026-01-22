// Enrollments list page for ADMIN with filters, search, and pagination
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { enrollmentsApi, studentsApi, groupsApi } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { ConfirmDialog, Badge, Icon, SkeletonTable, EmptyState, GradeDisplay, PartialGradesDisplay, AttendanceDisplay } from '../../components/ui';
import type { Enrollment, EnrollmentsListResponse, Student, Group } from '../../types';

export const EnrollmentsListPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<EnrollmentsListResponse['pagination'] | null>(null);
  
  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    enrollmentId: string | null;
    enrollmentName: string;
  }>({
    isOpen: false,
    enrollmentId: null,
    enrollmentName: '',
  });

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [studentIdFilter, setStudentIdFilter] = useState('');
  const [groupIdFilter, setGroupIdFilter] = useState('');
  const [estatusFilter, setEstatusFilter] = useState('');
  const [tipoInscripcionFilter, setTipoInscripcionFilter] = useState('');
  const [aprobadoFilter, setAprobadoFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState<string>('fechaInscripcion');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Options for filters
  const [students, setStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Column visibility
  const [showCalificacionesParciales, setShowCalificacionesParciales] = useState(false);
  const [showAsistencia, setShowAsistencia] = useState(true);

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
    fetchOptions();
  }, []);

  useEffect(() => {
    fetchEnrollments();
  }, [debouncedSearchTerm, studentIdFilter, groupIdFilter, estatusFilter, tipoInscripcionFilter, aprobadoFilter, currentPage, pageSize, sortBy, sortOrder]);

  const fetchOptions = async () => {
    try {
      setLoadingOptions(true);
      const [studentsRes, groupsRes] = await Promise.all([
        studentsApi.getAll({ limit: 100 }),
        groupsApi.getAll({ limit: 100 }),
      ]);
      setStudents(studentsRes.students);
      setGroups(groupsRes.groups);
    } catch (err: any) {
      console.error('Error fetching options:', err);
    } finally {
      setLoadingOptions(false);
    }
  };

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = {
        page: currentPage,
        limit: pageSize,
        sortBy,
        sortOrder,
      };

      // Add filters
      if (studentIdFilter) {
        params.studentId = studentIdFilter;
      }
      if (groupIdFilter) {
        params.groupId = groupIdFilter;
      }
      if (estatusFilter) {
        params.estatus = estatusFilter;
      }
      if (tipoInscripcionFilter) {
        params.tipoInscripcion = tipoInscripcionFilter;
      }
      if (aprobadoFilter !== '') {
        params.aprobado = aprobadoFilter === 'true';
      }

      const response = await enrollmentsApi.getAll(params);
      setEnrollments(response.enrollments);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(
        err.response?.data?.error || 'Error al cargar las inscripciones'
      );
      console.error('Error fetching enrollments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (enrollmentId: string) => {
    navigate(`/admin/enrollments/${enrollmentId}/edit`);
  };

  const handleDeleteClick = (enrollment: Enrollment) => {
    const studentName = enrollment.student 
      ? `${enrollment.student.nombre} ${enrollment.student.apellidoPaterno}`
      : 'Estudiante';
    const subjectName = enrollment.group?.subject?.nombre || 'Materia';
    
    setDeleteConfirm({
      isOpen: true,
      enrollmentId: enrollment.id,
      enrollmentName: `${studentName} - ${subjectName}`,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.enrollmentId) return;

    try {
      await enrollmentsApi.delete(deleteConfirm.enrollmentId);
      showToast('Inscripción eliminada correctamente', 'success');
      setDeleteConfirm({ isOpen: false, enrollmentId: null, enrollmentName: '' });
      fetchEnrollments();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Error al eliminar la inscripción';
      showToast(errorMessage, 'error');
      console.error('Error deleting enrollment:', err);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ isOpen: false, enrollmentId: null, enrollmentName: '' });
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStudentIdFilter('');
    setGroupIdFilter('');
    setEstatusFilter('');
    setTipoInscripcionFilter('');
    setAprobadoFilter('');
    setCurrentPage(1);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getStatusBadgeVariant = (estatus?: string): 'success' | 'warning' | 'info' | 'default' | 'danger' => {
    switch (estatus) {
      case 'INSCRITO':
        return 'info';
      case 'EN_CURSO':
        return 'success';
      case 'APROBADO':
        return 'success';
      case 'REPROBADO':
        return 'danger';
      case 'BAJA':
        return 'warning';
      case 'CANCELADO':
        return 'default';
      default:
        return 'default';
    }
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) {
      return <Icon name="filter" size={16} className="text-gray-400" />;
    }
    return sortOrder === 'asc' ? (
      <Icon name="chevron-up" size={16} className="text-blue-600" />
    ) : (
      <Icon name="chevron-down" size={16} className="text-blue-600" />
    );
  };

  const hasActiveFilters = searchTerm || studentIdFilter || groupIdFilter || estatusFilter || tipoInscripcionFilter || aprobadoFilter;

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Lista de Inscripciones</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin/enrollments/new')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2 shadow-md hover:shadow-lg"
            >
              <Icon name="plus" size={20} />
              Nueva Inscripción
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buscar
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por estudiante o materia..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Estudiante filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estudiante
              </label>
              <select
                value={studentIdFilter}
                onChange={(e) => {
                  setStudentIdFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loadingOptions}
              >
                <option value="">Todos</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.matricula} - {student.nombre} {student.apellidoPaterno}
                  </option>
                ))}
              </select>
            </div>

            {/* Grupo filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grupo
              </label>
              <select
                value={groupIdFilter}
                onChange={(e) => {
                  setGroupIdFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loadingOptions}
              >
                <option value="">Todos</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.nombre} - {group.subject?.nombre || 'N/A'}
                  </option>
                ))}
              </select>
            </div>

            {/* Estatus filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estatus
              </label>
              <select
                value={estatusFilter}
                onChange={(e) => {
                  setEstatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos</option>
                <option value="INSCRITO">INSCRITO</option>
                <option value="EN_CURSO">EN CURSO</option>
                <option value="APROBADO">APROBADO</option>
                <option value="REPROBADO">REPROBADO</option>
                <option value="BAJA">BAJA</option>
                <option value="CANCELADO">CANCELADO</option>
              </select>
            </div>

            {/* Tipo de Inscripción filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Inscripción
              </label>
              <select
                value={tipoInscripcionFilter}
                onChange={(e) => {
                  setTipoInscripcionFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos</option>
                <option value="NORMAL">NORMAL</option>
                <option value="ESPECIAL">ESPECIAL</option>
                <option value="REPETICION">REPETICIÓN</option>
                <option value="EQUIVALENCIA">EQUIVALENCIA</option>
              </select>
            </div>

            {/* Aprobado filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Aprobado
              </label>
              <select
                value={aprobadoFilter}
                onChange={(e) => {
                  setAprobadoFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos</option>
                <option value="true">Aprobado</option>
                <option value="false">Reprobado</option>
              </select>
            </div>
          </div>

          {/* Column visibility toggle */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Columnas visibles:
            </label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={showCalificacionesParciales}
                  onChange={(e) => setShowCalificacionesParciales(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                Calificaciones Parciales
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={showAsistencia}
                  onChange={(e) => setShowAsistencia(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                Asistencia
              </label>
            </div>
          </div>

          {/* Clear filters button */}
          {hasActiveFilters && (
            <div className="mt-4">
              <button
                onClick={handleClearFilters}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Loading state */}
        {loading && <SkeletonTable rows={5} />}

        {/* Enrollments table */}
        {!loading && !error && (
          <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
            {enrollments.length === 0 ? (
              <EmptyState
                icon="enrollments"
                title={hasActiveFilters ? 'No se encontraron inscripciones' : 'No hay inscripciones registradas'}
                description={hasActiveFilters ? 'Intenta ajustar los filtros de búsqueda' : 'Comienza agregando una nueva inscripción'}
                action={
                  !hasActiveFilters && (
                    <button
                      onClick={() => navigate('/admin/enrollments/new')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Icon name="plus" size={16} />
                      Nueva Inscripción
                    </button>
                  )
                }
              />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estudiante
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Materia
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Grupo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estatus
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tipo
                        </th>
                        {showCalificacionesParciales && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Calificaciones
                          </th>
                        )}
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('calificacionFinal')}
                        >
                          <div className="flex items-center gap-2">
                            Calificación Final
                            {getSortIcon('calificacionFinal')}
                          </div>
                        </th>
                        {showAsistencia && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Asistencia
                          </th>
                        )}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Aprobado
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {enrollments.map((enrollment) => (
                        <tr
                          key={enrollment.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {enrollment.student?.matricula || '-'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {enrollment.student 
                                ? `${enrollment.student.nombre} ${enrollment.student.apellidoPaterno}`
                                : '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {enrollment.group?.subject?.nombre || '-'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {enrollment.group?.subject?.clave || '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {enrollment.group?.nombre || '-'} ({enrollment.group?.periodo || '-'})
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {enrollment.estatus ? (
                              <Badge variant={getStatusBadgeVariant(enrollment.estatus)}>
                                {enrollment.estatus.replace('_', ' ')}
                              </Badge>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {enrollment.tipoInscripcion ? enrollment.tipoInscripcion.replace('_', ' ') : '-'}
                          </td>
                          {showCalificacionesParciales && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <PartialGradesDisplay
                                p1={enrollment.calificacionParcial1}
                                p2={enrollment.calificacionParcial2}
                                p3={enrollment.calificacionParcial3}
                                final={enrollment.calificacionFinal}
                                showLabels={true}
                              />
                            </td>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <GradeDisplay
                              grade={enrollment.calificacionFinal || enrollment.calificacion}
                              size="sm"
                            />
                          </td>
                          {showAsistencia && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <AttendanceDisplay
                                asistencias={enrollment.asistencias || 0}
                                faltas={enrollment.faltas || 0}
                                retardos={enrollment.retardos || 0}
                                porcentaje={enrollment.porcentajeAsistencia}
                                showDetails={true}
                                showProgressBar={true}
                                size="sm"
                              />
                            </td>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap">
                            {enrollment.aprobado !== undefined && enrollment.aprobado !== null ? (
                              <Badge variant={enrollment.aprobado ? 'success' : 'danger'}>
                                {enrollment.aprobado ? 'Aprobado' : 'Reprobado'}
                              </Badge>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-3">
                              <button
                                onClick={() => handleEdit(enrollment.id)}
                                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Editar inscripción"
                              >
                                <Icon name="edit" size={18} />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(enrollment)}
                                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                                title="Eliminar inscripción"
                              >
                                <Icon name="delete" size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-700">
                          Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, pagination.total)} de {pagination.total} inscripciones
                        </span>
                        <select
                          value={pageSize}
                          onChange={(e) => {
                            setPageSize(parseInt(e.target.value, 10));
                            setCurrentPage(1);
                          }}
                          className="px-3 py-1 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value={10}>10 por página</option>
                          <option value={20}>20 por página</option>
                          <option value={50}>50 por página</option>
                          <option value={100}>100 por página</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1}
                          className="px-3 py-1 border border-gray-300 rounded-lg text-sm bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                        >
                          Primera
                        </button>
                        <button
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="px-3 py-1 border border-gray-300 rounded-lg text-sm bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                        >
                          Anterior
                        </button>
                        <span className="px-3 py-1 text-sm text-gray-700">
                          Página {currentPage} de {pagination.totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === pagination.totalPages}
                          className="px-3 py-1 border border-gray-300 rounded-lg text-sm bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                        >
                          Siguiente
                        </button>
                        <button
                          onClick={() => setCurrentPage(pagination.totalPages)}
                          disabled={currentPage === pagination.totalPages}
                          className="px-3 py-1 border border-gray-300 rounded-lg text-sm bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                        >
                          Última
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Eliminar Inscripción"
        message={`¿Estás seguro de que deseas eliminar la inscripción "${deleteConfirm.enrollmentName}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </Layout>
  );
};

