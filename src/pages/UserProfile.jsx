import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useStore } from '../store/useStore';
import { HiUser, HiPhone, HiMail, HiLocationMarker, HiClipboardList, HiLogout } from 'react-icons/hi';
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
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);
  const [viewAllOrders, setViewAllOrders] = useState(false);

  if (!user) return null;

  // Correct live stats using customer ID instead of email
  const customerOrders = orders.filter(o => o.customer?.id === user.id || o.customerId === user.id);
  const activeOrders = customerOrders.filter(o => ['pending', 'assigned', 'active', 'arrived'].includes(o.status));
  const completedOrders = customerOrders.filter(o => o.status === 'completed');

  const visibleOrders = viewAllOrders ? customerOrders : customerOrders.slice(0, 3);

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

  const handleLogoutClick = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="worker-page" style={{ padding: '24px 16px 40px', maxWidth: '800px', margin: '0 auto' }}>
      <div className="wp-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#1a1a1a', margin: 0 }}>My Account</h1>
          <p style={{ fontSize: '13px', color: '#666', margin: '4px 0 0' }}>Manage your personal details and bookings</p>
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

      {/* Live Recent Services list card layout */}
      <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '800', borderBottom: '1.5px solid #f9f9f9', paddingBottom: '12px', marginBottom: '16px', color: '#1a1a1a' }}>
          📋 Recent Service Orders
        </h3>
        {customerOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: '#888', fontSize: '13px' }}>
            No orders found. Book a service and track it in real time here!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {visibleOrders.map(o => (
              <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', background: '#fafafa', borderRadius: '12px', border: '1px solid #f0f0f0', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: '13.5px', color: '#1e293b' }}>{o.vehicle?.name || 'Professional Service'}</strong>
                    <span className={`status-chip ${o.status}`} style={{ fontSize: '9px', padding: '2px 6px', textTransform: 'uppercase' }}>
                      {o.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span>📍 {o.booking?.location}</span>
                    <span>📅 {o.booking?.date} • {o.booking?.duration} {o.vehicle?.unit === 'hr' ? 'hrs' : 'trips'}</span>
                    {o.operator && (
                      <span style={{ color: 'var(--primary)', fontWeight: '700', marginTop: '2px' }}>
                        👷 Worker: {o.operator.name}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                  <strong style={{ fontSize: '15px', color: '#1e293b' }}>₹{o.booking?.total?.toLocaleString()}</strong>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => navigate(`/track/${o.id}`)}
                      style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      Track Job
                    </button>
                    {o.status === 'completed' && (
                      <button
                        onClick={() => setSelectedInvoiceOrder(o)}
                        style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                      >
                        Receipt
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* View All Toggle Button */}
            {customerOrders.length > 3 && (
              <button
                onClick={() => setViewAllOrders(!viewAllOrders)}
                style={{
                  width: '100%',
                  background: '#f8fafc',
                  color: 'var(--primary)',
                  border: '1px solid #e2e8f0',
                  padding: '10px',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  marginTop: '8px',
                  transition: 'all 0.2s ease'
                }}
              >
                {viewAllOrders ? 'Show Less ⬆️' : `View All Orders ⬇️ (${customerOrders.length})`}
              </button>
            )}
          </div>
        )}
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

      {/* Customer visual invoice summary modal */}
      {selectedInvoiceOrder && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={() => setSelectedInvoiceOrder(null)}>
          <div style={{ background: '#fff', width: '100%', maxWidth: '440px', borderRadius: '16px', padding: '24px', position: 'relative', boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
            <button style={{ position: 'absolute', right: '16px', top: '16px', border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', color: '#888' }} onClick={() => setSelectedInvoiceOrder(null)}>×</button>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '32px', marginBottom: '6px' }}>🧾</div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 4px', color: '#1e293b' }}>Service Invoice</h3>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Reference ID: #{selectedInvoiceOrder.id}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px dashed #e2e8f0', borderBottom: '1px dashed #e2e8f0', padding: '16px 0', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}><span style={{ color: '#64748b' }}>Service Requested</span><strong style={{ color: '#0f172a' }}>{selectedInvoiceOrder.vehicle?.name}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}><span style={{ color: '#64748b' }}>Service Date</span><strong style={{ color: '#0f172a' }}>{selectedInvoiceOrder.booking?.date}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}><span style={{ color: '#64748b' }}>Duration / Scope</span><strong style={{ color: '#0f172a' }}>{selectedInvoiceOrder.booking?.duration} {selectedInvoiceOrder.vehicle?.unit === 'hr' ? 'Hours' : 'Trips'}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}><span style={{ color: '#64748b' }}>Assigned Partner</span><strong style={{ color: '#0f172a' }}>{selectedInvoiceOrder.operator?.name || 'Verified Professional'}</strong></div>
              {selectedInvoiceOrder.booking?.notes && (
                <div style={{ fontSize: '12px', background: '#f8fafc', padding: '8px', borderRadius: '6px', marginTop: '4px', border: '1px solid #f1f5f9' }}>
                  <strong style={{ display: 'block', color: '#475569', marginBottom: '2px' }}>Order Notes/Instructions:</strong>
                  <span style={{ color: '#64748b', display: 'block', whiteSpace: 'pre-wrap' }}>{selectedInvoiceOrder.booking.notes}</span>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '16px', fontWeight: '800', color: '#1e293b' }}>
              <span>Total Bill Paid</span>
              <span style={{ color: 'var(--primary)', fontSize: '20px' }}>₹{selectedInvoiceOrder.booking?.total?.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
              <button onClick={() => window.print()} style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', flex: 1 }}>Print Receipt</button>
              <button onClick={() => setSelectedInvoiceOrder(null)} style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', flex: 1 }}>Close Window</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
