// Admin dashboard component with statistics and overview
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { studentsApi, teachersApi, subjectsApi, groupsApi } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
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
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  // Colors for charts (adapt to dark mode)
  const chartColors = {
    text: theme === 'dark' ? '#E5E7EB' : '#374151',
    grid: theme === 'dark' ? '#374151' : '#E5E7EB',
    bar: ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4'],
    pie: ['#10B981', '#F59E0B', '#3B82F6'],
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!stats) {
    return (
      <Layout>
        <div className="p-6">
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
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

  const semestreChartData = Object.entries(stats.studentsBySemestre)
    .map(([semestre, count]) => ({ semestre: `Sem ${semestre}`, count: Number(count) }))
    .sort((a, b) => parseInt(a.semestre.replace('Sem ', '')) - parseInt(b.semestre.replace('Sem ', '')));

  const statusPieData = [
    { name: 'Activos', value: stats.activeStudents },
    { name: 'Inactivos', value: stats.inactiveStudents },
    { name: 'Egresados', value: stats.graduatedStudents },
  ].filter(item => item.value > 0);

  const periodoLineData = Object.entries(stats.groupsByPeriodo)
    .map(([periodo, count]) => ({ periodo, grupos: count }))
    .sort((a, b) => a.periodo.localeCompare(b.periodo));

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Panel del Administrador</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Resumen general del sistema</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Estudiantes"
            value={stats.totalStudents}
            color="text-blue-600"
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
            onClick={() => navigate('/admin/students')}
          />
          <StatCard
            title="Total Maestros"
            value={stats.totalTeachers}
            color="text-green-600"
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
            onClick={() => navigate('/admin/teachers')}
          />
          <StatCard
            title="Total Materias"
            value={stats.totalSubjects}
            color="text-purple-600"
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            }
            onClick={() => navigate('/admin/subjects')}
          />
          <StatCard
            title="Total Grupos"
            value={stats.totalGroups}
            color="text-orange-600"
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
            onClick={() => navigate('/admin/groups')}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Students by Status - Pie Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Estudiantes por Estatus</h2>
            {statusPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(props: any) => {
                      const { name, percent } = props;
                      return `${name || ''}: ${((percent || 0) * 100).toFixed(0)}%`;
                    }}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusPieData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={chartColors.pie[index % chartColors.pie.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#1F2937' : '#fff', border: `1px solid ${chartColors.grid}` }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-gray-500 dark:text-gray-400">No hay datos disponibles</p>
              </div>
            )}
          </div>

          {/* Students by Carrera - Bar Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Estudiantes por Carrera</h2>
            {carreraChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={carreraChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                  <XAxis dataKey="name" tick={{ fill: chartColors.text }} angle={-45} textAnchor="end" height={80} />
                  <YAxis tick={{ fill: chartColors.text }} />
                  <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#1F2937' : '#fff', border: `1px solid ${chartColors.grid}`, color: chartColors.text }} />
                  <Bar dataKey="value" fill={chartColors.bar[0]} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-gray-500 dark:text-gray-400">No hay datos disponibles</p>
              </div>
            )}
          </div>
        </div>

        {/* More Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Students by Semestre - Bar Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Estudiantes por Semestre</h2>
            {semestreChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={semestreChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                  <XAxis dataKey="semestre" tick={{ fill: chartColors.text }} />
                  <YAxis tick={{ fill: chartColors.text }} />
                  <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#1F2937' : '#fff', border: `1px solid ${chartColors.grid}`, color: chartColors.text }} />
                  <Bar dataKey="count" fill={chartColors.bar[1]} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-gray-500 dark:text-gray-400">No hay datos disponibles</p>
              </div>
            )}
          </div>

          {/* Groups by Periodo - Line Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Grupos por Período</h2>
            {periodoLineData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={periodoLineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                  <XAxis dataKey="periodo" tick={{ fill: chartColors.text }} angle={-45} textAnchor="end" height={80} />
                  <YAxis tick={{ fill: chartColors.text }} />
                  <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#1F2937' : '#fff', border: `1px solid ${chartColors.grid}`, color: chartColors.text }} />
                  <Line type="monotone" dataKey="grupos" stroke={chartColors.bar[2]} strokeWidth={2} dot={{ fill: chartColors.bar[2] }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-gray-500 dark:text-gray-400">No hay grupos registrados</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Accesos Rápidos</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/admin/students/new')}
              className="flex flex-col items-center justify-center p-4 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors border border-blue-200 dark:border-blue-800"
            >
              <svg className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Nuevo Estudiante</span>
            </button>
            <button
              onClick={() => navigate('/admin/teachers/new')}
              className="flex flex-col items-center justify-center p-4 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-lg transition-colors border border-green-200 dark:border-green-800"
            >
              <svg className="w-8 h-8 text-green-600 dark:text-green-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-sm font-medium text-green-600 dark:text-green-400">Nuevo Maestro</span>
            </button>
            <button
              onClick={() => navigate('/admin/subjects/new')}
              className="flex flex-col items-center justify-center p-4 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 rounded-lg transition-colors border border-purple-200 dark:border-purple-800"
            >
              <svg className="w-8 h-8 text-purple-600 dark:text-purple-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-sm font-medium text-purple-600 dark:text-purple-400">Nueva Materia</span>
            </button>
            <button
              onClick={() => navigate('/admin/groups/new')}
              className="flex flex-col items-center justify-center p-4 bg-orange-50 dark:bg-orange-900/30 hover:bg-orange-100 dark:hover:bg-orange-900/50 rounded-lg transition-colors border border-orange-200 dark:border-orange-800"
            >
              <svg className="w-8 h-8 text-orange-600 dark:text-orange-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-sm font-medium text-orange-600 dark:text-orange-400">Nuevo Grupo</span>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};
