// Teachers list page for ADMIN with filters, search, and pagination
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { teachersApi, exportApi } from '../../lib/api';
import { getCached } from '../../lib/requestCache';
import { useToast } from '../../context/ToastContext';
import { ConfirmDialog, Loader, TeacherCard, Icon } from '../../components/ui';
import { ds } from '../../lib/designSystem';
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
  }, [debouncedSearchTerm, departamentoFilter, tipoContratoFilter, estatusFilter, gradoAcademicoFilter, currentPage, pageSize]);

  // Fetch unique departamentos on mount
  useEffect(() => {
    fetchUniqueDepartamentos();
  }, []);

  const fetchUniqueDepartamentos = async () => {
    try {
      const departamentos = await getCached('teacher-departamentos', 5 * 60 * 1000, async () => {
        const response = await teachersApi.getAll({ limit: 100, page: 1 });
        return [...new Set(response.teachers.map((t) => t.departamento))].sort();
      });
      setUniqueDepartamentos(departamentos);
    } catch (err) {
      console.error('Error fetching departamentos:', err);
      setUniqueDepartamentos([]);
    }
  };

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = {
        page: currentPage,
        limit: pageSize,
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

  const hasActiveFilters = searchTerm || departamentoFilter || tipoContratoFilter || estatusFilter || gradoAcademicoFilter;

  return (
    <Layout>
      <div className={ds.admin.pageShellCompact}>
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className={ds.admin.pageTitle}>Lista de Maestros</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              className={`${ds.btn.secondary} flex items-center gap-2`}
              title="Exportar a Excel"
            >
              <Icon name="export" size={20} />
              Exportar Excel
            </button>
            <button
              onClick={handleNewTeacher}
              className={`${ds.btn.primary} flex items-center gap-2`}
            >
              <Icon name="plus" size={20} />
              Nuevo Maestro
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className={ds.admin.filterPanel}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {/* Search */}
            <div>
              <label className={ds.admin.filterLabel}>
                Buscar
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre..."
                className={ds.admin.input}
              />
            </div>

            {/* Departamento filter */}
            <div>
              <label className={ds.admin.filterLabel}>
                Departamento
              </label>
              <select
                value={departamentoFilter}
                onChange={(e) => {
                  setDepartamentoFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className={ds.admin.input}
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
              <label className={ds.admin.filterLabel}>
                Tipo de Contrato
              </label>
              <select
                value={tipoContratoFilter}
                onChange={(e) => {
                  setTipoContratoFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className={ds.admin.input}
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
                <option value="ACTIVO">ACTIVO</option>
                <option value="INACTIVO">INACTIVO</option>
                <option value="JUBILADO">JUBILADO</option>
                <option value="LICENCIA">LICENCIA</option>
              </select>
            </div>
            
            {/* Grado Académico filter */}
            <div>
              <label className={ds.admin.filterLabel}>
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
                className={ds.admin.input}
              />
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
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader variant="spinner" size="lg" text="Cargando profesores..." />
          </div>
        )}

        {/* Teachers table */}
        {!loading && !error && (
          <div className={ds.admin.tableWrap}>
            {teachers.length === 0 ? (
              <div className={`text-center py-12 ${ds.semantic.mutedText}`}>
                {hasActiveFilters ? 'No se encontraron maestros con los filtros aplicados' : 'No hay maestros registrados'}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4">
                  {teachers.map((teacher) => (
                    <TeacherCard
                      key={teacher.id}
                      teacher={teacher}
                      onClick={() => handleEdit(teacher.id)}
                      onEdit={(e) => {
                        e.stopPropagation();
                        handleEdit(teacher.id);
                      }}
                      onDelete={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(teacher);
                      }}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className={ds.admin.paginationFooter}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className={ds.admin.paginationText}>
                          Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, pagination.total)} de {pagination.total} maestros
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
