import { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import StatusBadge from '../../components/common/StatusBadge';
import API from '../../api/axios';

const REPORTS = [
  { key: 'schools',           label: 'Schools Report',       icon: '🏫', desc: 'All schools with full details, status and admin assignment' },
  { key: 'status',            label: 'Status Report',        icon: '📊', desc: 'Status distribution and recent status changes' },
  { key: 'growth',            label: 'Growth Report',        icon: '📈', desc: 'Monthly school registration trends' },
  { key: 'admin-performance', label: 'Admin Performance',    icon: '👥', desc: 'Admin-wise school completion and activity metrics' },
  { key: 'communication',     label: 'Communication Report', icon: '💬', desc: 'Message activity per school' },
  { key: 'audit-trail',       label: 'Audit Trail',          icon: '📋', desc: 'Complete searchable history of all changes' },
  { key: 'activity-logs',     label: 'Activity Logs',        icon: '⏱', desc: 'All user actions with timestamps and IP addresses' },
];

const SuperAdminReports = () => {
  const [active,  setActive]  = useState('schools');
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ status: '', state: '', board: '', fromDate: '', toDate: '', eventType: '', months: 12 });

  const fetchReport = async (type = active, fmt = 'json') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ format: fmt, ...Object.fromEntries(Object.entries(filters).filter(([,v]) => v)) });

      if (fmt === 'csv') {
        // Download CSV directly
        const token = localStorage.getItem('accessToken');
        const res   = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/reports/${type}?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const blob = await res.blob();
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `${type}_report_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        setLoading(false);
        return;
      }

      const res = await API.get(`/reports/${type}?${params}`);
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setData(null);
    fetchReport(active);
  }, [active]);

  const handleFilter = (e) => {
    e.preventDefault();
    fetchReport(active);
  };

  const currentReport = REPORTS.find(r => r.key === active);

  return (
    <Layout>
      <div style={{ display: 'flex', gap: '1.25rem' }}>

        {/* Left — Report selector */}
        <div style={{ width: '220px', flexShrink: 0 }}>
          <div style={card}>
            <div style={sectionTitle}>Report Types</div>
            {REPORTS.map(r => (
              <button key={r.key} onClick={() => setActive(r.key)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '0.6rem 0.75rem', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', marginBottom: '3px', background: active === r.key ? '#e8f0f9' : 'transparent', color: active === r.key ? '#1e3a5f' : '#475569', fontWeight: active === r.key ? '700' : '400', fontSize: '0.82rem' }}>
                <span>{r.icon}</span>
                <span>{r.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right — Report content */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Report header */}
          <div style={{ ...card, marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: '800', color: '#1e293b', marginBottom: '0.2rem' }}>
                  {currentReport?.icon} {currentReport?.label}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{currentReport?.desc}</div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button onClick={() => fetchReport(active, 'csv')} disabled={loading}
                  style={{ padding: '0.5rem 1rem', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', color: '#475569', fontFamily: 'inherit' }}>
                  ⬇ Export CSV
                </button>
                <button onClick={() => fetchReport(active)} disabled={loading}
                  style={{ padding: '0.5rem 1rem', background: '#1e3a5f', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', color: '#fff', fontFamily: 'inherit' }}>
                  {loading ? '...' : '↻ Refresh'}
                </button>
              </div>
            </div>

            {/* Filters */}
            <form onSubmit={handleFilter} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
              {['schools','communication','audit-trail'].includes(active) && (
                <>
                  <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} style={filterSelect}>
                    <option value="">All Statuses</option>
                    {['New','Contacted','Documents Pending','Documents Received','Verification','Approved','Rejected','Completed','Archived'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <input type="text" placeholder="State" value={filters.state} onChange={e => setFilters(f => ({ ...f, state: e.target.value }))} style={filterInput} />
                </>
              )}
              {active === 'schools' && (
                <input type="text" placeholder="Board" value={filters.board} onChange={e => setFilters(f => ({ ...f, board: e.target.value }))} style={filterInput} />
              )}
              {active === 'growth' && (
                <select value={filters.months} onChange={e => setFilters(f => ({ ...f, months: e.target.value }))} style={filterSelect}>
                  {[3,6,12,24].map(m => <option key={m} value={m}>Last {m} months</option>)}
                </select>
              )}
              {['audit-trail','activity-logs'].includes(active) && (
                <>
                  <input type="date" value={filters.fromDate} onChange={e => setFilters(f => ({ ...f, fromDate: e.target.value }))} style={filterInput} />
                  <input type="date" value={filters.toDate} onChange={e => setFilters(f => ({ ...f, toDate: e.target.value }))} style={filterInput} />
                </>
              )}
              {active === 'audit-trail' && (
                <select value={filters.eventType} onChange={e => setFilters(f => ({ ...f, eventType: e.target.value }))} style={filterSelect}>
                  <option value="">All Events</option>
                  {['School Created','Status Changed','Document Uploaded','Approved / Rejected','Admin Changed','Message Sent','Archived'].map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              )}
              <button type="submit" style={{ padding: '0.45rem 1rem', background: '#1e3a5f', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', color: '#fff', fontFamily: 'inherit' }}>
                Apply
              </button>
              <button type="button" onClick={() => { setFilters({ status:'', state:'', board:'', fromDate:'', toDate:'', eventType:'', months:12 }); fetchReport(active); }}
                style={{ padding: '0.45rem 0.75rem', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', color: '#64748b', fontFamily: 'inherit' }}>
                Clear
              </button>
            </form>
          </div>

          {/* Summary cards */}
          {data?.summary && <SummaryCards summary={data.summary} />}

          {/* Data table */}
          <div style={card}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>Generating report...</div>
            ) : !data ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>Select a report to view data</div>
            ) : data.rows?.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
                No data found for this report
              </div>
            ) : (
              <ReportTable rows={data.rows} reportKey={active} />
            )}

            {data && (
              <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid #f1f5f9', fontSize: '0.72rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
                <span>{data.rows?.length || 0} records shown {data.total ? `of ${data.total} total` : ''}</span>
                <span>Generated: {data.generatedAt ? new Date(data.generatedAt).toLocaleString('en-IN') : 'Just now'}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

// ── Summary Cards ─────────────────────────────────────────────────────────────
const SummaryCards = ({ summary }) => {
  const entries = Object.entries(summary).filter(([k]) => !['generatedAt','generatedBy'].includes(k));
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
      {entries.map(([key, val]) => {
        if (typeof val === 'object') return null;
        return (
          <div key={key} style={{ background: '#fff', borderRadius: '10px', padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9', textAlign: 'center' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#1e3a5f' }}>{val}</div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'capitalize', marginTop: '2px' }}>
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── Report Table ──────────────────────────────────────────────────────────────
const ReportTable = ({ rows, reportKey }) => {
  if (!rows || rows.length === 0) return null;
  const headers = Object.keys(rows[0]);

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
        <thead>
          <tr style={{ background: '#f8fafc' }}>
            {headers.map(h => (
              <th key={h} style={{ textAlign: 'left', padding: '0.6rem 0.875rem', fontSize: '0.68rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: i < rows.length - 1 ? '1px solid #f8fafc' : 'none' }}
              onMouseEnter={e => e.currentTarget.style.background = '#fafcff'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {headers.map(h => (
                <td key={h} style={{ padding: '0.6rem 0.875rem', color: '#374151', verticalAlign: 'middle', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {h === 'Status' ? <StatusBadge status={row[h]} size="sm" /> : row[h] || '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const card         = { background: '#fff', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' };
const sectionTitle = { fontSize: '0.85rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.75rem' };
const filterSelect = { padding: '0.4rem 0.625rem', border: '1.5px solid #e2e8f0', borderRadius: '7px', fontSize: '0.8rem', outline: 'none', background: '#fff', fontFamily: 'inherit', color: '#374151' };
const filterInput  = { padding: '0.4rem 0.625rem', border: '1.5px solid #e2e8f0', borderRadius: '7px', fontSize: '0.8rem', outline: 'none', fontFamily: 'inherit', color: '#374151', width: '130px' };

export default SuperAdminReports;
