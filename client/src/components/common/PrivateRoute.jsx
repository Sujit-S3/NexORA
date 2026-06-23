// NexORA — PrivateRoute Guard
// Redirects unauthenticated users to /login, preserving the intended destination.

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@context/AuthContext';
import Spinner from './Spinner';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default PrivateRoute;
