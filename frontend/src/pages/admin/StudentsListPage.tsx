// Students list page for ADMIN with filters, search, and pagination
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { studentsApi, exportApi } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import type { Student, StudentsListResponse } from '../../types';

export const StudentsListPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<StudentsListResponse['pagination'] | null>(null);
  
  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    studentId: string | null;
    studentName: string;
  }>({
    isOpen: false,
    studentId: null,
    studentName: '',
  });

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [carreraFilter, setCarreraFilter] = useState('');
  const [semestreFilter, setSemestreFilter] = useState<number | ''>('');
  const [estatusFilter, setEstatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState<'matricula' | 'nombre' | 'carrera' | 'semestre' | 'estatus'>('nombre');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Get unique carreras for filter dropdown
  const [uniqueCarreras, setUniqueCarreras] = useState<string[]>([]);

  // Debounced search
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page on search
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchStudents();
  }, [debouncedSearchTerm, carreraFilter, semestreFilter, estatusFilter, currentPage, pageSize, sortBy, sortOrder]);

  // Fetch unique carreras on mount
  useEffect(() => {
    fetchUniqueCarreras();
  }, []);

  const fetchUniqueCarreras = async () => {
    try {
      // Fetch all pages to get unique carreras
      // Add delay between requests to avoid rate limiting
      const allCarreras: string[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await studentsApi.getAll({ limit: 100, page });
        const carreras = response.students.map(s => s.carrera);
        allCarreras.push(...carreras);
        
        hasMore = page < response.pagination.totalPages;
        page++;
        
        // Add small delay between requests to avoid rate limiting
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
        }
      }

      const uniqueCarreras = [...new Set(allCarreras)].sort();
      setUniqueCarreras(uniqueCarreras);
    } catch (err) {
      console.error('Error fetching carreras:', err);
      // Fallback: try with just first page
      try {
        const response = await studentsApi.getAll({ limit: 100, page: 1 });
        const carreras = [...new Set(response.students.map(s => s.carrera))].sort();
        setUniqueCarreras(carreras);
      } catch (fallbackErr) {
        console.error('Error fetching carreras (fallback):', fallbackErr);
      }
    }
  };

  const fetchStudents = async () => {
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
      if (carreraFilter) {
        params.carrera = carreraFilter;
      }
      if (semestreFilter) {
        params.semestre = semestreFilter;
      }
      if (estatusFilter) {
        params.estatus = estatusFilter;
      }

      const response = await studentsApi.getAll(params);
      setStudents(response.students);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(
        err.response?.data?.error || 'Error al cargar los estudiantes'
      );
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id: string) => {
    navigate(`/admin/students/${id}/edit`);
  };

  const handleNewStudent = () => {
    navigate('/admin/students/new');
  };

  const handleDeleteClick = (student: Student) => {
    setDeleteConfirm({
      isOpen: true,
      studentId: student.id,
      studentName: `${student.nombre} ${student.apellidoPaterno} ${student.apellidoMaterno} (${student.matricula})`,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.studentId) return;

    try {
      await studentsApi.delete(deleteConfirm.studentId);
      showToast('Estudiante eliminado correctamente', 'success');
      setDeleteConfirm({ isOpen: false, studentId: null, studentName: '' });
      // Refresh the list
      fetchStudents();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Error al eliminar el estudiante';
      showToast(errorMessage, 'error');
      console.error('Error deleting student:', err);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ isOpen: false, studentId: null, studentName: '' });
  };

  const handleExport = async () => {
    try {
      const filters: any = {};
      if (carreraFilter) filters.carrera = carreraFilter;
      if (semestreFilter) filters.semestre = semestreFilter;
      if (estatusFilter) filters.estatus = estatusFilter;

      const blob = await exportApi.exportStudents(filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `estudiantes_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToast('Archivo Excel descargado correctamente', 'success');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Error al exportar los datos';
      showToast(errorMessage, 'error');
      console.error('Error exporting students:', err);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setCarreraFilter('');
    setSemestreFilter('');
    setEstatusFilter('');
    setCurrentPage(1);
  };

  const handleSort = (field: 'matricula' | 'nombre' | 'carrera' | 'semestre' | 'estatus') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getStatusBadgeColor = (estatus: string) => {
    switch (estatus) {
      case 'ACTIVO':
        return 'bg-green-100 text-green-800';
      case 'INACTIVO':
        return 'bg-yellow-100 text-yellow-800';
      case 'EGRESADO':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSortIcon = (field: 'matricula' | 'nombre' | 'carrera' | 'semestre' | 'estatus') => {
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

  const hasActiveFilters = searchTerm || carreraFilter || semestreFilter || estatusFilter;

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Lista de Estudiantes</h1>
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
              onClick={handleNewStudent}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nuevo Estudiante
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
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

            {/* Carrera filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Carrera
              </label>
              <select
                value={carreraFilter}
                onChange={(e) => {
                  setCarreraFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todas</option>
                {uniqueCarreras.map((carrera) => (
                  <option key={carrera} value={carrera}>
                    {carrera}
                  </option>
                ))}
              </select>
            </div>

            {/* Semestre filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Semestre
              </label>
              <select
                value={semestreFilter}
                onChange={(e) => {
                  setSemestreFilter(e.target.value === '' ? '' : parseInt(e.target.value, 10));
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((sem) => (
                  <option key={sem} value={sem}>
                    {sem}
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
                <option value="ACTIVO">ACTIVO</option>
                <option value="INACTIVO">INACTIVO</option>
                <option value="EGRESADO">EGRESADO</option>
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

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Students table */}
        {!loading && !error && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {students.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                {hasActiveFilters ? 'No se encontraron estudiantes con los filtros aplicados' : 'No hay estudiantes registrados'}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('matricula')}
                        >
                          <div className="flex items-center gap-2">
                            Matrícula
                            {getSortIcon('matricula')}
                          </div>
                        </th>
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
                          onClick={() => handleSort('carrera')}
                        >
                          <div className="flex items-center gap-2">
                            Carrera
                            {getSortIcon('carrera')}
                          </div>
                        </th>
                        <th
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('semestre')}
                        >
                          <div className="flex items-center gap-2">
                            Semestre
                            {getSortIcon('semestre')}
                          </div>
                        </th>
                        <th
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('estatus')}
                        >
                          <div className="flex items-center gap-2">
                            Estatus
                            {getSortIcon('estatus')}
                          </div>
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {students.map((student) => (
                        <tr
                          key={student.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {student.matricula}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {student.nombre} {student.apellidoPaterno} {student.apellidoMaterno}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {student.carrera}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {student.semestre}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(
                                student.estatus
                              )}`}
                            >
                              {student.estatus}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-3">
                              <button
                                onClick={() => handleEdit(student.id)}
                                className="text-blue-600 hover:text-blue-900 transition-colors"
                                title="Editar estudiante"
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
                                onClick={() => handleDeleteClick(student)}
                                className="text-red-600 hover:text-red-900 transition-colors"
                                title="Eliminar estudiante"
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
                          Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, pagination.total)} de {pagination.total} estudiantes
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
        title="Eliminar Estudiante"
        message={`¿Estás seguro de que deseas eliminar al estudiante "${deleteConfirm.studentName}"? Esta acción no se puede deshacer y también eliminará su cuenta de usuario y todas sus inscripciones.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </Layout>
  );
};
