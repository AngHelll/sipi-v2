// Vista única del grupo para el rol MAESTRO: centro de operación de la clase.
// Combina visualización del grupo, calificación inline y herramientas de clase
// (buscador, filtros, resumen de progreso y exportar a CSV) en una sola pantalla.
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { groupsApi, enrollmentsApi, specialCoursesApi } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { Loader, Badge, Icon } from '../../components/ui';
import type { Group, Enrollment } from '../../types';

type RosterFilter = 'all' | 'ungraded' | 'passed' | 'failed';

const PASSING_GRADE = 70;

/**
 * Urgencia de calificación según la fecha de fin del curso (mismo criterio que
 * el dashboard del maestro): avisa cuando el curso está por terminar o terminó.
 */
const gradingUrgency = (fechaFin?: string): { label: string | null; tone: 'overdue' | 'soon' } => {
  if (!fechaFin) return { label: null, tone: 'soon' };
  const end = new Date(fechaFin);
  if (Number.isNaN(end.getTime())) return { label: null, tone: 'soon' };
  const days = Math.ceil((end.getTime() - Date.now()) / 86_400_000);
  if (days < 0) return { label: 'Curso finalizado', tone: 'overdue' };
  if (days === 0) return { label: 'Termina hoy', tone: 'soon' };
  if (days <= 7) return { label: `Termina en ${days} día${days > 1 ? 's' : ''}`, tone: 'soon' };
  return { label: null, tone: 'soon' };
};

