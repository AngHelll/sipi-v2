// Available English Courses Page - filtered by student's current English level
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { groupsApi, examsApi, specialCoursesApi } from '../../lib/api';
import {
  getCourseEligibility,
  getEligibleCourseLevel,
  type StudentEnglishStatusSnapshot,
} from '../../lib/englishEligibility';
import { useToast } from '../../context/ToastContext';
import { Card, Loader, Icon, ConfirmDialog } from '../../components/ui';
import type { Group } from '../../types';

export const AvailableEnglishCoursesPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [courses, setCourses] = useState<Group[]>([]);
  const [courseEligibility, setCourseEligibility] = useState<ReturnType<typeof getCourseEligibility> | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [waitlisting, setWaitlisting] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    | { type: 'enroll'; groupId: string; courseName: string; nivelIngles: number; costo?: number }
    | { type: 'waitlist' }
    | null
  >(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [coursesResult, status] = await Promise.all([
        groupsApi.getAvailableEnglishCourses(),
        examsApi.getStudentEnglishStatusV2(),
      ]);
      const snapshot: StudentEnglishStatusSnapshot = {
        cumpleRequisitoIngles: status.cumpleRequisitoIngles,
        nivelInglesActual: status.nivelInglesActual,
        pendingExam: status.pendingExam,
        diagnosticExams: status.diagnosticExams,
        englishCourses: status.englishCourses,
      };
      const eligibility = getCourseEligibility(snapshot);
      setCourseEligibility(eligibility);

      const level = getEligibleCourseLevel(snapshot);
      // Mostrar grupos del nivel del alumno y también los mal configurados sin
      // nivel (se muestran deshabilitados con aviso) para no ocultarlos en silencio.
      const filtered = (coursesResult.courses || []).filter(
        (c) => c.nivelIngles === level || c.nivelIngles == null
      );
      setCourses(filtered);
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { error?: string } } }).response?.data?.error ||
        'Error al cargar los cursos disponibles';
      showToast(errorMessage, 'error');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const requestEnroll = (groupId: string, courseName: string, nivelIngles: number, costo?: number) => {
    if (!courseEligibility?.canRequest) {
      showToast(courseEligibility?.reason || 'No puedes inscribirte en este momento', 'error');
      return;
    }
    if (nivelIngles !== courseEligibility.level) {
      showToast(`Solo puedes inscribirte al nivel ${courseEligibility.level}`, 'error');
      return;
    }
    setConfirmAction({ type: 'enroll', groupId, courseName, nivelIngles, costo });
  };

  const performEnroll = async (groupId: string, nivelIngles: number) => {
    try {
      setEnrolling(groupId);
      const result = await specialCoursesApi.createSpecialCourse({
        courseType: 'INGLES',
        nivelIngles,
        groupId,
      });
      showToast(
        result.activity.estatus === 'LISTA_ESPERA'
          ? 'Te agregamos a la lista de espera.'
          : 'Curso solicitado. Realiza el pago y lleva tu comprobante a Servicio Estudiantil.',
        'success'
      );
      navigate('/student/english/status');
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { error?: string } } }).response?.data?.error ||
        'Error al inscribirse al curso';
      showToast(errorMessage, 'error');
    } finally {
      setEnrolling(null);
    }
  };

  // Lista de espera: cuando no hay grupo publicado para el nivel del alumno,
  // se solicita el curso sin groupId y el backend lo deja en LISTA_ESPERA.
  const requestWaitlist = () => {
    if (!courseEligibility?.canRequest) {
      showToast(courseEligibility?.reason || 'No puedes inscribirte en este momento', 'error');
      return;
    }
    setConfirmAction({ type: 'waitlist' });
  };

  const performWaitlist = async () => {
    if (!courseEligibility) return;
    try {
      setWaitlisting(true);
      await specialCoursesApi.createSpecialCourse({
        courseType: 'INGLES',
        nivelIngles: courseEligibility.level,
      });
      showToast('Te agregamos a la lista de espera.', 'success');
      navigate('/student/english/status');
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { error?: string } } }).response?.data?.error ||
        'Error al unirte a la lista de espera';
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
      await performEnroll(action.groupId, action.nivelIngles);
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

  const getLevelBadge = (level: number) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-yellow-100 text-yellow-800',
      'bg-orange-100 text-orange-800',
      'bg-red-100 text-red-800',
      'bg-purple-100 text-purple-800',
    ];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[level - 1] || colors[0]}`}>
        Nivel {level}
      </span>
    );
  };

  const eligibleLevel = courseEligibility?.level ?? 1;
  const canEnroll = courseEligibility?.canRequest ?? false;

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Cursos de Inglés Disponibles</h1>
          <p className="text-gray-600">
            Solo se muestran grupos de <strong>nivel {eligibleLevel}</strong> (tu nivel actual).
            {!courseEligibility?.canRequest && courseEligibility?.reason
              ? ''
              : ' Si no hay grupo publicado para tu nivel, puedes unirte a la lista de espera.'}
          </p>
        </div>

        {!canEnroll && courseEligibility?.reason && (
          <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
            <Icon name="warning" size={24} className="text-orange-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-orange-900 mb-1">No puedes inscribirte ahora</h3>
              <p className="text-sm text-orange-800">{courseEligibility.reason}</p>
            </div>
          </div>
        )}

        {courses.length === 0 ? (
          <Card className="p-8 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay cursos de nivel {eligibleLevel} disponibles
            </h3>
            <p className="text-gray-600 mb-4">
              No hay grupos abiertos para tu nivel. Puedes unirte a la lista de espera y el área abrirá un grupo según la demanda.
            </p>
            {canEnroll && (
              <button
                onClick={requestWaitlist}
                disabled={waitlisting}
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {waitlisting ? 'Uniéndote...' : 'Unirme a lista de espera'}
              </button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => {
              const nivel = course.nivelIngles;
              const cupoDisponible = (course.cupoMaximo || 0) - (course.cupoActual || 0);
              const canEnrollThis = canEnroll && nivel === eligibleLevel;

              return (
                <Card key={course.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">{course.nombre}</h3>
                    {nivel != null && getLevelBadge(nivel)}
                  </div>

                  <div className="space-y-2 mb-4">
                    {course.subject && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Materia:</p>
                        <p className="text-sm text-gray-600">
                          {course.subject.clave} - {course.subject.nombre}
                        </p>
                      </div>
                    )}
                    {course.teacher && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Maestro:</p>
                        <p className="text-sm text-gray-600">
                          {course.teacher.nombre} {course.teacher.apellidoPaterno}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-700">Cupos:</p>
                      <p className="text-sm text-gray-600">{cupoDisponible} disponibles</p>
                    </div>
                    {course.costo != null && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Costo:</p>
                        <p className="text-sm font-semibold text-green-700">${course.costo.toFixed(2)}</p>
                      </div>
                    )}
                    {course.fechaInscripcionFin && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Inscripciones hasta:</p>
                        <p className="text-sm text-gray-600">{formatDate(course.fechaInscripcionFin)}</p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      if (nivel == null) {
                        showToast('Este grupo no tiene nivel definido; contacta a servicios escolares.', 'error');
                        return;
                      }
                      requestEnroll(course.id, course.nombre, nivel, course.costo);
                    }}
                    disabled={!canEnrollThis || enrolling === course.id || cupoDisponible <= 0 || nivel == null}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {enrolling === course.id ? 'Inscribiendo...' : 'Inscribirme'}
                  </button>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmAction !== null}
        title={confirmAction?.type === 'waitlist' ? 'Unirte a lista de espera' : 'Confirmar inscripción'}
        message={
          confirmAction?.type === 'enroll'
            ? `¿Deseas inscribirte al curso "${confirmAction.courseName}"?${
                confirmAction.costo != null ? ` El costo es de $${confirmAction.costo.toFixed(2)}.` : ''
              }`
            : `No hay grupo publicado para el nivel ${courseEligibility?.level ?? ''}. ¿Deseas unirte a la lista de espera? El área abrirá un grupo según la demanda y no necesitas pagar hasta que te asignen uno.`
        }
        confirmText={confirmAction?.type === 'waitlist' ? 'Unirme' : 'Inscribirme'}
        cancelText="Cancelar"
        variant="info"
        onConfirm={handleConfirm}
        onCancel={() => setConfirmAction(null)}
      />
    </Layout>
  );
};
