import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import API from '../api/axios';

const TRIGGER_ICONS = {
  'Status Updated':    '🔄',
  'New Message':       '💬',
  'Document Uploaded': '📄',
  'Admin Assigned':    '👤',
  'Password Changed':  '🔑',
  'School Created':    '🏫',
  'Document Approved': '✅',
  'Document Rejected': '❌',
  'Profile Updated':   '✏️',
  'System':            '🔔',
};

const TRIGGER_COLORS = {
  'Status Updated':    { bg: '#dbeafe', color: '#1d4ed8' },
  'New Message':       { bg: '#d1fae5', color: '#065f46' },
  'Document Uploaded': { bg: '#fef9c3', color: '#854d0e' },
  'Admin Assigned':    { bg: '#ede9fe', color: '#6d28d9' },
  'Password Changed':  { bg: '#fee2e2', color: '#991b1b' },
  'Document Approved': { bg: '#d1fae5', color: '#065f46' },
  'Document Rejected': { bg: '#fee2e2', color: '#991b1b' },
  'System':            { bg: '#f1f5f9', color: '#475569' },
};

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [unread,  setUnread]   = useState(0);
  const [loading, setLoading]  = useState(true);
  const [filter,  setFilter]   = useState('all'); // all | unread
  const [page,    setPage]     = useState(1);
  const [total,   setTotal]    = useState(0);
  const limit = 20;

  useEffect(() => { fetchNotifications(); }, [filter, page]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit });
      if (filter === 'unread') params.set('unreadOnly', 'true');
      const res = await API.get(`/notifications?${params}`);
      setNotifications(res.data.notifications || []);
      setUnread(res.data.unreadCount || 0);
      setTotal(res.data.total || 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleMarkRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnread(u => Math.max(0, u - 1));
    } catch (e) { console.error(e); }
  };

  const handleMarkAllRead = async () => {
    try {
      await API.put('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnread(0);
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
      setTotal(t => t - 1);
    } catch (e) { console.error(e); }
  };

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)  return 'just now';
    if (mins < 60) return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs} hour${hrs !== 1 ? 's' : ''} ago`;
    const days = Math.floor(hrs / 24);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <Layout>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.1rem', fontWeight: '800', color: '#1e293b' }}>
            Notifications {unread > 0 && <span style={{ fontSize: '0.75rem', background: '#1e3a5f', color: '#fff', borderRadius: '10px', padding: '2px 8px', fontWeight: '700', marginLeft: '8px', verticalAlign: 'middle' }}>{unread} unread</span>}
          </h2>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>{total} total notifications</p>
        </div>
        <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
          {/* Filter tabs */}
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '8px', padding: '3px' }}>
            {['all', 'unread'].map(f => (
              <button key={f} onClick={() => { setFilter(f); setPage(1); }}
                style={{ padding: '0.375rem 0.875rem', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', fontFamily: 'inherit', background: filter === f ? '#fff' : 'transparent', color: filter === f ? '#1e293b' : '#64748b', boxShadow: filter === f ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s', textTransform: 'capitalize' }}>
                {f}
              </button>
            ))}
          </div>
          {unread > 0 && (
            <button onClick={handleMarkAllRead}
              style={{ padding: '0.425rem 0.875rem', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}>
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Notifications list */}
      <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 2rem', color: '#94a3b8' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔔</div>
            <div style={{ fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </div>
            <div style={{ fontSize: '0.82rem' }}>Notifications will appear here when something happens</div>
          </div>
        ) : (
          notifications.map((n, i) => {
            const tc = TRIGGER_COLORS[n.triggerType] || { bg: '#f1f5f9', color: '#475569' };
            return (
              <div key={n._id}
                style={{ display: 'flex', gap: '1rem', padding: '1rem 1.25rem', borderBottom: i < notifications.length - 1 ? '1px solid #f8fafc' : 'none', background: n.isRead ? '#fff' : '#f8fbff', transition: 'background 0.1s' }}
              >
                {/* Icon */}
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: tc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0 }}>
                  {TRIGGER_ICONS[n.triggerType] || '🔔'}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '4px' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: n.isRead ? '500' : '700', color: '#1e293b' }}>{n.title}</div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, alignItems: 'center' }}>
                      {!n.isRead && (
                        <button onClick={() => handleMarkRead(n._id)}
                          style={{ fontSize: '0.7rem', color: '#1e3a5f', background: '#e8f0f9', border: 'none', borderRadius: '6px', padding: '2px 8px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600' }}>
                          Mark read
                        </button>
                      )}
                      <button onClick={() => handleDelete(n._id)}
                        style={{ fontSize: '0.8rem', color: '#cbd5e1', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#94a3b8'}
                        onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}
                        title="Remove">✕</button>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.5, marginBottom: '6px' }}>{n.message}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <span style={{ fontSize: '0.68rem', background: tc.bg, color: tc.color, padding: '1px 7px', borderRadius: '10px', fontWeight: '600' }}>{n.triggerType}</span>
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{timeAgo(n.createdAt)}</span>
                    {n.relatedSchool && <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>· {n.relatedSchool.schoolName}</span>}
                    {n.emailSent && <span style={{ fontSize: '0.65rem', color: '#22c55e' }}>✉ Email sent</span>}
                    {!n.isRead && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#1e3a5f', flexShrink: 0 }} />}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', padding: '0.875rem', borderTop: '1px solid #f1f5f9' }}>
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              style={{ padding: '0.35rem 0.875rem', border: '1px solid #e2e8f0', borderRadius: '6px', background: page === 1 ? '#f8fafc' : '#fff', color: page === 1 ? '#94a3b8' : '#374151', cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: '0.82rem', fontFamily: 'inherit' }}>
              ← Prev
            </button>
            <span style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem', color: '#64748b' }}>Page {page} of {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
              style={{ padding: '0.35rem 0.875rem', border: '1px solid #e2e8f0', borderRadius: '6px', background: page === totalPages ? '#f8fafc' : '#fff', color: page === totalPages ? '#94a3b8' : '#374151', cursor: page === totalPages ? 'not-allowed' : 'pointer', fontSize: '0.82rem', fontFamily: 'inherit' }}>
              Next →
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default NotificationsPage;
