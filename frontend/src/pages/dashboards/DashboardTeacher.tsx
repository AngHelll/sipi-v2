// Teacher dashboard component with groups and statistics
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { groupsApi, enrollmentsApi } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import type { Group, Enrollment } from '../../types';

interface TeacherDashboardStats {
  totalGroups: number;
  totalStudents: number;
  pendingGrades: number;
  groups: Group[];
  recentEnrollments: Enrollment[];
}

export const DashboardTeacher = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<TeacherDashboardStats | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch teacher's groups (max limit is 100)
      const groupsRes = await groupsApi.getAll({ limit: 100, page: 1 });
      const groups = groupsRes.groups;

      // Fetch enrollments for all groups to calculate statistics
      let totalStudents = 0;
      let pendingGrades = 0;
      const enrollmentsByGroup: Record<string, Enrollment[]> = {};

      for (const group of groups) {
        try {
          const enrollmentsRes = await enrollmentsApi.getByGroup(group.id);
          enrollmentsByGroup[group.id] = enrollmentsRes.enrollments;
          totalStudents += enrollmentsRes.enrollments.length;
          pendingGrades += enrollmentsRes.enrollments.filter(e => e.calificacion === null || e.calificacion === undefined).length;
        } catch (err) {
          console.error(`Error fetching enrollments for group ${group.id}:`, err);
        }
      }

      // Get recent enrollments (from first group)
      const recentEnrollments = groups.length > 0 && enrollmentsByGroup[groups[0].id]
        ? enrollmentsByGroup[groups[0].id].slice(0, 5)
        : [];

      setStats({
        totalGroups: groups.length,
        totalStudents,
        pendingGrades,
        groups: groups.slice(0, 6), // Show up to 6 groups
        recentEnrollments,
      });
    } catch (err: any) {
      showToast('Error al cargar los datos del dashboard', 'error');
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color, onClick }: {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    color: string;
    onClick?: () => void;
  }) => (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
        </div>
        <div className={`${color} bg-opacity-10 p-3 rounded-full`}>
          {icon}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Layout>
        <div className="p-6">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
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
          <h1 className="text-3xl font-bold text-gray-900">Panel del Maestro</h1>
          <p className="text-gray-600 mt-2">Resumen de tus grupos y estudiantes</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Mis Grupos"
            value={stats.totalGroups}
            color="text-blue-600"
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
            onClick={() => navigate('/admin/groups')}
          />
          <StatCard
            title="Total Estudiantes"
            value={stats.totalStudents}
            color="text-green-600"
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
          />
          <StatCard
            title="Calificaciones Pendientes"
            value={stats.pendingGrades}
            color="text-orange-600"
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            onClick={() => navigate('/teacher/grades')}
          />
        </div>

        {/* My Groups */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Mis Grupos</h2>
            <button
              onClick={() => navigate('/admin/groups')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Ver todos →
            </button>
          </div>
          {stats.groups.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No tienes grupos asignados
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.groups.map((group) => (
                <div
                  key={group.id}
                  onClick={() => navigate('/teacher/grades')}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <h3 className="font-semibold text-gray-900 mb-2">{group.nombre}</h3>
                  <p className="text-sm text-gray-600 mb-1">
                    {group.subject?.nombre || 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500">Período: {group.periodo}</p>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500">Maestro asignado</p>
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
              onClick={() => navigate('/teacher/grades')}
              className="flex items-center gap-4 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left"
            >
              <div className="bg-blue-600 p-3 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Gestión de Calificaciones</p>
                <p className="text-sm text-gray-600">Actualiza las calificaciones de tus estudiantes</p>
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
                <p className="font-semibold text-gray-900">Ver Mis Grupos</p>
                <p className="text-sm text-gray-600">Consulta todos tus grupos asignados</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};
