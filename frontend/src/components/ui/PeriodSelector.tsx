// Period selector component
import { useState, useEffect } from 'react';
import { FormField } from './FormField';
import { groupsApi } from '../../lib/api';

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
      // Fetch all groups to get unique periods
      const allPeriods: string[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await groupsApi.getAll({ limit: 100, page });
        const periodos = response.groups
          .map(g => g.periodo)
          .filter(Boolean) as string[];
        allPeriods.push(...periodos);
        
        hasMore = page < response.pagination.totalPages;
        page++;
        
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Sort periods in reverse order (most recent first)
      const uniquePeriods = [...new Set(allPeriods)].sort().reverse();
      setPeriods(uniquePeriods);
    } catch (err) {
      console.error('Error fetching periods:', err);
      // Fallback: try with just first page
      try {
        const response = await groupsApi.getAll({ limit: 100, page: 1 });
        const periodos = [...new Set(
          response.groups.map(g => g.periodo).filter(Boolean) as string[]
        )].sort().reverse();
        setPeriods(periodos);
      } catch (fallbackErr) {
        console.error('Error fetching periods (fallback):', fallbackErr);
      }
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




