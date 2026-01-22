// Teacher form page for creating/editing teachers with improved validation
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { teachersApi } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { FormField, StatusSelector, PageLoader, ButtonLoader } from '../../components/ui';

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
    // Contact information
    email: '',
    telefono: '',
    // Personal information
    fechaNacimiento: '',
    genero: '' as '' | 'MASCULINO' | 'FEMENINO' | 'OTRO' | 'PREFIERO_NO_DECIR',
    nacionalidad: '',
    direccion: '',
    ciudad: '',
    estado: '',
    codigoPostal: '',
    pais: 'México',
    // Academic information
    gradoAcademico: '',
    especialidad: '',
    cedulaProfesional: '',
    universidad: '',
    // Employment information
    tipoContrato: 'TIEMPO_COMPLETO' as 'TIEMPO_COMPLETO' | 'MEDIO_TIEMPO' | 'POR_HONORARIOS' | 'INTERINO',
    fechaContratacion: '',
    estatus: 'ACTIVO' as 'ACTIVO' | 'INACTIVO' | 'JUBILADO' | 'LICENCIA',
    salario: '',
    observaciones: '',
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
        // Contact information
        email: teacher.email || '',
        telefono: teacher.telefono || '',
        // Personal information
        fechaNacimiento: teacher.fechaNacimiento ? teacher.fechaNacimiento.split('T')[0] : '',
        genero: (teacher.genero || '') as '' | 'MASCULINO' | 'FEMENINO' | 'OTRO' | 'PREFIERO_NO_DECIR',
        nacionalidad: teacher.nacionalidad || '',
        direccion: teacher.direccion || '',
        ciudad: teacher.ciudad || '',
        estado: teacher.estado || '',
        codigoPostal: teacher.codigoPostal || '',
        pais: teacher.pais || 'México',
        // Academic information
        gradoAcademico: teacher.gradoAcademico || '',
        especialidad: teacher.especialidad || '',
        cedulaProfesional: teacher.cedulaProfesional || '',
        universidad: teacher.universidad || '',
        // Employment information
        tipoContrato: (teacher.tipoContrato || 'TIEMPO_COMPLETO') as 'TIEMPO_COMPLETO' | 'MEDIO_TIEMPO' | 'POR_HONORARIOS' | 'INTERINO',
        fechaContratacion: teacher.fechaContratacion ? teacher.fechaContratacion.split('T')[0] : '',
        estatus: (teacher.estatus || 'ACTIVO') as 'ACTIVO' | 'INACTIVO' | 'JUBILADO' | 'LICENCIA',
        salario: teacher.salario?.toString() || '',
        observaciones: teacher.observaciones || '',
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
    email: (value: string | number): string | null => {
      const str = String(value).trim();
      if (str && str.length > 0) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(str)) return 'El formato del email no es válido';
        if (str.length > 255) return 'El email no puede exceder 255 caracteres';
      }
      return null;
    },
    telefono: (value: string | number): string | null => {
      const str = String(value).trim();
      if (str && str.length > 0) {
        const digitsOnly = str.replace(/[\s\-\(\)]/g, '');
        if (digitsOnly.length < 10 || digitsOnly.length > 12) {
          return 'El teléfono debe tener entre 10 y 12 dígitos';
        }
        if (!/^[\d\s\-\(\)\+]+$/.test(str)) {
          return 'El teléfono solo puede contener números, espacios, guiones y paréntesis';
        }
      }
      return null;
    },
    fechaContratacion: (value: string | number): string | null => {
      const str = String(value).trim();
      if (str && str.length > 0) {
        const date = new Date(str);
        if (isNaN(date.getTime())) return 'La fecha de contratación no es válida';
        const today = new Date();
        const maxDate = new Date(today.getFullYear() + 1, 11, 31);
        if (date > maxDate) return 'La fecha de contratación no puede ser más de un año en el futuro';
        if (date < new Date(1980, 0, 1)) return 'La fecha de contratación no puede ser anterior a 1980';
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
          // Contact information
          email: formData.email || undefined,
          telefono: formData.telefono || undefined,
          // Personal information
          fechaNacimiento: formData.fechaNacimiento ? new Date(formData.fechaNacimiento) : undefined,
          genero: formData.genero === '' ? undefined : formData.genero,
          nacionalidad: formData.nacionalidad || undefined,
          direccion: formData.direccion || undefined,
          ciudad: formData.ciudad || undefined,
          estado: formData.estado || undefined,
          codigoPostal: formData.codigoPostal || undefined,
          pais: formData.pais || undefined,
          // Academic information
          gradoAcademico: formData.gradoAcademico || undefined,
          especialidad: formData.especialidad || undefined,
          cedulaProfesional: formData.cedulaProfesional || undefined,
          universidad: formData.universidad || undefined,
          // Employment information
          tipoContrato: formData.tipoContrato,
          fechaContratacion: formData.fechaContratacion ? new Date(formData.fechaContratacion) : undefined,
          estatus: formData.estatus,
          salario: formData.salario ? parseFloat(formData.salario) : undefined,
          observaciones: formData.observaciones || undefined,
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
            email: formData.email || undefined,
            telefono: formData.telefono || undefined,
          },
          teacher: {
            nombre: formData.nombre,
            apellidoPaterno: formData.apellidoPaterno,
            apellidoMaterno: formData.apellidoMaterno,
            departamento: formData.departamento,
            email: formData.email || undefined,
            telefono: formData.telefono || undefined,
            fechaNacimiento: formData.fechaNacimiento ? new Date(formData.fechaNacimiento) : undefined,
            genero: formData.genero === '' ? undefined : formData.genero,
            nacionalidad: formData.nacionalidad || undefined,
            direccion: formData.direccion || undefined,
            ciudad: formData.ciudad || undefined,
            estado: formData.estado || undefined,
            codigoPostal: formData.codigoPostal || undefined,
            pais: formData.pais || undefined,
            gradoAcademico: formData.gradoAcademico || undefined,
            especialidad: formData.especialidad || undefined,
            cedulaProfesional: formData.cedulaProfesional || undefined,
            universidad: formData.universidad || undefined,
            tipoContrato: formData.tipoContrato,
            fechaContratacion: formData.fechaContratacion ? new Date(formData.fechaContratacion) : undefined,
            estatus: formData.estatus,
            salario: formData.salario ? parseFloat(formData.salario) : undefined,
            observaciones: formData.observaciones || undefined,
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
        <PageLoader text="Cargando profesor..." />
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

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 border border-gray-200">
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

            {/* Contact Information Section */}
            <div className="md:col-span-2">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2 mt-6">
                Información de Contacto
              </h2>
            </div>

            <FormField
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="maestro@ejemplo.com"
              error={formErrors.email}
              touched={touchedFields.email}
            />

            <FormField
              label="Teléfono"
              name="telefono"
              type="tel"
              value={formData.telefono}
              onChange={handleChange}
              placeholder="5551234567"
              maxLength={20}
              error={formErrors.telefono}
              touched={touchedFields.telefono}
            />

            {/* Personal Information Section */}
            <div className="md:col-span-2">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2 mt-6">
                Información Personal
              </h2>
            </div>

            <FormField
              label="Fecha de Nacimiento"
              name="fechaNacimiento"
              type="date"
              value={formData.fechaNacimiento}
              onChange={handleChange}
              error={formErrors.fechaNacimiento}
              touched={touchedFields.fechaNacimiento}
            />

            <FormField
              label="Género"
              name="genero"
              value={formData.genero}
              onChange={handleChange}
              error={formErrors.genero}
              touched={touchedFields.genero}
              as="select"
              options={[
                { value: '', label: 'Selecciona...' },
                { value: 'MASCULINO', label: 'MASCULINO' },
                { value: 'FEMENINO', label: 'FEMENINO' },
                { value: 'OTRO', label: 'OTRO' },
                { value: 'PREFIERO_NO_DECIR', label: 'PREFIERO NO DECIR' },
              ]}
            />

            <FormField
              label="Nacionalidad"
              name="nacionalidad"
              type="text"
              value={formData.nacionalidad}
              onChange={handleChange}
              placeholder="Mexicana"
              maxLength={50}
              error={formErrors.nacionalidad}
              touched={touchedFields.nacionalidad}
            />

            <FormField
              label="Dirección"
              name="direccion"
              type="text"
              value={formData.direccion}
              onChange={handleChange}
              placeholder="Calle y número"
              maxLength={500}
              error={formErrors.direccion}
              touched={touchedFields.direccion}
            />

            <FormField
              label="Ciudad"
              name="ciudad"
              type="text"
              value={formData.ciudad}
              onChange={handleChange}
              placeholder="Ciudad"
              maxLength={100}
              error={formErrors.ciudad}
              touched={touchedFields.ciudad}
            />

            <FormField
              label="Estado"
              name="estado"
              type="text"
              value={formData.estado}
              onChange={handleChange}
              placeholder="Estado"
              maxLength={100}
              error={formErrors.estado}
              touched={touchedFields.estado}
            />

            <FormField
              label="Código Postal"
              name="codigoPostal"
              type="text"
              value={formData.codigoPostal}
              onChange={handleChange}
              placeholder="12345"
              maxLength={10}
              error={formErrors.codigoPostal}
              touched={touchedFields.codigoPostal}
            />

            <FormField
              label="País"
              name="pais"
              type="text"
              value={formData.pais}
              onChange={handleChange}
              placeholder="México"
              maxLength={50}
              error={formErrors.pais}
              touched={touchedFields.pais}
            />

            {/* Academic Information Section */}
            <div className="md:col-span-2">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2 mt-6">
                Información Académica
              </h2>
            </div>

            <FormField
              label="Grado Académico"
              name="gradoAcademico"
              type="text"
              value={formData.gradoAcademico}
              onChange={handleChange}
              placeholder="Ej: Licenciatura, Maestría, Doctorado"
              maxLength={100}
              error={formErrors.gradoAcademico}
              touched={touchedFields.gradoAcademico}
            />

            <FormField
              label="Especialidad"
              name="especialidad"
              type="text"
              value={formData.especialidad}
              onChange={handleChange}
              placeholder="Área de especialización"
              maxLength={200}
              error={formErrors.especialidad}
              touched={touchedFields.especialidad}
            />

            <FormField
              label="Cédula Profesional"
              name="cedulaProfesional"
              type="text"
              value={formData.cedulaProfesional}
              onChange={handleChange}
              placeholder="Número de cédula"
              maxLength={50}
              error={formErrors.cedulaProfesional}
              touched={touchedFields.cedulaProfesional}
            />

            <FormField
              label="Universidad de Egreso"
              name="universidad"
              type="text"
              value={formData.universidad}
              onChange={handleChange}
              placeholder="Nombre de la universidad"
              maxLength={200}
              error={formErrors.universidad}
              touched={touchedFields.universidad}
            />

            {/* Employment Information Section */}
            <div className="md:col-span-2">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2 mt-6">
                Información Laboral
              </h2>
            </div>

            <FormField
              label="Tipo de Contrato"
              name="tipoContrato"
              value={formData.tipoContrato}
              onChange={handleChange}
              required
              error={formErrors.tipoContrato}
              touched={touchedFields.tipoContrato}
              as="select"
              options={[
                { value: 'TIEMPO_COMPLETO', label: 'TIEMPO COMPLETO' },
                { value: 'MEDIO_TIEMPO', label: 'MEDIO TIEMPO' },
                { value: 'POR_HONORARIOS', label: 'POR HONORARIOS' },
                { value: 'INTERINO', label: 'INTERINO' },
              ]}
            />

            <FormField
              label="Fecha de Contratación"
              name="fechaContratacion"
              type="date"
              value={formData.fechaContratacion}
              onChange={handleChange}
              error={formErrors.fechaContratacion}
              touched={touchedFields.fechaContratacion}
            />

            <StatusSelector
              type="teacher"
              value={formData.estatus}
              onChange={(value) => {
                handleChange({
                  target: { name: 'estatus', value },
                } as React.ChangeEvent<HTMLInputElement>);
              }}
              required
              error={formErrors.estatus}
              touched={touchedFields.estatus}
            />

            <FormField
              label="Salario"
              name="salario"
              type="number"
              value={formData.salario}
              onChange={handleChange}
              placeholder="0.00"
              min={0}
              step="0.01"
              error={formErrors.salario}
              touched={touchedFields.salario}
            />

            <div className="md:col-span-2">
              <FormField
                label="Observaciones"
                name="observaciones"
                value={formData.observaciones}
                onChange={handleChange}
                as="textarea"
                rows={4}
                placeholder="Observaciones adicionales..."
                error={formErrors.observaciones}
                touched={touchedFields.observaciones}
              />
            </div>
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
              {loading ? (
                <>
                  <ButtonLoader className="mr-2" />
                  Guardando...
                </>
              ) : isEdit ? (
                'Actualizar Maestro'
              ) : (
                'Crear Maestro'
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};
