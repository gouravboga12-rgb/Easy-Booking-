import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export default function ProtectedRoute({ children, roles }) {
  const user = useAuthStore(s => s.user);
  if (!user) {
    if (roles && roles.includes('worker')) {
      return <Navigate to="/login-worker" replace />;
    }
    return <Navigate to="/login" replace />;
  }
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children ?? <Outlet />;
}
