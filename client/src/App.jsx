import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import PrivateRoute  from './routes/PrivateRoute';
import RoleRoute     from './routes/RoleRoute';

// Auth pages
import RoleSelect      from './pages/RoleSelect';
import SuperAdminLogin from './pages/login/SuperAdminLogin';
import AdminLogin      from './pages/login/AdminLogin';
import SchoolLogin     from './pages/login/SchoolLogin';
import Unauthorized    from './pages/Unauthorized';

// SuperAdmin
import SuperAdminDashboard         from './pages/superadmin/SuperAdminDashboard';
import { SuperAdminSchools }       from './pages/superadmin/Schools';

// Admin
import AdminDashboard              from './pages/admin/AdminDashboard';
import { AdminSchools }            from './pages/superadmin/Schools';

// School
import SchoolDashboard             from './pages/school/SchoolDashboard';

const RootRedirect = () => {
  const { isAuthenticated, user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/" replace />;
  const paths = { superadmin:'/superadmin/dashboard', admin:'/admin/dashboard', school_user:'/school/dashboard' };
  return <Navigate to={paths[user?.role] || '/'} replace />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/"                 element={<RoleSelect />} />
    <Route path="/login/superadmin" element={<SuperAdminLogin />} />
    <Route path="/login/admin"      element={<AdminLogin />} />
    <Route path="/login/school"     element={<SchoolLogin />} />
    <Route path="/login"            element={<Navigate to="/" replace />} />
    <Route path="/unauthorized"     element={<Unauthorized />} />
    <Route path="/dashboard"        element={<RootRedirect />} />

    {/* SuperAdmin */}
    <Route element={<RoleRoute roles={['superadmin']} />}>
      <Route path="/superadmin/dashboard" element={<SuperAdminDashboard />} />
      <Route path="/superadmin/schools"   element={<SuperAdminSchools />} />
    </Route>

    {/* Admin */}
    <Route element={<RoleRoute roles={['superadmin','admin']} />}>
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/schools"   element={<AdminSchools />} />
    </Route>

    {/* School */}
    <Route element={<RoleRoute roles={['school_user']} />}>
      <Route path="/school/dashboard" element={<SchoolDashboard />} />
    </Route>

    <Route element={<PrivateRoute />}></Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
);

export default App;
