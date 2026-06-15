// Diagnostic Exams list page for ADMIN with filters, search, and pagination
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { examsApi, studentsApi, examPeriodsApi } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { Badge, Icon, SkeletonTable, EmptyState, FormField, ButtonLoader } from '../../components/ui';
import type { Student, ExamPeriod } from '../../types';

interface Exam {
  id: string;
  codigo: string;
  estatus: string;
  fechaInscripcion: string;
  student: {
    id: string;
    matricula: string;
    nombre: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
  } | null;
  exam: {
    examType: string;
    nivelIngles?: number;
    resultado?: number;
    fechaExamen?: string;
    fechaResultado?: string;
    periodId?: string;
    period?: {
      id: string;
      nombre: string;
    };
    subject?: {
      id: string;
      clave: string;
      nombre: string;
    };
    requierePago?: boolean;
    pagoAprobado?: boolean;
    montoPago?: number;
  } | null;
}

interface ExamsListResponse {
  exams: Exam[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const DiagnosticExamsListPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<ExamsListResponse['pagination'] | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [studentIdFilter, setStudentIdFilter] = useState('');
  const [periodIdFilter, setPeriodIdFilter] = useState('');
  const [examTypeFilter, setExamTypeFilter] = useState('');
  const [estatusFilter, setEstatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [sortBy, setSortBy] = useState<'fechaInscripcion' | 'estatus' | 'examType'>('fechaInscripcion');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Options for filters
  const [students, setStudents] = useState<Student[]>([]);
  const [periods, setPeriods] = useState<ExamPeriod[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Debounced search
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  const [waitlist, setWaitlist] = useState<{ total: number; byType: Array<{ examType: string; count: number }> } | null>(null);
  const [assignModal, setAssignModal] = useState<{
    isOpen: boolean;
    examId: string | null;
    periodId: string;
  }>({ isOpen: false, examId: null, periodId: '' });
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchOptions();
    examsApi
      .getWaitlistSummary()
      .then(setWaitlist)
      .catch((err) => console.error('Error fetching exam waitlist:', err));
  }, []);

  useEffect(() => {
    fetchExams();
  }, [debouncedSearchTerm, studentIdFilter, periodIdFilter, examTypeFilter, estatusFilter, currentPage, pageSize, sortBy, sortOrder]);

  const fetchOptions = async () => {
    try {
      setLoadingOptions(true);
      const [studentsRes, periodsRes] = await Promise.all([
        studentsApi.getAll({ limit: 100 }),
        examPeriodsApi.getAllPeriods({ limit: 100 }),
      ]);
      setStudents(studentsRes.students);
      setPeriods(periodsRes.periods);
    } catch (err: any) {
      console.error('Error fetching options:', err);
    } finally {
      setLoadingOptions(false);
    }
  };

  const fetchExams = async () => {
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
      if (periodIdFilter) {
        params.periodId = periodIdFilter;
      }
      if (examTypeFilter) {
        params.examType = examTypeFilter;
      }
      if (estatusFilter) {
        params.estatus = estatusFilter;
      }

      const response = await examsApi.getAll(params);
      
      // Filter by search term if provided
      let filteredExams = response.exams;
      if (debouncedSearchTerm) {
        const searchLower = debouncedSearchTerm.toLowerCase();
        filteredExams = response.exams.filter((exam) => {
          const studentName = exam.student 
            ? `${exam.student.nombre} ${exam.student.apellidoPaterno} ${exam.student.apellidoMaterno}`.toLowerCase()
            : '';
          const matricula = exam.student?.matricula.toLowerCase() || '';
          const codigo = exam.codigo.toLowerCase();
          return studentName.includes(searchLower) || matricula.includes(searchLower) || codigo.includes(searchLower);
        });
      }

      setExams(filteredExams);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(
        err.response?.data?.error || 'Error al cargar los exámenes'
      );
      console.error('Error fetching exams:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessResult = (examId: string) => {
    navigate(`/admin/exams/${examId}/process-result`);
  };

  // State for payment approval modal
  const [paymentModal, setPaymentModal] = useState<{
    isOpen: boolean;
    examId: string | null;
    montoPago: string;
    observaciones: string;
  }>({
    isOpen: false,
    examId: null,
    montoPago: '',
    observaciones: '',
  });

  const handleOpenPaymentModal = (examId: string) => {
    setPaymentModal({
      isOpen: true,
      examId,
      montoPago: '',
      observaciones: '',
    });
  };

  const handleClosePaymentModal = () => {
    setPaymentModal({
      isOpen: false,
      examId: null,
      montoPago: '',
      observaciones: '',
    });
  };

  const handleApprovePayment = async () => {
    if (!paymentModal.examId) return;

    const montoPago = parseFloat(paymentModal.montoPago);
    if (isNaN(montoPago) || montoPago <= 0) {
      showToast('El monto del pago debe ser mayor a 0', 'error');
      return;
    }

    try {
      await examsApi.receiveAndApproveExamPayment(paymentModal.examId, {
        montoPago,
        observaciones: paymentModal.observaciones || undefined,
      });
      showToast('Comprobante físico recibido y pago aprobado exitosamente', 'success');
      handleClosePaymentModal();
      fetchExams();
    } catch (err: any) {
      showToast(
        err.response?.data?.error || 'Error al aprobar el pago',
        'error'
      );
    }
  };

  const handleRejectPayment = async (examId: string) => {
    const motivo = window.prompt('Ingresa el motivo del rechazo:');
    if (!motivo || motivo.trim() === '') {
      return;
    }

    try {
      await examsApi.rejectExamPayment(examId, motivo);
      showToast('Pago rechazado', 'success');
      fetchExams();
    } catch (err: any) {
      showToast(
        err.response?.data?.error || 'Error al rechazar el pago',
        'error'
      );
    }
  };

  const handleOpenAssignModal = (examId: string) => {
    setAssignModal({ isOpen: true, examId, periodId: '' });
  };

  const handleCloseAssignModal = () => {
    setAssignModal({ isOpen: false, examId: null, periodId: '' });
  };

  const handleAssignPeriod = async () => {
    if (!assignModal.examId || !assignModal.periodId) return;
    try {
      setAssigning(true);
      await examsApi.assignPeriod(assignModal.examId, { periodId: assignModal.periodId });
      showToast('Período asignado exitosamente', 'success');
      handleCloseAssignModal();
      fetchExams();
      examsApi.getWaitlistSummary().then(setWaitlist).catch(() => {});
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Error al asignar período', 'error');
    } finally {
      setAssigning(false);
    }
  };

  const openPeriods = periods.filter((p) => {
    if (p.estatus !== 'ABIERTO') return false;
    const cupos = (p.cupoMaximo ?? 0) - (p.cupoActual ?? 0);
    return cupos > 0;
  });

  const handleClearFilters = () => {
    setSearchTerm('');
    setStudentIdFilter('');
    setPeriodIdFilter('');
    setExamTypeFilter('');
    setEstatusFilter('');
    setCurrentPage(1);
  };

  const handleSort = (field: 'fechaInscripcion' | 'estatus' | 'examType') => {
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
      case 'EVALUADO':
        return 'info';
      case 'REPROBADO':
        return 'danger';
      case 'CANCELADO':
        return 'default';
      case 'LISTA_ESPERA':
        return 'info';
      case 'PENDIENTE_PAGO':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (estatus?: string): string => {
    switch (estatus) {
      case 'INSCRITO':
        return 'Inscrito';
      case 'EN_CURSO':
        return 'En Curso';
      case 'APROBADO':
        return 'Aprobado';
      case 'EVALUADO':
        return 'Evaluado';
      case 'REPROBADO':
        return 'Reprobado';
      case 'CANCELADO':
        return 'Cancelado';
      case 'PENDIENTE_PAGO':
        return 'Pendiente Pago';
      case 'PAGO_PENDIENTE_APROBACION':
        return 'Pago Pendiente';
      case 'PAGO_APROBADO':
        return 'Pago Aprobado';
      case 'LISTA_ESPERA':
        return 'Lista de Espera';
      default:
        return estatus || '-';
    }
  };

  const getExamTypeLabel = (examType?: string): string => {
    switch (examType) {
      case 'DIAGNOSTICO':
        return 'Diagnóstico';
      case 'ADMISION':
        return 'Admisión';
      case 'CERTIFICACION':
        return 'Certificación';
      default:
        return examType || '-';
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

  const hasActiveFilters = searchTerm || studentIdFilter || periodIdFilter || examTypeFilter || estatusFilter;

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Exámenes de Diagnóstico</h1>
        </div>

        {waitlist && waitlist.total > 0 && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-indigo-900">
                Lista de espera: {waitlist.total} solicitud{waitlist.total === 1 ? '' : 'es'} sin período
              </p>
              <p className="text-sm text-indigo-800 mt-1">
                Asigna un período abierto a cada solicitud en lista de espera.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEstatusFilter('LISTA_ESPERA');
                setCurrentPage(1);
              }}
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Ver lista de espera
            </button>
          </div>
        )}

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
                placeholder="Buscar por estudiante, matrícula o código..."
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

            {/* Período filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Período
              </label>
              <select
                value={periodIdFilter}
                onChange={(e) => {
                  setPeriodIdFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loadingOptions}
              >
                <option value="">Todos</option>
                {periods.map((period) => (
                  <option key={period.id} value={period.id}>
                    {period.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Tipo de Examen filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Examen
              </label>
              <select
                value={examTypeFilter}
                onChange={(e) => {
                  setExamTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos</option>
                <option value="DIAGNOSTICO">Diagnóstico</option>
                <option value="ADMISION">Admisión</option>
                <option value="CERTIFICACION">Certificación</option>
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
                <option value="LISTA_ESPERA">Lista de Espera</option>
                <option value="PENDIENTE_PAGO">Pendiente Pago</option>
                <option value="INSCRITO">Inscrito</option>
                <option value="EN_CURSO">En Curso</option>
                <option value="APROBADO">Aprobado</option>
                <option value="EVALUADO">Evaluado</option>
                <option value="REPROBADO">REPROBADO</option>
                <option value="CANCELADO">CANCELADO</option>
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
        {loading && <SkeletonTable rows={5} />}

        {/* Exams table */}
        {!loading && !error && (
          <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
            {exams.length === 0 ? (
              <EmptyState
                icon="document"
                title={hasActiveFilters ? 'No se encontraron exámenes' : 'No hay exámenes registrados'}
                description={hasActiveFilters ? 'Intenta ajustar los filtros de búsqueda' : 'Los estudiantes pueden solicitar exámenes de diagnóstico desde su panel'}
              />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Código
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estudiante
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('examType')}
                        >
                          <div className="flex items-center gap-2">
                            Tipo
                            {getSortIcon('examType')}
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Período
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nivel Inglés
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pago
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Resultado
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('fechaInscripcion')}
                        >
                          <div className="flex items-center gap-2">
                            Fecha Inscripción
                            {getSortIcon('fechaInscripcion')}
                          </div>
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {exams.map((exam) => (
                        <tr
                          key={exam.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {exam.codigo}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {exam.student?.matricula || '-'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {exam.student 
                                ? `${exam.student.nombre} ${exam.student.apellidoPaterno} ${exam.student.apellidoMaterno}`
                                : '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {getExamTypeLabel(exam.exam?.examType)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {exam.exam?.period?.nombre || '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {exam.exam?.nivelIngles ? `Nivel ${exam.exam.nivelIngles}` : '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={getStatusBadgeVariant(exam.estatus)}>
                              {getStatusLabel(exam.estatus)}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {exam.exam?.requierePago ? (
                              <div className="space-y-1">
                                {exam.exam.montoPago && (
                                  <div className="text-sm text-gray-900">${exam.exam.montoPago.toFixed(2)}</div>
                                )}
                                {exam.estatus === 'PAGO_PENDIENTE_APROBACION' && (
                                  <Badge className="bg-purple-100 text-purple-800">En Revisión</Badge>
                                )}
                                {exam.exam.pagoAprobado === true && (
                                  <Badge className="bg-green-100 text-green-800">Aprobado</Badge>
                                )}
                                {exam.exam.pagoAprobado === false && (
                                  <Badge className="bg-red-100 text-red-800">Rechazado</Badge>
                                )}
                                {exam.estatus === 'PENDIENTE_PAGO' && (
                                  <Badge className="bg-orange-100 text-orange-800">Pendiente</Badge>
                                )}
                              </div>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-600">No requiere</Badge>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {exam.exam?.resultado !== undefined && exam.exam.resultado !== null ? (
                              <div className="text-sm font-medium text-gray-900">
                                {exam.exam.resultado}%
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">Pendiente</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatDate(exam.fechaInscripcion)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              {exam.estatus === 'LISTA_ESPERA' && (
                                <button
                                  onClick={() => handleOpenAssignModal(exam.id)}
                                  className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                                  title="Asignar período"
                                >
                                  Asignar Período
                                </button>
                              )}
                              {exam.estatus === 'PENDIENTE_PAGO' && exam.exam?.requierePago && exam.exam?.pagoAprobado !== false && (
                                <>
                                  <button
                                    onClick={() => handleOpenPaymentModal(exam.id)}
                                    className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                    title="Recibir comprobante físico y aprobar pago"
                                  >
                                    Recibir y Aprobar
                                  </button>
                                  <button
                                    onClick={() => handleRejectPayment(exam.id)}
                                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                    title="Rechazar pago"
                                  >
                                    Rechazar
                                  </button>
                                </>
                              )}
                              {(exam.estatus === 'INSCRITO' || exam.estatus === 'PAGO_APROBADO') && 
                               (exam.exam?.resultado === undefined || exam.exam.resultado === null) && (
                                <button
                                  onClick={() => handleProcessResult(exam.id)}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="Procesar resultado"
                                >
                                  Procesar
                                </button>
                              )}
                              {exam.exam?.resultado !== undefined && exam.exam.resultado !== null && (
                                <span className="text-gray-400">Completado</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Anterior
                      </button>
                      <button
                        onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                        disabled={currentPage === pagination.totalPages}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Siguiente
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Mostrando <span className="font-medium">{((currentPage - 1) * pageSize) + 1}</span> a{' '}
                          <span className="font-medium">{Math.min(currentPage * pageSize, pagination.total)}</span> de{' '}
                          <span className="font-medium">{pagination.total}</span> resultados
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                          <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Icon name="chevron-left" size={20} />
                          </button>
                          {[...Array(pagination.totalPages)].map((_, i) => {
                            const page = i + 1;
                            if (
                              page === 1 ||
                              page === pagination.totalPages ||
                              (page >= currentPage - 2 && page <= currentPage + 2)
                            ) {
                              return (
                                <button
                                  key={page}
                                  onClick={() => setCurrentPage(page)}
                                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                    currentPage === page
                                      ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                  }`}
                                >
                                  {page}
                                </button>
                              );
                            } else if (page === currentPage - 3 || page === currentPage + 3) {
                              return (
                                <span key={page} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                  ...
                                </span>
                              );
                            }
                            return null;
                          })}
                          <button
                            onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                            disabled={currentPage === pagination.totalPages}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Icon name="chevron-right" size={20} />
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Assign Period Modal */}
      {assignModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Asignar Período</h2>
            <p className="text-sm text-gray-600 mb-4">
              Selecciona un período en estatus <strong>ABIERTO</strong> con cupo disponible.
              Si el período requiere pago, el alumno quedará en pendiente de pago.
              La asignación admin no depende de la ventana de inscripción pública.
            </p>
            {openPeriods.length === 0 ? (
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                No hay períodos ABIERTOS con cupo. Crea o abre un período en Administración → Períodos de examen.
              </div>
            ) : null}
            <FormField
              label="Período"
              name="assignPeriodId"
              value={assignModal.periodId}
              onChange={(e) => setAssignModal({ ...assignModal, periodId: e.target.value })}
              as="select"
              options={[
                { value: '', label: 'Selecciona un período' },
                ...openPeriods.map((p) => ({
                  value: p.id,
                  label: `${p.nombre} (${(p.cupoMaximo || 0) - (p.cupoActual || 0)} cupos)`,
                })),
              ]}
            />
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={handleCloseAssignModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAssignPeriod}
                disabled={!assignModal.periodId || assigning}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {assigning ? <ButtonLoader /> : null}
                Asignar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Approval Modal */}
      {paymentModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Recibir Comprobante y Aprobar Pago
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              El estudiante ha entregado el comprobante físico. Ingresa los datos del pago:
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto del Pago *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={paymentModal.montoPago}
                  onChange={(e) => setPaymentModal({ ...paymentModal, montoPago: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observaciones (Opcional)
                </label>
                <textarea
                  value={paymentModal.observaciones}
                  onChange={(e) => setPaymentModal({ ...paymentModal, observaciones: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Notas sobre el comprobante recibido..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={handleClosePaymentModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleApprovePayment}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
              >
                Aprobar Pago
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

