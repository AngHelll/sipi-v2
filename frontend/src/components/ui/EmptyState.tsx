// Empty state component for when there's no data
import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: IconName;
  action?: ReactNode;
}

export const EmptyState = ({ title, description, icon, action }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && (
        <div className="mb-4 p-4 bg-surface-container rounded-full">
          <Icon name={icon} size={48} className="text-outline-variant" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-on-surface mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-on-surface-variant max-w-md mb-4">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-4">
          {action}
        </div>
      )}
    </div>
  );
};