export const TeacherGroupDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [group, setGroup] = useState<Group | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingGrade, setUpdatingGrade] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<RosterFilter>('all');

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

  const handleUpdateGrade = async (
    enrollmentId: string,
    newGrade: number | null,
    enrollment: Enrollment
  ) => {
    if (newGrade !== null && (newGrade < 0 || newGrade > 100)) {
      showToast('La calificación debe estar entre 0 y 100', 'error');
      return;
    }
    const isSpecialCourse = (enrollment as { isSpecialCourse?: boolean }).isSpecialCourse === true;
    try {
      setUpdatingGrade(enrollmentId);
      if (isSpecialCourse) {
        if (newGrade === null) {
          showToast('La calificación es requerida para cursos de inglés', 'error');
          return;
        }
        await specialCoursesApi.completeCourse(enrollmentId, { calificacion: newGrade });
        showToast('Calificación del curso de inglés actualizada', 'success');
      } else {
        await enrollmentsApi.update(enrollmentId, {
          calificacion: newGrade === null ? undefined : newGrade,
        });
        showToast('Calificación actualizada', 'success');
      }
      if (id) await fetchData(id);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Error al actualizar la calificación', 'error');
    } finally {
      setUpdatingGrade(null);
    }
  };

  // Resumen de clase
  const stats = useMemo(() => {
    const total = enrollments.length;
    const graded = enrollments.filter((e) => e.calificacion !== null && e.calificacion !== undefined);
    const aprobados = graded.filter((e) => (e.calificacion as number) >= PASSING_GRADE).length;
    const reprobados = graded.length - aprobados;
    const pendientes = total - graded.length;
    const promedio =
      graded.length > 0
        ? graded.reduce((sum, e) => sum + (e.calificacion as number), 0) / graded.length
        : null;
    const progress = total > 0 ? Math.round((graded.length / total) * 100) : 0;
    return { total, gradedCount: graded.length, aprobados, reprobados, pendientes, promedio, progress };
  }, [enrollments]);

  // Roster filtrado por búsqueda + filtro
  const filteredEnrollments = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enrollments.filter((e) => {
      const cal = e.calificacion;
      const isGraded = cal !== null && cal !== undefined;
      if (filter === 'ungraded' && isGraded) return false;
      if (filter === 'passed' && !(isGraded && (cal as number) >= PASSING_GRADE)) return false;
      if (filter === 'failed' && !(isGraded && (cal as number) < PASSING_GRADE)) return false;
      if (!q) return true;
      const name = e.student
        ? `${e.student.nombre} ${e.student.apellidoPaterno} ${e.student.apellidoMaterno}`.toLowerCase()
        : '';
      const matricula = (e.student?.matricula || '').toLowerCase();
      return name.includes(q) || matricula.includes(q);
    });
  }, [enrollments, search, filter]);

  const handleExportCsv = () => {
    if (!group) return;
    const headers = ['Matrícula', 'Estudiante', 'Estatus', 'Calificación'];
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const rows = filteredEnrollments.map((e) => {
      const name = e.student
        ? `${e.student.nombre} ${e.student.apellidoPaterno} ${e.student.apellidoMaterno}`
        : '';
      const cal = e.calificacion !== null && e.calificacion !== undefined ? String(e.calificacion) : '';
      return [e.student?.matricula || '', name, e.estatus || '', cal].map(escape).join(',');
    });
    const csv = [headers.map(escape).join(','), ...rows].join('\r\n');
    // BOM para que Excel respete los acentos.
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roster-${group.codigo || group.nombre}-${group.periodo}.csv`.replace(/\s+/g, '_');
    a.click();
    URL.revokeObjectURL(url);
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

  const urgency = gradingUrgency(group.fechaFin);

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
                {urgency.label && (
                  <span
                    className={`px-2 py-0.5 text-xs font-semibold rounded-full inline-flex items-center gap-1 ${
                      urgency.tone === 'overdue'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[12px]">
                      {urgency.tone === 'overdue' ? 'event_busy' : 'schedule'}
                    </span>
                    {urgency.label}
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-on-surface font-headline">
                {group.subject?.nombre || 'Materia no asignada'}
              </h1>
              <p className="text-on-surface-variant mt-1">{group.nombre}</p>
            </div>
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

        {/* Resumen de calificación */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-soft p-6 border border-outline-variant/20">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-on-surface">Progreso de calificación</h2>
            <span className="text-sm font-medium text-on-surface-variant">
              {stats.gradedCount} de {stats.total} ({stats.progress}%)
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-surface-container overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                stats.progress === 100 ? 'bg-green-500' : 'bg-primary'
              }`}
              style={{ width: `${stats.progress}%` }}
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
            <SummaryStat label="Promedio" value={stats.promedio !== null ? stats.promedio.toFixed(1) : '—'} />
            <SummaryStat label="Aprobados" value={stats.aprobados} tone="text-green-600" />
            <SummaryStat label="Reprobados" value={stats.reprobados} tone="text-red-600" />
            <SummaryStat label="Pendientes" value={stats.pendientes} tone="text-amber-600" />
          </div>
        </div>

        {/* Roster + herramientas */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-soft border border-outline-variant/20 overflow-hidden">
          <div className="p-5 border-b border-outline-variant/20 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h2 className="text-lg font-bold text-on-surface">Estudiantes</h2>
              <button
                onClick={handleExportCsv}
                disabled={filteredEnrollments.length === 0}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-outline-variant/40 text-on-surface hover:bg-surface-container transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                Exportar CSV
              </button>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {/* Buscador */}
              <div className="relative flex-1 min-w-[220px]">
                <span className="material-symbols-outlined text-[18px] absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                  search
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nombre o matrícula…"
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-outline-variant/40 bg-surface text-on-surface focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                />
              </div>
              {/* Filtros */}
              <div className="flex items-center gap-1 bg-surface-container rounded-lg p-1">
                {([
                  ['all', `Todos (${stats.total})`],
                  ['ungraded', `Sin calificar (${stats.pendientes})`],
                  ['passed', `Aprobados (${stats.aprobados})`],
                  ['failed', `Reprobados (${stats.reprobados})`],
                ] as [RosterFilter, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      filter === key
                        ? 'bg-primary text-on-primary'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {enrollments.length === 0 ? (
            <div className="p-8 text-center text-on-surface-variant">
              No hay estudiantes inscritos en este grupo.
            </div>
          ) : filteredEnrollments.length === 0 ? (
            <div className="p-8 text-center text-on-surface-variant">
              Ningún estudiante coincide con la búsqueda o el filtro.
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
                    <th className="px-6 py-3 text-right text-xs font-medium text-on-surface-variant uppercase tracking-wider">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {filteredEnrollments.map((e) => (
                    <GradeRow
                      key={e.id}
                      enrollment={e}
                      updating={updatingGrade === e.id}
                      onUpdate={(grade) => handleUpdateGrade(e.id, grade, e)}
                    />
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

const SummaryStat = ({
  label,
  value,
  tone = 'text-on-surface',
}: {
  label: string;
  value: number | string;
  tone?: string;
}) => (
  <div className="bg-surface rounded-xl p-4 border border-outline-variant/20 text-center">
    <p className={`text-2xl font-bold ${tone}`}>{value}</p>
    <p className="text-xs text-on-surface-variant mt-1">{label}</p>
  </div>
);

interface GradeRowProps {
  enrollment: Enrollment;
  updating: boolean;
  onUpdate: (grade: number | null) => Promise<void>;
}

const GradeRow = ({ enrollment, updating, onUpdate }: GradeRowProps) => {
  const [editMode, setEditMode] = useState(false);
  const [gradeInput, setGradeInput] = useState<string>(
    enrollment.calificacion !== null && enrollment.calificacion !== undefined
      ? enrollment.calificacion.toString()
      : ''
  );

  const isSpecialCourse = (enrollment as { isSpecialCourse?: boolean }).isSpecialCourse === true;
  const canGrade =
    !isSpecialCourse ||
    (['INSCRITO', 'EN_CURSO'].includes(enrollment.estatus || '') &&
      (enrollment.calificacion === null || enrollment.calificacion === undefined) &&
      (!(enrollment as { requierePago?: boolean }).requierePago ||
        (enrollment as { pagoAprobado?: boolean | null }).pagoAprobado === true));

  const handleSave = async () => {
    const grade = gradeInput.trim() === '' ? null : parseFloat(gradeInput);
    if (grade !== null && (isNaN(grade) || grade < 0 || grade > 100)) return;
    await onUpdate(grade);
    setEditMode(false);
  };

  const handleCancel = () => {
    setGradeInput(
      enrollment.calificacion !== null && enrollment.calificacion !== undefined
        ? enrollment.calificacion.toString()
        : ''
    );
    setEditMode(false);
  };

  const cal = enrollment.calificacion;
  const gradeColor =
    cal !== null && cal !== undefined
      ? cal >= 70
        ? 'text-green-600'
        : cal >= 60
          ? 'text-yellow-600'
          : 'text-red-600'
      : 'text-on-surface-variant';

  return (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-on-surface">
        {enrollment.student?.matricula || '—'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-on-surface-variant">
        {enrollment.student
          ? `${enrollment.student.nombre} ${enrollment.student.apellidoPaterno} ${enrollment.student.apellidoMaterno}`
          : '—'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        {enrollment.estatus ? <Badge variant="default">{enrollment.estatus}</Badge> : '—'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        {editMode ? (
          <input
            type="number"
            value={gradeInput}
            onChange={(e) => setGradeInput(e.target.value)}
            min={0}
            max={100}
            step={0.1}
            autoFocus
            className="w-24 px-2 py-1 rounded border border-outline-variant/40 bg-surface text-on-surface focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="0-100"
          />
        ) : (
          <span className={`font-semibold ${gradeColor}`}>
            {cal !== null && cal !== undefined ? cal : 'Sin calificar'}
          </span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        {editMode ? (
          <div className="inline-flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={updating}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-medium hover:opacity-90 disabled:opacity-50"
            >
              {updating ? 'Guardando…' : 'Guardar'}
            </button>
            <button
              onClick={handleCancel}
              disabled={updating}
              className="px-3 py-1.5 rounded-lg text-on-surface-variant hover:text-on-surface text-xs font-medium disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        ) : canGrade ? (
          <button
            onClick={() => setEditMode(true)}
            disabled={updating}
            className="inline-flex items-center gap-1 text-primary hover:opacity-80 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
            <span className="text-xs font-medium">Calificar</span>
          </button>
        ) : (
          <span className="text-xs text-on-surface-variant" title="Pago pendiente o curso no inscrito">
            No calificable
          </span>
        )}
      </td>
    </tr>
  );
};
