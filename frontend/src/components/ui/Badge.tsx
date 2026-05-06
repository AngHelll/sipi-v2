// Badge component for status indicators and labels
import type { ReactNode } from 'react';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'danger';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-surface-container text-on-surface border border-outline-variant',
  success: 'bg-primary-fixed text-on-primary-fixed-variant border border-primary-fixed-dim font-medium',
  warning: 'bg-secondary-fixed text-on-secondary-fixed-variant border border-secondary-fixed-dim font-medium',
  error: 'bg-error-container text-on-error-container border border-error font-medium',
  info: 'bg-tertiary-fixed text-on-tertiary-fixed-variant border border-tertiary-fixed-dim font-medium',
  danger: 'bg-error-container text-on-error-container border border-error font-medium', // Alias for error
};

export const Badge = ({ children, variant = 'default', className = '' }: BadgeProps) => {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold shadow-soft ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

