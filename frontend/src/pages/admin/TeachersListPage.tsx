// Teachers list page for ADMIN with filters, search, and pagination
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { teachersApi, exportApi } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { ConfirmDialog, Badge, Loader } from '../../components/ui';
import type { Teacher, TeachersListResponse } from '../../types';

export const TeachersListPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<TeachersListResponse['pagination'] | null>(null);
  
  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    teacherId: string | null;
    teacherName: string;
  }>({
    isOpen: false,
    teacherId: null,
    teacherName: '',
  });

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [departamentoFilter, setDepartamentoFilter] = useState('');
  const [tipoContratoFilter, setTipoContratoFilter] = useState('');
  const [estatusFilter, setEstatusFilter] = useState('');
  const [gradoAcademicoFilter, setGradoAcademicoFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState<'nombre' | 'apellidoPaterno' | 'departamento'>('nombre');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Column visibility
  const [showEmail, setShowEmail] = useState(false);
  const [showGrado, setShowGrado] = useState(false);
  const [showGrupos, setShowGrupos] = useState(true);

  // Get unique departamentos for filter dropdown
  const [uniqueDepartamentos, setUniqueDepartamentos] = useState<string[]>([]);

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
    fetchTeachers();
  }, [debouncedSearchTerm, departamentoFilter, tipoContratoFilter, estatusFilter, gradoAcademicoFilter, currentPage, pageSize, sortBy, sortOrder]);

  // Fetch unique departamentos on mount
  useEffect(() => {
    fetchUniqueDepartamentos();
  }, []);

  const fetchUniqueDepartamentos = async () => {
    try {
      // Fetch all pages to get unique departamentos
      // Add delay between requests to avoid rate limiting
      const allDepartamentos: string[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await teachersApi.getAll({ limit: 100, page });
        const departamentos = response.teachers.map(t => t.departamento);
        allDepartamentos.push(...departamentos);
        
        hasMore = page < response.pagination.totalPages;
        page++;
        
        // Add small delay between requests to avoid rate limiting
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
        }
      }

      const uniqueDepartamentos = [...new Set(allDepartamentos)].sort();
      setUniqueDepartamentos(uniqueDepartamentos);
    } catch (err) {
      console.error('Error fetching departamentos:', err);
      // Fallback: try with just first page
      try {
        const response = await teachersApi.getAll({ limit: 100, page: 1 });
        const departamentos = [...new Set(response.teachers.map(t => t.departamento))].sort();
        setUniqueDepartamentos(departamentos);
      } catch (fallbackErr) {
        console.error('Error fetching departamentos (fallback):', fallbackErr);
      }
    }
  };

  const fetchTeachers = async () => {
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
      if (debouncedSearchTerm.trim()) {
        params.nombre = debouncedSearchTerm.trim();
      }
      if (departamentoFilter) {
        params.departamento = departamentoFilter;
      }
      if (tipoContratoFilter) {
        params.tipoContrato = tipoContratoFilter;
      }
      if (estatusFilter) {
        params.estatus = estatusFilter;
      }
      if (gradoAcademicoFilter) {
        params.gradoAcademico = gradoAcademicoFilter;
      }

      const response = await teachersApi.getAll(params);
      setTeachers(response.teachers);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar los maestros');
      console.error('Error fetching teachers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id: string) => {
    navigate(`/admin/teachers/${id}/edit`);
  };

  const handleNewTeacher = () => {
    navigate('/admin/teachers/new');
  };

  const handleDeleteClick = (teacher: Teacher) => {
    setDeleteConfirm({
      isOpen: true,
      teacherId: teacher.id,
      teacherName: `${teacher.nombre} ${teacher.apellidoPaterno} ${teacher.apellidoMaterno}`,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.teacherId) return;

    try {
      await teachersApi.delete(deleteConfirm.teacherId);
      showToast('Maestro eliminado correctamente', 'success');
      setDeleteConfirm({ isOpen: false, teacherId: null, teacherName: '' });
      fetchTeachers();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Error al eliminar el maestro';
      showToast(errorMessage, 'error');
      console.error('Error deleting teacher:', err);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ isOpen: false, teacherId: null, teacherName: '' });
  };

  const handleExport = async () => {
    try {
      const filters: any = {};
      if (departamentoFilter) filters.departamento = departamentoFilter;

      const blob = await exportApi.exportTeachers(filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `maestros_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToast('Archivo Excel descargado correctamente', 'success');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Error al exportar los datos';
      showToast(errorMessage, 'error');
      console.error('Error exporting teachers:', err);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setDepartamentoFilter('');
    setTipoContratoFilter('');
    setEstatusFilter('');
    setGradoAcademicoFilter('');
    setCurrentPage(1);
  };

  const handleSort = (field: 'nombre' | 'apellidoPaterno' | 'departamento') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: 'nombre' | 'apellidoPaterno' | 'departamento') => {
    if (sortBy !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortOrder === 'asc' ? (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const hasActiveFilters = searchTerm || departamentoFilter || tipoContratoFilter || estatusFilter || gradoAcademicoFilter;
  
  const getStatusBadgeVariant = (estatus?: string): 'success' | 'warning' | 'info' | 'default' => {
    switch (estatus) {
      case 'ACTIVO':
        return 'success';
      case 'INACTIVO':
        return 'warning';
      case 'JUBILADO':
        return 'info';
      case 'LICENCIA':
        return 'default';
      default:
        return 'default';
    }
  };
  
  const getTipoContratoBadgeVariant = (tipo?: string): 'success' | 'warning' | 'info' | 'default' => {
    switch (tipo) {
      case 'TIEMPO_COMPLETO':
        return 'success';
      case 'MEDIO_TIEMPO':
        return 'info';
      case 'POR_HONORARIOS':
        return 'warning';
      case 'INTERINO':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Lista de Maestros</h1>
          <div className="flex items-center gap-3">
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
              onClick={handleNewTeacher}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nuevo Maestro
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buscar
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Departamento filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Departamento
              </label>
              <select
                value={departamentoFilter}
                onChange={(e) => {
                  setDepartamentoFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos</option>
                {uniqueDepartamentos.map((departamento) => (
                  <option key={departamento} value={departamento}>
                    {departamento}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Tipo de Contrato filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Contrato
              </label>
              <select
                value={tipoContratoFilter}
                onChange={(e) => {
                  setTipoContratoFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos</option>
                <option value="TIEMPO_COMPLETO">TIEMPO COMPLETO</option>
                <option value="MEDIO_TIEMPO">MEDIO TIEMPO</option>
                <option value="POR_HONORARIOS">POR HONORARIOS</option>
                <option value="INTERINO">INTERINO</option>
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
                <option value="ACTIVO">ACTIVO</option>
                <option value="INACTIVO">INACTIVO</option>
                <option value="JUBILADO">JUBILADO</option>
                <option value="LICENCIA">LICENCIA</option>
              </select>
            </div>
            
            {/* Grado Académico filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grado Académico
              </label>
              <input
                type="text"
                value={gradoAcademicoFilter}
                onChange={(e) => {
                  setGradoAcademicoFilter(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Ej: Licenciatura, Maestría..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
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
                  checked={showEmail}
                  onChange={(e) => setShowEmail(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                Email
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={showGrado}
                  onChange={(e) => setShowGrado(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                Grado Académico
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={showGrupos}
                  onChange={(e) => setShowGrupos(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                Grupos Asignados
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
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader variant="spinner" size="lg" text="Cargando profesores..." />
          </div>
        )}

        {/* Teachers table */}
        {!loading && !error && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {teachers.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                {hasActiveFilters ? 'No se encontraron maestros con los filtros aplicados' : 'No hay maestros registrados'}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('nombre')}
                        >
                          <div className="flex items-center gap-2">
                            Nombre
                            {getSortIcon('nombre')}
                          </div>
                        </th>
                        <th
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('apellidoPaterno')}
                        >
                          <div className="flex items-center gap-2">
                            Apellidos
                            {getSortIcon('apellidoPaterno')}
                          </div>
                        </th>
                        <th
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('departamento')}
                        >
                          <div className="flex items-center gap-2">
                            Departamento
                            {getSortIcon('departamento')}
                          </div>
                        </th>
                        {showEmail && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                        )}
                        {showGrado && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Grado Académico
                          </th>
                        )}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tipo Contrato
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estatus
                        </th>
                        {showGrupos && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Grupos
                          </th>
                        )}
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {teachers.map((teacher) => (
                        <tr
                          key={teacher.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {teacher.nombre}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {teacher.apellidoPaterno} {teacher.apellidoMaterno}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {teacher.departamento}
                          </td>
                          {showEmail && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {teacher.email || '-'}
                            </td>
                          )}
                          {showGrado && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {teacher.gradoAcademico || '-'}
                            </td>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap">
                            {teacher.tipoContrato ? (
                              <Badge variant={getTipoContratoBadgeVariant(teacher.tipoContrato)}>
                                {teacher.tipoContrato.replace('_', ' ')}
                              </Badge>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {teacher.estatus ? (
                              <Badge variant={getStatusBadgeVariant(teacher.estatus)}>
                                {teacher.estatus}
                              </Badge>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </td>
                          {showGrupos && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {teacher.gruposAsignados || 0}
                            </td>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-3">
                              <button
                                onClick={() => handleEdit(teacher.id)}
                                className="text-blue-600 hover:text-blue-900 transition-colors"
                                title="Editar maestro"
                              >
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteClick(teacher)}
                                className="text-red-600 hover:text-red-900 transition-colors"
                                title="Eliminar maestro"
                              >
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
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
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-700">
                          Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, pagination.total)} de {pagination.total} maestros
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
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Eliminar Maestro"
        message={`¿Estás seguro de que deseas eliminar al maestro "${deleteConfirm.teacherName}"? Esta acción no se puede deshacer y también eliminará su cuenta de usuario. No se puede eliminar si tiene grupos asignados.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </Layout>
  );
};
