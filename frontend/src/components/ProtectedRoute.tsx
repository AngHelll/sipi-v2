// Protected route component for role-based access control
import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { PageLoader } from './ui/Loader';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute = ({
  children,
  allowedRoles,
}: ProtectedRouteProps) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <PageLoader text="Cargando..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user) {
    // Normalize roles to strings for comparison
    const allowedRolesStrings = allowedRoles.map(role => String(role).trim());
    const userRoleString = String(user.role).trim();
    
    // Check if user role is in allowed roles
    const hasAccess = allowedRolesStrings.includes(userRoleString);
    
    if (!hasAccess) {
      // Only log in development mode
      if (import.meta.env.DEV) {
        console.warn('ProtectedRoute: Access denied', {
          userRole: userRoleString,
          allowedRoles: allowedRolesStrings,
          path: window.location.pathname,
        });
      }
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

