// Vista de detalle de grupo (solo lectura) para el rol MAESTRO.
// Reutiliza datos existentes (groupsApi.getById + enrollmentsApi.getByGroup) sin
// exponer acciones administrativas. Para calificar, deriva a /teacher/grades.
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { groupsApi, enrollmentsApi } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { Loader, Badge, Icon } from '../../components/ui';
import type { Group, Enrollment } from '../../types';

export const TeacherGroupDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [group, setGroup] = useState<Group | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchData(id);
  }, [id]);

  const fetchData = async (groupId: string) => {
    try {
      setLoading(true);
      const [groupRes, enrollmentsRes] = await Promise.all([
        groupsApi.getById(groupId),
        enrollmentsApi.getByGroup(groupId),
      ]);
      setGroup(groupRes);
      setEnrollments(enrollmentsRes.enrollments);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Error al cargar el grupo', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-6">
          <Loader variant="spinner" size="lg" text="Cargando grupo..." />
        </div>
      </Layout>
    );
  }

  if (!group) {
    return (
      <Layout>
        <div className="p-6">
          <div className="bg-error-container/30 border border-error/30 text-error px-4 py-3 rounded-lg">
            No se encontró el grupo o no tienes acceso a él.
          </div>
        </div>
      </Layout>
    );
  }

  const calificados = enrollments.filter(
    (e) => e.calificacion !== null && e.calificacion !== undefined
  ).length;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <button
          onClick={() => navigate('/admin/groups')}
          className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface"
        >
          <Icon name="chevron-left" size={20} />
          Volver a mis grupos
        </button>

        {/* Encabezado */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-soft p-6 border border-outline-variant/20">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <Badge variant="default">{group.codigo || group.nombre}</Badge>
                <Badge variant="info">{group.periodo}</Badge>
                {group.estatus && (
                  <Badge variant={group.estatus === 'ABIERTO' ? 'success' : 'default'}>
                    {group.estatus}
                  </Badge>
                )}
                {group.esCursoIngles && (
                  <Badge variant="info">
                    Inglés{group.nivelIngles ? ` · Nivel ${group.nivelIngles}` : ''}
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl font-bold text-on-surface font-headline">
                {group.subject?.nombre || 'Materia no asignada'}
              </h1>
              <p className="text-on-surface-variant mt-1">{group.nombre}</p>
            </div>
            <button
              onClick={() => navigate('/teacher/grades')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg hover:opacity-90 transition-opacity font-medium"
            >
              <Icon name="grades" size={18} />
              Calificar
            </button>
          </div>

          {/* Datos del grupo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <InfoTile label="Horario" value={group.horario} icon="schedule" />
            <InfoTile
              label="Ubicación"
              value={[group.edificio, group.aula].filter(Boolean).join(' · ') || undefined}
              icon="location_on"
            />
            <InfoTile label="Modalidad" value={group.modalidad} icon="cast_for_education" />
            <InfoTile
              label="Cupo"
              value={`${group.cupoActual ?? enrollments.length} / ${group.cupoMaximo ?? '—'}`}
              icon="groups"
            />
            {/* El costo es dato financiero/administrativo; no se muestra al maestro. */}
          </div>
        </div>

        {/* Roster */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-soft border border-outline-variant/20 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-outline-variant/20">
            <h2 className="text-lg font-bold text-on-surface">Estudiantes</h2>
            <span className="text-sm text-on-surface-variant">
              {calificados} de {enrollments.length} calificados
            </span>
          </div>

          {enrollments.length === 0 ? (
            <div className="p-8 text-center text-on-surface-variant">
              No hay estudiantes inscritos en este grupo.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-outline-variant/20">
                <thead className="bg-surface-container-low">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-on-surface-variant uppercase tracking-wider">Matrícula</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-on-surface-variant uppercase tracking-wider">Estudiante</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-on-surface-variant uppercase tracking-wider">Estatus</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-on-surface-variant uppercase tracking-wider">Calificación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {enrollments.map((e) => (
                    <tr key={e.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-on-surface">
                        {e.student?.matricula || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-on-surface-variant">
                        {e.student
                          ? `${e.student.nombre} ${e.student.apellidoPaterno} ${e.student.apellidoMaterno}`
                          : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {e.estatus ? <Badge variant="default">{e.estatus}</Badge> : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <GradeText value={e.calificacion} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

const InfoTile = ({ label, value, icon }: { label: string; value?: string; icon: string }) => (
  <div className="bg-surface rounded-xl p-4 border border-outline-variant/20">
    <div className="flex items-center gap-1.5 text-on-surface-variant text-xs mb-1">
      <span className="material-symbols-outlined text-[16px]">{icon}</span>
      {label}
    </div>
    <p className="text-on-surface font-semibold">{value || '—'}</p>
  </div>
);

const GradeText = ({ value }: { value: number | null }) => {
  if (value === null || value === undefined) {
    return <span className="text-on-surface-variant">Sin calificar</span>;
  }
  const color = value >= 70 ? 'text-green-600' : value >= 60 ? 'text-yellow-600' : 'text-red-600';
  return <span className={`font-semibold ${color}`}>{value}</span>;
};
