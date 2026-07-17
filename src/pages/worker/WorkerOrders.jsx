import { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useStore } from '../../store/useStore';
import { HiLocationMarker, HiCalendar, HiUser, HiArrowRight, HiClipboardList, HiPhone } from 'react-icons/hi';

export default function WorkerOrders() {
  const user = useAuthStore(s => s.user);
  const orders = useStore(s => s.orders);
  const advanceStage = useStore(s => s.advanceStage);

  const [activeTab, setActiveTab] = useState('active'); // 'active', 'scheduled', or 'completed'
  const [selectedDetailsOrder, setSelectedDetailsOrder] = useState(null);

  // Helper: check if a scheduled order's time slot has arrived (within 30-min window)
  const isScheduledTimeArrived = (order) => {
    if (order.bookingType !== 'scheduled') return true;
    const today = new Date().toLocaleDateString('en-CA');
    if (order.booking?.date !== today) return false;
    if (!order.booking?.timeSlot) return true;
    try {
      const timePart = order.booking.timeSlot.split('-')[0].trim();
      const parts = timePart.split(' ');
      const time = parts[0];
      const ampm = (parts[1] || '').toUpperCase();
      let [hrs, mins] = time.split(':').map(Number);
      if (ampm === 'PM' && hrs !== 12) hrs += 12;
      if (ampm === 'AM' && hrs === 12) hrs = 0;
      const slotMinutes = hrs * 60 + mins;
      const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
      return nowMinutes >= slotMinutes - 30;
    } catch (e) { return true; }
  };

  // Ongoing: instant orders + scheduled orders whose time has arrived
  const ongoingOrders = orders.filter(o =>
    o.operator?.id === user.id &&
    ['assigned', 'active', 'arrived'].includes(o.status) &&
    isScheduledTimeArrived(o)
  );

  // Scheduled tab: accepted scheduled jobs NOT yet at their time
  const scheduledOrders = orders.filter(o =>
    o.operator?.id === user.id &&
    o.status === 'assigned' &&
    o.bookingType === 'scheduled' &&
    !isScheduledTimeArrived(o)
  );

  // Completed/cancelled orders list
  const completedOrders = orders.filter(o =>
    o.operator?.id === user.id &&
    (o.status === 'completed' || o.status === 'cancelled')
  );

  return (
    <div className="worker-page">
      <div className="wp-title" style={{ marginBottom: '16px' }}>
        <HiClipboardList className="wp-title-icon" />
        <h1>Service Orders</h1>
      </div>

      {/* Switch Option on Top */}
      <div className="orders-switcher" style={{
        display: 'flex',
        background: '#f1f5f9',
        padding: '4px',
        borderRadius: '10px',
        marginBottom: '28px',
        width: '100%',
        maxWidth: '560px',
        border: '1px solid #e2e8f0'
      }}>
        <button
          onClick={() => setActiveTab('active')}
          style={{
            border: 'none',
            outline: 'none',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '700',
            cursor: 'pointer',
            background: activeTab === 'active' ? '#fff' : 'transparent',
            color: activeTab === 'active' ? 'var(--primary)' : '#64748b',
            boxShadow: activeTab === 'active' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.18s ease',
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flex: 1,
            justifyContent: 'center'
          }}
        >
          <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6' }}></span>
          Active & Ongoing ({ongoingOrders.length})
        </button>

        <button
          onClick={() => setActiveTab('scheduled')}
          style={{
            border: 'none',
            outline: 'none',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '700',
            cursor: 'pointer',
            background: activeTab === 'scheduled' ? '#fff' : 'transparent',
            color: activeTab === 'scheduled' ? '#8b5cf6' : '#64748b',
            boxShadow: activeTab === 'scheduled' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.18s ease',
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flex: 1,
            justifyContent: 'center'
          }}
        >
          <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#8b5cf6' }}></span>
          Scheduled ({scheduledOrders.length})
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          style={{
            border: 'none',
            outline: 'none',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '700',
            cursor: 'pointer',
            background: activeTab === 'completed' ? '#fff' : 'transparent',
            color: activeTab === 'completed' ? '#10b981' : '#64748b',
            boxShadow: activeTab === 'completed' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.18s ease',
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flex: 1,
            justifyContent: 'center'
          }}
        >
          <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>
          Completed ({completedOrders.length})
        </button>
      </div>

      {activeTab === 'active' && (
        /* Section 1: Active & Ongoing Services */
        <div className="worker-section-container">
          {ongoingOrders.length === 0 ? (
            <div className="empty-msg" style={{ background: '#fff', border: '1.5px dashed #eee', borderRadius: '14px', padding: '40px' }}>
              No active or ongoing orders right now.
            </div>
          ) : (
            <div className="order-cards">
              {ongoingOrders.map(o => (
                <div key={o.id} className="order-card" style={{ borderLeft: '4px solid #3b82f6' }}>
                  <div className="oc-header">
                    <div>
                      <div className="oc-id">#{o.id}</div>
                      <div className="oc-vehicle">{o.vehicle?.name}</div>
                    </div>
                    <span className={`status-chip ${o.status}`}>{o.status}</span>
                  </div>
                  <div className="oc-details">
                    <div className="oc-row"><HiLocationMarker className="oc-icon" />{o.booking?.location}</div>
                    <div className="oc-row"><HiCalendar className="oc-icon" />{o.booking?.date} · {o.booking?.duration} {o.vehicle?.unit}</div>
                    <div className="oc-row"><HiUser className="oc-icon" />{o.customer?.name} {o.customer?.phone && <span className="oc-phone">{o.customer.phone}</span>}</div>
                  </div>
                  <div className="oc-footer">
                    <div className="oc-amount">₹{o.booking?.total?.toLocaleString()}</div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="aj-advance" style={{ background: '#f8fafc', color: '#475569', border: '1.5px solid #cbd5e1' }} onClick={() => setSelectedDetailsOrder(o)}>
                        🔍 View Details
                      </button>
                      {o.stage < o.stages.length - 1 && (
                        <button className="aj-advance" onClick={() => advanceStage(o.id)}>
                          {o.stages[o.stage + 1]} <HiArrowRight style={{ width: 14, height: 14 }} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="oc-stage">
                    Stage: <strong>{o.stages[o.stage]}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'scheduled' && (
        /* Section 3: Scheduled Service Orders */
        <div className="worker-section-container">
          {scheduledOrders.length === 0 ? (
            <div className="empty-msg" style={{ background: '#fff', border: '1.5px dashed #eee', borderRadius: '14px', padding: '40px' }}>
              No scheduled orders accepted yet.
            </div>
          ) : (
            <div className="order-cards">
              {scheduledOrders.map(o => (
                <div key={o.id} className="order-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
                  <div className="oc-header">
                    <div>
                      <div className="oc-id">#{o.id}</div>
                      <div className="oc-vehicle">{o.vehicle?.name}</div>
                    </div>
                    <span className="status-chip assigned" style={{ background: '#ede9fe', color: '#6d28d9', border: '1px solid #ddd6fe' }}>
                      📅 Scheduled
                    </span>
                  </div>
                  <div className="oc-details">
                    <div className="oc-row"><HiLocationMarker className="oc-icon" />{o.booking?.location}</div>
                    <div className="oc-row" style={{ color: '#6d28d9', fontWeight: '600' }}><HiCalendar className="oc-icon" />{o.booking?.date} · {o.booking?.duration} {o.vehicle?.unit}</div>
                    <div className="oc-row"><HiUser className="oc-icon" />{o.customer?.name} {o.customer?.phone && <span className="oc-phone">{o.customer.phone}</span>}</div>
                  </div>
                  <div className="oc-footer">
                    <div className="oc-amount">₹{o.booking?.total?.toLocaleString()}</div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="aj-advance" style={{ background: '#f8fafc', color: '#475569', border: '1.5px solid #cbd5e1' }} onClick={() => setSelectedDetailsOrder(o)}>
                        🔍 View Details
                      </button>
                      {o.stage < o.stages.length - 1 && (
                        <button className="aj-advance" onClick={() => advanceStage(o.id)} style={{ background: '#8b5cf6', color: '#fff', border: 'none' }}>
                          Start Service <HiArrowRight style={{ width: 14, height: 14 }} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="oc-stage">
                    Stage: <strong>{o.stages[o.stage]} (Not started)</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'completed' && (
        /* Section 2: Completed Service Orders */
        <div className="worker-section-container">
          {completedOrders.length === 0 ? (
            <div className="empty-msg" style={{ background: '#fff', border: '1.5px dashed #eee', borderRadius: '14px', padding: '40px' }}>
              No completed or history orders yet.
            </div>
          ) : (
            <div className="order-cards">
              {completedOrders.map(o => (
                <div key={o.id} className="order-card" style={{ borderLeft: '4px solid #10b981', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: '12px' }}>
                  <div className="oc-header">
                    <div>
                      <div className="oc-id">#{o.id}</div>
                      <div className="oc-vehicle">{o.vehicle?.name}</div>
                    </div>
                    <span style={{
                      background: o.status === 'cancelled' ? '#fee2e2' : '#d1fae5', 
                      color: o.status === 'cancelled' ? '#991b1b' : '#065f46', 
                      padding: '6px 12px', borderRadius: '20px',
                      fontSize: '11.5px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '4px',
                      border: o.status === 'cancelled' ? '1px solid #fecaca' : '1px solid #a7f3d0'
                    }}>
                      {o.status === 'cancelled' ? '❌ Cancelled' : '✨ Successfully Completed'}
                    </span>
                  </div>
                  <div className="oc-details" style={{ margin: '14px 0' }}>
                    <div className="oc-row"><HiLocationMarker className="oc-icon" />{o.booking?.location}</div>
                    <div className="oc-row"><HiCalendar className="oc-icon" />Scheduled: {o.booking?.date} · {o.booking?.duration} {o.vehicle?.unit}</div>
                    <div className="oc-row"><HiUser className="oc-icon" />Customer: {o.customer?.name} {o.customer?.phone && <span className="oc-phone">{o.customer.phone}</span>}</div>
                    
                    {/* Payment details */}
                    <div className="oc-row" style={{ color: '#0f766e', fontWeight: '600' }}>
                      💳 Payment: <span style={{ textTransform: 'capitalize' }}>{o.paymentStatus === 'paid' ? `Paid (${o.paymentMode || 'cash'})` : 'Pending'}</span>
                    </div>
 
                    {/* Completion Time */}
                    <div className="oc-row" style={{ color: '#4b5563', fontSize: '12px' }}>
                      ⏱️ Finished: {o.completedAt ? new Date(o.completedAt).toLocaleString() : 'N/A'}
                    </div>
                  </div>
                  <div className="oc-footer" style={{ borderBottom: o.completionImages && o.completionImages.length > 0 ? '1px solid #f5f5f5' : 'none', paddingBottom: o.completionImages && o.completionImages.length > 0 ? '10px' : '0', marginBottom: o.completionImages && o.completionImages.length > 0 ? '10px' : '0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="oc-amount" style={{ fontSize: '16px', fontWeight: '800', color: '#111827' }}>₹{o.booking?.total?.toLocaleString()}</div>
                    <button className="aj-advance" style={{ background: '#f8fafc', color: '#475569', border: '1.5px solid #cbd5e1', padding: '6px 12px', fontSize: '12px' }} onClick={() => setSelectedDetailsOrder(o)}>
                      🔍 View Details
                    </button>
                  </div>
                  {o.completionImages && o.completionImages.length > 0 && (
                    <div style={{ marginTop: '10px' }}>
                      <div style={{ fontSize: '11px', color: '#888', fontWeight: '600', marginBottom: '6px' }}>Completion Photos:</div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {o.completionImages.map((img, i) => (
                          <img 
                            key={i} 
                            src={img.startsWith('http') || img.startsWith('data:') ? img : `/images/${img}`} 
                            alt={`Completion ${i+1}`} 
                            style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #e5e7eb' }} 
                            onError={e => { e.target.src = 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=120&q=70'; }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── WORKER ORDER DETAILS POPUP MODAL ── */}
      {selectedDetailsOrder && (() => {
        const o = selectedDetailsOrder;
        const customFields = o.vehicle?.custom_fields || [];
        const customAnswers = o.customAnswers || {};

        return (
          <div className="invoice-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={() => setSelectedDetailsOrder(null)}>
            <div className="invoice-modal-card" style={{ background: '#fff', width: '100%', maxWidth: '500px', borderRadius: '20px', padding: '24px', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
              <button style={{ position: 'absolute', right: '20px', top: '20px', border: 'none', background: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b', fontWeight: '800' }} onClick={() => setSelectedDetailsOrder(null)}>×</button>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <span style={{ fontSize: '28px' }}>📋</span>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', margin: 0 }}>Order Details</h3>
                  <span style={{ fontSize: '11px', background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: '800', padding: '2px 8px', borderRadius: '6px', textTransform: 'uppercase', display: 'inline-block', marginTop: '4px' }}>
                    {o.bookingType === 'instant' ? '⚡ Instant' : '📅 Scheduled'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', padding: '16px 0', marginBottom: '18px' }}>
                
                {/* ID & Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: '#64748b', fontWeight: '600' }}>Order ID</span>
                  <strong style={{ color: '#0f172a' }}>#{o.id}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: '#64748b', fontWeight: '600' }}>Service Requested</span>
                  <strong style={{ color: '#0f172a' }}>{o.vehicle?.name}</strong>
                </div>

                {/* Pricing / Duration */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: '#64748b', fontWeight: '600' }}>Duration / Scope</span>
                  <strong style={{ color: '#0f172a' }}>{o.booking?.duration} {o.vehicle?.unit === 'hr' ? 'Hours' : 'Trips'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', background: '#f8fafc', padding: '8px 12px', borderRadius: '8px' }}>
                  <span style={{ color: '#64748b', fontWeight: '700' }}>Estimated Payout</span>
                  <strong style={{ color: '#10b981', fontSize: '16px', fontWeight: '800' }}>₹{o.booking?.total?.toLocaleString()}</strong>
                </div>

                {/* Location */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ color: '#64748b', fontSize: '13px', fontWeight: '600' }}>📍 Service Address</span>
                  <strong style={{ color: '#0f172a', fontSize: '13.5px', lineHeight: '1.4' }}>{o.booking?.location}</strong>
                </div>

                {/* Date & Time */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: '#64748b', fontWeight: '600' }}>Preferred Date/Time</span>
                  <strong style={{ color: '#0f172a', textAlign: 'right' }}>
                    {o.booking?.date}
                    {o.bookingType === 'scheduled'
                      ? o.booking?.timeSlot
                        ? <span style={{ display: 'block', color: '#8b5cf6', fontSize: '12px', fontWeight: '700' }}>📅 {o.booking.timeSlot} (Scheduled)</span>
                        : <span style={{ display: 'block', color: '#8b5cf6', fontSize: '12px' }}>(Scheduled)</span>
                      : <span style={{ display: 'block', color: '#3b82f6', fontSize: '12px' }}>⚡ Instant Match</span>
                    }
                  </strong>
                </div>

                {/* Customer Contact */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', alignItems: 'center' }}>
                  <span style={{ color: '#64748b', fontWeight: '600' }}>Customer Name</span>
                  <strong style={{ color: '#0f172a' }}>{o.customer?.name || 'Customer'}</strong>
                </div>
                {o.customer?.phone && o.customer.phone !== '🔒 Redacted' ? (
                  <div style={{
                    background: '#f8fafc',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '14px',
                    marginTop: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px' }}>
                      <span style={{ color: '#64748b', fontWeight: '600' }}>Customer Phone</span>
                      <strong style={{ color: '#0f172a' }}>{o.customer.phone}</strong>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <a
                        href={`tel:${o.customer.phone}`}
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          background: '#3b82f6',
                          color: '#fff',
                          padding: '10px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '800',
                          textDecoration: 'none',
                          textAlign: 'center'
                        }}
                      >
                        <HiPhone style={{ width: 14, height: 14 }} />
                        Call
                      </a>
                      <a
                        href={`https://wa.me/${(o.customer.whatsapp || o.customer.phone || '').replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          background: '#22c55e',
                          color: '#fff',
                          padding: '10px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '800',
                          textDecoration: 'none',
                          textAlign: 'center'
                        }}
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963C16.59 2.019 14.12 1.01 11.493 1.01 6.059 1.01 1.637 5.377 1.633 10.806c-.001 1.674.452 3.3 1.311 4.733L1.925 20.35l5.02-1.316-.298.12z" />
                        </svg>
                        WhatsApp
                      </a>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', alignItems: 'center' }}>
                    <span style={{ color: '#64748b', fontWeight: '600' }}>Customer Phone</span>
                    <strong style={{ color: '#0f172a' }}>🔒 Hidden until accepted</strong>
                  </div>
                )}

                {/* Dynamic Custom Fields */}
                {customFields.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px dashed #e2e8f0', paddingTop: '12px', marginTop: '4px' }}>
                    <span style={{ color: '#1e293b', fontSize: '13px', fontWeight: '800' }}>🛠️ Customer Selections</span>
                    <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {customFields.map(f => {
                        const val = customAnswers[f.id];
                        if (val && val.startsWith('data:image/')) {
                          return (
                            <div key={f.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>{f.name}:</span>
                              <div style={{ maxWidth: '100px', cursor: 'pointer' }} onClick={() => window.open(val)}>
                                <img src={val} alt="User Upload" style={{ maxWidth: '100%', maxHeight: '80px', borderRadius: '6px', border: '1.5px solid #ddd', objectFit: 'cover' }} />
                              </div>
                            </div>
                          );
                        } else if (val && val.startsWith('data:application/pdf')) {
                          return (
                            <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                              <span style={{ color: '#64748b', fontWeight: '600' }}>{f.name}:</span>
                              <a href={val} download={`attachment_${f.name}.pdf`} style={{ color: 'var(--primary)', fontWeight: '800', textDecoration: 'underline' }}>
                                📁 PDF Document
                              </a>
                            </div>
                          );
                        } else {
                          return (
                            <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>
                              <span style={{ color: '#64748b', fontWeight: '600' }}>{f.name}:</span>
                              <strong style={{ color: '#0f172a' }}>{val || '—'}</strong>
                            </div>
                          );
                        }
                      })}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {o.booking?.notes && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px dashed #e2e8f0', paddingTop: '12px', marginTop: '4px' }}>
                    <span style={{ color: '#64748b', fontSize: '13px', fontWeight: '600' }}>📝 Instructions / Notes</span>
                    <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12.5px', color: '#475569', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                      {o.booking.notes}
                    </div>
                  </div>
                )}

              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedDetailsOrder(null)}
                  style={{ padding: '10px 24px', background: 'var(--primary)', border: 'none', color: '#fff', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', fontSize: '13px' }}
                >
                  Close Details
                </button>
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
}


