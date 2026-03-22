import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, accessToken } = useAuthStore();

  if (!accessToken) return <Navigate to="/login" replace />;

  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(user?.role)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};
