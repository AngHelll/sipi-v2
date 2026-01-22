// Loader component - Reusable loading spinner

export type LoaderSize = 'sm' | 'md' | 'lg' | 'xl';
export type LoaderVariant = 'spinner' | 'dots' | 'pulse' | 'bars';

interface LoaderProps {
  size?: LoaderSize;
  variant?: LoaderVariant;
  className?: string;
  fullScreen?: boolean;
  text?: string;
  overlay?: boolean;
}

const sizeClasses: Record<LoaderSize, string> = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

const borderSizeClasses: Record<LoaderSize, string> = {
  sm: 'border-2',
  md: 'border-2',
  lg: 'border-4',
  xl: 'border-4',
};

/**
 * Spinner variant - Classic rotating circle
 */
const SpinnerLoader = ({ size = 'md', className = '' }: { size?: LoaderSize; className?: string }) => {
  return (
    <div
      className={`${sizeClasses[size]} ${borderSizeClasses[size]} border-gray-200 border-t-blue-600 rounded-full animate-spin ${className}`}
      role="status"
      aria-label="Cargando"
    >
      <span className="sr-only">Cargando...</span>
    </div>
  );
};

/**
 * Dots variant - Three bouncing dots
 */
const DotsLoader = ({ size = 'md', className = '' }: { size?: LoaderSize; className?: string }) => {
  const dotSize = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4',
  }[size];

  return (
    <div className={`flex items-center gap-1.5 ${className}`} role="status" aria-label="Cargando">
      <div className={`${dotSize} bg-blue-600 rounded-full animate-bounce`} style={{ animationDelay: '0ms' }} />
      <div className={`${dotSize} bg-blue-600 rounded-full animate-bounce`} style={{ animationDelay: '150ms' }} />
      <div className={`${dotSize} bg-blue-600 rounded-full animate-bounce`} style={{ animationDelay: '300ms' }} />
      <span className="sr-only">Cargando...</span>
    </div>
  );
};

/**
 * Pulse variant - Pulsing circle
 */
const PulseLoader = ({ size = 'md', className = '' }: { size?: LoaderSize; className?: string }) => {
  return (
    <div
      className={`${sizeClasses[size]} bg-blue-600 rounded-full animate-pulse ${className}`}
      role="status"
      aria-label="Cargando"
    >
      <span className="sr-only">Cargando...</span>
    </div>
  );
};

/**
 * Bars variant - Three animated bars
 */
const BarsLoader = ({ size = 'md', className = '' }: { size?: LoaderSize; className?: string }) => {
  const barHeight = {
    sm: 'h-3',
    md: 'h-4',
    lg: 'h-6',
    xl: 'h-8',
  }[size];

  const barWidth = {
    sm: 'w-0.5',
    md: 'w-1',
    lg: 'w-1.5',
    xl: 'w-2',
  }[size];

  return (
    <div className={`flex items-end gap-1 ${className}`} role="status" aria-label="Cargando">
      <div
        className={`${barWidth} ${barHeight} bg-blue-600 rounded animate-pulse`}
        style={{ animationDelay: '0ms', animationDuration: '1s' }}
      />
      <div
        className={`${barWidth} ${barHeight} bg-blue-600 rounded animate-pulse`}
        style={{ animationDelay: '200ms', animationDuration: '1s' }}
      />
      <div
        className={`${barWidth} ${barHeight} bg-blue-600 rounded animate-pulse`}
        style={{ animationDelay: '400ms', animationDuration: '1s' }}
      />
      <span className="sr-only">Cargando...</span>
    </div>
  );
};

/**
 * Main Loader component
 */
export const Loader = ({
  size = 'md',
  variant = 'spinner',
  className = '',
  fullScreen = false,
  text,
  overlay = false,
}: LoaderProps) => {
  const renderLoader = () => {
    switch (variant) {
      case 'dots':
        return <DotsLoader size={size} />;
      case 'pulse':
        return <PulseLoader size={size} />;
      case 'bars':
        return <BarsLoader size={size} />;
      case 'spinner':
      default:
        return <SpinnerLoader size={size} />;
    }
  };

  const content = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      {renderLoader()}
      {text && (
        <p className="text-sm text-gray-600 font-medium animate-pulse">{text}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-90">
        {content}
      </div>
    );
  }

  if (overlay) {
    return (
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-white bg-opacity-75 rounded-lg">
        {content}
      </div>
    );
  }

  return content;
};

/**
 * Inline loader for buttons and small spaces
 */
export const InlineLoader = ({ size = 'sm', className = '' }: { size?: LoaderSize; className?: string }) => {
  return <SpinnerLoader size={size} className={className} />;
};

/**
 * Page loader - Full screen loader with text
 */
export const PageLoader = ({ text = 'Cargando...' }: { text?: string }) => {
  return (
    <Loader
      variant="spinner"
      size="lg"
      fullScreen
      text={text}
    />
  );
};

/**
 * Button loader - Small spinner for buttons
 */
export const ButtonLoader = ({ className = '' }: { className?: string }) => {
  return <InlineLoader size="sm" className={className} />;
};

/**
 * Card loader - Overlay loader for cards
 */
export const CardLoader = ({ text }: { text?: string }) => {
  return (
    <Loader
      variant="spinner"
      size="md"
      overlay
      text={text}
    />
  );
};

