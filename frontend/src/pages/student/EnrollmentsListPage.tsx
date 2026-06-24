// Enrollments list page for STUDENT
import { useEffect, useState } from 'react';
import { Layout } from '../../components/layout/Layout';
import { enrollmentsApi } from '../../lib/api';
import { Loader } from '../../components/ui';
import type { Enrollment, EnrollmentsListResponse } from '../../types';

const PAGE_SIZE = 20;

export const EnrollmentsListPage = () => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<EnrollmentsListResponse['pagination'] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchEnrollments(currentPage);
  }, [currentPage]);

  const fetchEnrollments = async (page: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await enrollmentsApi.getMe({ page, limit: PAGE_SIZE });
      setEnrollments(response.enrollments);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar las inscripciones');
      console.error('Error fetching enrollments:', err);
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (calificacion: number | null) => {
    if (calificacion === null) return 'text-on-surface-variant';
    if (calificacion >= 90) return 'text-green-600 font-semibold';
    if (calificacion >= 80) return 'text-blue-600 font-semibold';
    if (calificacion >= 70) return 'text-yellow-600 font-semibold';
    return 'text-red-600 font-semibold';
  };

  const formatGrade = (calificacion: number | null) =>
    calificacion === null ? 'Sin calificar' : calificacion.toFixed(1);

  const totalPages = pagination?.totalPages ?? 1;

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-on-surface font-headline">Mis Calificaciones</h1>
          <p className="text-on-surface-variant mt-2">
            Aquí puedes ver todas tus materias inscritas y tus calificaciones
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader variant="spinner" size="lg" text="Cargando inscripciones..." />
          </div>
        ) : error ? (
          <div className="bg-error-container/30 border border-error/30 text-error px-4 py-3 rounded-lg">
            {error}
          </div>
        ) : enrollments.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-2xl shadow-soft p-8 text-center border border-outline-variant/20">
            <p className="text-on-surface text-lg">No tienes inscripciones registradas</p>
            <p className="text-on-surface-variant text-sm mt-2">
              Contacta al administrador para inscribirte en grupos
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {enrollments.map((enrollment) => (
              <div
                key={enrollment.id}
                className="bg-surface-container-lowest rounded-2xl shadow-soft p-6 hover:shadow-medium transition-shadow border border-outline-variant/20"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="text-xl font-semibold text-on-surface">
                        {enrollment.group?.subject.nombre || 'Materia no disponible'}
                      </h3>
                      <span className="text-sm text-on-surface-variant bg-surface-container px-2 py-1 rounded">
                        {enrollment.group?.subject.clave || 'N/A'}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <p className="text-sm text-on-surface-variant">Grupo</p>
                        <p className="text-base font-medium text-on-surface">
                          {enrollment.group?.nombre || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-on-surface-variant">Período</p>
                        <p className="text-base font-medium text-on-surface">
                          {enrollment.group?.periodo || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-on-surface-variant">Maestro</p>
                        <p className="text-base font-medium text-on-surface">
                          {enrollment.group?.teacher
                            ? `${enrollment.group.teacher.nombre} ${enrollment.group.teacher.apellidoPaterno} ${enrollment.group.teacher.apellidoMaterno}`
                            : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-on-surface-variant">Créditos</p>
                        <p className="text-base font-medium text-on-surface">
                          {enrollment.group?.subject.creditos || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="ml-6 text-right">
                    <p className="text-sm text-on-surface-variant mb-1">Calificación</p>
                    <p className={`text-3xl font-bold ${getGradeColor(enrollment.calificacion)}`}>
                      {formatGrade(enrollment.calificacion)}
                    </p>
                    {enrollment.calificacion !== null && (
                      <p className="text-xs text-on-surface-variant/70 mt-1">
                        {enrollment.calificacion >= 70 ? 'Aprobado' : 'Reprobado'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {pagination && totalPages > 1 && (
              <div className="bg-surface-container-lowest rounded-2xl shadow-soft p-4 border border-outline-variant/20">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="text-sm text-on-surface-variant">
                    Mostrando {(currentPage - 1) * PAGE_SIZE + 1} a{' '}
                    {Math.min(currentPage * PAGE_SIZE, pagination.total)} de {pagination.total} inscripciones
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-outline-variant rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-container"
                    >
                      Anterior
                    </button>
                    <span className="px-3 py-1 text-sm text-on-surface-variant">
                      Página {currentPage} de {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-outline-variant rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-container"
                    >
                      Siguiente
                    </button>
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
