import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { HiMail, HiLockClosed, HiArrowRight, HiChevronLeft } from 'react-icons/hi';
import { MdConstruction } from 'react-icons/md';
import './Auth.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(1); // 1 = Enter Email, 2 = Enter OTP & New Password
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { forgotPassword, resetPassword } = useAuthStore();
  const navigate = useNavigate();

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    const result = await forgotPassword(email);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setMessage('A 6-digit OTP code has been sent to your email address.');
      setStep(2);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const result = await resetPassword(email, otp, password);
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
        <h1>{success ? 'Reset Successful' : step === 1 ? 'Forgot Password' : 'Verify OTP'}</h1>
        <p className="auth-sub">
          {success
            ? 'Your password has been reset successfully'
            : step === 1
            ? 'Enter your email address to receive a 6-digit security OTP'
            : 'Enter the 6-digit OTP code and choose your new password'}
        </p>

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
        ) : step === 1 ? (
          <form onSubmit={handleRequestOtp}>
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
              {loading ? 'Sending code...' : <><span>Send Verification OTP</span> <HiArrowRight style={{ width: 16, height: 16 }} /></>}
            </button>
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <Link to="/login" style={{ color: '#888', textDecoration: 'none', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <HiChevronLeft /> Back to Login
              </Link>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
            {message && <div style={{ color: '#4caf50', fontSize: '14px', marginBottom: '16px', fontWeight: 500 }}>{message}</div>}
            
            <label>6-Digit OTP Code
              <div className="input-wrap">
                <HiLockClosed className="input-icon" />
                <input type="text" placeholder="123456" maxLength={6} value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} required
                  autoCapitalize="none" autoCorrect="off" style={{ letterSpacing: '8px', fontSize: '18px', fontWeight: 'bold' }} />
              </div>
            </label>

            <label>New Password
              <div className="input-wrap">
                <HiLockClosed className="input-icon" />
                <input type="password" placeholder="••••••••" value={password}
                  onChange={e => setPassword(e.target.value)} required />
              </div>
            </label>

            <label>Confirm Password
              <div className="input-wrap">
                <HiLockClosed className="input-icon" />
                <input type="password" placeholder="••••••••" value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)} required />
              </div>
            </label>

            {error && <div className="auth-error">⚠️ {error}</div>}
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Resetting password...' : <><span>Reset Password</span> <HiArrowRight style={{ width: 16, height: 16 }} /></>}
            </button>
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button type="button" onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: 0 }}>
                <HiChevronLeft /> Change Email
              </button>
              <button type="button" onClick={handleRequestOtp} style={{ background: 'none', border: 'none', color: '#ff8c00', cursor: 'pointer', fontSize: '14px', fontWeight: 500, padding: 0 }} disabled={loading}>
                Resend OTP
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="auth-visual">
        <div className="av-content">
          <div className="av-icon">🔒</div>
          <h2>OTP Verification</h2>
          <p>We send a unique 6-digit security code to your registered email to ensure only you can access and change your password.</p>
        </div>
      </div>
    </div>
  );
}
