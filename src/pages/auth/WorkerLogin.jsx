import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useGoogleLogin } from '@react-oauth/google';
import { HiMail, HiLockClosed, HiArrowRight } from 'react-icons/hi';
import { MdConstruction } from 'react-icons/md';
import './Auth.css';

export default function WorkerLogin() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login, googleLogin } = useAuthStore();
  const navigate = useNavigate();

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      setError('');
      const result = await googleLogin(tokenResponse.access_token, 'access_token', 'worker');
      setGoogleLoading(false);
      if (result.error) { setError(result.error); return; }
      navigate('/worker');
    },
    onError: () => {
      setError('Google login was cancelled or failed.');
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const result = await login(form.email, form.password, 'worker');
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    navigate('/worker');
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-brand"><img src="/logo.png" alt="Parrow Skills Logo" className="auth-brand-logo" /> Parrow <b>Skills</b></Link>
        <h1>Welcome back</h1>
        <p className="auth-sub">Login to your worker account</p>

        {/* Google Login Button */}
        <button
          type="button"
          className="google-btn"
          onClick={() => handleGoogleLogin()}
          disabled={googleLoading || loading}
        >
          {googleLoading ? (
            <span className="google-btn-spinner" />
          ) : (
            <>
              <svg className="google-btn-icon" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.32 7.33 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.18 0 9.99 0 12s.46 3.82 1.26 5.42l4.02-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.68 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>

        <div className="auth-divider"><span>or continue with email</span></div>

        <form onSubmit={handleSubmit}>
          <label>Email or Phone Number
            <div className="input-wrap">
              <HiMail className="input-icon" />
              <input type="text" placeholder="Enter email or phone number" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required
                autoCapitalize="none" autoCorrect="off" />
            </div>
          </label>
          <label>Password
            <div className="input-wrap">
              <HiLockClosed className="input-icon" />
              <input type="password" placeholder="••••••••" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
              <Link to="/forgot-password-worker" style={{ color: '#ff8c00', fontSize: '13px', textDecoration: 'none', fontWeight: 500 }}>
                Forgot Password?
              </Link>
            </div>
          </label>
          {error && <div className="auth-error">⚠️ {error}</div>}
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Logging in...' : <><span>Login</span> <HiArrowRight style={{width:16,height:16}} /></>}
          </button>
        </form>

        <p className="auth-switch">Don't have a worker account? <Link to="/register-worker">Sign up</Link></p>
      </div>

      <div className="auth-visual">
        <div className="av-content">
          <div className="av-icon">👷</div>
          <h2>Earn with Parrow Skills</h2>
          <p>Join thousands of verified workers earning daily on Parrow Skills.</p>
          <div className="av-features">
            <div>✅ Get jobs near your location</div>
            <div>✅ Instant payment on completion</div>
            <div>✅ Build your reputation & rating</div>
            <div>✅ Flexible working hours</div>
          </div>
        </div>
      </div>
    </div>
  );
}
