// Generic login page — receives role config as props
// Used by SuperAdminLogin, AdminLogin, SchoolLogin

import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';

const LoginPage = ({ roleConfig }) => {
  const { login, loginWithGoogle } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  const [form, setForm]         = useState({ email: '', password: '' });
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  const from = location.state?.from?.pathname || roleConfig.dashboardPath;

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError('');
    const result = await loginWithGoogle(credentialResponse.credential);
    setLoading(false);

    if (!result.success) {
      setError(result.message);
      return;
    }

    if (result.user.role !== roleConfig.role && roleConfig.role !== 'any') {
      setError(`This login is for ${roleConfig.label} accounts only.`);
      return;
    }

    const paths = {
      superadmin:  '/superadmin/dashboard',
      admin:       '/admin/dashboard',
      school_user: '/school/dashboard',
    };
    navigate(paths[result.user.role] || '/', { replace: true });
  };

  const handleGoogleError = () => {
    setError('Google authentication failed. Please try again.');
  };

  const handleChange = (e) => {
    setError('');
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { setError('Email and password are required.'); return; }

    setLoading(true);
    const result = await login(form.email, form.password);
    setLoading(false);

    if (!result.success) { setError(result.message); return; }

    // Enforce role — can't use superadmin login for school_user account
    if (result.user.role !== roleConfig.role && roleConfig.role !== 'any') {
      setError(`This login is for ${roleConfig.label} accounts only.`);
      return;
    }

    const paths = {
      superadmin:  '/superadmin/dashboard',
      admin:       '/admin/dashboard',
      school_user: '/school/dashboard',
    };
    navigate(paths[result.user.role] || '/', { replace: true });
  };

  return (
    <div style={{ ...s.page, background: roleConfig.pageBg }}>
      <div style={s.card}>

        {/* Back to role select */}
        <Link to="/" style={s.back}>← Back to role selection</Link>

        {/* Brand */}
        <div style={s.brand}>
          <div style={{ ...s.logoBox, background: roleConfig.accent }}>S</div>
          <div>
            <div style={s.brandName}>SKILLZZA</div>
            <div style={s.brandSub}>Customer Relationship Management</div>
          </div>
        </div>

        {/* Role badge */}
        <div style={{ ...s.roleBadge, background: roleConfig.badgeBg, color: roleConfig.accent }}>
          {roleConfig.icon}  {roleConfig.label} Login
        </div>

        <h2 style={s.title}>Welcome back</h2>
        <p style={s.subtitle}>{roleConfig.subtitle}</p>

        {error && (
          <div style={s.errorBox}>⚠ {error}</div>
        )}

        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.field}>
            <label style={s.label}>Email address</label>
            <input
              type="email" name="email" value={form.email}
              onChange={handleChange} placeholder={roleConfig.emailPlaceholder}
              style={s.input} autoComplete="email" autoFocus
            />
          </div>

          <div style={s.field}>
            <label style={s.label}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'} name="password"
                value={form.password} onChange={handleChange}
                placeholder="••••••••"
                style={{ ...s.input, paddingRight: '44px' }}
                autoComplete="current-password"
              />
              <button type="button" onClick={() => setShowPass(p => !p)}
                style={s.eyeBtn} tabIndex={-1}>
                {showPass ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            style={{ ...s.submitBtn, background: roleConfig.accent, opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Signing in...' : `Sign in as ${roleConfig.label}`}
          </button>
        </form>

        {roleConfig.role === 'school_user' && (
          <>
            <div style={s.separator}>
              <span style={s.separatorLine}></span>
              <span style={s.separatorText}>OR</span>
              <span style={s.separatorLine}></span>
            </div>

            <div style={s.googleWrapper}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap={false}
                theme="outline"
                size="large"
                width="348"
                text="continue_with"
                shape="rectangular"
              />
            </div>
          </>
        )}

        {/* Hint credentials for dev */}
        {roleConfig.hint && (
          <div style={s.hint}>
            <strong>Dev hint:</strong> {roleConfig.hint}
          </div>
        )}

        <p style={s.footer}>Skillzza CRM &copy; {new Date().getFullYear()} · Confidential</p>
      </div>
    </div>
  );
};

const s = {
  page:      { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Segoe UI', system-ui, sans-serif", padding: '1rem' },
  card:      { background: '#fff', borderRadius: '16px', padding: '2.25rem', width: '100%', maxWidth: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  back:      { display: 'inline-block', fontSize: '0.8rem', color: '#64748b', marginBottom: '1.25rem', textDecoration: 'none' },
  brand:     { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' },
  logoBox:   { width: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.25rem', fontWeight: '800', flexShrink: 0 },
  brandName: { fontWeight: '700', fontSize: '1rem', letterSpacing: '2px', color: '#1e293b' },
  brandSub:  { fontSize: '0.68rem', color: '#94a3b8' },
  roleBadge: { display: 'inline-block', fontSize: '0.75rem', fontWeight: '600', padding: '0.3rem 0.75rem', borderRadius: '20px', marginBottom: '1rem', letterSpacing: '0.02em' },
  title:     { fontSize: '1.4rem', fontWeight: '700', color: '#1e293b', margin: '0 0 0.25rem' },
  subtitle:  { fontSize: '0.85rem', color: '#64748b', margin: '0 0 1.25rem' },
  errorBox:  { background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '8px', padding: '0.7rem 1rem', fontSize: '0.85rem', marginBottom: '1rem' },
  form:      { display: 'flex', flexDirection: 'column', gap: '1.1rem' },
  field:     { display: 'flex', flexDirection: 'column', gap: '0.35rem' },
  label:     { fontSize: '0.85rem', fontWeight: '500', color: '#374151' },
  input:     { padding: '0.6rem 0.85rem', border: '1.5px solid #d1d5db', borderRadius: '8px', fontSize: '0.9375rem', outline: 'none', width: '100%', boxSizing: 'border-box', color: '#1e293b' },
  eyeBtn:    { position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: 0 },
  submitBtn: { color: '#fff', border: 'none', borderRadius: '8px', padding: '0.75rem', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', marginTop: '0.25rem', width: '100%', transition: 'opacity 0.2s' },
  hint:      { marginTop: '1rem', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '8px', padding: '0.625rem 0.875rem', fontSize: '0.78rem', color: '#475569' },
  footer:    { marginTop: '1.5rem', textAlign: 'center', fontSize: '0.72rem', color: '#94a3b8' },
  separator: { display: 'flex', alignItems: 'center', gap: '10px', margin: '1.25rem 0' },
  separatorLine: { flex: 1, height: '1px', background: '#e2e8f0' },
  separatorText: { fontSize: '0.78rem', color: '#94a3b8', fontWeight: '600' },
  googleWrapper: { display: 'flex', justifyContent: 'center', width: '100%', minHeight: '44px' },
};

export default LoginPage;
