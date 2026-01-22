// Modality selector component
import { FormField } from './FormField';

type Modality = 'PRESENCIAL' | 'VIRTUAL' | 'HIBRIDO' | 'SEMIPRESENCIAL';

interface ModalitySelectorProps {
  value: Modality | string;
  onChange: (value: Modality) => void;
  required?: boolean;
  error?: string | null;
  touched?: boolean;
  label?: string;
  className?: string;
}

const modalityOptions = [
  { value: 'PRESENCIAL', label: 'Presencial' },
  { value: 'VIRTUAL', label: 'Virtual' },
  { value: 'HIBRIDO', label: 'Híbrido' },
  { value: 'SEMIPRESENCIAL', label: 'Semipresencial' },
];

export const ModalitySelector = ({
  value,
  onChange,
  required = false,
  error,
  touched,
  label = 'Modalidad',
  className = '',
}: ModalitySelectorProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    onChange((e.target as HTMLSelectElement).value as Modality);
  };

  return (
    <FormField
      label={label}
      name="modalidad"
      value={value}
      onChange={handleChange}
      required={required}
      error={error}
      touched={touched}
      as="select"
      options={modalityOptions}
      className={className}
    />
  );
};

