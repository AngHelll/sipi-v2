// Selector de grupo para calificar (rol MAESTRO).
// La calificación, visualización y herramientas viven en la vista única del
// grupo (/teacher/groups/:id); esta pantalla solo ayuda a elegir el grupo.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { groupsApi, enrollmentsApi } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { PageLoader, GroupCard, EmptyState } from '../../components/ui';
import type { Group } from '../../types';

export const GradesManagementPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [pendingByGroup, setPendingByGroup] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await groupsApi.getAll({ page: 1, limit: 100, sortBy: 'nombre', sortOrder: 'asc' });
      setGroups(response.groups);

      // Pendientes por calificar por grupo (una sola ráfaga en paralelo).
      const lists = await Promise.all(
        response.groups.map((g) =>
          enrollmentsApi
            .getByGroup(g.id)
            .then((res) => res.enrollments)
            .catch(() => [])
        )
      );
      const pending: Record<string, number> = {};
      response.groups.forEach((g, idx) => {
        pending[g.id] = lists[idx].filter(
          (e) => e.calificacion === null || e.calificacion === undefined
        ).length;
      });
      setPendingByGroup(pending);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Error al cargar los grupos', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <PageLoader text="Cargando grupos..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-on-surface font-headline">Calificar</h1>
          <p className="text-on-surface-variant mt-2">
            Elige un grupo para ver a sus estudiantes, calificar y usar las herramientas de clase.
          </p>
        </div>

        {groups.length === 0 ? (
          <EmptyState
            title="No tienes grupos asignados"
            description="Cuando se te asigne un grupo, aparecerá aquí para calificar."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                pendingGrades={pendingByGroup[group.id]}
                onClick={() => navigate(`/teacher/groups/${group.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};
