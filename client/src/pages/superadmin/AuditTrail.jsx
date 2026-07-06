import { useState, useEffect, useCallback, useRef } from 'react';
import Layout from '../../components/layout/Layout';
import StatusBadge from '../../components/common/StatusBadge';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { exportPDF, exportExcel, exportWord } from '../../utils/exportReport';

const EXPORT_FORMATS = [
  { key: 'pdf',   label: 'PDF',   icon: '📄' },
  { key: 'excel', label: 'Excel', icon: '📊' },
  { key: 'word',  label: 'Word',  icon: '📝' },
  { key: 'csv',   label: 'CSV',   icon: '📃' },
];

const EVENT_ICONS = {
  'School Created':      '🏫',
  'Status Changed':      '🔄',
  'Document Uploaded':   '📄',
  'Approved / Rejected': '⚖️',
  'Admin Changed':       '👤',
  'Message Sent':        '💬',
  'Archived':            '🗄️',
};

const EVENT_COLORS = {
  'School Created':      { bg: '#d1fae5', color: '#065f46' },
  'Status Changed':      { bg: '#dbeafe', color: '#1d4ed8' },
  'Document Uploaded':   { bg: '#fef9c3', color: '#854d0e' },
  'Approved / Rejected': { bg: '#ede9fe', color: '#6d28d9' },
  'Admin Changed':       { bg: '#ffedd5', color: '#9a3412' },
  'Message Sent':        { bg: '#d1fae5', color: '#065f46' },
  'Archived':            { bg: '#f1f5f9', color: '#475569' },
};

