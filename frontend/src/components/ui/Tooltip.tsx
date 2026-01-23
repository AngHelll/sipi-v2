// Tooltip component for informative hints
import { useState, type ReactNode } from 'react';

interface TooltipProps {
  content: string | ReactNode;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

const positionClasses = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

const arrowClasses = {
  top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-800',
  bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-800',
  left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-800',
  right: 'right-full top-1/2 -translate-y-1/2 border-r-gray-800',
};

export const Tooltip = ({
  content,
  children,
  position = 'top',
  className = '',
}: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={`absolute z-50 px-3 py-2 text-sm text-white bg-gray-800 rounded-lg shadow-lg whitespace-nowrap ${positionClasses[position]}`}
          role="tooltip"
        >
          {content}
          <div
            className={`absolute w-0 h-0 border-4 border-transparent ${arrowClasses[position]}`}
          />
        </div>
      )}
    </div>
  );
};

// Icon with tooltip helper
interface IconTooltipProps {
  icon: ReactNode;
  tooltip: string | ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const IconTooltip = ({ icon, tooltip, position = 'top' }: IconTooltipProps) => {
  return (
    <Tooltip content={tooltip} position={position}>
      <span className="inline-flex items-center text-gray-400 hover:text-gray-600 cursor-help">
        {icon}
      </span>
    </Tooltip>
  );
};






