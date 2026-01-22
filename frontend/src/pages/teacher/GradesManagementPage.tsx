// Grades management page for TEACHER
// Allows teachers to view their groups and update student grades
import { useEffect, useState } from 'react';
import { Layout } from '../../components/layout/Layout';
import { groupsApi, enrollmentsApi, specialCoursesApi } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { Loader, ButtonLoader } from '../../components/ui';
import type { Group, Enrollment } from '../../types';

export const GradesManagementPage = () => {
  const { showToast } = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingGrade, setUpdatingGrade] = useState<string | null>(null);

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    if (selectedGroupId) {
      fetchEnrollmentsForGroup(selectedGroupId);
    } else {
      setEnrollments([]);
    }
  }, [selectedGroupId]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await groupsApi.getAll({
        page: 1,
        limit: 100,
        sortBy: 'nombre',
        sortOrder: 'asc',
      });
      setGroups(response.groups);
      // Auto-select first group if available
      if (response.groups.length > 0 && !selectedGroupId) {
        setSelectedGroupId(response.groups[0].id);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar los grupos');
      console.error('Error fetching groups:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollmentsForGroup = async (groupId: string) => {
    try {
      setLoadingEnrollments(true);
      setError(null);
      
      const response = await enrollmentsApi.getByGroup(groupId);
      setEnrollments(response.enrollments);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar las inscripciones');
      console.error('Error fetching enrollments:', err);
    } finally {
      setLoadingEnrollments(false);
    }
  };

  const handleUpdateGrade = async (enrollmentId: string, newGrade: number | null, enrollment?: Enrollment) => {
    if (newGrade !== null && (newGrade < 0 || newGrade > 100)) {
      const errorMessage = 'La calificación debe estar entre 0 y 100';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      return;
    }

    // Check if this is a special course (English course)
    const isSpecialCourse = (enrollment as any)?.isSpecialCourse === true;

    try {
      setUpdatingGrade(enrollmentId);
      setError(null);

      if (isSpecialCourse) {
        // Use special courses API for English courses
        if (newGrade === null) {
          showToast('La calificación es requerida para cursos de inglés', 'error');
          return;
        }
        await specialCoursesApi.completeCourse(enrollmentId, { calificacion: newGrade });
        showToast('Calificación del curso de inglés actualizada correctamente', 'success');
      } else {
        // Use regular enrollments API for regular courses
        await enrollmentsApi.update(enrollmentId, {
          calificacion: newGrade === null ? undefined : newGrade,
        });
        showToast('Calificación actualizada correctamente', 'success');
      }
      
      // Refresh enrollments
      if (selectedGroupId) {
        await fetchEnrollmentsForGroup(selectedGroupId);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Error al actualizar la calificación';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      console.error('Error updating grade:', err);
    } finally {
      setUpdatingGrade(null);
    }
  };

  const selectedGroup = groups.find(g => g.id === selectedGroupId);

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Calificaciones</h1>
          <p className="text-gray-600 mt-2">
            Selecciona un grupo para ver y actualizar las calificaciones de los estudiantes
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader variant="spinner" size="lg" text="Cargando grupos..." />
          </div>
        ) : groups.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 text-lg">No tienes grupos asignados</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Groups list */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-800">Mis Grupos</h2>
                </div>
                <div className="divide-y divide-gray-200">
                  {groups.map((group) => (
                    <button
                      key={group.id}
                      onClick={() => setSelectedGroupId(group.id)}
                      className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                        selectedGroupId === group.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                      }`}
                    >
                      <div className="font-medium text-gray-900">{group.nombre}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        {group.subject?.nombre}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Período: {group.periodo}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Enrollments list */}
            <div className="lg:col-span-2">
              {selectedGroup ? (
                <div className="bg-white rounded-lg shadow">
                  <div className="p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800">
                      Estudiantes - {selectedGroup.nombre}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedGroup.subject?.nombre} - {selectedGroup.periodo}
                    </p>
                  </div>

                  {loadingEnrollments ? (
                    <div className="flex justify-center items-center py-12">
                      <Loader variant="spinner" size="md" text="Cargando inscripciones..." />
                    </div>
                  ) : enrollments.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-gray-500">
                        No hay estudiantes inscritos en este grupo
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Matrícula
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Estudiante
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Calificación
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Acción
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {enrollments.map((enrollment) => (
                            <GradeRow
                              key={enrollment.id}
                              enrollment={enrollment}
                              onUpdate={(id, grade) => handleUpdateGrade(id, grade, enrollment)}
                              updating={updatingGrade === enrollment.id}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <p className="text-gray-500">Selecciona un grupo para ver los estudiantes</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

// Component for individual grade row
interface GradeRowProps {
  enrollment: Enrollment;
  onUpdate: (enrollmentId: string, grade: number | null) => Promise<void>;
  updating: boolean;
}

const GradeRow = ({ enrollment, onUpdate, updating }: GradeRowProps) => {
  const [editMode, setEditMode] = useState(false);
  const [gradeInput, setGradeInput] = useState<string>(
    enrollment.calificacion !== null && enrollment.calificacion !== undefined
      ? enrollment.calificacion.toString()
      : ''
  );

  const handleSave = async () => {
    const grade = gradeInput.trim() === '' ? null : parseFloat(gradeInput);
    if (grade !== null && (isNaN(grade) || grade < 0 || grade > 100)) {
      return;
    }
    await onUpdate(enrollment.id, grade);
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

  return (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {enrollment.student?.matricula || 'N/A'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {enrollment.student
          ? `${enrollment.student.nombre} ${enrollment.student.apellidoPaterno} ${enrollment.student.apellidoMaterno}`
          : 'N/A'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {editMode ? (
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={gradeInput}
              onChange={(e) => setGradeInput(e.target.value)}
              min={0}
              max={100}
              step={0.1}
              className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0-100"
            />
            <button
              onClick={handleSave}
              disabled={updating}
              className="text-green-600 hover:text-green-800 disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
            <button
              onClick={handleCancel}
              disabled={updating}
              className="text-red-600 hover:text-red-800 disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <span
            className={`font-semibold ${
              enrollment.calificacion !== null && enrollment.calificacion !== undefined
                ? enrollment.calificacion >= 70
                  ? 'text-green-600'
                  : enrollment.calificacion >= 60
                    ? 'text-yellow-600'
                    : 'text-red-600'
                : 'text-gray-400'
            }`}
          >
            {enrollment.calificacion !== null && enrollment.calificacion !== undefined
              ? enrollment.calificacion
              : 'Sin calificar'}
          </span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        {!editMode && (
          <button
            onClick={() => setEditMode(true)}
            disabled={updating}
            className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}
      </td>
    </tr>
  );
};

