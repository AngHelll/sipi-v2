// Reusable prompt dialog with a multiline text input (replaces window.prompt)
import { useEffect, useState } from 'react';

export interface PromptDialogProps {
  isOpen: boolean;
  title: string;
  message?: string;
  label?: string;
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
  required?: boolean;
  initialValue?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export const PromptDialog = ({
  isOpen,
  title,
  message,
  label,
  placeholder,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  required = true,
  initialValue = '',
  variant = 'danger',
  onConfirm,
  onCancel,
}: PromptDialogProps) => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (isOpen) {
      setValue(initialValue);
    }
  }, [isOpen, initialValue]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const confirmButtonStyles = {
    danger: 'bg-error hover:opacity-90 text-on-error',
    warning: 'bg-secondary hover:opacity-90 text-on-secondary',
    info: 'bg-tertiary hover:opacity-90 text-on-tertiary',
  }[variant];

  const trimmed = value.trim();
  const confirmDisabled = required && trimmed === '';

  const handleConfirm = () => {
    if (confirmDisabled) return;
    onConfirm(trimmed);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="prompt-modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="fixed inset-0 bg-surface-variant bg-opacity-75 transition-opacity"
        onClick={onCancel}
      />

      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-lg bg-surface text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg border border-outline-variant">
          <div className="bg-surface px-4 pb-4 pt-5 sm:p-6">
            <h3
              className="text-base font-semibold leading-6 text-on-surface"
              id="prompt-modal-title"
            >
              {title}
            </h3>
            {message && (
              <p className="mt-2 text-sm text-on-surface-variant">{message}</p>
            )}
            <div className="mt-4">
              {label && (
                <label className="block text-sm font-medium text-on-surface mb-1">
                  {label}
                </label>
              )}
              <textarea
                autoFocus
                rows={3}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div className="bg-surface-container-low px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <button
              type="button"
              disabled={confirmDisabled}
              className={`inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold shadow-sm sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed ${confirmButtonStyles}`}
              onClick={handleConfirm}
            >
              {confirmText}
            </button>
            <button
              type="button"
              className="mt-3 inline-flex w-full justify-center rounded-md bg-surface px-3 py-2 text-sm font-semibold text-on-surface shadow-sm ring-1 ring-inset ring-outline-variant hover:bg-surface-container sm:mt-0 sm:w-auto"
              onClick={onCancel}
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
