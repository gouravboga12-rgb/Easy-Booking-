import { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useStore } from '../../store/useStore';
import { 
  HiCurrencyRupee, HiCheckCircle, HiCalendar, HiClock, 
  HiClipboardList, HiTrendingUp, HiXCircle, HiPhone, 
  HiLocationMarker 
} from 'react-icons/hi';
import { createPortal } from 'react-dom';
import './Worker.css';

export default function WorkerWallet() {
  const user = useAuthStore(s => s.user);
  const orders = useStore(s => s.orders);

  const myOrders = orders.filter(o => o.operator?.id === user.id);
  const completedOrders = myOrders.filter(o => o.status === 'completed');
  const completedOrdersCount = completedOrders.length;

  const totalEarnings = completedOrders.reduce((sum, o) => sum + (o.booking?.total || 0), 0);

  const [timeFilter, setTimeFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('completed');
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);

  // Timezone-safe local date parser
  const parseLocalDate = (dateStr) => {
    if (!dateStr) return null;
    const parts = dateStr.split(/[-/]/);
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  };

  const nowLocalDate = new Date();
  nowLocalDate.setHours(0, 0, 0, 0);

  const filteredOrders = completedOrders.filter(o => {
    if (!o.booking?.date) return false;
    const bDate = parseLocalDate(o.booking.date);
    if (!bDate) return false;
    bDate.setHours(0, 0, 0, 0);

    const diffTime = Math.abs(nowLocalDate - bDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (timeFilter === 'today') {
      return bDate.getTime() === nowLocalDate.getTime();
    } else if (timeFilter === 'week') {
      return diffDays <= 7;
    } else if (timeFilter === 'month') {
      return diffDays <= 30;
    } else if (timeFilter === '6months') {
      return diffDays <= 180;
    } else if (timeFilter === 'year') {
      return diffDays <= 365;
    }
    return true; // 'all'
  });

  const filteredEarnings = filteredOrders.reduce((sum, o) => sum + (o.booking?.total || 0), 0);

  // Lists filtered by status tabs
  const completedList = completedOrders;
  const pendingList = myOrders.filter(o => ['assigned', 'active', 'arrived', 'pending'].includes(o.status));
  const rejectedList = orders.filter(o => o.rejectedWorkers && o.rejectedWorkers.includes(user.id));

  const currentTabList = activeTab === 'completed' 
    ? completedList 
    : activeTab === 'pending' 
      ? pendingList 
      : rejectedList;

  return (
    <div className="worker-page" style={{ paddingBottom: '32px' }}>
      <div className="wp-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
        <HiCurrencyRupee className="wp-title-icon" style={{ width: '28px', height: '28px', color: 'var(--primary)' }} />
        <h1 style={{ fontSize: '24px', fontWeight: '800' }}>Payments & Earnings</h1>
      </div>

      {/* Overview Cards */}
      <div className="wallet-cards">
        <div className="wallet-card primary" style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', color: '#fff', padding: '24px 16px', borderRadius: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span style={{ fontSize: '12px', opacity: 0.85 }}>Total Earnings</span>
          <strong style={{ fontSize: '24px', fontWeight: '800', marginTop: '6px' }}>₹{totalEarnings.toLocaleString()}</strong>
        </div>
        
        <div className="wallet-card" style={{ background: '#fff', padding: '16px', borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div className="wc-row" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#888', marginBottom: '4px' }}>
            <HiClipboardList className="wc-icon credit" style={{ color: '#10b981' }} />
            <span>Completed Orders</span>
          </div>
          <strong style={{ fontSize: '20px', fontWeight: '800', color: '#1a1a1a' }}>{completedOrdersCount}</strong>
        </div>

        <div className="wallet-card" style={{ background: '#fff', padding: '16px', borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div className="wc-row" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#888', marginBottom: '4px' }}>
            <HiCheckCircle className="wc-icon" style={{ color: '#8b5cf6' }} />
            <span>Active Plan</span>
          </div>
          <strong style={{ fontSize: '14px', fontWeight: '800', color: user.subscription?.active ? '#15803d' : '#888', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user.subscription?.active ? user.subscription.plan.split(' ')[0] : 'None'}
          </strong>
        </div>
      </div>

      {/* Income Analytics Filter Widget */}
      <div className="worker-section" style={{ background: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', marginBottom: '24px', border: '1px solid #eee' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <HiTrendingUp style={{ color: '#10b981', width: '20px', height: '20px' }} />
            Income Analytics
          </h2>
          <select 
            value={timeFilter} 
            onChange={(e) => setTimeFilter(e.target.value)} 
            style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px', background: '#f9fafb', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '600' }}
          >
            <option value="today">Today (1 Day)</option>
            <option value="week">This Week (7 Days)</option>
            <option value="month">This Month (30 Days)</option>
            <option value="6months">Last 6 Months</option>
            <option value="year">Last 1 Year</option>
            <option value="all">All Time</option>
          </select>
        </div>
        <div style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Earnings Collection</span>
            <strong style={{ display: 'block', fontSize: '24px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
              ₹{filteredEarnings.toLocaleString()}
            </strong>
          </div>
          <div style={{ textAlign: 'right', fontSize: '12px', color: '#64748b' }}>
            From <strong>{filteredOrders.length}</strong> completed order(s)
          </div>
        </div>
      </div>

      {/* Services List and Payment Collections (Tabbed) */}
      <div className="worker-section" style={{ background: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', marginBottom: '24px', border: '1px solid #eee' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Service Bookings & Collections</h2>
        
        {/* Tabs Bar */}
        <div className="wallet-tabs" style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #eee', paddingBottom: '12px', marginBottom: '16px' }}>
          <button 
            className={`wallet-tab-btn ${activeTab === 'completed' ? 'active' : ''}`} 
            onClick={() => setActiveTab('completed')}
          >
            Completed ({completedList.length})
          </button>
          <button 
            className={`wallet-tab-btn ${activeTab === 'pending' ? 'active' : ''}`} 
            onClick={() => setActiveTab('pending')}
          >
            Pending/Active ({pendingList.length})
          </button>
          <button 
            className={`wallet-tab-btn ${activeTab === 'rejected' ? 'active' : ''}`} 
            onClick={() => setActiveTab('rejected')}
          >
            Rejected ({rejectedList.length})
          </button>
        </div>

        {/* Tab content list */}
        {currentTabList.length === 0 ? (
          <div className="empty-msg" style={{ padding: '32px 0', textAlign: 'center', color: '#94a3b8' }}>
            No {activeTab} services found.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {currentTabList.map(o => (
              <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '12px' }}>
                <div style={{ flex: 1, paddingRight: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#1e293b' }}>
                      Order #{o.id.slice(-6)} • {o.vehicle?.name || 'Professional Service'}
                    </span>
                    <span className={`status-chip ${o.status}`} style={{ fontSize: '10px', padding: '2px 8px', textTransform: 'uppercase' }}>
                      {o.status === 'pending' && !o.operator ? 'Awaiting Worker' : o.status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '12px', color: '#64748b' }}>
                    <span>📍 {o.booking?.location}</span>
                    <span>📅 {o.booking?.date}</span>
                    {o.customer?.name && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        👤 {o.customer.name}
                        {o.customer.phone && (
                          <a href={`tel:${o.customer.phone}`} style={{ textDecoration: 'none', fontSize: '11px', color: 'var(--primary)', fontWeight: '600' }}>
                            (📞 Call)
                          </a>
                        )}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <strong style={{ display: 'block', fontSize: '16px', color: '#0f172a' }}>₹{o.booking?.total?.toLocaleString()}</strong>
                  <span style={{ fontSize: '11px', color: activeTab === 'completed' ? '#15803d' : activeTab === 'pending' ? '#d97706' : '#b91c1c', fontWeight: '600', marginTop: '2px', display: 'block' }}>
                    {activeTab === 'completed' ? 'Collected' : activeTab === 'pending' ? 'Pending Completion' : 'Rejected'}
                  </span>
                  {activeTab === 'completed' && (
                    <button 
                      onClick={() => setSelectedInvoiceOrder(o)}
                      style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid var(--primary)', padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '700', marginTop: '6px', cursor: 'pointer' }}
                    >
                      🧾 View Invoice
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invoice Receipt Modal */}
      {selectedInvoiceOrder && createPortal(
        <div className="invoice-modal-overlay print-receipt-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={() => setSelectedInvoiceOrder(null)}>
          <div className="invoice-modal-card print-receipt-card" style={{ background: '#fff', width: '100%', maxWidth: '440px', borderRadius: '16px', padding: '24px', position: 'relative', boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
            <button className="print-hide-btn" style={{ position: 'absolute', right: '16px', top: '16px', border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', color: '#888' }} onClick={() => setSelectedInvoiceOrder(null)}>×</button>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '32px', marginBottom: '6px' }}>🧾</div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 4px', color: '#1e293b' }}>Payment Invoice</h3>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Reference ID: #{selectedInvoiceOrder.id}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px dashed #e2e8f0', borderBottom: '1px dashed #e2e8f0', padding: '16px 0', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}><span style={{ color: '#64748b' }}>Service Requested</span><strong style={{ color: '#0f172a' }}>{selectedInvoiceOrder.vehicle?.name}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}><span style={{ color: '#64748b' }}>Service Date</span><strong style={{ color: '#0f172a' }}>{selectedInvoiceOrder.booking?.date}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}><span style={{ color: '#64748b' }}>Duration / Scope</span><strong style={{ color: '#0f172a' }}>{selectedInvoiceOrder.booking?.duration} {selectedInvoiceOrder.vehicle?.unit === 'hr' ? 'Hours' : 'Trips'}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}><span style={{ color: '#64748b' }}>Customer Name</span><strong style={{ color: '#0f172a' }}>{selectedInvoiceOrder.customer?.name || 'Customer'}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}><span style={{ color: '#64748b' }}>Assigned Operator</span><strong style={{ color: '#0f172a' }}>{user.name}</strong></div>
              {selectedInvoiceOrder.vehicle?.custom_fields && selectedInvoiceOrder.vehicle.custom_fields.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12.5px', borderTop: '1px dotted #e2e8f0', paddingTop: '8px', paddingBottom: '4px' }}>
                  {selectedInvoiceOrder.vehicle.custom_fields.map(f => {
                    const val = selectedInvoiceOrder.customAnswers?.[f.id];
                    if (val && val.startsWith('data:')) return null; // Skip file data url previews on printable invoice receipts for clean UI
                    return (
                      <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>{f.name}</span>
                        <strong style={{ color: '#0f172a' }}>{val || '—'}</strong>
                      </div>
                    );
                  })}
                </div>
              )}
              {selectedInvoiceOrder.booking?.notes && (
                <div style={{ fontSize: '12px', background: '#f8fafc', padding: '8px', borderRadius: '6px', marginTop: '4px', border: '1px solid #f1f5f9' }}>
                  <strong style={{ display: 'block', color: '#475569', marginBottom: '2px' }}>Order Notes/Instructions:</strong>
                  <span style={{ color: '#64748b', display: 'block', whiteSpace: 'pre-wrap' }}>{selectedInvoiceOrder.booking.notes}</span>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '16px', fontWeight: '800', color: '#1e293b' }}>
              <span>Total Payout Received</span>
              <span style={{ color: 'var(--primary)', fontSize: '20px' }}>₹{selectedInvoiceOrder.booking?.total?.toLocaleString()}</span>
            </div>
            <div className="print-actions" style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
              <button onClick={() => window.print()} style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', flex: 1 }}>Print Receipt</button>
              <button onClick={() => setSelectedInvoiceOrder(null)} style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', flex: 1 }}>Close Window</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
