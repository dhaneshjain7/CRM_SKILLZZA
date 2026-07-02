import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ── RoleRoute ─────────────────────────────────────────────────────────────────
// Restricts a route to specific roles.
// Usage in App.jsx:
//   <Route element={<RoleRoute roles={['superadmin']} />}>
//     <Route path="/admin-management" element={<AdminManagement />} />
//   </Route>

const RoleRoute = ({ roles = [] }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (roles.length > 0 && !roles.includes(user?.role)) {
    // Redirect to their own dashboard instead of a blank 403
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default RoleRoute;
