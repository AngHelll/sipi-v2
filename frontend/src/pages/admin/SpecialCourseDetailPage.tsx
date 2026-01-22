// Special Course Detail Page - Admin can view and manage special course details
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { specialCoursesApi } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { PageLoader, Badge, Icon } from '../../components/ui';

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
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Nota:</strong> Este curso aún no ha sido calificado. El docente asignado al grupo debe registrar la calificación cuando el estudiante complete el curso.
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

