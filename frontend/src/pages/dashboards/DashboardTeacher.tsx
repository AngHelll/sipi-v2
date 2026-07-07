// Teacher dashboard component with groups and statistics
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { groupsApi, enrollmentsApi } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { PageLoader, GroupCard, Icon } from '../../components/ui';
import type { IconName } from '../../components/ui/Icon';
import type { Group } from '../../types';
import { ds } from '../../lib/designSystem';

interface TeacherDashboardStats {
  totalGroups: number;
  totalStudents: number;
  pendingGrades: number;
  englishGroups: number;
  groups: Group[];
  /** Pendientes por calificar por grupo (groupId → nº de alumnos sin calificación) */
  pendingByGroup: Record<string, number>;
}

type UrgencyTone = 'overdue' | 'soon' | 'normal';
interface GradingUrgency {
  label: string | null;
  tone: UrgencyTone;
  rank: number; // menor = más urgente (para ordenar)
  days: number;
}

/**
 * Urgencia de calificación según la fecha de fin del curso. Avisa cuando el
 * curso está por terminar (≤7 días) o ya terminó con calificaciones pendientes.
 */
const gradingUrgency = (fechaFin?: string): GradingUrgency => {
  if (!fechaFin) return { label: null, tone: 'normal', rank: 2, days: Infinity };
  const end = new Date(fechaFin);
  if (Number.isNaN(end.getTime())) return { label: null, tone: 'normal', rank: 2, days: Infinity };
  const days = Math.ceil((end.getTime() - Date.now()) / 86_400_000);
  if (days < 0) return { label: 'Curso finalizado', tone: 'overdue', rank: 0, days };
  if (days === 0) return { label: 'Termina hoy', tone: 'soon', rank: 1, days };
  if (days <= 7) return { label: `Termina en ${days} día${days > 1 ? 's' : ''}`, tone: 'soon', rank: 1, days };
  return { label: null, tone: 'normal', rank: 2, days };
};

const URGENCY_BADGE: Record<UrgencyTone, string> = {
  overdue: ds.urgencyBadge.overdue,
  soon: ds.urgencyBadge.soon,
  normal: ds.urgencyBadge.normal,
};

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
      const pendingByGroup: Record<string, number> = {};
      groups.forEach((group, idx) => {
        const list = enrollmentLists[idx];
        totalStudents += list.length;
        const pending = list.filter(
          (e) => e.calificacion === null || e.calificacion === undefined
        ).length;
        pendingByGroup[group.id] = pending;
        pendingGrades += pending;
      });

      setStats({
        totalGroups: groups.length,
        totalStudents,
        pendingGrades,
        englishGroups: groups.filter((g) => g.esCursoIngles).length,
        groups,
        pendingByGroup,
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
        <div className={`${ds.banner.error} px-4 py-3 rounded-lg`}>
          Error al cargar los datos del dashboard
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-stack-lg">
        <section className="rounded-3xl overflow-hidden bg-primary-container text-on-primary shadow-metric p-8 sm:p-10">
          <span className="text-label-sm font-semibold tracking-[0.2em] uppercase text-on-primary/70 mb-2 block">
            Panel del maestro
          </span>
          <h1 className="font-display-lg text-headline-lg-mobile sm:text-headline-lg text-on-primary">
            Resumen de tus grupos
          </h1>
          <p className="text-body-md text-on-primary/80 mt-2">Estudiantes, calificaciones pendientes y accesos rápidos</p>
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
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

        {/* Pendientes por calificar (acción prioritaria, ordenada por urgencia) */}
        {(() => {
          const pendientes = stats.groups
            .map((g) => ({ group: g, count: stats.pendingByGroup[g.id] ?? 0, urgency: gradingUrgency(g.fechaFin) }))
            .filter((x) => x.count > 0)
            .sort((a, b) =>
              a.urgency.rank - b.urgency.rank || a.urgency.days - b.urgency.days || b.count - a.count
            );
          if (pendientes.length === 0) return null;
          const hasUrgent = pendientes.some((x) => x.urgency.tone !== 'normal');
          return (
            <div
              className={`${ds.card.base} p-6 border-l-4 ${
                hasUrgent ? 'border-error' : 'border-tertiary-fixed-dim'
              }`}
            >
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <Icon
                  name="grades"
                  size={20}
                  className={hasUrgent ? ds.semantic.errorIcon : 'text-tertiary-fixed-dim'}
                />
                <h2 className={ds.page.sectionTitle}>Pendientes por calificar</h2>
                <span className={`px-2 py-0.5 text-label-sm font-semibold rounded-full ${ds.urgencyBadge.soon}`}>
                  {pendientes.reduce((s, x) => s + x.count, 0)} en {pendientes.length} grupo
                  {pendientes.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="divide-y divide-outline-variant/20">
                {pendientes.map(({ group, count, urgency }) => (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => navigate(`/teacher/groups/${group.id}`)}
                    className="w-full flex items-center justify-between py-3 text-left hover:bg-surface-container-low rounded-lg px-2 -mx-2 transition-colors gap-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-on-surface truncate">
                        {group.subject?.nombre || group.nombre}
                      </p>
                      <p className="text-xs text-on-surface-variant truncate">
                        {group.nombre} · {group.periodo}
                      </p>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      {urgency.label && (
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full inline-flex items-center gap-1 ${URGENCY_BADGE[urgency.tone]}`}>
                          <span className="material-symbols-outlined text-[12px]">
                            {urgency.tone === 'overdue' ? 'event_busy' : 'schedule'}
                          </span>
                          {urgency.label}
                        </span>
                      )}
                      <span className={`px-2.5 py-1 text-label-sm font-bold rounded-full ${ds.urgencyBadge.soon}`}>
                        {count} sin calificar
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })()}

        {/* My Groups */}
        <div className={`${ds.card.base} p-6`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className={ds.page.sectionTitle}>Mis grupos</h2>
            <button
              type="button"
              onClick={() => navigate('/admin/groups')}
              className={ds.btn.link}
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
              {stats.groups.slice(0, 6).map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  pendingGrades={stats.pendingByGroup[group.id]}
                  onClick={() => navigate(`/teacher/groups/${group.id}`)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className={`${ds.card.base} p-6`}>
          <h2 className={`${ds.page.sectionTitle} mb-4`}>Accesos rápidos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <QuickAction
              title="Calificar"
              description="Elige un grupo para calificar y gestionar tu clase"
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
    className={`${ds.card.base} p-6 ${onClick ? ds.card.interactive : ''}`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className={ds.page.label}>{title}</p>
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
    type="button"
    onClick={onClick}
    className="flex items-center gap-4 p-4 bg-surface-container-low hover:bg-surface-container rounded-xl transition-colors text-left border border-outline-variant/20 w-full"
  >
    <div className="bg-primary p-3 rounded-lg text-on-primary">
      <Icon name={icon} size={24} />
    </div>
    <div>
      <p className="font-semibold text-on-surface">{title}</p>
      <p className={ds.page.body}>{description}</p>
    </div>
  </button>
);
