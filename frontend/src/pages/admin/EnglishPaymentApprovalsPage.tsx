// English Payment Approvals Page - Admin approves/rejects payment proofs
// Bandeja única: cursos de inglés y exámenes de diagnóstico con costo.
import { useEffect, useState } from 'react';
import { Layout } from '../../components/layout/Layout';
import { specialCoursesApi, examsApi } from '../../lib/api';
import { Loader, Card, Icon, ButtonLoader, Badge, PromptDialog } from '../../components/ui';
import { useToast } from '../../context/ToastContext';

type ApprovalKind = 'curso' | 'examen';

interface PendingApproval {
  id: string;
  kind: ApprovalKind;
  codigo: string;
  fechaInscripcion: string;
  nivelIngles: number | null;
  montoPago: number | null;
  /** Descripción legible de la actividad (curso/examen) */
  descripcion: string;
  student: {
    id: string;
    matricula: string;
    nombre: string;
  };
}

export const EnglishPaymentApprovalsPage = () => {
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectDialog, setRejectDialog] = useState<{
    isOpen: boolean;
    activityId: string | null;
    kind: ApprovalKind | null;
  }>({
    isOpen: false,
    activityId: null,
    kind: null,
  });
  const { showToast } = useToast();

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      setError(null);

      const [coursesRes, examsRes] = await Promise.all([
        specialCoursesApi.getAll({
          estatus: 'PENDIENTE_PAGO',
          courseType: 'INGLES',
          requierePago: true,
          limit: 100,
        }),
        examsApi.getAll({
          estatus: 'PENDIENTE_PAGO',
          examType: 'DIAGNOSTICO',
          limit: 100,
        }),
      ]);

      const courseApprovals: PendingApproval[] = coursesRes.courses
        .filter(
          (c) =>
            c.course?.requierePago &&
            c.course?.pagoAprobado === null &&
            c.estatus === 'PENDIENTE_PAGO' &&
            c.student
        )
        .map((c) => ({
          id: c.id,
          kind: 'curso' as const,
          codigo: c.codigo,
          fechaInscripcion: c.fechaInscripcion,
          nivelIngles: c.course?.nivelIngles ?? null,
          montoPago: c.course?.montoPago ?? null,
          descripcion: `Curso de inglés${c.course?.nivelIngles ? ` — Nivel ${c.course.nivelIngles}` : ''}`,
          student: {
            id: c.student!.id,
            matricula: c.student!.matricula,
            nombre: `${c.student!.nombre} ${c.student!.apellidoPaterno || ''} ${c.student!.apellidoMaterno || ''}`.trim(),
          },
        }));

      const examApprovals: PendingApproval[] = examsRes.exams
        .filter(
          (e) =>
            e.exam?.requierePago &&
            (e.exam?.pagoAprobado === null || e.exam?.pagoAprobado === undefined) &&
            e.estatus === 'PENDIENTE_PAGO' &&
            e.student
        )
        .map((e) => ({
          id: e.id,
          kind: 'examen' as const,
          codigo: e.codigo,
          fechaInscripcion: e.fechaInscripcion,
          nivelIngles: null,
          montoPago: e.exam?.montoPago ?? null,
          descripcion: 'Examen de diagnóstico',
          student: {
            id: e.student!.id,
            matricula: e.student!.matricula,
            nombre: `${e.student!.nombre} ${e.student!.apellidoPaterno || ''} ${e.student!.apellidoMaterno || ''}`.trim(),
          },
        }));

      const all = [...courseApprovals, ...examApprovals].sort(
        (a, b) => new Date(a.fechaInscripcion).getTime() - new Date(b.fechaInscripcion).getTime()
      );
      setApprovals(all);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar las aprobaciones pendientes');
      console.error('Error fetching pending approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  // State for payment approval modal
  const [paymentModal, setPaymentModal] = useState<{
    isOpen: boolean;
    activityId: string | null;
    kind: ApprovalKind | null;
    montoPago: string;
    observaciones: string;
    fechaInicio: string;
  }>({
    isOpen: false,
    activityId: null,
    kind: null,
    montoPago: '',
    observaciones: '',
    fechaInicio: '',
  });

  const handleOpenPaymentModal = (activityId: string, kind: ApprovalKind, montoPago: number | null) => {
    setPaymentModal({
      isOpen: true,
      activityId,
      kind,
      montoPago: montoPago != null ? String(montoPago) : '',
      observaciones: '',
      fechaInicio: '',
    });
  };

  const handleClosePaymentModal = () => {
    setPaymentModal({
      isOpen: false,
      activityId: null,
      kind: null,
      montoPago: '',
      observaciones: '',
      fechaInicio: '',
    });
  };

  const handleApprove = async () => {
    if (!paymentModal.activityId || !paymentModal.kind) return;

    const montoPago = parseFloat(paymentModal.montoPago);
    if (isNaN(montoPago) || montoPago <= 0) {
      showToast('El monto del pago debe ser mayor a 0', 'error');
      return;
    }

    try {
      setApprovingId(paymentModal.activityId);
      if (paymentModal.kind === 'curso') {
        await specialCoursesApi.receiveAndApprovePayment(paymentModal.activityId, {
          montoPago,
          observaciones: paymentModal.observaciones || undefined,
          fechaInicio: paymentModal.fechaInicio || undefined,
        });
      } else {
        await examsApi.receiveAndApproveExamPayment(paymentModal.activityId, {
          montoPago,
          observaciones: paymentModal.observaciones || undefined,
        });
      }
      showToast('Comprobante físico recibido y pago aprobado exitosamente', 'success');
      handleClosePaymentModal();
      await fetchApprovals();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Error al aprobar el pago';
      showToast(errorMessage, 'error');
    } finally {
      setApprovingId(null);
    }
  };

  const handleOpenRejectDialog = (activityId: string, kind: ApprovalKind) => {
    setRejectDialog({
      isOpen: true,
      activityId,
      kind,
    });
  };

  const handleCloseRejectDialog = () => {
    setRejectDialog({
      isOpen: false,
      activityId: null,
      kind: null,
    });
  };

  const handleReject = async (motivo: string) => {
    if (!rejectDialog.activityId || !rejectDialog.kind) return;

    if (!motivo.trim()) {
      showToast('Por favor ingresa un motivo para rechazar el pago', 'error');
      return;
    }

    try {
      setRejectingId(rejectDialog.activityId);
      if (rejectDialog.kind === 'curso') {
        await specialCoursesApi.rejectPayment(rejectDialog.activityId, { motivo });
      } else {
        await examsApi.rejectExamPayment(rejectDialog.activityId, motivo);
      }
      showToast('Pago rechazado', 'success');
      handleCloseRejectDialog();
      await fetchApprovals();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Error al rechazar el pago';
      showToast(errorMessage, 'error');
    } finally {
      setRejectingId(null);
    }
  };

  if (loading) {
    return (
      <Layout>
        <Loader text="Cargando aprobaciones pendientes..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-on-surface mb-2 font-headline">Aprobaciones de Pago - Inglés</h1>
          <p className="text-on-surface-variant">
            Revisa y aprueba o rechaza los comprobantes de pago de cursos de inglés y exámenes de diagnóstico.
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-error-container/30 border border-error/30 rounded-lg p-4">
            <p className="text-error">{error}</p>
          </div>
        )}

        {approvals.length === 0 ? (
          <Card className="p-12 text-center">
            <Icon name="check-circle" size={64} className="text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-on-surface mb-2">No hay aprobaciones pendientes</h2>
            <p className="text-on-surface-variant">Todos los pagos han sido procesados.</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {approvals.map((approval) => (
              <Card key={`${approval.kind}-${approval.id}`} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Badge variant={approval.kind === 'curso' ? 'success' : 'info'}>
                    {approval.kind === 'curso' ? 'Curso de inglés' : 'Examen de diagnóstico'}
                  </Badge>
                  <span className="text-sm text-on-surface-variant">{approval.codigo}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Student Info */}
                  <div>
                    <h3 className="text-lg font-semibold text-on-surface mb-4">Información del Estudiante</h3>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-on-surface-variant">Nombre</p>
                        <p className="font-medium text-on-surface">{approval.student.nombre}</p>
                      </div>
                      <div>
                        <p className="text-sm text-on-surface-variant">Matrícula</p>
                        <p className="font-medium text-on-surface">{approval.student.matricula}</p>
                      </div>
                    </div>
                  </div>

                  {/* Activity Info */}
                  <div>
                    <h3 className="text-lg font-semibold text-on-surface mb-4">Información de la Solicitud</h3>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-on-surface-variant">Actividad</p>
                        <p className="font-medium text-on-surface">{approval.descripcion}</p>
                      </div>
                      <div>
                        <p className="text-sm text-on-surface-variant">Monto</p>
                        <p className="font-medium text-on-surface">
                          ${approval.montoPago?.toFixed(2) || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-on-surface-variant">Fecha de Solicitud</p>
                        <p className="font-medium text-on-surface">
                          {new Date(approval.fechaInscripcion).toLocaleDateString('es-MX')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="mt-6 pt-6 border-t border-outline-variant/30">
                  <h3 className="text-lg font-semibold text-on-surface mb-2">Información de Pago</h3>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Nota:</strong> El estudiante debe entregar el comprobante de pago físico en Servicio Estudiantil.
                      Una vez recibido, ingresa el monto del pago y aprueba la solicitud.
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 pt-6 border-t border-outline-variant/30 flex gap-4">
                  <button
                    onClick={() => handleOpenPaymentModal(approval.id, approval.kind, approval.montoPago)}
                    disabled={approvingId === approval.id || rejectingId === approval.id}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Icon name="check" size={20} />
                    Recibir y Aprobar
                  </button>
                  <button
                    onClick={() => handleOpenRejectDialog(approval.id, approval.kind)}
                    disabled={approvingId === approval.id || rejectingId === approval.id}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {rejectingId === approval.id ? (
                      <>
                        <ButtonLoader />
                        Rechazando...
                      </>
                    ) : (
                      <>
                        <Icon name="x" size={20} />
                        Rechazar Pago
                      </>
                    )}
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Payment Approval Modal */}
      {paymentModal.isOpen && (
        <div className="fixed inset-0 bg-surface-variant/75 flex items-center justify-center z-50">
          <div className="bg-surface border border-outline-variant rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold text-on-surface mb-4">
              Recibir Comprobante y Aprobar Pago
            </h2>
            <p className="text-sm text-on-surface-variant mb-4">
              El estudiante ha entregado el comprobante físico. Ingresa los datos del pago:
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">
                  Monto del Pago *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={paymentModal.montoPago}
                  onChange={(e) => setPaymentModal({ ...paymentModal, montoPago: e.target.value })}
                  className="w-full px-3 py-2 border border-outline-variant rounded-lg bg-surface text-on-surface focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="0.00"
                  required
                />
              </div>

              {/* La fecha de inicio solo aplica a cursos */}
              {paymentModal.kind === 'curso' && (
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1">
                    Fecha de Inicio del Curso (Opcional)
                  </label>
                  <input
                    type="date"
                    value={paymentModal.fechaInicio}
                    onChange={(e) => setPaymentModal({ ...paymentModal, fechaInicio: e.target.value })}
                    className="w-full px-3 py-2 border border-outline-variant rounded-lg bg-surface text-on-surface focus:ring-2 focus:ring-primary focus:border-primary"
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <p className="text-xs text-on-surface-variant mt-1">
                    Fecha en que iniciará el curso. Si no se especifica, se puede establecer más tarde.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">
                  Observaciones (Opcional)
                </label>
                <textarea
                  value={paymentModal.observaciones}
                  onChange={(e) => setPaymentModal({ ...paymentModal, observaciones: e.target.value })}
                  className="w-full px-3 py-2 border border-outline-variant rounded-lg bg-surface text-on-surface focus:ring-2 focus:ring-primary focus:border-primary"
                  rows={3}
                  placeholder="Notas sobre el comprobante recibido..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={handleClosePaymentModal}
                className="px-4 py-2 text-sm font-medium text-on-surface bg-surface-container rounded-lg hover:bg-surface-container-high transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleApprove}
                disabled={approvingId === paymentModal.activityId}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {approvingId === paymentModal.activityId ? (
                  <>
                    <ButtonLoader />
                    Aprobando...
                  </>
                ) : (
                  'Aprobar Pago'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Payment Modal (componente reutilizable) */}
      <PromptDialog
        isOpen={rejectDialog.isOpen}
        title="Rechazar pago"
        message="¿Seguro que deseas rechazar este pago? Indica el motivo (se mostrará al estudiante)."
        label="Motivo del rechazo"
        placeholder="Ingresa el motivo del rechazo..."
        confirmText="Rechazar pago"
        cancelText="Cancelar"
        required
        variant="danger"
        onConfirm={handleReject}
        onCancel={handleCloseRejectDialog}
      />
    </Layout>
  );
};
