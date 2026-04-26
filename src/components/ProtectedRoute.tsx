import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requirePartner?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false,
  requirePartner = false 
}) => {
  const { user, admin, partner, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      window.history.replaceState(null, '', requireAdmin ? '/admin/login' : '/signin');
    }
  }, [loading, user, requireAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={requireAdmin ? "/admin/login" : "/signin"} replace />;
  }

  if (requireAdmin && !admin) {
    return <Navigate to="/admin/login" replace />;
  }

  if (requirePartner && !partner) {
    return <Navigate to="/signin" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;