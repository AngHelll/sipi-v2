// English Status Page - Student dashboard for English enrollment status
import { useEffect, useState } from 'react';
import { Layout } from '../../components/layout/Layout';
import { examsApi, specialCoursesApi } from '../../lib/api';
import { getCourseEligibility, getExamEligibility } from '../../lib/englishEligibility';
import { Loader, Card, Badge, Icon, ConfirmDialog } from '../../components/ui';
import {
  alertBanner,
  btnDangerLink,
  btnDangerOutline,
  btnPrimary,
  btnSecondary,
  englishActivityStatusBadge,
  gradeTextColor,
  studentPage,
} from '../../lib/studentEnglishPresentation';
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
    const { variant, label } = englishActivityStatusBadge(estatus);
    return <Badge variant={variant}>{label}</Badge>;
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

  const getGradeColor = gradeTextColor;

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
          <div className={`rounded-lg p-4 ${alertBanner.error}`}>
            <p className="text-on-error-container">{error}</p>
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
        className={studentPage.itemRow}
      >
        <div className="flex items-start gap-3 min-w-0">
          <Icon
            name={item.kind === 'examen' ? 'file-text' : 'book'}
            size={20}
            className={`mt-0.5 shrink-0 ${item.kind === 'examen' ? 'text-primary' : 'text-tertiary'}`}
          />
          <div className="min-w-0">
            <div className="font-medium text-on-surface">{item.titulo}</div>
            {item.detalle && <div className={`text-xs ${studentPage.meta}`}>{item.detalle}</div>}
            <div className={`text-xs ${studentPage.meta}`}>
              Solicitado: {new Date(item.fechaInscripcion).toLocaleDateString('es-MX')}
            </div>
            {item.completadoPorDiagnostico && (
              <div className="text-xs text-primary mt-1">✓ Acreditado por diagnóstico</div>
            )}
            {item.estatus === 'PENDIENTE_PAGO' && !paymentRejected && item.montoPago != null && (
              <div className="text-xs text-on-secondary-fixed-variant mt-1">
                Monto a pagar: ${item.montoPago.toFixed(2)} — lleva tu comprobante a Servicio Estudiantil.
              </div>
            )}
            {paymentRejected && (
              <div className="text-xs text-on-error-container mt-1">
                {item.observaciones || 'Pago rechazado. Cancela y vuelve a solicitar con el comprobante correcto.'}
              </div>
            )}
            {item.estatus === 'LISTA_ESPERA' && (
              <div className="text-xs text-on-tertiary-fixed-variant mt-1">
                En lista de espera. El administrador te asignará {item.kind === 'examen' ? 'período' : 'grupo'} cuando haya cupo.
              </div>
            )}
            {['INSCRITO', 'EN_CURSO', 'PAGO_APROBADO'].includes(item.estatus) && item.calificacion === null && (
              <div className={`text-xs ${studentPage.meta} mt-1`}>
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
              className={btnDangerLink}
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
          <h1 className={studentPage.title}>Estado de Inglés</h1>
          <p className={studentPage.subtitle}>
            {status.student.nombre} {status.student.apellidoPaterno} {status.student.apellidoMaterno} - {status.student.matricula}
          </p>
        </div>

        {/* Pending exam notification */}
        {status.pendingExam && (() => {
          const pe = status.pendingExam;
          const paymentRejected = pe.estatus === 'PENDIENTE_PAGO' && pe.pagoAprobado === false;
          const bannerTone = paymentRejected
            ? 'error'
            : pe.estatus === 'PENDIENTE_PAGO'
            ? 'pending'
            : 'info';
          const iconClass = paymentRejected
            ? 'text-error'
            : pe.estatus === 'PENDIENTE_PAGO'
            ? 'text-secondary'
            : 'text-primary';
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
          <div className={`mb-8 rounded-lg p-4 flex items-start gap-3 ${alertBanner[bannerTone]}`}>
            <Icon
              name={paymentRejected || pe.estatus === 'PENDIENTE_PAGO' ? 'warning' : 'info'}
              size={24}
              className={`mt-0.5 ${iconClass}`}
            />
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-on-surface mb-1">{title}</h2>
              <p className={`text-sm mb-2 ${studentPage.body}`}>{description}</p>
              <div className={`text-sm space-y-1 ${studentPage.body}`}>
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
                  <div className={`rounded-lg p-3 ${alertBanner.pending}`}>
                    <p className={`text-sm ${studentPage.body}`}>
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
                    className={btnDangerOutline}
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
          <div className={`mb-8 rounded-lg p-4 flex items-start gap-3 ${alertBanner.neutral}`}>
            <Icon name="info" size={24} className="text-on-surface-variant mt-0.5" />
            <div>
              <h2 className="text-lg font-semibold text-on-surface mb-1">¿Quieres presentar otro diagnóstico?</h2>
              <p className={`text-sm mb-3 ${studentPage.body}`}>
                Ya completaste un examen de diagnóstico. Si deseas un segundo intento, inscríbete a un período
                publicado (puede tener costo según el período).
              </p>
              <button
                type="button"
                onClick={() => navigate('/student/english/available-exam-periods')}
                className={`${btnSecondary} text-sm`}
              >
                Solicitar segundo diagnóstico
              </button>
            </div>
          </div>
        )}

        {/* Diagnostic exam recommendation */}
        {!status.nivelInglesActual && !status.pendingExam && examEligibility.canRequest && (
          <div className={`mb-8 rounded-lg p-4 flex items-start gap-3 ${alertBanner.info}`}>
            <Icon name="info" size={24} className="text-primary mt-0.5" />
            <div>
              <h2 className="text-lg font-semibold text-on-surface mb-1">
                Aún no tienes examen de diagnóstico de inglés
              </h2>
              <p className={`text-sm mb-3 ${studentPage.body}`}>
                Te recomendamos realizar primero tu examen de diagnóstico para conocer tu nivel actual y poder
                inscribirte a los cursos de inglés adecuados. Sin diagnóstico, solo podrás inscribirte directamente
                al nivel 1.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/student/english/available-exam-periods')}
                  className={`${btnPrimary} flex items-center gap-2`}
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
                <p className={studentPage.label}>Nivel Actual</p>
                <p className="text-2xl font-bold text-on-surface mt-1">
                  {status.nivelInglesActual ? `Nivel ${status.nivelInglesActual}` : 'No definido'}
                </p>
              </div>
              <Icon name="book" size={32} className="text-primary" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={studentPage.label}>Nivel Certificado</p>
                <p className="text-2xl font-bold text-on-surface mt-1">
                  {status.nivelInglesCertificado ? `Nivel ${status.nivelInglesCertificado}` : 'Ninguno'}
                </p>
              </div>
              <Icon name="award" size={32} className="text-primary" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={studentPage.label}>Promedio Inglés</p>
                <p className={`text-2xl font-bold mt-1 ${getGradeColor(status.porcentajeIngles)}`}>
                  {status.porcentajeIngles !== null ? `${status.porcentajeIngles.toFixed(1)}%` : 'N/A'}
                </p>
              </div>
              <Icon name="star" size={32} className="text-secondary" />
            </div>
          </Card>

          <Card className={`p-6 ${status.cumpleRequisitoIngles ? 'bg-primary-fixed/30' : 'bg-error-container/40'}`}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className={studentPage.label}>Requisito de Graduación</p>
                <p className={`text-2xl font-bold mt-1 ${status.cumpleRequisitoIngles ? 'text-primary' : 'text-error'}`}>
                  {status.cumpleRequisitoIngles ? 'Cumplido' : 'Pendiente'}
                </p>
                <div className={`text-xs ${studentPage.body} mt-2 space-y-1`}>
                  <p>• Promedio ≥ 70%</p>
                  <p>• Niveles 1-6 completados</p>
                  {!status.cumpleRequisitoIngles && status.requirementDetails?.razonNoCumple && (
                    <p className="text-error font-medium mt-2">
                      {status.requirementDetails.razonNoCumple}
                    </p>
                  )}
                </div>
              </div>
              <Icon name={status.cumpleRequisitoIngles ? 'check-circle' : 'x-circle'} size={32} className={status.cumpleRequisitoIngles ? 'text-primary' : 'text-error'} />
            </div>
          </Card>
        </div>

        {/* Progress Bar */}
        <Card className="p-6 mb-8">
          <h2 className={`${studentPage.sectionTitle} mb-4`}>Progreso de Niveles</h2>
          <div className="mb-2">
            <div className={`flex justify-between text-sm ${studentPage.body} mb-2`}>
              <span>Niveles completados: {status.progress.completed} de {status.progress.totalLevels}</span>
              <span>{status.progress.percentage.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-surface-container-high rounded-full h-4">
              <div
                className="bg-primary h-4 rounded-full transition-all duration-300"
                style={{ width: `${status.progress.percentage}%` }}
              />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6].map((level) => (
              <Badge
                key={level}
                variant={
                  status.completedLevels.includes(level)
                    ? 'success'
                    : status.missingLevels.includes(level)
                    ? 'default'
                    : 'warning'
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
              <h2 className={studentPage.sectionTitle}>Solicitudes en proceso</h2>
              <Badge variant="warning">{solicitadoItems.length}</Badge>
            </div>
            <p className={`text-sm ${studentPage.meta} mb-2`}>
              Solicitudes de examen o curso en lista de espera o pendientes de pago.
            </p>
            {solicitadoItems.map(renderItem)}
          </Card>
        )}

        {/* Inscripciones activas (inscrito / en curso) */}
        {inscritoItems.length > 0 && (
          <Card className="p-6 mb-8">
            <div className="flex items-center gap-2 mb-2">
              <h2 className={studentPage.sectionTitle}>Inscripciones activas</h2>
              <Badge variant="info">{inscritoItems.length}</Badge>
            </div>
            <p className={`text-sm ${studentPage.meta} mb-2`}>
              Exámenes y cursos en los que ya estás inscrito.
            </p>
            {inscritoItems.map(renderItem)}
          </Card>
        )}

        {/* Empty-state: sin actividad de inglés todavía */}
        {allItems.length === 0 && (
          <Card className="p-8 mb-8 text-center">
            <Icon name="book" size={40} className="text-outline mx-auto mb-3" />
            <h2 className={`${studentPage.sectionTitle} mb-1`}>
              Aún no tienes exámenes ni cursos de inglés
            </h2>
            <p className={`${studentPage.subtitle} mb-4 max-w-xl mx-auto`}>
              Cuando solicites un examen de diagnóstico o un curso, aparecerán aquí con su estatus
              (lista de espera, pendiente de pago, inscrito) para que sigas su avance.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              {examEligibility.canRequest && (
                <button
                  onClick={() => navigate('/student/english/available-exam-periods')}
                  className={btnPrimary}
                >
                  Solicitar examen de diagnóstico
                </button>
              )}
              {courseEligibility.canRequest && (
                <button
                  onClick={() => navigate('/student/english/available-courses')}
                  className={btnSecondary}
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
                <h2 className={studentPage.sectionTitle}>Historial</h2>
                <Badge variant="default">{historialItems.length}</Badge>
              </div>
              <Icon name={showHistorial ? 'chevron-up' : 'chevron-down'} size={20} className="text-on-surface-variant" />
            </button>
            {showHistorial && (
              <div className="mt-2">
                <p className={`text-sm ${studentPage.meta} mb-2`}>
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
            className={`${btnPrimary} flex items-center gap-2`}
          >
            <Icon name="file-text" size={20} />
            Solicitar Examen de Diagnóstico
          </button>
          )}
          {courseEligibility.canRequest && (
          <button
            onClick={() => navigate('/student/english/available-courses')}
            className={`${btnSecondary} flex items-center gap-2`}
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


