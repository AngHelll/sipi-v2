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
import { ds, gradeToneClass, studentPage } from '../../lib/designSystem';
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
        <div className={ds.admin.pageShellCompact}>
          <div className={ds.admin.errorBox}>
            <p>{error || 'Grupo no encontrado'}</p>
            <button
              onClick={() => navigate('/admin/groups')}
              className={`mt-4 ${ds.btn.dangerLink} underline`}
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
      <div className={ds.admin.detailShell}>
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={() => navigate('/admin/groups')}
                className={studentPage.backLink}
              >
                <Icon name="arrow-left" className="w-6 h-6" />
              </button>
              <h1 className={`${ds.admin.pageTitle} mb-0`}>{group.nombre}</h1>
            </div>
            <p className={ds.admin.pageSubtitle}>
              {group.subject?.nombre} - {group.periodo}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate(`/admin/groups/${id}/edit`)}
              className={`${ds.btn.primary} flex items-center gap-2`}
            >
              <Icon name="edit" className="w-4 h-4" />
              Editar
            </button>
          </div>
        </div>

        {/* Group Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <div className={`${ds.admin.detailSection} mb-0`}>
            <h3 className={`${ds.page.sectionTitle} mb-4`}>Materia</h3>
            <div className="space-y-2">
              <div>
                <span className={ds.admin.kvLabel}>Clave:</span>
                <p className={`${ds.admin.kvValue} font-medium mt-0`}>{group.subject?.clave || 'N/A'}</p>
              </div>
              <div>
                <span className={ds.admin.kvLabel}>Nombre:</span>
                <p className={`${ds.admin.kvValue} font-medium mt-0`}>{group.subject?.nombre || 'N/A'}</p>
              </div>
              <div>
                <span className={ds.admin.kvLabel}>Créditos:</span>
                <p className={`${ds.admin.kvValue} font-medium mt-0`}>{group.subject?.creditos || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className={`${ds.admin.detailSection} mb-0`}>
            <h3 className={`${ds.page.sectionTitle} mb-4`}>Maestro</h3>
            <div className="space-y-2">
              <div>
                <span className={ds.admin.kvLabel}>Nombre:</span>
                <p className={`${ds.admin.kvValue} font-medium mt-0`}>
                  {group.teacher?.nombre} {group.teacher?.apellidoPaterno} {group.teacher?.apellidoMaterno}
                </p>
              </div>
              <div>
                <span className={ds.admin.kvLabel}>Departamento:</span>
                <p className={`${ds.admin.kvValue} font-medium mt-0`}>{group.teacher?.departamento || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className={`${ds.admin.detailSection} mb-0`}>
            <h3 className={`${ds.page.sectionTitle} mb-4`}>Detalles del Grupo</h3>
            <div className="space-y-2">
              <div>
                <span className={ds.admin.kvLabel}>Período:</span>
                <p className={`${ds.admin.kvValue} font-medium mt-0`}>{group.periodo}</p>
              </div>
              {group.codigo && (
                <div>
                  <span className={ds.admin.kvLabel}>Código:</span>
                  <p className={`${ds.admin.kvValue} font-medium mt-0`}>{group.codigo}</p>
                </div>
              )}
              <div>
                <span className={ds.admin.kvLabel}>Modalidad:</span>
                <div className="mt-1">
                  <Badge variant={getModalityBadgeVariant(group.modalidad)}>
                    {group.modalidad || 'N/A'}
                  </Badge>
                </div>
              </div>
              <div>
                <span className={ds.admin.kvLabel}>Estatus:</span>
                <div className="mt-1">
                  <Badge variant={getStatusBadgeVariant(group.estatus)}>
                    {group.estatus || 'N/A'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {(group.horario || group.aula || group.edificio) && (
            <div className={`${ds.admin.detailSection} mb-0`}>
              <h3 className={`${ds.page.sectionTitle} mb-4`}>Horario y Ubicación</h3>
              <div className="space-y-2">
                {group.horario && (
                  <div>
                    <span className={ds.admin.kvLabel}>Horario:</span>
                    <p className={`${ds.admin.kvValue} font-medium mt-0`}>{group.horario}</p>
                  </div>
                )}
                {group.aula && (
                  <div>
                    <span className={ds.admin.kvLabel}>Aula:</span>
                    <p className={`${ds.admin.kvValue} font-medium mt-0`}>{group.aula}</p>
                  </div>
                )}
                {group.edificio && (
                  <div>
                    <span className={ds.admin.kvLabel}>Edificio:</span>
                    <p className={`${ds.admin.kvValue} font-medium mt-0`}>{group.edificio}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className={`${ds.admin.detailSection} mb-0`}>
            <h3 className={`${ds.page.sectionTitle} mb-4`}>Cupos</h3>
            <CapacityIndicator
              current={group.cupoActual || 0}
              max={group.cupoMaximo || 30}
              min={group.cupoMinimo || 5}
            />
          </div>
        </div>

        {/* Statistics */}
        <div className={`${ds.admin.detailSection} mb-6`}>
          <h3 className={`${ds.page.sectionTitle} mb-4`}>Estadísticas del Grupo</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <div className="text-center">
              <p className={ds.admin.kvValueLg}>{stats.total}</p>
              <p className={ds.admin.kvLabel}>Total</p>
            </div>
            <div className="text-center">
              <p className={`${ds.admin.kvValueLg} ${ds.semantic.successTextStrong}`}>{stats.aprobados}</p>
              <p className={ds.admin.kvLabel}>Aprobados</p>
            </div>
            <div className="text-center">
              <p className={`${ds.admin.kvValueLg} ${ds.semantic.errorText}`}>{stats.reprobados}</p>
              <p className={ds.admin.kvLabel}>Reprobados</p>
            </div>
            <div className="text-center">
              <p className={`${ds.admin.kvValueLg} text-primary`}>{stats.enCurso}</p>
              <p className={ds.admin.kvLabel}>En Curso</p>
            </div>
            <div className="text-center">
              <p className={`${ds.admin.kvValueLg} ${ds.semantic.mutedText}`}>{stats.inscritos}</p>
              <p className={ds.admin.kvLabel}>Inscritos</p>
            </div>
            <div className="text-center">
              <p className={`${ds.admin.kvValueLg} ${ds.semantic.pendingText}`}>{stats.baja}</p>
              <p className={ds.admin.kvLabel}>Baja</p>
            </div>
            <div className="text-center">
              <p className={`${ds.admin.kvValueLg} ${stats.promedio > 0 ? gradeToneClass(stats.promedio) : ds.semantic.mutedText}`}>
                {stats.promedio > 0 ? stats.promedio.toFixed(1) : 'N/A'}
              </p>
              <p className={ds.admin.kvLabel}>Promedio</p>
            </div>
          </div>
        </div>

        {/* Enrollments List */}
        <div className={ds.admin.tableWrap}>
          <div className={`p-6 border-b border-outline-variant flex items-center justify-between`}>
            <h3 className={ds.page.sectionTitle}>Estudiantes Inscritos</h3>
            <button
              onClick={() => navigate(`/admin/enrollments/new?groupId=${id}`)}
              className={`${ds.btn.primary} flex items-center gap-2 text-sm`}
            >
              <Icon name="plus" className="w-4 h-4" />
              Nueva Inscripción
            </button>
          </div>

          {loadingEnrollments ? (
            <div className="p-6">
              <div className={`text-center ${ds.page.body}`}>Cargando inscripciones...</div>
            </div>
          ) : enrollments.length === 0 ? (
            <EmptyState
              title="No hay inscripciones"
              description="Este grupo no tiene estudiantes inscritos aún."
              action={
                <button
                  onClick={() => navigate(`/admin/enrollments/new?groupId=${id}`)}
                  className={`${ds.btn.primary} text-sm`}
                >
                  Crear Inscripción
                </button>
              }
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className={ds.admin.table}>
                  <thead className={ds.admin.thead}>
                    <tr>
                      <th className={ds.admin.th}>Estudiante</th>
                      <th className={ds.admin.th}>Matrícula</th>
                      <th className={ds.admin.th}>Estatus</th>
                      <th className={ds.admin.th}>Calificación Final</th>
                      <th className={ds.admin.th}>Asistencia</th>
                      <th className={ds.admin.th}>Fecha Inscripción</th>
                      <th className={`${ds.admin.th} text-right`}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody className={ds.admin.tbody}>
                    {enrollments.map((enrollment) => (
                      <tr key={enrollment.id} className={ds.admin.trHover}>
                        <td className={ds.admin.td}>
                          <div className={ds.admin.tdStrong}>
                            {enrollment.student?.nombre} {enrollment.student?.apellidoPaterno} {enrollment.student?.apellidoMaterno}
                          </div>
                          <div className={ds.admin.tdMeta}>
                            {enrollment.student?.carrera} - Semestre {enrollment.student?.semestre}
                          </div>
                        </td>
                        <td className={ds.admin.td}>
                          {enrollment.student?.matricula}
                        </td>
                        <td className={ds.admin.td}>
                          <Badge variant={getEnrollmentStatusBadgeVariant(enrollment.estatus)}>
                            {enrollment.estatus || 'N/A'}
                          </Badge>
                        </td>
                        <td className={ds.admin.td}>
                          {enrollment.calificacionFinal !== undefined && enrollment.calificacionFinal !== null ? (
                            <GradeDisplay grade={enrollment.calificacionFinal} />
                          ) : enrollment.calificacion !== undefined && enrollment.calificacion !== null ? (
                            <GradeDisplay grade={enrollment.calificacion} />
                          ) : (
                            <span className={ds.semantic.mutedText}>-</span>
                          )}
                        </td>
                        <td className={ds.admin.td}>
                          {enrollment.porcentajeAsistencia !== undefined ? (
                            <AttendanceDisplay
                              porcentaje={enrollment.porcentajeAsistencia}
                              asistencias={enrollment.asistencias ?? 0}
                              faltas={enrollment.faltas ?? 0}
                            />
                          ) : (
                            <span className={ds.semantic.mutedText}>-</span>
                          )}
                        </td>
                        <td className={ds.admin.tdMuted}>
                          {enrollment.fechaInscripcion
                            ? new Date(enrollment.fechaInscripcion).toLocaleDateString('es-MX')
                            : '-'}
                        </td>
                        <td className={`${ds.admin.td} text-right font-medium`}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/admin/enrollments/${enrollment.id}/edit`);
                            }}
                            className={ds.admin.actionLink}
                          >
                            <Icon name="edit" className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pagination && (
                <div className={ds.admin.paginationFooter}>
                  <div className={ds.admin.paginationText}>
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



