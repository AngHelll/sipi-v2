// Request Diagnostic Exam Page - Student can request diagnostic exam
// V2: Usa nuevos endpoints - Puede usar períodos disponibles o solicitud directa
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { examsApi, examPeriodsApi } from '../../lib/api';
import { Card, FormField, ButtonLoader, Icon } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import type { AvailableExamPeriod } from '../../types';

export const RequestDiagnosticExamPage = () => {
  const [nivelIngles, setNivelIngles] = useState<number>(1);
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
      
      // Check if student has completed all English requirements
      if (status.cumpleRequisitoIngles && status.completedLevels?.length === 6) {
        setHasCompletedAllRequirements(true);
        setEnrollmentMessage('¡Felicidades! Ya has cumplido con todos los requisitos de inglés. Has completado todos los niveles (1-6) con un promedio aprobatorio. No es necesario realizar más exámenes de diagnóstico.');
        return;
      }
      
      // Check if student has an active diagnostic exam
      const activeExam = status.diagnosticExams?.find((exam: any) => {
        return !['REPROBADO', 'EVALUADO', 'APROBADO', 'CANCELADO', 'BAJA'].includes(exam.estatus);
      });
      
      if (activeExam) {
        setIsAlreadyEnrolled(true);
        const statusMessages: Record<string, string> = {
          'INSCRITO': 'Ya estás inscrito',
          'EN_CURSO': 'Ya estás presentando',
          'PENDIENTE_PAGO': 'Ya tienes una solicitud pendiente de pago',
          'PAGO_PENDIENTE_APROBACION': 'Ya tienes una solicitud de pago pendiente de aprobación',
          'APROBADO': 'Ya completaste',
        };
        const statusMessage = statusMessages[activeExam.estatus] || 'Ya tienes una solicitud activa';
        setEnrollmentMessage(`${statusMessage} un examen de diagnóstico. No puedes inscribirte nuevamente.`);
      }
    } catch (err: any) {
      console.error('Error checking existing exam:', err);
    }
  };

  const fetchAvailablePeriods = async () => {
    try {
      setLoadingPeriods(true);
      const result = await examPeriodsApi.getAvailablePeriods();
      const available = result.periods.filter((p) => p.estaDisponible);
      setAvailablePeriods(available);
      
      // Si no hay períodos disponibles, desactivar automáticamente la opción de período
      if (available.length === 0 && usePeriod) {
        setUsePeriod(false);
      }
    } catch (err: any) {
      console.error('Error fetching available periods:', err);
      // Si hay error, permitir solicitud directa
      setUsePeriod(false);
    } finally {
      setLoadingPeriods(false);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (nivelIngles < 1 || nivelIngles > 6) {
      showToast('El nivel de inglés debe estar entre 1 y 6', 'error');
      return;
    }

    if (usePeriod && !periodId) {
      showToast('Por favor selecciona un período de exámenes', 'error');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      // Si no hay períodos disponibles o se eligió solicitud directa, enviar sin periodId
      const examData: any = {
        examType: 'DIAGNOSTICO',
        nivelIngles,
      };
      
      if (usePeriod && periodId) {
        examData.periodId = periodId;
      }
      
      await examsApi.createDiagnosticExam(examData);
      showToast('Examen de diagnóstico solicitado exitosamente', 'success');
      navigate('/student/english/status');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Error al solicitar el examen de diagnóstico';
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
            El examen de diagnóstico es gratuito y te ayudará a determinar tu nivel actual de inglés.
            <strong className="block mt-2">Ya no necesitas seleccionar un grupo.</strong>
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
                <h3 className="font-semibold text-orange-900 mb-1">Ya estás inscrito</h3>
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
            <div className="mb-6">
              <label className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={usePeriod}
                  onChange={(e) => setUsePeriod(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Inscribirme a un período de exámenes disponible
                </span>
              </label>
              {usePeriod && (
                <p className="text-sm text-gray-500 ml-6">
                  Selecciona un período abierto para inscribirte. Si no hay períodos disponibles, puedes solicitar el examen directamente.
                </p>
              )}
            </div>

            {usePeriod && (
              <FormField
                label="Período de Exámenes"
                name="periodId"
                value={periodId}
                onChange={(e) => setPeriodId(e.target.value)}
                required={usePeriod}
                as="select"
                disabled={loadingPeriods}
                options={[
                  { value: '', label: loadingPeriods ? 'Cargando períodos...' : 'Selecciona un período' },
                  ...availablePeriods.map((period) => ({
                    value: period.id,
                    label: `${period.nombre} (${period.cuposDisponibles} cupos disponibles)`,
                  })),
                ]}
              />
            )}

            {!usePeriod && (
              <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Nota:</strong> Estás solicitando el examen directamente sin período. 
                  Esto puede requerir aprobación adicional.
                </p>
              </div>
            )}

            <FormField
              label="Nivel de Inglés Esperado"
              name="nivelIngles"
              type="number"
              value={nivelIngles}
              onChange={(e) => setNivelIngles(Number(e.target.value))}
              min={1}
              max={6}
              required
              helpText="Selecciona el nivel que crees tener (1-6)"
            />

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Icon name="info" size={24} className="text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">Información importante</h3>
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>El examen de diagnóstico es completamente gratuito</li>
                    <li>No requiere aprobación de pago</li>
                    <li>El resultado determinará tu nivel inicial de inglés (1-6)</li>
                    <li>Una vez completado, podrás inscribirte a los cursos correspondientes</li>
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
                disabled={(usePeriod && !periodId) || submitting || isAlreadyEnrolled || hasCompletedAllRequirements}
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
                    Solicitar Examen
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

