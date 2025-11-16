// Reusable error display component
import { useState } from 'react';

interface ErrorDisplayProps {
  error: string | Error | null;
  onRetry?: () => void;
  className?: string;
  showDetails?: boolean;
}

export const ErrorDisplay = ({
  error,
  onRetry,
  className = '',
  showDetails = false,
}: ErrorDisplayProps) => {
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  if (!error) return null;

  const errorMessage =
    typeof error === 'string' ? error : error.message || 'Ha ocurrido un error';

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <svg
          className="w-5 h-5 text-red-600 shrink-0 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div className="flex-1">
          <p className="text-red-800 font-medium">{errorMessage}</p>
          {showDetails && error instanceof Error && error.stack && (
            <details className="mt-2">
              <summary
                className="cursor-pointer text-sm text-red-600 hover:text-red-800"
                onClick={() => setShowErrorDetails(!showErrorDetails)}
              >
                {showErrorDetails ? 'Ocultar' : 'Mostrar'} detalles técnicos
              </summary>
              {showErrorDetails && (
                <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto">
                  {error.stack}
                </pre>
              )}
            </details>
          )}
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-red-600 hover:text-red-800 transition-colors shrink-0"
            title="Reintentar"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

