// English Status Page - Student dashboard for English enrollment status
import { useEffect, useState } from 'react';
import { Layout } from '../../components/layout/Layout';
import { examsApi, specialCoursesApi } from '../../lib/api';
import { getCourseEligibility, getExamEligibility } from '../../lib/englishEligibility';
import { Loader, Card, Badge, Icon, ConfirmDialog } from '../../components/ui';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';

/**
 * Estados en los que el alumno puede cancelar su solicitud: solo antes de que el
 * pago sea aprobado. Una vez inscrito (pago aprobado) debe acudir a Servicio
 * Estudiantil; el backend aplica la misma regla.
 */
const CANCELABLE_STATUSES = ['LISTA_ESPERA', 'PENDIENTE_PAGO'];

/** Ciclo de vida para agrupar exámenes y cursos del alumno */
type Lifecycle = 'solicitado' | 'inscrito' | 'historial';
const SOLICITADO_STATUSES = ['LISTA_ESPERA', 'PENDIENTE_PAGO', 'PAGO_PENDIENTE_APROBACION', 'PAGO_APROBADO'];
const INSCRITO_STATUSES = ['INSCRITO', 'EN_CURSO'];

const lifecycleOf = (estatus: string): Lifecycle => {
  if (SOLICITADO_STATUSES.includes(estatus)) return 'solicitado';
  if (INSCRITO_STATUSES.includes(estatus)) return 'inscrito';
  return 'historial';
};

/** Item normalizado (examen o curso) para la vista por ciclo de vida */
interface EnglishItem {
  kind: 'examen' | 'curso';
  id: string;
  titulo: string;
  detalle: string | null;
  estatus: string;
  calificacion: number | null;
  fechaInscripcion: string;
  requierePago: boolean;
  pagoAprobado: boolean | null;
  montoPago: number | null;
  observaciones: string | null;
  completadoPorDiagnostico: boolean;
  cancelable: boolean;
  lifecycle: Lifecycle;
}

interface EnglishStatus {
  student: {
    id: string;
    matricula: string;
    nombre: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
  };
  nivelInglesActual: number | null;
  nivelInglesCertificado: number | null;
  porcentajeIngles: number | null;
  cumpleRequisitoIngles: boolean;
  fechaExamenDiagnostico: string | null;
  diagnosticExams: Array<{
    id: string;
    codigo: string;
    fechaInscripcion: string;
    estatus: string;
    calificacion: number | null;
    nivelIngles: number | null;
    subject: string;
    period: {
      id: string;
      nombre: string;
    } | null;
    fechaExamen: string | null;
    fechaResultado: string | null;
    requierePago: boolean;
    pagoAprobado: boolean | null;
    montoPago: number | null;
    observaciones?: string | null;
  }>;
  englishCourses: Array<{
    id: string;
    codigo: string;
    nivelIngles: number | null;
    fechaInscripcion: string;
    estatus: string;
    requierePago: boolean;
    pagoAprobado: boolean | null;
    montoPago: number | null;
    calificacion: number | null;
    subject: string;
    observaciones?: string | null;
    completadoPorDiagnostico: boolean;
  }>;
  completedLevels: number[];
  missingLevels: number[];
  pendingExam: {
    id: string;
    codigo: string;
    fechaInscripcion: string;
    estatus: string;
    period: {
      id: string;
      nombre: string;
    } | null;
    requierePago: boolean;
    pagoAprobado: boolean | null;
    montoPago: number | null;
    observaciones?: string | null;
  } | null;
  progress: {
    totalLevels: number;
    completed: number;
    percentage: number;
  };
  promedioIngles?: number | null;
  requirementDetails?: {
    razonNoCumple?: string;
  };
}

