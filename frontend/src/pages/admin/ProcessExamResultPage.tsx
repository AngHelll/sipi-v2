// Process Exam Result Page - Admin can process exam results
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { examsApi } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { PageLoader, FormField, ButtonLoader } from '../../components/ui';

interface Exam {
  id: string;
  codigo: string;
  estatus: string;
  fechaInscripcion: string;
  student: {
    id: string;
    matricula: string;
    nombre: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
  } | null;
  exam: {
    examType: string;
    nivelIngles?: number;
    resultado?: number;
    fechaExamen?: string;
    fechaResultado?: string;
    periodId?: string;
    period?: {
      id: string;
      nombre: string;
    };
    subject?: {
      id: string;
      clave: string;
      nombre: string;
    };
  } | null;
}

export const ProcessExamResultPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [exam, setExam] = useState<Exam | null>(null);
  const [resultado, setResultado] = useState('');
  const [nivelFinal, setNivelFinal] = useState('');
  const [calificacionesPorNivel, setCalificacionesPorNivel] = useState<Record<number, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPerfectScoreAlert, setShowPerfectScoreAlert] = useState(false);

  useEffect(() => {
    if (id) {
      fetchExam();
    }
  }, [id]);

  const fetchExam = async () => {
    if (!id) {
      showToast('ID de examen no válido', 'error');
      navigate('/admin/exams');
      return;
    }

    try {
      setLoading(true);
      const examData = await examsApi.getById(id);
      
      if (!examData) {
        showToast('Examen no encontrado', 'error');
        navigate('/admin/exams');
        return;
      }

      setExam(examData);
      if (examData.exam?.resultado !== undefined && examData.exam.resultado !== null) {
        setResultado(examData.exam.resultado.toString());
      }
      if (examData.exam?.nivelIngles !== undefined && examData.exam.nivelIngles !== null) {
        setNivelFinal(examData.exam.nivelIngles.toString());
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Error al cargar el examen';
      showToast(errorMessage, 'error');
      navigate('/admin/exams');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!resultado.trim()) {
      newErrors.resultado = 'El resultado es requerido';
    } else {
      const numResultado = parseFloat(resultado);
      if (isNaN(numResultado)) {
        newErrors.resultado = 'El resultado debe ser un número';
      } else if (numResultado < 0 || numResultado > 100) {
        newErrors.resultado = 'El resultado debe estar entre 0 y 100';
      }
    }

    // Validate nivelFinal
    // Special case: If resultado >= 70, nivelFinal can be 0 or empty (student can take level 6 as real course)
    const numResultado = parseFloat(resultado);
    const canSkipLevel = !isNaN(numResultado) && numResultado >= 70;
    
    if (!nivelFinal.trim()) {
      if (!canSkipLevel) {
        newErrors.nivelFinal = 'El nivel final es requerido';
      }
      // If canSkipLevel, nivelFinal can be empty (will be treated as 0)
    } else {
      const numNivel = parseInt(nivelFinal, 10);
      if (isNaN(numNivel)) {
        newErrors.nivelFinal = 'El nivel debe ser un número';
      } else if (numNivel < 0 || numNivel > 6) {
        newErrors.nivelFinal = 'El nivel debe estar entre 0 y 6 (0 permite tomar nivel 6 como curso real)';
      } else if (numNivel === 0 && !canSkipLevel) {
        newErrors.nivelFinal = 'Solo puedes usar nivel 0 si la calificación es >= 70';
      } else if (numNivel > 0) {
        // Validate calificaciones for levels that will be completed
        for (let nivel = 1; nivel < numNivel; nivel++) {
          const calificacion = calificacionesPorNivel[nivel];
          if (!calificacion || calificacion.trim() === '') {
            newErrors[`calificacion_${nivel}`] = `La calificación para el nivel ${nivel} es requerida`;
          } else {
            const numCalificacion = parseFloat(calificacion);
            if (isNaN(numCalificacion)) {
              newErrors[`calificacion_${nivel}`] = 'La calificación debe ser un número';
            } else if (numCalificacion < 0 || numCalificacion > 100) {
              newErrors[`calificacion_${nivel}`] = 'La calificación debe estar entre 0 y 100';
            }
          }
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!id) {
      showToast('ID de examen no válido', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const numResultado = parseFloat(resultado);
      // Handle nivel 0 or empty: treat as null/undefined to skip course creation
      const numNivelFinal = nivelFinal.trim() === '' || nivelFinal === '0' 
        ? null 
        : parseInt(nivelFinal, 10);
      
      // Build calificaciones object only if nivelFinal is > 0
      const calificaciones: Record<number, number> = {};
      if (numNivelFinal !== null && numNivelFinal > 0) {
        for (let nivel = 1; nivel < numNivelFinal; nivel++) {
          const calificacion = calificacionesPorNivel[nivel];
          if (calificacion && calificacion.trim() !== '') {
            calificaciones[nivel] = parseFloat(calificacion);
          }
        }
      }
      
      const response = await examsApi.processExamResult(id, {
        resultado: numResultado,
        nivelIngles: numNivelFinal === null ? 0 : numNivelFinal, // Send 0 to backend to indicate skip
        calificacionesPorNivel: Object.keys(calificaciones).length > 0 ? calificaciones : undefined,
      });

      // Show special message if perfect score or level skipped
      if (response.message) {
        showToast(response.message, 'success');
      } else {
        showToast('Resultado del examen procesado exitosamente', 'success');
      }
      navigate('/admin/exams');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Error al procesar el resultado';
      showToast(errorMessage, 'error');
      console.error('Error processing exam result:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getExamTypeLabel = (examType?: string): string => {
    switch (examType) {
      case 'DIAGNOSTICO':
        return 'Diagnóstico';
      case 'ADMISION':
        return 'Admisión';
      case 'CERTIFICACION':
        return 'Certificación';
      default:
        return examType || '-';
    }
  };

  if (loading) {
    return (
      <Layout>
        <PageLoader text="Cargando examen..." />
      </Layout>
    );
  }

  if (!exam) {
    return (
      <Layout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            Examen no encontrado
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin/exams')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver a Exámenes
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Procesar Resultado de Examen</h1>
          <p className="text-gray-600">Registra el resultado del examen de diagnóstico</p>
        </div>

        {/* Exam Information */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Información del Examen</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Código</p>
              <p className="text-sm text-gray-900">{exam.codigo}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Tipo de Examen</p>
              <p className="text-sm text-gray-900">{getExamTypeLabel(exam.exam?.examType)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Estudiante</p>
              <p className="text-sm text-gray-900">
                {exam.student 
                  ? `${exam.student.matricula} - ${exam.student.nombre} ${exam.student.apellidoPaterno} ${exam.student.apellidoMaterno}`
                  : '-'}
              </p>
            </div>
            {exam.exam?.nivelIngles && (
              <div>
                <p className="text-sm font-medium text-gray-500">Nivel de Inglés</p>
                <p className="text-sm text-gray-900">Nivel {exam.exam.nivelIngles}</p>
              </div>
            )}
            {exam.exam?.period && (
              <div>
                <p className="text-sm font-medium text-gray-500">Período</p>
                <p className="text-sm text-gray-900">{exam.exam.period.nombre}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-500">Fecha de Inscripción</p>
              <p className="text-sm text-gray-900">{formatDate(exam.fechaInscripcion)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Estatus</p>
              <p className="text-sm text-gray-900">{exam.estatus}</p>
            </div>
            {exam.exam?.resultado !== undefined && exam.exam.resultado !== null && (
              <div>
                <p className="text-sm font-medium text-gray-500">Resultado Actual</p>
                <p className="text-sm font-semibold text-gray-900">{exam.exam.resultado}%</p>
              </div>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Registrar Resultado</h2>
          
          <FormField
            label="Resultado (%)"
            type="number"
            value={resultado}
            onChange={(e) => {
              const value = e.target.value;
              setResultado(value);
              if (errors.resultado) {
                setErrors({ ...errors, resultado: '' });
              }
              // Show alert if 100% is entered
              const numValue = parseFloat(value);
              if (!isNaN(numValue) && numValue === 100 && exam.exam?.examType === 'DIAGNOSTICO') {
                setShowPerfectScoreAlert(true);
              } else {
                setShowPerfectScoreAlert(false);
              }
            }}
            error={errors.resultado}
            placeholder="0-100"
            min="0"
            max="100"
            step="0.1"
            required
            helpText="Ingresa el resultado del examen como un porcentaje (0-100)"
          />

          {/* Perfect Score Alert */}
          {showPerfectScoreAlert && exam.exam?.examType === 'DIAGNOSTICO' && (
            <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-yellow-800">
                    ⚠️ Calificación Perfecta (100%)
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p className="font-semibold mb-1">El estudiante será automáticamente:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Avanzado a todos los niveles de inglés (1-6)</li>
                      <li>Marcado como cumpliendo el requisito de inglés</li>
                      <li>Evaluado con 100% en todos los niveles completados</li>
                    </ul>
                    <p className="mt-2 font-medium">
                      ✓ Esta acción completará automáticamente todos los requisitos de inglés del estudiante.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {exam.exam?.examType === 'DIAGNOSTICO' && (
            <>
              <FormField
                label="Nivel Final de Inglés"
                type="number"
                value={nivelFinal}
                onChange={(e) => {
                  const value = e.target.value;
                  setNivelFinal(value);
                  if (errors.nivelFinal) {
                    setErrors({ ...errors, nivelFinal: '' });
                  }
                  // Clear calificaciones when level changes
                  setCalificacionesPorNivel({});
                }}
                error={errors.nivelFinal}
                placeholder={parseFloat(resultado) >= 70 ? "1-6 o 0 (dejar vacío = 0)" : "1-6"}
                min="0"
                max="6"
                required={parseFloat(resultado) < 70}
                helpText={
                  parseFloat(resultado) >= 70
                    ? "Especifica el nivel (1-6) o deja en 0/vacío para permitir que el estudiante tome el nivel 6 como curso real."
                    : "Especifica el nivel de inglés donde quedará posicionado el estudiante después del examen (1-6)."
                }
              />
              {parseFloat(resultado) >= 70 && (
                <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Opción especial:</strong> Si dejas el nivel en 0 o vacío, el estudiante podrá inscribirse al nivel 6 como curso real. 
                    Si asignas un nivel (1-6), se crearán los registros automáticamente y el estudiante ya habrá cumplido con los niveles necesarios.
                  </p>
                </div>
              )}

              {nivelFinal && parseInt(nivelFinal, 10) > 1 && (
                <div className="mt-6 border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Calificaciones por Nivel
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Asigna la calificación que tendrá cada nivel completado por el examen de diagnóstico. 
                    Los niveles del 1 al {parseInt(nivelFinal, 10) - 1} serán completados automáticamente.
                  </p>
                  <div className="space-y-4">
                    {Array.from({ length: parseInt(nivelFinal, 10) - 1 }, (_, i) => i + 1).map((nivel) => (
                      <FormField
                        key={nivel}
                        label={`Calificación Nivel ${nivel}`}
                        type="number"
                        value={calificacionesPorNivel[nivel] || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          setCalificacionesPorNivel({
                            ...calificacionesPorNivel,
                            [nivel]: value,
                          });
                          if (errors[`calificacion_${nivel}`]) {
                            const newErrors = { ...errors };
                            delete newErrors[`calificacion_${nivel}`];
                            setErrors(newErrors);
                          }
                        }}
                        error={errors[`calificacion_${nivel}`]}
                        placeholder="0-100"
                        min="0"
                        max="100"
                        step="0.1"
                        required
                        helpText={`Calificación que recibirá el estudiante en el nivel ${nivel} completado por examen de diagnóstico`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="mt-6 flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/admin/exams')}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <ButtonLoader />
                  Procesando...
                </>
              ) : (
                'Procesar Resultado'
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

