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
  if (porcentaje >= 80) return 'bg-green-600';
  if (porcentaje >= 60) return 'bg-yellow-600';
  return 'bg-red-600';
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
        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
          <div
            className={`h-2.5 rounded-full transition-all ${getAttendanceColor(displayPercentage)}`}
            style={{ width: `${Math.min(displayPercentage, 100)}%` }}
            title={`${displayPercentage.toFixed(1)}% de asistencia`}
          />
        </div>
      )}
      
      {showDetails && (
        <div className={`flex items-center gap-2 ${sizeClasses[size]}`}>
          <div className="flex items-center gap-1 text-gray-600">
            <span className="font-medium text-green-600">{asistencias}</span>
            <span className="text-gray-500">asistencias</span>
          </div>
          <span className="text-gray-300">|</span>
          <div className="flex items-center gap-1 text-gray-600">
            <span className="font-medium text-red-600">{faltas}</span>
            <span className="text-gray-500">faltas</span>
          </div>
          {retardos > 0 && (
            <>
              <span className="text-gray-300">|</span>
              <div className="flex items-center gap-1 text-gray-600">
                <span className="font-medium text-yellow-600">{retardos}</span>
                <span className="text-gray-500">retardos</span>
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






