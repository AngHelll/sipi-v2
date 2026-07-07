// Process Exam Result Page - Admin can process exam results
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { examsApi } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { PageLoader, FormField, ButtonLoader, Icon } from '../../components/ui';
import { ds, gradeToneClass, studentPage } from '../../lib/designSystem';

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
        <div className={ds.admin.pageShellCompact}>
          <div className={ds.admin.errorBox}>Examen no encontrado</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={ds.admin.detailShell}>
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin/exams')}
            className={studentPage.backLink}
          >
            <Icon name="arrow-left" size={20} />
            Volver a Exámenes
          </button>
          <h1 className={ds.admin.pageTitle}>Procesar Resultado de Examen</h1>
          <p className={ds.admin.pageSubtitle}>Registra el resultado del examen de diagnóstico</p>
        </div>

        <div className={ds.admin.detailSection}>
          <h2 className={`${ds.page.sectionTitle} mb-4`}>Información del Examen</h2>
          <div className={ds.admin.kvGridCompact}>
            <div>
              <p className={ds.admin.kvLabel}>Código</p>
              <p className={ds.admin.kvValue}>{exam.codigo}</p>
            </div>
            <div>
              <p className={ds.admin.kvLabel}>Tipo de Examen</p>
              <p className={ds.admin.kvValue}>{getExamTypeLabel(exam.exam?.examType)}</p>
            </div>
            <div>
              <p className={ds.admin.kvLabel}>Estudiante</p>
              <p className={ds.admin.kvValue}>
                {exam.student 
                  ? `${exam.student.matricula} - ${exam.student.nombre} ${exam.student.apellidoPaterno} ${exam.student.apellidoMaterno}`
                  : '-'}
              </p>
            </div>
            {exam.exam?.nivelIngles && (
              <div>
                <p className={ds.admin.kvLabel}>Nivel de Inglés</p>
                <p className={ds.admin.kvValue}>Nivel {exam.exam.nivelIngles}</p>
              </div>
            )}
            {exam.exam?.period && (
              <div>
                <p className={ds.admin.kvLabel}>Período</p>
                <p className={ds.admin.kvValue}>{exam.exam.period.nombre}</p>
              </div>
            )}
            <div>
              <p className={ds.admin.kvLabel}>Fecha de Inscripción</p>
              <p className={ds.admin.kvValue}>{formatDate(exam.fechaInscripcion)}</p>
            </div>
            <div>
              <p className={ds.admin.kvLabel}>Estatus</p>
              <p className={ds.admin.kvValue}>{exam.estatus}</p>
            </div>
            {exam.exam?.resultado !== undefined && exam.exam.resultado !== null && (
              <div>
                <p className={ds.admin.kvLabel}>Resultado Actual</p>
                <p className={`${ds.admin.kvValue} font-semibold ${gradeToneClass(exam.exam.resultado)}`}>
                  {exam.exam.resultado}%
                </p>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className={`${ds.admin.detailSection} mb-0`}>
          <h2 className={`${ds.page.sectionTitle} mb-4`}>Registrar Resultado</h2>
          
          <FormField
            label="Resultado (%)"
            name="resultado"
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
            min={0}
            max={100}
            step="0.1"
            required
            helpText="Ingresa el resultado del examen como un porcentaje (0-100)"
          />

          {/* Perfect Score Alert */}
          {showPerfectScoreAlert && exam.exam?.examType === 'DIAGNOSTICO' && (
            <div className={`mt-4 ${ds.card.accentBorderL}`}>
              <h3 className={`text-sm font-medium ${ds.semantic.pendingText} mb-2`}>
                Calificación perfecta (100%)
              </h3>
              <div className={`text-sm ${ds.semantic.pendingText}`}>
                <p className="font-semibold mb-1">El estudiante será automáticamente:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Avanzado a todos los niveles de inglés (1-6)</li>
                  <li>Marcado como cumpliendo el requisito de inglés</li>
                  <li>Evaluado con 100% en todos los niveles completados</li>
                </ul>
                <p className="mt-2 font-medium">
                  Esta acción completará automáticamente todos los requisitos de inglés del estudiante.
                </p>
              </div>
            </div>
          )}

          {exam.exam?.examType === 'DIAGNOSTICO' && (
            <>
              <FormField
                label="Nivel Final de Inglés"
                name="nivelFinal"
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
                min={0}
                max={6}
                required={parseFloat(resultado) < 70}
                helpText={
                  parseFloat(resultado) >= 70
                    ? "Especifica el nivel (1-6) o deja en 0/vacío para permitir que el estudiante tome el nivel 6 como curso real."
                    : "Especifica el nivel de inglés donde quedará posicionado el estudiante después del examen (1-6)."
                }
              />
              {parseFloat(resultado) >= 70 && (
                <div className={`mt-2 ${ds.banner.info} rounded-lg p-3`}>
                  <p className={`text-sm ${ds.page.body}`}>
                    <strong>Opción especial:</strong> Si dejas el nivel en 0 o vacío, el estudiante podrá inscribirse al nivel 6 como curso real. 
                    Si asignas un nivel (1-6), se crearán los registros automáticamente y el estudiante ya habrá cumplido con los niveles necesarios.
                  </p>
                </div>
              )}

              {nivelFinal && parseInt(nivelFinal, 10) > 1 && (
                <div className={`mt-6 ${ds.admin.sectionDivider}`}>
                  <h3 className={`${ds.page.sectionTitle} mb-4`}>
                    Calificaciones por Nivel
                  </h3>
                  <p className={`${ds.page.body} mb-4`}>
                    Asigna la calificación que tendrá cada nivel completado por el examen de diagnóstico. 
                    Los niveles del 1 al {parseInt(nivelFinal, 10) - 1} serán completados automáticamente.
                  </p>
                  <div className="space-y-4">
                    {Array.from({ length: parseInt(nivelFinal, 10) - 1 }, (_, i) => i + 1).map((nivel) => (
                      <FormField
                        key={nivel}
                        label={`Calificación Nivel ${nivel}`}
                        name={`calificacion_${nivel}`}
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
                        min={0}
                        max={100}
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
              className={ds.btn.secondary}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`${ds.btn.primary} flex items-center gap-2`}
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

