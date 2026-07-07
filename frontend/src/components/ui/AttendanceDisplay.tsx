// Attendance display component with visual indicators
import { Badge } from './Badge';

interface AttendanceDisplayProps {
  asistencias: number;
  faltas: number;
  retardos?: number;
  porcentaje?: number;
  showDetails?: boolean;
  showProgressBar?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const getAttendanceColor = (porcentaje: number): string => {
  if (porcentaje >= 80) return 'bg-primary';
  if (porcentaje >= 60) return 'bg-secondary';
  return 'bg-error';
};

const getAttendanceVariant = (porcentaje: number): 'success' | 'warning' | 'error' => {
  if (porcentaje >= 80) return 'success';
  if (porcentaje >= 60) return 'warning';
  return 'error';
};

export const AttendanceDisplay = ({
  asistencias,
  faltas,
  retardos = 0,
  porcentaje,
  showDetails = true,
  showProgressBar = true,
  size = 'md',
  className = '',
}: AttendanceDisplayProps) => {
  const total = asistencias + faltas;
  const calculatedPercentage = total > 0 ? (asistencias / total) * 100 : 0;
  const displayPercentage = porcentaje !== undefined ? porcentaje : calculatedPercentage;

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {showProgressBar && (
        <div className="w-full bg-surface-container-high rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full transition-all ${getAttendanceColor(displayPercentage)}`}
            style={{ width: `${Math.min(displayPercentage, 100)}%` }}
            title={`${displayPercentage.toFixed(1)}% de asistencia`}
          />
        </div>
      )}
      
      {showDetails && (
        <div className={`flex items-center gap-2 ${sizeClasses[size]}`}>
          <div className="flex items-center gap-1 text-on-surface-variant">
            <span className="font-medium text-primary">{asistencias}</span>
            <span className="text-outline">asistencias</span>
          </div>
          <span className="text-outline-variant">|</span>
          <div className="flex items-center gap-1 text-on-surface-variant">
            <span className="font-medium text-error">{faltas}</span>
            <span className="text-outline">faltas</span>
          </div>
          {retardos > 0 && (
            <>
              <span className="text-outline-variant">|</span>
              <div className="flex items-center gap-1 text-on-surface-variant">
                <span className="font-medium text-on-secondary-fixed-variant">{retardos}</span>
                <span className="text-outline">retardos</span>
              </div>
            </>
          )}
          <div className="ml-auto">
            <Badge variant={getAttendanceVariant(displayPercentage)}>
              {displayPercentage.toFixed(1)}%
            </Badge>
          </div>
        </div>
      )}
      
      {!showDetails && (
        <div className="flex items-center justify-between">
          <span className={sizeClasses[size]}>
            {asistencias}/{total} ({displayPercentage.toFixed(1)}%)
          </span>
          <Badge variant={getAttendanceVariant(displayPercentage)}>
            {displayPercentage.toFixed(1)}%
          </Badge>
        </div>
      )}
    </div>
  );
};






