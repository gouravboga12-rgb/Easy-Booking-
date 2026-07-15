import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { HiClipboardList, HiChevronRight, HiPrinter, HiX } from 'react-icons/hi';
import { createPortal } from 'react-dom';
import './Orders.css';

export default function Orders() {
  const orders = useStore(s => s.orders);
  const allServices = useStore(s => s.services) || [];
  const navigate = useNavigate();
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);

  if (orders.length === 0) return (
    <div className="orders-empty">
      <div className="empty-icon">📋</div>
      <h2>No orders yet</h2>
      <p>Book your first service to get started.</p>
      <button onClick={() => navigate('/browse')}>Browse Services →</button>
    </div>
  );

  // Divide orders into active and completed
  const activeOrders = orders.filter(o => ['pending', 'assigned', 'active', 'arrived'].includes(o.status));
  const completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'cancelled');

  const handleImageClick = (e, vehicleId) => {
    e.stopPropagation(); // Prevent tracking page navigation
    const exists = allServices.some(s => s.id === vehicleId);
    if (exists) {
      navigate(`/book/${vehicleId}`);
    } else {
      alert("This service package has been modified or is currently unavailable for re-booking.");
    }
  };

  return (
    <div className="orders-page" style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 16px 40px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#1a1a1a', marginBottom: '4px' }}>My Bookings</h1>
      <p style={{ fontSize: '13px', color: '#666', marginBottom: '24px' }}>Track live booking progress or review completed service history</p>

      {/* ── ACTIVE / BOOKED ORDERS SECTION ── */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '800', borderBottom: '2px solid #f1f5f9', paddingBottom: '8px', marginBottom: '14px', color: 'var(--primary)' }}>
          ⚡ Active & Booked Orders ({activeOrders.length})
        </h2>
        {activeOrders.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#888', fontStyle: 'italic', padding: '10px 0' }}>No active bookings at the moment.</p>
        ) : (
          <div className="orders-list" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {activeOrders.map(order => (
              <div
                key={order.id}
                className="order-item"
                onClick={() => navigate(`/track/${order.id}`)}
                style={{
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '16px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                  flexWrap: 'wrap',
                  gap: '12px',
                  transition: 'transform 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <img
                    src={order.vehicle.image || 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=100&q=80'}
                    alt={order.vehicle.name}
                    onClick={(e) => handleImageClick(e, order.vehicle.id)}
                    title="Click to view catalog"
                    style={{ width: '56px', height: '56px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #eee', cursor: 'pointer' }}
                  />
                  <div>
                    <strong style={{ fontSize: '14px', color: '#1e293b', display: 'block' }}>{order.vehicle.name}</strong>
                    <span style={{ fontSize: '12.5px', color: '#64748b', display: 'block', marginTop: '2px' }}>📍 {order.booking.location}</span>
                    <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginTop: '2px' }}>📅 {order.booking.date} • {order.booking.duration} {order.vehicle.unit === 'hr' ? 'hrs' : 'trips'}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <strong style={{ fontSize: '16px', color: '#0f172a' }}>₹{order.booking.total?.toLocaleString()}</strong>
                  <span className={`status-chip ${order.status}`} style={{ fontSize: '9px', padding: '3px 8px', borderRadius: '20px', textTransform: 'uppercase', fontWeight: '800' }}>
                    {order.status === 'pending' ? 'Searching Partner' : order.status === 'assigned' ? 'Partner Assigned' : order.status}
                  </span>
                  <span style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>#{order.id}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── COMPLETED ORDERS SECTION ── */}
      <div>
        <h2 style={{ fontSize: '16px', fontWeight: '800', borderBottom: '2px solid #f1f5f9', paddingBottom: '8px', marginBottom: '14px', color: '#10b981' }}>
          ✅ Completed Order History ({completedOrders.length})
        </h2>
        {completedOrders.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#888', fontStyle: 'italic', padding: '10px 0' }}>No completed orders found.</p>
        ) : (
          <div className="orders-list" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {completedOrders.map(order => (
              <div
                key={order.id}
                className="order-item"
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '16px',
                  boxShadow: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <img
                      src={order.vehicle.image || 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=100&q=80'}
                      alt={order.vehicle.name}
                      onClick={(e) => handleImageClick(e, order.vehicle.id)}
                      title="Click to view catalog"
                      style={{ width: '56px', height: '56px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #eee', cursor: 'pointer' }}
                    />
                    <div>
                      <strong style={{ fontSize: '14px', color: '#1e293b', display: 'block', cursor: 'pointer' }} onClick={(e) => handleImageClick(e, order.vehicle.id)}>
                        {order.vehicle.name}
                      </strong>
                      <span style={{ fontSize: '12.5px', color: '#64748b', display: 'block', marginTop: '2px' }}>📍 {order.booking.location}</span>
                      <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginTop: '2px' }}>📅 {order.booking.date} • {order.booking.duration} {order.vehicle.unit === 'hr' ? 'hrs' : 'trips'}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <strong style={{ fontSize: '16px', color: '#0f172a' }}>₹{order.booking.total?.toLocaleString()}</strong>
                    <span style={{ fontSize: '10px', background: order.status === 'cancelled' ? '#fee2e2' : '#d1fae5', color: order.status === 'cancelled' ? '#b91c1c' : '#065f46', padding: '3px 8px', borderRadius: '20px', textTransform: 'uppercase', fontWeight: '800' }}>
                      {order.status}
                    </span>
                    <span style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>#{order.id}</span>
                  </div>
                </div>

                {/* Partner Details & Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #e2e8f0', paddingTop: '10px', flexWrap: 'wrap', gap: '10px' }}>
                  {order.operator ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <img
                        src={order.operator.photo || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=100&q=80'}
                        alt={order.operator.name}
                        style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #ddd' }}
                      />
                      <div style={{ fontSize: '12px' }}>
                        <div style={{ fontWeight: '700', color: '#334155' }}>👷 Assigned: {order.operator.name}</div>
                        <div style={{ color: '#64748b', fontSize: '11px' }}>📞 Phone: {order.operator.phone}</div>
                      </div>
                    </div>
                  ) : (
                    <span style={{ fontSize: '12px', color: '#888', fontStyle: 'italic' }}>Verified Professional service partner</span>
                  )}

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => navigate(`/track/${order.id}`)}
                      style={{ background: '#fff', color: '#3b82f6', border: '1px solid #bfdbfe', padding: '6px 12px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      Track Details
                    </button>
                    {order.status === 'completed' && (
                      <button
                        onClick={() => setSelectedInvoiceOrder(order)}
                        style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        🧾 View Invoice
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invoice modal overlay */}
      {selectedInvoiceOrder && createPortal(
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
        </div>,
        document.body
      )}
    </div>
  );
}
