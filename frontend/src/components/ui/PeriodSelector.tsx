// Period selector component
import { useState, useEffect } from 'react';
import { FormField } from './FormField';
import { fetchUniqueGroupPeriods } from '../../lib/groupPeriods';

interface PeriodSelectorProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string | null;
  touched?: boolean;
  label?: string;
  className?: string;
  allowCustom?: boolean; // Allow typing custom period values
  helpText?: string;
}

export const PeriodSelector = ({
  value,
  onChange,
  required = false,
  error,
  touched,
  label = 'Período',
  className = '',
  allowCustom = true,
  helpText,
}: PeriodSelectorProps) => {
  const [periods, setPeriods] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPeriods();
  }, []);

  const fetchPeriods = async () => {
    try {
      setLoading(true);
      setPeriods(await fetchUniqueGroupPeriods());
    } catch (err) {
      console.error('Error fetching periods:', err);
      setPeriods([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    onChange((e.target as HTMLSelectElement).value);
  };

  // If allowCustom is true, use a datalist for autocomplete
  if (allowCustom) {
    return (
      <div className={className}>
        <FormField
          label={label}
          name="periodo"
          type="text"
          value={value}
          onChange={handleChange}
          required={required}
          error={error}
          touched={touched}
          placeholder="2024-1"
          helpText={helpText || "Formato: Año-Período (ej: 2024-1, 2024-2)"}
          maxLength={10}
          list="periods-list"
        />
        <datalist id="periods-list">
          {loading ? (
            <option value="Cargando...">Cargando...</option>
          ) : (
            periods.map(period => (
              <option key={period} value={period} />
            ))
          )}
        </datalist>
      </div>
    );
  }

  // Otherwise, use a select dropdown
  return (
    <FormField
      label={label}
      name="periodo"
      value={value}
      onChange={handleChange}
      required={required}
      error={error}
      touched={touched}
      as="select"
      options={[
        { value: '', label: loading ? 'Cargando...' : 'Selecciona un período' },
        ...periods.map(period => ({ value: period, label: period })),
      ]}
      disabled={loading}
      className={className}
      helpText={helpText}
    />
  );
};




