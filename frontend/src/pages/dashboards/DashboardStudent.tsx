// Student dashboard component with enrollments and grades
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { enrollmentsApi, examsApi, studentsApi } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { PageLoader, Icon } from '../../components/ui';
import type { IconName } from '../../components/ui/Icon';
import type { Enrollment, Student } from '../../types';

interface StudentDashboardStats {
  totalEnrollments: number;
  completedGrades: number;
  pendingGrades: number;
  student: Student | null;
  recentEnrollments: Enrollment[];
}

type EnglishStatusData = Awaited<ReturnType<typeof examsApi.getStudentEnglishStatusV2>>;

type EnglishAlertTone = 'pago' | 'rechazo' | 'revision' | 'espera' | 'info';

interface EnglishAlert {
  tone: EnglishAlertTone;
  text: string;
  /** Cuenta como acción que el alumno debe atender (no solo informativa) */
  actionable: boolean;
}

const ENGLISH_ALERT_STYLES: Record<EnglishAlertTone, { dot: string; text: string }> = {
  pago: { dot: 'bg-orange-500', text: 'text-orange-800' },
  rechazo: { dot: 'bg-red-500', text: 'text-red-800' },
  revision: { dot: 'bg-purple-500', text: 'text-purple-800' },
  espera: { dot: 'bg-indigo-500', text: 'text-indigo-800' },
  info: { dot: 'bg-blue-500', text: 'text-blue-800' },
};

/** Deriva las acciones de inglés pendientes a partir del estado del alumno. */
const buildEnglishAlerts = (e: EnglishStatusData): EnglishAlert[] => {
  const items = [
    ...e.diagnosticExams.map((x) => ({ estatus: x.estatus, pagoAprobado: x.pagoAprobado })),
    ...e.englishCourses.map((x) => ({ estatus: x.estatus, pagoAprobado: x.pagoAprobado })),
  ];

  const pagosPendientes = items.filter(
    (i) => i.estatus === 'PENDIENTE_PAGO' && i.pagoAprobado !== false
  ).length;
  const pagosRechazados = items.filter(
    (i) => i.estatus === 'PENDIENTE_PAGO' && i.pagoAprobado === false
  ).length;
  const enRevision = items.filter((i) => i.estatus === 'PAGO_PENDIENTE_APROBACION').length;
  const enEspera = items.filter((i) => i.estatus === 'LISTA_ESPERA').length;
  const sinDiagnostico =
    !e.nivelInglesActual && !e.pendingExam && e.diagnosticExams.length === 0;

  const alerts: EnglishAlert[] = [];

  if (pagosPendientes > 0) {
    alerts.push({
      tone: 'pago',
      actionable: true,
      text: `${pagosPendientes} pago${pagosPendientes > 1 ? 's' : ''} pendiente${pagosPendientes > 1 ? 's' : ''}: lleva tu comprobante a Servicio Estudiantil.`,
    });
  }
  if (pagosRechazados > 0) {
    alerts.push({
      tone: 'rechazo',
      actionable: true,
      text: `${pagosRechazados} pago${pagosRechazados > 1 ? 's' : ''} rechazado${pagosRechazados > 1 ? 's' : ''}: cancela y vuelve a solicitar con el comprobante correcto.`,
    });
  }
  if (sinDiagnostico) {
    alerts.push({
      tone: 'info',
      actionable: true,
      text: 'Aún no presentas tu examen de diagnóstico de inglés.',
    });
  }
  if (enRevision > 0) {
    alerts.push({
      tone: 'revision',
      actionable: false,
      text: `${enRevision} pago${enRevision > 1 ? 's' : ''} en revisión por el administrador.`,
    });
  }
  if (enEspera > 0) {
    alerts.push({
      tone: 'espera',
      actionable: false,
      text: `${enEspera} solicitud${enEspera > 1 ? 'es' : ''} en lista de espera.`,
    });
  }

  return alerts;
};

