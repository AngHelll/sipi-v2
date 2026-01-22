// Exam Period form page for creating/editing exam periods
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { examPeriodsApi } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { FormField, PageLoader, ButtonLoader } from '../../components/ui';
import type { ExamPeriod, ExamPeriodStatus } from '../../types';

export const ExamPeriodFormPage = () => {
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
    nombre: '',
    descripcion: '',
    fechaInicio: '',
    fechaFin: '',
    fechaInscripcionInicio: '',
    fechaInscripcionFin: '',
    cupoMaximo: 100,
    requierePago: false,
    montoPago: '',
    observaciones: '',
  });

  useEffect(() => {
    if (isEdit && id) {
      fetchPeriod();
    }
  }, [id, isEdit]);

  const fetchPeriod = async () => {
    try {
      setFetching(true);
      const period = await examPeriodsApi.getPeriodById(id!);

      // Format dates for input fields (YYYY-MM-DDTHH:mm)
      const formatDateTimeLocal = (dateString: string) => {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };

      setFormData({
        nombre: period.nombre,
        descripcion: period.descripcion || '',
        fechaInicio: formatDateTimeLocal(period.fechaInicio),
        fechaFin: formatDateTimeLocal(period.fechaFin),
        fechaInscripcionInicio: formatDateTimeLocal(period.fechaInscripcionInicio),
        fechaInscripcionFin: formatDateTimeLocal(period.fechaInscripcionFin),
        cupoMaximo: period.cupoMaximo,
        requierePago: period.requierePago,
        montoPago: period.montoPago?.toString() || '',
        observaciones: period.observaciones || '',
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Error al cargar el período';
      showToast(errorMessage, 'error');
      console.error('Error fetching exam period:', err);
    } finally {
      setFetching(false);
    }
  };

  // Validation functions
  const validators = {
    nombre: (value: string): string | null => {
      const str = value.trim();
      if (!str) return 'El nombre es requerido';
      if (str.length > 200) return 'El nombre no puede exceder 200 caracteres';
      return null;
    },
    fechaInicio: (value: string): string | null => {
      if (!value) return 'La fecha de inicio es requerida';
      return null;
    },
    fechaFin: (value: string): string | null => {
      if (!value) return 'La fecha de fin es requerida';
      if (formData.fechaInicio && value < formData.fechaInicio) {
        return 'La fecha de fin debe ser posterior a la fecha de inicio';
      }
      return null;
    },
    fechaInscripcionInicio: (value: string): string | null => {
      if (!value) return 'La fecha de inicio de inscripciones es requerida';
      return null;
    },
    fechaInscripcionFin: (value: string): string | null => {
      if (!value) return 'La fecha de fin de inscripciones es requerida';
      if (formData.fechaInscripcionInicio && value < formData.fechaInscripcionInicio) {
        return 'La fecha de fin debe ser posterior a la fecha de inicio';
      }
      if (formData.fechaInicio && value > formData.fechaInicio) {
        return 'Las inscripciones deben cerrar antes o el mismo día que inician los exámenes';
      }
      return null;
    },
    cupoMaximo: (value: string | number): string | null => {
      const num = Number(value);
      if (isNaN(num) || num < 1) return 'El cupo máximo debe ser mayor a 0';
      if (num > 10000) return 'El cupo máximo no puede exceder 10,000';
      return null;
    },
    montoPago: (value: string): string | null => {
      if (formData.requierePago && value) {
        const num = Number(value);
        if (isNaN(num) || num < 0) return 'El monto debe ser un número positivo';
      }
      return null;
    },
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
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
      const error = validator(String(value));
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

      // Convert datetime-local to ISO string
      const formatToISO = (dateTimeLocal: string) => {
        return new Date(dateTimeLocal).toISOString();
      };

      const data = {
        nombre: formData.nombre,
        descripcion: formData.descripcion || undefined,
        fechaInicio: formatToISO(formData.fechaInicio),
        fechaFin: formatToISO(formData.fechaFin),
        fechaInscripcionInicio: formatToISO(formData.fechaInscripcionInicio),
        fechaInscripcionFin: formatToISO(formData.fechaInscripcionFin),
        cupoMaximo: formData.cupoMaximo,
        requierePago: formData.requierePago,
        montoPago: formData.requierePago && formData.montoPago ? Number(formData.montoPago) : undefined,
        observaciones: formData.observaciones || undefined,
      };

      if (isEdit && id) {
        await examPeriodsApi.updatePeriod(id, data);
        showToast('Período actualizado correctamente', 'success');
      } else {
        await examPeriodsApi.createPeriod(data);
        showToast('Período creado correctamente', 'success');
      }

      setTimeout(() => {
        navigate('/admin/exam-periods');
      }, 1000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error ||
        `Error al ${isEdit ? 'actualizar' : 'crear'} el período`;
      showToast(errorMessage, 'error');
      console.error('Error saving exam period:', err);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
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
            {isEdit ? 'Editar Período de Exámenes' : 'Nuevo Período de Exámenes'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isEdit
              ? 'Modifica la información del período'
              : 'Completa el formulario para crear un nuevo período de exámenes'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 max-w-3xl border border-gray-200">
          <div className="space-y-6">
            <FormField
              label="Nombre del Período"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
              error={formErrors.nombre}
              touched={touchedFields.nombre}
              placeholder="Ej: Examen Diagnóstico Enero 2025"
            />

            <FormField
              label="Descripción"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              error={formErrors.descripcion}
              touched={touchedFields.descripcion}
              as="textarea"
              rows={3}
              placeholder="Descripción opcional del período"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="Fecha de Inicio de Inscripciones"
                name="fechaInscripcionInicio"
                type="datetime-local"
                value={formData.fechaInscripcionInicio}
                onChange={handleChange}
                required
                error={formErrors.fechaInscripcionInicio}
                touched={touchedFields.fechaInscripcionInicio}
              />

              <FormField
                label="Fecha de Fin de Inscripciones"
                name="fechaInscripcionFin"
                type="datetime-local"
                value={formData.fechaInscripcionFin}
                onChange={handleChange}
                required
                error={formErrors.fechaInscripcionFin}
                touched={touchedFields.fechaInscripcionFin}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="Fecha de Inicio de Exámenes"
                name="fechaInicio"
                type="datetime-local"
                value={formData.fechaInicio}
                onChange={handleChange}
                required
                error={formErrors.fechaInicio}
                touched={touchedFields.fechaInicio}
              />

              <FormField
                label="Fecha de Fin de Exámenes"
                name="fechaFin"
                type="datetime-local"
                value={formData.fechaFin}
                onChange={handleChange}
                required
                error={formErrors.fechaFin}
                touched={touchedFields.fechaFin}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="Cupo Máximo"
                name="cupoMaximo"
                type="number"
                value={formData.cupoMaximo}
                onChange={handleChange}
                required
                error={formErrors.cupoMaximo}
                touched={touchedFields.cupoMaximo}
                min={1}
                max={10000}
              />

              <div>
                <label className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    name="requierePago"
                    checked={formData.requierePago}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Requiere Pago</span>
                </label>
                {formData.requierePago && (
                  <FormField
                    label="Monto del Pago"
                    name="montoPago"
                    type="number"
                    value={formData.montoPago}
                    onChange={handleChange}
                    error={formErrors.montoPago}
                    touched={touchedFields.montoPago}
                    min={0}
                    step="0.01"
                    placeholder="0.00"
                  />
                )}
              </div>
            </div>

            <FormField
              label="Observaciones"
              name="observaciones"
              value={formData.observaciones}
              onChange={handleChange}
              error={formErrors.observaciones}
              touched={touchedFields.observaciones}
              as="textarea"
              rows={3}
              placeholder="Observaciones adicionales"
            />
          </div>

          <div className="mt-6 flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/admin/exam-periods')}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || hasErrors}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <ButtonLoader />
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {isEdit ? 'Actualizar' : 'Crear'} Período
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};


