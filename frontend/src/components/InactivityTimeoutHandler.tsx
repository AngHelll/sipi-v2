// Component to handle inactivity timeout warning modal
import { useAuth } from '../context/AuthContext';
import { InactivityWarningModal } from './InactivityWarningModal';

/**
 * Component that displays inactivity warning modal when needed
 * Should be placed at the root of the app (inside AuthProvider)
 */
export const InactivityTimeoutHandler = () => {
  const {
    showInactivityWarning,
    inactivityRemainingMs,
    dismissInactivityWarning,
    logout,
  } = useAuth();

  const handleContinue = () => {
    dismissInactivityWarning();
    // Activity will be detected automatically by the hook
  };

  const handleTimeout = async () => {
    // Timeout reached, logout user
    await logout();
  };

  if (!showInactivityWarning) {
    return null;
  }

  return (
    <InactivityWarningModal
      remainingMs={inactivityRemainingMs}
      onContinue={handleContinue}
      onTimeout={handleTimeout}
    />
  );
};
