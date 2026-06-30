import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useStore } from '../store/useStore';
import { HiUser, HiPhone, HiMail, HiLocationMarker, HiLockClosed, HiClipboardList, HiLogout } from 'react-icons/hi';
import './worker/Worker.css'; // Reuse worker layout visual systems or simple styles

export default function UserProfile() {
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const updateUserProfile = useAuthStore(s => s.updateUserProfile);
  const orders = useStore(s => s.orders);
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || 'Enable location to add address'
  });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passSuccess, setPassSuccess] = useState(false);

  if (!user) return null;

  const customerOrders = orders.filter(o => o.customer?.email === user.email);
  const activeOrders = customerOrders.filter(o => ['pending', 'assigned', 'active'].includes(o.status));
  const completedOrders = customerOrders.filter(o => o.status === 'completed');

  const handleSave = (e) => {
    e.preventDefault();
    updateUserProfile(user.id, {
      name: form.name,
      phone: form.phone,
      address: form.address
    });
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (!newPassword.trim()) return;
    updateUserProfile(user.id, { password: newPassword });
    setNewPassword('');
    setPassSuccess(true);
    setTimeout(() => setPassSuccess(false), 3000);
  };

  const handleLogoutClick = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="worker-page" style={{ padding: '24px 16px 40px', maxWidth: '800px', margin: '0 auto' }}>
      <div className="wp-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#1a1a1a', margin: 0 }}>My Account</h1>
          <p style={{ fontSize: '13px', color: '#666', margin: '4px 0 0' }}>Manage your personal details, bookings, and password</p>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          style={{
            background: isEditing ? '#fee2e2' : 'var(--primary-light)',
            color: isEditing ? '#dc2626' : 'var(--primary)',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '8px',
            fontWeight: '700',
            fontSize: '13px',
            cursor: 'pointer'
          }}
        >
          {isEditing ? 'Cancel' : '✏️ Edit Profile'}
        </button>
      </div>

      {saveSuccess && (
        <div style={{ background: '#d1fae5', color: '#065f46', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontWeight: '600', fontSize: '14px' }}>
          ✓ Profile details updated successfully!
        </div>
      )}

      {/* Hero Section */}
      <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary) 0%, #3b82f6 100%)', color: '#fff', fontSize: '32px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)' }}>
          {user.name.charAt(0).toUpperCase()}
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1a1a1a', margin: '0 0 4px' }}>{user.name}</h2>
        <span style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: '700', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {user.role} Member
        </span>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)', border: '1px solid #f0f0f0', textAlign: 'center' }}>
          <HiClipboardList style={{ fontSize: '24px', color: 'var(--primary)', marginBottom: '6px' }} />
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#1a1a1a' }}>{customerOrders.length}</div>
          <div style={{ fontSize: '11px', color: '#666', fontWeight: '600' }}>Total Bookings</div>
        </div>
        <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)', border: '1px solid #f0f0f0', textAlign: 'center' }}>
          <HiClipboardList style={{ fontSize: '24px', color: '#eab308', marginBottom: '6px' }} />
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#1a1a1a' }}>{activeOrders.length}</div>
          <div style={{ fontSize: '11px', color: '#666', fontWeight: '600' }}>Active Jobs</div>
        </div>
        <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)', border: '1px solid #f0f0f0', textAlign: 'center' }}>
          <HiClipboardList style={{ fontSize: '24px', color: '#10b981', marginBottom: '6px' }} />
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#1a1a1a' }}>{completedOrders.length}</div>
          <div style={{ fontSize: '11px', color: '#666', fontWeight: '600' }}>Completed Jobs</div>
        </div>
      </div>

      {/* Main Form Block */}
      <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '800', borderBottom: '1.5px solid #f9f9f9', paddingBottom: '12px', marginBottom: '16px', color: '#1a1a1a' }}>
          👤 Personal Details
        </h3>

        {isEditing ? (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: '700', color: '#444' }}>
              Full Name
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                required
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: '700', color: '#444' }}>
              Phone Number
              <input
                type="text"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                required
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: '700', color: '#444' }}>
              Operational Address
              <input
                type="text"
                value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                required
              />
            </label>
            <button type="submit" className="cm-confirm" style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '14px', marginTop: '8px' }}>
              Save Details
            </button>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                <HiUser />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', color: '#888', fontWeight: '600' }}>Full Name</div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a1a' }}>{user.name}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                <HiPhone />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', color: '#888', fontWeight: '600' }}>Phone Number</div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a1a' }}>{user.phone || 'Not added'}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                <HiMail />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', color: '#888', fontWeight: '600' }}>Email Address</div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a1a' }}>{user.email}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                <HiLocationMarker />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', color: '#888', fontWeight: '600' }}>Default Address</div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a1a' }}>{user.address || 'Not specified'}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Security Block */}
      <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', marginBottom: '32px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '800', borderBottom: '1.5px solid #f9f9f9', paddingBottom: '12px', marginBottom: '16px', color: '#1a1a1a' }}>
          🔒 Security Credentials
        </h3>

        {passSuccess && (
          <div style={{ background: '#d1fae5', color: '#065f46', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontWeight: '600', fontSize: '13px' }}>
            ✓ Password updated successfully!
          </div>
        )}

        <form onSubmit={handlePasswordChange} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <label style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: '700', color: '#444' }}>
            Change Password
            <div style={{ position: 'relative' }}>
              <HiLockClosed style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
              <input
                type="password"
                placeholder="Enter new account password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                style={{ padding: '10px 10px 10px 38px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', outline: 'none', width: '100%' }}
                required
              />
            </div>
          </label>
          <button type="submit" style={{ background: '#1a1a2e', color: '#fff', border: 'none', padding: '11px 20px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
            Update Password
          </button>
        </form>
      </div>

      {/* Logout Action */}
      <button
        onClick={handleLogoutClick}
        style={{
          width: '100%',
          background: '#fee2e2',
          color: '#dc2626',
          border: 'none',
          padding: '14px',
          borderRadius: '12px',
          fontWeight: '800',
          fontSize: '14px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
      >
        <HiLogout /> Logout Account
      </button>
    </div>
  );
}
