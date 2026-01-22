// Group detail page for ADMIN - Shows complete group information and enrollments
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { groupsApi, enrollmentsApi } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { 
  Badge, 
  Icon, 
  PageLoader, 
  CapacityIndicator, 
  GradeDisplay, 
  AttendanceDisplay,
  EmptyState 
} from '../../components/ui';
import type { Group, Enrollment, EnrollmentsListResponse } from '../../types';

export const GroupDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();
  
  const [group, setGroup] = useState<Group | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingEnrollments, setLoadingEnrollments] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<EnrollmentsListResponse['pagination'] | null>(null);
  
  // Note: getEnrollmentsByGroup doesn't support pagination, returns all enrollments

  useEffect(() => {
    if (id) {
      fetchGroup();
      fetchEnrollments();
    }
  }, [id]);

  const fetchGroup = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const groupData = await groupsApi.getById(id);
      setGroup(groupData);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar el grupo');
      showToast('Error al cargar el grupo', 'error');
      console.error('Error fetching group:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollments = async () => {
    if (!id) return;

    try {
      setLoadingEnrollments(true);
      // Use getEnrollmentsByGroup endpoint which includes special courses
      const response = await enrollmentsApi.getByGroup(id);
      setEnrollments(response.enrollments);
      // getEnrollmentsByGroup doesn't return pagination, so we create a simple one
      setPagination({
        page: 1,
        limit: response.enrollments.length,
        total: response.enrollments.length,
        totalPages: 1,
      });
    } catch (err: any) {
      console.error('Error fetching enrollments:', err);
      showToast('Error al cargar las inscripciones', 'error');
    } finally {
      setLoadingEnrollments(false);
    }
  };

  const getStatusBadgeVariant = (status?: string) => {
    switch (status) {
      case 'ABIERTO':
        return 'success';
      case 'EN_CURSO':
        return 'info';
      case 'CERRADO':
        return 'warning';
      case 'FINALIZADO':
        return 'default';
      case 'CANCELADO':
        return 'danger';
      default:
        return 'default';
    }
  };

  const getEnrollmentStatusBadgeVariant = (status?: string) => {
    switch (status) {
      case 'INSCRITO':
        return 'info';
      case 'EN_CURSO':
        return 'success';
      case 'APROBADO':
        return 'success';
      case 'REPROBADO':
        return 'danger';
      case 'BAJA':
        return 'warning';
      case 'CANCELADO':
        return 'default';
      default:
        return 'default';
    }
  };

  const getModalityBadgeVariant = (modality?: string) => {
    switch (modality) {
      case 'PRESENCIAL':
        return 'info';
      case 'VIRTUAL':
        return 'success';
      case 'HIBRIDO':
        return 'warning';
      case 'SEMIPRESENCIAL':
        return 'default';
      default:
        return 'default';
    }
  };

  // Calculate statistics
  const stats = {
    total: enrollments.length,
    aprobados: enrollments.filter(e => {
      // Check both aprobado field and estatus
      return (e.aprobado === true) || (e.estatus === 'APROBADO');
    }).length,
    reprobados: enrollments.filter(e => {
      // Check both aprobado field and estatus
      return (e.aprobado === false && (e.calificacionFinal !== undefined || e.calificacion !== undefined)) || 
             (e.estatus === 'REPROBADO');
    }).length,
    enCurso: enrollments.filter(e => e.estatus === 'EN_CURSO').length,
    inscritos: enrollments.filter(e => e.estatus === 'INSCRITO').length,
    baja: enrollments.filter(e => e.estatus === 'BAJA').length,
    promedio: (() => {
      const grades = enrollments
        .map(e => e.calificacionFinal !== undefined && e.calificacionFinal !== null 
          ? e.calificacionFinal 
          : (e.calificacion !== undefined && e.calificacion !== null ? e.calificacion : null))
        .filter((g): g is number => g !== null && g !== undefined);
      return grades.length > 0 
        ? grades.reduce((sum, g) => sum + g, 0) / grades.length 
        : 0;
    })(),
  };

  if (loading) {
    return (
      <Layout>
        <PageLoader text="Cargando información del grupo..." />
      </Layout>
    );
  }

  if (error || !group) {
    return (
      <Layout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error || 'Grupo no encontrado'}</p>
            <button
              onClick={() => navigate('/admin/groups')}
              className="mt-4 text-red-600 hover:text-red-800 underline"
            >
              Volver a la lista de grupos
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={() => navigate('/admin/groups')}
                className="text-gray-600 hover:text-gray-900"
              >
                <Icon name="arrow-left" className="w-6 h-6" />
              </button>
              <h1 className="text-3xl font-bold text-gray-900">{group.nombre}</h1>
            </div>
            <p className="text-gray-600 mt-1">
              {group.subject?.nombre} - {group.periodo}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate(`/admin/groups/${id}/edit`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Icon name="edit" className="w-4 h-4" />
              Editar
            </button>
          </div>
        </div>

        {/* Group Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {/* Subject Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Materia</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-600">Clave:</span>
                <p className="font-medium">{group.subject?.clave || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Nombre:</span>
                <p className="font-medium">{group.subject?.nombre || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Créditos:</span>
                <p className="font-medium">{group.subject?.creditos || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Teacher Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Maestro</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-600">Nombre:</span>
                <p className="font-medium">
                  {group.teacher?.nombre} {group.teacher?.apellidoPaterno} {group.teacher?.apellidoMaterno}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Departamento:</span>
                <p className="font-medium">{group.teacher?.departamento || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Group Details */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Detalles del Grupo</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-600">Período:</span>
                <p className="font-medium">{group.periodo}</p>
              </div>
              {group.codigo && (
                <div>
                  <span className="text-sm text-gray-600">Código:</span>
                  <p className="font-medium">{group.codigo}</p>
                </div>
              )}
              <div>
                <span className="text-sm text-gray-600">Modalidad:</span>
                <Badge variant={getModalityBadgeVariant(group.modalidad)}>
                  {group.modalidad || 'N/A'}
                </Badge>
              </div>
              <div>
                <span className="text-sm text-gray-600">Estatus:</span>
                <Badge variant={getStatusBadgeVariant(group.estatus)}>
                  {group.estatus || 'N/A'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Schedule Information */}
          {(group.horario || group.aula || group.edificio) && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Horario y Ubicación</h3>
              <div className="space-y-2">
                {group.horario && (
                  <div>
                    <span className="text-sm text-gray-600">Horario:</span>
                    <p className="font-medium">{group.horario}</p>
                  </div>
                )}
                {group.aula && (
                  <div>
                    <span className="text-sm text-gray-600">Aula:</span>
                    <p className="font-medium">{group.aula}</p>
                  </div>
                )}
                {group.edificio && (
                  <div>
                    <span className="text-sm text-gray-600">Edificio:</span>
                    <p className="font-medium">{group.edificio}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Capacity Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Cupos</h3>
            <CapacityIndicator
              current={group.cupoActual || 0}
              max={group.cupoMaximo || 30}
              min={group.cupoMinimo || 5}
            />
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Estadísticas del Grupo</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-600">Total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.aprobados}</p>
              <p className="text-sm text-gray-600">Aprobados</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{stats.reprobados}</p>
              <p className="text-sm text-gray-600">Reprobados</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.enCurso}</p>
              <p className="text-sm text-gray-600">En Curso</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-600">{stats.inscritos}</p>
              <p className="text-sm text-gray-600">Inscritos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats.baja}</p>
              <p className="text-sm text-gray-600">Baja</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {stats.promedio > 0 ? stats.promedio.toFixed(1) : 'N/A'}
              </p>
              <p className="text-sm text-gray-600">Promedio</p>
            </div>
          </div>
        </div>

        {/* Enrollments List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">Estudiantes Inscritos</h3>
            <button
              onClick={() => navigate(`/admin/enrollments/new?groupId=${id}`)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm"
            >
              <Icon name="plus" className="w-4 h-4" />
              Nueva Inscripción
            </button>
          </div>

          {loadingEnrollments ? (
            <div className="p-6">
              <div className="text-center text-gray-600">Cargando inscripciones...</div>
            </div>
          ) : enrollments.length === 0 ? (
            <EmptyState
              title="No hay inscripciones"
              message="Este grupo no tiene estudiantes inscritos aún."
              actionLabel="Crear Inscripción"
              onAction={() => navigate(`/admin/enrollments/new?groupId=${id}`)}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estudiante
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Matrícula
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estatus
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Calificación Final
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Asistencia
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha Inscripción
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {enrollments.map((enrollment) => (
                      <tr key={enrollment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {enrollment.student?.nombre} {enrollment.student?.apellidoPaterno} {enrollment.student?.apellidoMaterno}
                          </div>
                          <div className="text-sm text-gray-500">
                            {enrollment.student?.carrera} - Semestre {enrollment.student?.semestre}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {enrollment.student?.matricula}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={getEnrollmentStatusBadgeVariant(enrollment.estatus)}>
                            {enrollment.estatus || 'N/A'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {enrollment.calificacionFinal !== undefined && enrollment.calificacionFinal !== null ? (
                            <GradeDisplay grade={enrollment.calificacionFinal} />
                          ) : enrollment.calificacion !== undefined && enrollment.calificacion !== null ? (
                            <GradeDisplay grade={enrollment.calificacion} />
                          ) : (
                            <span className="text-sm text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {enrollment.porcentajeAsistencia !== undefined ? (
                            <AttendanceDisplay
                              percentage={enrollment.porcentajeAsistencia}
                              asistencias={enrollment.asistencias}
                              faltas={enrollment.faltas}
                            />
                          ) : (
                            <span className="text-sm text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {enrollment.fechaInscripcion
                            ? new Date(enrollment.fechaInscripcion).toLocaleDateString('es-MX')
                            : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/admin/enrollments/${enrollment.id}/edit`);
                            }}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            <Icon name="edit" className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="text-sm text-gray-700">
                    Total de inscripciones: {pagination.total}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};



