import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { HiMail, HiLockClosed, HiArrowRight } from 'react-icons/hi';
import { MdConstruction } from 'react-icons/md';
import './Auth.css';

export default function AdminLogin() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotMsg, setShowForgotMsg] = useState(false);
  const { login, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setShowForgotMsg(false);
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const result = login(form.email, form.password, 'admin');
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    navigate('/admin');
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-brand"><MdConstruction className="auth-brand-icon" /> Parrow <b>Skills</b></Link>
        <h1>Admin Control Panel</h1>
        <p className="auth-sub">Log in to manage operations</p>

        <form onSubmit={handleSubmit}>
          <label>Email
            <div className="input-wrap">
              <HiMail className="input-icon" />
              <input type="email" placeholder="tameemansarkhan@gmail.com" value={form.email}
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
          </label>
          {error && <div className="auth-error">⚠️ {error}</div>}
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Logging in...' : <><span>Login to Dashboard</span> <HiArrowRight style={{width:16,height:16}} /></>}
          </button>
        </form>

        <div className="auth-switch" style={{ marginTop: '20px', textAlign: 'center' }}>
          <button type="button" className="auth-switch-btn" onClick={() => setShowForgotMsg(true)}>
            Forgot Password?
          </button>
        </div>

        {showForgotMsg && (
          <div className="otp-info" style={{ marginTop: '16px', background: '#fffbeb', borderColor: '#fde68a' }}>
            <div>
              <strong style={{ color: '#b45309' }}>Password Recovery</strong>
              <p style={{ color: '#78350f', fontSize: '13px', lineHeight: '1.4', marginTop: '4px' }}>
                Please contact our developers or operations team at <strong>admin-support@parrowskills.in</strong> to securely verify your identity and reset your administrative password.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="auth-visual">
        <div className="av-content">
          <div className="av-icon">🛡️</div>
          <h2>Secure Admin Portal</h2>
          <p>Access operations management tools, monitor real-time bookings, verify operator details, and generate billing reports.</p>
          <div className="av-features">
            <div>✅ Monitor all active customer orders</div>
            <div>✅ Verify worker credentials & documents</div>
            <div>✅ Manage pricing, logistics & services</div>
            <div>✅ Generate platform analytics reports</div>
          </div>
        </div>
      </div>
    </div>
  );
}
