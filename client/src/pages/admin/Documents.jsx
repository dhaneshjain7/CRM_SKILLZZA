import { useState, useEffect } from 'react';
import downloadFile from '../../utils/downloadFile';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import API from '../../api/axios';

const STATUS_STYLE = {
  'Pending':             { bg: '#fef9c3', color: '#854d0e' },
  'Approved':            { bg: '#d1fae5', color: '#065f46' },
  'Rejected':            { bg: '#fee2e2', color: '#991b1b' },
  'Re-upload Requested': { bg: '#ffedd5', color: '#9a3412' },
};

const DOC_TYPE_LABELS = {
  school_approval:        'School Approval',
  student_data:           'Student Data',
  teacher_data:           'Teacher Data',
  adobe_student_accounts: 'Adobe Student Accounts',
  adobe_teacher_accounts: 'Adobe Teacher Accounts',
};

const AdminDocuments = () => {
  const { schoolId } = useParams();
  const navigate     = useNavigate();
  const [school,    setSchool]    = useState(null);
  const [documents, setDocuments] = useState({});
  const [loading,   setLoading]   = useState(true);
  const [reviewing, setReviewing] = useState(null); // doc being reviewed
  const [reviewForm,setReviewForm]= useState({ status: '', rejectReason: '' });
  const [saving,    setSaving]    = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [schoolRes, docsRes] = await Promise.all([
          API.get(`/schools/${schoolId}`),
          API.get(`/documents/school/${schoolId}`),
        ]);
        setSchool(schoolRes.data.school);
        setDocuments(docsRes.data.grouped || {});
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    if (schoolId) fetchData();
  }, [schoolId]);

  const handleReview = async () => {
    if (!reviewForm.status || !reviewing) return;
    setSaving(true);
    try {
      await API.put(`/documents/${reviewing._id}/review`, reviewForm);
      // Refresh
      const res = await API.get(`/documents/school/${schoolId}`);
      setDocuments(res.data.grouped || {});
      setReviewing(null);
      setReviewForm({ status: '', rejectReason: '' });
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const allDocs = Object.values(documents).flat();

  return (
    <Layout>
      {/* Back */}
      <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.82rem', marginBottom: '1rem', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '4px' }}>
        ← Back to school
      </button>

      {/* School header */}
      {school && (
        <div style={{ ...card, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#e8f0f9', color: '#1e3a5f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '1.1rem', flexShrink: 0 }}>
            {school.schoolName[0]}
          </div>
          <div>
            <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '1rem' }}>{school.schoolName}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{school.address?.city}, {school.address?.state} · {school.board}</div>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: '0.82rem', color: '#64748b' }}>
            {allDocs.length} document{allDocs.length !== 1 ? 's' : ''} uploaded
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Loading documents...</div>
      ) : allDocs.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📂</div>
          <div style={{ fontWeight: '600', color: '#475569' }}>No documents uploaded yet</div>
          <div style={{ fontSize: '0.82rem', marginTop: '0.25rem' }}>The school user hasn't uploaded any files</div>
        </div>
      ) : (
        Object.entries(documents).map(([type, docs]) => (
          <div key={type} style={{ ...card, marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#1e293b', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
              {DOC_TYPE_LABELS[type] || type}
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '400' }}>{docs.length} file{docs.length !== 1 ? 's' : ''}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {docs.map(doc => {
                const st = STATUS_STYLE[doc.status] || { bg: '#f1f5f9', color: '#475569' };
                return (
                  <div key={doc._id} style={{ border: '1px solid #f1f5f9', borderRadius: '10px', padding: '1rem', background: '#fafcff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: '1.4rem' }}>{doc.fileExtension === 'csv' ? '📋' : '📊'}</span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.fileName}</div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                            v{doc.version} · {(doc.fileSize/1024).toFixed(1)} KB · {new Date(doc.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
                        <span style={{ ...st, fontSize: '0.72rem', fontWeight: '700', padding: '3px 10px', borderRadius: '20px' }}>{doc.status}</span>
                        {doc.isLatestVersion && <span style={{ fontSize: '0.65rem', color: '#1e3a5f', background: '#e8f0f9', padding: '2px 7px', borderRadius: '10px', fontWeight: '600' }}>Latest</span>}
                      </div>
                    </div>

                    {/* Parsed data summary */}
                    {doc.parsedData && (
                      <div style={{ marginTop: '0.625rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.7rem', background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '10px' }}>Total: {doc.parsedData.totalRows} rows</span>
                        <span style={{ fontSize: '0.7rem', background: '#d1fae5', color: '#065f46', padding: '2px 8px', borderRadius: '10px', fontWeight: '600' }}>✓ {doc.parsedData.validRows} valid</span>
                        {doc.parsedData.errors?.length > 0 && <span style={{ fontSize: '0.7rem', background: '#fee2e2', color: '#991b1b', padding: '2px 8px', borderRadius: '10px', fontWeight: '600' }}>⚠ {doc.parsedData.errors.length} errors</span>}
                      </div>
                    )}

                    {doc.rejectReason && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#991b1b', background: '#fef2f2', padding: '0.4rem 0.75rem', borderRadius: '6px' }}>
                        Reason: {doc.rejectReason}
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button onClick={() => downloadFile(doc._id, doc.fileName)}
                        style={{ fontSize: '0.75rem', color: '#1e3a5f', fontWeight: '600', border: 'none', padding: '0.35rem 0.75rem', background: '#e8f0f9', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit' }}>
                        ⬇ Download
                      </button>
                      {doc.status === 'Pending' && (
                        <button onClick={() => { setReviewing(doc); setReviewForm({ status: '', rejectReason: '' }); }}
                          style={{ fontSize: '0.75rem', color: '#fff', fontWeight: '600', border: 'none', padding: '0.35rem 0.75rem', background: '#1e3a5f', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit' }}>
                          Review →
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {/* Review Modal */}
      {reviewing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: '14px', padding: '1.5rem', width: '100%', maxWidth: '440px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 0.25rem', fontSize: '1rem', fontWeight: '700', color: '#1e293b' }}>Review Document</h3>
            <p style={{ margin: '0 0 1.25rem', fontSize: '0.8rem', color: '#64748b' }}>{reviewing.fileName}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '1rem' }}>
              {['Approved', 'Rejected', 'Re-upload Requested'].map(s => {
                const st = STATUS_STYLE[s];
                return (
                  <button key={s} onClick={() => setReviewForm(f => ({ ...f, status: s }))}
                    style={{ padding: '0.7rem 1rem', border: `2px solid ${reviewForm.status === s ? '#1e3a5f' : '#e2e8f0'}`, borderRadius: '8px', background: reviewForm.status === s ? '#e8f0f9' : '#fff', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600', fontSize: '0.875rem', color: reviewForm.status === s ? '#1e3a5f' : '#374151', textAlign: 'left' }}>
                    {s === 'Approved' ? '✅' : s === 'Rejected' ? '❌' : '🔄'} {s}
                  </button>
                );
              })}
            </div>

            {(reviewForm.status === 'Rejected' || reviewForm.status === 'Re-upload Requested') && (
              <textarea
                placeholder="Reason (required)"
                value={reviewForm.rejectReason}
                onChange={e => setReviewForm(f => ({ ...f, rejectReason: e.target.value }))}
                rows={3}
                style={{ width: '100%', padding: '0.625rem', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '0.85rem', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box', marginBottom: '1rem', outline: 'none' }}
              />
            )}

            <div style={{ display: 'flex', gap: '0.625rem' }}>
              <button onClick={() => setReviewing(null)} style={{ flex: 1, padding: '0.65rem', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600', color: '#475569' }}>Cancel</button>
              <button onClick={handleReview} disabled={saving || !reviewForm.status}
                style={{ flex: 2, padding: '0.65rem', background: !reviewForm.status ? '#94a3b8' : '#1e3a5f', border: 'none', borderRadius: '8px', cursor: !reviewForm.status ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontWeight: '700', color: '#fff' }}>
                {saving ? 'Saving...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

const card = { background: '#fff', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' };

export default AdminDocuments;
