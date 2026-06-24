// Teacher dashboard component with groups and statistics
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { groupsApi, enrollmentsApi } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { PageLoader, GroupCard, Icon } from '../../components/ui';
import type { IconName } from '../../components/ui/Icon';
import type { Group } from '../../types';

interface TeacherDashboardStats {
  totalGroups: number;
  totalStudents: number;
  pendingGrades: number;
  englishGroups: number;
  groups: Group[];
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

      const groupsRes = await groupsApi.getAll({ limit: 100, page: 1 });
      const groups = groupsRes.groups;

      // Una sola ráfaga en paralelo (antes era un loop secuencial = N+1).
      const enrollmentLists = await Promise.all(
        groups.map((group) =>
          enrollmentsApi
            .getByGroup(group.id)
            .then((res) => res.enrollments)
            .catch((err) => {
              console.error(`Error fetching enrollments for group ${group.id}:`, err);
              return [];
            })
        )
      );

      let totalStudents = 0;
      let pendingGrades = 0;
      for (const list of enrollmentLists) {
        totalStudents += list.length;
        pendingGrades += list.filter(
          (e) => e.calificacion === null || e.calificacion === undefined
        ).length;
      }

      setStats({
        totalGroups: groups.length,
        totalStudents,
        pendingGrades,
        englishGroups: groups.filter((g) => g.esCursoIngles).length,
        groups: groups.slice(0, 6),
      });
    } catch (err) {
      showToast('Error al cargar los datos del dashboard', 'error');
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
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
          <div className="bg-error-container/30 border border-error/30 text-error px-4 py-3 rounded-lg">
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
          <h1 className="text-3xl font-bold text-on-surface font-headline">Panel del Maestro</h1>
          <p className="text-on-surface-variant mt-2">Resumen de tus grupos y estudiantes</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Mis Grupos"
            value={stats.totalGroups}
            icon="groups"
            color="text-primary"
            onClick={() => navigate('/admin/groups')}
          />
          <StatCard
            title="Total Estudiantes"
            value={stats.totalStudents}
            icon="students"
            color="text-tertiary"
          />
          <StatCard
            title="Calificaciones Pendientes"
            value={stats.pendingGrades}
            icon="grades"
            color="text-secondary"
            onClick={() => navigate('/teacher/grades')}
          />
          <StatCard
            title="Grupos de Inglés"
            value={stats.englishGroups}
            icon="book"
            color="text-primary"
            onClick={() => navigate('/admin/groups')}
          />
        </div>

        {/* My Groups */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-soft p-6 border border-outline-variant/20">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-on-surface">Mis Grupos</h2>
            <button
              onClick={() => navigate('/admin/groups')}
              className="text-primary hover:opacity-80 text-sm font-medium"
            >
              Ver todos →
            </button>
          </div>
          {stats.groups.length === 0 ? (
            <div className="text-center py-8 text-on-surface-variant">
              No tienes grupos asignados
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stats.groups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  onClick={() => navigate(`/teacher/groups/${group.id}`)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-soft p-6 border border-outline-variant/20">
          <h2 className="text-xl font-semibold text-on-surface mb-4">Accesos Rápidos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <QuickAction
              title="Gestión de Calificaciones"
              description="Actualiza las calificaciones de tus estudiantes"
              icon="grades"
              onClick={() => navigate('/teacher/grades')}
            />
            <QuickAction
              title="Ver Mis Grupos"
              description="Consulta todos tus grupos asignados"
              icon="groups"
              onClick={() => navigate('/admin/groups')}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

const StatCard = ({
  title,
  value,
  icon,
  color,
  onClick,
}: {
  title: string;
  value: number | string;
  icon: IconName;
  color: string;
  onClick?: () => void;
}) => (
  <div
    onClick={onClick}
    className={`bg-surface-container-lowest rounded-2xl shadow-soft p-6 border border-outline-variant/20 transition-shadow ${
      onClick ? 'cursor-pointer hover:shadow-medium' : ''
    }`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-on-surface-variant">{title}</p>
        <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
      </div>
      <div className={`${color} bg-current/10 p-3 rounded-full`}>
        <Icon name={icon} size={28} className={color} />
      </div>
    </div>
  </div>
);

const QuickAction = ({
  title,
  description,
  icon,
  onClick,
}: {
  title: string;
  description: string;
  icon: IconName;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="flex items-center gap-4 p-4 bg-surface hover:bg-surface-container rounded-xl transition-colors text-left border border-outline-variant/20"
  >
    <div className="bg-primary p-3 rounded-lg text-on-primary">
      <Icon name={icon} size={24} />
    </div>
    <div>
      <p className="font-semibold text-on-surface">{title}</p>
      <p className="text-sm text-on-surface-variant">{description}</p>
    </div>
  </button>
);