export const EnglishStatusPage = () => {
  const [status, setStatus] = useState<EnglishStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<{ kind: 'examen' | 'curso'; id: string } | null>(null);
  const [showHistorial, setShowHistorial] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      // Use V2 endpoint that includes exams and courses from new architecture
      const data = await examsApi.getStudentEnglishStatusV2({ fresh: true });
      setStatus(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar el estado de inglés');
      console.error('Error fetching English status:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (estatus: string) => {
    const statusMap: Record<string, { color: string; label: string }> = {
      INSCRITO: { color: 'bg-blue-100 text-blue-800', label: 'Inscrito' },
      EN_CURSO: { color: 'bg-yellow-100 text-yellow-800', label: 'En Curso' },
      APROBADO: { color: 'bg-green-100 text-green-800', label: 'Aprobado' },
      REPROBADO: { color: 'bg-red-100 text-red-800', label: 'Reprobado' },
      EVALUADO: { color: 'bg-blue-100 text-blue-800', label: 'Evaluado' },
      PENDIENTE_PAGO: { color: 'bg-orange-100 text-orange-800', label: 'Pendiente Pago' },
      PAGO_PENDIENTE_APROBACION: { color: 'bg-purple-100 text-purple-800', label: 'Pago Pendiente' },
      PAGO_APROBADO: { color: 'bg-green-100 text-green-800', label: 'Pago Aprobado' },
      CANCELADO: { color: 'bg-gray-100 text-gray-800', label: 'Cancelado' },
      LISTA_ESPERA: { color: 'bg-indigo-100 text-indigo-800', label: 'Lista de Espera' },
    };
    const statusInfo = statusMap[estatus] || { color: 'bg-gray-100 text-gray-800', label: estatus };
    return <Badge className={statusInfo.color}>{statusInfo.label}</Badge>;
  };

  const handleCancelExam = async (activityId: string) => {
    try {
      setCancellingId(activityId);
      await examsApi.cancelExam(activityId);
      showToast('Solicitud de examen cancelada', 'success');
      await fetchStatus();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Error al cancelar la solicitud', 'error');
    } finally {
      setCancellingId(null);
    }
  };

  const handleCancelCourse = async (activityId: string) => {
    try {
      setCancellingId(activityId);
      await specialCoursesApi.cancelCourse(activityId);
      showToast('Solicitud de curso cancelada', 'success');
      await fetchStatus();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Error al cancelar la solicitud', 'error');
    } finally {
      setCancellingId(null);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    const { kind, id } = cancelTarget;
    setCancelTarget(null);
    if (kind === 'examen') {
      await handleCancelExam(id);
    } else {
      await handleCancelCourse(id);
    }
  };

  const getGradeColor = (grade: number | null) => {
    if (grade === null) return 'text-gray-500';
    if (grade >= 90) return 'text-green-600 font-semibold';
    if (grade >= 80) return 'text-blue-600 font-semibold';
    if (grade >= 70) return 'text-yellow-600 font-semibold';
    return 'text-red-600 font-semibold';
  };

  if (loading) {
    return (
      <Layout>
        <Loader text="Cargando estado de inglés..." />
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!status) {
    return null;
  }

  const examEligibility = getExamEligibility(status);
  const courseEligibility = getCourseEligibility(status);

  const examItems: EnglishItem[] = status.diagnosticExams.map((e) => ({
    kind: 'examen',
    id: e.id,
    titulo: 'Examen de diagnóstico',
    detalle: e.period ? `Período: ${e.period.nombre}` : e.subject || null,
    estatus: e.estatus,
    calificacion: e.calificacion,
    fechaInscripcion: e.fechaInscripcion,
    requierePago: e.requierePago,
    pagoAprobado: e.pagoAprobado,
    montoPago: e.montoPago,
    observaciones: e.observaciones ?? null,
    completadoPorDiagnostico: false,
    cancelable: CANCELABLE_STATUSES.includes(e.estatus) && e.calificacion === null,
    lifecycle: lifecycleOf(e.estatus),
  }));

  const courseItems: EnglishItem[] = status.englishCourses.map((c) => ({
    kind: 'curso',
    id: c.id,
    titulo: `Curso de inglés${c.nivelIngles ? ` — Nivel ${c.nivelIngles}` : ''}`,
    detalle: c.subject || null,
    estatus: c.estatus,
    calificacion: c.calificacion,
    fechaInscripcion: c.fechaInscripcion,
    requierePago: c.requierePago,
    pagoAprobado: c.pagoAprobado,
    montoPago: c.montoPago,
    observaciones: c.observaciones ?? null,
    completadoPorDiagnostico: c.completadoPorDiagnostico,
    cancelable:
      CANCELABLE_STATUSES.includes(c.estatus) && c.calificacion === null && !c.completadoPorDiagnostico,
    lifecycle: lifecycleOf(c.estatus),
  }));

  const allItems = [...examItems, ...courseItems];
  const solicitadoItems = allItems.filter((i) => i.lifecycle === 'solicitado');
  const inscritoItems = allItems.filter((i) => i.lifecycle === 'inscrito');
  const historialItems = allItems.filter((i) => i.lifecycle === 'historial');

  const renderItem = (item: EnglishItem) => {
    const paymentRejected = item.estatus === 'PENDIENTE_PAGO' && item.pagoAprobado === false;
    return (
      <div
        key={`${item.kind}-${item.id}`}
        className="flex items-start justify-between gap-4 py-4 border-b border-gray-100 last:border-b-0"
      >
        <div className="flex items-start gap-3 min-w-0">
          <Icon
            name={item.kind === 'examen' ? 'file-text' : 'book'}
            size={20}
            className={`mt-0.5 shrink-0 ${item.kind === 'examen' ? 'text-blue-500' : 'text-green-500'}`}
          />
          <div className="min-w-0">
            <div className="font-medium text-gray-900">{item.titulo}</div>
            {item.detalle && <div className="text-xs text-gray-500">{item.detalle}</div>}
            <div className="text-xs text-gray-400">
              Solicitado: {new Date(item.fechaInscripcion).toLocaleDateString('es-MX')}
            </div>
            {item.completadoPorDiagnostico && (
              <div className="text-xs text-blue-600 mt-1">✓ Acreditado por diagnóstico</div>
            )}
            {item.estatus === 'PENDIENTE_PAGO' && !paymentRejected && item.montoPago != null && (
              <div className="text-xs text-orange-700 mt-1">
                Monto a pagar: ${item.montoPago.toFixed(2)} — lleva tu comprobante a Servicio Estudiantil.
              </div>
            )}
            {paymentRejected && (
              <div className="text-xs text-red-700 mt-1">
                {item.observaciones || 'Pago rechazado. Cancela y vuelve a solicitar con el comprobante correcto.'}
              </div>
            )}
            {item.estatus === 'LISTA_ESPERA' && (
              <div className="text-xs text-indigo-700 mt-1">
                En lista de espera. El administrador te asignará {item.kind === 'examen' ? 'período' : 'grupo'} cuando haya cupo.
              </div>
            )}
            {['INSCRITO', 'EN_CURSO', 'PAGO_APROBADO'].includes(item.estatus) && item.calificacion === null && (
              <div className="text-xs text-gray-500 mt-1">
                Pago aprobado. Para cancelar o hacer cambios, acude a Servicio Estudiantil.
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          {getStatusBadge(item.estatus)}
          {item.calificacion !== null && (
            <span className={`text-sm ${getGradeColor(item.calificacion)}`}>
              {item.calificacion.toFixed(1)}
            </span>
          )}
          {item.cancelable && (
            <button
              onClick={() => setCancelTarget({ kind: item.kind, id: item.id })}
              disabled={cancellingId === item.id}
              className="text-red-600 hover:text-red-800 disabled:opacity-50 text-sm font-medium"
            >
              {cancellingId === item.id ? 'Cancelando...' : 'Cancelar'}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Estado de Inglés</h1>
          <p className="text-gray-600">
            {status.student.nombre} {status.student.apellidoPaterno} {status.student.apellidoMaterno} - {status.student.matricula}
          </p>
        </div>

        {/* Pending exam notification */}
        {status.pendingExam && (() => {
          const pe = status.pendingExam;
          const paymentRejected = pe.estatus === 'PENDIENTE_PAGO' && pe.pagoAprobado === false;
          const bannerClass = paymentRejected
            ? 'bg-red-50 border-red-200'
            : pe.estatus === 'PENDIENTE_PAGO'
            ? 'bg-orange-50 border-orange-200'
            : pe.estatus === 'PAGO_PENDIENTE_APROBACION'
            ? 'bg-purple-50 border-purple-200'
            : pe.estatus === 'LISTA_ESPERA'
            ? 'bg-indigo-50 border-indigo-200'
            : 'bg-yellow-50 border-yellow-200';
          const titleClass = paymentRejected
            ? 'text-red-900'
            : pe.estatus === 'PENDIENTE_PAGO'
            ? 'text-orange-900'
            : pe.estatus === 'PAGO_PENDIENTE_APROBACION'
            ? 'text-purple-900'
            : pe.estatus === 'LISTA_ESPERA'
            ? 'text-indigo-900'
            : 'text-yellow-900';
          const bodyClass = paymentRejected
            ? 'text-red-800'
            : pe.estatus === 'PENDIENTE_PAGO'
            ? 'text-orange-800'
            : pe.estatus === 'PAGO_PENDIENTE_APROBACION'
            ? 'text-purple-800'
            : pe.estatus === 'LISTA_ESPERA'
            ? 'text-indigo-800'
            : 'text-yellow-800';
          const detailClass = paymentRejected
            ? 'text-red-700'
            : pe.estatus === 'PENDIENTE_PAGO'
            ? 'text-orange-700'
            : pe.estatus === 'PAGO_PENDIENTE_APROBACION'
            ? 'text-purple-700'
            : pe.estatus === 'LISTA_ESPERA'
            ? 'text-indigo-700'
            : 'text-yellow-700';
          const title = paymentRejected
            ? 'Pago rechazado'
            : pe.estatus === 'PENDIENTE_PAGO'
            ? 'Examen de diagnóstico pendiente de pago'
            : pe.estatus === 'PAGO_PENDIENTE_APROBACION'
            ? 'Pago en revisión'
            : pe.estatus === 'LISTA_ESPERA'
            ? 'En lista de espera'
            : 'Tienes un examen de diagnóstico inscrito';
          const description = paymentRejected
            ? (pe.observaciones ||
              'Tu comprobante de pago fue rechazado. Cancela esta solicitud y vuelve a inscribirte cuando tengas el comprobante correcto.')
            : pe.estatus === 'PENDIENTE_PAGO'
            ? `Este examen requiere pago de $${pe.montoPago?.toFixed(2) || 'N/A'}. Lleva tu comprobante físico a Servicio Estudiantil.`
            : pe.estatus === 'PAGO_PENDIENTE_APROBACION'
            ? 'Tu comprobante de pago está siendo revisado por el administrador.'
            : pe.estatus === 'LISTA_ESPERA'
            ? 'Tu solicitud está en lista de espera. Cuando el administrador publique un período y te asigne fechas, podrás presentar el examen.'
            : 'Estás inscrito en un examen de diagnóstico. Podrás presentarlo según las fechas del período asignado.';

          return (
          <div className={`mb-8 border rounded-lg p-4 flex items-start gap-3 ${bannerClass}`}>
            <Icon
              name={paymentRejected || pe.estatus === 'PENDIENTE_PAGO' ? 'warning' : 'info'}
              size={24}
              className={`mt-0.5 ${
                paymentRejected
                  ? 'text-red-600'
                  : pe.estatus === 'PENDIENTE_PAGO'
                  ? 'text-orange-600'
                  : pe.estatus === 'PAGO_PENDIENTE_APROBACION'
                  ? 'text-purple-600'
                  : pe.estatus === 'LISTA_ESPERA'
                  ? 'text-indigo-600'
                  : 'text-yellow-600'
              }`}
            />
            <div className="flex-1">
              <h2 className={`text-lg font-semibold mb-1 ${titleClass}`}>{title}</h2>
              <p className={`text-sm mb-2 ${bodyClass}`}>{description}</p>
              <div className={`text-sm space-y-1 ${detailClass}`}>
                <p><strong>Código:</strong> {pe.codigo}</p>
                <p><strong>Fecha de inscripción:</strong> {new Date(pe.fechaInscripcion).toLocaleDateString('es-MX')}</p>
                {pe.period && (
                  <p><strong>Período:</strong> {pe.period.nombre}</p>
                )}
                {pe.requierePago && pe.montoPago && !paymentRejected && (
                  <p><strong>Monto a pagar:</strong> ${pe.montoPago.toFixed(2)}</p>
                )}
              </div>
              {pe.estatus === 'PENDIENTE_PAGO' && !paymentRejected && (
                <div className="mt-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      <strong>Instrucciones:</strong> Debes llevar tu comprobante de pago físico a Servicio Estudiantil.
                    </p>
                  </div>
                </div>
              )}
              {CANCELABLE_STATUSES.includes(pe.estatus) && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => setCancelTarget({ kind: 'examen', id: pe.id })}
                    disabled={cancellingId === pe.id}
                    className="px-4 py-2 text-sm font-medium text-red-700 border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50"
                  >
                    {cancellingId === pe.id ? 'Cancelando...' : 'Cancelar solicitud'}
                  </button>
                </div>
              )}
            </div>
          </div>
          );
        })()}

        {/* Second diagnostic exam (retake via period) */}
        {!status.pendingExam &&
          !status.cumpleRequisitoIngles &&
          status.diagnosticExams.some((e) => ['APROBADO', 'EVALUADO'].includes(e.estatus)) && (
          <div className="mb-8 bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-start gap-3">
            <Icon name="info" size={24} className="text-slate-600 mt-0.5" />
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-1">¿Quieres presentar otro diagnóstico?</h2>
              <p className="text-sm text-slate-800 mb-3">
                Ya completaste un examen de diagnóstico. Si deseas un segundo intento, inscríbete a un período
                publicado (puede tener costo según el período).
              </p>
              <button
                type="button"
                onClick={() => navigate('/student/english/available-exam-periods')}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm"
              >
                Solicitar segundo diagnóstico
              </button>
            </div>
          </div>
        )}

        {/* Diagnostic exam recommendation */}
        {!status.nivelInglesActual && !status.pendingExam && examEligibility.canRequest && (
          <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <Icon name="info" size={24} className="text-blue-600 mt-0.5" />
            <div>
              <h2 className="text-lg font-semibold text-blue-900 mb-1">
                Aún no tienes examen de diagnóstico de inglés
              </h2>
              <p className="text-sm text-blue-800 mb-3">
                Te recomendamos realizar primero tu examen de diagnóstico para conocer tu nivel actual y poder
                inscribirte a los cursos de inglés adecuados. Sin diagnóstico, solo podrás inscribirte directamente
                al nivel 1.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/student/english/available-exam-periods')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Ver períodos de examen disponibles
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Nivel Actual</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {status.nivelInglesActual ? `Nivel ${status.nivelInglesActual}` : 'No definido'}
                </p>
              </div>
              <Icon name="book" size={32} className="text-blue-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Nivel Certificado</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {status.nivelInglesCertificado ? `Nivel ${status.nivelInglesCertificado}` : 'Ninguno'}
                </p>
              </div>
              <Icon name="award" size={32} className="text-green-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Promedio Inglés</p>
                <p className={`text-2xl font-bold mt-1 ${getGradeColor(status.porcentajeIngles)}`}>
                  {status.porcentajeIngles !== null ? `${status.porcentajeIngles.toFixed(1)}%` : 'N/A'}
                </p>
              </div>
              <Icon name="star" size={32} className="text-yellow-500" />
            </div>
          </Card>

          <Card className={`p-6 ${status.cumpleRequisitoIngles ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Requisito de Graduación</p>
                <p className={`text-2xl font-bold mt-1 ${status.cumpleRequisitoIngles ? 'text-green-700' : 'text-red-700'}`}>
                  {status.cumpleRequisitoIngles ? 'Cumplido' : 'Pendiente'}
                </p>
                <div className="text-xs text-gray-600 mt-2 space-y-1">
                  <p>• Promedio ≥ 70%</p>
                  <p>• Niveles 1-6 completados</p>
                  {!status.cumpleRequisitoIngles && status.requirementDetails?.razonNoCumple && (
                    <p className="text-red-600 font-medium mt-2">
                      {status.requirementDetails.razonNoCumple}
                    </p>
                  )}
                </div>
              </div>
              <Icon name={status.cumpleRequisitoIngles ? 'check-circle' : 'x-circle'} size={32} className={status.cumpleRequisitoIngles ? 'text-green-500' : 'text-red-500'} />
            </div>
          </Card>
        </div>

        {/* Progress Bar */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Progreso de Niveles</h2>
          <div className="mb-2">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Niveles completados: {status.progress.completed} de {status.progress.totalLevels}</span>
              <span>{status.progress.percentage.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                style={{ width: `${status.progress.percentage}%` }}
              />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6].map((level) => (
              <Badge
                key={level}
                className={
                  status.completedLevels.includes(level)
                    ? 'bg-green-100 text-green-800'
                    : status.missingLevels.includes(level)
                    ? 'bg-gray-100 text-gray-600'
                    : 'bg-yellow-100 text-yellow-800'
                }
              >
                Nivel {level} {status.completedLevels.includes(level) ? '✓' : ''}
              </Badge>
            ))}
          </div>
        </Card>

        {/* Solicitudes en proceso (solicitado / en espera) */}
        {solicitadoItems.length > 0 && (
          <Card className="p-6 mb-8">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-xl font-semibold text-gray-900">Solicitudes en proceso</h2>
              <Badge className="bg-indigo-100 text-indigo-800">{solicitadoItems.length}</Badge>
            </div>
            <p className="text-sm text-gray-500 mb-2">
              Solicitudes de examen o curso en lista de espera o pendientes de pago.
            </p>
            {solicitadoItems.map(renderItem)}
          </Card>
        )}

        {/* Inscripciones activas (inscrito / en curso) */}
        {inscritoItems.length > 0 && (
          <Card className="p-6 mb-8">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-xl font-semibold text-gray-900">Inscripciones activas</h2>
              <Badge className="bg-blue-100 text-blue-800">{inscritoItems.length}</Badge>
            </div>
            <p className="text-sm text-gray-500 mb-2">
              Exámenes y cursos en los que ya estás inscrito.
            </p>
            {inscritoItems.map(renderItem)}
          </Card>
        )}

        {/* Empty-state: sin actividad de inglés todavía */}
        {allItems.length === 0 && (
          <Card className="p-8 mb-8 text-center">
            <Icon name="book" size={40} className="text-gray-300 mx-auto mb-3" />
            <h2 className="text-xl font-semibold text-gray-900 mb-1">
              Aún no tienes exámenes ni cursos de inglés
            </h2>
            <p className="text-gray-600 mb-4 max-w-xl mx-auto">
              Cuando solicites un examen de diagnóstico o un curso, aparecerán aquí con su estatus
              (lista de espera, pendiente de pago, inscrito) para que sigas su avance.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              {examEligibility.canRequest && (
                <button
                  onClick={() => navigate('/student/english/available-exam-periods')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Solicitar examen de diagnóstico
                </button>
              )}
              {courseEligibility.canRequest && (
                <button
                  onClick={() => navigate('/student/english/available-courses')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Ver cursos de inglés disponibles
                </button>
              )}
            </div>
          </Card>
        )}

        {/* Historial (terminales / cancelados) */}
        {historialItems.length > 0 && (
          <Card className="p-6 mb-8">
            <button
              type="button"
              onClick={() => setShowHistorial((v) => !v)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-gray-900">Historial</h2>
                <Badge className="bg-gray-100 text-gray-700">{historialItems.length}</Badge>
              </div>
              <Icon name={showHistorial ? 'chevron-up' : 'chevron-down'} size={20} className="text-gray-500" />
            </button>
            {showHistorial && (
              <div className="mt-2">
                <p className="text-sm text-gray-500 mb-2">
                  Exámenes y cursos finalizados, evaluados o cancelados.
                </p>
                {historialItems.map(renderItem)}
              </div>
            )}
          </Card>
        )}

        {/* Actions */}
        {(examEligibility.canRequest || courseEligibility.canRequest) && (
        <div className="flex flex-wrap gap-4">
          {examEligibility.canRequest && (
          <button
            onClick={() => navigate('/student/english/available-exam-periods')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Icon name="file-text" size={20} />
            Solicitar Examen de Diagnóstico
          </button>
          )}
          {courseEligibility.canRequest && (
          <button
            onClick={() => navigate('/student/english/available-courses')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Icon name="book" size={20} />
            Solicitar Curso de Inglés
          </button>
          )}
        </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={cancelTarget !== null}
        title="Cancelar solicitud"
        message={
          cancelTarget?.kind === 'examen'
            ? '¿Seguro que quieres cancelar tu solicitud de examen de diagnóstico?'
            : '¿Seguro que quieres cancelar tu solicitud de curso de inglés?'
        }
        confirmText="Sí, cancelar"
        cancelText="No"
        variant="danger"
        onConfirm={handleConfirmCancel}
        onCancel={() => setCancelTarget(null)}
      />
    </Layout>
  );
};


