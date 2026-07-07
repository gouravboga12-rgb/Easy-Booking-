import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { HiLockClosed, HiArrowRight } from 'react-icons/hi';
import { MdConstruction } from 'react-icons/md';
import './Auth.css';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const resetPassword = useAuthStore(s => s.resetPassword);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setError('Invalid reset token or missing link query parameters.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const result = await resetPassword(token, form.password);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-brand">
          <MdConstruction className="auth-brand-icon" /> Parrow <b>Skills</b>
        </Link>
        <h1>Reset Password</h1>
        <p className="auth-sub">Enter and confirm your new password below</p>

        {success ? (
          <div className="auth-success-state" style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
            <p style={{ color: '#4caf50', fontWeight: 500, lineHeight: '1.5' }}>Password updated successfully!</p>
            <p style={{ color: '#888', fontSize: '14px', marginTop: '8px' }}>Redirecting you to the login page...</p>
            <div style={{ marginTop: '24px' }}>
              <Link to="/login" className="auth-submit" style={{ textDecoration: 'none' }}>
                Go to Login
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label>New Password
              <div className="input-wrap">
                <HiLockClosed className="input-icon" />
                <input type="password" placeholder="••••••••" value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required 
                  disabled={!!error && !token} />
              </div>
            </label>
            <label>Confirm Password
              <div className="input-wrap">
                <HiLockClosed className="input-icon" />
                <input type="password" placeholder="••••••••" value={form.confirmPassword}
                  onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))} required 
                  disabled={!!error && !token} />
              </div>
            </label>
            {error && <div className="auth-error">⚠️ {error}</div>}
            <button type="submit" className="auth-submit" disabled={loading || (!!error && !token)}>
              {loading ? 'Updating password...' : <><span>Update Password</span> <HiArrowRight style={{ width: 16, height: 16 }} /></>}
            </button>
          </form>
        )}
      </div>

      <div className="auth-visual">
        <div className="av-content">
          <div className="av-icon">🔑</div>
          <h2>Access Restored</h2>
          <p>Once you reset your password, you will be able to log in immediately with your new credentials on all your devices.</p>
        </div>
      </div>
    </div>
  );
}
