// Student form page for creating/editing students with improved validation
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { studentsApi } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { FormField } from '../../components/ui/FormField';

export const StudentFormPage = () => {
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
    // User fields
    username: '',
    password: '',
    confirmPassword: '',
    // Student fields
    matricula: '',
    nombre: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    carrera: '',
    semestre: 1,
    estatus: 'ACTIVO' as 'ACTIVO' | 'INACTIVO' | 'EGRESADO',
    curp: '',
  });

  // Fetch student data if editing
  useEffect(() => {
    if (isEdit && id) {
      fetchStudent();
    }
  }, [id, isEdit]);

  const fetchStudent = async () => {
    try {
      setFetching(true);
      const student = await studentsApi.getById(id!);
      
      setFormData({
        username: '',
        password: '',
        confirmPassword: '',
        matricula: student.matricula,
        nombre: student.nombre,
        apellidoPaterno: student.apellidoPaterno,
        apellidoMaterno: student.apellidoMaterno,
        carrera: student.carrera,
        semestre: student.semestre,
        estatus: student.estatus,
        curp: student.curp || '',
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Error al cargar el estudiante';
      showToast(errorMessage, 'error');
      console.error('Error fetching student:', err);
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
        if (str.length > 100) return 'La contraseña es demasiado larga';
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
    matricula: (value: string | number): string | null => {
      const str = String(value).trim();
      if (!str) return 'La matrícula es requerida';
      if (str.length > 20) return 'La matrícula no puede exceder 20 caracteres';
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
    carrera: (value: string | number): string | null => {
      const str = String(value).trim();
      if (!str) return 'La carrera es requerida';
      if (str.length > 100) return 'La carrera no puede exceder 100 caracteres';
      return null;
    },
    semestre: (value: string | number): string | null => {
      const num = typeof value === 'number' ? value : parseInt(String(value), 10);
      if (isNaN(num)) return 'El semestre debe ser un número válido';
      if (num < 1 || num > 12) return 'El semestre debe estar entre 1 y 12';
      return null;
    },
    curp: (value: string | number): string | null => {
      const str = String(value).trim();
      if (str && str.length > 0) {
        if (str.length !== 18) return 'El CURP debe tener exactamente 18 caracteres';
        if (!/^[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[0-9A-Z][0-9]$/.test(str.toUpperCase())) {
          return 'El formato del CURP no es válido';
        }
      }
      return null;
    },
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const newValue = name === 'semestre' ? parseInt(value, 10) || 0 : value;
    
    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    // Mark field as touched
    setTouchedFields((prev) => ({
      ...prev,
      [name]: true,
    }));

    // Validate field in real-time
    const validator = validators[name as keyof typeof validators];
    if (validator) {
      const error = validator(newValue);
      setFormErrors((prev) => ({
        ...prev,
        [name]: error,
      }));
    }

    // Special handling for confirmPassword
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
        await studentsApi.update(id, {
          nombre: formData.nombre,
          apellidoPaterno: formData.apellidoPaterno,
          apellidoMaterno: formData.apellidoMaterno,
          carrera: formData.carrera,
          semestre: formData.semestre,
          estatus: formData.estatus,
          curp: formData.curp || undefined,
        });
        showToast('Estudiante actualizado correctamente', 'success');
        setTimeout(() => {
          navigate('/admin/students');
        }, 1000);
      } else {
        await studentsApi.create({
          user: {
            username: formData.username,
            password: formData.password,
            role: 'STUDENT',
          },
          student: {
            matricula: formData.matricula,
            nombre: formData.nombre,
            apellidoPaterno: formData.apellidoPaterno,
            apellidoMaterno: formData.apellidoMaterno,
            carrera: formData.carrera,
            semestre: formData.semestre,
            estatus: formData.estatus,
            curp: formData.curp || undefined,
          },
        });
        showToast('Estudiante creado correctamente', 'success');
        setTimeout(() => {
          navigate('/admin/students');
        }, 1000);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error ||
        `Error al ${isEdit ? 'actualizar' : 'crear'} el estudiante`;
      showToast(errorMessage, 'error');
      console.error('Error saving student:', err);
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
            {isEdit ? 'Editar Estudiante' : 'Nuevo Estudiante'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isEdit
              ? 'Modifica la información del estudiante'
              : 'Completa el formulario para crear un nuevo estudiante'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User fields (only for new students) */}
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

            {/* Student fields */}
            <div className="md:col-span-2">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
                Información del Estudiante
              </h2>
            </div>

            <FormField
              label="Matrícula"
              name="matricula"
              type="text"
              value={formData.matricula}
              onChange={handleChange}
              placeholder="2024001"
              required
              disabled={isEdit}
              error={formErrors.matricula}
              touched={touchedFields.matricula}
              validate={validators.matricula}
              helpText={isEdit ? 'La matrícula no se puede modificar' : 'Máximo 20 caracteres'}
            />

            <FormField
              label="Nombre"
              name="nombre"
              type="text"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Juan"
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
              placeholder="López"
              required
              error={formErrors.apellidoMaterno}
              touched={touchedFields.apellidoMaterno}
              validate={validators.apellidoMaterno}
            />

            <FormField
              label="Carrera"
              name="carrera"
              type="text"
              value={formData.carrera}
              onChange={handleChange}
              placeholder="Ingeniería Industrial"
              required
              error={formErrors.carrera}
              touched={touchedFields.carrera}
              validate={validators.carrera}
            />

            <FormField
              label="Semestre"
              name="semestre"
              type="number"
              value={formData.semestre}
              onChange={handleChange}
              required
              min={1}
              max={12}
              error={formErrors.semestre}
              touched={touchedFields.semestre}
              validate={validators.semestre}
              helpText="Entre 1 y 12"
            />

            <FormField
              label="Estatus"
              name="estatus"
              value={formData.estatus}
              onChange={handleChange}
              required
              error={formErrors.estatus}
              touched={touchedFields.estatus}
              as="select"
              options={[
                { value: 'ACTIVO', label: 'ACTIVO' },
                { value: 'INACTIVO', label: 'INACTIVO' },
                { value: 'EGRESADO', label: 'EGRESADO' },
              ]}
            />

            <FormField
              label="CURP"
              name="curp"
              type="text"
              value={formData.curp}
              onChange={handleChange}
              placeholder="ABCD123456EFGH78"
              maxLength={18}
              error={formErrors.curp}
              touched={touchedFields.curp}
              validate={validators.curp}
              helpText="18 caracteres. Formato: 4 letras, 6 números, 1 letra, 5 letras, 1 alfanumérico, 1 número"
            />
          </div>

          <div className="mt-8 flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/admin/students')}
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
                  ? 'Actualizar Estudiante'
                  : 'Crear Estudiante'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};
