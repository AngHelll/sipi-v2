// Request Diagnostic Exam Page - Student can request diagnostic exam
// V2: primer diagnóstico sin período → lista de espera; retoma solo vía período publicado
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { examsApi, examPeriodsApi } from '../../lib/api';
import { Card, FormField, ButtonLoader, Icon } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import type { AvailableExamPeriod } from '../../types';

export const RequestDiagnosticExamPage = () => {
  const [periodId, setPeriodId] = useState<string>('');
  const [usePeriod, setUsePeriod] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingPeriods, setLoadingPeriods] = useState(true);
  const [availablePeriods, setAvailablePeriods] = useState<AvailableExamPeriod[]>([]);
  const [englishStatus, setEnglishStatus] = useState<any>(null);
  const [isAlreadyEnrolled, setIsAlreadyEnrolled] = useState(false);
  const [enrollmentMessage, setEnrollmentMessage] = useState<string>('');
  const [hasCompletedAllRequirements, setHasCompletedAllRequirements] = useState(false);
  const [hasPriorDiagnostic, setHasPriorDiagnostic] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    fetchAvailablePeriods();
    checkExistingExam();
  }, []);

  const checkExistingExam = async () => {
    try {
      const status = await examsApi.getStudentEnglishStatusV2();
      setEnglishStatus(status);

      if (status.cumpleRequisitoIngles) {
        setHasCompletedAllRequirements(true);
        setEnrollmentMessage(
          '¡Felicidades! Ya has cumplido con todos los requisitos de inglés. No es necesario realizar más exámenes de diagnóstico.'
        );
        return;
      }

      const priorDone = status.diagnosticExams?.some((exam: { estatus: string }) =>
        ['APROBADO', 'EVALUADO'].includes(exam.estatus)
      );
      setHasPriorDiagnostic(!!priorDone);
      if (priorDone) {
        setUsePeriod(true);
      }

      const activeExam = status.diagnosticExams?.find((exam: { estatus: string }) => {
        return !['REPROBADO', 'EVALUADO', 'APROBADO', 'CANCELADO', 'BAJA'].includes(exam.estatus);
      });

      if (activeExam) {
        setIsAlreadyEnrolled(true);
        const statusMessages: Record<string, string> = {
          INSCRITO: 'Ya estás inscrito',
          EN_CURSO: 'Ya estás presentando',
          PENDIENTE_PAGO: 'Ya tienes una solicitud pendiente de pago',
          PAGO_PENDIENTE_APROBACION: 'Ya tienes una solicitud de pago pendiente de aprobación',
          LISTA_ESPERA: 'Ya estás en lista de espera',
        };
        const statusMessage = statusMessages[activeExam.estatus] || 'Ya tienes una solicitud activa';
        setEnrollmentMessage(`${statusMessage} para un examen de diagnóstico. No puedes inscribirte nuevamente.`);
      }
    } catch (err: unknown) {
      console.error('Error checking existing exam:', err);
    }
  };

  const fetchAvailablePeriods = async () => {
    try {
      setLoadingPeriods(true);
      const result = await examPeriodsApi.getAvailablePeriods();
      const available = result.periods.filter((p) => p.estaDisponible);
      setAvailablePeriods(available);

      if (available.length === 0) {
        setUsePeriod(false);
      }
    } catch (err: unknown) {
      console.error('Error fetching available periods:', err);
      setUsePeriod(false);
    } finally {
      setLoadingPeriods(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (hasPriorDiagnostic && !periodId) {
      showToast('Para un segundo examen de diagnóstico debes seleccionar un período publicado', 'error');
      return;
    }

    if (usePeriod && !periodId) {
      showToast('Por favor selecciona un período de exámenes', 'error');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const examData: { examType: 'DIAGNOSTICO'; periodId?: string } = {
        examType: 'DIAGNOSTICO',
      };

      if (usePeriod && periodId) {
        examData.periodId = periodId;
      }

      const response = await examsApi.createDiagnosticExam(examData);
      const estatus = response.activity?.estatus;
      const toastMessage =
        estatus === 'LISTA_ESPERA'
          ? 'Solicitud registrada en lista de espera. Te avisaremos cuando haya un período disponible.'
          : estatus === 'PENDIENTE_PAGO'
          ? 'Examen solicitado. Debes realizar el pago para completar tu inscripción.'
          : 'Examen de diagnóstico solicitado exitosamente';
      showToast(toastMessage, 'success');
      navigate('/student/english/status');
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { error?: string } } }).response?.data?.error ||
        'Error al solicitar el examen de diagnóstico';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={() => navigate('/student/english/status')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver al estado de inglés
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Solicitar Examen de Diagnóstico</h1>
          <p className="text-gray-600">
            {hasPriorDiagnostic
              ? 'Si deseas presentar un segundo examen de diagnóstico, debes inscribirte a un período publicado. Según el período, puede tener un costo.'
              : 'Tu primer examen de diagnóstico es gratuito. Si no hay período abierto, quedarás en lista de espera hasta que el administrador asigne fechas.'}
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {hasCompletedAllRequirements && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Icon name="check-circle" size={24} className="text-green-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-900 mb-1">¡Requisitos Completados!</h3>
                <p className="text-sm text-green-800">{enrollmentMessage}</p>
                <p className="text-sm text-green-700 mt-2">
                  Niveles completados: {englishStatus?.completedLevels?.join(', ') || 'N/A'} |
                  Promedio: {englishStatus?.promedioIngles?.toFixed(2) || 'N/A'}%
                </p>
              </div>
            </div>
          </div>
        )}

        {isAlreadyEnrolled && !hasCompletedAllRequirements && (
          <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Icon name="warning" size={24} className="text-orange-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-orange-900 mb-1">Solicitud activa</h3>
                <p className="text-sm text-orange-800">{enrollmentMessage}</p>
              </div>
            </div>
          </div>
        )}

        {hasCompletedAllRequirements ? (
          <Card className="p-6">
            <div className="text-center py-8">
              <div className="mb-4">
                <svg className="mx-auto h-16 w-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Requisitos de Inglés Completados!</h2>
              <p className="text-gray-600 mb-4">
                Has completado todos los niveles de inglés (1-6) con un promedio aprobatorio.
                No es necesario realizar más exámenes de diagnóstico.
              </p>
              <button
                onClick={() => navigate('/student/english/status')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Ver Estado de Inglés
              </button>
            </div>
          </Card>
        ) : (
          <Card className="p-6">
            <form onSubmit={handleSubmit}>
              {!hasPriorDiagnostic && (
                <div className="mb-6">
                  <label className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={usePeriod}
                      onChange={(e) => setUsePeriod(e.target.checked)}
                      disabled={availablePeriods.length === 0}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Inscribirme a un período de exámenes disponible
                    </span>
                  </label>
                  {usePeriod && (
                    <p className="text-sm text-gray-500 ml-6">
                      Selecciona un período abierto. Si no hay períodos, puedes solicitar el examen y quedar en lista de espera.
                    </p>
                  )}
                </div>
              )}

              {(usePeriod || hasPriorDiagnostic) && (
                <FormField
                  label="Período de Exámenes"
                  name="periodId"
                  value={periodId}
                  onChange={(e) => setPeriodId(e.target.value)}
                  required={usePeriod || hasPriorDiagnostic}
                  as="select"
                  disabled={loadingPeriods}
                  options={[
                    {
                      value: '',
                      label: loadingPeriods
                        ? 'Cargando períodos...'
                        : availablePeriods.length === 0
                        ? 'No hay períodos disponibles'
                        : 'Selecciona un período',
                    },
                    ...availablePeriods.map((period) => ({
                      value: period.id,
                      label: `${period.nombre} (${period.cuposDisponibles} cupos)${
                        period.requierePago && period.montoPago
                          ? ` — $${period.montoPago.toFixed(2)}`
                          : ''
                      }`,
                    })),
                  ]}
                />
              )}

              {!usePeriod && !hasPriorDiagnostic && (
                <div className="mb-4 bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <p className="text-sm text-indigo-800">
                    <strong>Lista de espera:</strong> No hay período abierto en este momento. Tu solicitud quedará
                    registrada y el administrador te asignará fechas cuando publique un período. El primer diagnóstico
                    es gratuito.
                  </p>
                </div>
              )}

              {hasPriorDiagnostic && availablePeriods.length === 0 && (
                <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    No hay períodos de examen abiertos. Cuando el administrador publique uno, podrás inscribirte desde
                    aquí o desde &quot;Ver períodos disponibles&quot;.
                  </p>
                </div>
              )}

              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Icon name="info" size={24} className="text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-1">Información importante</h3>
                    <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                      <li>El primer examen de diagnóstico es gratuito</li>
                      <li>No necesitas indicar tu nivel: el resultado del examen define tu placement (niveles 1–6)</li>
                      <li>Sin período abierto, entras a lista de espera hasta que haya fechas</li>
                      <li>Un segundo diagnóstico solo es posible inscribiéndote a un período (puede tener costo)</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-4">
                <button
                  type="button"
                  onClick={() => navigate('/student/english/status')}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={
                    ((usePeriod || hasPriorDiagnostic) && !periodId) ||
                    submitting ||
                    isAlreadyEnrolled ||
                    hasCompletedAllRequirements ||
                    (hasPriorDiagnostic && availablePeriods.length === 0)
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <ButtonLoader size="sm" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Icon name="check" size={20} />
                      {usePeriod || hasPriorDiagnostic ? 'Solicitar Examen' : 'Entrar a Lista de Espera'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </Card>
        )}
      </div>
    </Layout>
  );
};
