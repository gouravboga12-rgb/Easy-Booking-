import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { HiMail, HiArrowRight, HiChevronLeft } from 'react-icons/hi';
import { MdConstruction } from 'react-icons/md';
import './Auth.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const forgotPassword = useAuthStore(s => s.forgotPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    const result = await forgotPassword(email);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setMessage('A password reset link has been sent to your email address.');
      setEmail('');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-brand">
          <MdConstruction className="auth-brand-icon" /> Parrow <b>Skills</b>
        </Link>
        <h1>Forgot Password</h1>
        <p className="auth-sub">Enter your email address to receive a password reset link</p>

        {message ? (
          <div className="auth-success-state" style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✉️</div>
            <p style={{ color: '#4caf50', fontWeight: 500, marginBottom: '24px', lineHeight: '1.5' }}>{message}</p>
            <Link to="/login" className="auth-submit" style={{ textDecoration: 'none', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
              <HiChevronLeft style={{ width: 20, height: 20 }} /> Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label>Email Address
              <div className="input-wrap">
                <HiMail className="input-icon" />
                <input type="email" placeholder="you@example.com" value={email}
                  onChange={e => setEmail(e.target.value)} required
                  autoCapitalize="none" autoCorrect="off" />
              </div>
            </label>
            {error && <div className="auth-error">⚠️ {error}</div>}
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Sending link...' : <><span>Send Reset Link</span> <HiArrowRight style={{ width: 16, height: 16 }} /></>}
            </button>
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <Link to="/login" style={{ color: '#888', textDecoration: 'none', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <HiChevronLeft /> Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>

      <div className="auth-visual">
        <div className="av-content">
          <div className="av-icon">🔒</div>
          <h2>Secure Your Account</h2>
          <p>We use industry-standard encryption and security protocols to keep your personal data and account credentials safe.</p>
        </div>
      </div>
    </div>
  );
}
