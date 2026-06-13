/**
 * Wraps login pages. If the user is already authenticated,
 * redirect them straight to their own dashboard.
 */
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_HOME = {
  admin: '/admin/dashboard',
  maintenance_staff: '/staff/dashboard',
  end_user: '/user/dashboard',
};

export default function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-600" />
          <p className="text-sm font-medium">Loading…</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to={ROLE_HOME[user.role_type] || '/'} replace />;
  }

  return children;
}
