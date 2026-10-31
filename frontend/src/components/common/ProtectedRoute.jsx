import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loading } from '../ui/Loading';

export function ProtectedRoute({ children, allowedRoles = null }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loading fullPage text="Authenticating…" />;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect customers to customer portal
    if (user.role === 'customer') return <Navigate to="/customer-portal" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
