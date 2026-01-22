// English Payment Approvals Page - Admin can approve/reject payment proofs
// V2: Usa nuevos endpoints
import { useEffect, useState } from 'react';
import { Layout } from '../../components/layout/Layout';
import { specialCoursesApi } from '../../lib/api';
import { Loader, Card, Icon, ButtonLoader } from '../../components/ui';
import { useToast } from '../../context/ToastContext';

interface PendingApproval {
  id: string;
  codigo: string;
  fechaInscripcion: string;
  nivelIngles: number | null;
  montoPago: number | null;
  comprobantePago: string | null;
  student: {
    id: string;
    matricula: string;
    nombre: string;
    carrera: string;
  };
  subject: {
    id: string;
    clave: string;
    nombre: string;
  };
}

export const EnglishPaymentApprovalsPage = () => {
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectMotivo, setRejectMotivo] = useState<string>('');
  const [rejectDialog, setRejectDialog] = useState<{
    isOpen: boolean;
    activityId: string | null;
  }>({
    isOpen: false,
    activityId: null,
  });
  const { showToast } = useToast();

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      setError(null);
      // V2: Usar nuevo endpoint de special courses
      const response = await specialCoursesApi.getAll({
        estatus: 'PENDIENTE_PAGO',
        courseType: 'INGLES',
        requierePago: true,
        limit: 100,
      });
      
      // Transformar datos al formato esperado por el componente
      const transformedApprovals = response.courses
        .filter(course => {
          // Filtrar solo cursos que requieren pago y están pendientes
          return course.course?.requierePago && 
                 course.course?.pagoAprobado === null &&
                 course.estatus === 'PENDIENTE_PAGO' &&
                 course.student; // Asegurar que tiene estudiante
        })
        .map(course => ({
          id: course.id,
          codigo: course.codigo,
          fechaInscripcion: course.fechaInscripcion,
          nivelIngles: course.course?.nivelIngles || null,
          montoPago: course.course?.montoPago || null,
          comprobantePago: null, // Ya no se usa comprobante digital
          student: {
            id: course.student!.id,
            matricula: course.student!.matricula,
            nombre: `${course.student!.nombre} ${course.student!.apellidoPaterno || ''} ${course.student!.apellidoMaterno || ''}`.trim(),
            carrera: 'Ingeniería en Sistemas', // Default, se puede mejorar
          },
          subject: {
            id: '',
            clave: 'INGLES',
            nombre: `Inglés Nivel ${course.course?.nivelIngles || 'N/A'}`,
          },
        }));
      
      setApprovals(transformedApprovals);
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
    montoPago: string;
    observaciones: string;
    fechaInicio: string;
  }>({
    isOpen: false,
    activityId: null,
    montoPago: '',
    observaciones: '',
    fechaInicio: '',
  });

  const handleOpenPaymentModal = (activityId: string) => {
    setPaymentModal({
      isOpen: true,
      activityId,
      montoPago: '',
      observaciones: '',
      fechaInicio: '',
    });
  };

  const handleClosePaymentModal = () => {
    setPaymentModal({
      isOpen: false,
      activityId: null,
      montoPago: '',
      observaciones: '',
      fechaInicio: '',
    });
  };

  const handleApprove = async () => {
    if (!paymentModal.activityId) return;

    const montoPago = parseFloat(paymentModal.montoPago);
    if (isNaN(montoPago) || montoPago <= 0) {
      showToast('El monto del pago debe ser mayor a 0', 'error');
      return;
    }

    try {
      setApprovingId(paymentModal.activityId);
      await specialCoursesApi.receiveAndApprovePayment(paymentModal.activityId, {
        montoPago,
        observaciones: paymentModal.observaciones || undefined,
        fechaInicio: paymentModal.fechaInicio || undefined,
      });
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

  const handleOpenRejectDialog = (activityId: string) => {
    setRejectDialog({
      isOpen: true,
      activityId,
    });
    setRejectMotivo('');
  };

  const handleCloseRejectDialog = () => {
    setRejectDialog({
      isOpen: false,
      activityId: null,
    });
    setRejectMotivo('');
  };

  const handleReject = async () => {
    if (!rejectDialog.activityId) return;
    
    if (!rejectMotivo.trim()) {
      showToast('Por favor ingresa un motivo para rechazar el pago', 'error');
      return;
    }

    try {
      setRejectingId(rejectDialog.activityId);
      // V2: Usa nuevo endpoint
      await specialCoursesApi.rejectPayment(rejectDialog.activityId, { motivo: rejectMotivo });
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Aprobaciones de Pago - Inglés</h1>
          <p className="text-gray-600">
            Revisa y aprueba o rechaza los comprobantes de pago para cursos de inglés.
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {approvals.length === 0 ? (
          <Card className="p-12 text-center">
            <Icon name="check-circle" size={64} className="text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No hay aprobaciones pendientes</h2>
            <p className="text-gray-600">Todos los pagos han sido procesados.</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {approvals.map((approval) => (
              <Card key={approval.id} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Student Info */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Estudiante</h3>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-gray-600">Nombre</p>
                        <p className="font-medium text-gray-900">{approval.student.nombre}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Matrícula</p>
                        <p className="font-medium text-gray-900">{approval.student.matricula}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Carrera</p>
                        <p className="font-medium text-gray-900">{approval.student.carrera}</p>
                      </div>
                    </div>
                  </div>

                  {/* Enrollment Info */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Información de la Inscripción</h3>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-gray-600">Código</p>
                        <p className="font-medium text-gray-900">{approval.codigo}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Materia</p>
                        <p className="font-medium text-gray-900">
                          {approval.subject.clave} - {approval.subject.nombre}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Nivel</p>
                        <p className="font-medium text-gray-900">
                          {approval.nivelIngles ? `Nivel ${approval.nivelIngles}` : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Monto</p>
                        <p className="font-medium text-gray-900">
                          ${approval.montoPago?.toFixed(2) || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Fecha de Inscripción</p>
                        <p className="font-medium text-gray-900">
                          {new Date(approval.fechaInscripcion).toLocaleDateString('es-MX')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Información de Pago</h3>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Nota:</strong> El estudiante debe entregar el comprobante de pago físico en Servicio Estudiantil. 
                      Una vez recibido, ingresa el monto del pago y aprueba la inscripción.
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 pt-6 border-t border-gray-200 flex gap-4">
                  <button
                    onClick={() => handleOpenPaymentModal(approval.id)}
                    disabled={approvingId === approval.id || rejectingId === approval.id}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Icon name="check" size={20} />
                    Recibir y Aprobar
                  </button>
                  <button
                    onClick={() => handleOpenRejectDialog(approval.id)}
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
                  Fecha de Inicio del Curso (Opcional)
                </label>
                <input
                  type="date"
                  value={paymentModal.fechaInicio}
                  onChange={(e) => setPaymentModal({ ...paymentModal, fechaInicio: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min={new Date().toISOString().split('T')[0]}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Fecha en que iniciará el curso. Si no se especifica, se puede establecer más tarde.
                </p>
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

      {/* Reject Payment Modal */}
      {rejectDialog.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Rechazar Pago
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              ¿Estás seguro de que deseas rechazar este pago? Por favor ingresa el motivo:
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo del rechazo *
                </label>
                <textarea
                  value={rejectMotivo}
                  onChange={(e) => setRejectMotivo(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Ingresa el motivo del rechazo..."
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={handleCloseRejectDialog}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectMotivo.trim() || rejectingId === rejectDialog.activityId}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {rejectingId === rejectDialog.activityId ? (
                  <>
                    <ButtonLoader />
                    Rechazando...
                  </>
                ) : (
                  'Rechazar Pago'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