export const DashboardStudent = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StudentDashboardStats | null>(null);
  const [english, setEnglish] = useState<EnglishStatusData | null>(null);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      fetchEnglishStatus();
    }
  }, [user]);

  // El estado de inglés es informativo en el dashboard: si falla, no debe
  // tumbar el resto del panel.
  const fetchEnglishStatus = async () => {
    try {
      const data = await examsApi.getStudentEnglishStatusV2();
      setEnglish(data);
    } catch (err) {
      console.error('Error fetching English status for dashboard:', err);
      setEnglish(null);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [studentRes, enrollmentsRes] = await Promise.all([
        studentsApi.getMe(),
        enrollmentsApi.getMe({ limit: 100, page: 1 }),
      ]);
      const student = studentRes as Student;
      const enrollments = enrollmentsRes.enrollments;

      const totalEnrollments = enrollments.length;
      const completedGrades = enrollments.filter(
        (e) => e.calificacion !== null && e.calificacion !== undefined
      ).length;

      setStats({
        totalEnrollments,
        completedGrades,
        pendingGrades: totalEnrollments - completedGrades,
        student,
        recentEnrollments: enrollments.slice(0, 6),
      });
    } catch (err) {
      showToast('Error al cargar los datos del dashboard', 'error');
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
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
          <div className="bg-error-container/30 border border-error/30 text-error px-4 py-3 rounded-lg">
            Error al cargar los datos del dashboard
          </div>
        </div>
      </Layout>
    );
  }

  const englishAlerts = english ? buildEnglishAlerts(english) : [];
  const englishActionCount = englishAlerts.filter((a) => a.actionable).length;
  const englishRequirementMet = english?.cumpleRequisitoIngles ?? false;

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-on-surface font-headline">Panel del Estudiante</h1>
          <p className="text-on-surface-variant mt-2">
            {stats.student && (
              <>
                Bienvenido,{' '}
                <span className="font-semibold">
                  {stats.student.nombre} {stats.student.apellidoPaterno}
                </span>
              </>
            )}
          </p>
        </div>

        {/* Student Info Card (hero) */}
        {stats.student && (
          <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl shadow-soft p-6 text-on-primary">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
            {/* Promedios oficiales (RB-037) — única fuente de verdad del promedio */}
            {(stats.student.promedioGeneral !== undefined ||
              stats.student.promedioIngles !== undefined) && (
              <div className="mt-6 pt-6 border-t border-on-primary/20">
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

        {/* Mi Inglés — resumen de acciones pendientes (producto SIPI Inglés) */}
        {english && (
          <div className="bg-surface-container-lowest rounded-2xl shadow-soft p-6 border-l-4 border-yellow-400">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-yellow-100 p-2 rounded-lg">
                  <Icon name="book" size={22} className="text-yellow-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-on-surface">Mi Inglés</h2>
                    {englishActionCount > 0 ? (
                      <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                        {englishActionCount} acción{englishActionCount > 1 ? 'es' : ''} pendiente
                        {englishActionCount > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Al día
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Requisito de graduación:{' '}
                    <span className={englishRequirementMet ? 'text-green-700 font-medium' : 'text-red-700 font-medium'}>
                      {englishRequirementMet ? 'Cumplido' : 'Pendiente'}
                    </span>
                    {english.nivelInglesActual
                      ? ` · Nivel actual ${english.nivelInglesActual}`
                      : ' · Sin nivel definido'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/student/english/status')}
                className="shrink-0 text-yellow-700 hover:text-yellow-900 text-sm font-medium"
              >
                Ver mi inglés →
              </button>
            </div>

            {englishAlerts.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {englishAlerts.map((alert, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${ENGLISH_ALERT_STYLES[alert.tone].dot}`} />
                    <span className={ENGLISH_ALERT_STYLES[alert.tone].text}>{alert.text}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-on-surface-variant">
                No tienes acciones de inglés pendientes por ahora.
              </p>
            )}
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Total Inscripciones"
            value={stats.totalEnrollments}
            icon="enrollments"
            color="text-primary"
            onClick={() => navigate('/student/enrollments')}
          />
          <StatCard
            title="Calificadas"
            value={stats.completedGrades}
            icon="check-circle"
            color="text-tertiary"
            onClick={() => navigate('/student/enrollments')}
          />
          <StatCard
            title="Pendientes"
            value={stats.pendingGrades}
            icon="info"
            color="text-secondary"
            onClick={() => navigate('/student/enrollments')}
          />
        </div>

        {/* My Enrollments */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-soft p-6 border border-outline-variant/20">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-on-surface">Mis Calificaciones</h2>
            <button
              onClick={() => navigate('/student/enrollments')}
              className="text-primary hover:opacity-80 text-sm font-medium"
            >
              Ver todas →
            </button>
          </div>
          {stats.recentEnrollments.length === 0 ? (
            <div className="text-center py-8 text-on-surface-variant">
              No tienes inscripciones registradas
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.recentEnrollments.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="border border-outline-variant/30 rounded-xl p-4 hover:shadow-medium transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-on-surface text-sm">
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
                  <p className="text-xs text-on-surface-variant mb-1">
                    {enrollment.group?.nombre || 'N/A'} - {enrollment.group?.periodo || 'N/A'}
                  </p>
                  <p className="text-xs text-on-surface-variant/70">
                    Créditos: {enrollment.group?.subject?.creditos || 'N/A'}
                  </p>
                  <div className="mt-3 pt-3 border-t border-outline-variant/20">
                    <p className="text-xs text-on-surface-variant/70">
                      Maestro: {enrollment.group?.teacher?.nombre || 'N/A'}{' '}
                      {enrollment.group?.teacher?.apellidoPaterno || ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-soft p-6 border border-outline-variant/20">
          <h2 className="text-xl font-semibold text-on-surface mb-4">Accesos Rápidos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <QuickAction
              title="Ver Mis Calificaciones"
              description="Consulta todas tus calificaciones"
              icon="grades"
              onClick={() => navigate('/student/enrollments')}
            />
            <QuickAction
              title="Mi Inglés"
              description="Consulta tu progreso y solicita exámenes o cursos"
              icon="book"
              onClick={() => navigate('/student/english/status')}
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
