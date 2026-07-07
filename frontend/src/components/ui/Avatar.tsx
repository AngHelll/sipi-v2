// Avatar component for user profile pictures
import { useState } from 'react';
import type { ReactNode } from 'react';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
};

const getInitials = (name: string): string => {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export const Avatar = ({ name, size = 'md', className = '', onClick }: AvatarProps) => {
  const initials = getInitials(name);

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-on-primary font-semibold shadow-md ${onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
    >
      {initials}
    </div>
  );
};

interface AvatarDropdownProps {
  name: string;
  role: string;
  children: ReactNode;
}

export const AvatarDropdown = ({ name, role, children }: AvatarDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Avatar
        name={name}
        size="md"
        onClick={() => setIsOpen(!isOpen)}
        className="ring-2 ring-offset-2 ring-primary"
      />
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-surface-container-lowest rounded-lg shadow-lg border border-outline-variant z-20 py-1">
            <div className="px-4 py-2 border-b border-outline-variant">
              <p className="text-sm font-medium text-on-surface">{name}</p>
              <p className="text-xs text-on-surface-variant">{role}</p>
            </div>
            {children}
          </div>
        </>
      )}
    </div>
  );
};

