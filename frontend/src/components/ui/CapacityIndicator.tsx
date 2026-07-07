// Capacity indicator component for groups
import { Badge } from './Badge';
import { Icon } from './Icon';

interface CapacityIndicatorProps {
  current: number;
  max: number;
  min?: number;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const CapacityIndicator = ({
  current,
  max,
  min = 5,
  showDetails = true,
  size = 'md',
  className = '',
}: CapacityIndicatorProps) => {
  const available = max - current;
  const percentage = max > 0 ? (current / max) * 100 : 0;
  const isFull = current >= max;
  const isLow = available <= 3;
  const isBelowMin = current < min;

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const getVariant = (): 'success' | 'warning' | 'error' | 'info' => {
    if (isFull) return 'error';
    if (isLow) return 'warning';
    if (isBelowMin) return 'info';
    return 'success';
  };

  const getColor = (): string => {
    if (isFull) return 'text-error';
    if (isLow) return 'text-on-secondary-fixed-variant';
    if (isBelowMin) return 'text-primary';
    return 'text-primary';
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showDetails && (
        <>
          <div className={`flex items-center gap-1 ${sizeClasses[size]} ${getColor()}`}>
            <span className="font-semibold">{current}</span>
            <span className="text-on-surface-variant">/</span>
            <span className="font-semibold">{max}</span>
          </div>
          <div className="flex-1 bg-surface-container-high rounded-full h-2 max-w-24">
            <div
              className={`h-2 rounded-full transition-all ${
                isFull ? 'bg-error' :
                isLow ? 'bg-secondary' :
                isBelowMin ? 'bg-primary' :
                'bg-primary'
              }`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
          <Badge variant={getVariant()}>
            {available} disponibles
          </Badge>
        </>
      )}
      
      {!showDetails && (
        <div className="flex items-center gap-2">
          <span className={`${sizeClasses[size]} ${getColor()} font-semibold`}>
            {current}/{max}
          </span>
          {isFull && (
            <div className="flex items-center gap-1 text-error">
              <Icon name="warning" size={16} />
              <span className="text-xs">Lleno</span>
            </div>
          )}
          {isLow && !isFull && (
            <div className="flex items-center gap-1 text-on-secondary-fixed-variant">
              <Icon name="warning" size={16} />
              <span className="text-xs">Pocos cupos</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};






