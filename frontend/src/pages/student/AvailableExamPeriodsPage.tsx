// Available Exam Periods Page - Student can view and enroll in available exam periods
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { examPeriodsApi, examsApi } from '../../lib/api';
import { getExamEligibility, hasPriorDiagnosticExam, type StudentEnglishStatusSnapshot } from '../../lib/englishEligibility';
import { useToast } from '../../context/ToastContext';
import { Card, Loader, Icon, ConfirmDialog, Badge } from '../../components/ui';
import {
  alertBanner,
  btnPrimary,
  btnPrimaryFull,
  studentPage,
} from '../../lib/studentEnglishPresentation';
import type { AvailableExamPeriod } from '../../types';

export const AvailableExamPeriodsPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [periods, setPeriods] = useState<AvailableExamPeriod[]>([]);
  const [englishStatus, setEnglishStatus] = useState<StudentEnglishStatusSnapshot | null>(null);
  const [examEligibility, setExamEligibility] = useState<ReturnType<typeof getExamEligibility> | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [waitlisting, setWaitlisting] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    | { type: 'enroll'; periodId: string; periodName: string }
    | { type: 'waitlist' }
    | null
  >(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [periodsResult, status] = await Promise.all([
        examPeriodsApi.getAvailablePeriods(),
        examsApi.getStudentEnglishStatusV2(),
      ]);
      const snapshot: StudentEnglishStatusSnapshot = {
        cumpleRequisitoIngles: status.cumpleRequisitoIngles,
        nivelInglesActual: status.nivelInglesActual,
        pendingExam: status.pendingExam,
        diagnosticExams: status.diagnosticExams,
        englishCourses: status.englishCourses,
      };
      setEnglishStatus(snapshot);
      setExamEligibility(getExamEligibility(snapshot));
      setPeriods(periodsResult.periods.filter((p) => p.estaDisponible));
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { error?: string } } }).response?.data?.error ||
        'Error al cargar los períodos disponibles';
      showToast(errorMessage, 'error');
      setPeriods([]);
    } finally {
      setLoading(false);
    }
  };

  const requestEnroll = (periodId: string, periodName: string) => {
    if (!examEligibility?.canRequest) {
      showToast(examEligibility?.reason || 'No puedes inscribirte en este momento', 'error');
      return;
    }
    setConfirmAction({ type: 'enroll', periodId, periodName });
  };

  const performEnroll = async (periodId: string) => {
    try {
      setEnrolling(periodId);
      const response = await examsApi.createDiagnosticExam({
        examType: 'DIAGNOSTICO',
        periodId,
      });
      const estatus = response.activity?.estatus;
      const toastMessage =
        estatus === 'PENDIENTE_PAGO'
          ? 'Examen solicitado. Debes realizar el pago para completar tu inscripción.'
          : 'Te has inscrito exitosamente al período de exámenes';
      showToast(toastMessage, 'success');
      navigate('/student/english/status');
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { error?: string } } }).response?.data?.error ||
        'Error al inscribirse al período';
      showToast(errorMessage, 'error');
    } finally {
      setEnrolling(null);
    }
  };

  const requestWaitlist = () => {
    if (!examEligibility?.canRequest) {
      showToast(examEligibility?.reason || 'No puedes inscribirte en este momento', 'error');
      return;
    }
    setConfirmAction({ type: 'waitlist' });
  };

  const performWaitlist = async () => {
    try {
      setWaitlisting(true);
      await examsApi.createDiagnosticExam({ examType: 'DIAGNOSTICO' });
      showToast('Solicitud registrada en lista de espera. Te avisaremos cuando haya un período disponible.', 'success');
      navigate('/student/english/status');
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { error?: string } } }).response?.data?.error ||
        'Error al entrar a la lista de espera';
      showToast(errorMessage, 'error');
    } finally {
      setWaitlisting(false);
    }
  };

  const handleConfirm = async () => {
    if (!confirmAction) return;
    const action = confirmAction;
    setConfirmAction(null);
    if (action.type === 'enroll') {
      await performEnroll(action.periodId);
    } else {
      await performWaitlist();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
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

  const priorDiagnostic = englishStatus ? hasPriorDiagnosticExam(englishStatus) : false;
  const canEnroll = examEligibility?.canRequest ?? false;

  if (loading) {
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={() => navigate('/student/english/status')}
            className={studentPage.backLink}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver al estado de inglés
          </button>
          <h1 className={studentPage.title}>Períodos de Exámenes Disponibles</h1>
          <p className={studentPage.subtitle}>
            {priorDiagnostic
              ? 'Para un segundo examen de diagnóstico debes inscribirte a un período publicado (puede tener costo).'
              : 'Selecciona un período abierto o solicita el examen sin período para entrar a lista de espera.'}
          </p>
        </div>

        {!canEnroll && examEligibility?.reason && (
          <div className={`mb-6 rounded-lg p-4 flex items-start gap-3 ${alertBanner.pending}`}>
            <Icon name="warning" size={24} className="text-secondary mt-0.5" />
            <div>
              <h3 className="font-semibold text-on-surface mb-1">No puedes inscribirte ahora</h3>
              <p className={`text-sm ${studentPage.body}`}>{examEligibility.reason}</p>
            </div>
          </div>
        )}

        {periods.length === 0 ? (
          <Card className="p-8 text-center">
            <svg className="w-16 h-16 text-outline mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className={`text-lg font-semibold ${studentPage.sectionTitle} mb-2`}>No hay períodos disponibles</h3>
            <p className={`${studentPage.subtitle} mb-4`}>
              {priorDiagnostic
                ? 'No hay períodos de examen abiertos en este momento. Vuelve cuando el administrador publique uno.'
                : 'No hay períodos abiertos. Puedes solicitar tu primer examen y quedar en lista de espera hasta que se asignen fechas.'}
            </p>
            {!priorDiagnostic && canEnroll && (
              <button
                onClick={requestWaitlist}
                disabled={waitlisting}
                className={`inline-flex items-center gap-2 px-6 py-3 font-medium ${btnPrimary}`}
              >
                {waitlisting ? 'Procesando...' : 'Entrar a lista de espera'}
              </button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {periods.map((period) => (
              <Card key={period.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <h3 className={studentPage.sectionTitle}>{period.nombre}</h3>
                  <Badge variant="success">Disponible</Badge>
                </div>

                {period.descripcion && <p className={`${studentPage.subtitle} mb-4`}>{period.descripcion}</p>}

                <div className="space-y-3 mb-4">
                  <div>
                    <p className={studentPage.label}>Inscripciones:</p>
                    <p className={studentPage.body}>
                      {formatDateTime(period.fechaInscripcionInicio)} - {formatDateTime(period.fechaInscripcionFin)}
                    </p>
                  </div>
                  <div>
                    <p className={studentPage.label}>Período de Exámenes:</p>
                    <p className={studentPage.body}>
                      {formatDate(period.fechaInicio)} - {formatDate(period.fechaFin)}
                    </p>
                  </div>
                  <div>
                    <p className={studentPage.label}>Cupos:</p>
                    <p className={studentPage.body}>
                      {period.cuposDisponibles} de {period.cupoMaximo} disponibles
                    </p>
                  </div>
                  {period.requierePago && period.montoPago != null && (
                    <div>
                      <p className={studentPage.label}>Costo:</p>
                      <p className={studentPage.body}>
                        ${period.montoPago.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => requestEnroll(period.id, period.nombre)}
                  disabled={!canEnroll || enrolling === period.id || period.cuposDisponibles === 0}
                  className={btnPrimaryFull}
                >
                  {enrolling === period.id ? (
                    <>
                      <Loader size="sm" />
                      Inscribiendo...
                    </>
                  ) : (
                    'Inscribirme'
                  )}
                </button>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmAction !== null}
        title={confirmAction?.type === 'waitlist' ? 'Entrar a lista de espera' : 'Confirmar inscripción'}
        message={
          confirmAction?.type === 'enroll'
            ? `¿Deseas inscribirte al período "${confirmAction.periodName}"?`
            : 'No hay período abierto. ¿Deseas entrar a la lista de espera? Tu primer diagnóstico es gratuito y el administrador te asignará fechas cuando publique un período.'
        }
        confirmText={confirmAction?.type === 'waitlist' ? 'Entrar' : 'Inscribirme'}
        cancelText="Cancelar"
        variant="info"
        onConfirm={handleConfirm}
        onCancel={() => setConfirmAction(null)}
      />
    </Layout>
  );
};
