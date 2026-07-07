// Subjects list page for ADMIN with filters, search, and pagination
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { subjectsApi, exportApi } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { ConfirmDialog, Loader, SubjectCard, Icon } from '../../components/ui';
import { ds } from '../../lib/designSystem';
import type { Subject, SubjectsListResponse } from '../../types';

export const SubjectsListPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<SubjectsListResponse['pagination'] | null>(null);
  
  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    subjectId: string | null;
    subjectName: string;
  }>({
    isOpen: false,
    subjectId: null,
    subjectName: '',
  });

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [estatusFilter, setEstatusFilter] = useState('');
  const [nivelFilter, setNivelFilter] = useState<number | ''>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy] = useState<'clave' | 'nombre' | 'creditos'>('nombre');
  const [sortOrder] = useState<'asc' | 'desc'>('asc');
  

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
    fetchSubjects();
  }, [debouncedSearchTerm, tipoFilter, estatusFilter, nivelFilter, currentPage, pageSize, sortBy, sortOrder]);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = {
        page: currentPage,
        limit: pageSize,
        sortBy,
        sortOrder,
      };

      // Add search filter
      if (debouncedSearchTerm.trim()) {
        params.nombre = debouncedSearchTerm.trim();
      }
      if (tipoFilter) {
        params.tipo = tipoFilter;
      }
      if (estatusFilter) {
        params.estatus = estatusFilter;
      }
      if (nivelFilter) {
        params.nivel = nivelFilter;
      }

      const response = await subjectsApi.getAll(params);
      setSubjects(response.subjects);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar las materias');
      console.error('Error fetching subjects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id: string) => {
    navigate(`/admin/subjects/${id}/edit`);
  };

  const handleNewSubject = () => {
    navigate('/admin/subjects/new');
  };

  const handleDeleteClick = (subject: Subject) => {
    setDeleteConfirm({
      isOpen: true,
      subjectId: subject.id,
      subjectName: `${subject.clave} - ${subject.nombre}`,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.subjectId) return;

    try {
      await subjectsApi.delete(deleteConfirm.subjectId);
      showToast('Materia eliminada correctamente', 'success');
      setDeleteConfirm({ isOpen: false, subjectId: null, subjectName: '' });
      fetchSubjects();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Error al eliminar la materia';
      showToast(errorMessage, 'error');
      console.error('Error deleting subject:', err);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ isOpen: false, subjectId: null, subjectName: '' });
  };

  const handleExport = async () => {
    try {
      const blob = await exportApi.exportSubjects();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `materias_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToast('Archivo Excel descargado correctamente', 'success');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Error al exportar los datos';
      showToast(errorMessage, 'error');
      console.error('Error exporting subjects:', err);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setTipoFilter('');
    setEstatusFilter('');
    setNivelFilter('');
    setCurrentPage(1);
  };
  

  const hasActiveFilters = searchTerm || tipoFilter || estatusFilter || nivelFilter;

  return (
    <Layout>
      <div className={ds.admin.pageShellCompact}>
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className={ds.admin.pageTitle}>Lista de Materias</h1>
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
              onClick={handleNewSubject}
              className={`${ds.btn.primary} flex items-center gap-2`}
            >
              <Icon name="plus" size={20} />
              Nueva Materia
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className={ds.admin.filterPanel}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <div>
              <label className={ds.admin.filterLabel}>
                Buscar
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre o clave..."
                className={ds.admin.input}
              />
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
                <option value="OBLIGATORIA">OBLIGATORIA</option>
                <option value="OPTATIVA">OPTATIVA</option>
                <option value="ELECTIVA">ELECTIVA</option>
                <option value="SERVICIO_SOCIAL">SERVICIO SOCIAL</option>
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
                <option value="ACTIVA">ACTIVA</option>
                <option value="INACTIVA">INACTIVA</option>
                <option value="DESCONTINUADA">DESCONTINUADA</option>
                <option value="EN_REVISION">EN REVISIÓN</option>
              </select>
            </div>
            
            {/* Nivel filter */}
            <div>
              <label className={ds.admin.filterLabel}>
                Nivel
              </label>
              <select
                value={nivelFilter}
                onChange={(e) => {
                  setNivelFilter(e.target.value === '' ? '' : parseInt(e.target.value, 10));
                  setCurrentPage(1);
                }}
                className={ds.admin.input}
              >
                <option value="">Todos</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((nivel) => (
                  <option key={nivel} value={nivel}>
                    {nivel}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Column visibility toggle (now hidden since we use cards, but we keep the logic if we want list view toggle later) */}

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
            <Loader variant="spinner" size="lg" text="Cargando materias..." />
          </div>
        )}

        {/* Subjects table */}
        {!loading && !error && (
          <div className={ds.admin.tableWrap}>
            {subjects.length === 0 ? (
              <div className={`text-center py-12 ${ds.semantic.mutedText}`}>
                {hasActiveFilters ? 'No se encontraron materias con los filtros aplicados' : 'No hay materias registradas'}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4">
                  {subjects.map((subject) => (
                    <SubjectCard
                      key={subject.id}
                      subject={subject}
                      onClick={() => handleEdit(subject.id)}
                      onEdit={(e) => {
                        e.stopPropagation();
                        handleEdit(subject.id);
                      }}
                      onDelete={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(subject);
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
                          Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, pagination.total)} de {pagination.total} materias
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
        title="Eliminar Materia"
        message={`¿Estás seguro de que deseas eliminar la materia "${deleteConfirm.subjectName}"? Esta acción no se puede deshacer. No se puede eliminar si tiene grupos asignados.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </Layout>
  );
};
