// English Status Page - Student dashboard for English enrollment status
import { useEffect, useState } from 'react';
import { Layout } from '../../components/layout/Layout';
import { examsApi } from '../../lib/api';
import { Loader, Card, Badge, Icon } from '../../components/ui';
import { useNavigate } from 'react-router-dom';

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
  }>;
  englishCourses: Array<{
    id: string;
    codigo: string;
    nivelIngles: number | null;
    fechaInscripcion: string;
    estatus: string;
    pagoAprobado: boolean | null;
    calificacion: number | null;
    subject: string;
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
  const navigate = useNavigate();

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      // Use V2 endpoint that includes exams and courses from new architecture
      const data = await examsApi.getStudentEnglishStatusV2();
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
    };
    const statusInfo = statusMap[estatus] || { color: 'bg-gray-100 text-gray-800', label: estatus };
    return <Badge className={statusInfo.color}>{statusInfo.label}</Badge>;
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
        {status.pendingExam && (
          <div className={`mb-8 border rounded-lg p-4 flex items-start gap-3 ${
            status.pendingExam.estatus === 'PENDIENTE_PAGO' 
              ? 'bg-orange-50 border-orange-200' 
              : status.pendingExam.estatus === 'PAGO_PENDIENTE_APROBACION'
              ? 'bg-purple-50 border-purple-200'
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <Icon 
              name={status.pendingExam.estatus === 'PENDIENTE_PAGO' ? 'warning' : 'info'} 
              size={24} 
              className={`mt-0.5 ${
                status.pendingExam.estatus === 'PENDIENTE_PAGO' 
                  ? 'text-orange-600' 
                  : status.pendingExam.estatus === 'PAGO_PENDIENTE_APROBACION'
                  ? 'text-purple-600'
                  : 'text-yellow-600'
              }`} 
            />
            <div className="flex-1">
              <h2 className={`text-lg font-semibold mb-1 ${
                status.pendingExam.estatus === 'PENDIENTE_PAGO' 
                  ? 'text-orange-900' 
                  : status.pendingExam.estatus === 'PAGO_PENDIENTE_APROBACION'
                  ? 'text-purple-900'
                  : 'text-yellow-900'
              }`}>
                {status.pendingExam.estatus === 'PENDIENTE_PAGO' 
                  ? 'Examen de diagnóstico pendiente de pago'
                  : status.pendingExam.estatus === 'PAGO_PENDIENTE_APROBACION'
                  ? 'Pago en revisión'
                  : 'Tienes un examen de diagnóstico inscrito'}
              </h2>
              <p className={`text-sm mb-2 ${
                status.pendingExam.estatus === 'PENDIENTE_PAGO' 
                  ? 'text-orange-800' 
                  : status.pendingExam.estatus === 'PAGO_PENDIENTE_APROBACION'
                  ? 'text-purple-800'
                  : 'text-yellow-800'
              }`}>
                {status.pendingExam.estatus === 'PENDIENTE_PAGO' 
                  ? `Este examen requiere pago de $${status.pendingExam.montoPago?.toFixed(2) || 'N/A'}. Por favor, sube tu comprobante de pago para continuar.`
                  : status.pendingExam.estatus === 'PAGO_PENDIENTE_APROBACION'
                  ? 'Tu comprobante de pago está siendo revisado por el administrador. Te notificaremos cuando sea aprobado.'
                  : 'Estás inscrito en un examen de diagnóstico de inglés. Podrás presentarlo según las fechas y horarios establecidos por el administrador.'}
              </p>
              <div className={`text-sm space-y-1 ${
                status.pendingExam.estatus === 'PENDIENTE_PAGO' 
                  ? 'text-orange-700' 
                  : status.pendingExam.estatus === 'PAGO_PENDIENTE_APROBACION'
                  ? 'text-purple-700'
                  : 'text-yellow-700'
              }`}>
                <p><strong>Código:</strong> {status.pendingExam.codigo}</p>
                <p><strong>Fecha de inscripción:</strong> {new Date(status.pendingExam.fechaInscripcion).toLocaleDateString('es-MX')}</p>
                {status.pendingExam.period && (
                  <p><strong>Período:</strong> {status.pendingExam.period.nombre}</p>
                )}
                {status.pendingExam.requierePago && status.pendingExam.montoPago && (
                  <p><strong>Monto a pagar:</strong> ${status.pendingExam.montoPago.toFixed(2)}</p>
                )}
              </div>
              {status.pendingExam.estatus === 'PENDIENTE_PAGO' && (
                <div className="mt-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      <strong>Instrucciones:</strong> Debes llevar tu comprobante de pago físico a Servicio Estudiantil para que se procese tu inscripción.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Diagnostic exam recommendation */}
        {!status.nivelInglesActual && !status.pendingExam && (
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
                <button
                  type="button"
                  onClick={() => navigate('/student/english/request-exam')}
                  className="px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors text-sm"
                >
                  Solicitar examen directamente
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

        {/* Diagnostic Exams */}
        <Card className="p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Exámenes de Diagnóstico</h2>
            {status.diagnosticExams.length === 0 && (
              <button
                onClick={() => navigate('/student/english/available-exam-periods')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Ver Períodos Disponibles
              </button>
            )}
          </div>
          {status.diagnosticExams.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Materia</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Calificación</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estatus</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {status.diagnosticExams.map((exam) => (
                    <tr key={exam.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{exam.subject}</div>
                          {exam.period && (
                            <div className="text-xs text-gray-500">Período: {exam.period.nombre}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <div>
                          <div>Inscripción: {new Date(exam.fechaInscripcion).toLocaleDateString('es-MX')}</div>
                          {exam.fechaExamen && (
                            <div className="text-xs">Examen: {new Date(exam.fechaExamen).toLocaleDateString('es-MX')}</div>
                          )}
                        </div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getGradeColor(exam.calificacion)}`}>
                        {exam.calificacion !== null ? exam.calificacion.toFixed(1) : 'Sin calificar'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(exam.estatus)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">No tienes exámenes de diagnóstico registrados.</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => navigate('/student/english/available-exam-periods')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Ver Períodos Disponibles
                </button>
                <button
                  onClick={() => navigate('/student/english/request-exam')}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Solicitar Examen Directamente
                </button>
              </div>
            </div>
          )}
        </Card>

        {/* English Courses */}
        {status.englishCourses.length > 0 && (
          <Card className="p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Cursos de Inglés</h2>
            {/* Payment pending notification */}
            {status.englishCourses.some(c => c.estatus === 'PENDIENTE_PAGO' && c.pagoAprobado === null) && (
              <div className="mb-4 bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Icon name="warning" size={24} className="text-orange-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-orange-900 mb-1">Curso Pendiente de Pago</h3>
                    <p className="text-sm text-orange-800">
                      Tienes cursos de inglés que requieren pago. Debes realizar el pago y llevar el comprobante físico a Servicio Estudiantil para completar tu inscripción.
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nivel</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Materia</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pago</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Calificación</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estatus</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {status.englishCourses.map((course) => (
                    <tr key={course.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div>
                          <div>Nivel {course.nivelIngles || '-'}</div>
                          {course.completadoPorDiagnostico && (
                            <div className="text-xs text-blue-600">✓ Completado por diagnóstico</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{course.subject}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(course.fechaInscripcion).toLocaleDateString('es-MX')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {course.pagoAprobado === null ? (
                          <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>
                        ) : course.pagoAprobado ? (
                          <Badge className="bg-green-100 text-green-800">Aprobado</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800">Rechazado</Badge>
                        )}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getGradeColor(course.calificacion)}`}>
                        {course.calificacion !== null ? course.calificacion.toFixed(1) : 'Sin calificar'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(course.estatus)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/student/english/request-exam')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Icon name="file-text" size={20} />
            Solicitar Examen de Diagnóstico
          </button>
          <button
            onClick={() => navigate('/student/english/request-course')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Icon name="book" size={20} />
            Solicitar Curso de Inglés
          </button>
        </div>
      </div>
    </Layout>
  );
};


