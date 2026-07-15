import { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useStore } from '../../store/useStore';
import { HiStar, HiPhone, HiCheck, HiX, HiIdentification, HiCreditCard, HiTrash, HiFolderOpen, HiUser, HiBriefcase } from 'react-icons/hi';
import { MdDirectionsCar } from 'react-icons/md';
import './Admin.css';

const downloadBase64 = (base64String, fileName) => {
  try {
    if (!base64String || typeof base64String !== 'string') return;
    if (!base64String.startsWith('data:')) {
      const link = document.createElement('a');
      link.href = base64String;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    const parts = base64String.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);

    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }

    const blob = new Blob([uInt8Array], { type: contentType });
    const blobUrl = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  } catch (e) {
    console.error("Base64 download failed:", e);
    const link = document.createElement('a');
    link.href = base64String;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

const CATEGORIES = [
  { id: 'contractors', label: 'Contractors & Civil' },
  { id: 'construction-labour', label: 'Construction & Site Labour' },
  { id: 'interior-carpentry', label: 'Interior & Carpentry' },
  { id: 'professionals', label: 'Maintenance Professionals' },
  { id: 'installations', label: 'Technical Installations' },
  { id: 'housekeeping', label: 'Housekeeping & Cleaning' },
  { id: 'drivers-logistics', label: 'Drivers & Logistics' },
  { id: 'cooking-events', label: 'Cooking & Events' },
];

export default function AdminWorkers() {
  const users = useAuthStore(s => s.users);
  const approveWorker = useAuthStore(s => s.approveWorker);
  const updateWorkerAvailability = useAuthStore(s => s.updateWorkerAvailability);
  const updateWorkerProfile = useAuthStore(s => s.updateWorkerProfile);
  const disableWorker = useAuthStore(s => s.disableWorker);
  const deleteWorker = useAuthStore(s => s.deleteWorker);
  
  const orders = useStore(s => s.orders);
  
  const workers = users.filter(u => u.role === 'worker');
  const activeWorkers = workers;

  const [selectedWorkerId, setSelectedWorkerId] = useState(null);
  const [editingWorker, setEditingWorker] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', phone: '', vehicle: '', address: '', skillsInput: '' });
  const [confirmDeleteWorker, setConfirmDeleteWorker] = useState(null);
  const [actionMsg, setActionMsg] = useState('');
  
  // State to view details in a separate page view
  const [viewReviewsWorker, setViewReviewsWorker] = useState(null);
  const [viewDocUrl, setViewDocUrl] = useState(null);
  const [viewDocTitle, setViewDocTitle] = useState('');

  const handleEditClick = (w) => {
    setEditingWorker(w);
    setEditForm({
      name: w.name,
      phone: w.phone,
      vehicle: w.vehicle,
      address: w.address,
      skillsInput: (w.skills || []).join(', ')
    });
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingWorker) return;
    const skills = editForm.skillsInput.split(',').map(s => s.trim()).filter(s => s.length > 0);
    updateWorkerProfile(editingWorker.id, {
      name: editForm.name,
      phone: editForm.phone,
      vehicle: editForm.vehicle,
      address: editForm.address,
      skills
    });
    setEditingWorker(null);
  };

  // Render separate full page layout if reviews worker is selected
  if (viewReviewsWorker) {
    const worker = viewReviewsWorker;
    const workerOrders = orders.filter(o => o.operator?.id === worker.id);
    const completedOrders = workerOrders.filter(o => o.status === 'completed');

    return (
      <div className="admin-page" style={{ paddingBottom: '40px' }}>
        <div style={{ marginBottom: '16px' }}>
          <button
            onClick={() => setViewReviewsWorker(null)}
            style={{
              background: '#f1f5f9',
              color: '#475569',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            ⬅ Back to Operators List
          </button>
        </div>

        <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #eee', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px' }}>
            <img 
              src={worker.photo || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=120&q=80'} 
              alt={worker.name} 
              style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary-light)' }} 
            />
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800' }}>{worker.name}</h2>
              <span style={{ color: 'var(--primary)', fontSize: '13px', fontWeight: '600' }}>👷 {worker.vehicle}</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginTop: '20px' }}>
            {/* Work History */}
            <div style={{ background: '#fafafa', padding: '20px', borderRadius: '12px', border: '1px solid #eee' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', margin: '0 0 12px', borderBottom: '1.5px solid #e2e8f0', paddingBottom: '6px', color: '#1e293b' }}>
                📋 Work History ({completedOrders.length})
              </h3>
              {completedOrders.length === 0 ? (
                <p style={{ color: '#aaa', fontStyle: 'italic', fontSize: '13px' }}>No completed orders on this platform yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {completedOrders.map(o => (
                    <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#fff', border: '1px solid #eee', borderRadius: '6px', fontSize: '13px' }}>
                      <div>
                        <strong>{o.vehicle.name}</strong> <span style={{ color: '#888' }}>#{o.id}</span>
                        <span style={{ display: 'block', fontSize: '11px', color: '#666', marginTop: '2px' }}>📅 {o.booking.date} · {o.booking.location}</span>
                      </div>
                      <strong style={{ color: '#10b981' }}>₹{o.booking.total?.toLocaleString()}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Customer Reviews */}
            <div style={{ background: '#fafafa', padding: '20px', borderRadius: '12px', border: '1px solid #eee' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', margin: '0 0 12px', borderBottom: '1.5px solid #e2e8f0', paddingBottom: '6px', color: '#1e293b' }}>
                ⭐ Customer Reviews & Ratings ({worker.reviews?.length || 0})
              </h3>
              {!worker.reviews || worker.reviews.length === 0 ? (
                <p style={{ color: '#aaa', fontStyle: 'italic', fontSize: '13px' }}>No customer feedback reviews yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {worker.reviews.map((r, idx) => (
                    <div key={idx} style={{ padding: '12px', background: '#fff', border: '1px solid #eee', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', color: '#334155', fontSize: '13px' }}>
                        <span>👤 {r.author || 'Anonymous Client'}</span>
                        <span style={{ color: '#f59e0b' }}>{'★'.repeat(r.rating)}</span>
                      </div>
                      <p style={{ margin: '6px 0 0', color: '#475569', lineHeight: '1.4', fontSize: '12.5px', fontStyle: 'italic' }}>"{r.comment}"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page" style={{ paddingBottom: '32px' }}>
      <div className="admin-header">
        <div>
          <h1>Worker Verification & Management</h1>
          <p>Verify operator credentials, approve new registrations, block/suspend accounts, manage profiles, and view ratings/work history</p>
        </div>
      </div>

      {/* ── ACTIVE WORKERS LIST ── */}
      <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px' }}>Active Service Operators ({activeWorkers.length})</h2>
      <div className="workers-grid">
        {activeWorkers.map(w => {
          const workerOrders = orders.filter(o => o.operator?.id === w.id);
          const completedOrders = workerOrders.filter(o => o.status === 'completed');
          const isSelected = selectedWorkerId === w.id;

          return (
            <div key={w.id} className="worker-card" style={{ padding: '20px', background: '#fff', border: '1px solid #eee', borderRadius: '14px', position: 'relative' }}>
              <div className="wc-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div className="wc-avatar" style={{ overflow: 'hidden', width: '50px', height: '50px', borderRadius: '50%', border: '2px solid var(--primary-light)' }}>
                  <img src={w.photo || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=120&q=80'} alt={w.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <div className={`wc-status ${w.available ? 'on' : 'off'}`} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '10px' }}>
                    {w.available ? '● Available' : '● Busy/Offline'}
                  </div>
                  <span style={{ fontSize: '10px', color: '#999' }}>
                    {w.subscription?.active ? `Plan: ${w.subscription.plan}` : 'No active plan'}
                  </span>
                </div>
              </div>

              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 6px' }}>{w.name}</h3>
              
              <p className="wc-vehicle" style={{ fontSize: '13px', color: '#666', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MdDirectionsCar style={{ color: 'var(--primary)' }} />
                {w.vehicle}
              </p>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', margin: '8px 0' }}>
                {(w.skills || []).map(skill => (
                  <span key={skill} style={{ background: '#f3f4f6', color: '#4b5563', fontSize: '10px', padding: '2px 8px', borderRadius: '20px', border: '1px solid #e5e7eb' }}>
                    {skill}
                  </span>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid #f9f9f9', paddingTop: '12px', marginTop: '12px' }}>
                {/* Top row: Edit + Expand */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleEditClick(w)}
                    style={{ flex: 1, background: '#f3f4f6', color: '#4b5563', border: 'none', padding: '8px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}
                  >
                    ✏ Edit Profile
                  </button>
                  <button
                    onClick={() => setSelectedWorkerId(isSelected ? null : w.id)}
                    style={{ background: isSelected ? 'var(--primary)' : '#fff', color: isSelected ? '#fff' : 'var(--primary)', border: '1.5px solid var(--primary)', width: '38px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {isSelected ? '▲' : '▼'}
                  </button>
                </div>
                {/* Bottom row: Disable + Delete */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={async () => {
                      const newDisabled = !w.disabled;
                      await disableWorker(w.id, newDisabled);
                      setActionMsg(newDisabled ? `${w.name}'s account disabled.` : `${w.name}'s account re-enabled.`);
                      setTimeout(() => setActionMsg(''), 3000);
                    }}
                    style={{
                      flex: 1,
                      background: w.disabled ? '#dcfce7' : '#fef9c3',
                      color: w.disabled ? '#15803d' : '#854d0e',
                      border: `1px solid ${w.disabled ? '#86efac' : '#fde047'}`,
                      padding: '7px 8px',
                      borderRadius: '8px',
                      fontWeight: '700',
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                  >
                    {w.disabled ? '✅ Enable Account' : '🚫 Disable Account'}
                  </button>
                  <button
                    onClick={() => setConfirmDeleteWorker(w)}
                    style={{
                      flex: 1,
                      background: '#fef2f2',
                      color: '#dc2626',
                      border: '1px solid #fca5a5',
                      padding: '7px 8px',
                      borderRadius: '8px',
                      fontWeight: '700',
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                  >
                    🗑 Delete Worker
                  </button>
                </div>
              </div>

              {/* Collapsible details pane */}
              {isSelected && (
                <div style={{ marginTop: '16px', borderTop: '1px solid #eee', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px', color: '#555', marginBottom: '14px' }}>
                    <span>📍 <strong>Address:</strong> {w.address}</span>
                    <span>📞 <strong>Phone:</strong> {w.phone}</span>
                    <span>✉ <strong>Email:</strong> {w.email}</span>
                    <span>🆔 <strong>Aadhaar No:</strong> {w.aadhar || 'Not Provided'}</span>
                    <span>💳 <strong>PAN No:</strong> {w.pan || 'Not Provided'}</span>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                    <strong style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>Verification Documents</strong>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      {/* Aadhaar Copy Actions */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569' }}>Aadhaar Copy:</span>
                        {w.aadhar_photo ? (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button 
                              type="button"
                              onClick={() => { setViewDocUrl(w.aadhar_photo); setViewDocTitle('Aadhaar Card Copy'); }}
                              style={{ 
                                flex: 1, 
                                border: '1px solid #bfdbfe', 
                                background: '#fff',
                                color: '#2563eb',
                                padding: '6px 4px', 
                                borderRadius: '6px', 
                                textAlign: 'center', 
                                fontSize: '10px', 
                                fontWeight: '700',
                                cursor: 'pointer'
                              }}
                            >
                              👁️ View
                            </button>
                            <button 
                              type="button"
                              onClick={() => downloadBase64(w.aadhar_photo, `Aadhaar_${w.name.replace(/\s+/g, '_')}.jpg`)}
                              style={{ 
                                flex: 1, 
                                border: 'none', 
                                background: '#2563eb', 
                                color: '#fff', 
                                padding: '6px 4px', 
                                borderRadius: '6px', 
                                textAlign: 'center', 
                                fontSize: '10px', 
                                fontWeight: '700',
                                cursor: 'pointer'
                              }}
                            >
                              📥 Download
                            </button>
                          </div>
                        ) : (
                          <span style={{ padding: '6px 10px', background: '#f1f5f9', color: '#94a3b8', borderRadius: '6px', textAlign: 'center', fontSize: '11px' }}>No Aadhaar Copy</span>
                        )}
                      </div>

                      {/* PAN Copy Actions */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569' }}>PAN Copy:</span>
                        {w.pan_photo ? (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button 
                              type="button"
                              onClick={() => { setViewDocUrl(w.pan_photo); setViewDocTitle('PAN Card Copy'); }}
                              style={{ 
                                flex: 1, 
                                border: '1px solid #bfdbfe', 
                                background: '#fff',
                                color: '#2563eb',
                                padding: '6px 4px', 
                                borderRadius: '6px', 
                                textAlign: 'center', 
                                fontSize: '10px', 
                                fontWeight: '700',
                                cursor: 'pointer'
                              }}
                            >
                              👁️ View
                            </button>
                            <button 
                              type="button"
                              onClick={() => downloadBase64(w.pan_photo, `PAN_${w.name.replace(/\s+/g, '_')}.jpg`)}
                              style={{ 
                                flex: 1, 
                                border: 'none', 
                                background: '#2563eb', 
                                color: '#fff', 
                                padding: '6px 4px', 
                                borderRadius: '6px', 
                                textAlign: 'center', 
                                fontSize: '10px', 
                                fontWeight: '700',
                                cursor: 'pointer'
                              }}
                            >
                              📥 Download
                            </button>
                          </div>
                        ) : (
                          <span style={{ padding: '6px 10px', background: '#f1f5f9', color: '#94a3b8', borderRadius: '6px', textAlign: 'center', fontSize: '11px' }}>No PAN Copy</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Header containing separate page reviews options */}
                  <div style={{ margin: '14px 0 10px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setViewReviewsWorker(w)}
                      style={{
                        width: '100%',
                        background: '#6d28d9',
                        color: '#fff',
                        border: 'none',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        fontSize: '12.5px',
                        fontWeight: '800',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 4px rgba(109, 40, 217, 0.2)',
                        transition: 'all 0.15s ease',
                        marginBottom: '10px'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#5b21b6'}
                      onMouseLeave={e => e.currentTarget.style.background = '#6d28d9'}
                    >
                      📊 View All Reviews & Full Work History
                    </button>
                    <h4 style={{ margin: 0, fontSize: '12px', color: '#475569', fontWeight: '800' }}>Work History Preview</h4>
                  </div>

                  {/* Work History preview list */}
                  {completedOrders.length === 0 ? (
                    <p style={{ color: '#aaa', fontStyle: 'italic', margin: '0 0 10px', fontSize: '12px' }}>No completed bookings yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                      {completedOrders.slice(0, 3).map(o => (
                        <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: '4px', fontSize: '11.5px' }}>
                          <span>{o.vehicle.name} <span style={{ color: '#888' }}>#{o.id.slice(-6)}</span></span>
                          <strong style={{ color: '#10b981' }}>₹{o.booking.total?.toLocaleString()}</strong>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Customer Reviews preview list */}
                  {!w.reviews || w.reviews.length === 0 ? (
                    <p style={{ color: '#aaa', fontStyle: 'italic', margin: 0, fontSize: '12px' }}>No customer feedback reviews yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {w.reviews.slice(0, 2).map((r, idx) => (
                        <div key={idx} style={{ padding: '8px 10px', background: '#fafafa', border: '1px solid #eee', borderRadius: '6px', fontSize: '11.5px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600', color: '#444' }}>
                            <span>{r.author}</span>
                            <span style={{ color: '#f59e0b' }}>{'★'.repeat(r.rating)}</span>
                          </div>
                          <p style={{ margin: '4px 0 0', color: '#666', lineHeight: '1.3' }}>"{r.comment}"</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action Toast */}
      {actionMsg && (
        <div style={{ position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)', background: '#1e293b', color: '#fff', padding: '10px 22px', borderRadius: '12px', fontSize: '13px', fontWeight: '700', zIndex: 9999, boxShadow: '0 4px 20px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          ✅ {actionMsg}
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDeleteWorker && (
        <div className="modal-overlay" onClick={() => setConfirmDeleteWorker(null)}>
          <div className="confirm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '380px', width: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '40px' }}>🗑️</span>
              <h3 style={{ margin: '8px 0 4px', fontSize: '18px' }}>Delete Worker Account</h3>
              <p style={{ color: '#666', fontSize: '13px', margin: 0 }}>
                Are you sure you want to permanently delete <strong>{confirmDeleteWorker.name}</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="cm-actions">
              <button className="cm-cancel" onClick={() => setConfirmDeleteWorker(null)}>Cancel</button>
              <button
                className="cm-confirm"
                style={{ background: '#dc2626' }}
                onClick={async () => {
                  await deleteWorker(confirmDeleteWorker.id);
                  setConfirmDeleteWorker(null);
                  setActionMsg(`${confirmDeleteWorker.name}'s account deleted.`);
                  setTimeout(() => setActionMsg(''), 3000);
                }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Worker Profile Modal */}
      {editingWorker && (
        <div className="modal-overlay" onClick={() => setEditingWorker(null)}>
          <div className="confirm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px', width: '100%' }}>
            <h3>Edit Operator Profile</h3>
            <p style={{ fontSize: '12px', color: '#666', margin: '0 0 16px' }}>Modify profile parameters directly for {editingWorker.name}</p>
            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: '700' }}>
                Full Name:
                <input style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px' }} value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} required />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: '700' }}>
                Contact Phone:
                <input style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px' }} value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} required />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: '700' }}>
                Professional Service Class:
                <input style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px' }} value={editForm.vehicle} onChange={e => setEditForm(p => ({ ...p, vehicle: e.target.value }))} required />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: '700' }}>
                Operational Address:
                <input style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px' }} value={editForm.address} onChange={e => setEditForm(p => ({ ...p, address: e.target.value }))} required />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: '700' }}>
                Skills Tags (Comma-separated):
                <input style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px' }} value={editForm.skillsInput} onChange={e => setEditForm(p => ({ ...p, skillsInput: e.target.value }))} />
              </label>

              <div className="cm-actions" style={{ marginTop: '10px' }}>
                <button type="button" className="cm-cancel" onClick={() => setEditingWorker(null)}>Cancel</button>
                <button type="submit" className="cm-confirm" style={{ background: '#10b981' }}>Save Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document View Overlay Modal */}
      {viewDocUrl && (
        <div className="modal-overlay" onClick={() => setViewDocUrl(null)} style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: '#fff',
            padding: '24px',
            borderRadius: '16px',
            position: 'relative',
            maxWidth: '560px',
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px'
          }} onClick={e => e.stopPropagation()}>
            <button 
              type="button"
              onClick={() => setViewDocUrl(null)} 
              style={{
                position: 'absolute',
                top: '16px', right: '16px',
                background: '#f1f5f9',
                color: '#64748b',
                border: 'none',
                width: '32px', height: '32px',
                borderRadius: '50%',
                fontSize: '16px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
              onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
            >
              ✕
            </button>
            <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '800', color: '#1e293b' }}>
              {viewDocTitle}
            </h3>
            <div style={{ width: '100%', maxHeight: '420px', overflowY: 'auto', display: 'flex', justifyContent: 'center', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px', background: '#f8fafc' }}>
              {viewDocUrl.startsWith('data:application/pdf') || viewDocUrl.endsWith('.pdf') ? (
                <embed src={viewDocUrl} type="application/pdf" width="100%" height="380px" />
              ) : (
                <img src={viewDocUrl} alt={viewDocTitle} style={{ maxWidth: '100%', maxHeight: '380px', objectFit: 'contain', borderRadius: '6px' }} />
              )}
            </div>
            <button 
              type="button"
              onClick={() => downloadBase64(viewDocUrl, `${viewDocTitle.replace(/\s+/g, '_')}.jpg`)}
              style={{
                background: 'var(--primary)',
                color: '#fff',
                border: 'none',
                padding: '11px 20px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                width: '100%',
                transition: 'background 0.18s'
              }}
            >
              📥 Download Document Copy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
