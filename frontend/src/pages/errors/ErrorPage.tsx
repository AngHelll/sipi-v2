// Generic error page component
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { ds } from '../../lib/designSystem';

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
      <div className="max-w-2xl mx-auto">
        <div className={`${ds.banner.error} rounded-xl p-6 sm:p-8 shadow-metric`}>
          <div className="flex items-center gap-3 mb-4">
            <span className="material-symbols-outlined text-3xl text-error shrink-0">warning</span>
            <h1 className="font-headline text-headline-md text-on-error-container">{title}</h1>
          </div>
          <p className={`${ds.semantic.errorText} mb-4 text-body-md`}>{message}</p>

          {error && (import.meta.env.DEV || import.meta.env.MODE === 'development') && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-on-error-container mb-2">
                Detalles del error (solo en desarrollo)
              </summary>
              <pre className="bg-error-container/50 p-4 rounded-lg text-xs overflow-auto text-on-error-container">
                {typeof error === 'string' ? error : error.toString()}
              </pre>
            </details>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            {showRetry && (
              <button type="button" onClick={handleRetry} className={ds.btn.primary}>
                Intentar de nuevo
              </button>
            )}
            <button type="button" onClick={() => navigate('/')} className={ds.btn.secondary}>
              Ir al inicio
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className={ds.btn.secondary}
            >
              Volver atrás
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};
