import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import {
  HiMail, HiLockClosed, HiUser, HiPhone, HiArrowRight,
} from 'react-icons/hi';
import { MdConstruction } from 'react-icons/md';
import './Auth.css';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [step, setStep] = useState(1);
  const cooldownRef = useRef(null);

  const { register, sendRegisterOtp, resendRegisterOtp } = useAuthStore();
  const navigate = useNavigate();

  const f = (key) => ({ value: form[key], onChange: e => setForm(p => ({ ...p, [key]: e.target.value })) });

  const startCooldown = (seconds = 60) => {
    setResendCooldown(seconds);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(cooldownRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => () => { if (cooldownRef.current) clearInterval(cooldownRef.current); }, []);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    const result = await sendRegisterOtp(form.email, form.name);
    setLoading(false);
    if (result.error) { setError(result.error); }
    else { setStep(3); startCooldown(60); }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resendLoading) return;
    setError('');
    setSuccessMsg('');
    setResendLoading(true);
    const result = await resendRegisterOtp(form.email, form.name);
    setResendLoading(false);
    if (result.error) { setError(result.error); }
    else {
      setOtp('');
      setSuccessMsg('New OTP sent! Check your email.');
      startCooldown(60);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (otp.length !== 6) { setError('Please enter a valid 6-digit OTP'); return; }
    setLoading(true);
    const result = await register({ name: form.name, email: form.email, phone: form.phone, password: form.password, role: 'customer', otp });
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    navigate('/login');
  };

  const STEPS = ['Details', 'OTP'];
  const currentStep = step === 1 ? 0 : 1;

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-brand"><MdConstruction className="auth-brand-icon" /> Parrow <b>Skills</b></Link>

        <div className="reg-steps">
          {STEPS.map((s, i) => (
            <div key={s} className={`reg-step ${i < currentStep ? 'done' : i === currentStep ? 'active' : ''}`}>
              <div className="rs-dot">{i < currentStep ? '✓' : i + 1}</div>
              <span>{s}</span>
            </div>
          ))}
        </div>

        {/* Step 1: Basic Details */}
        {step === 1 && (
          <>
            <h1>Create Account</h1>
            <p className="auth-sub">Enter your basic details</p>
            <form onSubmit={handleFormSubmit}>
              <label>Full Name
                <div className="input-wrap"><HiUser className="input-icon" /><input placeholder="Arjun Sharma" {...f('name')} required /></div>
              </label>
              <label>Email
                <div className="input-wrap"><HiMail className="input-icon" /><input type="email" placeholder="you@example.com" {...f('email')} required autoCapitalize="none" autoCorrect="off" /></div>
              </label>
              <label>Phone
                <div className="input-wrap"><HiPhone className="input-icon" /><input type="tel" placeholder="+91 98765 43210" {...f('phone')} required /></div>
              </label>
              <label>Password
                <div className="input-wrap"><HiLockClosed className="input-icon" /><input type="password" placeholder="Min. 6 characters" {...f('password')} required /></div>
              </label>
              <label>Confirm Password
                <div className="input-wrap"><HiLockClosed className="input-icon" /><input type="password" placeholder="Repeat password" {...f('confirm')} required /></div>
              </label>
              {error && <div className="auth-error">⚠️ {error}</div>}
              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? 'Sending OTP...' : <><span>Send OTP</span><HiArrowRight style={{ width: 16, height: 16 }} /></>}
              </button>
              <div className="auth-switch" style={{ marginTop: '16px' }}>
                Already have an account? <Link to="/login">Login</Link>
              </div>
            </form>
          </>
        )}

        {/* Step 2: OTP Verification */}
        {step === 3 && (
          <>
            <h1>Verify Email</h1>
            <p className="auth-sub">OTP sent to {form.email}</p>
            <form onSubmit={handleVerifyOtp}>
              <div className="otp-info">
                <HiMail className="otp-info-icon" />
                <div>
                  <strong>OTP sent to {form.email}</strong>
                  <p>Enter the 6-digit code to verify</p>
                </div>
              </div>

              <label>Enter OTP
                <div className="input-wrap">
                  <HiLockClosed className="input-icon" />
                  <input
                    type="text" placeholder="123456" value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6} required autoFocus
                  />
                </div>
              </label>

              {error && <div className="auth-error">⚠️ {error}</div>}
              {successMsg && (
                <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '8px' }}>
                  ✅ {successMsg}
                </div>
              )}

              <button type="submit" className="auth-submit" disabled={loading || otp.length !== 6}>
                {loading ? 'Creating account...' : <><span>Verify &amp; Create Account</span> <HiArrowRight style={{ width: 16, height: 16 }} /></>}
              </button>

              {/* Resend OTP section */}
              <div style={{ textAlign: 'center', marginTop: '12px' }}>
                {resendCooldown > 0 ? (
                  <p style={{ fontSize: '13px', color: '#888', margin: 0 }}>
                    Resend OTP in <strong style={{ color: '#6366f1' }}>{resendCooldown}s</strong>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendLoading}
                    style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: '13px', fontWeight: '700', cursor: 'pointer', padding: '4px 0', textDecoration: 'underline' }}
                  >
                    {resendLoading ? 'Sending...' : "Didn't receive OTP? Resend"}
                  </button>
                )}
              </div>

              <button type="button" className="auth-back" onClick={() => { setStep(1); setOtp(''); setError(''); if (cooldownRef.current) clearInterval(cooldownRef.current); }}>
                ← Back
              </button>
            </form>
          </>
        )}
      </div>

      <div className="auth-visual">
        <div className="av-content">
          <div className="av-icon">🚜</div>
          <h2>Join 12M+ customers on Parrow Skills</h2>
          <p>Get verified operators, live tracking, and instant booking for all your construction needs.</p>
          <div className="av-features">
            <div>✅ Verified &amp; insured operators</div>
            <div>✅ Real-time GPS tracking</div>
            <div>✅ Transparent pricing</div>
            <div>✅ 24/7 support</div>
          </div>
        </div>
      </div>
    </div>
  );
}
