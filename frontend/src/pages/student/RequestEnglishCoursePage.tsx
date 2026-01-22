// Request English Course Page - Student can request English course enrollment
// V2: Usa nuevos endpoints - puede usar cursos disponibles o solicitud directa
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { specialCoursesApi, groupsApi, examsApi } from '../../lib/api';
import { Loader, Card, FormField, ButtonLoader, Icon } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import type { Group } from '../../types';

export const RequestEnglishCoursePage = () => {
  const [availableCourses, setAvailableCourses] = useState<Group[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [nivelIngles, setNivelIngles] = useState<number>(1);
  const [currentLevel, setCurrentLevel] = useState<number | null>(null);
  const [useAvailableCourse, setUseAvailableCourse] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [englishStatus, setEnglishStatus] = useState<any>(null);
  const [isAlreadyEnrolled, setIsAlreadyEnrolled] = useState(false);
  const [enrollmentMessage, setEnrollmentMessage] = useState<string>('');
  const [hasCompletedAllRequirements, setHasCompletedAllRequirements] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    fetchStudentLevel();
    fetchAvailableCourses();
  }, []);

  const fetchStudentLevel = async () => {
    try {
      const status = await examsApi.getStudentEnglishStatusV2();
      setEnglishStatus(status);
      
      // Check if student has completed all English requirements
      if (status.cumpleRequisitoIngles && status.completedLevels?.length === 6) {
        setHasCompletedAllRequirements(true);
        setEnrollmentMessage('¡Felicidades! Ya has cumplido con todos los requisitos de inglés. Has completado todos los niveles (1-6) con un promedio aprobatorio. No es necesario inscribirte a más cursos.');
        return;
      }
      
      const nivel = status.nivelInglesActual;
      setCurrentLevel(nivel);
      if (nivel) {
        setNivelIngles(nivel);
      }
      
      // Check if student is already enrolled in a course of the same level
      const activeCourse = status.englishCourses?.find((course: any) => {
        const isSameLevel = course.nivelIngles === (nivel || 1);
        const isActive = !['REPROBADO', 'BAJA', 'CANCELADO'].includes(course.estatus);
        return isSameLevel && isActive;
      });
      
      if (activeCourse) {
        setIsAlreadyEnrolled(true);
        const statusMessages: Record<string, string> = {
          'INSCRITO': 'Ya estás inscrito',
          'EN_CURSO': 'Ya estás cursando',
          'PENDIENTE_PAGO': 'Ya tienes una solicitud pendiente de pago',
          'PAGO_PENDIENTE_APROBACION': 'Ya tienes una solicitud de pago pendiente de aprobación',
          'APROBADO': 'Ya completaste',
        };
        const statusMessage = statusMessages[activeCourse.estatus] || 'Ya tienes una solicitud activa';
        setEnrollmentMessage(`${statusMessage} en un curso de inglés nivel ${activeCourse.nivelIngles || nivel || 1}.`);
      }
    } catch (err: any) {
      console.error('Error fetching student level:', err);
    }
  };

  const fetchAvailableCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await groupsApi.getAvailableEnglishCourses();
      setAvailableCourses(result.courses);
      
      // Filter courses by current level
      // Note: We fetch all available courses first, then filter by level
      if (currentLevel !== null) {
        const filtered = result.courses.filter(course => course.nivelIngles === currentLevel);
        setFilteredCourses(filtered);
      } else {
        // If no level, only show level 1 courses
        const filtered = result.courses.filter(course => course.nivelIngles === 1);
        setFilteredCourses(filtered);
        
        // Debug: Log if no level 1 courses found
        if (filtered.length === 0 && result.courses.length > 0) {
          console.log('No hay cursos de nivel 1 disponibles. Cursos disponibles:', result.courses.map(c => ({ nombre: c.nombre, nivel: c.nivelIngles })));
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar los cursos disponibles');
      console.error('Error fetching available courses:', err);
    } finally {
      setLoading(false);
    }
  };

  // Update filtered courses when current level changes
  useEffect(() => {
    if (currentLevel !== null && availableCourses.length > 0) {
      const filtered = availableCourses.filter(course => course.nivelIngles === currentLevel);
      setFilteredCourses(filtered);
    } else if (currentLevel === null && availableCourses.length > 0) {
      // If no level, only show level 1 courses
      const filtered = availableCourses.filter(course => course.nivelIngles === 1);
      setFilteredCourses(filtered);
      
      // Debug: Log available courses to help diagnose why level 1 might not be showing
      if (filtered.length === 0) {
        const allLevels = availableCourses.map(c => c.nivelIngles).filter((nivel): nivel is number => nivel !== null && nivel !== undefined);
        console.log('Estudiante sin nivel definido - Cursos disponibles por nivel:', 
          allLevels.reduce((acc: Record<number, number>, nivel) => {
            acc[nivel] = (acc[nivel] || 0) + 1;
            return acc;
          }, {})
        );
      }
    }
  }, [currentLevel, availableCourses]);

  // Update nivelIngles when a course is selected and check if already enrolled in that group
  useEffect(() => {
    if (selectedGroupId && useAvailableCourse) {
      const selectedCourse = filteredCourses.find((c) => c.id === selectedGroupId);
      if (selectedCourse?.nivelIngles) {
        setNivelIngles(selectedCourse.nivelIngles);
      }
      
      // Check if student is already enrolled in this specific group
      if (englishStatus?.englishCourses) {
        const enrolledInGroup = englishStatus.englishCourses.find((course: any) => {
          // Check if course has the same group (we need to check by groupId if available)
          const isActive = !['REPROBADO', 'BAJA', 'CANCELADO'].includes(course.estatus);
          return isActive && course.groupId === selectedGroupId;
        });
        
        if (enrolledInGroup) {
          setIsAlreadyEnrolled(true);
          setEnrollmentMessage('Ya estás inscrito en este curso específico. No puedes inscribirte dos veces.');
        } else {
          // Re-check by level if not enrolled in this specific group
          const activeCourse = englishStatus.englishCourses.find((course: any) => {
            const isSameLevel = course.nivelIngles === selectedCourse?.nivelIngles;
            const isActive = !['REPROBADO', 'BAJA', 'CANCELADO'].includes(course.estatus);
            return isSameLevel && isActive;
          });
          
          if (activeCourse) {
            setIsAlreadyEnrolled(true);
            const statusMessages: Record<string, string> = {
              'INSCRITO': 'Ya estás inscrito',
              'EN_CURSO': 'Ya estás cursando',
              'PENDIENTE_PAGO': 'Ya tienes una solicitud pendiente de pago',
              'PAGO_PENDIENTE_APROBACION': 'Ya tienes una solicitud de pago pendiente de aprobación',
              'APROBADO': 'Ya completaste',
            };
            const statusMessage = statusMessages[activeCourse.estatus] || 'Ya tienes una solicitud activa';
            setEnrollmentMessage(`${statusMessage} en un curso de inglés nivel ${activeCourse.nivelIngles || selectedCourse?.nivelIngles}.`);
          } else {
            setIsAlreadyEnrolled(false);
            setEnrollmentMessage('');
          }
        }
      }
    } else if (!useAvailableCourse) {
      // Re-check by level for direct enrollment
      if (englishStatus?.englishCourses) {
        const activeCourse = englishStatus.englishCourses.find((course: any) => {
          const isSameLevel = course.nivelIngles === nivelIngles;
          const isActive = !['REPROBADO', 'BAJA', 'CANCELADO'].includes(course.estatus);
          return isSameLevel && isActive;
        });
        
        if (activeCourse) {
          setIsAlreadyEnrolled(true);
          const statusMessages: Record<string, string> = {
            'INSCRITO': 'Ya estás inscrito',
            'EN_CURSO': 'Ya estás cursando',
            'PENDIENTE_PAGO': 'Ya tienes una solicitud pendiente de pago',
            'PAGO_PENDIENTE_APROBACION': 'Ya tienes una solicitud de pago pendiente de aprobación',
            'APROBADO': 'Ya completaste',
          };
          const statusMessage = statusMessages[activeCourse.estatus] || 'Ya tienes una solicitud activa';
          setEnrollmentMessage(`${statusMessage} en un curso de inglés nivel ${activeCourse.nivelIngles || nivelIngles}.`);
        } else {
          setIsAlreadyEnrolled(false);
          setEnrollmentMessage('');
        }
      }
    }
  }, [selectedGroupId, useAvailableCourse, filteredCourses, nivelIngles, englishStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (nivelIngles < 1 || nivelIngles > 6) {
      showToast('El nivel de inglés debe estar entre 1 y 6', 'error');
      return;
    }

    if (useAvailableCourse && !selectedGroupId) {
      showToast('Por favor selecciona un curso disponible', 'error');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await specialCoursesApi.createSpecialCourse({
        courseType: 'INGLES',
        nivelIngles,
        groupId: useAvailableCourse && selectedGroupId ? selectedGroupId : undefined,
        requierePago: true,
      });
      showToast('Curso de inglés solicitado exitosamente. Realiza el pago y lleva el comprobante físico a Servicio Estudiantil para completar tu inscripción.', 'success');
      navigate('/student/english/status');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Error al solicitar el curso de inglés';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <Loader text="Cargando grupos de inglés..." />
      </Layout>
    );
  }

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Solicitar Curso de Inglés</h1>
          <p className="text-gray-600">
            {currentLevel 
              ? `Puedes inscribirte únicamente al nivel ${currentLevel} (tu nivel actual).`
              : 'Puedes inscribirte al nivel 1. Se recomienda realizar el examen de diagnóstico para determinar tu nivel adecuado.'}
            <br />
            Después de la solicitud, deberás realizar el pago y llevar el comprobante físico a Servicio Estudiantil.
          </p>
          {currentLevel && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Regla de negocio:</strong> Solo puedes inscribirte al nivel {currentLevel} (tu nivel actual). 
                No puedes inscribirte a niveles superiores o inferiores.
              </p>
            </div>
          )}
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

        {/* Recommendation for students without defined level */}
        {!hasCompletedAllRequirements && !isAlreadyEnrolled && currentLevel === null && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Icon name="info" size={20} className="text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm text-blue-800">
                  <strong>Recomendación:</strong> Te sugerimos realizar el examen de diagnóstico para determinar tu nivel adecuado antes de inscribirte.
                </p>
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
                  checked={useAvailableCourse}
                  onChange={(e) => setUseAvailableCourse(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Inscribirme a un curso disponible
                </span>
              </label>
              {useAvailableCourse && (
                <p className="text-sm text-gray-500 ml-6">
                  Selecciona un curso de inglés disponible. El nivel se ajustará automáticamente.
                </p>
              )}
            </div>

            {useAvailableCourse ? (
              <>
                <FormField
                  label="Curso Disponible"
                  name="groupId"
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  required={useAvailableCourse}
                  as="select"
                  disabled={loading}
                  options={[
                    { value: '', label: loading ? 'Cargando cursos...' : filteredCourses.length === 0 ? 'No hay cursos disponibles para tu nivel' : 'Selecciona un curso' },
                    ...filteredCourses.map((course) => {
                      const cupoMax = course.cupoMaximo || 0;
                      const cupoAct = course.cupoActual || 0;
                      return {
                        value: course.id,
                        label: `${course.nombre} - Nivel ${course.nivelIngles || 'N/A'} (${cupoMax - cupoAct} cupos disponibles)`,
                      };
                    }),
                  ]}
                />
                {filteredCourses.length === 0 && !loading && (
                  <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      <strong>No hay cursos disponibles para tu nivel actual ({currentLevel || 1}).</strong>
                      <br />
                      Puedes solicitar un curso directamente usando la opción de abajo.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                <FormField
                  label="Nivel de Inglés"
                  name="nivelIngles"
                  type="number"
                  value={nivelIngles.toString()}
                  onChange={(e) => {
                    const newLevel = parseInt(e.target.value, 10);
                    if (currentLevel !== null && newLevel !== currentLevel) {
                      showToast(`Solo puedes inscribirte al nivel ${currentLevel} (tu nivel actual)`, 'error');
                      return;
                    }
                    setNivelIngles(newLevel);
                  }}
                  required
                  min={currentLevel || 1}
                  max={currentLevel || 1}
                  disabled={currentLevel !== null}
                  helpText={currentLevel 
                    ? `Solo puedes inscribirte al nivel ${currentLevel} (tu nivel actual)`
                    : "Selecciona el nivel de inglés que deseas cursar (1-6)"}
                />
                {currentLevel && (
                  <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <strong>Nivel actual:</strong> {currentLevel}. Solo puedes solicitar cursos de este nivel.
                    </p>
                  </div>
                )}
                {!currentLevel && (
                  <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <strong>Sin nivel definido:</strong> Puedes inscribirte al nivel 1. 
                      <span className="block mt-1">Te recomendamos realizar el examen de diagnóstico para determinar tu nivel adecuado.</span>
                    </p>
                  </div>
                )}
                <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Nota:</strong> Estás solicitando el curso directamente sin grupo específico. 
                    Esto puede requerir aprobación adicional.
                  </p>
                </div>
              </>
            )}

            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Icon name="warning" size={24} className="text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-900 mb-1">Importante - Proceso de Pago</h3>
                  <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                    <li>Este curso requiere pago</li>
                    <li>Después de solicitar, deberás realizar el pago correspondiente</li>
                    <li>Lleva el comprobante de pago físico a Servicio Estudiantil</li>
                    <li>El personal de Servicio Estudiantil revisará y aprobará tu pago</li>
                    <li>Una vez aprobado, tu inscripción estará activa y podrás asistir al curso</li>
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
                disabled={(useAvailableCourse && !selectedGroupId) || submitting || isAlreadyEnrolled || hasCompletedAllRequirements}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <ButtonLoader />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Icon name="check" size={20} />
                    Solicitar Curso
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

