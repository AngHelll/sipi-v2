// Badge component for status indicators and labels
import type { ReactNode } from 'react';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'danger';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700 border border-gray-200',
  success: 'bg-academic-success/10 text-academic-success border border-academic-success/20 font-medium',
  warning: 'bg-academic-warning/10 text-academic-warning border border-academic-warning/20 font-medium',
  error: 'bg-academic-danger/10 text-academic-danger border border-academic-danger/20 font-medium',
  info: 'bg-primary-50 text-primary-700 border border-primary-200 font-medium',
  danger: 'bg-academic-danger/10 text-academic-danger border border-academic-danger/20 font-medium', // Alias for error
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

