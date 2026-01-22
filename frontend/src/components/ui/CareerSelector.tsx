// Career selector component
import { useState, useEffect } from 'react';
import { FormField } from './FormField';
import { studentsApi } from '../../lib/api';

interface CareerSelectorProps {
  value: string;
  onChange: (value: string) => void;
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
  const [careers, setCareers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCareers();
  }, []);

  const fetchCareers = async () => {
    try {
      setLoading(true);
      // Fetch all students to get unique careers
      const allCareers: string[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await studentsApi.getAll({ limit: 100, page });
        const carreras = response.students.map(s => s.carrera).filter(Boolean);
        allCareers.push(...carreras);
        
        hasMore = page < response.pagination.totalPages;
        page++;
        
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      const uniqueCareers = [...new Set(allCareers)].sort();
      setCareers(uniqueCareers);
    } catch (err) {
      console.error('Error fetching careers:', err);
      // Fallback: try with just first page
      try {
        const response = await studentsApi.getAll({ limit: 100, page: 1 });
        const carreras = [...new Set(response.students.map(s => s.carrera).filter(Boolean))].sort();
        setCareers(carreras);
      } catch (fallbackErr) {
        console.error('Error fetching careers (fallback):', fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    onChange((e.target as HTMLSelectElement).value);
  };

  return (
    <FormField
      label={label}
      name="carrera"
      value={value}
      onChange={handleChange}
      required={required}
      error={error}
      touched={touched}
      as="select"
      options={[
        { value: '', label: loading ? 'Cargando...' : 'Selecciona una carrera' },
        ...careers.map(career => ({ value: career, label: career })),
      ]}
      disabled={loading}
      className={className}
    />
  );
};

