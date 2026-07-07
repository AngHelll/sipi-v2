// Groups list page for ADMIN/TEACHER/STUDENT with filters, search, and pagination
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { groupsApi, subjectsApi, exportApi, enrollmentsApi } from '../../lib/api';
import { fetchUniqueGroupPeriods } from '../../lib/groupPeriods';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ConfirmDialog, Loader, GroupCard, Icon } from '../../components/ui';
import { ds } from '../../lib/designSystem';
import { UserRole } from '../../types';
import type { Group, GroupsListResponse, Subject } from '../../types';

/** Agrupaciones de estatus para administrar cursos vigentes vs. cerrados. */
const ESTATUS_FILTER_MAP: Record<string, string | undefined> = {
  vigentes: 'ABIERTO,EN_CURSO',
  cerrados: 'CERRADO,FINALIZADO',
  cancelados: 'CANCELADO',
  todos: undefined,
};

export const GroupsListPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<GroupsListResponse['pagination'] | null>(null);
  const isAdmin = user?.role === UserRole.ADMIN;
  const isTeacher = user?.role === UserRole.TEACHER;
  
  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    groupId: string | null;
    groupName: string;
  }>({
    isOpen: false,
    groupId: null,
    groupName: '',
  });

  // Close-course confirmation state
  const [closeConfirm, setCloseConfirm] = useState<{
    isOpen: boolean;
    groupId: string | null;
    groupName: string;
    pendingCount: number;
  }>({ isOpen: false, groupId: null, groupName: '', pendingCount: 0 });

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [periodoFilter, setPeriodoFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [estatusFilter, setEstatusFilter] = useState('vigentes');
  const [tipoFilter, setTipoFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy] = useState<'nombre' | 'periodo'>('nombre');
  const [sortOrder] = useState<'asc' | 'desc'>('asc');

  // Options for filters
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [uniquePeriodos, setUniquePeriodos] = useState<string[]>([]);

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
    fetchGroups();
  }, [debouncedSearchTerm, periodoFilter, subjectFilter, estatusFilter, tipoFilter, currentPage, pageSize, sortBy, sortOrder]);

  // Fetch filter options on mount
  useEffect(() => {
    if (isAdmin) {
      fetchFilterOptions();
    }
  }, [isAdmin]);

  const fetchFilterOptions = async () => {
    try {
      const [subjectsRes, periodos] = await Promise.all([
        subjectsApi.getAll({ limit: 100, page: 1 }),
        fetchUniqueGroupPeriods(),
      ]);
      setSubjects(subjectsRes.subjects);
      setUniquePeriodos(periodos);
    } catch (err) {
      console.error('Error fetching filter options:', err);
      setSubjects([]);
      setUniquePeriodos([]);
    }
  };

  const fetchGroups = async () => {
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
      if (periodoFilter) {
        params.periodo = periodoFilter;
      }
      if (subjectFilter) {
        params.subjectId = subjectFilter;
      }
      // Los filtros de estatus/tipo solo aplican en la vista admin.
      if (isAdmin) {
        if (estatusFilter === 'eliminados') {
          params.eliminados = true;
        } else {
          const estatusParam = ESTATUS_FILTER_MAP[estatusFilter];
          if (estatusParam) {
            params.estatus = estatusParam;
          }
        }
        if (tipoFilter === 'ingles') {
          params.esCursoIngles = true;
        } else if (tipoFilter === 'regulares') {
          params.esCursoIngles = false;
        }
      }

      const response = await groupsApi.getAll(params);
      setGroups(response.groups);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar los grupos');
      console.error('Error fetching groups:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (id: string) => {
    if (isAdmin) {
      navigate(`/admin/groups/${id}`);
    } else if (isTeacher) {
      // El maestro tiene su propia vista de detalle (solo lectura) del grupo.
      navigate(`/teacher/groups/${id}`);
    }
    // Alumno: las tarjetas no son navegables (no existe vista de detalle para su rol).
  };

  const handleEdit = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    navigate(`/admin/groups/${id}/edit`);
  };

  const handleDuplicate = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    navigate(`/admin/groups/new?from=${id}`);
  };

  const handleCloseClick = async (group: Group) => {
    // Avisa si quedan alumnos de la cohorte activa sin calificar antes de cerrar.
    let pendingCount = 0;
    try {
      const res = await enrollmentsApi.getByGroup(group.id);
      pendingCount = res.enrollments.filter(
        (e: any) =>
          (e.calificacion === null || e.calificacion === undefined) &&
          (e.calificacionFinal === null || e.calificacionFinal === undefined)
      ).length;
    } catch (err) {
      console.error('Error checking pending grades before closing:', err);
    }
    setCloseConfirm({
      isOpen: true,
      groupId: group.id,
      groupName: `${group.nombre} - ${group.subject?.nombre || 'N/A'} (${group.periodo})`,
      pendingCount,
    });
  };

  const handleCloseConfirm = async () => {
    if (!closeConfirm.groupId) return;
    try {
      await groupsApi.update(closeConfirm.groupId, { estatus: 'FINALIZADO' });
      showToast('Curso cerrado correctamente', 'success');
      setCloseConfirm({ isOpen: false, groupId: null, groupName: '', pendingCount: 0 });
      fetchGroups();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Error al cerrar el curso';
      showToast(errorMessage, 'error');
      console.error('Error closing group:', err);
    }
  };

  const handleCloseCancel = () => {
    setCloseConfirm({ isOpen: false, groupId: null, groupName: '', pendingCount: 0 });
  };

  const handleRestore = async (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    try {
      await groupsApi.restore(id);
      showToast('Grupo restaurado correctamente', 'success');
      fetchGroups();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Error al restaurar el grupo';
      showToast(errorMessage, 'error');
      console.error('Error restoring group:', err);
    }
  };

  const handleNewGroup = () => {
    navigate('/admin/groups/new');
  };

  const handleNewEnrollment = () => {
    navigate('/admin/enrollments/new');
  };

  const handleDeleteClick = (group: Group) => {
    setDeleteConfirm({
      isOpen: true,
      groupId: group.id,
      groupName: `${group.nombre} - ${group.subject?.nombre || 'N/A'} (${group.periodo})`,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.groupId) return;

    try {
      await groupsApi.delete(deleteConfirm.groupId);
      showToast('Grupo eliminado correctamente', 'success');
      setDeleteConfirm({ isOpen: false, groupId: null, groupName: '' });
      fetchGroups();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Error al eliminar el grupo';
      showToast(errorMessage, 'error');
      console.error('Error deleting group:', err);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ isOpen: false, groupId: null, groupName: '' });
  };

  const handleExport = async () => {
    if (!isAdmin) return;
    
    try {
      const filters: any = {};
      if (periodoFilter) filters.periodo = periodoFilter;
      if (subjectFilter) filters.subjectId = subjectFilter;

      const blob = await exportApi.exportGroups(filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `grupos_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToast('Archivo Excel descargado correctamente', 'success');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Error al exportar los datos';
      showToast(errorMessage, 'error');
      console.error('Error exporting groups:', err);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setPeriodoFilter('');
    setSubjectFilter('');
    setEstatusFilter('vigentes');
    setTipoFilter('');
    setCurrentPage(1);
  };


  const hasActiveFilters = periodoFilter || subjectFilter || estatusFilter !== 'vigentes' || tipoFilter;

  // Filter groups by search term (client-side for now)
  const filteredGroups = debouncedSearchTerm.trim()
    ? groups.filter(
        (group) =>
          group.nombre.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          group.subject?.nombre.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          group.teacher?.nombre.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      )
    : groups;

  return (
    <Layout>
      <div className={ds.admin.pageShellCompact}>
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className={ds.admin.pageTitle}>Grupos</h1>
          {isAdmin && (
            <div className="flex gap-3">
              <button
                onClick={handleExport}
                className={`${ds.btn.secondary} flex items-center gap-2`}
                title="Exportar a Excel"
              >
                <Icon name="export" size={20} />
                Exportar Excel
              </button>
              <button
                onClick={handleNewEnrollment}
                className={`${ds.admin.btnSmAssign} px-4 py-2 flex items-center gap-2`}
              >
                <Icon name="plus" size={20} />
                Nueva Inscripción
              </button>
              <button
                onClick={handleNewGroup}
                className={`${ds.btn.primary} flex items-center gap-2`}
              >
                <Icon name="plus" size={20} />
                Nuevo Grupo
              </button>
            </div>
          )}
        </div>

        {/* Filters */}
        {isAdmin && (
          <div className={ds.admin.filterPanel}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div>
                <label className={ds.admin.filterLabel}>
                  Buscar
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nombre, materia o maestro..."
                  className={ds.admin.input}
                />
              </div>

              {/* Periodo filter */}
              <div>
                <label className={ds.admin.filterLabel}>
                  Período
                </label>
                <select
                  value={periodoFilter}
                  onChange={(e) => {
                    setPeriodoFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className={ds.admin.input}
                >
                  <option value="">Todos</option>
                  {uniquePeriodos.map((periodo) => (
                    <option key={periodo} value={periodo}>
                      {periodo}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject filter */}
              <div>
                <label className={ds.admin.filterLabel}>
                  Materia
                </label>
                <select
                  value={subjectFilter}
                  onChange={(e) => {
                    setSubjectFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className={ds.admin.input}
                >
                  <option value="">Todas</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.clave} - {subject.nombre}
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
                  <option value="vigentes">Vigentes (abiertos y en curso)</option>
                  <option value="cerrados">Cerrados / finalizados</option>
                  <option value="cancelados">Cancelados</option>
                  <option value="todos">Todos (activos)</option>
                  <option value="eliminados">Eliminados (historial)</option>
                </select>
              </div>

              {/* Tipo filter */}
              <div>
                <label className={ds.admin.filterLabel}>
                  Tipo
                </label>
                <select
                  value={tipoFilter}
                  onChange={(e) => {
                    setTipoFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className={ds.admin.input}
                >
                  <option value="">Todos</option>
                  <option value="ingles">Solo cursos de inglés</option>
                  <option value="regulares">Solo materias regulares</option>
                </select>
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
        )}

        {/* Error message */}
        {error && (
          <div className={ds.admin.errorBox}>
            {error}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader variant="spinner" size="lg" text="Cargando grupos..." />
          </div>
        )}

        {/* Groups table */}
        {!loading && !error && (
          <div className={ds.admin.tableWrap}>
            {filteredGroups.length === 0 ? (
              <div className={`text-center py-12 ${ds.semantic.mutedText}`}>
                {hasActiveFilters || debouncedSearchTerm ? 'No se encontraron grupos con los filtros aplicados' : 'No hay grupos registrados'}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4">
                  {filteredGroups.map((group) => {
                    const isHistory = estatusFilter === 'eliminados';
                    return (
                      <GroupCard
                        key={group.id}
                        group={group}
                        onClick={!isHistory && (isAdmin || isTeacher) ? () => handleView(group.id) : undefined}
                        onEdit={isAdmin && !isHistory ? (e) => handleEdit(group.id, e) : undefined}
                        onDuplicate={isAdmin && !isHistory ? (e) => handleDuplicate(group.id, e) : undefined}
                        onClose={isAdmin && !isHistory && (group.estatus === 'ABIERTO' || group.estatus === 'EN_CURSO')
                          ? (e) => { e.stopPropagation(); handleCloseClick(group); }
                          : undefined}
                        onRestore={isAdmin && isHistory ? (e) => handleRestore(group.id, e) : undefined}
                        onDelete={isAdmin && !isHistory ? (e) => {
                          e.stopPropagation();
                          handleDeleteClick(group);
                        } : undefined}
                      />
                    );
                  })}
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className={ds.admin.paginationFooter}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className={ds.admin.paginationText}>
                          Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, pagination.total)} de {pagination.total} grupos
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
      {isAdmin && (
        <ConfirmDialog
          isOpen={deleteConfirm.isOpen}
          title="Eliminar Grupo"
          message={`¿Estás seguro de que deseas eliminar el grupo "${deleteConfirm.groupName}"? Esta acción no se puede deshacer y también eliminará todas las inscripciones asociadas.`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          variant="danger"
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}

      {/* Close-course Confirmation Dialog */}
      {isAdmin && (
        <ConfirmDialog
          isOpen={closeConfirm.isOpen}
          title="Cerrar curso"
          message={`${
            closeConfirm.pendingCount > 0
              ? `⚠️ Hay ${closeConfirm.pendingCount} alumno(s) sin calificar. `
              : ''
          }¿Cerrar el curso "${closeConfirm.groupName}"? Pasará a FINALIZADO: dejará de aparecer entre los vigentes y no admitirá nuevas inscripciones.${
            closeConfirm.pendingCount > 0
              ? ' Te recomendamos calificar a todos antes de cerrarlo.'
              : ''
          }`}
          confirmText="Cerrar curso"
          cancelText="Cancelar"
          variant="warning"
          onConfirm={handleCloseConfirm}
          onCancel={handleCloseCancel}
        />
      )}
    </Layout>
  );
};
