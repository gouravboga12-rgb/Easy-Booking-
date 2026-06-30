import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import {
  HiMail, HiLockClosed, HiUser, HiPhone, HiArrowRight,
  HiIdentification, HiTruck, HiBriefcase,
} from 'react-icons/hi';
import { MdConstruction, MdEngineering } from 'react-icons/md';
import './Auth.css';

const VEHICLE_TYPES = [
  'JCB / Backhoe', 'Excavator', 'Bulldozer', 'Crane', 'Dump Truck / Tipper',
  'Road Roller', 'Concrete Mixer', 'Forklift', 'Tractor', 'Water Tanker',
  'Plumber', 'Electrician', 'Carpenter', 'Painter', 'AC Technician', 'Other',
];

const EXPERIENCE_OPTIONS = ['Less than 1 year', '1–3 years', '3–5 years', '5–10 years', '10+ years'];

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuthStore();
  const navigate = useNavigate();

  const f = (key) => ({ value: form[key], onChange: e => setForm(p => ({ ...p, [key]: e.target.value })) });

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    setLoading(false);
    setStep(3);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (otp !== '123456') { setError('Invalid OTP. Use 123456 for demo'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const data = {
      name: form.name, email: form.email,
      phone: form.phone, password: form.password,
      role: 'customer',
    };
    const result = register(data);
    setLoading(false);
    if (result.error) { setError(result.error); setStep(1); return; }
    navigate('/login');
  };

  const [step, setStep] = useState(1);  // 1: form, 3: otp
  const STEPS = ['Details', 'OTP'];
  const currentStep = step === 1 ? 0 : 1;

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-brand"><MdConstruction className="auth-brand-icon" /> Easy<b>Booking</b></Link>

        {/* Step indicator */}
        {step > 0 && (
          <div className="reg-steps">
            {STEPS.map((s, i) => (
              <div key={s} className={`reg-step ${i < currentStep ? 'done' : i === currentStep ? 'active' : ''}`}>
                <div className="rs-dot">{i < currentStep ? '✓' : i + 1}</div>
                <span>{s}</span>
              </div>
            ))}
          </div>
        )}

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
                <div className="input-wrap"><HiMail className="input-icon" /><input type="email" placeholder="you@example.com" {...f('email')} required /></div>
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
                <span>Send OTP</span>
                <HiArrowRight style={{ width: 16, height: 16 }} />
              </button>
              
              <div className="auth-switch" style={{ marginTop: '16px' }}>
                Already have an account? <Link to="/login">Login</Link>
              </div>
            </form>
          </>
        )}

        {/* Step 3: OTP */}
        {step === 3 && (
          <>
            <h1>Verify Mobile</h1>
            <p className="auth-sub">OTP sent to {form.phone}</p>
            <form onSubmit={handleVerifyOtp}>
              <div className="otp-info">
                <HiPhone className="otp-info-icon" />
                <div>
                  <strong>OTP sent to {form.phone}</strong>
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
              <div className="otp-hint">💡 Demo OTP: <strong>123456</strong></div>
              {error && <div className="auth-error">⚠️ {error}</div>}
              <button type="submit" className="auth-submit" disabled={loading || otp.length !== 6}>
                {loading ? 'Creating account...' : <><span>Verify & Create Account</span> <HiArrowRight style={{ width: 16, height: 16 }} /></>}
              </button>
              <button type="button" className="auth-back" onClick={() => { setStep(1); setOtp(''); setError(''); }}>← Back</button>
            </form>
          </>
        )}
      </div>

      <div className="auth-visual">
        <div className="av-content">
          <div className="av-icon">🚜</div>
          <h2>Join 12M+ customers on EasyBooking</h2>
          <p>Get verified operators, live tracking, and instant booking for all your construction needs.</p>
          <div className="av-features">
            <div>✅ Verified & insured operators</div>
            <div>✅ Real-time GPS tracking</div>
            <div>✅ Transparent pricing</div>
            <div>✅ 24/7 support</div>
          </div>
        </div>
      </div>
    </div>
  );
}
