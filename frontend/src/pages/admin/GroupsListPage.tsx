// Groups list page for ADMIN/TEACHER/STUDENT with filters, search, and pagination
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { groupsApi, subjectsApi, exportApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ConfirmDialog, CapacityIndicator, Loader, GroupCard } from '../../components/ui';
import { UserRole } from '../../types';
import type { Group, GroupsListResponse, Subject } from '../../types';

export const GroupsListPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<GroupsListResponse['pagination'] | null>(null);
  const isAdmin = user?.role === UserRole.ADMIN;
  
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

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [periodoFilter, setPeriodoFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState<'nombre' | 'periodo'>('nombre');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

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
  }, [debouncedSearchTerm, periodoFilter, subjectFilter, currentPage, pageSize, sortBy, sortOrder]);

  // Fetch filter options on mount
  useEffect(() => {
    if (isAdmin) {
      fetchFilterOptions();
    }
  }, [isAdmin]);

  const fetchFilterOptions = async () => {
    try {
      // Fetch all pages for subjects
      // Add delay between requests to avoid rate limiting
      const allSubjects: any[] = [];
      let subjectsPage = 1;
      let subjectsHasMore = true;

      while (subjectsHasMore) {
        const subjectsRes = await subjectsApi.getAll({ limit: 100, page: subjectsPage });
        allSubjects.push(...subjectsRes.subjects);
        subjectsHasMore = subjectsPage < subjectsRes.pagination.totalPages;
        subjectsPage++;
        
        // Add small delay between requests to avoid rate limiting
        if (subjectsHasMore) {
          await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
        }
      }

      // Fetch all pages for groups to get unique periodos
      const allGroups: any[] = [];
      let groupsPage = 1;
      let groupsHasMore = true;

      while (groupsHasMore) {
        const groupsRes = await groupsApi.getAll({ limit: 100, page: groupsPage });
        allGroups.push(...groupsRes.groups);
        groupsHasMore = groupsPage < groupsRes.pagination.totalPages;
        groupsPage++;
        
        // Add small delay between requests to avoid rate limiting
        if (groupsHasMore) {
          await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
        }
      }

      setSubjects(allSubjects);
      const periodos = [...new Set(allGroups.map(g => g.periodo))].sort().reverse();
      setUniquePeriodos(periodos);
    } catch (err) {
      console.error('Error fetching filter options:', err);
      // Fallback: try with just first page
      try {
        const [subjectsRes, groupsRes] = await Promise.all([
          subjectsApi.getAll({ limit: 100, page: 1 }),
          groupsApi.getAll({ limit: 100, page: 1 }),
        ]);
        setSubjects(subjectsRes.subjects);
        const periodos = [...new Set(groupsRes.groups.map(g => g.periodo))].sort().reverse();
        setUniquePeriodos(periodos);
      } catch (fallbackErr) {
        console.error('Error fetching filter options (fallback):', fallbackErr);
      }
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
    navigate(`/admin/groups/${id}`);
  };

  const handleEdit = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    navigate(`/admin/groups/${id}/edit`);
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
    setCurrentPage(1);
  };


  const hasActiveFilters = periodoFilter || subjectFilter;

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
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Grupos</h1>
          {isAdmin && (
            <div className="flex gap-3">
              <button
                onClick={handleExport}
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
                title="Exportar a Excel"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Exportar Excel
              </button>
              <button
                onClick={handleNewEnrollment}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nueva Inscripción
              </button>
              <button
                onClick={handleNewGroup}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nuevo Grupo
              </button>
            </div>
          )}
        </div>

        {/* Filters */}
        {isAdmin && (
          <div className="bg-white rounded-lg shadow p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Buscar
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nombre, materia o maestro..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Periodo filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Período
                </label>
                <select
                  value={periodoFilter}
                  onChange={(e) => {
                    setPeriodoFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Materia
                </label>
                <select
                  value={subjectFilter}
                  onChange={(e) => {
                    setSubjectFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Todas</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.clave} - {subject.nombre}
                    </option>
                  ))}
                </select>
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
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
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
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {filteredGroups.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                {hasActiveFilters || debouncedSearchTerm ? 'No se encontraron grupos con los filtros aplicados' : 'No hay grupos registrados'}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4">
                  {filteredGroups.map((group) => (
                    <GroupCard
                      key={group.id}
                      group={group}
                      onClick={() => handleView(group.id)}
                      onEdit={isAdmin ? (e) => handleEdit(group.id, e) : undefined}
                      onDelete={isAdmin ? (e) => {
                        e.stopPropagation();
                        handleDeleteClick(group);
                      } : undefined}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-700">
                          Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, pagination.total)} de {pagination.total} grupos
                        </span>
                        <select
                          value={pageSize}
                          onChange={(e) => {
                            setPageSize(parseInt(e.target.value, 10));
                            setCurrentPage(1);
                          }}
                          className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                          className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                          Primera
                        </button>
                        <button
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                          Anterior
                        </button>
                        <span className="px-3 py-1 text-sm text-gray-700">
                          Página {currentPage} de {pagination.totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === pagination.totalPages}
                          className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                          Siguiente
                        </button>
                        <button
                          onClick={() => setCurrentPage(pagination.totalPages)}
                          disabled={currentPage === pagination.totalPages}
                          className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
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
    </Layout>
  );
};