const AuditTrail = () => {
  const { user } = useAuth();
  const [logs,    setLogs]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);
  const [filters, setFilters] = useState({ eventType: '', fromDate: '', toDate: '', schoolSearch: '' });
  const [exporting,  setExporting]  = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef(null);
  const limit = 25;

  // Close export dropdown on outside click
  useEffect(() => {
    const onClick = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) setExportOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit, format: 'json' });
      if (filters.eventType)   params.set('eventType', filters.eventType);
      if (filters.fromDate)    params.set('fromDate',  filters.fromDate);
      if (filters.toDate)      params.set('toDate',    filters.toDate);

      const res = await API.get(`/reports/audit-trail?${params}`);
      setLogs(res.data.rows    || []);
      setTotal(res.data.total  || 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleExport = async (fmt) => {
    setExportOpen(false);
    setExporting(true);
    try {
      const params = new URLSearchParams({ limit: 10000, ...Object.fromEntries(Object.entries(filters).filter(([,v]) => v)) });

      if (fmt === 'csv') {
        params.set('format', 'csv');
        const token = localStorage.getItem('accessToken');
        const res  = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/reports/audit-trail?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const blob = await res.blob();
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `audit_trail_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        return;
      }

      const res  = await API.get(`/reports/audit-trail?${params}`);
      const rows = res.data?.rows || [];
      if (rows.length === 0) { alert('No audit records available to export.'); return; }

      if (fmt === 'pdf')   exportPDF(rows, 'Audit Trail', 'audit_trail');
      if (fmt === 'excel') exportExcel(rows, 'Audit Trail', 'audit_trail');
      if (fmt === 'word')  exportWord(rows, 'Audit Trail', 'audit_trail');
    } catch (e) {
      console.error(e);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  const filteredLogs = filters.schoolSearch
    ? logs.filter(l => l['School']?.toLowerCase().includes(filters.schoolSearch.toLowerCase()))
    : logs;

  return (
    <Layout>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.1rem', fontWeight: '800', color: '#1e293b' }}>📋 Audit Trail</h2>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
            {user?.role === 'admin'
              ? 'Activity on your assigned schools and your own actions'
              : 'Complete searchable history of all platform changes'} · {total} records
          </p>
        </div>
        <div ref={exportRef} style={{ position: 'relative' }}>
          <button onClick={() => setExportOpen(o => !o)} disabled={exporting}
            style={{ padding: '0.55rem 1.1rem', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}>
            ⬇ {exporting ? 'Exporting...' : 'Export Report'} <span style={{ fontSize: '0.6rem' }}>▼</span>
          </button>
          {exportOpen && (
            <div style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 50, minWidth: '150px', padding: '4px', overflow: 'hidden' }}>
              {EXPORT_FORMATS.map(f => (
                <button key={f.key} onClick={() => handleExport(f.key)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '0.55rem 0.75rem', border: 'none', borderRadius: '7px', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', background: 'transparent', color: '#374151', fontSize: '0.8rem', fontWeight: '600' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <span>{f.icon}</span> {f.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div style={{ ...card, marginBottom: '1.25rem', display: 'flex', gap: '0.625rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input type="text" placeholder="Search school name..." value={filters.schoolSearch}
          onChange={e => setFilters(f => ({ ...f, schoolSearch: e.target.value }))}
          style={{ ...fInput, width: '200px' }} />

        <select value={filters.eventType} onChange={e => { setFilters(f => ({ ...f, eventType: e.target.value })); setPage(1); }} style={fSelect}>
          <option value="">All Event Types</option>
          {Object.keys(EVENT_ICONS).map(e => <option key={e} value={e}>{e}</option>)}
        </select>

        <input type="date" value={filters.fromDate} onChange={e => { setFilters(f => ({ ...f, fromDate: e.target.value })); setPage(1); }} style={fInput} />
        <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>to</span>
        <input type="date" value={filters.toDate} onChange={e => { setFilters(f => ({ ...f, toDate: e.target.value })); setPage(1); }} style={fInput} />

        <button onClick={() => { setFilters({ eventType: '', fromDate: '', toDate: '', schoolSearch: '' }); setPage(1); }}
          style={{ padding: '0.4rem 0.75rem', background: '#f1f5f9', border: 'none', borderRadius: '7px', cursor: 'pointer', fontSize: '0.78rem', color: '#64748b', fontFamily: 'inherit' }}>
          Clear
        </button>
      </div>

      {/* Timeline */}
      <div style={card}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>Loading audit trail...</div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📋</div>
            <div style={{ fontWeight: '600', color: '#475569' }}>No audit records found</div>
          </div>
        ) : (
          <div>
            {filteredLogs.map((log, i) => {
              const ec = EVENT_COLORS[log['Event']] || { bg: '#f1f5f9', color: '#475569' };
              return (
                <div key={i} style={{ display: 'flex', gap: '1rem', padding: '0.875rem 0', borderBottom: i < filteredLogs.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                  {/* Event icon */}
                  <div style={{ width: '38px', height: '38px', borderRadius: '9px', background: ec.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
                    {EVENT_ICONS[log['Event']] || '📋'}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#1e293b' }}>{log['School'] || 'Platform'}</span>
                      <span style={{ fontSize: '0.7rem', background: ec.bg, color: ec.color, padding: '1px 7px', borderRadius: '10px', fontWeight: '600' }}>{log['Event']}</span>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '4px' }}>{log['Description'] || log['Remarks'] || '—'}</div>

                    {/* Previous → New value */}
                    {log['Previous'] && log['New Value'] && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.72rem', background: '#fee2e2', color: '#991b1b', padding: '1px 6px', borderRadius: '6px' }}>{log['Previous']}</span>
                        <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>→</span>
                        <span style={{ fontSize: '0.72rem', background: '#d1fae5', color: '#065f46', padding: '1px 6px', borderRadius: '6px' }}>{log['New Value']}</span>
                      </div>
                    )}

                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <span>👤 {log['Performed By']} ({log['Role']})</span>
                      <span>🕐 {log['Date']}</span>
                      {log['IP Address'] && <span>🌐 {log['IP Address']}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 0 0', marginTop: '0.5rem', borderTop: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              Showing {(page-1)*limit+1}–{Math.min(page*limit, total)} of {total}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button disabled={page === 1} onClick={() => setPage(p => p-1)}
                style={{ padding: '0.35rem 0.875rem', border: '1px solid #e2e8f0', borderRadius: '6px', background: page===1?'#f8fafc':'#fff', color: page===1?'#94a3b8':'#374151', cursor: page===1?'not-allowed':'pointer', fontSize: '0.82rem', fontFamily: 'inherit' }}>
                ← Prev
              </button>
              <span style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem', color: '#64748b' }}>
                {page} / {totalPages}
              </span>
              <button disabled={page === totalPages} onClick={() => setPage(p => p+1)}
                style={{ padding: '0.35rem 0.875rem', border: '1px solid #e2e8f0', borderRadius: '6px', background: page===totalPages?'#f8fafc':'#fff', color: page===totalPages?'#94a3b8':'#374151', cursor: page===totalPages?'not-allowed':'pointer', fontSize: '0.82rem', fontFamily: 'inherit' }}>
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

const card   = { background: '#fff', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' };
const fSelect= { padding: '0.4rem 0.625rem', border: '1.5px solid #e2e8f0', borderRadius: '7px', fontSize: '0.8rem', outline: 'none', background: '#fff', fontFamily: 'inherit' };
const fInput = { padding: '0.4rem 0.625rem', border: '1.5px solid #e2e8f0', borderRadius: '7px', fontSize: '0.8rem', outline: 'none', fontFamily: 'inherit' };

export default AuditTrail;
