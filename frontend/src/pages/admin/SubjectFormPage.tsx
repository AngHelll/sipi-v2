// Subject form page for creating/editing subjects with improved validation
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { subjectsApi } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { FormField, PageLoader, ButtonLoader } from '../../components/ui';

export const SubjectFormPage = () => {
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
    clave: '',
    nombre: '',
    creditos: 1,
    // New fields (Phase 3)
    tipo: 'OBLIGATORIA' as 'OBLIGATORIA' | 'OPTATIVA' | 'ELECTIVA' | 'SERVICIO_SOCIAL',
    estatus: 'ACTIVA' as 'ACTIVA' | 'INACTIVA' | 'DESCONTINUADA' | 'EN_REVISION',
    nivel: '',
    horasTeoria: 0,
    horasPractica: 0,
    horasLaboratorio: 0,
    descripcion: '',
  });

  useEffect(() => {
    if (isEdit && id) {
      fetchSubject();
    }
  }, [id, isEdit]);

  const fetchSubject = async () => {
    try {
      setFetching(true);
      const subject = await subjectsApi.getById(id!);
      
      setFormData({
        clave: subject.clave,
        nombre: subject.nombre,
        creditos: subject.creditos,
        // New fields (Phase 3)
        tipo: (subject.tipo || 'OBLIGATORIA') as 'OBLIGATORIA' | 'OPTATIVA' | 'ELECTIVA' | 'SERVICIO_SOCIAL',
        estatus: (subject.estatus || 'ACTIVA') as 'ACTIVA' | 'INACTIVA' | 'DESCONTINUADA' | 'EN_REVISION',
        nivel: subject.nivel?.toString() || '',
        horasTeoria: subject.horasTeoria || 0,
        horasPractica: subject.horasPractica || 0,
        horasLaboratorio: subject.horasLaboratorio || 0,
        descripcion: subject.descripcion || '',
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Error al cargar la materia';
      showToast(errorMessage, 'error');
      console.error('Error fetching subject:', err);
    } finally {
      setFetching(false);
    }
  };

  // Validation functions
  const validators = {
    clave: (value: string | number): string | null => {
      const str = String(value).trim();
      if (!str) return 'La clave es requerida';
      if (str.length > 20) return 'La clave no puede exceder 20 caracteres';
      if (!/^[A-Z0-9\-]+$/.test(str.toUpperCase())) {
        return 'La clave solo puede contener letras mayúsculas, números y guiones';
      }
      return null;
    },
    nombre: (value: string | number): string | null => {
      const str = String(value).trim();
      if (!str) return 'El nombre es requerido';
      if (str.length > 200) return 'El nombre no puede exceder 200 caracteres';
      return null;
    },
    creditos: (value: string | number): string | null => {
      const num = typeof value === 'number' ? value : parseInt(String(value), 10);
      if (isNaN(num)) return 'Los créditos deben ser un número válido';
      if (num < 1 || num > 20) return 'Los créditos deben estar entre 1 y 20';
      return null;
    },
    horasTeoria: (value: string | number): string | null => {
      const num = typeof value === 'number' ? value : parseInt(String(value), 10);
      if (isNaN(num)) return 'Las horas de teoría deben ser un número válido';
      if (num < 0) return 'Las horas no pueden ser negativas';
      if (num > 40) return 'Las horas no pueden exceder 40';
      return null;
    },
    horasPractica: (value: string | number): string | null => {
      const num = typeof value === 'number' ? value : parseInt(String(value), 10);
      if (isNaN(num)) return 'Las horas de práctica deben ser un número válido';
      if (num < 0) return 'Las horas no pueden ser negativas';
      if (num > 40) return 'Las horas no pueden exceder 40';
      return null;
    },
    horasLaboratorio: (value: string | number): string | null => {
      const num = typeof value === 'number' ? value : parseInt(String(value), 10);
      if (isNaN(num)) return 'Las horas de laboratorio deben ser un número válido';
      if (num < 0) return 'Las horas no pueden ser negativas';
      if (num > 40) return 'Las horas no pueden exceder 40';
      return null;
    },
    nivel: (value: string | number): string | null => {
      const num = typeof value === 'number' ? value : parseInt(String(value), 10);
      if (isNaN(num)) return 'El nivel debe ser un número válido';
      if (num < 1 || num > 12) return 'El nivel debe estar entre 1 y 12';
      return null;
    },
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    let newValue: string | number = value;
    
    // Handle number fields
    if (name === 'creditos' || name === 'horasTeoria' || name === 'horasPractica' || name === 'horasLaboratorio') {
      newValue = parseInt(value, 10) || 0;
    }
    
    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    setTouchedFields((prev) => ({
      ...prev,
      [name]: true,
    }));

    const validator = validators[name as keyof typeof validators];
    if (validator) {
      const error = validator(newValue);
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
        await subjectsApi.update(id, {
          nombre: formData.nombre,
          creditos: formData.creditos,
          // New fields (Phase 3)
          tipo: formData.tipo,
          estatus: formData.estatus,
          nivel: formData.nivel ? parseInt(formData.nivel, 10) : undefined,
          horasTeoria: formData.horasTeoria,
          horasPractica: formData.horasPractica,
          horasLaboratorio: formData.horasLaboratorio,
          descripcion: formData.descripcion || undefined,
        });
        showToast('Materia actualizada correctamente', 'success');
        setTimeout(() => {
          navigate('/admin/subjects');
        }, 1000);
      } else {
        await subjectsApi.create({
          clave: formData.clave.toUpperCase(),
          nombre: formData.nombre,
          creditos: formData.creditos,
          // New fields (Phase 3)
          tipo: formData.tipo,
          estatus: formData.estatus,
          nivel: formData.nivel ? parseInt(formData.nivel, 10) : undefined,
          horasTeoria: formData.horasTeoria,
          horasPractica: formData.horasPractica,
          horasLaboratorio: formData.horasLaboratorio,
          descripcion: formData.descripcion || undefined,
        });
        showToast('Materia creada correctamente', 'success');
        setTimeout(() => {
          navigate('/admin/subjects');
        }, 1000);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error ||
        `Error al ${isEdit ? 'actualizar' : 'crear'} la materia`;
      showToast(errorMessage, 'error');
      console.error('Error saving subject:', err);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <Layout>
        <PageLoader text="Cargando materia..." />
      </Layout>
    );
  }

  const hasErrors = Object.values(formErrors).some((error) => error !== null);

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {isEdit ? 'Editar Materia' : 'Nueva Materia'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isEdit
              ? 'Modifica la información de la materia'
              : 'Completa el formulario para crear una nueva materia'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 max-w-2xl border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="Clave"
              name="clave"
              type="text"
              value={formData.clave}
              onChange={handleChange}
              placeholder="IS-102"
              required
              disabled={isEdit}
              error={formErrors.clave}
              touched={touchedFields.clave}
              validate={validators.clave}
              helpText={isEdit ? 'La clave no se puede modificar' : 'Solo letras mayúsculas, números y guiones. Máximo 20 caracteres.'}
            />

            <FormField
              label="Nombre"
              name="nombre"
              type="text"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Estructuras de Datos"
              required
              error={formErrors.nombre}
              touched={touchedFields.nombre}
              validate={validators.nombre}
            />

            <FormField
              label="Créditos"
              name="creditos"
              type="number"
              value={formData.creditos}
              onChange={handleChange}
              required
              min={1}
              max={20}
              error={formErrors.creditos}
              touched={touchedFields.creditos}
              validate={validators.creditos}
              helpText="Entre 1 y 20"
            />

            {/* Subject Information Section */}
            <div className="md:col-span-2">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2 mt-6">
                Información Adicional
              </h2>
            </div>

            <FormField
              label="Tipo"
              name="tipo"
              value={formData.tipo}
              onChange={handleChange}
              required
              error={formErrors.tipo}
              touched={touchedFields.tipo}
              as="select"
              options={[
                { value: 'OBLIGATORIA', label: 'OBLIGATORIA' },
                { value: 'OPTATIVA', label: 'OPTATIVA' },
                { value: 'ELECTIVA', label: 'ELECTIVA' },
                { value: 'SERVICIO_SOCIAL', label: 'SERVICIO SOCIAL' },
              ]}
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
                { value: 'ACTIVA', label: 'ACTIVA' },
                { value: 'INACTIVA', label: 'INACTIVA' },
                { value: 'DESCONTINUADA', label: 'DESCONTINUADA' },
                { value: 'EN_REVISION', label: 'EN REVISIÓN' },
              ]}
            />

            <FormField
              label="Nivel"
              name="nivel"
              type="number"
              value={formData.nivel}
              onChange={handleChange}
              placeholder="Ej: 1 para primer semestre"
              min={1}
              max={12}
              error={formErrors.nivel}
              touched={touchedFields.nivel}
            />

            {/* Hours Section */}
            <div className="md:col-span-2">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2 mt-6">
                Horas de Clase
              </h2>
            </div>

            <FormField
              label="Horas de Teoría"
              name="horasTeoria"
              type="number"
              value={formData.horasTeoria}
              onChange={handleChange}
              min={0}
              error={formErrors.horasTeoria}
              touched={touchedFields.horasTeoria}
            />

            <FormField
              label="Horas de Práctica"
              name="horasPractica"
              type="number"
              value={formData.horasPractica}
              onChange={handleChange}
              min={0}
              error={formErrors.horasPractica}
              touched={touchedFields.horasPractica}
            />

            <FormField
              label="Horas de Laboratorio"
              name="horasLaboratorio"
              type="number"
              value={formData.horasLaboratorio}
              onChange={handleChange}
              min={0}
              error={formErrors.horasLaboratorio}
              touched={touchedFields.horasLaboratorio}
            />

            <div className="md:col-span-2">
              <FormField
                label="Descripción"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                as="textarea"
                rows={4}
                placeholder="Descripción de la materia..."
                error={formErrors.descripcion}
                touched={touchedFields.descripcion}
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/admin/subjects')}
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
                'Actualizar Materia'
              ) : (
                'Crear Materia'
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};
