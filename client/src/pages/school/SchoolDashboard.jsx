import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/layout/Layout';
import StatusBadge from '../../components/common/StatusBadge';
import API from '../../api/axios';

const LIFECYCLE = [
  { stage:'School Created',      icon:'🏫', key:'New' },
  { stage:'Assigned to Admin',   icon:'👤', key:'Contacted' },
  { stage:'Contact Initiated',   icon:'📞', key:'Contacted' },
  { stage:'Documents Requested', icon:'📋', key:'Documents Pending' },
  { stage:'Documents Uploaded',  icon:'📁', key:'Documents Received' },
  { stage:'Verification',        icon:'🔍', key:'Verification' },
  { stage:'Approval / Rejection',icon:'⚖️', key:'Approved' },
  { stage:'Completed',           icon:'🎓', key:'Completed' },
  { stage:'Archived',            icon:'🗄️', key:'Archived' },
];

const STATUS_ORDER = ['New','Contacted','Documents Pending','Documents Received','Verification','Approved','Completed','Archived'];

const SchoolDashboard = () => {
  const { user } = useAuth();
  const [school,  setSchool]  = useState(null);
  const [history, setHistory] = useState([]);
  const [docs,    setDocs]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const schoolsRes = await API.get('/schools?limit=1');
        const mySchool   = schoolsRes.data.schools?.[0];
        if (mySchool) {
          setSchool(mySchool);
          const [histRes, docsRes] = await Promise.all([
            API.get(`/schools/${mySchool._id}/status-history`),
            API.get(`/schools/${mySchool._id}`),
          ]);
          setHistory(histRes.data.history || []);
          setDocs(docsRes.data.school?.internalNotes || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const currentIdx = STATUS_ORDER.indexOf(school?.currentStatus);

  // Profile completion calc
  const calcCompletion = (s) => {
    if (!s) return 0;
    const fields = [s.schoolName, s.email, s.phone, s.address?.city, s.address?.state, s.principal?.name, s.board, s.schoolType];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  };
  const completion = calcCompletion(school);

  return (
    <Layout>
      {loading ? <Loader /> : !school ? (
        <div style={{ textAlign:'center', padding:'5rem 2rem', color:'#64748b' }}>
          <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>🏫</div>
          <h3 style={{ margin:'0 0 0.5rem', color:'#1e293b' }}>No School Linked</h3>
          <p style={{ margin:0 }}>Please contact your admin to link your school to this account.</p>
        </div>
      ) : (
        <>
          {/* School Identity Card */}
          <div style={{ background:'linear-gradient(135deg,#1a3d30,#1e5f4e)', borderRadius:'14px', padding:'1.5rem', marginBottom:'1.5rem', color:'#fff' }}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:'1rem', flexWrap:'wrap' }}>
              <div style={{ width:'56px', height:'56px', borderRadius:'12px', background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.75rem', flexShrink:0 }}>
                🏫
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.6)', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.3rem' }}>Your School</div>
                <h2 style={{ margin:'0 0 0.3rem', fontSize:'1.3rem', fontWeight:'800' }}>{school.schoolName}</h2>
                <div style={{ fontSize:'0.82rem', color:'rgba(255,255,255,0.7)' }}>
                  {[school.board, school.schoolType, school.address?.city, school.address?.state].filter(Boolean).join(' · ')}
                </div>
                <div style={{ marginTop:'0.75rem', display:'flex', gap:'1rem', flexWrap:'wrap' }}>
                  <div>
                    <div style={{ fontSize:'0.65rem', color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:'0.05em' }}>Current Status</div>
                    <StatusBadge status={school.currentStatus} size="lg" />
                  </div>
                  <div>
                    <div style={{ fontSize:'0.65rem', color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:'0.05em' }}>Email</div>
                    <div style={{ fontSize:'0.82rem', fontWeight:'600' }}>{school.email}</div>
                  </div>
                  <div>
                    <div style={{ fontSize:'0.65rem', color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:'0.05em' }}>Phone</div>
                    <div style={{ fontSize:'0.82rem', fontWeight:'600' }}>{school.phone}</div>
                  </div>
                </div>
              </div>
              {/* Profile Completion */}
              <div style={{ textAlign:'center', flexShrink:0 }}>
                <svg width="72" height="72" viewBox="0 0 72 72">
                  <circle cx="36" cy="36" r="28" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="8" />
                  <circle cx="36" cy="36" r="28" fill="none" stroke="#fff" strokeWidth="8"
                    strokeDasharray={`${(completion/100)*175.9} 175.9`}
                    strokeDashoffset="43.98"
                    strokeLinecap="round"
                    style={{ transition:'stroke-dasharray 0.5s' }} />
                  <text x="36" y="40" textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff">{completion}%</text>
                </svg>
                <div style={{ fontSize:'0.65rem', color:'rgba(255,255,255,0.6)', marginTop:'2px' }}>Profile</div>
              </div>
            </div>
          </div>

          {/* Row: Lifecycle + Quick Info */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem', marginBottom:'1.25rem' }}>

            {/* Application Lifecycle */}
            <div style={card}>
              <h3 style={sectionTitle}>Application Timeline</h3>
              <div style={{ position:'relative', paddingLeft:'12px' }}>
                {/* Vertical line */}
                <div style={{ position:'absolute', left:'19px', top:'8px', bottom:'8px', width:'2px', background:'#f1f5f9', zIndex:0 }} />
                {LIFECYCLE.map((step, i) => {
                  const stepIdx = STATUS_ORDER.indexOf(step.key);
                  const done    = stepIdx >= 0 && stepIdx < currentIdx;
                  const current = step.key === school.currentStatus || (step.key === 'Contacted' && (school.currentStatus === 'Contacted' || school.currentStatus === 'New') && i === 1);
                  const isCurrent = school.currentStatus === step.key;
                  return (
                    <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:'0.875rem', marginBottom:'0.875rem', position:'relative', zIndex:1 }}>
                      <div style={{
                        width:'22px', height:'22px', borderRadius:'50%', flexShrink:0,
                        background: done ? '#1e5f4e' : isCurrent ? '#fff' : '#f1f5f9',
                        border: isCurrent ? '3px solid #1e5f4e' : done ? 'none' : '2px solid #e2e8f0',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize: done ? '0.6rem' : '0.55rem',
                        boxShadow: isCurrent ? '0 0 0 3px rgba(30,95,78,0.15)' : 'none',
                        transition:'all 0.2s',
                      }}>
                        {done ? '✓' : step.icon}
                      </div>
                      <div style={{ paddingTop:'2px', flex:1 }}>
                        <div style={{ fontSize:'0.82rem', fontWeight: isCurrent ? '700' : '500', color: done ? '#475569' : isCurrent ? '#1e5f4e' : '#94a3b8', display:'flex', alignItems:'center', gap:'0.5rem' }}>
                          {step.stage}
                          {isCurrent && <span style={{ fontSize:'0.6rem', background:'#1e5f4e', color:'#fff', padding:'1px 6px', borderRadius:'10px', fontWeight:'700' }}>CURRENT</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right column */}
            <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>

              {/* School Details */}
              <div style={card}>
                <h3 style={sectionTitle}>School Information</h3>
                <div style={{ display:'flex', flexDirection:'column', gap:'0.625rem' }}>
                  {[
                    { label:'Registration No.', value: school.registrationNumber || 'Not provided' },
                    { label:'Board',             value: school.board || 'Not specified' },
                    { label:'Type',              value: school.schoolType || 'Not specified' },
                    { label:'Principal',         value: school.principal?.name || 'Not specified' },
                    { label:'Principal Email',   value: school.principal?.email || 'Not specified' },
                    { label:'City',              value: school.address?.city || '—' },
                    { label:'State',             value: school.address?.state || '—' },
                    { label:'Pincode',           value: school.address?.pincode || '—' },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'0.375rem 0', borderBottom:'1px solid #f8fafc' }}>
                      <span style={{ fontSize:'0.75rem', color:'#94a3b8', fontWeight:'600' }}>{label}</span>
                      <span style={{ fontSize:'0.78rem', color:'#1e293b', fontWeight:'500', textAlign:'right', maxWidth:'60%', wordBreak:'break-word' }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pending Actions */}
              <div style={card}>
                <h3 style={sectionTitle}>Pending Actions</h3>
                <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
                  {school.currentStatus === 'Documents Pending' && (
                    <Action icon="📄" text="Upload required documents" color="#9a3412" bg="#fff8f0" border="#fed7aa" />
                  )}
                  {completion < 100 && (
                    <Action icon="✏️" text={`Complete your profile (${completion}% done)`} color="#1d4ed8" bg="#eff6ff" border="#bfdbfe" />
                  )}
                  {school.currentStatus === 'New' && (
                    <Action icon="⏳" text="Waiting for admin to contact you" color="#92400e" bg="#fffbeb" border="#fde68a" />
                  )}
                  {['Approved','Completed'].includes(school.currentStatus) && (
                    <div style={{ textAlign:'center', padding:'1rem', color:'#065f46', fontSize:'0.85rem', fontWeight:'600' }}>
                      🎉 No pending actions — all good!
                    </div>
                  )}
                  {!['Documents Pending','New','Approved','Completed'].includes(school.currentStatus) && completion >= 100 && (
                    <div style={{ textAlign:'center', padding:'0.75rem', color:'#64748b', fontSize:'0.82rem' }}>No pending actions</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Status History */}
          <div style={card}>
            <h3 style={sectionTitle}>Status History</h3>
            {history.length === 0 ? (
              <div style={{ textAlign:'center', padding:'1.5rem', color:'#94a3b8', fontSize:'0.85rem' }}>No status changes recorded yet</div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column' }}>
                {history.map((h, i) => (
                  <div key={h._id} style={{ display:'flex', gap:'1rem', paddingBottom: i < history.length-1 ? '1rem' : 0, marginBottom: i < history.length-1 ? '0' : 0, position:'relative' }}>
                    {i < history.length-1 && (
                      <div style={{ position:'absolute', left:'7px', top:'20px', bottom:0, width:'2px', background:'#f1f5f9' }} />
                    )}
                    <div style={{ width:'16px', height:'16px', borderRadius:'50%', background:'#1e5f4e', flexShrink:0, marginTop:'3px', zIndex:1 }} />
                    <div style={{ flex:1, paddingBottom:'1rem', borderBottom: i < history.length-1 ? '1px solid #f8fafc' : 'none' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'4px', flexWrap:'wrap' }}>
                        {h.oldStatus
                          ? <><StatusBadge status={h.oldStatus} size="sm" /><span style={{ color:'#94a3b8', fontSize:'0.8rem' }}>→</span><StatusBadge status={h.newStatus} size="sm" /></>
                          : <><span style={{ fontSize:'0.75rem', color:'#94a3b8' }}>Started as</span><StatusBadge status={h.newStatus} size="sm" /></>
                        }
                      </div>
                      {h.remarks && <div style={{ fontSize:'0.78rem', color:'#64748b', fontStyle:'italic', marginBottom:'4px' }}>"{h.remarks}"</div>}
                      <div style={{ fontSize:'0.7rem', color:'#94a3b8' }}>
                        {h.updatedBy?.name} · {new Date(h.createdAt).toLocaleString('en-IN',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </Layout>
  );
};

const Action = ({ icon, text, color, bg, border }) => (
  <div style={{ display:'flex', alignItems:'center', gap:'0.625rem', padding:'0.625rem 0.875rem', background:bg, border:`1px solid ${border}`, borderRadius:'8px' }}>
    <span style={{ fontSize:'1rem' }}>{icon}</span>
    <span style={{ fontSize:'0.8rem', fontWeight:'600', color }}>{text}</span>
  </div>
);

const card        = { background:'#fff', borderRadius:'12px', padding:'1.25rem', boxShadow:'0 1px 3px rgba(0,0,0,0.06)', border:'1px solid #f1f5f9' };
const sectionTitle = { margin:'0 0 1rem', fontSize:'0.9rem', fontWeight:'700', color:'#1e293b' };
const Loader       = () => <div style={{ textAlign:'center', padding:'4rem', color:'#94a3b8' }}>Loading your dashboard...</div>;

export default SchoolDashboard;
