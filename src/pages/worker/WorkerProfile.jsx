import { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { HiUser, HiPhone, HiMail, HiStar, HiBriefcase, HiLogout, HiMap, HiFolderOpen, HiCreditCard, HiCheckCircle } from 'react-icons/hi';
import { MdDirectionsCar } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import './Worker.css';

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

export default function WorkerProfile() {
  const user = useAuthStore(s => s.user);
  const updateWorkerAvailability = useAuthStore(s => s.updateWorkerAvailability);
  const updateWorkerProfile = useAuthStore(s => s.updateWorkerProfile);
  const logout = useAuthStore(s => s.logout);
  
  const navigate = useNavigate();
  
  const [showLogout, setShowLogout] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Profile fields state
  const [name, setName] = useState(user.name || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [address, setAddress] = useState(user.address || '');
  const [radius, setRadius] = useState(user.radius || 10);
  const [skillsInput, setSkillsInput] = useState((user.skills || []).join(', '));
  const [selectedCategories, setSelectedCategories] = useState(user.categories || []);
  const [photo, setPhoto] = useState(user.photo || '');

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPhoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Bank details extraction
  const bankStr = user.bank || '';
  const initialAcct = bankStr.match(/Acct:\s*([^,]+)/)?.[1] || '';
  const initialIfsc = bankStr.match(/IFSC:\s*([^,]+)/)?.[1] || '';
  const initialHolder = bankStr.match(/Name:\s*(.+)$/)?.[1] || '';

  const [bankAccount, setBankAccount] = useState(initialAcct);
  const [bankIfsc, setBankIfsc] = useState(initialIfsc);
  const [bankName, setBankName] = useState(initialHolder);

  const handleCategoryToggle = (catId) => {
    const exists = selectedCategories.includes(catId);
    if (exists) {
      setSelectedCategories(selectedCategories.filter(id => id !== catId));
    } else {
      setSelectedCategories([...selectedCategories, catId]);
    }
  };

  const handleLogout = () => { logout(); navigate('/'); };

  const handleSave = () => {
    const skills = skillsInput
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const bank = bankAccount ? `Acct: ${bankAccount}, IFSC: ${bankIfsc}, Name: ${bankName}` : 'Not provided';
    const primaryCategory = CATEGORY_OPTIONS.find(c => selectedCategories.includes(c.id))?.label || 'General Operator';

    const profileData = {
      name,
      phone,
      address,
      radius: Number(radius),
      skills,
      categories: selectedCategories,
      photo,
      bank,
      vehicle: `${primaryCategory} • ${user.experience || '3-5 years'} Exp`
    };

    updateWorkerProfile(user.id, profileData);
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const INFO = [
    { Icon: HiUser,          label: 'Full Name',  val: user.name },
    { Icon: HiPhone,         label: 'Phone',      val: user.phone },
    { Icon: HiMail,          label: 'Email',      val: user.email },
    { Icon: MdBuild,         label: 'Service Class', val: user.vehicle },
    { Icon: HiStar,          label: 'Rating',     val: `${user.rating} ★` },
    { Icon: HiBriefcase,     label: 'Jobs Done',  val: user.jobsDone },
  ];

  return (
    <div className="worker-page" style={{ paddingBottom: '32px' }}>
      <div className="wp-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HiUser className="wp-title-icon" style={{ width: '28px', height: '28px', color: 'var(--primary)' }} />
          <h1 style={{ fontSize: '24px', fontWeight: '800' }}>My Profile</h1>
        </div>
        <button
          onClick={isEditing ? handleSave : () => setIsEditing(true)}
          style={{
            background: isEditing ? '#10b981' : 'var(--primary)',
            color: '#fff',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '8px',
            fontWeight: '700',
            fontSize: '13px',
            cursor: 'pointer'
          }}
        >
          {isEditing ? '💾 Save Changes' : '✏️ Edit Profile'}
        </button>
      </div>

      {saveSuccess && (
        <div className="auth-error" style={{ background: '#ecfdf5', borderColor: '#a7f3d0', color: '#065f46', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HiCheckCircle style={{ width: '20px', height: '20px' }} />
          <span>Profile changes saved successfully!</span>
        </div>
      )}

      {/* Avatar Hero Card */}
      <div className="profile-hero" style={{ background: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', textAlign: 'center', marginBottom: '24px' }}>
        <div className="profile-avatar" style={{ width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 12px', overflow: 'hidden', border: '3px solid var(--primary-light)' }}>
          <img src={photo || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&q=80'} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        
        {isEditing ? (
          <div style={{ maxWidth: '300px', margin: '0 auto 12px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <input
              type="file"
              accept="image/*"
              id="edit-profile-photo-upload"
              onChange={handlePhotoUpload}
              style={{ display: 'none' }}
            />
            <label
              htmlFor="edit-profile-photo-upload"
              style={{
                display: 'inline-block',
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                padding: '6px 12px',
                borderRadius: '6px',
                fontWeight: '700',
                fontSize: '12px',
                cursor: 'pointer',
                border: '1.5px solid var(--primary)',
                textAlign: 'center',
                margin: '4px 0'
              }}
            >
              Upload New Photograph
            </label>
            <span style={{ fontSize: '10px', color: '#888' }}>PNG, JPG or WEBP formats</span>
          </div>
        ) : (
          <h2 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 4px' }}>{user.name}</h2>
        )}
        <span className="profile-role" style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: '700', padding: '2px 10px', borderRadius: '20px', fontSize: '11px' }}>
          Verified Service Professional
        </span>
        <div className="avail-toggle" style={{ justifyContent: 'center', marginTop: 12 }}>
          <span>Status:</span>
          <button
            className={`toggle-btn ${user.available ? 'on' : 'off'}`}
            onClick={() => updateWorkerAvailability(user.id, { online: !user.available })}
          >
            {user.available ? '● Online' : '○ Offline'}
          </button>
        </div>
      </div>

      {/* Editor or Viewer Panel */}
      {isEditing ? (
        <div className="worker-section" style={{ background: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', borderBottom: '1px solid #eee', paddingBottom: '10px', margin: 0 }}>Edit Information</h2>
          
          <label style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '13px', fontWeight: '600' }}>Full Name
            <input className="auth-input" value={name} onChange={e => setName(e.target.value)} style={{ padding: '10px', border: '1.5px solid #eee', borderRadius: '8px', fontSize: '14px' }} />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '13px', fontWeight: '600' }}>Contact Phone
            <input className="auth-input" value={phone} onChange={e => setPhone(e.target.value)} style={{ padding: '10px', border: '1.5px solid #eee', borderRadius: '8px', fontSize: '14px' }} />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '13px', fontWeight: '600' }}>Work Area Radius (Km)
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input type="range" min="2" max="30" value={radius} onChange={e => setRadius(e.target.value)} style={{ flex: 1, accentColor: 'var(--primary)' }} />
              <strong style={{ width: '50px', textAlign: 'right' }}>{radius} Km</strong>
            </div>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '13px', fontWeight: '600' }}>Operational Categories
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
              {CATEGORY_OPTIONS.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategoryToggle(cat.id)}
                  style={{
                    padding: '8px 12px',
                    border: '1.5px solid',
                    borderColor: selectedCategories.includes(cat.id) ? 'var(--primary)' : '#eee',
                    background: selectedCategories.includes(cat.id) ? 'var(--primary-light)' : '#fff',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '13px', fontWeight: '600' }}>Skills Tags (Comma-separated)
            <input className="auth-input" value={skillsInput} onChange={e => setSkillsInput(e.target.value)} placeholder="Wiring, Pipe leak repair" style={{ padding: '10px', border: '1.5px solid #eee', borderRadius: '8px', fontSize: '14px' }} />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '13px', fontWeight: '600' }}>Operational Address
            <input className="auth-input" value={address} onChange={e => setAddress(e.target.value)} style={{ padding: '10px', border: '1.5px solid #eee', borderRadius: '8px', fontSize: '14px' }} />
          </label>

          <fieldset style={{ border: '1.5px solid #eee', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <legend style={{ fontSize: '12px', fontWeight: '700', padding: '0 8px', color: 'var(--primary)' }}>Direct Bank Payout Details</legend>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>Account Number
              <input className="auth-input" value={bankAccount} onChange={e => setBankAccount(e.target.value.replace(/\D/g, ''))} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '6px' }} />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>IFSC Code
                <input className="auth-input" value={bankIfsc} onChange={e => setBankIfsc(e.target.value.toUpperCase())} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '6px' }} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>Beneficiary Name
                <input className="auth-input" value={bankName} onChange={e => setBankName(e.target.value)} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '6px' }} />
              </label>
            </div>
          </fieldset>

          <button
            onClick={handleSave}
            style={{
              background: '#10b981',
              color: '#fff',
              border: 'none',
              padding: '12px',
              borderRadius: '8px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            Save Profile Modifications
          </button>
          <button
            onClick={() => setIsEditing(false)}
            style={{
              background: 'none',
              border: '1.5px solid #eee',
              color: '#666',
              padding: '10px',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      ) : (
        <>
          {/* View Mode Info Cards */}
          <div className="worker-section" style={{ background: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', borderBottom: '1px solid #f9f9f9', paddingBottom: '10px', marginBottom: '14px' }}>Personal Info</h2>
            <div className="profile-info-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {INFO.map(({ Icon, label, val }) => (
                <div key={label} className="pi-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', borderBottom: '1px solid #fafafa', paddingBottom: '8px' }}>
                  <div className="pi-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#888' }}>
                    <Icon style={{ color: '#bbb', width: '16px', height: '16px' }} />
                    {label}
                  </div>
                  <div className="pi-val" style={{ fontWeight: '600', color: '#1a1a1a' }}>{val}</div>
                </div>
              ))}
              <div className="pi-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', borderBottom: '1px solid #fafafa', paddingBottom: '8px' }}>
                <div className="pi-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#888' }}>
                  <HiMap style={{ color: '#bbb', width: '16px', height: '16px' }} />
                  Radius & Address
                </div>
                <div className="pi-val" style={{ fontWeight: '600', color: '#1a1a1a', textAlign: 'right' }}>
                  {user.radius || 10} Km Radius <span style={{ display: 'block', fontSize: '11px', color: '#666', fontWeight: '400' }}>{user.address}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Categories & Skills tags */}
          <div className="worker-section" style={{ background: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px' }}>Work Class & Skills</h2>
            
            <div style={{ marginBottom: '16px' }}>
              <span style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '6px' }}>Operational Categories:</span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {(user.categories || []).map(catId => {
                  const label = CATEGORY_OPTIONS.find(c => c.id === catId)?.label || catId;
                  return (
                    <span key={catId} style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '12px' }}>
                      {label}
                    </span>
                  );
                })}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '6px' }}>Verified Skills:</span>
              {user.skills && user.skills.length > 0 ? (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {user.skills.map(s => (
                    <span key={s} style={{ background: '#f3f4f6', border: '1px solid #e5e5e5', color: '#4b5563', fontSize: '11px', padding: '4px 10px', borderRadius: '12px' }}>
                      {s}
                    </span>
                  ))}
                </div>
              ) : (
                <span style={{ fontSize: '13px', color: '#aaa', fontStyle: 'italic' }}>No skills tags added yet. Edit profile to add.</span>
              )}
            </div>
          </div>

          {/* Verification documents & Payout info */}
          <div className="worker-section" style={{ background: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '14px' }}>Verification & Bank Info</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: '#888', display: 'flex', alignItems: 'center', gap: '6px' }}><HiFolderOpen style={{ color: '#bbb' }} /> Aadhaar Verified</span>
                <strong style={{ color: '#1a1a1a' }}>{user.aadhar ? `XXXX XXXX ${user.aadhar.slice(-4)}` : 'Verified'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: '#888', display: 'flex', alignItems: 'center', gap: '6px' }}><HiFolderOpen style={{ color: '#bbb' }} /> PAN Card</span>
                <strong style={{ color: '#1a1a1a' }}>{user.pan ? `XXXXXX${user.pan.slice(-4)}` : 'Verified'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', borderTop: '1px solid #f9f9f9', paddingTop: '10px' }}>
                <span style={{ color: '#888', display: 'flex', alignItems: 'center', gap: '6px' }}><HiCreditCard style={{ color: '#bbb' }} /> Payout Ptr</span>
                <strong style={{ color: '#1a1a1a', fontSize: '12px', textAlign: 'right' }}>
                  {bankAccount ? (
                    <>
                      Acct: ...{bankAccount.slice(-4)}
                      <span style={{ display: 'block', fontSize: '10px', color: '#666', fontWeight: '400' }}>IFSC: {bankIfsc}</span>
                    </>
                  ) : (
                    'Not Configured'
                  )}
                </strong>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Customer Reviews List */}
      <div className="worker-section" style={{ background: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
        <h2>Customer Reviews ({user.reviews?.length || 0})</h2>
        {!user.reviews || user.reviews.length === 0 ? (
          <div className="empty-msg" style={{ padding: '16px 0 0' }}>No customer reviews posted yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
            {user.reviews.map((r, i) => (
              <div key={i} style={{ borderBottom: i < user.reviews.length - 1 ? '1px solid #f9f9f9' : 'none', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <strong style={{ fontSize: '13px', color: '#333' }}>{r.author}</strong>
                  <span style={{ fontSize: '11px', color: '#888' }}>{r.date}</span>
                </div>
                <div style={{ color: '#f59e0b', fontSize: '12px', marginBottom: '4px' }}>
                  {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: '#555', lineHeight: '1.4' }}>{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Logout */}
      {!isEditing && (
        <button className="logout-btn" onClick={() => setShowLogout(true)} style={{ width: '100%', marginTop: '24px', background: '#fee2e2', color: '#ef4444', border: '1px solid #fca5a5', padding: '12px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <HiLogout style={{ width: 18, height: 18 }} /> Logout Account
        </button>
      )}

      {showLogout && (
        <div className="modal-overlay" onClick={() => setShowLogout(false)}>
          <div className="confirm-modal" onClick={e => e.stopPropagation()}>
            <h3>Logout?</h3>
            <p>Are you sure you want to logout from your worker account?</p>
            <div className="cm-actions">
              <button className="cm-cancel" onClick={() => setShowLogout(false)}>Cancel</button>
              <button className="cm-confirm" onClick={handleLogout}>Logout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
