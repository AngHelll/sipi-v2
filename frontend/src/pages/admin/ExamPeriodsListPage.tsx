// Exam Periods list page for ADMIN with filters, search, and pagination
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { examPeriodsApi } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { ConfirmDialog, Loader } from '../../components/ui';
import type { ExamPeriod, ExamPeriodStatus, ExamPeriodsListResponse } from '../../types';

export const ExamPeriodsListPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [periods, setPeriods] = useState<ExamPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<ExamPeriodsListResponse['pagination'] | null>(null);

  // Delete confirmation state (if needed in future)
  const [actionConfirm, setActionConfirm] = useState<{
    isOpen: boolean;
    periodId: string | null;
    periodName: string;
    action: 'open' | 'close' | null;
  }>({
    isOpen: false,
    periodId: null,
    periodName: '',
    action: null,
  });

  // Filter states
  const [estatusFilter, setEstatusFilter] = useState<ExamPeriodStatus | ''>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState<'nombre' | 'fechaInicio' | 'fechaInscripcionInicio' | 'createdAt'>('fechaInscripcionInicio');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchPeriods();
  }, [currentPage, pageSize, estatusFilter, sortBy, sortOrder]);

  const fetchPeriods = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {
        page: currentPage,
        limit: pageSize,
        sortBy,
        sortOrder,
      };
      if (estatusFilter) {
        params.estatus = estatusFilter;
      }

      const result = await examPeriodsApi.getAllPeriods(params);
      setPeriods(result.periods);
      setPagination(result.pagination);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Error al cargar los períodos de exámenes';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      console.error('Error fetching exam periods:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNewPeriod = () => {
    navigate('/admin/exam-periods/new');
  };

  const handleEdit = (id: string) => {
    navigate(`/admin/exam-periods/${id}`);
  };

  const handleOpen = async (id: string, nombre: string) => {
    setActionConfirm({
      isOpen: true,
      periodId: id,
      periodName: nombre,
      action: 'open',
    });
  };

  const handleClose = async (id: string, nombre: string) => {
    setActionConfirm({
      isOpen: true,
      periodId: id,
      periodName: nombre,
      action: 'close',
    });
  };

  const confirmAction = async () => {
    if (!actionConfirm.periodId || !actionConfirm.action) return;

    try {
      if (actionConfirm.action === 'open') {
        await examPeriodsApi.openPeriod(actionConfirm.periodId);
        showToast('Período abierto exitosamente', 'success');
      } else if (actionConfirm.action === 'close') {
        await examPeriodsApi.closePeriod(actionConfirm.periodId);
        showToast('Período cerrado exitosamente', 'success');
      }
      setActionConfirm({ isOpen: false, periodId: null, periodName: '', action: null });
      fetchPeriods();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Error al realizar la acción';
      showToast(errorMessage, 'error');
    }
  };

  const getStatusBadge = (estatus: ExamPeriodStatus) => {
    const colors: Record<ExamPeriodStatus, string> = {
      PLANEADO: 'bg-gray-100 text-gray-800',
      ABIERTO: 'bg-green-100 text-green-800',
      CERRADO: 'bg-red-100 text-red-800',
      EN_PROCESO: 'bg-blue-100 text-blue-800',
      FINALIZADO: 'bg-purple-100 text-purple-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[estatus]}`}>
        {estatus}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && periods.length === 0) {
    return (
      <Layout>
        <div className="p-6">
          <Loader />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Períodos de Exámenes de Diagnóstico</h1>
          <button
            onClick={handleNewPeriod}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Período
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estatus</label>
              <select
                value={estatusFilter}
                onChange={(e) => {
                  setEstatusFilter(e.target.value as ExamPeriodStatus | '');
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos</option>
                <option value="PLANEADO">Planeado</option>
                <option value="ABIERTO">Abierto</option>
                <option value="CERRADO">Cerrado</option>
                <option value="EN_PROCESO">En Proceso</option>
                <option value="FINALIZADO">Finalizado</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ordenar por</label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="fechaInscripcionInicio">Fecha de Inscripción</option>
                <option value="fechaInicio">Fecha de Inicio</option>
                <option value="nombre">Nombre</option>
                <option value="createdAt">Fecha de Creación</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Orden</label>
              <select
                value={sortOrder}
                onChange={(e) => {
                  setSortOrder(e.target.value as 'asc' | 'desc');
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="desc">Descendente</option>
                <option value="asc">Ascendente</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Por página</label>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fechas de Inscripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fechas de Exámenes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cupos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estatus
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {periods.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      No se encontraron períodos de exámenes
                    </td>
                  </tr>
                ) : (
                  periods.map((period) => (
                    <tr key={period.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{period.nombre}</div>
                        {period.descripcion && (
                          <div className="text-sm text-gray-500">{period.descripcion}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDateTime(period.fechaInscripcionInicio)}
                        </div>
                        <div className="text-sm text-gray-500">
                          hasta {formatDateTime(period.fechaInscripcionFin)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(period.fechaInicio)}
                        </div>
                        <div className="text-sm text-gray-500">
                          hasta {formatDate(period.fechaFin)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {period.cupoActual} / {period.cupoMaximo}
                        </div>
                        <div className="text-xs text-gray-500">
                          {period.cupoMaximo - period.cupoActual} disponibles
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(period.estatus)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(period.id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Editar"
                          >
                            Editar
                          </button>
                          {period.estatus === 'PLANEADO' && (
                            <button
                              onClick={() => handleOpen(period.id, period.nombre)}
                              className="text-green-600 hover:text-green-900"
                              title="Abrir período"
                            >
                              Abrir
                            </button>
                          )}
                          {period.estatus === 'ABIERTO' && (
                            <button
                              onClick={() => handleClose(period.id, period.nombre)}
                              className="text-red-600 hover:text-red-900"
                              title="Cerrar período"
                            >
                              Cerrar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="text-sm text-gray-700">
                Mostrando {(pagination.page - 1) * pagination.limit + 1} a{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
                {pagination.total} períodos
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Anterior
                </button>
                <span className="px-3 py-1 text-sm text-gray-700">
                  Página {pagination.page} de {pagination.totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Confirm Dialog */}
        <ConfirmDialog
          isOpen={actionConfirm.isOpen}
          title={actionConfirm.action === 'open' ? 'Abrir Período' : 'Cerrar Período'}
          message={
            actionConfirm.action === 'open'
              ? `¿Estás seguro de que deseas abrir el período "${actionConfirm.periodName}"? Los estudiantes podrán inscribirse.`
              : `¿Estás seguro de que deseas cerrar el período "${actionConfirm.periodName}"? No se podrán realizar más inscripciones.`
          }
          confirmText={actionConfirm.action === 'open' ? 'Abrir' : 'Cerrar'}
          cancelText="Cancelar"
          onConfirm={confirmAction}
          onCancel={() => setActionConfirm({ isOpen: false, periodId: null, periodName: '', action: null })}
        />
      </div>
    </Layout>
  );
};


