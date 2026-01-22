// Reusable form field component with real-time validation
import { useState, useEffect } from 'react';

export interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'password' | 'number' | 'email' | 'tel' | 'date';
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  step?: number | string;
  error?: string | null;
  touched?: boolean;
  validate?: (value: string | number) => string | null;
  helpText?: string;
  className?: string;
  as?: 'input' | 'select' | 'textarea';
  options?: Array<{ value: string; label: string }>;
  rows?: number;
}

export const FormField = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  min,
  max,
  minLength,
  maxLength,
  step,
  error: externalError,
  touched: externalTouched,
  validate,
  helpText,
  className = '',
  as = 'input',
  options,
  rows = 3,
}: FormFieldProps) => {
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use external touched/error if provided, otherwise use internal state
  const isTouched = externalTouched !== undefined ? externalTouched : touched;
  const displayError = externalError !== undefined ? externalError : error;

  // Validate on change if touched
  useEffect(() => {
    if (isTouched && validate) {
      const validationError = validate(value);
      setError(validationError);
    }
  }, [value, isTouched, validate]);

  const handleBlur = () => {
    setTouched(true);
    if (validate) {
      const validationError = validate(value);
      setError(validationError);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (!isTouched) {
      setTouched(true);
    }
    onChange(e);
  };

  const hasError = isTouched && displayError;
  const inputClasses = `
    w-full px-3 py-2 border rounded-lg transition-colors
    focus:ring-2 focus:ring-blue-500 focus:border-blue-500
    ${hasError 
      ? 'border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500' 
      : 'border-gray-300 bg-white'
    }
    ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
    ${className}
  `.trim();

  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {as === 'select' && options ? (
        <select
          id={name}
          name={name}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          required={required}
          disabled={disabled}
          className={inputClasses}
        >
          <option value="">Selecciona una opción</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : as === 'textarea' ? (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          required={required}
          disabled={disabled}
          minLength={minLength}
          maxLength={maxLength}
          placeholder={placeholder}
          rows={rows}
          className={inputClasses}
        />
      ) : (
        <input
          type={type}
          id={name}
          name={name}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          required={required}
          disabled={disabled}
          min={min}
          max={max}
          minLength={minLength}
          maxLength={maxLength}
          step={step}
          placeholder={placeholder}
          className={inputClasses}
        />
      )}

      {hasError && (
        <p className="mt-1 text-sm text-red-600 flex items-center">
          <svg
            className="w-4 h-4 mr-1"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {displayError}
        </p>
      )}

      {!hasError && helpText && (
        <p className="mt-1 text-xs text-gray-500">{helpText}</p>
      )}
    </div>
  );
};

