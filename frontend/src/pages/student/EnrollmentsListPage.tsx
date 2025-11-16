// Enrollments list page for STUDENT
import { useEffect, useState } from 'react';
import { Layout } from '../../components/layout/Layout';
import { enrollmentsApi } from '../../lib/api';
import type { Enrollment, EnrollmentsListResponse } from '../../types';

export const EnrollmentsListPage = () => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<EnrollmentsListResponse['pagination'] | null>(null);

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await enrollmentsApi.getMe({
        page: 1,
        limit: 50,
      });
      setEnrollments(response.enrollments);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(
        err.response?.data?.error || 'Error al cargar las inscripciones'
      );
      console.error('Error fetching enrollments:', err);
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (calificacion: number | null) => {
    if (calificacion === null) return 'text-gray-500';
    if (calificacion >= 90) return 'text-green-600 font-semibold';
    if (calificacion >= 80) return 'text-blue-600 font-semibold';
    if (calificacion >= 70) return 'text-yellow-600 font-semibold';
    return 'text-red-600 font-semibold';
  };

  const formatGrade = (calificacion: number | null) => {
    if (calificacion === null) return 'Sin calificar';
    return calificacion.toFixed(1);
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Mis Inscripciones</h1>
          <p className="text-gray-600 mt-2">
            Aquí puedes ver todas tus materias inscritas y tus calificaciones
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        ) : enrollments.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 text-lg">No tienes inscripciones registradas</p>
            <p className="text-gray-400 text-sm mt-2">
              Contacta al administrador para inscribirte en grupos
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {enrollments.map((enrollment) => (
              <div
                key={enrollment.id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {enrollment.group?.subject.nombre || 'Materia no disponible'}
                      </h3>
                      <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {enrollment.group?.subject.clave || 'N/A'}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <p className="text-sm text-gray-500">Grupo</p>
                        <p className="text-base font-medium text-gray-900">
                          {enrollment.group?.nombre || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Período</p>
                        <p className="text-base font-medium text-gray-900">
                          {enrollment.group?.periodo || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Maestro</p>
                        <p className="text-base font-medium text-gray-900">
                          {enrollment.group?.teacher
                            ? `${enrollment.group.teacher.nombre} ${enrollment.group.teacher.apellidoPaterno} ${enrollment.group.teacher.apellidoMaterno}`
                            : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Créditos</p>
                        <p className="text-base font-medium text-gray-900">
                          {enrollment.group?.subject.creditos || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="ml-6 text-right">
                    <p className="text-sm text-gray-500 mb-1">Calificación</p>
                    <p className={`text-3xl font-bold ${getGradeColor(enrollment.calificacion)}`}>
                      {formatGrade(enrollment.calificacion)}
                    </p>
                    {enrollment.calificacion !== null && (
                      <p className="text-xs text-gray-400 mt-1">
                        {enrollment.calificacion >= 70 ? 'Aprobado' : 'Reprobado'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {pagination && pagination.totalPages > 1 && (
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Mostrando {enrollments.length} de {pagination.total} inscripciones
                  </div>
                  <div className="text-sm text-gray-500">
                    Página {pagination.page} de {pagination.totalPages}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

