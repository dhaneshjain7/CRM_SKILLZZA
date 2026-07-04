import { useState, useEffect, useRef } from 'react';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import StatusBadge from '../../components/common/StatusBadge';
import API from '../../api/axios';

const AdminMessages = () => {
  const { user }                             = useAuth();
  const { socket, joinSchool, sendTyping }   = useSocket();
  const [conversations, setConversations]    = useState([]);
  const [activeSchool,  setActiveSchool]     = useState(null);
  const [messages,      setMessages]         = useState([]);
  const [content,       setContent]          = useState('');
  const [loading,       setLoading]          = useState(true);
  const [sending,       setSending]          = useState(false);
  const [otherTyping,   setOtherTyping]      = useState(false);
  const [search,        setSearch]           = useState('');
  const bottomRef  = useRef(null);
  const typingRef  = useRef(null);
  const inputRef   = useRef(null);

  // Load conversations
  useEffect(() => {
    const fetchConvos = async () => {
      try {
        const res = await API.get('/messages/conversations');
        setConversations(res.data.conversations || []);
        // Auto-open first conversation
        if (res.data.conversations?.length > 0) {
          openConversation(res.data.conversations[0].school);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchConvos();
  }, []);

  const openConversation = async (school) => {
    setActiveSchool(school);
    joinSchool(school._id);
    try {
      const res = await API.get(`/messages/school/${school._id}?limit=100`);
      setMessages(res.data.messages || []);
      // Refresh conversations to update unread counts
      const convRes = await API.get('/messages/conversations');
      setConversations(convRes.data.conversations || []);
    } catch (e) { console.error(e); }
  };

  // Scroll to bottom
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Socket listeners
  useEffect(() => {
    if (!socket || !activeSchool) return;

    const onNewMsg = (msg) => {
      if (String(msg.school) !== String(activeSchool._id) && msg.school?._id !== activeSchool._id) return;
      setMessages(prev => prev.find(m => m._id === msg._id) ? prev : [...prev, msg]);
      if (msg.sender?._id !== user._id) {
        setTimeout(() => API.put(`/messages/${msg._id}/read`).catch(() => {}), 800);
      }
    };

    const onTyping = ({ userId, isTyping }) => {
      if (userId !== user._id) setOtherTyping(isTyping);
    };

    socket.on('new_message',  onNewMsg);
    socket.on('user_typing',  onTyping);
    return () => { socket.off('new_message', onNewMsg); socket.off('user_typing', onTyping); };
  }, [socket, activeSchool, user]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!content.trim() || !activeSchool || sending) return;
    setSending(true);
    try {
      await API.post('/messages/send', { schoolId: activeSchool._id, content: content.trim() });
      setContent('');
      inputRef.current?.focus();
    } catch (e) { console.error(e); }
    finally { setSending(false); }
  };

  const handleTyping = (e) => {
    setContent(e.target.value);
    if (activeSchool) {
      sendTyping(activeSchool._id, true);
      clearTimeout(typingRef.current);
      typingRef.current = setTimeout(() => sendTyping(activeSchool._id, false), 1500);
    }
  };

  const filteredConvos = conversations.filter(c =>
    c.school.schoolName.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = groupByDate(messages);

  return (
    <Layout>
      <div style={{ display: 'flex', height: 'calc(100vh - 130px)', background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9', overflow: 'hidden' }}>

        {/* Left — Conversation list */}
        <div style={{ width: '280px', borderRight: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9' }}>
            <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', fontWeight: '700', color: '#1e293b' }}>Conversations</h3>
            <input type="text" placeholder="Search schools..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '0.8rem', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.82rem' }}>Loading...</div>
            ) : filteredConvos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.82rem' }}>
                {conversations.length === 0 ? 'No assigned schools yet' : 'No results found'}
              </div>
            ) : (
              filteredConvos.map(({ school, lastMessage, unreadCount }) => {
                const isActive = activeSchool?._id === school._id;
                return (
                  <div key={school._id} onClick={() => openConversation(school)}
                    style={{ padding: '0.875rem 1rem', cursor: 'pointer', background: isActive ? '#e8f0f9' : 'transparent', borderLeft: `3px solid ${isActive ? '#1e3a5f' : 'transparent'}`, transition: 'all 0.15s' }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f8fafc'; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#1e293b', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '0.5rem' }}>
                        {school.schoolName}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px', flexShrink: 0 }}>
                        {lastMessage && (
                          <span style={{ fontSize: '0.62rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                            {new Date(lastMessage.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                        {unreadCount > 0 && (
                          <span style={{ background: '#1e3a5f', color: '#fff', borderRadius: '10px', padding: '1px 6px', fontSize: '0.65rem', fontWeight: '700', minWidth: '18px', textAlign: 'center' }}>
                            {unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {lastMessage ? lastMessage.content : 'No messages yet'}
                    </div>
                    <div style={{ marginTop: '4px' }}>
                      <StatusBadge status={school.currentStatus} size="sm" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right — Chat window */}
        {!activeSchool ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', gap: '0.75rem' }}>
            <div style={{ fontSize: '3rem' }}>💬</div>
            <div style={{ fontWeight: '600', color: '#475569' }}>Select a conversation</div>
            <div style={{ fontSize: '0.82rem' }}>Choose a school from the left to start chatting</div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

            {/* Chat header */}
            <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#fafcff', flexShrink: 0 }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#e8f0f9', color: '#1e3a5f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', flexShrink: 0 }}>
                {activeSchool.schoolName[0]}
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#1e293b' }}>{activeSchool.schoolName}</div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{messages.length} messages</div>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column' }}>
              {messages.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', gap: '0.5rem' }}>
                  <div style={{ fontSize: '2.5rem' }}>👋</div>
                  <div style={{ fontWeight: '600', color: '#475569' }}>Start the conversation</div>
                  <div style={{ fontSize: '0.82rem' }}>Send a message to {activeSchool.schoolName}</div>
                </div>
              ) : (
                Object.entries(grouped).map(([date, msgs]) => (
                  <div key={date}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1rem 0 0.75rem' }}>
                      <div style={{ flex: 1, height: '1px', background: '#f1f5f9' }} />
                      <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: '600' }}>{date}</span>
                      <div style={{ flex: 1, height: '1px', background: '#f1f5f9' }} />
                    </div>
                    {msgs.map((msg) => {
                      const isMe = msg.sender?._id === user._id;
                      return (
                        <div key={msg._id} style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: '0.5rem', marginBottom: '0.375rem' }}>
                          {!isMe && (
                            <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#e8f5f1', color: '#1e5f4e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: '700', flexShrink: 0 }}>
                              {msg.sender?.name?.[0]?.toUpperCase()}
                            </div>
                          )}
                          <div style={{ maxWidth: '65%' }}>
                            <div style={{ padding: '0.5rem 0.875rem', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: isMe ? '#1e3a5f' : '#f1f5f9', color: isMe ? '#fff' : '#1e293b', fontSize: '0.875rem', lineHeight: 1.5, wordBreak: 'break-word' }}>
                              {msg.content}
                            </div>
                            <div style={{ display: 'flex', gap: '4px', justifyContent: isMe ? 'flex-end' : 'flex-start', marginTop: '2px' }}>
                              <span style={{ fontSize: '0.62rem', color: '#94a3b8' }}>
                                {new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {isMe && <span style={{ fontSize: '0.65rem', color: msg.isRead ? '#22c55e' : '#94a3b8' }}>{msg.isRead ? '✓✓' : '✓'}</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}

              {otherTyping && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
                  <div style={{ display: 'flex', gap: '3px', padding: '0.5rem 0.875rem', background: '#f1f5f9', borderRadius: '16px 16px 16px 4px' }}>
                    {[0,1,2].map(i => <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#94a3b8', animation: `bounce 1s ${i*0.2}s infinite` }} />)}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '0.875rem 1.25rem', borderTop: '1px solid #f1f5f9', background: '#fafcff', flexShrink: 0 }}>
              <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.625rem', alignItems: 'flex-end' }}>
                <textarea ref={inputRef} value={content} onChange={handleTyping}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
                  placeholder="Type a message..."
                  rows={1}
                  style={{ flex: 1, padding: '0.625rem 0.875rem', border: '1.5px solid #e2e8f0', borderRadius: '20px', fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none', resize: 'none', maxHeight: '100px', overflowY: 'auto' }}
                />
                <button type="submit" disabled={!content.trim() || sending}
                  style={{ width: '40px', height: '40px', borderRadius: '50%', background: !content.trim() ? '#e2e8f0' : '#1e3a5f', border: 'none', cursor: !content.trim() ? 'not-allowed' : 'pointer', fontSize: '1.1rem', flexShrink: 0, transition: 'background 0.15s' }}>
                  {sending ? '⏳' : '➤'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-4px)} }`}</style>
    </Layout>
  );
};

const groupByDate = (messages) => {
  const groups = {};
  messages.forEach(msg => {
    const d = new Date(msg.createdAt);
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    let label = d.toDateString() === today.toDateString() ? 'Today' : d.toDateString() === yesterday.toDateString() ? 'Yesterday' : d.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
    if (!groups[label]) groups[label] = [];
    groups[label].push(msg);
  });
  return groups;
};

export default AdminMessages;
