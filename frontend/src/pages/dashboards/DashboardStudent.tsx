// Student dashboard component with enrollments and grades
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { enrollmentsApi, studentsApi } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { PageLoader } from '../../components/ui';
import type { Enrollment, Student } from '../../types';

interface StudentDashboardStats {
  totalEnrollments: number;
  completedGrades: number;
  pendingGrades: number;
  averageGrade: number;
  student: Student | null;
  recentEnrollments: Enrollment[];
}

export const DashboardStudent = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StudentDashboardStats | null>(null);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch student data
      const studentRes = await studentsApi.getMe();
      const student = studentRes as Student;

      // Fetch enrollments (max limit is 100)
      const enrollmentsRes = await enrollmentsApi.getMe({ limit: 100, page: 1 });
      const enrollments = enrollmentsRes.enrollments;

      // Calculate statistics
      const totalEnrollments = enrollments.length;
      const completedGrades = enrollments.filter(e => e.calificacion !== null && e.calificacion !== undefined).length;
      const pendingGrades = totalEnrollments - completedGrades;

      // Calculate average grade
      const grades = enrollments
        .map(e => e.calificacion)
        .filter((g): g is number => g !== null && g !== undefined);
      const averageGrade = grades.length > 0
        ? grades.reduce((sum, grade) => sum + grade, 0) / grades.length
        : 0;

      setStats({
        totalEnrollments,
        completedGrades,
        pendingGrades,
        averageGrade: Math.round(averageGrade * 10) / 10, // Round to 1 decimal
        student,
        recentEnrollments: enrollments.slice(0, 6),
      });
    } catch (err: any) {
      showToast('Error al cargar los datos del dashboard', 'error');
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color, subtitle }: {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    color: string;
    subtitle?: string;
  }) => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`${color} bg-opacity-10 p-3 rounded-full`}>
          {icon}
        </div>
      </div>
    </div>
  );

  const getGradeColor = (grade: number | null | undefined) => {
    if (grade === null || grade === undefined) return 'text-gray-500';
    if (grade >= 70) return 'text-green-600';
    if (grade >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getGradeBadgeColor = (grade: number | null | undefined) => {
    if (grade === null || grade === undefined) return 'bg-gray-100 text-gray-800';
    if (grade >= 70) return 'bg-green-100 text-green-800';
    if (grade >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <Layout>
        <PageLoader text="Cargando dashboard..." />
      </Layout>
    );
  }

  if (!stats) {
    return (
      <Layout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            Error al cargar los datos del dashboard
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Panel del Estudiante</h1>
          <p className="text-gray-600 mt-2">
            {stats.student && (
              <>
                Bienvenido, <span className="font-semibold">{stats.student.nombre} {stats.student.apellidoPaterno}</span>
              </>
            )}
          </p>
        </div>

        {/* Student Info Card */}
        {stats.student && (
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm opacity-90">Matrícula</p>
                <p className="text-xl font-bold">{stats.student.matricula}</p>
              </div>
              <div>
                <p className="text-sm opacity-90">Carrera</p>
                <p className="text-xl font-bold">{stats.student.carrera}</p>
              </div>
              <div>
                <p className="text-sm opacity-90">Semestre</p>
                <p className="text-xl font-bold">{stats.student.semestre}</p>
              </div>
              <div>
                <p className="text-sm opacity-90">Estatus</p>
                <p className="text-xl font-bold">{stats.student.estatus}</p>
              </div>
            </div>
            {/* Academic Averages - RB-037 */}
            {(stats.student.promedioGeneral !== undefined || stats.student.promedioIngles !== undefined) && (
              <div className="mt-6 pt-6 border-t border-blue-400 border-opacity-30">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {stats.student.promedioGeneral !== undefined && (
                    <div>
                      <p className="text-sm opacity-90">Promedio General</p>
                      <p className="text-2xl font-bold">{stats.student.promedioGeneral.toFixed(2)}</p>
                    </div>
                  )}
                  {stats.student.promedioIngles !== undefined && (
                    <div>
                      <p className="text-sm opacity-90">Promedio Inglés</p>
                      <p className="text-2xl font-bold">{stats.student.promedioIngles.toFixed(2)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            title="Total Inscripciones"
            value={stats.totalEnrollments}
            color="text-blue-600"
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />
          <StatCard
            title="Calificadas"
            value={stats.completedGrades}
            color="text-green-600"
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            title="Pendientes"
            value={stats.pendingGrades}
            color="text-orange-600"
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            title="Promedio General"
            value={stats.averageGrade > 0 ? stats.averageGrade.toFixed(1) : 'N/A'}
            color={getGradeColor(stats.averageGrade > 0 ? stats.averageGrade : null)}
            subtitle={stats.averageGrade > 0 ? 'de 100 puntos' : 'Sin calificaciones'}
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />
        </div>

        {/* My Enrollments */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Mis Inscripciones</h2>
            <button
              onClick={() => navigate('/student/enrollments')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Ver todas →
            </button>
          </div>
          {stats.recentEnrollments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No tienes inscripciones registradas
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.recentEnrollments.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm">
                      {enrollment.group?.subject?.nombre || 'N/A'}
                    </h3>
                    {enrollment.calificacion !== null && enrollment.calificacion !== undefined ? (
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getGradeBadgeColor(enrollment.calificacion)}`}>
                        {enrollment.calificacion}
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        Pendiente
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mb-1">
                    {enrollment.group?.nombre || 'N/A'} - {enrollment.group?.periodo || 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Créditos: {enrollment.group?.subject?.creditos || 'N/A'}
                  </p>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Maestro: {enrollment.group?.teacher?.nombre || 'N/A'} {enrollment.group?.teacher?.apellidoPaterno || ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Accesos Rápidos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/student/enrollments')}
              className="flex items-center gap-4 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left"
            >
              <div className="bg-blue-600 p-3 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Ver Mis Calificaciones</p>
                <p className="text-sm text-gray-600">Consulta todas tus calificaciones</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/admin/groups')}
              className="flex items-center gap-4 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-left"
            >
              <div className="bg-green-600 p-3 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Ver Grupos Disponibles</p>
                <p className="text-sm text-gray-600">Consulta los grupos disponibles</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/student/english/status')}
              className="flex items-center gap-4 p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors text-left"
            >
              <div className="bg-yellow-600 p-3 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Estado de Inglés</p>
                <p className="text-sm text-gray-600">Consulta tu progreso y solicita cursos</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};
