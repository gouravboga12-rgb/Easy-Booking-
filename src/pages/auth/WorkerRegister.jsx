import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import {
  HiMail, HiLockClosed, HiUser, HiPhone, HiArrowRight,
  HiIdentification, HiBriefcase, HiMap, HiFolderOpen, HiCreditCard
} from 'react-icons/hi';
import { MdConstruction } from 'react-icons/md';
import './Auth.css';

const CATEGORY_OPTIONS = [
  { id: 'contractors', label: 'Contractors & Civil' },
  { id: 'construction-labour', label: 'Construction & Site Labour' },
  { id: 'interior-carpentry', label: 'Interior & Carpentry' },
  { id: 'professionals', label: 'Maintenance Professionals' },
  { id: 'installations', label: 'Technical Installations' },
  { id: 'housekeeping', label: 'Housekeeping & Cleaning' },
  { id: 'drivers-logistics', label: 'Drivers & Logistics' },
  { id: 'cooking-events', label: 'Cooking & Events' },
];

const EXPERIENCE_OPTIONS = ['Less than 1 year', '1–3 years', '3–5 years', '5–10 years', '10+ years'];

export default function WorkerRegister() {
  const [step, setStep] = useState(1);  // 1: Basic Info, 2: Professional Details, 3: Verification & Bank, 4: Success Message
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [professionalForm, setProfessionalForm] = useState({
    experience: '',
    skillsInput: '',
    categories: [],
    radius: 10,
    address: ''
  });
  const [verificationForm, setVerificationForm] = useState({
    aadhar: '',
    pan: '',
    profilePhoto: '',
    aadharCopy: '',
    aadharCopyName: '',
    panCopy: '',
    panCopyName: '',
    bankAccount: '',
    bankIfsc: '',
    bankName: '',
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuthStore();
  const navigate = useNavigate();

  // Change handlers
  const handleBasicChange = (key, value) => setForm(p => ({ ...p, [key]: value }));
  const handleProfChange = (key, value) => setProfessionalForm(p => ({ ...p, [key]: value }));
  const handleVerifChange = (key, value) => setVerificationForm(p => ({ ...p, [key]: value }));

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        handleVerifChange('profilePhoto', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAadharCopyUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setVerificationForm(p => ({
          ...p,
          aadharCopy: reader.result,
          aadharCopyName: file.name
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePanCopyUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setVerificationForm(p => ({
          ...p,
          panCopy: reader.result,
          panCopyName: file.name
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCategoryToggle = (catId) => {
    setProfessionalForm(p => {
      const exists = p.categories.includes(catId);
      const categories = exists ? p.categories.filter(id => id !== catId) : [...p.categories, catId];
      return { ...p, categories };
    });
  };

  const handleStep1Submit = (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setStep(2);
  };

  const handleStep2Submit = (e) => {
    e.preventDefault();
    setError('');
    if (professionalForm.categories.length === 0) { setError('Please select at least one work category'); return; }
    if (!professionalForm.experience) { setError('Please select your experience level'); return; }
    if (!professionalForm.address) { setError('Please enter your operational address'); return; }
    setStep(3);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!verificationForm.aadhar || verificationForm.aadhar.length !== 12) {
      setError('Aadhaar number must be exactly 12 digits');
      return;
    }
    if (!verificationForm.pan || verificationForm.pan.length !== 10) {
      setError('PAN Card number must be exactly 10 characters');
      return;
    }

    setLoading(true);
    await new Promise(r => setTimeout(r, 1000)); // Simulate file/doc uploads

    const skills = professionalForm.skillsInput
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const vehicleType = CATEGORY_OPTIONS.find(c => professionalForm.categories.includes(c.id))?.label || 'General Operator';

    const data = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      password: form.password,
      role: 'worker',
      vehicle: `${vehicleType} • ${professionalForm.experience} Exp`,
      experience: professionalForm.experience,
      skills,
      categories: professionalForm.categories,
      radius: Number(professionalForm.radius),
      address: professionalForm.address,
      aadhar: verificationForm.aadhar,
      pan: verificationForm.pan.toUpperCase(),
      photo: verificationForm.profilePhoto || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&q=80',
      bank: verificationForm.bankAccount ? `Acct: ${verificationForm.bankAccount}, IFSC: ${verificationForm.bankIfsc}, Name: ${verificationForm.bankName}` : 'Not provided',
      aadharPhoto: verificationForm.aadharCopy,
      panPhoto: verificationForm.panCopy,
    };

    const result = register(data);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setStep(4); // Success approval state
  };

  const STEPS = ['Account Details', 'Professional Info', 'Verification Documents'];
  const currentStep = step - 1;

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: '540px', width: '100%' }}>
        <Link to="/" className="auth-brand"><MdConstruction className="auth-brand-icon" /> Parrow <b>Skills</b></Link>

        {/* Step indicator */}
        {step < 4 && (
          <div className="reg-steps" style={{ marginBottom: '32px' }}>
            {STEPS.map((s, i) => (
              <div key={s} className={`reg-step ${i < currentStep ? 'done' : i === currentStep ? 'active' : ''}`}>
                <div className="rs-dot">{i < currentStep ? '✓' : i + 1}</div>
                <span>{s}</span>
              </div>
            ))}
          </div>
        )}

        {/* Step 1: Basic Account Details */}
        {step === 1 && (
          <>
            <h1>Worker Registration</h1>
            <p className="auth-sub">Create your worker login credentials</p>
            <form onSubmit={handleStep1Submit}>
              <label>Full Name
                <div className="input-wrap"><HiUser className="input-icon" /><input placeholder="Ravi Kumar" value={form.name} onChange={e => handleBasicChange('name', e.target.value)} required /></div>
              </label>
              <label>Email
                <div className="input-wrap"><HiMail className="input-icon" /><input type="email" placeholder="ravi@example.com" value={form.email} onChange={e => handleBasicChange('email', e.target.value)} required autoCapitalize="none" autoCorrect="off" /></div>
              </label>
              <label>Phone / Mobile Number
                <div className="input-wrap"><HiPhone className="input-icon" /><input type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={e => handleBasicChange('phone', e.target.value)} required /></div>
              </label>
              <label>Password
                <div className="input-wrap"><HiLockClosed className="input-icon" /><input type="password" placeholder="Min. 6 characters" value={form.password} onChange={e => handleBasicChange('password', e.target.value)} required /></div>
              </label>
              <label>Confirm Password
                <div className="input-wrap"><HiLockClosed className="input-icon" /><input type="password" placeholder="Repeat password" value={form.confirm} onChange={e => handleBasicChange('confirm', e.target.value)} required /></div>
              </label>
              {error && <div className="auth-error">⚠️ {error}</div>}
              <button type="submit" className="auth-submit">
                <span>Continue: Professional Details</span>
                <HiArrowRight style={{ width: 16, height: 16 }} />
              </button>
              
              <div className="auth-switch" style={{ marginTop: '16px' }}>
                Already have a worker account? <Link to="/login-worker">Login</Link>
              </div>
            </form>
          </>
        )}

        {/* Step 2: Professional Details */}
        {step === 2 && (
          <>
            <h1>Professional Profile</h1>
            <p className="auth-sub">Specify your experience, category of work, and service radius</p>
            <form onSubmit={handleStep2Submit}>
              <label>Years of Experience
                <div className="input-wrap">
                  <HiBriefcase className="input-icon" />
                  <select className="auth-select" value={professionalForm.experience} onChange={e => handleProfChange('experience', e.target.value)} required>
                    <option value="">Select experience level...</option>
                    {EXPERIENCE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </label>

              <label>Work Categories (Select all that apply)
                <div className="category-selection-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '6px' }}>
                  {CATEGORY_OPTIONS.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      className={`role-card ${professionalForm.categories.includes(c.id) ? 'active' : ''}`}
                      onClick={() => handleCategoryToggle(c.id)}
                      style={{
                        padding: '10px 14px',
                        border: '1.5px solid',
                        borderColor: professionalForm.categories.includes(c.id) ? 'var(--primary)' : '#eee',
                        borderRadius: '8px',
                        background: professionalForm.categories.includes(c.id) ? 'var(--primary-light)' : '#fff',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '600',
                        textAlign: 'left'
                      }}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </label>

              <label style={{ marginTop: '10px' }}>Skills (Comma-separated list)
                <div className="input-wrap"><HiIdentification className="input-icon" /><input placeholder="Wiring, Pipe leak repair, Tile scrubbing" value={professionalForm.skillsInput} onChange={e => handleProfChange('skillsInput', e.target.value)} /></div>
              </label>

              <label>Service Area Radius (Km)
                <div className="range-wrap" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '4px 0' }}>
                  <input type="range" min="2" max="30" step="1" value={professionalForm.radius} onChange={e => handleProfChange('radius', e.target.value)} style={{ flex: 1, accentColor: 'var(--primary)', padding: 0 }} />
                  <strong style={{ fontSize: '15px', color: '#1a1a1a', width: '50px', textAlign: 'right' }}>{professionalForm.radius} Km</strong>
                </div>
              </label>

              <label>Operational Address (Current Location)
                <div className="input-wrap"><HiMap className="input-icon" /><input placeholder="Apartment, Street, City, State" value={professionalForm.address} onChange={e => handleProfChange('address', e.target.value)} required /></div>
              </label>

              {error && <div className="auth-error">⚠️ {error}</div>}
              <button type="submit" className="auth-submit">
                <span>Continue: Verification Docs</span>
                <HiArrowRight style={{ width: 16, height: 16 }} />
              </button>
              <button type="button" className="auth-back" onClick={() => setStep(1)} style={{ marginTop: '8px' }}>← Back</button>
            </form>
          </>
        )}

        {/* Step 3: Verification & Bank details */}
        {step === 3 && (
          <>
            <h1>Verification Documents</h1>
            <p className="auth-sub">Submit Aadhaar, PAN card, and optional banking details for direct payouts</p>
            <form onSubmit={handleRegisterSubmit}>
              <label>Aadhaar Card Number (12 digits)
                <div className="input-wrap"><HiIdentification className="input-icon" /><input type="text" maxLength={12} placeholder="123456789012" value={verificationForm.aadhar} onChange={e => handleVerifChange('aadhar', e.target.value.replace(/\D/g, ''))} required /></div>
              </label>

              <label>PAN Card Number (10 characters)
                <div className="input-wrap"><HiIdentification className="input-icon" /><input type="text" maxLength={10} placeholder="ABCDE1234F" value={verificationForm.pan} onChange={e => handleVerifChange('pan', e.target.value.toUpperCase())} required /></div>
              </label>

              <label>Profile Photograph
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '6px', marginBottom: '10px' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#f3f4f6', border: '1.5px solid #ddd', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {verificationForm.profilePhoto ? (
                      <img src={verificationForm.profilePhoto} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '20px' }}>📷</span>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <input
                      type="file"
                      accept="image/*"
                      id="profile-photo-upload"
                      onChange={handlePhotoUpload}
                      style={{ display: 'none' }}
                      required={!verificationForm.profilePhoto}
                    />
                    <label
                      htmlFor="profile-photo-upload"
                      style={{
                        display: 'inline-block',
                        background: 'var(--primary-light)',
                        color: 'var(--primary)',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontWeight: '700',
                        fontSize: '13px',
                        cursor: 'pointer',
                        border: '1.5px solid var(--primary)',
                        textAlign: 'center',
                        margin: 0
                      }}
                    >
                      {verificationForm.profilePhoto ? 'Change Photo' : 'Upload Profile Photo'}
                    </label>
                    <span style={{ display: 'block', fontSize: '11px', color: '#888', marginTop: '4px' }}>PNG, JPG or WEBP formats</span>
                  </div>
                </div>
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '14px' }}>
                <label>Aadhaar Card Copy (Upload Image/PDF)
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      id="aadhar-copy-upload"
                      onChange={handleAadharCopyUpload}
                      style={{ display: 'none' }}
                      required={!verificationForm.aadharCopy}
                    />
                    <label
                      htmlFor="aadhar-copy-upload"
                      style={{
                        background: 'var(--primary-light)',
                        color: 'var(--primary)',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontWeight: '700',
                        fontSize: '13px',
                        cursor: 'pointer',
                        border: '1.5px solid var(--primary)',
                        margin: 0
                      }}
                    >
                      {verificationForm.aadharCopy ? 'Change Aadhaar Copy' : 'Upload Aadhaar Copy'}
                    </label>
                    <span style={{ fontSize: '12px', color: '#555', wordBreak: 'break-all' }}>
                      {verificationForm.aadharCopyName ? `📄 ${verificationForm.aadharCopyName}` : 'No file chosen'}
                    </span>
                  </div>
                </label>

                <label>PAN Card Copy (Upload Image/PDF)
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      id="pan-copy-upload"
                      onChange={handlePanCopyUpload}
                      style={{ display: 'none' }}
                      required={!verificationForm.panCopy}
                    />
                    <label
                      htmlFor="pan-copy-upload"
                      style={{
                        background: 'var(--primary-light)',
                        color: 'var(--primary)',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontWeight: '700',
                        fontSize: '13px',
                        cursor: 'pointer',
                        border: '1.5px solid var(--primary)',
                        margin: 0
                      }}
                    >
                      {verificationForm.panCopy ? 'Change PAN Copy' : 'Upload PAN Copy'}
                    </label>
                    <span style={{ fontSize: '12px', color: '#555', wordBreak: 'break-all' }}>
                      {verificationForm.panCopyName ? `📄 ${verificationForm.panCopyName}` : 'No file chosen'}
                    </span>
                  </div>
                </label>
              </div>

              <fieldset style={{ border: '1.5px solid #eee', borderRadius: '12px', padding: '16px', margin: '4px 0 10px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <legend style={{ fontSize: '12px', fontWeight: '700', padding: '0 8px', color: 'var(--primary)' }}>Bank Details (Optional)</legend>
                <label>Account Number
                  <div className="input-wrap"><HiCreditCard className="input-icon" /><input type="text" placeholder="1092837465" value={verificationForm.bankAccount} onChange={e => handleVerifChange('bankAccount', e.target.value.replace(/\D/g, ''))} /></div>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <label>IFSC Code
                    <div className="input-wrap"><HiCreditCard className="input-icon" /><input placeholder="SBIN0001234" value={verificationForm.bankIfsc} onChange={e => handleVerifChange('bankIfsc', e.target.value.toUpperCase())} /></div>
                  </label>
                  <label>Beneficiary Name
                    <div className="input-wrap"><HiUser className="input-icon" /><input placeholder="Ravi Kumar" value={verificationForm.bankName} onChange={e => handleVerifChange('bankName', e.target.value)} /></div>
                  </label>
                </div>
              </fieldset>

              {error && <div className="auth-error">⚠️ {error}</div>}
              <button type="submit" className="auth-submit" disabled={loading}>
                {loading ? 'Submitting Details...' : <><span>Complete Registration</span> <HiArrowRight style={{ width: 16, height: 16 }} /></>}
              </button>
              <button type="button" className="auth-back" onClick={() => setStep(2)} style={{ marginTop: '8px' }}>← Back</button>
            </form>
          </>
        )}

        {/* Step 4: Success Message (Pending Approval status) */}
        {step === 4 && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🕒</div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>Registration Submitted!</h1>
            <p className="auth-sub" style={{ fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
              Your worker registration has been successfully uploaded. To ensure service quality and customer safety, all operator accounts require <strong>manual review and activation</strong> by our administrator team.
            </p>
            <div className="otp-info" style={{ background: '#eff6ff', borderColor: '#bfdbfe', marginBottom: '24px' }}>
              <div style={{ textAlign: 'left' }}>
                <strong style={{ color: '#1d4ed8' }}>Next Steps:</strong>
                <ul style={{ paddingLeft: '16px', margin: '4px 0 0', fontSize: '12px', color: '#4b5563', lineHeight: '1.6' }}>
                  <li>Admin will verify Aadhaar ({verificationForm.aadhar}) & PAN ({verificationForm.pan.toUpperCase()}) copy.</li>
                  <li>Account activation notification will be sent via mobile.</li>
                  <li>Once approved, log in via worker portal using your email.</li>
                </ul>
              </div>
            </div>
            <button className="auth-submit" onClick={() => navigate('/login-worker')}>
              Go to Worker Login Portal
            </button>
          </div>
        )}
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
