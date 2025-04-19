
import { ReactNode, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/ui/spinner';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: string[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, userRole, isLoading, signOut } = useAuth();
  const navigate = useNavigate();

  // Force logout if session seems invalid
  useEffect(() => {
    // If we're not loading and there's no valid user or role when we should have one
    if (!isLoading && (!user || !userRole)) {
      console.log('Invalid session detected in protected route, forcing logout');
      // Clear any lingering session data
      signOut().then(() => {
        navigate('/', { replace: true });
      });
    }
  }, [isLoading, user, userRole, signOut, navigate]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner className="h-8 w-8" />
        <span className="ml-2 text-lg">Loading authentication...</span>
      </div>
    );
  }

  // If not authenticated, redirect to landing page
  if (!user || !userRole) {
    console.log('User not authenticated, redirecting to landing page');
    return <Navigate to="/" replace />;
  }

  // If user doesn't have the required role, redirect to dashboard or landing page
  if (!allowedRoles.includes(userRole)) {
    console.log(`User has role ${userRole} but needs one of: ${allowedRoles.join(', ')}`);
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
