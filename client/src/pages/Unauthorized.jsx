import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Unauthorized = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const back = () => {
    const paths = { superadmin: '/superadmin/dashboard', admin: '/admin/dashboard', school_user: '/school/dashboard' };
    navigate(paths[user?.role] || '/login');
  };
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Segoe UI',system-ui,sans-serif", background:'#f8fafc' }}>
      <div style={{ textAlign:'center' }}>
        <h1 style={{ fontSize:'5rem', margin:0, color:'#1e3a5f' }}>403</h1>
        <h2 style={{ color:'#1e293b' }}>Access Denied</h2>
        <p style={{ color:'#64748b' }}>You do not have permission to view this page.</p>
        <button onClick={back} style={{ background:'#1e3a5f', color:'#fff', border:'none', borderRadius:'8px', padding:'0.75rem 1.5rem', fontSize:'1rem', cursor:'pointer', marginTop:'1rem' }}>
          Go to my dashboard
        </button>
      </div>
    </div>
  );
};
export default Unauthorized;
