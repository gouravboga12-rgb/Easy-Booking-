import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { HiMail, HiLockClosed, HiArrowRight } from 'react-icons/hi';
import { MdConstruction } from 'react-icons/md';
import './Auth.css';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const result = await login(form.email, form.password, 'customer');
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    navigate('/');
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-brand"><MdConstruction className="auth-brand-icon" /> Parrow <b>Skills</b></Link>
        <h1>Welcome back</h1>
        <p className="auth-sub">Login to your account</p>

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
          <button type="submit" className="auth-submit" disabled={loading}>
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
