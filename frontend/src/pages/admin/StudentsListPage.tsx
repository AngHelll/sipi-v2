// Students list page for ADMIN with filters, search, and pagination
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { studentsApi, exportApi, careersApi } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Icon } from '../../components/ui/Icon';
import { Loader } from '../../components/ui/Loader';
import { StudentCard } from '../../components/ui/StudentCard';
import { EmptyState } from '../../components/ui/EmptyState';
import type { Student, StudentsListResponse } from '../../types';
import { ds } from '../../lib/designSystem';

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
  const [tipoIngresoFilter, setTipoIngresoFilter] = useState('');
  const [becaFilter, setBecaFilter] = useState('');
  const [promedioMinFilter, setPromedioMinFilter] = useState('');
  const [promedioMaxFilter, setPromedioMaxFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);


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
  }, [debouncedSearchTerm, carreraFilter, semestreFilter, estatusFilter, tipoIngresoFilter, becaFilter, promedioMinFilter, promedioMaxFilter, currentPage, pageSize]);

  // Fetch unique carreras on mount
  useEffect(() => {
    fetchUniqueCarreras();
  }, []);

  const fetchUniqueCarreras = async () => {
    try {
      const { careers } = await careersApi.getAll({ estatus: 'ACTIVA' });
      setUniqueCarreras(careers.map((c) => c.nombre).sort());
    } catch (err) {
      console.error('Error fetching carreras:', err);
      setUniqueCarreras([]);
    }
  };

  const fetchStudents = async () => {
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
      if (carreraFilter) {
        params.carrera = carreraFilter;
      }
      if (semestreFilter) {
        params.semestre = semestreFilter;
      }
      if (estatusFilter) {
        params.estatus = estatusFilter;
      }
      if (tipoIngresoFilter) {
        params.tipoIngreso = tipoIngresoFilter;
      }
      if (becaFilter) {
        params.beca = becaFilter === 'true';
      }
      // Note: promedioMin and promedioMax would need backend support

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
    setTipoIngresoFilter('');
    setBecaFilter('');
    setPromedioMinFilter('');
    setPromedioMaxFilter('');
    setCurrentPage(1);
  };



  const hasActiveFilters = searchTerm || carreraFilter || semestreFilter || estatusFilter || tipoIngresoFilter || becaFilter || promedioMinFilter || promedioMaxFilter;

  return (
    <Layout>
      <div className={ds.admin.pageShellCompact}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h1 className={`${ds.admin.pageTitle} text-2xl sm:text-3xl`}>Lista de Estudiantes</h1>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleExport}
              className={`${ds.btn.secondary} flex items-center gap-2 text-sm sm:text-base shadow-soft hover:shadow-medium`}
              title="Exportar a Excel"
            >
              <Icon name="export" size={18} className="sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Exportar Excel</span>
              <span className="sm:hidden">Exportar</span>
            </button>
            <button
              onClick={handleNewStudent}
              className={`${ds.btn.primary} flex items-center gap-2 text-sm sm:text-base shadow-soft hover:shadow-medium`}
            >
              <Icon name="plus" size={18} className="sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Nuevo Estudiante</span>
              <span className="sm:hidden">Nuevo</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className={`${ds.admin.filterPanel} p-3 sm:p-4`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
            {/* Search */}
            <div className="lg:col-span-2">
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

            {/* Carrera filter */}
            <div>
              <label className={ds.admin.filterLabel}>
                Carrera
              </label>
              <select
                value={carreraFilter}
                onChange={(e) => {
                  setCarreraFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className={ds.admin.input}
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
              <label className={ds.admin.filterLabel}>
                Semestre
              </label>
              <select
                value={semestreFilter}
                onChange={(e) => {
                  setSemestreFilter(e.target.value === '' ? '' : parseInt(e.target.value, 10));
                  setCurrentPage(1);
                }}
                className={ds.admin.input}
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
                <option value="EGRESADO">EGRESADO</option>
              </select>
            </div>
          </div>
          
          {/* Additional filters row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Tipo de Ingreso filter */}
            <div>
              <label className={ds.admin.filterLabel}>
                Tipo de Ingreso
              </label>
              <select
                value={tipoIngresoFilter}
                onChange={(e) => {
                  setTipoIngresoFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className={ds.admin.input}
              >
                <option value="">Todos</option>
                <option value="NUEVO_INGRESO">NUEVO INGRESO</option>
                <option value="REINGRESO">REINGRESO</option>
                <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                <option value="EQUIVALENCIA">EQUIVALENCIA</option>
              </select>
            </div>

            {/* Beca filter */}
            <div>
              <label className={ds.admin.filterLabel}>
                Beca
              </label>
              <select
                value={becaFilter}
                onChange={(e) => {
                  setBecaFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className={ds.admin.input}
              >
                <option value="">Todos</option>
                <option value="true">Con Beca</option>
                <option value="false">Sin Beca</option>
              </select>
            </div>

            {/* Promedio Min filter */}
            <div>
              <label className={ds.admin.filterLabel}>
                Promedio Mínimo
              </label>
              <input
                type="number"
                value={promedioMinFilter}
                onChange={(e) => {
                  setPromedioMinFilter(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="0.00"
                min={0}
                max={100}
                step="0.01"
                className={ds.admin.input}
              />
            </div>

            {/* Promedio Max filter */}
            <div>
              <label className={ds.admin.filterLabel}>
                Promedio Máximo
              </label>
              <input
                type="number"
                value={promedioMaxFilter}
                onChange={(e) => {
                  setPromedioMaxFilter(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="100.00"
                min={0}
                max={100}
                step="0.01"
                className={ds.admin.input}
              />
            </div>
          </div>
          

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
          <div className="flex justify-center py-12">
            <Loader variant="spinner" size="lg" text="Cargando estudiantes..." />
          </div>
        )}

        {/* Students table */}
        {!loading && !error && (
          <div className={ds.admin.tableWrap}>
            {students.length === 0 ? (
              <EmptyState
                icon="students"
                title={hasActiveFilters ? 'No se encontraron estudiantes' : 'No hay estudiantes registrados'}
                description={hasActiveFilters ? 'Intenta ajustar los filtros de búsqueda' : 'Comienza agregando tu primer estudiante'}
                action={
                  !hasActiveFilters && (
                    <button
                      onClick={handleNewStudent}
                      className={`${ds.btn.primary} flex items-center gap-2`}
                    >
                      <Icon name="plus" size={16} />
                      Nuevo Estudiante
                    </button>
                  )
                }
              />
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4 bg-surface-container-low/50">
                  {students.map((student) => (
                    <StudentCard
                      key={student.id}
                      student={student}
                      onClick={() => handleEdit(student.id)}
                      onEdit={(e) => {
                        e.stopPropagation();
                        handleEdit(student.id);
                      }}
                      onDelete={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(student);
                      }}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className={ds.admin.paginationFooter}>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                        <span className={`${ds.admin.paginationText} text-center sm:text-left`}>
                          Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, pagination.total)} de {pagination.total} estudiantes
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
                      <div className="flex items-center justify-center gap-2 flex-wrap">
                        <button
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1}
                          className={ds.admin.paginationBtn}
                        >
                          <span className="hidden sm:inline">Primera</span>
                          <span className="sm:hidden">«</span>
                        </button>
                        <button
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          className={ds.admin.paginationBtn}
                        >
                          <span className="hidden sm:inline">Anterior</span>
                          <span className="sm:hidden">‹</span>
                        </button>
                        <span className={`${ds.admin.paginationText} px-3 py-2 whitespace-nowrap`}>
                          Página {currentPage} de {pagination.totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === pagination.totalPages}
                          className={ds.admin.paginationBtn}
                        >
                          <span className="hidden sm:inline">Siguiente</span>
                          <span className="sm:hidden">›</span>
                        </button>
                        <button
                          onClick={() => setCurrentPage(pagination.totalPages)}
                          disabled={currentPage === pagination.totalPages}
                          className={ds.admin.paginationBtn}
                        >
                          <span className="hidden sm:inline">Última</span>
                          <span className="sm:hidden">»</span>
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
