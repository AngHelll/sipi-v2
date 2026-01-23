// Student form page for creating/editing students with improved validation
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { studentsApi } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { FormField, StatusSelector, CareerSelector, PageLoader, ButtonLoader } from '../../components/ui';

export const StudentFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [formErrors, setFormErrors] = useState<Record<string, string | null>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [student, setStudent] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    // User fields
    username: '',
    password: '',
    confirmPassword: '',
    // Student basic fields
    matricula: '',
    nombre: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    carrera: '',
    semestre: 1,
    estatus: 'ACTIVO' as 'ACTIVO' | 'INACTIVO' | 'EGRESADO',
    curp: '',
    // Contact information
    email: '',
    telefono: '',
    telefonoEmergencia: '',
    // Personal information
    fechaNacimiento: '',
    genero: '' as '' | 'MASCULINO' | 'FEMENINO' | 'OTRO' | 'PREFIERO_NO_DECIR',
    nacionalidad: '',
    lugarNacimiento: '',
    direccion: '',
    ciudad: '',
    estado: '',
    codigoPostal: '',
    pais: 'México',
    // Academic information
    tipoIngreso: 'NUEVO_INGRESO' as 'NUEVO_INGRESO' | 'REINGRESO' | 'TRANSFERENCIA' | 'EQUIVALENCIA',
    fechaIngreso: '',
    fechaEgreso: '',
    promedioGeneral: '',
    creditosCursados: 0,
    creditosAprobados: 0,
    creditosTotales: '',
    // Administrative information
    beca: false,
    tipoBeca: '',
    observaciones: '',
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
      const studentData = await studentsApi.getById(id!);
      setStudent(studentData);
      
      setFormData({
        username: '',
        password: '',
        confirmPassword: '',
        matricula: studentData.matricula,
        nombre: studentData.nombre,
        apellidoPaterno: studentData.apellidoPaterno,
        apellidoMaterno: studentData.apellidoMaterno,
        carrera: studentData.carrera,
        semestre: studentData.semestre,
        estatus: studentData.estatus as 'ACTIVO' | 'INACTIVO' | 'EGRESADO',
        curp: studentData.curp || '',
        // Contact information
        email: studentData.email || '',
        telefono: studentData.telefono || '',
        telefonoEmergencia: studentData.telefonoEmergencia || '',
        // Personal information
        fechaNacimiento: studentData.fechaNacimiento ? studentData.fechaNacimiento.split('T')[0] : '',
        genero: (studentData.genero || '') as '' | 'MASCULINO' | 'FEMENINO' | 'OTRO' | 'PREFIERO_NO_DECIR',
        nacionalidad: studentData.nacionalidad || '',
        lugarNacimiento: studentData.lugarNacimiento || '',
        direccion: studentData.direccion || '',
        ciudad: studentData.ciudad || '',
        estado: studentData.estado || '',
        codigoPostal: studentData.codigoPostal || '',
        pais: studentData.pais || 'México',
        // Academic information
        tipoIngreso: (studentData.tipoIngreso || 'NUEVO_INGRESO') as 'NUEVO_INGRESO' | 'REINGRESO' | 'TRANSFERENCIA' | 'EQUIVALENCIA',
        fechaIngreso: studentData.fechaIngreso ? studentData.fechaIngreso.split('T')[0] : '',
        fechaEgreso: studentData.fechaEgreso ? studentData.fechaEgreso.split('T')[0] : '',
        promedioGeneral: studentData.promedioGeneral?.toString() || '',
        creditosCursados: studentData.creditosCursados || 0,
        creditosAprobados: studentData.creditosAprobados || 0,
        creditosTotales: studentData.creditosTotales?.toString() || '',
        // Administrative information
        beca: studentData.beca || false,
        tipoBeca: studentData.tipoBeca || '',
        observaciones: studentData.observaciones || '',
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
        // Validar formato mexicano: 10 dígitos, puede empezar con 55
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
    telefonoEmergencia: (value: string | number): string | null => {
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
    fechaNacimiento: (value: string | number): string | null => {
      const str = String(value).trim();
      if (str && str.length > 0) {
        const date = new Date(str);
        if (isNaN(date.getTime())) return 'La fecha de nacimiento no es válida';
        const today = new Date();
        const age = today.getFullYear() - date.getFullYear();
        if (age < 15 || age > 100) return 'La fecha de nacimiento debe ser razonable (edad entre 15 y 100 años)';
        if (date > today) return 'La fecha de nacimiento no puede ser futura';
      }
      return null;
    },
    fechaIngreso: (value: string | number): string | null => {
      const str = String(value).trim();
      if (str && str.length > 0) {
        const date = new Date(str);
        if (isNaN(date.getTime())) return 'La fecha de ingreso no es válida';
        const today = new Date();
        const maxDate = new Date(today.getFullYear() + 1, 11, 31);
        if (date > maxDate) return 'La fecha de ingreso no puede ser más de un año en el futuro';
        if (date < new Date(2000, 0, 1)) return 'La fecha de ingreso no puede ser anterior a 2000';
      }
      return null;
    },
    fechaEgreso: (value: string | number): string | null => {
      const str = String(value).trim();
      if (str && str.length > 0) {
        const date = new Date(str);
        if (isNaN(date.getTime())) return 'La fecha de egreso no es válida';
        const fechaIngreso = formData.fechaIngreso ? new Date(formData.fechaIngreso) : null;
        if (fechaIngreso && date < fechaIngreso) {
          return 'La fecha de egreso no puede ser anterior a la fecha de ingreso';
        }
      }
      return null;
    },
    promedioGeneral: (value: string | number): string | null => {
      const str = String(value).trim();
      if (str && str.length > 0) {
        const num = parseFloat(str);
        if (isNaN(num)) return 'El promedio debe ser un número válido';
        if (num < 0 || num > 100) return 'El promedio debe estar entre 0 y 100';
        const decimalPlaces = (str.split('.')[1] || '').length;
        if (decimalPlaces > 2) return 'El promedio no puede tener más de 2 decimales';
      }
      return null;
    },
    creditosCursados: (value: string | number): string | null => {
      const num = typeof value === 'number' ? value : parseInt(String(value), 10);
      if (isNaN(num)) return 'Los créditos cursados deben ser un número válido';
      if (num < 0) return 'Los créditos cursados no pueden ser negativos';
      if (num > 1000) return 'Los créditos cursados no pueden exceder 1000';
      return null;
    },
    creditosAprobados: (value: string | number): string | null => {
      const num = typeof value === 'number' ? value : parseInt(String(value), 10);
      if (isNaN(num)) return 'Los créditos aprobados deben ser un número válido';
      if (num < 0) return 'Los créditos aprobados no pueden ser negativos';
      const creditosCursados = typeof formData.creditosCursados === 'number' 
        ? formData.creditosCursados 
        : parseInt(String(formData.creditosCursados), 10) || 0;
      if (num > creditosCursados) {
        return 'Los créditos aprobados no pueden exceder los créditos cursados';
      }
      return null;
    },
    creditosTotales: (value: string | number): string | null => {
      const num = typeof value === 'number' ? value : parseInt(String(value), 10);
      if (isNaN(num)) return 'Los créditos totales deben ser un número válido';
      if (num < 0) return 'Los créditos totales no pueden ser negativos';
      if (num > 500) return 'Los créditos totales no pueden exceder 500';
      return null;
    },
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    let newValue: string | number | boolean = value;
    
    // Handle number fields
    if (name === 'semestre' || name === 'creditosCursados' || name === 'creditosAprobados' || name === 'creditosTotales') {
      newValue = parseInt(value, 10) || 0;
    } else if (name === 'promedioGeneral') {
      newValue = value; // Keep as string for decimal input
    }
    
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
      // Handle boolean values by converting to string for validation
      const valueToValidate = typeof value === 'boolean' ? String(value) : value;
      const error = validator(valueToValidate as string | number);
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
          // Contact information
          email: formData.email || undefined,
          telefono: formData.telefono || undefined,
          telefonoEmergencia: formData.telefonoEmergencia || undefined,
          // Personal information
          fechaNacimiento: formData.fechaNacimiento || undefined,
          genero: formData.genero || undefined,
          nacionalidad: formData.nacionalidad || undefined,
          lugarNacimiento: formData.lugarNacimiento || undefined,
          direccion: formData.direccion || undefined,
          ciudad: formData.ciudad || undefined,
          estado: formData.estado || undefined,
          codigoPostal: formData.codigoPostal || undefined,
          pais: formData.pais || undefined,
          // Academic information
          tipoIngreso: formData.tipoIngreso,
          fechaIngreso: formData.fechaIngreso || undefined,
          fechaEgreso: formData.fechaEgreso || undefined,
          promedioGeneral: formData.promedioGeneral ? parseFloat(formData.promedioGeneral) : undefined,
          creditosCursados: formData.creditosCursados,
          creditosAprobados: formData.creditosAprobados,
          creditosTotales: formData.creditosTotales ? parseInt(formData.creditosTotales, 10) : undefined,
          // Administrative information
          beca: formData.beca,
          tipoBeca: formData.tipoBeca || undefined,
          observaciones: formData.observaciones || undefined,
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
        <PageLoader text="Cargando estudiante..." />
      </Layout>
    );
  }

  const hasErrors = Object.values(formErrors).some((error) => error !== null);

  return (
    <Layout>
      <div className="p-4 sm:p-6">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {isEdit ? 'Editar Estudiante' : 'Nuevo Estudiante'}
          </h1>
          <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
            {isEdit
              ? 'Modifica la información del estudiante'
              : 'Completa el formulario para crear un nuevo estudiante'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-4 sm:p-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
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

            <CareerSelector
              value={formData.carrera}
              onChange={(value) => {
                handleChange({
                  target: { name: 'carrera', value },
                } as React.ChangeEvent<HTMLInputElement>);
              }}
              required
              error={formErrors.carrera}
              touched={touchedFields.carrera}
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

            <StatusSelector
              type="student"
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
              placeholder="estudiante@ejemplo.com"
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

            <FormField
              label="Teléfono de Emergencia"
              name="telefonoEmergencia"
              type="tel"
              value={formData.telefonoEmergencia}
              onChange={handleChange}
              placeholder="5551234567"
              maxLength={20}
              error={formErrors.telefonoEmergencia}
              touched={touchedFields.telefonoEmergencia}
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
              label="Lugar de Nacimiento"
              name="lugarNacimiento"
              type="text"
              value={formData.lugarNacimiento}
              onChange={handleChange}
              placeholder="Ciudad, Estado"
              maxLength={200}
              error={formErrors.lugarNacimiento}
              touched={touchedFields.lugarNacimiento}
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
              label="Tipo de Ingreso"
              name="tipoIngreso"
              value={formData.tipoIngreso}
              onChange={handleChange}
              required
              error={formErrors.tipoIngreso}
              touched={touchedFields.tipoIngreso}
              as="select"
              options={[
                { value: 'NUEVO_INGRESO', label: 'NUEVO INGRESO' },
                { value: 'REINGRESO', label: 'REINGRESO' },
                { value: 'TRANSFERENCIA', label: 'TRANSFERENCIA' },
                { value: 'EQUIVALENCIA', label: 'EQUIVALENCIA' },
              ]}
            />

            <FormField
              label="Fecha de Ingreso"
              name="fechaIngreso"
              type="date"
              value={formData.fechaIngreso}
              onChange={handleChange}
              error={formErrors.fechaIngreso}
              touched={touchedFields.fechaIngreso}
            />

            <FormField
              label="Fecha de Egreso"
              name="fechaEgreso"
              type="date"
              value={formData.fechaEgreso}
              onChange={handleChange}
              error={formErrors.fechaEgreso}
              touched={touchedFields.fechaEgreso}
            />

            <FormField
              label="Promedio General"
              name="promedioGeneral"
              type="number"
              value={formData.promedioGeneral}
              onChange={handleChange}
              placeholder="0.00"
              min={0}
              max={100}
              step="0.01"
              error={formErrors.promedioGeneral}
              touched={touchedFields.promedioGeneral}
            />

            <FormField
              label="Créditos Cursados"
              name="creditosCursados"
              type="number"
              value={formData.creditosCursados}
              onChange={handleChange}
              min={0}
              error={formErrors.creditosCursados}
              touched={touchedFields.creditosCursados}
            />

            <FormField
              label="Créditos Aprobados"
              name="creditosAprobados"
              type="number"
              value={formData.creditosAprobados}
              onChange={handleChange}
              min={0}
              error={formErrors.creditosAprobados}
              touched={touchedFields.creditosAprobados}
            />

            <FormField
              label="Créditos Totales"
              name="creditosTotales"
              type="number"
              value={formData.creditosTotales}
              onChange={handleChange}
              placeholder="Total de créditos de la carrera"
              min={0}
              error={formErrors.creditosTotales}
              touched={touchedFields.creditosTotales}
            />

            {/* English Information Section (Read-only) */}
            {isEdit && (
              <>
                <div className="md:col-span-2">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2 mt-6">
                    Información de Inglés
                  </h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Esta información se actualiza automáticamente cuando se procesan exámenes de diagnóstico y cursos de inglés.
                  </p>
                </div>

                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nivel Actual de Inglés
                    </label>
                    <p className="text-sm text-gray-900">
                      {student?.nivelInglesActual ? `Nivel ${student.nivelInglesActual}` : 'No asignado'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Porcentaje de Inglés
                    </label>
                    <p className="text-sm text-gray-900">
                      {student?.porcentajeIngles !== undefined && student.porcentajeIngles !== null
                        ? `${student.porcentajeIngles.toFixed(1)}%`
                        : 'No disponible'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Promedio de Inglés
                    </label>
                    <p className="text-sm text-gray-900">
                      {student?.promedioIngles !== undefined && student.promedioIngles !== null
                        ? `${student.promedioIngles.toFixed(2)}`
                        : 'No disponible'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cumple Requisito de Inglés
                    </label>
                    <p className="text-sm text-gray-900">
                      {student?.cumpleRequisitoIngles ? (
                        <span className="text-green-600 font-semibold">✓ Sí</span>
                      ) : (
                        <span className="text-red-600 font-semibold">✗ No</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Requiere: Promedio ≥70% y niveles 1-6 completados
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de Examen de Diagnóstico
                    </label>
                    <p className="text-sm text-gray-900">
                      {student?.fechaExamenDiagnostico
                        ? new Date(student.fechaExamenDiagnostico).toLocaleDateString('es-MX')
                        : 'No realizado'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nivel Certificado
                    </label>
                    <p className="text-sm text-gray-900">
                      {student?.nivelInglesCertificado
                        ? `Nivel ${student.nivelInglesCertificado}`
                        : 'No certificado'}
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Administrative Information Section */}
            <div className="md:col-span-2">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2 mt-6">
                Información Administrativa
              </h2>
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="beca"
                  checked={formData.beca}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, beca: e.target.checked }));
                    setTouchedFields((prev) => ({ ...prev, beca: true }));
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">¿Tiene beca?</span>
              </label>
            </div>

            {formData.beca && (
              <FormField
                label="Tipo de Beca"
                name="tipoBeca"
                type="text"
                value={formData.tipoBeca}
                onChange={handleChange}
                placeholder="Ej: Académica, Deportiva, etc."
                maxLength={50}
                error={formErrors.tipoBeca}
                touched={touchedFields.tipoBeca}
              />
            )}

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

          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => navigate('/admin/students')}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm sm:text-base"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || hasErrors}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {loading ? (
                <>
                  <ButtonLoader className="mr-2" />
                  Guardando...
                </>
              ) : isEdit ? (
                'Actualizar Estudiante'
              ) : (
                'Crear Estudiante'
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};
