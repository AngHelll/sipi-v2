// Modal component to warn user about inactivity timeout
import { useEffect, useState } from 'react';
import { Icon } from './ui/Icon';

interface InactivityWarningModalProps {
  /**
   * Remaining time in milliseconds
   */
  remainingMs: number;
  /**
   * Callback when user clicks "Continuar Sesión"
   */
  onContinue: () => void;
  /**
   * Callback when timeout is reached (for cleanup)
   */
  onTimeout?: () => void;
}

/**
 * Modal that warns user about inactivity timeout
 * Shows countdown and option to continue session
 */
export const InactivityWarningModal = ({
  remainingMs,
  onContinue,
  onTimeout,
}: InactivityWarningModalProps) => {
  const [remaining, setRemaining] = useState(remainingMs);

  // Update countdown every second
  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining((prev) => {
        const newRemaining = prev - 1000;
        
        // If time runs out, trigger timeout callback
        if (newRemaining <= 0) {
          clearInterval(interval);
          onTimeout?.();
          return 0;
        }
        
        return newRemaining;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onTimeout]);

  // Format remaining time
  const formatTime = (ms: number): string => {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    if (minutes > 0) {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${seconds}s`;
  };

  const minutes = Math.ceil(remaining / 60000);
  const isUrgent = minutes <= 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
            isUrgent ? 'bg-red-100' : 'bg-orange-100'
          }`}>
            <Icon
              name={isUrgent ? 'warning' : 'info'}
              size={24}
              className={isUrgent ? 'text-red-600' : 'text-orange-600'}
            />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              Sesión por Expirar
            </h2>
            <p className="text-sm text-gray-600">
              Tu sesión se cerrará automáticamente por inactividad
            </p>
          </div>
        </div>

        {/* Countdown */}
        <div className="mb-6">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {formatTime(remaining)}
            </div>
            <p className="text-sm text-gray-600">
              {isUrgent
                ? 'Tiempo restante antes de cerrar sesión'
                : 'Tiempo restante antes de cerrar sesión'}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-1000 ${
                isUrgent ? 'bg-red-500' : 'bg-orange-500'
              }`}
              style={{
                width: `${Math.min(100, (remaining / (5 * 60 * 1000)) * 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Message */}
        <div className="mb-6">
          <p className="text-sm text-gray-700">
            {isUrgent
              ? '⚠️ Tu sesión se cerrará en breve. Haz clic en "Continuar Sesión" para mantenerte conectado.'
              : 'Para mantener tu sesión activa, haz clic en "Continuar Sesión" o realiza alguna acción en la página.'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onContinue}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Icon name="check" size={18} />
            Continuar Sesión
          </button>
        </div>
      </div>
    </div>
  );
};
