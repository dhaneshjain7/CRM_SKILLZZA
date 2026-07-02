const StatCard = ({ label, value, icon, color = '#1e3a5f', bg = '#e8f0f9', trend, sub }) => (
  <div style={{ background:'#fff', borderRadius:'12px', padding:'1.25rem', display:'flex', alignItems:'flex-start', gap:'1rem', boxShadow:'0 1px 3px rgba(0,0,0,0.06)', border:'1px solid #f1f5f9', minWidth:0 }}>
    <div style={{ width:'46px', height:'46px', borderRadius:'10px', background:bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:'1.3rem' }}>
      {icon}
    </div>
    <div style={{ flex:1, minWidth:0 }}>
      <div style={{ fontSize:'0.72rem', color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'0.2rem', fontWeight:'600' }}>{label}</div>
      <div style={{ fontSize:'1.8rem', fontWeight:'800', color, lineHeight:1.1 }}>{value ?? '—'}</div>
      {sub  && <div style={{ fontSize:'0.72rem', color:'#64748b', marginTop:'0.25rem' }}>{sub}</div>}
      {trend && <div style={{ fontSize:'0.72rem', color:'#22c55e', marginTop:'0.2rem', fontWeight:'600' }}>{trend}</div>}
    </div>
  </div>
);

export default StatCard;
