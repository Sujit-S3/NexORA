// NexORA — AdminRoute Guard
// Must be used inside PrivateRoute. Redirects non-admin users to home.

import { Navigate } from 'react-router-dom';
import { useAuth } from '@context/AuthContext';
import Spinner from './Spinner';

const AdminRoute = ({ children }) => {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;
