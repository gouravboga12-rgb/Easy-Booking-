import { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useStore } from '../../store/useStore';
import { HiUsers, HiPhone, HiMail, HiLockOpen, HiTrash, HiBan, HiClock, HiChevronDown, HiChevronUp, HiPrinter } from 'react-icons/hi';
import './Admin.css';

export default function AdminCustomers() {
  const users = useAuthStore(s => s.users);
  const toggleBlockUser = useAuthStore(s => s.toggleBlockUser);
  const deleteUser = useAuthStore(s => s.deleteUser);
  const resetUserPassword = useAuthStore(s => s.resetUserPassword);
  
  const orders = useStore(s => s.orders);
  
  const customers = users.filter(u => u.role === 'customer');

  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [resettingUserId, setResettingUserId] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Custom expandable lists mapping & invoice popup states
  const [viewAllBookingsMap, setViewAllBookingsMap] = useState({});
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);

  const handleResetPasswordSubmit = (e, userId) => {
    e.preventDefault();
    if (!newPassword) return;
    resetUserPassword(userId, newPassword);
    setNewPassword('');
    setResettingUserId(null);
    setSuccessMsg('Password successfully reset!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="admin-page" style={{ paddingBottom: '32px' }}>
      <div className="admin-header">
        <div>
          <h1>Customer Management</h1>
          <p>Monitor customer platform usage, manage block lists, reset passwords, and view booking history</p>
        </div>
      </div>

      {successMsg && (
        <div className="auth-error" style={{ background: '#ecfdf5', borderColor: '#a7f3d0', color: '#065f46', marginBottom: '20px' }}>
          ✔️ {successMsg}
        </div>
      )}

      <div className="customers-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {customers.length === 0 ? (
          <div className="empty-msg">No customers registered yet.</div>
        ) : (
          customers.map(c => {
            const custOrders = orders.filter(o => o.customer?.id === c.id || o.customerId === c.id);
            const spent = custOrders.filter(o => o.status === 'completed').reduce((s, o) => s + (o.booking?.total || 0), 0);
            const isSelected = selectedCustomerId === c.id;

            return (
              <div key={c.id} style={{ background: '#fff', border: '1px solid #eee', borderRadius: '14px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '800' }}>
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '700', color: '#1a1a1a', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <span>{c.name}</span>
                        {c.blocked && (
                          <span style={{ fontSize: '10px', background: '#fee2e2', color: '#ef4444', padding: '1px 6px', borderRadius: '4px', fontWeight: '700' }}>
                            🚫 Suspended
                          </span>
                        )}
                      </h3>
                      <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#666' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><HiMail /> {c.email}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><HiPhone /> {c.phone || 'No Mobile'}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => toggleBlockUser(c.id)}
                      style={{
                        background: c.blocked ? '#fef2f2' : '#f3f4f6',
                        color: c.blocked ? '#dc2626' : '#4b5563',
                        border: '1px solid',
                        borderColor: c.blocked ? '#fca5a5' : '#e5e5e5',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <HiBan /> {c.blocked ? 'Unblock' : 'Suspend'}
                    </button>

                    <button
                      onClick={() => setResettingUserId(resettingUserId === c.id ? null : c.id)}
                      style={{
                        background: '#eff6ff',
                        color: '#2563eb',
                        border: '1px solid #bfdbfe',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <HiLockOpen /> Password Reset
                    </button>

                    <button
                      onClick={() => { if (window.confirm('Delete customer account permanently?')) deleteUser(c.id); }}
                      style={{
                        background: '#fff',
                        color: '#ef4444',
                        border: '1px solid #fca5a5',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <HiTrash /> Delete
                    </button>

                    <button
                      onClick={() => setSelectedCustomerId(isSelected ? null : c.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#666',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {isSelected ? <HiChevronUp style={{ width: 18, height: 18 }} /> : <HiChevronDown style={{ width: 18, height: 18 }} />}
                    </button>
                  </div>
                </div>

                {/* Password reset input drawer */}
                {resettingUserId === c.id && (
                  <form
                    onSubmit={(e) => handleResetPasswordSubmit(e, c.id)}
                    style={{ marginTop: '14px', background: '#fafafa', padding: '12px', borderRadius: '8px', border: '1px solid #eee', display: 'flex', gap: '8px', alignItems: 'center' }}
                  >
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#444' }}>Set Password:</span>
                    <input
                      type="password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      style={{ padding: '6px 10px', fontSize: '13px', border: '1px solid #ddd', borderRadius: '6px', flex: 1 }}
                      required
                    />
                    <button
                      type="submit"
                      style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      Save Password
                    </button>
                  </form>
                )}

                {/* Info / Booking Drawer */}
                {isSelected && (
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f3f4f6' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                      <div style={{ background: '#fafafa', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                        <span style={{ display: 'block', fontSize: '11px', color: '#888' }}>Total Bookings</span>
                        <strong style={{ fontSize: '16px', color: '#333' }}>{custOrders.length}</strong>
                      </div>
                      <div style={{ background: '#fafafa', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                        <span style={{ display: 'block', fontSize: '11px', color: '#888' }}>Spent Total</span>
                        <strong style={{ fontSize: '16px', color: '#333' }}>₹{spent.toLocaleString()}</strong>
                      </div>
                      <div style={{ background: '#fafafa', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                        <span style={{ display: 'block', fontSize: '11px', color: '#888' }}>Completed Jobs</span>
                        <strong style={{ fontSize: '16px', color: '#333' }}>{custOrders.filter(o => o.status === 'completed').length}</strong>
                      </div>
                    </div>

                    <h4 style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: '700', color: '#444' }}>Booking History</h4>
                    {custOrders.length === 0 ? (
                      <p style={{ color: '#aaa', fontStyle: 'italic', fontSize: '12px', margin: 0 }}>No orders placed by this customer.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {(() => {
                          const showAll = viewAllBookingsMap[c.id] || false;
                          const visibleOrders = showAll ? custOrders : custOrders.slice(0, 3);
                          return (
                            <>
                              {visibleOrders.map(o => (
                                <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', padding: '8px 12px', background: '#fcfcfc', border: '1px solid #f0f0f0', borderRadius: '6px' }}>
                                  <div>
                                    <strong>{o.vehicle.name}</strong> <span style={{ color: '#888' }}>#{o.id}</span>
                                    <span style={{ display: 'block', fontSize: '11px', color: '#666', marginTop: '2px' }}><HiClock style={{ verticalAlign: 'middle', marginRight: '3px' }} /> {o.booking.date} · {o.booking.location}</span>
                                  </div>
                                  <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div>
                                      <strong style={{ display: 'block', color: 'var(--primary)' }}>₹{o.booking.total?.toLocaleString()}</strong>
                                      <span style={{ fontSize: '10px', textTransform: 'capitalize', color: o.status === 'completed' ? '#10b981' : '#f59e0b' }}>{o.status}</span>
                                    </div>
                                    {o.status === 'completed' && (
                                      <button
                                        onClick={() => setSelectedInvoiceOrder(o)}
                                        style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '700', cursor: 'pointer' }}
                                      >
                                        Invoice
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                              {custOrders.length > 3 && (
                                <button
                                  type="button"
                                  onClick={() => setViewAllBookingsMap(prev => ({ ...prev, [c.id]: !showAll }))}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--primary)',
                                    cursor: 'pointer',
                                    fontSize: '11.5px',
                                    fontWeight: '700',
                                    textAlign: 'center',
                                    padding: '4px 0',
                                    marginTop: '4px',
                                    alignSelf: 'center'
                                  }}
                                >
                                  {showAll ? 'Collapse Bookings ⬆' : `View All Bookings ⬇ (${custOrders.length})`}
                                </button>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Invoice modal overlay */}
      {selectedInvoiceOrder && (
        <div className="invoice-modal-overlay print-receipt-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={() => setSelectedInvoiceOrder(null)}>
          <div className="invoice-modal-card print-receipt-card" style={{ background: '#fff', width: '100%', maxWidth: '440px', borderRadius: '16px', padding: '24px', position: 'relative', boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
            <button className="print-hide-btn" style={{ position: 'absolute', right: '16px', top: '16px', border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', color: '#888' }} onClick={() => setSelectedInvoiceOrder(null)}>×</button>
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
            <div className="print-actions" style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
              <button onClick={() => window.print()} style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><HiPrinter /> Print Receipt</button>
              <button onClick={() => setSelectedInvoiceOrder(null)} style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', flex: 1 }}>Close Window</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
