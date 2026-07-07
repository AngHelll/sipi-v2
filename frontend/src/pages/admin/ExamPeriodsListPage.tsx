// Exam Periods list page for ADMIN with filters, search, and pagination
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { examPeriodsApi } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { ConfirmDialog, Loader, Badge, Icon } from '../../components/ui';
import { ds, examPeriodStatusBadge } from '../../lib/designSystem';
import type { ExamPeriod, ExamPeriodStatus, ExamPeriodsListResponse } from '../../types';

export const ExamPeriodsListPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [periods, setPeriods] = useState<ExamPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<ExamPeriodsListResponse['pagination'] | null>(null);

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
      const params: Record<string, unknown> = {
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
        <div className={ds.admin.pageShellCompact}>
          <Loader />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={ds.admin.pageShellCompact}>
        <div className="flex justify-between items-center">
          <h1 className={ds.admin.pageTitle}>Períodos de Exámenes de Diagnóstico</h1>
          <button
            onClick={handleNewPeriod}
            className={`${ds.btn.primary} flex items-center gap-2`}
          >
            <Icon name="plus" size={20} />
            Nuevo Período
          </button>
        </div>

        <div className={ds.admin.filterPanel}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className={ds.admin.filterLabel}>Estatus</label>
              <select
                value={estatusFilter}
                onChange={(e) => {
                  setEstatusFilter(e.target.value as ExamPeriodStatus | '');
                  setCurrentPage(1);
                }}
                className={ds.admin.input}
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
              <label className={ds.admin.filterLabel}>Ordenar por</label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as typeof sortBy);
                  setCurrentPage(1);
                }}
                className={ds.admin.input}
              >
                <option value="fechaInscripcionInicio">Fecha de Inscripción</option>
                <option value="fechaInicio">Fecha de Inicio</option>
                <option value="nombre">Nombre</option>
                <option value="createdAt">Fecha de Creación</option>
              </select>
            </div>
            <div>
              <label className={ds.admin.filterLabel}>Orden</label>
              <select
                value={sortOrder}
                onChange={(e) => {
                  setSortOrder(e.target.value as 'asc' | 'desc');
                  setCurrentPage(1);
                }}
                className={ds.admin.input}
              >
                <option value="desc">Descendente</option>
                <option value="asc">Ascendente</option>
              </select>
            </div>
            <div>
              <label className={ds.admin.filterLabel}>Por página</label>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className={ds.admin.input}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className={ds.admin.errorBox}>{error}</div>
        )}

        <div className={ds.admin.tableWrap}>
          <div className="overflow-x-auto">
            <table className={ds.admin.table}>
              <thead className={ds.admin.thead}>
                <tr>
                  <th className={ds.admin.th}>Nombre</th>
                  <th className={ds.admin.th}>Fechas de Inscripción</th>
                  <th className={ds.admin.th}>Fechas de Exámenes</th>
                  <th className={ds.admin.th}>Cupos</th>
                  <th className={ds.admin.th}>Estatus</th>
                  <th className={ds.admin.th}>Acciones</th>
                </tr>
              </thead>
              <tbody className={ds.admin.tbody}>
                {periods.length === 0 ? (
                  <tr>
                    <td colSpan={6} className={`${ds.admin.td} text-center ${ds.semantic.mutedText}`}>
                      No se encontraron períodos de exámenes
                    </td>
                  </tr>
                ) : (
                  periods.map((period) => {
                    const statusBadge = examPeriodStatusBadge(period.estatus);
                    return (
                      <tr key={period.id} className={ds.admin.trHover}>
                        <td className={ds.admin.td}>
                          <div className={ds.admin.tdStrong}>{period.nombre}</div>
                          {period.descripcion && (
                            <div className={ds.admin.tdMeta}>{period.descripcion}</div>
                          )}
                        </td>
                        <td className={ds.admin.td}>
                          <div>{formatDateTime(period.fechaInscripcionInicio)}</div>
                          <div className={ds.admin.tdMeta}>
                            hasta {formatDateTime(period.fechaInscripcionFin)}
                          </div>
                        </td>
                        <td className={ds.admin.td}>
                          <div>{formatDate(period.fechaInicio)}</div>
                          <div className={ds.admin.tdMeta}>
                            hasta {formatDate(period.fechaFin)}
                          </div>
                        </td>
                        <td className={ds.admin.td}>
                          <div>
                            {period.cupoActual} / {period.cupoMaximo}
                          </div>
                          <div className={ds.admin.tdMeta}>
                            {period.cupoMaximo - period.cupoActual} disponibles
                          </div>
                        </td>
                        <td className={ds.admin.td}>
                          <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                        </td>
                        <td className={`${ds.admin.td} font-medium`}>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(period.id)}
                              className={ds.admin.actionLink}
                              title="Editar"
                            >
                              Editar
                            </button>
                            {period.estatus === 'PLANEADO' && (
                              <button
                                onClick={() => handleOpen(period.id, period.nombre)}
                                className={ds.admin.actionLinkSuccess}
                                title="Abrir período"
                              >
                                Abrir
                              </button>
                            )}
                            {period.estatus === 'ABIERTO' && (
                              <button
                                onClick={() => handleClose(period.id, period.nombre)}
                                className={ds.admin.actionLinkDanger}
                                title="Cerrar período"
                              >
                                Cerrar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className={ds.admin.paginationFooter}>
              <div className={ds.admin.paginationText}>
                Mostrando {(pagination.page - 1) * pagination.limit + 1} a{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
                {pagination.total} períodos
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={pagination.page === 1}
                  className={ds.admin.paginationBtn}
                >
                  Anterior
                </button>
                <span className={`${ds.admin.paginationText} px-3 py-1`}>
                  Página {pagination.page} de {pagination.totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={pagination.page === pagination.totalPages}
                  className={ds.admin.paginationBtn}
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>

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
