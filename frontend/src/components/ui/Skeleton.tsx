// Skeleton loading component
interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

export const Skeleton = ({ className = '', variant = 'text' }: SkeletonProps) => {
  const baseClasses = 'animate-pulse bg-gray-200';
  
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded',
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} />
  );
};

// Pre-built skeleton components
export const SkeletonText = ({ lines = 3, className = '' }: { lines?: number; className?: string }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          className={i === lines - 1 ? 'w-3/4' : 'w-full'}
        />
      ))}
    </div>
  );
};

export const SkeletonCard = () => {
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <Skeleton variant="rectangular" className="h-6 w-1/3 mb-4" />
      <SkeletonText lines={3} />
    </div>
  );
};

export const SkeletonTable = ({ rows = 5 }: { rows?: number }) => {
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <Skeleton variant="rectangular" className="h-6 w-1/4" />
      </div>
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 flex items-center gap-4">
            <Skeleton variant="circular" className="w-10 h-10" />
            <div className="flex-1 space-y-2">
              <Skeleton variant="text" className="w-1/3" />
              <Skeleton variant="text" className="w-1/4" />
            </div>
            <Skeleton variant="rectangular" className="h-8 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
};

