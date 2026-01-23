// Authentication context for managing user state
import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';
import { UserRole } from '../types';
import { authApi } from '../lib/api';
import { useInactivityTimeout } from '../hooks/useInactivityTimeout';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (role: UserRole) => boolean;
  showInactivityWarning: boolean;
  inactivityRemainingMs: number;
  dismissInactivityWarning: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const [inactivityRemainingMs, setInactivityRemainingMs] = useState(0);

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { user } = await authApi.getMe();
        setUser(user);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    const response = await authApi.login({ username, password });
    setUser(response.user);
    // Reset inactivity warning when user logs in
    setShowInactivityWarning(false);
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
    setShowInactivityWarning(false);
  };

  // Handle inactivity timeout
  const handleInactivityTimeout = async () => {
    // Close warning if open
    setShowInactivityWarning(false);
    // Logout user
    await logout();
  };

  // Handle inactivity warning
  const handleInactivityWarning = (remainingMs: number) => {
    setInactivityRemainingMs(remainingMs);
    setShowInactivityWarning(true);
  };

  // Dismiss warning (user clicked continue)
  const dismissInactivityWarning = () => {
    setShowInactivityWarning(false);
    setInactivityRemainingMs(0);
  };

  // Configure inactivity timeout
  // Timeout: 30 minutes, Warning: 5 minutes before timeout
  const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
  const INACTIVITY_WARNING_MS = 5 * 60 * 1000; // 5 minutes before timeout

  useInactivityTimeout({
    timeoutMs: INACTIVITY_TIMEOUT_MS,
    warningMs: INACTIVITY_WARNING_MS,
    onWarning: handleInactivityWarning,
    onTimeout: handleInactivityTimeout,
    enabled: !!user, // Only enable when user is authenticated
  });

  const isAuthenticated = !!user;
  const hasRole = (role: UserRole) => user?.role === role;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated,
        hasRole,
        showInactivityWarning,
        inactivityRemainingMs,
        dismissInactivityWarning,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

