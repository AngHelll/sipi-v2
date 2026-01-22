// Available English Courses Page - Student can view and enroll in available English courses
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { groupsApi, specialCoursesApi } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { Card, Loader } from '../../components/ui';
import type { Group } from '../../types';

export const AvailableEnglishCoursesPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [courses, setCourses] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<string | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const result = await groupsApi.getAvailableEnglishCourses();
      console.log('📊 Cursos recibidos del API:', result);
      console.log('📊 Total de cursos:', result.total);
      console.log('📊 Array de cursos:', result.courses);
      setCourses(result.courses || []);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Error al cargar los cursos disponibles';
      showToast(errorMessage, 'error');
      console.error('❌ Error fetching available courses:', err);
      console.error('❌ Error response:', err.response?.data);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (groupId: string, courseName: string, nivelIngles: number) => {
    if (!confirm(`¿Deseas inscribirte al curso "${courseName}"?`)) {
      return;
    }

    try {
      setEnrolling(groupId);
      await specialCoursesApi.createSpecialCourse({
        courseType: 'INGLES',
        nivelIngles,
        groupId,
        requierePago: true,
      });
      showToast('Te has inscrito exitosamente al curso de inglés', 'success');
      navigate('/student/english/status');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Error al inscribirse al curso';
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
            Selecciona un curso de inglés disponible para inscribirte. Asegúrate de tener el nivel apropiado.
            <br />
            <span className="font-semibold text-gray-800">
              Aunque puedes solicitar inscribirte directamente (especialmente a nivel 1), se recomienda realizar primero tu examen de diagnóstico.
            </span>
          </p>
        </div>

        {courses.length === 0 ? (
          <Card className="p-8 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay cursos disponibles</h3>
            <p className="text-gray-600 mb-4">
              Actualmente no hay cursos de inglés abiertos para inscripción.
            </p>
            <button
              onClick={() => navigate('/student/english/request-course')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Solicitar curso directamente →
            </button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card key={course.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">{course.nombre}</h3>
                  {course.nivelIngles && getLevelBadge(course.nivelIngles)}
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
                  {course.horario && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Horario:</p>
                      <p className="text-sm text-gray-600">{course.horario}</p>
                    </div>
                  )}
                  {course.aula && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Aula:</p>
                      <p className="text-sm text-gray-600">{course.aula}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-700">Cupos:</p>
                    <p className="text-sm text-gray-600">
                      {(course.cupoActual || 0)} / {(course.cupoMaximo || 0)} ({(course.cupoMaximo || 0) - (course.cupoActual || 0)} disponibles)
                    </p>
                  </div>
                  {course.fechaInscripcionInicio && course.fechaInscripcionFin && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Inscripciones:</p>
                      <p className="text-sm text-gray-600">
                        Hasta {formatDate(course.fechaInscripcionFin)}
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleEnroll(course.id, course.nombre, course.nivelIngles || 1)}
                  disabled={enrolling === course.id || (course.cupoActual || 0) >= (course.cupoMaximo || 0)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {enrolling === course.id ? (
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

