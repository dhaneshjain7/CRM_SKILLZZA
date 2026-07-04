import { useState, useEffect, useRef, useCallback } from 'react';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import API from '../../api/axios';

const Messages = () => {
  const { user }                          = useAuth();
  const { socket, joinSchool, sendTyping }= useSocket();
  const [school,   setSchool]   = useState(null);
  const [messages, setMessages] = useState([]);
  const [content,  setContent]  = useState('');
  const [loading,  setLoading]  = useState(true);
  const [sending,  setSending]  = useState(false);
  const [search,   setSearch]   = useState('');
  const [searchQ,  setSearchQ]  = useState('');
  const [pinned,   setPinned]   = useState([]);
  const [showPinned, setShowPinned] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [unread,   setUnread]   = useState(0);
  const bottomRef  = useRef(null);
  const typingTimeout = useRef(null);
  const inputRef   = useRef(null);

  // Fetch school + messages
  useEffect(() => {
    const init = async () => {
      try {
        const res = await API.get('/schools?limit=1');
        const s   = res.data.schools?.[0];
        if (!s) return;
        setSchool(s);
        joinSchool(s._id);
        await fetchMessages(s._id);
        await fetchPinned(s._id);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    init();
  }, []);

  const fetchMessages = async (schoolId, q = '') => {
    const params = new URLSearchParams({ limit: 100 });
    if (q) params.set('search', q);
    const res = await API.get(`/messages/school/${schoolId}?${params}`);
    setMessages(res.data.messages || []);
  };

  const fetchPinned = async (schoolId) => {
    const res = await API.get(`/messages/school/${schoolId}/pinned`);
    setPinned(res.data.messages || []);
  };

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Socket listeners
  useEffect(() => {
    if (!socket || !school) return;

    const onNewMessage = (msg) => {
      setMessages(prev => {
        if (prev.find(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
      if (msg.sender._id !== user._id) {
        setUnread(u => u + 1);
        // Mark read after 1s
        setTimeout(() => API.put(`/messages/${msg._id}/read`).catch(() => {}), 1000);
      }
    };

    const onTyping = ({ userId, isTyping }) => {
      if (userId !== user._id) setOtherTyping(isTyping);
    };

    const onRead = ({ readBy }) => {
      if (readBy !== user._id) {
        setMessages(prev => prev.map(m => ({ ...m, isRead: true })));
      }
    };

    const onPinned = ({ messageId, isPinned }) => {
      setMessages(prev => prev.map(m => m._id === messageId ? { ...m, isPinned } : m));
      if (school) fetchPinned(school._id);
    };

    socket.on('new_message',   onNewMessage);
    socket.on('user_typing',   onTyping);
    socket.on('messages_read', onRead);
    socket.on('message_pinned',onPinned);

    return () => {
      socket.off('new_message',   onNewMessage);
      socket.off('user_typing',   onTyping);
      socket.off('messages_read', onRead);
      socket.off('message_pinned',onPinned);
    };
  }, [socket, school, user]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!content.trim() || !school || sending) return;
    setSending(true);
    try {
      await API.post('/messages/send', { schoolId: school._id, content: content.trim() });
      setContent('');
      inputRef.current?.focus();
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (e) => {
    setContent(e.target.value);
    if (school) {
      sendTyping(school._id, true);
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => sendTyping(school._id, false), 1500);
    }
  };

  const handlePin = async (msgId) => {
    await API.put(`/messages/${msgId}/pin`);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchQ(search);
    if (school) fetchMessages(school._id, search);
  };

  const displayMessages = messages;
  const grouped = groupByDate(displayMessages);

  return (
    <Layout>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Loading messages...</div>
      ) : !school ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
          <h3>No school linked to your account</h3>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '1.25rem', height: 'calc(100vh - 130px)' }}>

          {/* Left — School info + pinned */}
          <div style={{ width: '260px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* School card */}
            <div style={card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.75rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#e8f5f1', color: '#1e5f4e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '1rem', flexShrink: 0 }}>
                  {school.schoolName[0]}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{school.schoolName}</div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Chat with your Admin</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div style={{ flex: 1, textAlign: 'center', padding: '0.5rem', background: '#f8fafc', borderRadius: '6px' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1e293b' }}>{messages.length}</div>
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>Messages</div>
                </div>
                <div style={{ flex: 1, textAlign: 'center', padding: '0.5rem', background: '#f8fafc', borderRadius: '6px' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1e5f4e' }}>{pinned.length}</div>
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>Pinned</div>
                </div>
              </div>
            </div>

            {/* Pinned messages */}
            {pinned.length > 0 && (
              <div style={card}>
                <button onClick={() => setShowPinned(p => !p)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: showPinned ? '0.75rem' : 0, fontFamily: 'inherit' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#1e293b' }}>📌 Pinned ({pinned.length})</span>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{showPinned ? '▲' : '▼'}</span>
                </button>
                {showPinned && pinned.map(m => (
                  <div key={m._id} style={{ fontSize: '0.75rem', color: '#475569', padding: '0.5rem', background: '#fffbeb', borderRadius: '6px', marginBottom: '4px', borderLeft: '3px solid #f59e0b' }}>
                    <div style={{ fontWeight: '600', color: '#1e293b', marginBottom: '2px' }}>{m.sender?.name}</div>
                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.content}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right — Chat window */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9', overflow: 'hidden' }}>

            {/* Chat header */}
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fafcff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }} />
                <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#1e293b' }}>{school.schoolName}</span>
              </div>

              {/* Search */}
              <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem' }}>
                <input type="text" placeholder="Search messages..." value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ padding: '0.35rem 0.75rem', border: '1.5px solid #e2e8f0', borderRadius: '20px', fontSize: '0.78rem', outline: 'none', fontFamily: 'inherit', width: '180px' }} />
                {searchQ && (
                  <button type="button" onClick={() => { setSearch(''); setSearchQ(''); fetchMessages(school._id); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '0.8rem', fontFamily: 'inherit' }}>✕ Clear</button>
                )}
              </form>
            </div>

            {/* Messages area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0' }}>
              {searchQ && (
                <div style={{ textAlign: 'center', padding: '0.5rem', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                  Showing results for "{searchQ}" — {messages.length} message{messages.length !== 1 ? 's' : ''} found
                </div>
              )}

              {messages.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', gap: '0.5rem' }}>
                  <div style={{ fontSize: '3rem' }}>💬</div>
                  <div style={{ fontWeight: '600', color: '#475569' }}>No messages yet</div>
                  <div style={{ fontSize: '0.82rem' }}>Send a message to start the conversation</div>
                </div>
              ) : (
                Object.entries(grouped).map(([date, msgs]) => (
                  <div key={date}>
                    {/* Date separator */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1rem 0 0.75rem' }}>
                      <div style={{ flex: 1, height: '1px', background: '#f1f5f9' }} />
                      <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: '600', whiteSpace: 'nowrap' }}>{date}</span>
                      <div style={{ flex: 1, height: '1px', background: '#f1f5f9' }} />
                    </div>

                    {msgs.map((msg, i) => {
                      const isMe    = msg.sender?._id === user._id || msg.sender === user._id;
                      const showAvatar = !isMe && (i === 0 || msgs[i-1]?.sender?._id !== msg.sender?._id);

                      return (
                        <div key={msg._id} style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: '0.5rem', marginBottom: '0.375rem' }}>
                          {/* Avatar */}
                          {!isMe && (
                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#e8f5f1', color: '#1e5f4e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: '700', flexShrink: 0, opacity: showAvatar ? 1 : 0 }}>
                              {msg.sender?.name?.[0]?.toUpperCase()}
                            </div>
                          )}

                          {/* Bubble */}
                          <div style={{ maxWidth: '65%', position: 'relative' }}
                            onMouseEnter={e => e.currentTarget.querySelector('.msg-actions')?.style && (e.currentTarget.querySelector('.msg-actions').style.opacity = '1')}
                            onMouseLeave={e => e.currentTarget.querySelector('.msg-actions')?.style && (e.currentTarget.querySelector('.msg-actions').style.opacity = '0')}
                          >
                            {/* Pin indicator */}
                            {msg.isPinned && (
                              <div style={{ fontSize: '0.6rem', color: '#f59e0b', marginBottom: '2px', textAlign: isMe ? 'right' : 'left' }}>📌 Pinned</div>
                            )}

                            <div style={{
                              padding: '0.5rem 0.875rem',
                              borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                              background: isMe ? '#1e3a5f' : '#f1f5f9',
                              color: isMe ? '#fff' : '#1e293b',
                              fontSize: '0.875rem',
                              lineHeight: 1.5,
                              wordBreak: 'break-word',
                            }}>
                              {msg.content}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: isMe ? 'flex-end' : 'flex-start', marginTop: '2px' }}>
                              <span style={{ fontSize: '0.62rem', color: '#94a3b8' }}>
                                {new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {isMe && (
                                <span style={{ fontSize: '0.65rem', color: msg.isRead ? '#22c55e' : '#94a3b8' }}>
                                  {msg.isRead ? '✓✓' : '✓'}
                                </span>
                              )}
                            </div>

                            {/* Hover actions */}
                            <div className="msg-actions" style={{ position: 'absolute', top: '-8px', [isMe ? 'left' : 'right']: '0', opacity: 0, transition: 'opacity 0.15s', display: 'flex', gap: '2px' }}>
                              <button onClick={() => handlePin(msg._id)}
                                style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '2px 5px', cursor: 'pointer', fontSize: '0.65rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                                title={msg.isPinned ? 'Unpin' : 'Pin'}>
                                {msg.isPinned ? '📌' : '📍'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}

              {/* Typing indicator */}
              {otherTyping && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0' }}>
                  <div style={{ display: 'flex', gap: '3px', padding: '0.5rem 0.875rem', background: '#f1f5f9', borderRadius: '16px 16px 16px 4px' }}>
                    {[0,1,2].map(i => (
                      <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#94a3b8', animation: `bounce 1s ${i*0.2}s infinite` }} />
                    ))}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>typing...</span>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Message input */}
            <div style={{ padding: '0.875rem 1.25rem', borderTop: '1px solid #f1f5f9', background: '#fafcff' }}>
              <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.625rem', alignItems: 'flex-end' }}>
                <textarea
                  ref={inputRef}
                  value={content}
                  onChange={handleTyping}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
                  placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
                  rows={1}
                  style={{ flex: 1, padding: '0.625rem 0.875rem', border: '1.5px solid #e2e8f0', borderRadius: '20px', fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none', resize: 'none', lineHeight: 1.5, maxHeight: '100px', overflowY: 'auto' }}
                />
                <button type="submit" disabled={!content.trim() || sending}
                  style={{ width: '40px', height: '40px', borderRadius: '50%', background: !content.trim() ? '#e2e8f0' : '#1e5f4e', border: 'none', cursor: !content.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0, transition: 'background 0.15s' }}>
                  {sending ? '⏳' : '➤'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
      `}</style>
    </Layout>
  );
};

// Group messages by date
const groupByDate = (messages) => {
  const groups = {};
  messages.forEach(msg => {
    const d    = new Date(msg.createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let label;
    if (d.toDateString() === today.toDateString())     label = 'Today';
    else if (d.toDateString() === yesterday.toDateString()) label = 'Yesterday';
    else label = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

    if (!groups[label]) groups[label] = [];
    groups[label].push(msg);
  });
  return groups;
};

const card = { background: '#fff', borderRadius: '12px', padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' };

export default Messages;
