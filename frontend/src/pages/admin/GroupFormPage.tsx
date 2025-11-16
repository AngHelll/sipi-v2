// Group form page for creating/editing groups with improved validation
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { groupsApi, subjectsApi, teachersApi } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { FormField } from '../../components/ui/FormField';
import type { Subject, Teacher } from '../../types';

export const GroupFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [formErrors, setFormErrors] = useState<Record<string, string | null>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  // Options for dropdowns
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    subjectId: '',
    teacherId: '',
    nombre: '',
    periodo: '',
  });

  useEffect(() => {
    fetchOptions();
    if (isEdit && id) {
      fetchGroup();
    }
  }, [id, isEdit]);

  const fetchOptions = async () => {
    try {
      setLoadingOptions(true);
      const [subjectsRes, teachersRes] = await Promise.all([
        subjectsApi.getAll({ limit: 100 }),
        teachersApi.getAll({ limit: 100 }),
      ]);
      setSubjects(subjectsRes.subjects);
      setTeachers(teachersRes.teachers);
    } catch (err: any) {
      showToast('Error al cargar las opciones', 'error');
      console.error('Error fetching options:', err);
    } finally {
      setLoadingOptions(false);
    }
  };

  const fetchGroup = async () => {
    try {
      setFetching(true);
      const group = await groupsApi.getById(id!);
      
      setFormData({
        subjectId: group.subjectId,
        teacherId: group.teacherId,
        nombre: group.nombre,
        periodo: group.periodo,
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Error al cargar el grupo';
      showToast(errorMessage, 'error');
      console.error('Error fetching group:', err);
    } finally {
      setFetching(false);
    }
  };

  // Validation functions
  const validators = {
    subjectId: (value: string | number): string | null => {
      const str = String(value).trim();
      if (!str) return 'La materia es requerida';
      return null;
    },
    teacherId: (value: string | number): string | null => {
      const str = String(value).trim();
      if (!str) return 'El maestro es requerido';
      return null;
    },
    nombre: (value: string | number): string | null => {
      const str = String(value).trim();
      if (!str) return 'El nombre del grupo es requerido';
      if (str.length > 50) return 'El nombre no puede exceder 50 caracteres';
      return null;
    },
    periodo: (value: string | number): string | null => {
      const str = String(value).trim();
      if (!str) return 'El período es requerido';
      if (str.length > 10) return 'El período no puede exceder 10 caracteres';
      // Validate formato: YYYY-N (e.g., 2024-1, 2024-2)
      if (!/^\d{4}-[12]$/.test(str)) {
        return 'Formato inválido. Use: Año-Período (ej: 2024-1, 2024-2)';
      }
      return null;
    },
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
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

      if (isEdit && id) {
        await groupsApi.update(id, {
          nombre: formData.nombre,
          periodo: formData.periodo,
          subjectId: formData.subjectId,
          teacherId: formData.teacherId,
        });
        showToast('Grupo actualizado correctamente', 'success');
        setTimeout(() => {
          navigate('/admin/groups');
        }, 1000);
      } else {
        await groupsApi.create({
          subjectId: formData.subjectId,
          teacherId: formData.teacherId,
          nombre: formData.nombre,
          periodo: formData.periodo,
        });
        showToast('Grupo creado correctamente', 'success');
        setTimeout(() => {
          navigate('/admin/groups');
        }, 1000);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error ||
        `Error al ${isEdit ? 'actualizar' : 'crear'} el grupo`;
      showToast(errorMessage, 'error');
      console.error('Error saving group:', err);
    } finally {
      setLoading(false);
    }
  };

  if (fetching || loadingOptions) {
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
          <h1 className="text-3xl font-bold text-gray-900">
            {isEdit ? 'Editar Grupo' : 'Nuevo Grupo'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isEdit
              ? 'Modifica la información del grupo'
              : 'Completa el formulario para crear un nuevo grupo'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 max-w-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="Materia"
              name="subjectId"
              value={formData.subjectId}
              onChange={handleChange}
              required
              error={formErrors.subjectId}
              touched={touchedFields.subjectId}
              validate={validators.subjectId}
              as="select"
              options={[
                { value: '', label: 'Selecciona una materia' },
                ...subjects.map((subject) => ({
                  value: subject.id,
                  label: `${subject.clave} - ${subject.nombre}`,
                })),
              ]}
            />

            <FormField
              label="Maestro"
              name="teacherId"
              value={formData.teacherId}
              onChange={handleChange}
              required
              error={formErrors.teacherId}
              touched={touchedFields.teacherId}
              validate={validators.teacherId}
              as="select"
              options={[
                { value: '', label: 'Selecciona un maestro' },
                ...teachers.map((teacher) => ({
                  value: teacher.id,
                  label: `${teacher.nombre} ${teacher.apellidoPaterno} ${teacher.apellidoMaterno}`,
                })),
              ]}
            />

            <FormField
              label="Nombre del Grupo"
              name="nombre"
              type="text"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Grupo A"
              required
              error={formErrors.nombre}
              touched={touchedFields.nombre}
              validate={validators.nombre}
              maxLength={50}
            />

            <FormField
              label="Período"
              name="periodo"
              type="text"
              value={formData.periodo}
              onChange={handleChange}
              placeholder="2024-1"
              required
              error={formErrors.periodo}
              touched={touchedFields.periodo}
              validate={validators.periodo}
              helpText="Formato: Año-Período (ej: 2024-1, 2024-2)"
              maxLength={10}
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
              {loading
                ? 'Guardando...'
                : isEdit
                  ? 'Actualizar Grupo'
                  : 'Crear Grupo'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};
