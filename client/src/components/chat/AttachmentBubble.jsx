import { useState, useEffect } from 'react';

const FILE_ICONS = { image: '🖼️', pdf: '📕', word: '📘', excel: '📗', other: '📎' };

export const getFileCategory = (fileName) => {
  const ext = fileName.split('.').pop().toLowerCase();
  if (['jpg','jpeg','png','gif','webp'].includes(ext)) return 'image';
  if (ext === 'pdf') return 'pdf';
  if (['doc','docx'].includes(ext)) return 'word';
  if (['xls','xlsx'].includes(ext)) return 'excel';
  return 'other';
};

export const downloadMessageAttachment = async (messageId, fileName) => {
  try {
    const token = localStorage.getItem('accessToken');
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/messages/${messageId}/attachment`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = fileName;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (e) { console.error(e); alert('Download failed'); }
};

const AuthImage = ({ messageId, fileName }) => {
  const [src, setSrc] = useState(null);

  useEffect(() => {
    let objectUrl;
    const load = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/messages/${messageId}/attachment`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const blob = await res.blob();
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      } catch (e) { console.error(e); }
    };
    load();
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [messageId]);

  if (!src) return <div style={{ width: '220px', height: '140px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.75rem' }}>Loading image...</div>;
  return <img src={src} alt={fileName} style={{ width: '100%', display: 'block' }} />;
};

const AttachmentBubble = ({ msg, isMe }) => {
  const category = getFileCategory(msg.attachment.fileName);
  const isImage  = category === 'image';

  return (
    <div>
      {isImage ? (
        <div
          onClick={() => downloadMessageAttachment(msg._id, msg.attachment.fileName)}
          style={{ borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px', overflow: 'hidden', cursor: 'pointer', border: '1px solid #e2e8f0', maxWidth: '220px' }}
        >
          <AuthImage messageId={msg._id} fileName={msg.attachment.fileName} />
        </div>
      ) : (
        <button
          onClick={() => downloadMessageAttachment(msg._id, msg.attachment.fileName)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.625rem 0.875rem', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: isMe ? '#1e3a5f' : '#f1f5f9', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', fontFamily: 'inherit' }}
        >
          <span style={{ fontSize: '1.4rem' }}>{FILE_ICONS[category] || '📎'}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: '600', color: isMe ? '#fff' : '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{msg.attachment.fileName}</div>
            <div style={{ fontSize: '0.68rem', color: isMe ? 'rgba(255,255,255,0.7)' : '#94a3b8' }}>{(msg.attachment.fileSize / 1024).toFixed(0)} KB · ⬇ Download</div>
          </div>
        </button>
      )}
      {msg.content && (
        <div style={{ marginTop: '4px', padding: '0.5rem 0.875rem', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: isMe ? '#1e3a5f' : '#f1f5f9', color: isMe ? '#fff' : '#1e293b', fontSize: '0.875rem' }}>
          {msg.content}
        </div>
      )}
    </div>
  );
};

export default AttachmentBubble;
