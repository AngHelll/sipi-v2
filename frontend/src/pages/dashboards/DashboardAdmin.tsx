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
  Legend,
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

  // Professional chart color palette
  const chartColors = {
    text: '#374151',
    grid: '#E5E7EB',
    background: '#FFFFFF',
    bar: [
      { fill: 'url(#blueGradient)', stroke: '#2563EB', strokeWidth: 1 },
      { fill: 'url(#greenGradient)', stroke: '#059669', strokeWidth: 1 },
      { fill: 'url(#purpleGradient)', stroke: '#7C3AED', strokeWidth: 1 },
      { fill: 'url(#orangeGradient)', stroke: '#D97706', strokeWidth: 1 },
      { fill: 'url(#redGradient)', stroke: '#DC2626', strokeWidth: 1 },
      { fill: 'url(#cyanGradient)', stroke: '#0891B2', strokeWidth: 1 },
    ],
    pie: ['#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#EF4444', '#06B6D4'],
    line: { stroke: '#3B82F6', strokeWidth: 3, fill: 'url(#lineGradient)' },
  };

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

  // Custom label for pie chart - with dynamic color based on background
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    // Use dark text color for better visibility on light backgrounds
    const textColor = '#1F2937'; // gray-800

    return (
      <text
        x={x}
        y={y}
        fill={textColor}
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-sm font-bold"
        style={{ fontSize: '14px' }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
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

  const StatCard = ({ title, value, icon, color, gradientFrom, gradientTo, onClick }: {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    color: string;
    gradientFrom?: string;
    gradientTo?: string;
    onClick?: () => void;
  }) => (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg shadow-md border border-gray-200 p-6 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-3xl font-bold mt-2 ${gradientFrom && gradientTo ? `bg-gradient-to-r ${gradientFrom} ${gradientTo} bg-clip-text text-transparent` : color}`}>
            {value}
          </p>
        </div>
        <div className={`${gradientFrom && gradientTo ? `bg-gradient-to-br ${gradientFrom} ${gradientTo}` : `${color} bg-opacity-10`} p-3 rounded-xl shadow-lg`}>
          <div className="text-white">
            {icon}
          </div>
        </div>
      </div>
    </div>
  );

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
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Panel del Administrador</h1>
          <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Resumen general del sistema</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            title="Total Estudiantes"
            value={stats.totalStudents}
            color="text-blue-600"
            gradientFrom="from-blue-500"
            gradientTo="to-blue-600"
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
            gradientFrom="from-green-500"
            gradientTo="to-emerald-600"
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
            gradientFrom="from-purple-500"
            gradientTo="to-purple-600"
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
            gradientFrom="from-orange-500"
            gradientTo="to-orange-600"
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
            onClick={() => navigate('/admin/groups')}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Students by Status - Pie Chart */}
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 border border-gray-200 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Estudiantes por Estatus</h2>
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-lg flex items-center justify-center shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            {statusPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <defs>
                    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                      <feOffset dx="2" dy="2" result="offsetblur" />
                      <feComponentTransfer>
                        <feFuncA type="linear" slope="0.3" />
                      </feComponentTransfer>
                      <feMerge>
                        <feMergeNode />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomLabel}
                    outerRadius={100}
                    innerRadius={40}
                    fill="#8884d8"
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={800}
                    filter="url(#shadow)"
                  >
                    {statusPieData.map((_entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={chartColors.pie[index % chartColors.pie.length]}
                        stroke={chartColors.pie[index % chartColors.pie.length]}
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    wrapperStyle={{ paddingTop: '20px' }}
                    formatter={(value) => (
                      <span className="text-sm font-medium text-gray-800">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px]">
                <p className="text-gray-500">No hay datos disponibles</p>
              </div>
            )}
          </div>

          {/* Students by Carrera - Bar Chart */}
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 border border-gray-200 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Estudiantes por Carrera</h2>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            {carreraChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={carreraChartData} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
                  <defs>
                    <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#60A5FA" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.9} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} opacity={0.5} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#1F2937', fontSize: 12, fontWeight: 500 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                  />
                  <YAxis
                    tick={{ fill: '#1F2937', fontSize: 12, fontWeight: 500 }}
                    label={{ value: 'Estudiantes', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#1F2937', fontWeight: 600 } }}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} />
                  <Bar
                    dataKey="value"
                    fill="url(#blueGradient)"
                    radius={[12, 12, 0, 0]}
                    animationBegin={0}
                    animationDuration={1000}
                    stroke="#2563EB"
                    strokeWidth={1}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px]">
                <p className="text-gray-500">No hay datos disponibles</p>
              </div>
            )}
          </div>
        </div>

        {/* More Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Students by Semestre - Bar Chart */}
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 border border-gray-200 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Estudiantes por Semestre</h2>
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-lg flex items-center justify-center shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            {semestreChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={semestreChartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                  <defs>
                    <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34D399" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#10B981" stopOpacity={0.9} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} opacity={0.5} />
                  <XAxis
                    dataKey="semestre"
                    tick={{ fill: '#1F2937', fontSize: 12, fontWeight: 500 }}
                    label={{ value: 'Semestre', position: 'insideBottom', offset: -5, style: { textAnchor: 'middle', fill: '#1F2937', fontWeight: 600 } }}
                  />
                  <YAxis
                    tick={{ fill: '#1F2937', fontSize: 12, fontWeight: 500 }}
                    label={{ value: 'Estudiantes', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#1F2937', fontWeight: 600 } }}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(16, 185, 129, 0.1)' }} />
                  <Bar
                    dataKey="count"
                    fill="url(#greenGradient)"
                    radius={[12, 12, 0, 0]}
                    animationBegin={200}
                    animationDuration={1000}
                    stroke="#059669"
                    strokeWidth={1}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px]">
                <p className="text-gray-500">No hay datos disponibles</p>
              </div>
            )}
          </div>

          {/* Groups by Periodo - Line Chart */}
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 border border-gray-200 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Grupos por Período</h2>
              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
            </div>
            {periodoLineData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={periodoLineData} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
                  <defs>
                    <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} opacity={0.5} />
                  <XAxis
                    dataKey="periodo"
                    tick={{ fill: '#1F2937', fontSize: 12, fontWeight: 500 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                  />
                  <YAxis
                    tick={{ fill: '#1F2937', fontSize: 12, fontWeight: 500 }}
                    label={{ value: 'Grupos', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#1F2937', fontWeight: 600 } }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="grupos"
                    stroke="#8B5CF6"
                    strokeWidth={3}
                    dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 7, stroke: '#8B5CF6', strokeWidth: 2 }}
                    animationBegin={400}
                    animationDuration={1200}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px]">
                <p className="text-gray-500">No hay grupos registrados</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border border-gray-200">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">Accesos Rápidos</h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <button
              onClick={() => navigate('/admin/students/new')}
              className="flex flex-col items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
            >
              <svg className="w-8 h-8 text-blue-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-sm font-medium text-blue-600">Nuevo Estudiante</span>
            </button>
            <button
              onClick={() => navigate('/admin/teachers/new')}
              className="flex flex-col items-center justify-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-200"
            >
              <svg className="w-8 h-8 text-green-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-sm font-medium text-green-600">Nuevo Maestro</span>
            </button>
            <button
              onClick={() => navigate('/admin/subjects/new')}
              className="flex flex-col items-center justify-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200"
            >
              <svg className="w-8 h-8 text-purple-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-sm font-medium text-purple-600">Nueva Materia</span>
            </button>
            <button
              onClick={() => navigate('/admin/groups/new')}
              className="flex flex-col items-center justify-center p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors border border-orange-200"
            >
              <svg className="w-8 h-8 text-orange-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-sm font-medium text-orange-600">Nuevo Grupo</span>
            </button>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Inglés</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <button
                onClick={() => navigate('/admin/exam-periods')}
                className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200 text-left"
              >
                <svg className="w-6 h-6 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Períodos de Exámenes</p>
                  <p className="text-xs text-gray-600">Gestionar períodos de diagnóstico</p>
                </div>
              </button>
              <button
                onClick={() => navigate('/admin/exams')}
                className="flex items-center gap-3 p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200 text-left"
              >
                <svg className="w-6 h-6 text-indigo-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Exámenes de Diagnóstico</p>
                  <p className="text-xs text-gray-600">Ver y procesar inscripciones</p>
                </div>
              </button>
              <button
                onClick={() => navigate('/admin/english/payment-approvals')}
                className="flex items-center gap-3 p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors border border-yellow-200 text-left"
              >
                <svg className="w-6 h-6 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Aprobaciones de Pago</p>
                  <p className="text-xs text-gray-600">Revisar pagos de cursos de inglés</p>
                </div>
              </button>
              <button
                onClick={() => navigate('/admin/special-courses')}
                className="flex items-center gap-3 p-4 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors border border-teal-200 text-left"
              >
                <svg className="w-6 h-6 text-teal-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Cursos Especiales</p>
                  <p className="text-xs text-gray-600">Ver solicitudes de cursos especiales</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
