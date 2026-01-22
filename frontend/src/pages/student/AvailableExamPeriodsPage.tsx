// Available Exam Periods Page - Student can view and enroll in available exam periods
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { examPeriodsApi, examsApi } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { Card, Loader } from '../../components/ui';
import type { AvailableExamPeriod } from '../../types';

export const AvailableExamPeriodsPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [periods, setPeriods] = useState<AvailableExamPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<string | null>(null);

  useEffect(() => {
    fetchPeriods();
  }, []);

  const fetchPeriods = async () => {
    try {
      setLoading(true);
      const result = await examPeriodsApi.getAvailablePeriods();
      console.log('📊 Períodos recibidos del API:', result);
      console.log('📊 Total de períodos:', result.total);
      console.log('📊 Array de períodos:', result.periods);
      console.log('📊 Períodos con estaDisponible=true:', result.periods.filter((p) => p.estaDisponible));
      setPeriods(result.periods.filter((p) => p.estaDisponible));
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Error al cargar los períodos disponibles';
      showToast(errorMessage, 'error');
      console.error('❌ Error fetching available periods:', err);
      console.error('❌ Error response:', err.response?.data);
      setPeriods([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (periodId: string, periodName: string) => {
    if (!confirm(`¿Deseas inscribirte al período "${periodName}"?`)) {
      return;
    }

    try {
      setEnrolling(periodId);
      await examsApi.createDiagnosticExam({
        examType: 'DIAGNOSTICO',
        periodId,
      });
      showToast('Te has inscrito exitosamente al período de exámenes', 'success');
      fetchPeriods(); // Refresh to update capacity
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Error al inscribirse al período';
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
            Selecciona un período de exámenes de diagnóstico disponible para inscribirte.
          </p>
        </div>

        {periods.length === 0 ? (
          <Card className="p-8 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay períodos disponibles</h3>
            <p className="text-gray-600 mb-4">
              Actualmente no hay períodos de exámenes abiertos para inscripción.
              <br />
              <span className="text-sm text-gray-500 mt-2 block">
                Si estás interesado en realizar un examen de diagnóstico, puedes solicitarlo directamente.
                Esto ayudará a que se abran nuevas fechas según la demanda.
              </span>
            </p>
            <button
              onClick={() => navigate('/student/english/request-exam')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Solicitar examen de diagnóstico
            </button>
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

                {period.descripcion && (
                  <p className="text-gray-600 mb-4">{period.descripcion}</p>
                )}

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
                  {period.requierePago && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Costo:</p>
                      <p className="text-sm text-gray-600">
                        ${period.montoPago?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleEnroll(period.id, period.nombre)}
                  disabled={enrolling === period.id || period.cuposDisponibles === 0}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {enrolling === period.id ? (
                    <>
                      <Loader size="sm" />
                      Inscribiendo...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Inscribirme
                    </>
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

