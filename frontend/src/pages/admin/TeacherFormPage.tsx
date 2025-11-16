// Teacher form page for creating/editing teachers with improved validation
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { teachersApi } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { FormField } from '../../components/ui/FormField';

export const TeacherFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [formErrors, setFormErrors] = useState<Record<string, string | null>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    nombre: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    departamento: '',
  });

  useEffect(() => {
    if (isEdit && id) {
      fetchTeacher();
    }
  }, [id, isEdit]);

  const fetchTeacher = async () => {
    try {
      setFetching(true);
      const teacher = await teachersApi.getById(id!);
      
      setFormData({
        username: '',
        password: '',
        confirmPassword: '',
        nombre: teacher.nombre,
        apellidoPaterno: teacher.apellidoPaterno,
        apellidoMaterno: teacher.apellidoMaterno,
        departamento: teacher.departamento,
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Error al cargar el maestro';
      showToast(errorMessage, 'error');
      console.error('Error fetching teacher:', err);
    } finally {
      setFetching(false);
    }
  };

  // Validation functions
  const validators = {
    username: (value: string | number): string | null => {
      if (!isEdit) {
        const str = String(value).trim();
        if (!str) return 'El nombre de usuario es requerido';
        if (str.length < 3) return 'El nombre de usuario debe tener al menos 3 caracteres';
        if (str.length > 50) return 'El nombre de usuario no puede exceder 50 caracteres';
        if (!/^[a-zA-Z0-9_]+$/.test(str)) return 'Solo se permiten letras, números y guiones bajos';
      }
      return null;
    },
    password: (value: string | number): string | null => {
      if (!isEdit) {
        const str = String(value);
        if (!str) return 'La contraseña es requerida';
        if (str.length < 6) return 'La contraseña debe tener al menos 6 caracteres';
      }
      return null;
    },
    confirmPassword: (value: string | number): string | null => {
      if (!isEdit) {
        const str = String(value);
        if (!str) return 'Debes confirmar la contraseña';
        if (str !== formData.password) return 'Las contraseñas no coinciden';
      }
      return null;
    },
    nombre: (value: string | number): string | null => {
      const str = String(value).trim();
      if (!str) return 'El nombre es requerido';
      if (str.length > 100) return 'El nombre no puede exceder 100 caracteres';
      if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(str)) return 'El nombre solo puede contener letras y espacios';
      return null;
    },
    apellidoPaterno: (value: string | number): string | null => {
      const str = String(value).trim();
      if (!str) return 'El apellido paterno es requerido';
      if (str.length > 100) return 'El apellido paterno no puede exceder 100 caracteres';
      if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(str)) return 'El apellido solo puede contener letras y espacios';
      return null;
    },
    apellidoMaterno: (value: string | number): string | null => {
      const str = String(value).trim();
      if (!str) return 'El apellido materno es requerido';
      if (str.length > 100) return 'El apellido materno no puede exceder 100 caracteres';
      if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(str)) return 'El apellido solo puede contener letras y espacios';
      return null;
    },
    departamento: (value: string | number): string | null => {
      const str = String(value).trim();
      if (!str) return 'El departamento es requerido';
      if (str.length > 100) return 'El departamento no puede exceder 100 caracteres';
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

    if (name === 'password' && touchedFields.confirmPassword) {
      const confirmError = validators.confirmPassword(formData.confirmPassword);
      setFormErrors((prev) => ({
        ...prev,
        confirmPassword: confirmError,
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
        await teachersApi.update(id, {
          nombre: formData.nombre,
          apellidoPaterno: formData.apellidoPaterno,
          apellidoMaterno: formData.apellidoMaterno,
          departamento: formData.departamento,
        });
        showToast('Maestro actualizado correctamente', 'success');
        setTimeout(() => {
          navigate('/admin/teachers');
        }, 1000);
      } else {
        await teachersApi.create({
          user: {
            username: formData.username,
            password: formData.password,
            role: 'TEACHER',
          },
          teacher: {
            nombre: formData.nombre,
            apellidoPaterno: formData.apellidoPaterno,
            apellidoMaterno: formData.apellidoMaterno,
            departamento: formData.departamento,
          },
        });
        showToast('Maestro creado correctamente', 'success');
        setTimeout(() => {
          navigate('/admin/teachers');
        }, 1000);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error ||
        `Error al ${isEdit ? 'actualizar' : 'crear'} el maestro`;
      showToast(errorMessage, 'error');
      console.error('Error saving teacher:', err);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
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
            {isEdit ? 'Editar Maestro' : 'Nuevo Maestro'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isEdit
              ? 'Modifica la información del maestro'
              : 'Completa el formulario para crear un nuevo maestro'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {!isEdit && (
              <>
                <div className="md:col-span-2">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
                    Información de Usuario
                  </h2>
                </div>
                <FormField
                  label="Nombre de Usuario"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="usuario123"
                  required
                  error={formErrors.username}
                  touched={touchedFields.username}
                  validate={validators.username}
                  helpText="Solo letras, números y guiones bajos. Mínimo 3 caracteres."
                />
                <FormField
                  label="Contraseña"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Mínimo 6 caracteres"
                  required
                  error={formErrors.password}
                  touched={touchedFields.password}
                  validate={validators.password}
                />
                <FormField
                  label="Confirmar Contraseña"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repite la contraseña"
                  required
                  error={formErrors.confirmPassword}
                  touched={touchedFields.confirmPassword}
                  validate={validators.confirmPassword}
                />
              </>
            )}

            <div className="md:col-span-2">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
                Información del Maestro
              </h2>
            </div>

            <FormField
              label="Nombre"
              name="nombre"
              type="text"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Carlos"
              required
              error={formErrors.nombre}
              touched={touchedFields.nombre}
              validate={validators.nombre}
            />

            <FormField
              label="Apellido Paterno"
              name="apellidoPaterno"
              type="text"
              value={formData.apellidoPaterno}
              onChange={handleChange}
              placeholder="García"
              required
              error={formErrors.apellidoPaterno}
              touched={touchedFields.apellidoPaterno}
              validate={validators.apellidoPaterno}
            />

            <FormField
              label="Apellido Materno"
              name="apellidoMaterno"
              type="text"
              value={formData.apellidoMaterno}
              onChange={handleChange}
              placeholder="Martínez"
              required
              error={formErrors.apellidoMaterno}
              touched={touchedFields.apellidoMaterno}
              validate={validators.apellidoMaterno}
            />

            <FormField
              label="Departamento"
              name="departamento"
              type="text"
              value={formData.departamento}
              onChange={handleChange}
              placeholder="Ingeniería Industrial"
              required
              error={formErrors.departamento}
              touched={touchedFields.departamento}
              validate={validators.departamento}
            />
          </div>

          <div className="mt-8 flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/admin/teachers')}
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
                  ? 'Actualizar Maestro'
                  : 'Crear Maestro'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};
