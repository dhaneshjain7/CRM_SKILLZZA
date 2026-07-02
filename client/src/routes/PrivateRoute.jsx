import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Shows a spinner while auth state is being verified on mount
const Spinner = () => (
  <div style={{
    display:        'flex',
    justifyContent: 'center',
    alignItems:     'center',
    height:         '100vh',
    fontSize:       '1.2rem',
    color:          '#1e3a5f',
  }}>
    <div style={{
      width:  '40px',
      height: '40px',
      border: '4px solid #e2e8f0',
      borderTop: '4px solid #1e3a5f',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// ── PrivateRoute ──────────────────────────────────────────────────────────────
// Wraps any route that requires authentication.
// Usage in App.jsx:
//   <Route element={<PrivateRoute />}>
//     <Route path="/dashboard" element={<Dashboard />} />
//   </Route>

const PrivateRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <Spinner />;

  return isAuthenticated
    ? <Outlet />
    : <Navigate to="/login" state={{ from: location }} replace />;
};

export default PrivateRoute;
