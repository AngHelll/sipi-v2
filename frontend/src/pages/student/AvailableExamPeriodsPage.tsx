// Available Exam Periods Page - Student can view and enroll in available exam periods
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { examPeriodsApi, examsApi } from '../../lib/api';
import { getExamEligibility, hasPriorDiagnosticExam, type StudentEnglishStatusSnapshot } from '../../lib/englishEligibility';
import { useToast } from '../../context/ToastContext';
import { Card, Loader, Icon } from '../../components/ui';
import type { AvailableExamPeriod } from '../../types';

export const AvailableExamPeriodsPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [periods, setPeriods] = useState<AvailableExamPeriod[]>([]);
  const [englishStatus, setEnglishStatus] = useState<StudentEnglishStatusSnapshot | null>(null);
  const [examEligibility, setExamEligibility] = useState<ReturnType<typeof getExamEligibility> | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<string | null>(null);

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

  const handleEnroll = async (periodId: string, periodName: string) => {
    if (!examEligibility?.canRequest) {
      showToast(examEligibility?.reason || 'No puedes inscribirte en este momento', 'error');
      return;
    }

    if (!confirm(`¿Deseas inscribirte al período "${periodName}"?`)) {
      return;
    }

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
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver al estado de inglés
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Períodos de Exámenes Disponibles</h1>
          <p className="text-gray-600">
            {priorDiagnostic
              ? 'Para un segundo examen de diagnóstico debes inscribirte a un período publicado (puede tener costo).'
              : 'Selecciona un período abierto o solicita el examen sin período para entrar a lista de espera.'}
          </p>
        </div>

        {!canEnroll && examEligibility?.reason && (
          <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
            <Icon name="warning" size={24} className="text-orange-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-orange-900 mb-1">No puedes inscribirte ahora</h3>
              <p className="text-sm text-orange-800">{examEligibility.reason}</p>
            </div>
          </div>
        )}

        {periods.length === 0 ? (
          <Card className="p-8 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay períodos disponibles</h3>
            <p className="text-gray-600 mb-4">
              {priorDiagnostic
                ? 'No hay períodos de examen abiertos en este momento. Vuelve cuando el administrador publique uno.'
                : 'No hay períodos abiertos. Puedes solicitar tu primer examen y quedar en lista de espera hasta que se asignen fechas.'}
            </p>
            {!priorDiagnostic && canEnroll && (
              <button
                onClick={() => navigate('/student/english/request-exam')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Entrar a lista de espera
              </button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {periods.map((period) => (
              <Card key={period.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">{period.nombre}</h3>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    Disponible
                  </span>
                </div>

                {period.descripcion && <p className="text-gray-600 mb-4">{period.descripcion}</p>}

                <div className="space-y-3 mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Inscripciones:</p>
                    <p className="text-sm text-gray-600">
                      {formatDateTime(period.fechaInscripcionInicio)} - {formatDateTime(period.fechaInscripcionFin)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Período de Exámenes:</p>
                    <p className="text-sm text-gray-600">
                      {formatDate(period.fechaInicio)} - {formatDate(period.fechaFin)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Cupos:</p>
                    <p className="text-sm text-gray-600">
                      {period.cuposDisponibles} de {period.cupoMaximo} disponibles
                    </p>
                  </div>
                  {period.requierePago && period.montoPago != null && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Costo:</p>
                      <p className="text-sm text-gray-600">
                        ${period.montoPago.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleEnroll(period.id, period.nombre)}
                  disabled={!canEnroll || enrolling === period.id || period.cuposDisponibles === 0}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
    </Layout>
  );
};
