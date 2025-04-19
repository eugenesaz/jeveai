
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: string[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, userRole, isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return <div>Loading...</div>;
  }

  // If not authenticated, redirect to landing page
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // If user doesn't have the required role, redirect to dashboard or landing page
  if (!userRole || !allowedRoles.includes(userRole)) {
    if (userRole === 'influencer') {
      return <Navigate to="/dashboard" replace />;
    } else if (userRole === 'customer') {
      return <Navigate to="/" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};
