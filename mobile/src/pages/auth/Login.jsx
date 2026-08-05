import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useGoogleLogin } from '@react-oauth/google';
import { HiMail, HiLockClosed, HiArrowRight } from 'react-icons/hi';
import { MdConstruction } from 'react-icons/md';
import './Auth.css';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login, googleLogin } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const result = await login(form.email, form.password, 'customer');
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    const from = location.state?.from || '/';
    navigate(from);
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      setError('');
      const result = await googleLogin(tokenResponse.access_token, 'access_token');
      setGoogleLoading(false);
      if (result.error) { setError(result.error); return; }
      const from = location.state?.from || '/';
      navigate(from);
    },
    onError: () => {
      setError('Google login was cancelled or failed.');
    },
  });

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-brand"><img src="/logo.png" alt="Parrow Skills Logo" className="auth-brand-logo" /> Parrow <b>Skills</b></Link>
        <h1>Welcome back</h1>
        <p className="auth-sub">Login to your account</p>

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
            <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M47.5 24.5c0-1.6-.1-3.2-.4-4.7H24v9h13.1c-.6 3-2.4 5.6-5 7.3v6h8.1c4.7-4.3 7.3-10.7 7.3-17.6z" fill="#4285F4"/>
              <path d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-8.1-6c-2.1 1.4-4.8 2.2-7.8 2.2-6 0-11-4-12.8-9.5H2.8v6.2C6.8 42.8 14.9 48 24 48z" fill="#34A853"/>
              <path d="M11.2 28.9c-.5-1.4-.7-2.9-.7-4.4s.3-3 .7-4.4V14H2.8C1 17.5 0 21.6 0 24.5s1 7 2.8 10.6l8.4-6.2z" fill="#FBBC05"/>
              <path d="M24 9.5c3.4 0 6.4 1.2 8.8 3.4l6.6-6.6C35.9 2.5 30.4 0 24 0 14.9 0 6.8 5.2 2.8 13.3l8.4 6.2C13 13.5 18 9.5 24 9.5z" fill="#EA4335"/>
            </svg>
          )}
          <span>{googleLoading ? 'Signing in...' : 'Continue with Google'}</span>
        </button>

        <div className="auth-divider"><span>or</span></div>

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
              <Link to="/forgot-password" style={{ color: '#ff8c00', fontSize: '13px', textDecoration: 'none', fontWeight: 500 }}>
                Forgot Password?
              </Link>
            </div>
          </label>
          {error && <div className="auth-error">⚠️ {error}</div>}
          <button type="submit" className="auth-submit" disabled={loading || googleLoading}>
            {loading ? 'Logging in...' : <><span>Login</span> <HiArrowRight style={{width:16,height:16}} /></>}
          </button>
        </form>

        <p className="auth-switch">Don't have an account? <Link to="/register">Sign up</Link></p>
      </div>

      <div className="auth-visual">
        <div className="av-content">
          <div className="av-icon">👷</div>
          <h2>India's #1 On-Demand Services Platform</h2>
          <p>Book Masons, Electricians, Painters, Cooks & more — on demand, at your doorstep.</p>
          <div className="av-stats">
            <div><strong>5000+</strong><span>Professionals</span></div>
            <div><strong>50+</strong><span>Cities</span></div>
            <div><strong>4.8★</strong><span>Rating</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
