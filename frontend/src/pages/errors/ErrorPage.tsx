// Generic error page component
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';

interface ErrorPageProps {
  title?: string;
  message?: string;
  error?: Error | string;
  showRetry?: boolean;
  onRetry?: () => void;
}

export const ErrorPage = ({
  title = 'Error',
  message = 'Ha ocurrido un error inesperado',
  error,
  showRetry = true,
  onRetry,
}: ErrorPageProps) => {
  const navigate = useNavigate();

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <svg
                className="w-8 h-8 text-red-600 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <h1 className="text-2xl font-bold text-red-900">{title}</h1>
            </div>
            <p className="text-red-700 mb-4">{message}</p>
            
            {error && (import.meta.env.DEV || import.meta.env.MODE === 'development') && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium text-red-800 mb-2">
                  Detalles del error (solo en desarrollo)
                </summary>
                <pre className="bg-red-100 p-4 rounded text-xs overflow-auto">
                  {typeof error === 'string' ? error : error.toString()}
                </pre>
              </details>
            )}

            <div className="mt-6 flex flex-wrap gap-4">
              {showRetry && (
                <button
                  onClick={handleRetry}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Intentar de nuevo
                </button>
              )}
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Ir al inicio
              </button>
              <button
                onClick={() => navigate(-1)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Volver atrás
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

