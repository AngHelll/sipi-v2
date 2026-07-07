// Enrollments list page for ADMIN with filters, search, and pagination
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { enrollmentsApi, studentsApi, groupsApi } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { ConfirmDialog, Badge, Icon, SkeletonTable, EmptyState, GradeDisplay, PartialGradesDisplay, AttendanceDisplay } from '../../components/ui';
import { ds } from '../../lib/designSystem';
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
      return <Icon name="filter" size={16} className={ds.admin.sortIconIdle} />;
    }
    return sortOrder === 'asc' ? (
      <Icon name="chevron-up" size={16} className={ds.admin.sortIconActive} />
    ) : (
      <Icon name="chevron-down" size={16} className={ds.admin.sortIconActive} />
    );
  };

  const hasActiveFilters = searchTerm || studentIdFilter || groupIdFilter || estatusFilter || tipoInscripcionFilter || aprobadoFilter;

  return (
    <Layout>
      <div className={ds.admin.pageShellCompact}>
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className={ds.admin.pageTitle}>Lista de Inscripciones</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin/enrollments/new')}
              className={`${ds.btn.primary} flex items-center gap-2 shadow-soft hover:shadow-medium`}
            >
              <Icon name="plus" size={20} />
              Nueva Inscripción
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className={ds.admin.filterPanel}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className={ds.admin.filterLabel}>
                Buscar
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por estudiante o materia..."
                className={ds.admin.input}
              />
            </div>

            {/* Estudiante filter */}
            <div>
              <label className={ds.admin.filterLabel}>
                Estudiante
              </label>
              <select
                value={studentIdFilter}
                onChange={(e) => {
                  setStudentIdFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className={ds.admin.input}
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
              <label className={ds.admin.filterLabel}>
                Grupo
              </label>
              <select
                value={groupIdFilter}
                onChange={(e) => {
                  setGroupIdFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className={ds.admin.input}
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
              <label className={ds.admin.filterLabel}>
                Estatus
              </label>
              <select
                value={estatusFilter}
                onChange={(e) => {
                  setEstatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className={ds.admin.input}
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
              <label className={ds.admin.filterLabel}>
                Tipo de Inscripción
              </label>
              <select
                value={tipoInscripcionFilter}
                onChange={(e) => {
                  setTipoInscripcionFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className={ds.admin.input}
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
              <label className={ds.admin.filterLabel}>
                Aprobado
              </label>
              <select
                value={aprobadoFilter}
                onChange={(e) => {
                  setAprobadoFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className={ds.admin.input}
              >
                <option value="">Todos</option>
                <option value="true">Aprobado</option>
                <option value="false">Reprobado</option>
              </select>
            </div>
          </div>

          {/* Column visibility toggle */}
          <div className={ds.admin.sectionDivider}>
            <label className={`${ds.admin.filterLabel} mb-2`}>
              Columnas visibles:
            </label>
            <div className="flex flex-wrap gap-4">
              <label className={`flex items-center gap-2 ${ds.admin.checkboxLabel}`}>
                <input
                  type="checkbox"
                  checked={showCalificacionesParciales}
                  onChange={(e) => setShowCalificacionesParciales(e.target.checked)}
                  className={ds.admin.checkbox}
                />
                Calificaciones Parciales
              </label>
              <label className={`flex items-center gap-2 ${ds.admin.checkboxLabel}`}>
                <input
                  type="checkbox"
                  checked={showAsistencia}
                  onChange={(e) => setShowAsistencia(e.target.checked)}
                  className={ds.admin.checkbox}
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
                className={ds.admin.clearFiltersLink}
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className={ds.admin.errorBox}>
            {error}
          </div>
        )}

        {/* Loading state */}
        {loading && <SkeletonTable rows={5} />}

        {/* Enrollments table */}
        {!loading && !error && (
          <div className={ds.admin.tableWrap}>
            {enrollments.length === 0 ? (
              <EmptyState
                icon="enrollments"
                title={hasActiveFilters ? 'No se encontraron inscripciones' : 'No hay inscripciones registradas'}
                description={hasActiveFilters ? 'Intenta ajustar los filtros de búsqueda' : 'Comienza agregando una nueva inscripción'}
                action={
                  !hasActiveFilters && (
                    <button
                      onClick={() => navigate('/admin/enrollments/new')}
                      className={`${ds.btn.primary} flex items-center gap-2`}
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
                  <table className={ds.admin.table}>
                    <thead className={ds.admin.thead}>
                      <tr>
                        <th className={ds.admin.th}>
                          Estudiante
                        </th>
                        <th className={ds.admin.th}>
                          Materia
                        </th>
                        <th className={ds.admin.th}>
                          Grupo
                        </th>
                        <th className={ds.admin.th}>
                          Estatus
                        </th>
                        <th className={ds.admin.th}>
                          Tipo
                        </th>
                        {showCalificacionesParciales && (
                          <th className={ds.admin.th}>
                            Calificaciones
                          </th>
                        )}
                        <th 
                          className={ds.admin.thSortable}
                          onClick={() => handleSort('calificacionFinal')}
                        >
                          <div className="flex items-center gap-2">
                            Calificación Final
                            {getSortIcon('calificacionFinal')}
                          </div>
                        </th>
                        {showAsistencia && (
                          <th className={ds.admin.th}>
                            Asistencia
                          </th>
                        )}
                        <th className={ds.admin.th}>
                          Aprobado
                        </th>
                        <th className={`${ds.admin.th} text-right`}>
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className={ds.admin.tbody}>
                      {enrollments.map((enrollment) => (
                        <tr
                          key={enrollment.id}
                          className={ds.admin.trHover}
                        >
                          <td className={ds.admin.td}>
                            <div className={ds.admin.tdStrong}>
                              {enrollment.student?.matricula || '-'}
                            </div>
                            <div className={ds.admin.tdMeta}>
                              {enrollment.student 
                                ? `${enrollment.student.nombre} ${enrollment.student.apellidoPaterno}`
                                : '-'}
                            </div>
                          </td>
                          <td className={ds.admin.td}>
                            <div className={ds.admin.tdStrong}>
                              {enrollment.group?.subject?.nombre || '-'}
                            </div>
                            <div className={ds.admin.tdMeta}>
                              {enrollment.group?.subject?.clave || '-'}
                            </div>
                          </td>
                          <td className={ds.admin.tdMuted}>
                            {enrollment.group?.nombre || '-'} ({enrollment.group?.periodo || '-'})
                          </td>
                          <td className={ds.admin.td}>
                            {enrollment.estatus ? (
                              <Badge variant={getStatusBadgeVariant(enrollment.estatus)}>
                                {enrollment.estatus.replace('_', ' ')}
                              </Badge>
                            ) : (
                              <span className={ds.semantic.mutedText}>-</span>
                            )}
                          </td>
                          <td className={ds.admin.tdMuted}>
                            {enrollment.tipoInscripcion ? enrollment.tipoInscripcion.replace('_', ' ') : '-'}
                          </td>
                          {showCalificacionesParciales && (
                            <td className={ds.admin.td}>
                              <PartialGradesDisplay
                                p1={enrollment.calificacionParcial1}
                                p2={enrollment.calificacionParcial2}
                                p3={enrollment.calificacionParcial3}
                                final={enrollment.calificacionFinal}
                                showLabels={true}
                              />
                            </td>
                          )}
                          <td className={ds.admin.td}>
                            <GradeDisplay
                              grade={enrollment.calificacionFinal || enrollment.calificacion}
                              size="sm"
                            />
                          </td>
                          {showAsistencia && (
                            <td className={ds.admin.td}>
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
                          <td className={ds.admin.td}>
                            {enrollment.aprobado !== undefined && enrollment.aprobado !== null ? (
                              <Badge variant={enrollment.aprobado ? 'success' : 'danger'}>
                                {enrollment.aprobado ? 'Aprobado' : 'Reprobado'}
                              </Badge>
                            ) : (
                              <span className={ds.semantic.mutedText}>-</span>
                            )}
                          </td>
                          <td className={`${ds.admin.td} text-right font-medium`}>
                            <div className="flex items-center justify-end gap-3">
                              <button
                                onClick={() => handleEdit(enrollment.id)}
                                className={`p-2 ${ds.admin.actionLink} hover:bg-surface-container rounded-lg transition-colors`}
                                title="Editar inscripción"
                              >
                                <Icon name="edit" size={18} />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(enrollment)}
                                className={`p-2 ${ds.admin.actionLinkDanger} hover:bg-error-container rounded-lg transition-colors`}
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
                  <div className={ds.admin.paginationFooter}>
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-4">
                        <span className={ds.admin.paginationText}>
                          Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, pagination.total)} de {pagination.total} inscripciones
                        </span>
                        <select
                          value={pageSize}
                          onChange={(e) => {
                            setPageSize(parseInt(e.target.value, 10));
                            setCurrentPage(1);
                          }}
                          className={`${ds.admin.paginationBtn} text-sm`}
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
                          className={`${ds.admin.paginationBtn} text-sm`}
                        >
                          Primera
                        </button>
                        <button
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          className={`${ds.admin.paginationBtn} text-sm`}
                        >
                          Anterior
                        </button>
                        <span className={`${ds.admin.paginationText} px-3 py-1`}>
                          Página {currentPage} de {pagination.totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === pagination.totalPages}
                          className={`${ds.admin.paginationBtn} text-sm`}
                        >
                          Siguiente
                        </button>
                        <button
                          onClick={() => setCurrentPage(pagination.totalPages)}
                          disabled={currentPage === pagination.totalPages}
                          className={`${ds.admin.paginationBtn} text-sm`}
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

