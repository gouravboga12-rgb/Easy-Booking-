import { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useStore } from '../../store/useStore';
import { HiStar, HiPhone, HiCheck, HiX, HiIdentification, HiCreditCard, HiTrash, HiFolderOpen, HiUser, HiBriefcase } from 'react-icons/hi';
import { MdDirectionsCar } from 'react-icons/md';
import './Admin.css';

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
  
  const orders = useStore(s => s.orders);
  
  const workers = users.filter(u => u.role === 'worker');
  const pendingWorkers = workers.filter(w => !w.approved);
  const activeWorkers = workers.filter(w => w.approved);

  const [selectedWorkerId, setSelectedWorkerId] = useState(null);
  const [editingWorker, setEditingWorker] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', phone: '', vehicle: '', address: '', skillsInput: '' });

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

  return (
    <div className="admin-page" style={{ paddingBottom: '32px' }}>
      <div className="admin-header">
        <div>
          <h1>Worker Verification & Management</h1>
          <p>Verify operator credentials, approve new registrations, block/suspend accounts, manage profiles, and view ratings/work history</p>
        </div>
      </div>

      {/* ── PENDING VERIFICATIONS SECTION ── */}
      <div className="admin-section" style={{ background: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '800', borderBottom: '1.5px solid #f9f9f9', paddingBottom: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>📋 Pending Approval Requests</span>
          <span style={{ fontSize: '12px', background: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: '10px', fontWeight: '700' }}>
            {pendingWorkers.length} Action Required
          </span>
        </h2>

        {pendingWorkers.length === 0 ? (
          <p style={{ color: '#888', fontStyle: 'italic', margin: 0, padding: '10px 0' }}>No pending worker registrations to review.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {pendingWorkers.map(w => (
              <div key={w.id} style={{ border: '1px solid #f1f5f9', borderRadius: '12px', padding: '20px', background: '#fafafa', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ flex: 1, minWidth: '280px' }}>
                  <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: '700', color: '#1a1a1a' }}>{w.name}</h3>
                  <div style={{ fontSize: '13px', color: '#666', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div><strong>📧 Email:</strong> {w.email} | <strong>📞 Phone:</strong> {w.phone}</div>
                    <div><strong>📍 Address:</strong> {w.address}</div>
                    <div><strong>🛠️ Skills:</strong> {w.skills?.join(', ') || 'General'}</div>
                    <div style={{ marginTop: '6px', background: '#fff', border: '1px solid #eee', padding: '10px', borderRadius: '8px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#444' }}><HiIdentification style={{ color: 'var(--primary)' }} /> Aadhaar: {w.aadhar} (Verified)</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#444' }}><HiIdentification style={{ color: 'var(--primary)' }} /> PAN: {w.pan} (Verified)</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#444' }}><HiCreditCard style={{ color: 'var(--primary)' }} /> Bank Details: Submitted</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignSelf: 'center' }}>
                  <button
                    onClick={() => approveWorker(w.id, true)}
                    style={{ background: '#10b981', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <HiCheck /> Approve & Activate
                  </button>
                  <button
                    onClick={() => { if (window.confirm('Reject this worker registration application?')) approveWorker(w.id, false); }}
                    style={{ background: 'none', border: '1.5px solid #fca5a5', color: '#dc2626', padding: '8px 20px', borderRadius: '8px', fontWeight: '600', fontSize: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <HiX /> Reject Registration
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── ACTIVE WORKERS LIST ── */}
      <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px' }}>Active Service Operators ({activeWorkers.length})</h2>
      <div className="workers-grid">
        {activeWorkers.map(w => {
          const workerOrders = orders.filter(o => o.operator?.id === w.id);
          const completedOrders = workerOrders.filter(o => o.status === 'completed');
          const activeJob = orders.find(o => o.operator?.id === w.id && ['assigned', 'active'].includes(o.status));
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
              <p className="wc-phone" style={{ fontSize: '13px', color: '#888', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <HiPhone />
                {w.phone}
              </p>

              <div className="wc-stats" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', textAlign: 'center', background: '#fafafa', padding: '10px', borderRadius: '10px', marginBottom: '12px' }}>
                <div>
                  <strong style={{ display: 'block', fontSize: '14px', color: '#1a1a1a' }}>
                    <HiStar style={{ color: '#f59e0b', verticalAlign: 'middle', marginRight: '2px' }} /> {w.rating}
                  </strong>
                  <span style={{ fontSize: '10px', color: '#888' }}>Rating</span>
                </div>
                <div>
                  <strong style={{ display: 'block', fontSize: '14px', color: '#1a1a1a' }}>{w.jobsDone}</strong>
                  <span style={{ fontSize: '10px', color: '#888' }}>Jobs Done</span>
                </div>
                <div>
                  <strong style={{ display: 'block', fontSize: '14px', color: '#1a1a1a' }}>{workerOrders.length}</strong>
                  <span style={{ fontSize: '10px', color: '#888' }}>Jobs Pool</span>
                </div>
              </div>

              {activeJob && (
                <div className="active-job-badge" style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#ef4444', fontSize: '11px', padding: '4px', borderRadius: '6px', textAlign: 'center', fontWeight: '700', marginBottom: '10px' }}>
                  🔴 On Job: #{activeJob.id.slice(-6)} ({activeJob.vehicle.name})
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => handleEditClick(w)}
                    style={{ flex: 1, background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '6px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    ✏️ Edit Profile
                  </button>
                  <button
                    onClick={() => setSelectedWorkerId(isSelected ? null : w.id)}
                    style={{ flex: 1, background: '#f3f4f6', color: '#4b5563', border: '1px solid #e5e5e5', padding: '6px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    {isSelected ? '🔼 Hide details' : '🔽 History/Reviews'}
                  </button>
                </div>
                
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => updateWorkerAvailability(w.id, { online: !w.available })}
                    style={{ flex: 1.5, background: '#f3f4f6', color: '#4b5563', border: '1px solid #e5e5e5', padding: '6px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                  >
                    {w.available ? 'Force Offline' : 'Mark Available'}
                  </button>
                  <button
                    onClick={() => { if (window.confirm('Suspend worker account? This will block their login access.')) approveWorker(w.id, false); }}
                    style={{ flex: 1, background: '#fee2e2', color: '#ef4444', border: '1px solid #fca5a5', padding: '6px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    Suspend
                  </button>
                </div>
              </div>

              {/* Work history & Reviews list drawer */}
              {isSelected && (
                <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #eee', fontSize: '12px' }}>
                  <h4 style={{ margin: '0 0 6px', fontSize: '12px', color: '#333', fontWeight: '700' }}>Work History ({completedOrders.length})</h4>
                  {completedOrders.length === 0 ? (
                    <p style={{ color: '#aaa', fontStyle: 'italic', margin: '0 0 10px' }}>No completed bookings on this platform yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                      {completedOrders.map(o => (
                        <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px', background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: '4px' }}>
                          <span>{o.vehicle.name} <span style={{ color: '#888' }}>#{o.id.slice(-6)}</span></span>
                          <strong style={{ color: '#10b981' }}>₹{o.booking.total?.toLocaleString()}</strong>
                        </div>
                      ))}
                    </div>
                  )}

                  <h4 style={{ margin: '0 0 6px', fontSize: '12px', color: '#333', fontWeight: '700' }}>Customer Reviews ({w.reviews?.length || 0})</h4>
                  {!w.reviews || w.reviews.length === 0 ? (
                    <p style={{ color: '#aaa', fontStyle: 'italic', margin: 0 }}>No customer feedback reviews yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {w.reviews.map((r, idx) => (
                        <div key={idx} style={{ padding: '8px', background: '#fafafa', border: '1px solid #eee', borderRadius: '6px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600', color: '#444' }}>
                            <span>{r.author}</span>
                            <span style={{ color: '#f59e0b' }}>{'★'.repeat(r.rating)}</span>
                          </div>
                          <p style={{ margin: '4px 0 0', color: '#666', lineHeight: '1.3' }}>{r.comment}</p>
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
                Professional Vehicle Class:
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
    </div>
  );
}
