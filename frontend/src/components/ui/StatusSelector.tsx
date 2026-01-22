// Status selector component for different entity types
import { FormField } from './FormField';

export type StudentStatus = 'ACTIVO' | 'INACTIVO' | 'EGRESADO';
export type TeacherStatus = 'ACTIVO' | 'INACTIVO' | 'JUBILADO' | 'LICENCIA';
export type EnrollmentStatus = 'INSCRITO' | 'EN_CURSO' | 'BAJA' | 'APROBADO' | 'REPROBADO' | 'CANCELADO';
export type GroupStatus = 'ABIERTO' | 'CERRADO' | 'CANCELADO' | 'EN_CURSO' | 'FINALIZADO';
export type SubjectStatus = 'ACTIVA' | 'INACTIVA' | 'DESCONTINUADA' | 'EN_REVISION';

type StatusType = 'student' | 'teacher' | 'enrollment' | 'group' | 'subject';

interface StatusSelectorProps {
  type: StatusType;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string | null;
  touched?: boolean;
  label?: string;
  className?: string;
  disabled?: boolean;
}

const statusOptions: Record<StatusType, Array<{ value: string; label: string }>> = {
  student: [
    { value: 'ACTIVO', label: 'Activo' },
    { value: 'INACTIVO', label: 'Inactivo' },
    { value: 'EGRESADO', label: 'Egresado' },
  ],
  teacher: [
    { value: 'ACTIVO', label: 'Activo' },
    { value: 'INACTIVO', label: 'Inactivo' },
    { value: 'JUBILADO', label: 'Jubilado' },
    { value: 'LICENCIA', label: 'Licencia' },
  ],
  enrollment: [
    { value: 'INSCRITO', label: 'Inscrito' },
    { value: 'EN_CURSO', label: 'En Curso' },
    { value: 'BAJA', label: 'Baja' },
    { value: 'APROBADO', label: 'Aprobado' },
    { value: 'REPROBADO', label: 'Reprobado' },
    { value: 'CANCELADO', label: 'Cancelado' },
  ],
  group: [
    { value: 'ABIERTO', label: 'Abierto' },
    { value: 'CERRADO', label: 'Cerrado' },
    { value: 'CANCELADO', label: 'Cancelado' },
    { value: 'EN_CURSO', label: 'En Curso' },
    { value: 'FINALIZADO', label: 'Finalizado' },
  ],
  subject: [
    { value: 'ACTIVA', label: 'Activa' },
    { value: 'INACTIVA', label: 'Inactiva' },
    { value: 'DESCONTINUADA', label: 'Descontinuada' },
    { value: 'EN_REVISION', label: 'En Revisión' },
  ],
};

export const StatusSelector = ({
  type,
  value,
  onChange,
  required = false,
  error,
  touched,
  label,
  className = '',
  disabled = false,
}: StatusSelectorProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    onChange((e.target as HTMLSelectElement).value);
  };

  const defaultLabel = type === 'student' ? 'Estatus' :
    type === 'teacher' ? 'Estatus' :
    type === 'enrollment' ? 'Estatus de Inscripción' :
    type === 'group' ? 'Estatus del Grupo' :
    'Estatus';

  return (
    <FormField
      label={label || defaultLabel}
      name="estatus"
      value={value}
      onChange={handleChange}
      required={required}
      error={error}
      touched={touched}
      disabled={disabled}
      as="select"
      options={statusOptions[type]}
      className={className}
    />
  );
};

