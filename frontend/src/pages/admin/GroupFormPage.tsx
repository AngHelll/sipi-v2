// Group form page for creating/editing groups with improved validation
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { groupsApi, subjectsApi, teachersApi } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { FormField, ModalitySelector, StatusSelector, PeriodSelector, PageLoader, ButtonLoader } from '../../components/ui';
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
    cupoMaximo: 30,
    cupoMinimo: 5,
    horario: '',
    aula: '',
    edificio: '',
    modalidad: 'PRESENCIAL' as 'PRESENCIAL' | 'VIRTUAL' | 'HIBRIDO' | 'SEMIPRESENCIAL',
    estatus: 'ABIERTO' as 'ABIERTO' | 'CERRADO' | 'CANCELADO' | 'EN_CURSO' | 'FINALIZADO',
    // Campos para cursos de inglés
    nivelIngles: '',
    fechaInscripcionInicio: '',
    fechaInscripcionFin: '',
    fechaInicio: '',
    fechaFin: '',
    esCursoIngles: false,
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
      
      // Format dates for input fields (datetime-local format)
      const formatDateTimeLocal = (dateString?: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };

      setFormData({
        subjectId: group.subjectId,
        teacherId: group.teacherId,
        nombre: group.nombre,
        periodo: group.periodo,
        cupoMaximo: group.cupoMaximo || 30,
        cupoMinimo: group.cupoMinimo || 5,
        horario: group.horario || '',
        aula: group.aula || '',
        edificio: group.edificio || '',
        modalidad: (group.modalidad || 'PRESENCIAL') as 'PRESENCIAL' | 'VIRTUAL' | 'HIBRIDO' | 'SEMIPRESENCIAL',
        estatus: (group.estatus || 'ABIERTO') as 'ABIERTO' | 'CERRADO' | 'CANCELADO' | 'EN_CURSO' | 'FINALIZADO',
        nivelIngles: group.nivelIngles?.toString() || '',
        fechaInscripcionInicio: formatDateTimeLocal(group.fechaInscripcionInicio),
        fechaInscripcionFin: formatDateTimeLocal(group.fechaInscripcionFin),
        fechaInicio: formatDateTimeLocal(group.fechaInicio),
        fechaFin: formatDateTimeLocal(group.fechaFin),
        esCursoIngles: group.esCursoIngles || false,
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

      // Prepare data with English course fields
      const groupData: any = {
        nombre: formData.nombre,
        periodo: formData.periodo,
        subjectId: formData.subjectId,
        teacherId: formData.teacherId,
        cupoMaximo: formData.cupoMaximo,
        cupoMinimo: formData.cupoMinimo,
        horario: formData.horario || undefined,
        aula: formData.aula || undefined,
        edificio: formData.edificio || undefined,
        modalidad: formData.modalidad,
        estatus: formData.estatus,
      };

      // Add fechaInicio and fechaFin if provided (for all groups)
      if (formData.fechaInicio) {
        groupData.fechaInicio = new Date(formData.fechaInicio).toISOString();
      }
      if (formData.fechaFin) {
        groupData.fechaFin = new Date(formData.fechaFin).toISOString();
      }

      // Add English course fields if esCursoIngles is true
      if (formData.esCursoIngles) {
        if (formData.nivelIngles) {
          groupData.nivelIngles = parseInt(formData.nivelIngles, 10);
        }
        if (formData.fechaInscripcionInicio) {
          groupData.fechaInscripcionInicio = new Date(formData.fechaInscripcionInicio).toISOString();
        }
        if (formData.fechaInscripcionFin) {
          groupData.fechaInscripcionFin = new Date(formData.fechaInscripcionFin).toISOString();
        }
        groupData.esCursoIngles = true;
      } else {
        groupData.esCursoIngles = false;
      }

      if (isEdit && id) {
        await groupsApi.update(id, groupData);
        showToast('Grupo actualizado correctamente', 'success');
        setTimeout(() => {
          navigate('/admin/groups');
        }, 1000);
      } else {
        await groupsApi.create(groupData);
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
        <PageLoader text="Cargando datos..." />
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

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 max-w-2xl border border-gray-200">
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

            <PeriodSelector
              label="Período"
              value={formData.periodo}
              onChange={(value) => {
                handleChange({
                  target: { name: 'periodo', value },
                } as React.ChangeEvent<HTMLInputElement>);
              }}
              required
              error={formErrors.periodo}
              touched={touchedFields.periodo}
              allowCustom={true}
              helpText="Formato: Año-Período (ej: 2024-1, 2024-2). Puedes seleccionar uno existente o escribir uno nuevo."
            />

            <FormField
              label="Cupo Máximo"
              name="cupoMaximo"
              type="number"
              value={formData.cupoMaximo}
              onChange={handleChange}
              required
              min={1}
              error={formErrors.cupoMaximo}
              touched={touchedFields.cupoMaximo}
            />

            <FormField
              label="Cupo Mínimo"
              name="cupoMinimo"
              type="number"
              value={formData.cupoMinimo}
              onChange={handleChange}
              required
              min={1}
              error={formErrors.cupoMinimo}
              touched={touchedFields.cupoMinimo}
            />

            <ModalitySelector
              value={formData.modalidad}
              onChange={(value) => {
                handleChange({
                  target: { name: 'modalidad', value },
                } as React.ChangeEvent<HTMLInputElement>);
              }}
              required
              error={formErrors.modalidad}
              touched={touchedFields.modalidad}
            />

            <StatusSelector
              type="group"
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
              label="Horario"
              name="horario"
              type="text"
              value={formData.horario}
              onChange={handleChange}
              placeholder="L-M-V 10:00-12:00"
              error={formErrors.horario}
              touched={touchedFields.horario}
              maxLength={200}
            />

            <FormField
              label="Aula"
              name="aula"
              type="text"
              value={formData.aula}
              onChange={handleChange}
              placeholder="A-101"
              error={formErrors.aula}
              touched={touchedFields.aula}
              maxLength={20}
            />

            <FormField
              label="Edificio"
              name="edificio"
              type="text"
              value={formData.edificio}
              onChange={handleChange}
              placeholder="Edificio A"
              error={formErrors.edificio}
              touched={touchedFields.edificio}
              maxLength={50}
            />

            <FormField
              label="Fecha de Inicio del Curso"
              name="fechaInicio"
              type="datetime-local"
              value={formData.fechaInicio}
              onChange={handleChange}
              error={formErrors.fechaInicio}
              touched={touchedFields.fechaInicio}
              helpText="Fecha y hora en que inicia el curso"
            />

            <FormField
              label="Fecha de Fin del Curso"
              name="fechaFin"
              type="datetime-local"
              value={formData.fechaFin}
              onChange={handleChange}
              error={formErrors.fechaFin}
              touched={touchedFields.fechaFin}
              helpText="Fecha y hora en que finaliza el curso"
            />
          </div>

          {/* English Course Fields */}
          <div className="mt-8 border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración para Curso de Inglés</h3>
            <div className="mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="esCursoIngles"
                  checked={formData.esCursoIngles}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Marcar como curso de inglés</span>
              </label>
            </div>

            {formData.esCursoIngles && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  label="Nivel de Inglés"
                  name="nivelIngles"
                  type="number"
                  value={formData.nivelIngles}
                  onChange={handleChange}
                  min={1}
                  max={6}
                  error={formErrors.nivelIngles}
                  touched={touchedFields.nivelIngles}
                  helpText="Nivel del curso (1-6)"
                />

                <FormField
                  label="Fecha de Inicio de Inscripciones"
                  name="fechaInscripcionInicio"
                  type="datetime-local"
                  value={formData.fechaInscripcionInicio}
                  onChange={handleChange}
                  error={formErrors.fechaInscripcionInicio}
                  touched={touchedFields.fechaInscripcionInicio}
                />

                <FormField
                  label="Fecha de Fin de Inscripciones"
                  name="fechaInscripcionFin"
                  type="datetime-local"
                  value={formData.fechaInscripcionFin}
                  onChange={handleChange}
                  error={formErrors.fechaInscripcionFin}
                  touched={touchedFields.fechaInscripcionFin}
                />
              </div>
            )}
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
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <ButtonLoader className="mr-2" />
                  Guardando...
                </>
              ) : isEdit ? (
                'Actualizar Grupo'
              ) : (
                'Crear Grupo'
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};
