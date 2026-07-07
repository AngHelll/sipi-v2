// Admin dashboard component with statistics and overview
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { studentsApi, teachersApi, subjectsApi, groupsApi, specialCoursesApi, examsApi } from '../../lib/api';
import { getCached } from '../../lib/requestCache';
import { useToast } from '../../context/ToastContext';
import { PageLoader } from '../../components/ui';
import { ds } from '../../lib/designSystem';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalSubjects: number;
  totalGroups: number;
  activeStudents: number;
  inactiveStudents: number;
  graduatedStudents: number;
  studentsByCarrera: Record<string, number>;
  studentsBySemestre: Record<number, number>;
  groupsByPeriodo: Record<string, number>;
  recentEnrollments: any[];
}

interface EnglishOps {
  pagosPorAprobar: number;
  examenesPorProcesar: number;
  listaEsperaCursos: number;
  listaEsperaExamenes: number;
}

const EnglishOpTile = ({
  label,
  value,
  icon,
  onClick,
}: {
  label: string;
  value: number;
  icon: string;
  onClick: () => void;
}) => {
  const hasPending = value > 0;
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-start p-4 rounded-xl border text-left transition-colors ${
        hasPending
          ? 'bg-secondary-container/10 border-secondary-container/30 hover:bg-secondary-container/20'
          : 'bg-primary-container/5 border-primary-container/10 hover:bg-primary-container/10'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className={`material-symbols-outlined text-[22px] ${hasPending ? 'text-secondary' : 'text-primary'}`}>{icon}</span>
        {hasPending && (
          <span className="text-[10px] font-bold uppercase tracking-wide text-secondary bg-secondary-container/30 px-2 py-0.5 rounded-full">
            Pendiente
          </span>
        )}
      </div>
      <span className={`text-3xl font-black font-headline ${hasPending ? 'text-secondary' : 'text-primary'}`}>{value}</span>
      <span className="text-xs text-on-surface-variant mt-1 font-medium font-sans">{label}</span>
    </button>
  );
};

