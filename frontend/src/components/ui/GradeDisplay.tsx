// Grade display component with color coding
import { Badge } from './Badge';

interface GradeDisplayProps {
  grade: number | null | undefined;
  showBadge?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const getGradeColor = (grade: number | null | undefined): string => {
  if (grade === null || grade === undefined) return 'text-gray-500';
  if (grade >= 90) return 'text-green-600 font-semibold';
  if (grade >= 80) return 'text-blue-600 font-semibold';
  if (grade >= 70) return 'text-yellow-600 font-semibold';
  return 'text-red-600 font-semibold';
};

const getGradeVariant = (grade: number | null | undefined): 'success' | 'info' | 'warning' | 'error' | 'default' => {
  if (grade === null || grade === undefined) return 'default';
  if (grade >= 90) return 'success';
  if (grade >= 80) return 'info';
  if (grade >= 70) return 'warning';
  return 'error';
};

const getSizeClasses = (size: 'sm' | 'md' | 'lg'): string => {
  switch (size) {
    case 'sm':
      return 'text-sm';
    case 'md':
      return 'text-base';
    case 'lg':
      return 'text-lg';
    default:
      return 'text-base';
  }
};

export const GradeDisplay = ({
  grade,
  showBadge = false,
  size = 'md',
  className = '',
}: GradeDisplayProps) => {
  const formattedGrade = grade !== null && grade !== undefined ? grade.toFixed(1) : 'N/A';
  const colorClass = getGradeColor(grade);
  const sizeClass = getSizeClasses(size);

  if (showBadge && grade !== null && grade !== undefined) {
    return (
      <Badge variant={getGradeVariant(grade)} className={className}>
        {formattedGrade}
      </Badge>
    );
  }

  return (
    <span className={`${sizeClass} ${colorClass} ${className}`}>
      {formattedGrade}
    </span>
  );
};

// Component for displaying partial grades
interface PartialGradesDisplayProps {
  p1?: number | null;
  p2?: number | null;
  p3?: number | null;
  final?: number | null;
  showLabels?: boolean;
  className?: string;
}

export const PartialGradesDisplay = ({
  p1,
  p2,
  p3,
  final,
  showLabels = true,
  className = '',
}: PartialGradesDisplayProps) => {
  return (
    <div className={`flex flex-wrap gap-2 items-center ${className}`}>
      {p1 !== null && p1 !== undefined && (
        <div className="flex items-center gap-1">
          {showLabels && <span className="text-xs text-gray-500">P1:</span>}
          <GradeDisplay grade={p1} size="sm" />
        </div>
      )}
      {p2 !== null && p2 !== undefined && (
        <div className="flex items-center gap-1">
          {showLabels && <span className="text-xs text-gray-500">P2:</span>}
          <GradeDisplay grade={p2} size="sm" />
        </div>
      )}
      {p3 !== null && p3 !== undefined && (
        <div className="flex items-center gap-1">
          {showLabels && <span className="text-xs text-gray-500">P3:</span>}
          <GradeDisplay grade={p3} size="sm" />
        </div>
      )}
      {final !== null && final !== undefined && (
        <div className="flex items-center gap-1 border-l pl-2 ml-2">
          {showLabels && <span className="text-xs font-semibold text-gray-700">Final:</span>}
          <GradeDisplay grade={final} size="sm" />
        </div>
      )}
    </div>
  );
};






