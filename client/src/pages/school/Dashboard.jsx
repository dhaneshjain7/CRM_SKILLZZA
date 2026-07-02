import { useAuth } from '../../context/AuthContext';

const SchoolDashboard = () => {
  const { user, logout } = useAuth();
  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>School Dashboard</h1>
          <p style={s.sub}>Welcome, {user?.name}</p>
        </div>
        <button onClick={logout} style={s.logoutBtn}>Logout</button>
      </div>
      <div style={s.grid}>
        {['Current Status','Documents','Messages','Profile'].map((label, i) => (
          <div key={i} style={s.card}>
            <p style={s.cardLabel}>{label}</p>
            <p style={s.cardValue}>-</p>
          </div>
        ))}
      </div>
      <div style={s.placeholder}><p>Full dashboard coming in Step 6</p></div>
    </div>
  );
};
const s = {
  page:{ minHeight:'100vh', background:'#f8fafc', fontFamily:"'Segoe UI',system-ui,sans-serif" },
  header:{ background:'#1e5f4e', color:'#fff', padding:'1.5rem 2rem', display:'flex', justifyContent:'space-between', alignItems:'center' },
  title:{ margin:0, fontSize:'1.5rem', fontWeight:'700' },
  sub:{ margin:'0.25rem 0 0', fontSize:'0.875rem', opacity:0.8 },
  logoutBtn:{ background:'rgba(255,255,255,0.15)', color:'#fff', border:'1px solid rgba(255,255,255,0.3)', borderRadius:'8px', padding:'0.5rem 1rem', cursor:'pointer' },
  grid:{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:'1rem', padding:'2rem' },
  card:{ background:'#fff', borderRadius:'12px', padding:'1.5rem', boxShadow:'0 1px 4px rgba(0,0,0,0.08)' },
  cardLabel:{ margin:'0 0 0.5rem', fontSize:'0.8rem', color:'#64748b', textTransform:'uppercase' },
  cardValue:{ margin:0, fontSize:'2rem', fontWeight:'700', color:'#1e5f4e' },
  placeholder:{ margin:'0 2rem', background:'#fff', borderRadius:'12px', padding:'3rem', textAlign:'center', color:'#64748b', boxShadow:'0 1px 4px rgba(0,0,0,0.08)' },
};
export default SchoolDashboard;