export const DashboardAdmin = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [englishOps, setEnglishOps] = useState<EnglishOps | null>(null);


  // Custom tooltip — tokens MD3 (W4)
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={ds.chart.tooltip}>
          <p className={ds.chart.tooltipTitle}>{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <p className={ds.chart.tooltipRow}>
                <span className="font-semibold">{entry.name || 'Valor'}:</span>{' '}
                <span className={ds.chart.tooltipValue}>{entry.value}</span>
              </p>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };


  useEffect(() => {
    fetchDashboardData();
    fetchEnglishOps();
  }, []);

  // Métricas operativas del producto (SIPI Inglés). Informativas en el dashboard:
  // si fallan, no deben tumbar el resto del panel.
  const fetchEnglishOps = async () => {
    try {
      const ops = await getCached('admin-english-ops', 60 * 1000, async () => {
        const [
          coursesPay,
          examsPay,
          coursesWaitlist,
          examsWaitlist,
          examsInscrito,
          examsPagoAprobado,
        ] = await Promise.allSettled([
          specialCoursesApi.getAll({ estatus: 'PENDIENTE_PAGO', courseType: 'INGLES', requierePago: true, limit: 100 }),
          examsApi.getAll({ estatus: 'PENDIENTE_PAGO', examType: 'DIAGNOSTICO', limit: 100 }),
          specialCoursesApi.getWaitlistSummary(),
          examsApi.getWaitlistSummary(),
          examsApi.getAll({ estatus: 'INSCRITO', examType: 'DIAGNOSTICO', limit: 1 }),
          examsApi.getAll({ estatus: 'PAGO_APROBADO', examType: 'DIAGNOSTICO', limit: 1 }),
        ]);

        const coursePayCount =
          coursesPay.status === 'fulfilled'
            ? coursesPay.value.courses.filter(
                (c) => c.course?.requierePago && c.course?.pagoAprobado === null
              ).length
            : 0;
        const examPayCount =
          examsPay.status === 'fulfilled'
            ? examsPay.value.exams.filter(
                (e) =>
                  e.exam?.requierePago &&
                  (e.exam?.pagoAprobado === null || e.exam?.pagoAprobado === undefined)
              ).length
            : 0;

        const examsToProcess =
          (examsInscrito.status === 'fulfilled' ? examsInscrito.value.pagination.total : 0) +
          (examsPagoAprobado.status === 'fulfilled' ? examsPagoAprobado.value.pagination.total : 0);

        return {
          pagosPorAprobar: coursePayCount + examPayCount,
          examenesPorProcesar: examsToProcess,
          listaEsperaCursos: coursesWaitlist.status === 'fulfilled' ? coursesWaitlist.value.total : 0,
          listaEsperaExamenes: examsWaitlist.status === 'fulfilled' ? examsWaitlist.value.total : 0,
        } satisfies EnglishOps;
      });
      setEnglishOps(ops);
    } catch (err) {
      console.error('Error fetching English ops for dashboard:', err);
      setEnglishOps(null);
    }
  };

  const fetchAllStudents = async (totalPages: number): Promise<any[]> => {
    const allStudents: any[] = [];
    for (let page = 1; page <= totalPages; page++) {
      const result = await studentsApi.getAll({ limit: 100, page });
      allStudents.push(...result.students);
    }
    return allStudents;
  };

  const fetchAllGroups = async (totalPages: number): Promise<any[]> => {
    const allGroups: any[] = [];
    for (let page = 1; page <= totalPages; page++) {
      const result = await groupsApi.getAll({ limit: 100, page });
      allGroups.push(...result.groups);
    }
    return allGroups;
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setStats(null);

      const dashboardStats = await getCached('admin-dashboard-stats', 2 * 60 * 1000, async () => {
        const [studentsRes, teachersRes, subjectsRes, groupsRes] = await Promise.allSettled([
          studentsApi.getAll({ limit: 100, page: 1 }),
          teachersApi.getAll({ limit: 100, page: 1 }),
          subjectsApi.getAll({ limit: 100, page: 1 }),
          groupsApi.getAll({ limit: 100, page: 1 }),
        ]);

        const totalStudents = studentsRes.status === 'fulfilled' ? studentsRes.value.pagination.total : 0;
        const totalTeachers = teachersRes.status === 'fulfilled' ? teachersRes.value.pagination.total : 0;
        const totalSubjects = subjectsRes.status === 'fulfilled' ? subjectsRes.value.pagination.total : 0;
        const totalGroups = groupsRes.status === 'fulfilled' ? groupsRes.value.pagination.total : 0;

        let allStudents: any[] = [];
        let allGroups: any[] = [];

        if (studentsRes.status === 'fulfilled') {
          allStudents =
            studentsRes.value.pagination.totalPages === 1
              ? studentsRes.value.students
              : await fetchAllStudents(studentsRes.value.pagination.totalPages);
        }

        if (groupsRes.status === 'fulfilled') {
          allGroups =
            groupsRes.value.pagination.totalPages === 1
              ? groupsRes.value.groups
              : await fetchAllGroups(groupsRes.value.pagination.totalPages);
        }

        const activeStudents = allStudents.filter((s) => s.estatus === 'ACTIVO').length;
        const inactiveStudents = allStudents.filter((s) => s.estatus === 'INACTIVO').length;
        const graduatedStudents = allStudents.filter((s) => s.estatus === 'EGRESADO').length;

        const studentsByCarrera: Record<string, number> = {};
        allStudents.forEach((student) => {
          studentsByCarrera[student.carrera] = (studentsByCarrera[student.carrera] || 0) + 1;
        });

        const studentsBySemestre: Record<number, number> = {};
        allStudents.forEach((student) => {
          studentsBySemestre[student.semestre] = (studentsBySemestre[student.semestre] || 0) + 1;
        });

        const groupsByPeriodo: Record<string, number> = {};
        allGroups.forEach((group) => {
          groupsByPeriodo[group.periodo] = (groupsByPeriodo[group.periodo] || 0) + 1;
        });

        return {
          totalStudents,
          totalTeachers,
          totalSubjects,
          totalGroups,
          activeStudents,
          inactiveStudents,
          graduatedStudents,
          studentsByCarrera,
          studentsBySemestre,
          groupsByPeriodo,
          recentEnrollments: [] as any[],
        } satisfies DashboardStats;
      });

      setStats(dashboardStats);
    } catch (err: any) {
      console.error('Unexpected error fetching dashboard data:', err);
      showToast('Error al cargar los datos del dashboard', 'error');
      // Set default stats to show something even if there's an error
      setStats({
        totalStudents: 0,
        totalTeachers: 0,
        totalSubjects: 0,
        totalGroups: 0,
        activeStudents: 0,
        inactiveStudents: 0,
        graduatedStudents: 0,
        studentsByCarrera: {},
        studentsBySemestre: {},
        groupsByPeriodo: {},
        recentEnrollments: [],
      });
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

  // Prepare chart data
  const carreraChartData = Object.entries(stats.studentsByCarrera)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);


  const periodoLineData = Object.entries(stats.groupsByPeriodo)
    .map(([periodo, count]) => ({ periodo, grupos: count }))
    .sort((a, b) => a.periodo.localeCompare(b.periodo));

  return (
    <Layout>
      <div className="space-y-stack-lg">
        <section className="relative rounded-3xl overflow-hidden bg-primary-container text-on-primary shadow-metric">
          <div className="relative z-10 p-8 sm:p-12">
            <span className="text-label-sm font-semibold tracking-[0.2em] uppercase text-on-primary/70 mb-2 block">
              Panel de control
            </span>
            <h1 className="font-display-lg text-headline-lg-mobile sm:text-display-lg text-on-primary leading-tight mb-4">
              Resumen institucional
            </h1>
            <p className="text-body-md text-on-primary/80 max-w-2xl">
              Infraestructura digital para la gestión académica. Supervise el estado de su
              institución en tiempo real.
            </p>
          </div>
          <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 pointer-events-none flex items-center justify-end pr-6">
            <span
              className="material-symbols-outlined text-on-primary text-[180px] leading-none"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              account_balance
            </span>
          </div>
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
          <button
            type="button"
            className={`${ds.card.base} p-6 text-left border-l-4 border-primary ${ds.card.interactive}`}
            onClick={() => navigate('/admin/students')}
          >
            <span className="text-label-sm font-semibold uppercase tracking-widest text-outline mb-2 block">
              Estudiantes
            </span>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-headline text-headline-lg text-primary">{stats.totalStudents}</span>
              <span className="text-label-sm font-bold text-primary bg-primary-fixed/50 px-2 py-0.5 rounded-full">
                {stats.activeStudents} activos
              </span>
            </div>
            <p className={`${ds.page.meta} mt-2`}>Matrícula total registrada</p>
          </button>

          <button
            type="button"
            className={`${ds.card.base} p-6 text-left ${ds.card.interactive}`}
            onClick={() => navigate('/admin/teachers')}
          >
            <span className="text-label-sm font-semibold uppercase tracking-widest text-outline mb-2 block">
              Docentes activos
            </span>
            <span className="font-headline text-headline-lg text-primary">{stats.totalTeachers}</span>
            <p className={`${ds.page.meta} mt-2`}>Personal académico verificado</p>
          </button>

          <button
            type="button"
            className={`${ds.card.base} p-6 text-left ${ds.card.interactive}`}
            onClick={() => navigate('/admin/subjects')}
          >
            <span className="text-label-sm font-semibold uppercase tracking-widest text-outline mb-2 block">
              Materias programadas
            </span>
            <span className="font-headline text-headline-lg text-primary">{stats.totalSubjects}</span>
            <p className={`${ds.page.meta} mt-2`}>Catálogo activo institucional</p>
          </button>

          <button
            type="button"
            className={`${ds.card.base} p-6 text-left border-l-4 border-tertiary-fixed-dim ${ds.card.interactive}`}
            onClick={() => navigate('/admin/groups')}
          >
            <span className="text-label-sm font-semibold uppercase tracking-widest text-outline mb-2 block">
              Grupos activos
            </span>
            <span className="font-headline text-headline-lg text-primary">{stats.totalGroups}</span>
            <p className={`${ds.page.meta} mt-2`}>Ciclo escolar en curso</p>
          </button>
        </div>

        {/* SIPI Inglés — operación del producto (acciones pendientes del admin) */}
        {englishOps && (
          <div className={`${ds.card.base} p-5 sm:p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-headline text-headline-md text-primary">SIPI Inglés — Operación</h3>
              <span className="material-symbols-outlined text-secondary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>translate</span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <EnglishOpTile
                label="Pagos por aprobar"
                value={englishOps.pagosPorAprobar}
                icon="payments"
                onClick={() => navigate('/admin/english/payment-approvals')}
              />
              <EnglishOpTile
                label="Exámenes por procesar"
                value={englishOps.examenesPorProcesar}
                icon="quiz"
                onClick={() => navigate('/admin/exams?examType=DIAGNOSTICO')}
              />
              <EnglishOpTile
                label="Lista de espera · cursos"
                value={englishOps.listaEsperaCursos}
                icon="hourglass_empty"
                onClick={() => navigate('/admin/special-courses?estatus=LISTA_ESPERA')}
              />
              <EnglishOpTile
                label="Lista de espera · exámenes"
                value={englishOps.listaEsperaExamenes}
                icon="hourglass_empty"
                onClick={() => navigate('/admin/exams?estatus=LISTA_ESPERA')}
              />
            </div>
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
          <div className={`${ds.card.base} p-5 sm:p-6`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-headline text-headline-md text-primary">Estudiantes por carrera</h3>
              <span className="material-symbols-outlined text-secondary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>bar_chart</span>
            </div>
            {carreraChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={carreraChartData} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#c0c8c6" opacity={0.5} />
                  <XAxis dataKey="name" tick={{ fill: '#414847', fontSize: 11, fontWeight: 500 }} angle={-45} textAnchor="end" height={80} interval={0} />
                  <YAxis tick={{ fill: '#414847', fontSize: 11, fontWeight: 500 }} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 25, 23, 0.05)' }} />
                  <Bar dataKey="value" fill="#c2ebe5" radius={[6, 6, 0, 0]} animationDuration={1000} stroke="#001917" strokeWidth={1} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px]">
                <p className="text-on-surface-variant text-sm">No hay datos disponibles</p>
              </div>
            )}
          </div>

          <div className={`${ds.card.base} p-5 sm:p-6`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-headline text-headline-md text-primary">Crecimiento de grupos</h3>
              <span className="material-symbols-outlined text-secondary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
            </div>
            {periodoLineData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={periodoLineData} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#c0c8c6" opacity={0.5} />
                  <XAxis dataKey="periodo" tick={{ fill: '#414847', fontSize: 11, fontWeight: 500 }} angle={-45} textAnchor="end" height={80} interval={0} />
                  <YAxis tick={{ fill: '#414847', fontSize: 11, fontWeight: 500 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="grupos" stroke="#505f76" strokeWidth={3} dot={{ fill: '#505f76', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} animationDuration={1200} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px]">
                <p className="text-on-surface-variant text-sm">No hay grupos registrados</p>
              </div>
            )}
          </div>
        </div>

        <div className={`${ds.card.base} p-5 sm:p-6`}>
          <h3 className="font-headline text-headline-md text-primary mb-4">Administración rápida</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button type="button" onClick={() => navigate('/admin/students/new')} className="flex flex-col items-center justify-center p-4 bg-primary-fixed/30 hover:bg-primary-fixed/50 border border-primary-fixed-dim rounded-xl transition-colors">
              <span className="material-symbols-outlined text-primary text-3xl mb-2">person_add</span>
              <span className="text-label-sm font-bold text-primary uppercase tracking-wide">Nuevo alumno</span>
            </button>
            <button type="button" onClick={() => navigate('/admin/teachers/new')} className="flex flex-col items-center justify-center p-4 bg-primary-fixed/30 hover:bg-primary-fixed/50 border border-primary-fixed-dim rounded-xl transition-colors">
              <span className="material-symbols-outlined text-primary text-3xl mb-2">badge</span>
              <span className="text-label-sm font-bold text-primary uppercase tracking-wide">Nuevo maestro</span>
            </button>
            <button type="button" onClick={() => navigate('/admin/subjects/new')} className="flex flex-col items-center justify-center p-4 bg-secondary-fixed/30 hover:bg-secondary-fixed/50 border border-secondary-fixed-dim rounded-xl transition-colors">
              <span className="material-symbols-outlined text-secondary text-3xl mb-2">menu_book</span>
              <span className="text-label-sm font-bold text-secondary uppercase tracking-wide">Nueva materia</span>
            </button>
            <button type="button" onClick={() => navigate('/admin/groups/new')} className="flex flex-col items-center justify-center p-4 bg-tertiary-fixed/30 hover:bg-tertiary-fixed/50 border border-tertiary-fixed-dim rounded-xl transition-colors">
              <span className="material-symbols-outlined text-tertiary text-3xl mb-2">group_add</span>
              <span className="text-label-sm font-bold text-tertiary uppercase tracking-wide">Nuevo grupo</span>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};
