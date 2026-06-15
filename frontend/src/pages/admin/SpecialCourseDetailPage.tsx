// Special Course Detail Page - Admin can view and manage special course details
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { specialCoursesApi, groupsApi } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { PageLoader, Badge, Icon, FormField, ButtonLoader } from '../../components/ui';
import type { Group } from '../../types';

interface SpecialCourse {
  id: string;
  codigo: string;
  estatus: string;
  fechaInscripcion: string;
  observaciones: string | null;
  student: {
    id: string;
    matricula: string;
    nombre: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
  } | null;
  course: {
    courseType: string;
    nivelIngles: number | null;
    groupId: string | null;
    group: {
      id: string;
      nombre: string;
      periodo: string;
    } | null;
    calificacion: number | null;
    aprobado: boolean | null;
    fechaAprobacion: string | null;
    requierePago: boolean;
    pagoAprobado: boolean | null;
    fechaPagoAprobado: string | null;
    montoPago: number | null;
    fechaInicio: string | null;
  } | null;
}

export const SpecialCourseDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<SpecialCourse | null>(null);
  const [grading, setGrading] = useState(false);
  const [calificacion, setCalificacion] = useState('');
  const [savingGrade, setSavingGrade] = useState(false);
  // Asignación de grupo (lista de espera)
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [assignRequierePago, setAssignRequierePago] = useState(true);
  const [assigning, setAssigning] = useState(false);
  // Cancelación (admin)
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCourse();
    }
  }, [id]);

  const fetchCourse = async () => {
    if (!id) {
      showToast('ID de curso no válido', 'error');
      navigate('/admin/special-courses');
      return;
    }

    try {
      setLoading(true);
      const courseData = await specialCoursesApi.getById(id);
      
      if (!courseData) {
        showToast('Curso especial no encontrado', 'error');
        navigate('/admin/special-courses');
        return;
      }

      setCourse(courseData);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Error al cargar el curso especial';
      showToast(errorMessage, 'error');
      navigate('/admin/special-courses');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (estatus: string) => {
    const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default' }> = {
      INSCRITO: { label: 'Inscrito', variant: 'success' },
      EN_CURSO: { label: 'En Curso', variant: 'info' },
      PENDIENTE_PAGO: { label: 'Pendiente Pago', variant: 'warning' },
      PAGO_APROBADO: { label: 'Pago Aprobado', variant: 'info' },
      APROBADO: { label: 'Aprobado', variant: 'success' },
      REPROBADO: { label: 'Reprobado', variant: 'danger' },
      CANCELADO: { label: 'Cancelado', variant: 'default' },
      BAJA: { label: 'Baja', variant: 'danger' },
      LISTA_ESPERA: { label: 'Lista de Espera', variant: 'info' },
    };

    const config = statusConfig[estatus] || { label: estatus, variant: 'default' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getCourseTypeLabel = (courseType: string): string => {
    const labels: Record<string, string> = {
      INGLES: 'Inglés',
      VERANO: 'Verano',
      EXTRACURRICULAR: 'Extracurricular',
      TALLER: 'Taller',
      SEMINARIO: 'Seminario',
      DIPLOMADO: 'Diplomado',
      CERTIFICACION: 'Certificación',
    };
    return labels[courseType] || courseType;
  };

  // Carga grupos de inglés disponibles cuando la solicitud está en lista de espera
  useEffect(() => {
    if (course?.estatus === 'LISTA_ESPERA' && course.course?.courseType === 'INGLES') {
      groupsApi
        .getAvailableEnglishCourses()
        .then((result) => {
          const nivel = course.course?.nivelIngles;
          setAvailableGroups(
            nivel ? result.courses.filter((g) => g.nivelIngles === nivel) : result.courses
          );
        })
        .catch((err) => console.error('Error fetching available groups:', err));
    }
  }, [course]);

  const handleAssignGroup = async () => {
    if (!id || !selectedGroupId) {
      showToast('Selecciona un grupo', 'error');
      return;
    }
    try {
      setAssigning(true);
      const result = await specialCoursesApi.assignGroup(id, {
        groupId: selectedGroupId,
        requierePago: assignRequierePago,
      });
      showToast(result.message, 'success');
      setSelectedGroupId('');
      await fetchCourse();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Error al asignar el grupo', 'error');
    } finally {
      setAssigning(false);
    }
  };

  const handleCancelCourse = async () => {
    if (!id) return;
    const motivo = window.prompt('Motivo de la cancelación (requerido):');
    if (!motivo || !motivo.trim()) return;
    try {
      setCancelling(true);
      await specialCoursesApi.cancelCourse(id, { motivo: motivo.trim() });
      showToast('Solicitud cancelada', 'success');
      await fetchCourse();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Error al cancelar la solicitud', 'error');
    } finally {
      setCancelling(false);
    }
  };

  const handleSaveGrade = async () => {
    if (!id) return;
    const grade = parseFloat(calificacion);
    if (isNaN(grade) || grade < 0 || grade > 100) {
      showToast('La calificación debe estar entre 0 y 100', 'error');
      return;
    }
    try {
      setSavingGrade(true);
      await specialCoursesApi.completeCourse(id, { calificacion: grade });
      showToast('Calificación registrada correctamente', 'success');
      setGrading(false);
      setCalificacion('');
      await fetchCourse();
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Error al registrar la calificación';
      showToast(errorMessage, 'error');
    } finally {
      setSavingGrade(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Layout>
        <PageLoader text="Cargando curso especial..." />
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            Curso especial no encontrado
          </div>
        </div>
      </Layout>
    );
  }

  const canGradeCourse =
    ['INSCRITO', 'EN_CURSO'].includes(course.estatus) &&
    (course.course?.calificacion === null || course.course?.calificacion === undefined) &&
    (!course.course?.requierePago || course.course?.pagoAprobado === true);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin/special-courses')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <Icon name="arrow-left" size={20} />
            Volver a Cursos Especiales
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Detalles del Curso Especial</h1>
          <p className="text-gray-600">Información completa del curso especial</p>
        </div>

        {/* Course Information */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Información General</h2>
            {getStatusBadge(course.estatus)}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-500">Código</p>
              <p className="text-sm text-gray-900 mt-1">{course.codigo}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Tipo de Curso</p>
              <p className="text-sm text-gray-900 mt-1">
                {course.course ? getCourseTypeLabel(course.course.courseType) : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Fecha de Inscripción</p>
              <p className="text-sm text-gray-900 mt-1">{formatDate(course.fechaInscripcion)}</p>
            </div>
            {course.course?.nivelIngles && (
              <div>
                <p className="text-sm font-medium text-gray-500">Nivel de Inglés</p>
                <p className="text-sm text-gray-900 mt-1">Nivel {course.course.nivelIngles}</p>
              </div>
            )}
            {course.course?.fechaInicio && (
              <div>
                <p className="text-sm font-medium text-gray-500">Fecha de Inicio del Curso</p>
                <p className="text-sm text-gray-900 mt-1 font-semibold text-green-600">
                  {formatDate(course.course.fechaInicio)}
                </p>
              </div>
            )}
            {course.observaciones && (
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-gray-500">Observaciones</p>
                <p className="text-sm text-gray-900 mt-1">{course.observaciones}</p>
              </div>
            )}
          </div>
        </div>

        {/* Waitlist: assign group */}
        {course.estatus === 'LISTA_ESPERA' && (
          <div className="bg-indigo-50 rounded-lg shadow-md border border-indigo-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-indigo-900 mb-2">Solicitud en Lista de Espera</h2>
            <p className="text-sm text-indigo-800 mb-4">
              El alumno espera que se abra un grupo
              {course.course?.nivelIngles ? ` de nivel ${course.course.nivelIngles}` : ''}. 
              Asigna un grupo disponible o crea uno nuevo si hay suficiente demanda.
            </p>
            {availableGroups.length > 0 ? (
              <div className="space-y-4">
                <FormField
                  label="Grupo disponible"
                  name="assignGroupId"
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  as="select"
                  options={[
                    { value: '', label: 'Selecciona un grupo' },
                    ...availableGroups.map((g) => ({
                      value: g.id,
                      label: `${g.nombre} - Nivel ${g.nivelIngles || 'N/A'} (${(g.cupoMaximo || 0) - (g.cupoActual || 0)} cupos)`,
                    })),
                  ]}
                />
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={assignRequierePago}
                    onChange={(e) => setAssignRequierePago(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Requiere pago (el alumno deberá pagar para quedar inscrito)</span>
                </label>
                <button
                  onClick={handleAssignGroup}
                  disabled={!selectedGroupId || assigning}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {assigning ? <ButtonLoader /> : <Icon name="check" size={18} />}
                  Asignar Grupo
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <p className="text-sm text-indigo-800">
                  No hay grupos abiertos{course.course?.nivelIngles ? ` de nivel ${course.course.nivelIngles}` : ''} con cupo.
                </p>
                <button
                  onClick={() => navigate('/admin/groups/new')}
                  className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Crear grupo
                </button>
              </div>
            )}
          </div>
        )}

        {/* Student Information */}
        {course.student && (
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Información del Estudiante</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Nombre Completo</p>
                <p className="text-sm text-gray-900 mt-1">
                  {course.student.nombre} {course.student.apellidoPaterno} {course.student.apellidoMaterno}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Matrícula</p>
                <p className="text-sm text-gray-900 mt-1">{course.student.matricula}</p>
              </div>
            </div>
          </div>
        )}

        {/* Group Information */}
        {course.course?.group && (
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Información del Grupo</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Nombre del Grupo</p>
                <p className="text-sm text-gray-900 mt-1">{course.course.group.nombre}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Período</p>
                <p className="text-sm text-gray-900 mt-1">{course.course.group.periodo}</p>
              </div>
            </div>
          </div>
        )}

        {/* Payment Information */}
        {course.course?.requierePago && (
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Información de Pago</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Estado del Pago</p>
                <div className="mt-1">
                  {course.course.pagoAprobado === true ? (
                    <Badge variant="success">Aprobado</Badge>
                  ) : course.course.pagoAprobado === false ? (
                    <Badge variant="danger">Rechazado</Badge>
                  ) : (
                    <Badge variant="warning">Pendiente</Badge>
                  )}
                </div>
              </div>
              {course.course.montoPago && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Monto del Pago</p>
                  <p className="text-sm text-gray-900 mt-1 font-semibold">
                    ${course.course.montoPago.toFixed(2)}
                  </p>
                </div>
              )}
              {course.course.fechaPagoAprobado && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Fecha de Aprobación del Pago</p>
                  <p className="text-sm text-gray-900 mt-1">{formatDate(course.course.fechaPagoAprobado)}</p>
                </div>
              )}
            </div>
            {course.estatus === 'PENDIENTE_PAGO' && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => navigate('/admin/english/payment-approvals')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Icon name="check" size={20} />
                  Gestionar Pago
                </button>
              </div>
            )}
          </div>
        )}

        {/* Grade Information */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Calificación del Curso</h2>
          {course.course?.calificacion !== null && course.course?.calificacion !== undefined ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Calificación</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{course.course.calificacion}%</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Estado</p>
                <div className="mt-1">
                  {course.course.aprobado ? (
                    <Badge variant="success">Aprobado</Badge>
                  ) : (
                    <Badge variant="danger">Reprobado</Badge>
                  )}
                </div>
              </div>
              {course.course.fechaAprobacion && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Fecha de Aprobación</p>
                  <p className="text-sm text-gray-900 mt-1">{formatDate(course.course.fechaAprobacion)}</p>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Nota:</strong>{' '}
                  {canGradeCourse
                    ? 'Este curso aún no ha sido calificado. El docente asignado al grupo registra la calificación al completar el curso; como administrador también puedes registrarla aquí.'
                    : course.estatus === 'LISTA_ESPERA'
                    ? 'No se puede calificar: la solicitud está en lista de espera (sin grupo asignado).'
                    : course.estatus === 'PENDIENTE_PAGO'
                    ? 'No se puede calificar hasta que el pago sea aprobado.'
                    : course.course?.requierePago && course.course?.pagoAprobado !== true
                    ? 'No se puede calificar: el pago está pendiente o fue rechazado.'
                    : 'Este curso no está en un estado que permita calificación.'}
                </p>
              </div>
              {canGradeCourse && (
                grading ? (
                <div className="mt-4 flex items-end gap-3">
                  <div className="flex-1 max-w-xs">
                    <FormField
                      label="Calificación (0-100)"
                      name="calificacion"
                      type="number"
                      value={calificacion}
                      onChange={(e) => setCalificacion(e.target.value)}
                      min={0}
                      max={100}
                      step="0.1"
                      required
                    />
                  </div>
                  <button
                    onClick={handleSaveGrade}
                    disabled={savingGrade}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {savingGrade ? <ButtonLoader /> : <Icon name="check" size={18} />}
                    Guardar
                  </button>
                  <button
                    onClick={() => { setGrading(false); setCalificacion(''); }}
                    disabled={savingGrade}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setGrading(true)}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Icon name="edit" size={18} />
                  Registrar Calificación
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Admin: cancel request */}
        {['LISTA_ESPERA', 'PENDIENTE_PAGO', 'INSCRITO', 'EN_CURSO'].includes(course.estatus) && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleCancelCourse}
              disabled={cancelling}
              className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {cancelling ? <ButtonLoader /> : <Icon name="x" size={18} />}
              Cancelar Solicitud
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};

