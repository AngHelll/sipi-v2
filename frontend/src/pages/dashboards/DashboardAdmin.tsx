// Admin dashboard component with statistics and overview
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { studentsApi, teachersApi, subjectsApi, groupsApi } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { PageLoader } from '../../components/ui';
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

export const DashboardAdmin = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);


  // Custom tooltip component with improved contrast
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-xl border-2 border-gray-300">
          <p className="font-bold text-gray-900 mb-3 text-base">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <p className="text-sm text-gray-800">
                <span className="font-semibold">{entry.name || 'Valor'}:</span>{' '}
                <span className="font-bold text-gray-900">{entry.value}</span>
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
  }, []);

  // Helper function to fetch all pages of students
  const fetchAllStudents = async (totalPages: number): Promise<any[]> => {
    const allStudents: any[] = [];
    const promises = [];
    
    for (let page = 1; page <= totalPages; page++) {
      promises.push(studentsApi.getAll({ limit: 100, page }));
    }
    
    const results = await Promise.allSettled(promises);
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        allStudents.push(...result.value.students);
      }
    });
    
    return allStudents;
  };

  // Helper function to fetch all pages of groups
  const fetchAllGroups = async (totalPages: number): Promise<any[]> => {
    const allGroups: any[] = [];
    const promises = [];
    
    for (let page = 1; page <= totalPages; page++) {
      promises.push(groupsApi.getAll({ limit: 100, page }));
    }
    
    const results = await Promise.allSettled(promises);
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        allGroups.push(...result.value.groups);
      }
    });
    
    return allGroups;
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setStats(null); // Reset stats

      // Fetch totals first (quick)
      const [studentsRes, teachersRes, subjectsRes, groupsRes] = await Promise.allSettled([
        studentsApi.getAll({ limit: 100, page: 1 }),
        teachersApi.getAll({ limit: 100, page: 1 }),
        subjectsApi.getAll({ limit: 100, page: 1 }),
        groupsApi.getAll({ limit: 100, page: 1 }),
      ]);

      // Get totals from pagination
      const totalStudents = studentsRes.status === 'fulfilled' ? studentsRes.value.pagination.total : 0;
      const totalTeachers = teachersRes.status === 'fulfilled' ? teachersRes.value.pagination.total : 0;
      const totalSubjects = subjectsRes.status === 'fulfilled' ? subjectsRes.value.pagination.total : 0;
      const totalGroups = groupsRes.status === 'fulfilled' ? groupsRes.value.pagination.total : 0;

      // Log errors for debugging
      if (studentsRes.status === 'rejected') {
        console.error('Error fetching students:', studentsRes.reason);
        showToast('Error al cargar estudiantes', 'error');
      }
      if (teachersRes.status === 'rejected') {
        console.error('Error fetching teachers:', teachersRes.reason);
        showToast('Error al cargar maestros', 'error');
      }
      if (subjectsRes.status === 'rejected') {
        console.error('Error fetching subjects:', subjectsRes.reason);
        showToast('Error al cargar materias', 'error');
      }
      if (groupsRes.status === 'rejected') {
        console.error('Error fetching groups:', groupsRes.reason);
        showToast('Error al cargar grupos', 'error');
      }

      // Fetch all students and groups for detailed statistics
      let allStudents: any[] = [];
      let allGroups: any[] = [];

      if (studentsRes.status === 'fulfilled') {
        if (studentsRes.value.pagination.totalPages === 1) {
          // Single page, use existing data
          allStudents = studentsRes.value.students;
        } else {
          // Multiple pages, fetch all
          allStudents = await fetchAllStudents(studentsRes.value.pagination.totalPages);
        }
      }

      if (groupsRes.status === 'fulfilled') {
        if (groupsRes.value.pagination.totalPages === 1) {
          // Single page, use existing data
          allGroups = groupsRes.value.groups;
        } else {
          // Multiple pages, fetch all
          allGroups = await fetchAllGroups(groupsRes.value.pagination.totalPages);
        }
      }
      
      // Calculate statistics using all data
      const activeStudents = allStudents.filter(s => s.estatus === 'ACTIVO').length;
      const inactiveStudents = allStudents.filter(s => s.estatus === 'INACTIVO').length;
      const graduatedStudents = allStudents.filter(s => s.estatus === 'EGRESADO').length;

      // Count by carrera
      const studentsByCarrera: Record<string, number> = {};
      allStudents.forEach(student => {
        studentsByCarrera[student.carrera] = (studentsByCarrera[student.carrera] || 0) + 1;
      });

      // Count by semestre
      const studentsBySemestre: Record<number, number> = {};
      allStudents.forEach(student => {
        studentsBySemestre[student.semestre] = (studentsBySemestre[student.semestre] || 0) + 1;
      });

      // Count by periodo
      const groupsByPeriodo: Record<string, number> = {};
      allGroups.forEach(group => {
        groupsByPeriodo[group.periodo] = (groupsByPeriodo[group.periodo] || 0) + 1;
      });

      setStats({
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
        recentEnrollments: [],
      });
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
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            Error al cargar los datos del dashboard
          </div>
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
      <div className="space-y-6">
        {/* Atrium Header */}
        <section className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary to-primary-container p-8 sm:p-12 text-on-primary shadow-medium">
          <div className="relative z-10">
            <span className="text-xs sm:text-sm font-medium tracking-[0.2em] uppercase opacity-70 mb-2 block font-label">Panel de Control</span>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-[-0.03em] mb-4 font-headline text-white">Resumen Institucional</h2>
            <p className="text-sm sm:text-lg opacity-80 max-w-2xl font-light leading-relaxed font-sans text-white/90">Infraestructura digital para la gestión académica de alto rendimiento. Supervise el estado de su institución en tiempo real.</p>
          </div>
          <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 pointer-events-none">
            <img className="w-full h-full object-cover" alt="abstract architecture" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBmEoPSCnnDiIn3nirJOy_rJfKRXyLMxu8y1CZAdDHv0R_FCYMAkuAfQxcCm76lldRqIRp7FnRqv0WMc9VKOcZ5-P7AAZPvQcEyAbAtzC7T3M90M2St7xixAHYyMvi9HCUExeveP_BovB9weyi_mIzXQ7o_-HvCSyYaCfCatTcu6NIRDN3vKqvDB5iPBkMPsMoo1hpdPq3uzUMNrOUsqf9puLbQFdgRAnXYtMjVRVbTJOajYIybOfD01MvgP1HyaPw2MbZfMwMWR1I" />
          </div>
        </section>

        {/* Stats Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-surface-container-lowest p-6 rounded-xl border-l-4 border-primary shadow-soft hover:shadow-medium transition-shadow cursor-pointer" onClick={() => navigate('/admin/students')}>
            <span className="text-secondary font-bold text-[10px] sm:text-xs uppercase tracking-widest mb-2 block font-label">Estudiantes</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-primary font-headline">{stats.totalStudents}</span>
              <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">{stats.activeStudents} activos</span>
            </div>
            <p className="text-xs text-on-surface-variant mt-2 font-medium font-sans">Matrícula total registrada</p>
          </div>
          
          <div className="bg-surface-container-lowest p-6 rounded-xl shadow-soft hover:shadow-medium transition-shadow cursor-pointer" onClick={() => navigate('/admin/teachers')}>
            <span className="text-secondary font-bold text-[10px] sm:text-xs uppercase tracking-widest mb-2 block font-label">Docentes Activos</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-primary font-headline">{stats.totalTeachers}</span>
            </div>
            <p className="text-xs text-on-surface-variant mt-2 font-medium font-sans">Personal académico verificado</p>
          </div>
          
          <div className="bg-surface-container-lowest p-6 rounded-xl shadow-soft hover:shadow-medium transition-shadow cursor-pointer" onClick={() => navigate('/admin/subjects')}>
            <span className="text-secondary font-bold text-[10px] sm:text-xs uppercase tracking-widest mb-2 block font-label">Materias Programadas</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-primary font-headline">{stats.totalSubjects}</span>
            </div>
            <p className="text-xs text-on-surface-variant mt-2 font-medium font-sans">Catálogo activo institucional</p>
          </div>
          
          <div className="bg-surface-container-lowest p-6 rounded-xl border-l-4 border-secondary shadow-soft hover:shadow-medium transition-shadow cursor-pointer" onClick={() => navigate('/admin/groups')}>
            <span className="text-secondary font-bold text-[10px] sm:text-xs uppercase tracking-widest mb-2 block font-label">Grupos Activos</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-primary font-headline">{stats.totalGroups}</span>
            </div>
            <p className="text-xs text-on-surface-variant mt-2 font-medium font-sans">Ciclo escolar en curso</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Students by Carrera - Bar Chart */}
          <div className="bg-surface-container-lowest rounded-xl shadow-soft p-5 sm:p-6 border border-outline-variant/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-primary tracking-tight font-headline">Estudiantes por Carrera</h3>
              <span className="material-symbols-outlined text-secondary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>bar_chart</span>
            </div>
            {carreraChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={carreraChartData} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e2e2" opacity={0.5} />
                  <XAxis dataKey="name" tick={{ fill: '#424847', fontSize: 11, fontWeight: 500 }} angle={-45} textAnchor="end" height={80} interval={0} />
                  <YAxis tick={{ fill: '#424847', fontSize: 11, fontWeight: 500 }} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(23, 44, 41, 0.05)' }} />
                  <Bar dataKey="value" fill="#d0e7e3" radius={[6, 6, 0, 0]} animationDuration={1000} stroke="#172c29" strokeWidth={1} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px]">
                <p className="text-on-surface-variant text-sm">No hay datos disponibles</p>
              </div>
            )}
          </div>

          {/* Groups by Periodo - Line Chart */}
          <div className="bg-surface-container-lowest rounded-xl shadow-soft p-5 sm:p-6 border border-outline-variant/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-primary tracking-tight font-headline">Crecimiento de Grupos</h3>
              <span className="material-symbols-outlined text-secondary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
            </div>
            {periodoLineData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={periodoLineData} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e2e2" opacity={0.5} />
                  <XAxis dataKey="periodo" tick={{ fill: '#424847', fontSize: 11, fontWeight: 500 }} angle={-45} textAnchor="end" height={80} interval={0} />
                  <YAxis tick={{ fill: '#424847', fontSize: 11, fontWeight: 500 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="grupos" stroke="#944925" strokeWidth={3} dot={{ fill: '#944925', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} animationDuration={1200} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px]">
                <p className="text-on-surface-variant text-sm">No hay grupos registrados</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions (Bento Links) */}
        <div className="bg-surface-container-lowest rounded-xl shadow-soft p-5 border border-outline-variant/20">
          <h3 className="text-lg font-bold text-primary tracking-tight font-headline mb-4">Administración Rápida</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button onClick={() => navigate('/admin/students/new')} className="flex flex-col items-center justify-center p-4 bg-primary-container/5 hover:bg-primary-container/10 border border-primary-container/10 rounded-xl transition-colors">
              <span className="material-symbols-outlined text-primary text-3xl mb-2">person_add</span>
              <span className="text-xs font-bold text-primary uppercase tracking-wide">Nuevo Alumno</span>
            </button>
            <button onClick={() => navigate('/admin/teachers/new')} className="flex flex-col items-center justify-center p-4 bg-primary-container/5 hover:bg-primary-container/10 border border-primary-container/10 rounded-xl transition-colors">
              <span className="material-symbols-outlined text-primary text-3xl mb-2">badge</span>
              <span className="text-xs font-bold text-primary uppercase tracking-wide">Nuevo Maestro</span>
            </button>
            <button onClick={() => navigate('/admin/subjects/new')} className="flex flex-col items-center justify-center p-4 bg-secondary-container/5 hover:bg-secondary-container/10 border border-secondary-container/10 rounded-xl transition-colors">
              <span className="material-symbols-outlined text-secondary text-3xl mb-2">menu_book</span>
              <span className="text-xs font-bold text-secondary uppercase tracking-wide">Nueva Materia</span>
            </button>
            <button onClick={() => navigate('/admin/groups/new')} className="flex flex-col items-center justify-center p-4 bg-secondary-container/5 hover:bg-secondary-container/10 border border-secondary-container/10 rounded-xl transition-colors">
              <span className="material-symbols-outlined text-secondary text-3xl mb-2">group_add</span>
              <span className="text-xs font-bold text-secondary uppercase tracking-wide">Nuevo Grupo</span>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};
