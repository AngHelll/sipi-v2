// English Payment Approvals Page - Admin approves/rejects payment proofs
// Bandeja única: cursos de inglés y exámenes de diagnóstico con costo.
import { useEffect, useState } from 'react';
import { Layout } from '../../components/layout/Layout';
import { specialCoursesApi, examsApi } from '../../lib/api';
import { Loader, Card, Icon, ButtonLoader, Badge, PromptDialog } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import { ds } from '../../lib/designSystem';

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
      <div className={ds.admin.pageShell}>
        <div className="mb-8">
          <h1 className={ds.admin.pageTitle}>Aprobaciones de Pago - Inglés</h1>
          <p className={ds.admin.pageSubtitle}>
            Revisa y aprueba o rechaza los comprobantes de pago de cursos de inglés y exámenes de diagnóstico.
          </p>
        </div>

        {error && (
          <div className={`mb-6 ${ds.admin.errorBox}`}>
            <p>{error}</p>
          </div>
        )}

        {approvals.length === 0 ? (
          <Card className="p-12 text-center">
            <Icon name="check-circle" size={64} className={`${ds.semantic.successIcon} mx-auto mb-4`} />
            <h2 className={`${ds.page.sectionTitle} mb-2`}>No hay aprobaciones pendientes</h2>
            <p className={ds.page.body}>Todos los pagos han sido procesados.</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {approvals.map((approval) => (
              <Card key={`${approval.kind}-${approval.id}`} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Badge variant={approval.kind === 'curso' ? 'success' : 'info'}>
                    {approval.kind === 'curso' ? 'Curso de inglés' : 'Examen de diagnóstico'}
                  </Badge>
                  <span className={ds.page.meta}>{approval.codigo}</span>
                </div>

                <div className={ds.admin.kvGrid}>
                  <div>
                    <h3 className={`${ds.page.sectionTitle} mb-4`}>Información del Estudiante</h3>
                    <div className="space-y-2">
                      <div>
                        <p className={ds.admin.kvLabel}>Nombre</p>
                        <p className={`${ds.admin.kvValue} font-medium`}>{approval.student.nombre}</p>
                      </div>
                      <div>
                        <p className={ds.admin.kvLabel}>Matrícula</p>
                        <p className={`${ds.admin.kvValue} font-medium`}>{approval.student.matricula}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className={`${ds.page.sectionTitle} mb-4`}>Información de la Solicitud</h3>
                    <div className="space-y-2">
                      <div>
                        <p className={ds.admin.kvLabel}>Actividad</p>
                        <p className={`${ds.admin.kvValue} font-medium`}>{approval.descripcion}</p>
                      </div>
                      <div>
                        <p className={ds.admin.kvLabel}>Monto</p>
                        <p className={`${ds.admin.kvValue} font-medium`}>
                          ${approval.montoPago?.toFixed(2) || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className={ds.admin.kvLabel}>Fecha de Solicitud</p>
                        <p className={`${ds.admin.kvValue} font-medium`}>
                          {new Date(approval.fechaInscripcion).toLocaleDateString('es-MX')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={ds.admin.sectionDivider}>
                  <h3 className={`${ds.page.sectionTitle} mb-2`}>Información de Pago</h3>
                  <div className={ds.admin.noteBanner}>
                    <p className={ds.admin.noteBannerText}>
                      <strong>Nota:</strong> El estudiante debe entregar el comprobante de pago físico en Servicio Estudiantil.
                      Una vez recibido, ingresa el monto del pago y aprueba la solicitud.
                    </p>
                  </div>
                </div>

                <div className={`${ds.admin.sectionDivider} flex gap-4`}>
                  <button
                    onClick={() => handleOpenPaymentModal(approval.id, approval.kind, approval.montoPago)}
                    disabled={approvingId === approval.id || rejectingId === approval.id}
                    className={`${ds.btn.primary} flex items-center gap-2`}
                  >
                    <Icon name="check" size={20} />
                    Recibir y Aprobar
                  </button>
                  <button
                    onClick={() => handleOpenRejectDialog(approval.id, approval.kind)}
                    disabled={approvingId === approval.id || rejectingId === approval.id}
                    className={`${ds.admin.btnSmDanger} px-4 py-2 flex items-center gap-2`}
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

      {paymentModal.isOpen && (
        <div className={ds.admin.modalOverlay}>
          <div className={ds.admin.modal}>
            <h2 className={ds.admin.modalTitle}>Recibir Comprobante y Aprobar Pago</h2>
            <p className={ds.admin.modalBody}>
              El estudiante ha entregado el comprobante físico. Ingresa los datos del pago:
            </p>

            <div className="space-y-4">
              <div>
                <label className={ds.admin.filterLabel}>Monto del Pago *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={paymentModal.montoPago}
                  onChange={(e) => setPaymentModal({ ...paymentModal, montoPago: e.target.value })}
                  className={ds.admin.input}
                  placeholder="0.00"
                  required
                />
              </div>

              {paymentModal.kind === 'curso' && (
                <div>
                  <label className={ds.admin.filterLabel}>Fecha de Inicio del Curso (Opcional)</label>
                  <input
                    type="date"
                    value={paymentModal.fechaInicio}
                    onChange={(e) => setPaymentModal({ ...paymentModal, fechaInicio: e.target.value })}
                    className={ds.admin.input}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <p className={`${ds.page.meta} mt-1`}>
                    Fecha en que iniciará el curso. Si no se especifica, se puede establecer más tarde.
                  </p>
                </div>
              )}

              <div>
                <label className={ds.admin.filterLabel}>Observaciones (Opcional)</label>
                <textarea
                  value={paymentModal.observaciones}
                  onChange={(e) => setPaymentModal({ ...paymentModal, observaciones: e.target.value })}
                  className={ds.admin.input}
                  rows={3}
                  placeholder="Notas sobre el comprobante recibido..."
                />
              </div>
            </div>

            <div className={ds.admin.modalActions}>
              <button onClick={handleClosePaymentModal} className={ds.admin.btnCancel}>
                Cancelar
              </button>
              <button
                onClick={handleApprove}
                disabled={approvingId === paymentModal.activityId}
                className={`${ds.btn.primary} text-sm flex items-center gap-2`}
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
