// Enrollment form page for creating enrollments with improved validation
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { enrollmentsApi, studentsApi, groupsApi } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { FormField } from '../../components/ui/FormField';
import type { Student, Group } from '../../types';

export const EnrollmentFormPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string | null>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  // Options for dropdowns
  const [students, setStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    studentId: '',
    groupId: '',
    calificacion: '',
  });

  useEffect(() => {
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    try {
      setLoadingOptions(true);
      const [studentsRes, groupsRes] = await Promise.all([
        studentsApi.getAll({ limit: 100 }),
        groupsApi.getAll({ limit: 100 }),
      ]);
      setStudents(studentsRes.students);
      setGroups(groupsRes.groups);
    } catch (err: any) {
      showToast('Error al cargar las opciones', 'error');
      console.error('Error fetching options:', err);
    } finally {
      setLoadingOptions(false);
    }
  };

  // Validation functions
  const validators = {
    studentId: (value: string | number): string | null => {
      const str = String(value).trim();
      if (!str) return 'El estudiante es requerido';
      return null;
    },
    groupId: (value: string | number): string | null => {
      const str = String(value).trim();
      if (!str) return 'El grupo es requerido';
      return null;
    },
    calificacion: (value: string | number): string | null => {
      const str = String(value).trim();
      if (str && str.length > 0) {
        const num = parseFloat(str);
        if (isNaN(num)) return 'La calificación debe ser un número válido';
        if (num < 0 || num > 100) return 'La calificación debe estar entre 0 y 100';
        // Check decimal places (max 2)
        const decimalPlaces = (str.split('.')[1] || '').length;
        if (decimalPlaces > 2) return 'La calificación no puede tener más de 2 decimales';
      }
      return null;
    },
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setTouchedFields((prev) => ({
      ...prev,
      [name]: true,
    }));

    const validator = validators[name as keyof typeof validators];
    if (validator) {
      const error = validator(value);
      setFormErrors((prev) => ({
        ...prev,
        [name]: error,
      }));
    }
  };

  const validateAllFields = (): boolean => {
    const errors: Record<string, string | null> = {};
    let isValid = true;

    Object.keys(validators).forEach((key) => {
      const validator = validators[key as keyof typeof validators];
      const value = formData[key as keyof typeof formData];
      const error = validator(value);
      if (error) {
        errors[key] = error;
        isValid = false;
      }
    });

    setFormErrors(errors);
    setTouchedFields(
      Object.keys(validators).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {} as Record<string, boolean>)
    );

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateAllFields()) {
      showToast('Por favor corrige los errores en el formulario', 'error');
      return;
    }

    try {
      setLoading(true);

      await enrollmentsApi.create({
        studentId: formData.studentId,
        groupId: formData.groupId,
        calificacion: formData.calificacion ? parseFloat(formData.calificacion) : undefined,
      });

      showToast('Inscripción creada correctamente', 'success');
      setTimeout(() => {
        navigate('/admin/groups');
      }, 1000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error ||
        'Error al crear la inscripción';
      showToast(errorMessage, 'error');
      console.error('Error saving enrollment:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loadingOptions) {
    return (
      <Layout>
        <div className="p-6">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </Layout>
    );
  }

  const hasErrors = Object.values(formErrors).some((error) => error !== null);

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Nueva Inscripción</h1>
          <p className="text-gray-600 mt-2">
            Inscribe un estudiante en un grupo
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 max-w-2xl border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="Estudiante"
              name="studentId"
              value={formData.studentId}
              onChange={handleChange}
              required
              error={formErrors.studentId}
              touched={touchedFields.studentId}
              validate={validators.studentId}
              as="select"
              options={[
                { value: '', label: 'Selecciona un estudiante' },
                ...students.map((student) => ({
                  value: student.id,
                  label: `${student.matricula} - ${student.nombre} ${student.apellidoPaterno} ${student.apellidoMaterno}`,
                })),
              ]}
            />

            <FormField
              label="Grupo"
              name="groupId"
              value={formData.groupId}
              onChange={handleChange}
              required
              error={formErrors.groupId}
              touched={touchedFields.groupId}
              validate={validators.groupId}
              as="select"
              options={[
                { value: '', label: 'Selecciona un grupo' },
                ...groups.map((group) => ({
                  value: group.id,
                  label: `${group.nombre} - ${group.subject?.nombre || 'N/A'} (${group.periodo})`,
                })),
              ]}
            />

            <FormField
              label="Calificación"
              name="calificacion"
              type="number"
              value={formData.calificacion}
              onChange={handleChange}
              placeholder="0-100"
              min={0}
              max={100}
              step={0.01}
              error={formErrors.calificacion}
              touched={touchedFields.calificacion}
              validate={validators.calificacion}
              helpText="Opcional. Puede dejarse vacío y asignarse después. Máximo 2 decimales."
            />
          </div>

          <div className="mt-8 flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/admin/groups')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || hasErrors}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Guardando...' : 'Crear Inscripción'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};
