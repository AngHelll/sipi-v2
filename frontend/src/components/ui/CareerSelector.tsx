// Career selector — loads from GET /api/careers (UTF-8 catalog)
import { useState, useEffect } from 'react';
import { FormField } from './FormField';
import { careersApi } from '../../lib/api';

export interface CareerOption {
  id: string;
  nombre: string;
  codigo: string;
}

interface CareerSelectorProps {
  value: string;
  onChange: (nombre: string, career?: CareerOption) => void;
  required?: boolean;
  error?: string | null;
  touched?: boolean;
  label?: string;
  className?: string;
}

export const CareerSelector = ({
  value,
  onChange,
  required = false,
  error,
  touched,
  label = 'Carrera',
  className = '',
}: CareerSelectorProps) => {
  const [careers, setCareers] = useState<CareerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    fetchCareers();
  }, []);

  const fetchCareers = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const response = await careersApi.getAll();
      setCareers(
        response.careers.map((c) => ({
          id: c.id,
          nombre: c.nombre,
          codigo: c.codigo,
        }))
      );
    } catch (err) {
      console.error('Error fetching careers:', err);
      setLoadError('No se pudieron cargar las carreras');
      setCareers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const nombre = (e.target as HTMLSelectElement).value;
    const career = careers.find((c) => c.nombre === nombre);
    onChange(nombre, career);
  };

  const emptyLabel = loadError
    ? loadError
    : loading
      ? 'Cargando...'
      : careers.length === 0
        ? 'Sin carreras — ejecuta seed:careers'
        : 'Selecciona una carrera';

  return (
    <FormField
      label={label}
      name="carrera"
      value={value}
      onChange={handleChange}
      required={required}
      error={error || loadError}
      touched={touched}
      as="select"
      options={[
        { value: '', label: emptyLabel },
        ...careers.map((career) => ({
          value: career.nombre,
          label: `${career.nombre} (${career.codigo})`,
        })),
      ]}
      disabled={loading || careers.length === 0}
      className={className}
    />
  );
};
