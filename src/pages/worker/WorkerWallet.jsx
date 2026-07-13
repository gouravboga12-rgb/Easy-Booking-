import { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useStore } from '../../store/useStore';
import { 
  HiCurrencyRupee, HiCheckCircle, HiCalendar, HiClock, 
  HiClipboardList, HiTrendingUp, HiXCircle, HiPhone, 
  HiLocationMarker 
} from 'react-icons/hi';
import './Worker.css';

export default function WorkerWallet() {
  const user = useAuthStore(s => s.user);
  const buySubscription = useAuthStore(s => s.buySubscription);
  const orders = useStore(s => s.orders);

  const myOrders = orders.filter(o => o.operator?.id === user.id);
  const completedOrders = myOrders.filter(o => o.status === 'completed');
  const completedOrdersCount = completedOrders.length;

  const totalEarnings = completedOrders.reduce((sum, o) => sum + (o.booking?.total || 0), 0);

  const [timeFilter, setTimeFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('completed');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  const now = new Date();
  const filteredOrders = completedOrders.filter(o => {
    if (!o.createdAt) return timeFilter === 'all';
    const orderDate = new Date(o.createdAt);
    const diffTime = Math.abs(now - orderDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (timeFilter === 'today') {
      return orderDate.toDateString() === now.toDateString();
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

  const PLANS = [
    { name: '₹99 Monthly', price: 99, duration: 1, desc: 'Receive client matches, active dispatch alerts' },
    { name: 'Premium Plan', price: 299, duration: 6, desc: '6 Months access, 2x booking visibility boost' },
    { name: 'Featured Worker Plan', price: 499, duration: 12, desc: '1 Year access, top search listing, badge verification' }
  ];

  const handlePurchaseSubscription = (plan) => {
    buySubscription(user.id, plan.name, plan.duration);
    setPurchaseSuccess(true);
    setSelectedPlan(null);
    setTimeout(() => setPurchaseSuccess(false), 4000);
  };

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
        <h1 style={{ fontSize: '24px', fontWeight: '800' }}>Payments & Subscription</h1>
      </div>

      {purchaseSuccess && (
        <div className="auth-error" style={{ background: '#ecfdf5', borderColor: '#a7f3d0', color: '#065f46', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HiCheckCircle style={{ width: '20px', height: '20px' }} />
          <span>Subscription activated successfully! Operational features unlocked.</span>
        </div>
      )}

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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>Order #{o.id.slice(-6)}</span>
                    <span className={`status-chip ${o.status}`} style={{ fontSize: '10px', padding: '2px 8px' }}>
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
                <div style={{ textAlign: 'right' }}>
                  <strong style={{ display: 'block', fontSize: '16px', color: '#0f172a' }}>₹{o.booking?.total?.toLocaleString()}</strong>
                  <span style={{ fontSize: '11px', color: activeTab === 'completed' ? '#15803d' : activeTab === 'pending' ? '#d97706' : '#b91c1c', fontWeight: '600', marginTop: '2px', display: 'block' }}>
                    {activeTab === 'completed' ? 'Collected' : activeTab === 'pending' ? 'Pending Completion' : 'Rejected'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Subscription Package Panel */}
      <div className="worker-section" style={{ background: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', marginBottom: '24px', border: '1px solid #eee' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '6px' }}>Subscription Package Status</h2>
        <div style={{ background: user.subscription?.active ? '#f0fdf4' : '#fef2f2', border: '1px solid', borderColor: user.subscription?.active ? '#bbf7d0' : '#fecaca', padding: '12px 16px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <strong style={{ color: user.subscription?.active ? '#15803d' : '#b91c1c', fontSize: '14px' }}>
              {user.subscription?.active ? `PLAN ACTIVE: ${user.subscription.plan}` : 'NO ACTIVE SUBSCRIPTION'}
            </strong>
            {user.subscription?.active && (
              <span style={{ display: 'block', fontSize: '11px', color: '#666', marginTop: '2px' }}>
                Expires on: {user.subscription.expiresAt}
              </span>
            )}
          </div>
          <span style={{ fontSize: '20px' }}>{user.subscription?.active ? '✔️' : '❌'}</span>
        </div>

        <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#444', marginBottom: '12px' }}>Choose a Subscription Plan</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {PLANS.map(plan => (
            <div
              key={plan.name}
              onClick={() => setSelectedPlan(plan)}
              style={{
                border: '1.5px solid',
                borderColor: selectedPlan?.name === plan.name ? 'var(--primary)' : '#eee',
                background: selectedPlan?.name === plan.name ? 'var(--primary-light)' : '#fafafa',
                borderRadius: '12px',
                padding: '14px 16px',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.18s'
              }}
            >
              <div style={{ flex: 1, paddingRight: '12px' }}>
                <strong style={{ display: 'block', fontSize: '14px', color: '#1a1a1a' }}>{plan.name}</strong>
                <span style={{ display: 'block', fontSize: '12px', color: '#666', marginTop: '4px', lineHeight: '1.4' }}>
                  {plan.desc}
                </span>
              </div>
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <strong style={{ fontSize: '16px', color: 'var(--primary)' }}>₹{plan.price}</strong>
                <span style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                  {plan.duration} {plan.duration === 1 ? 'Month' : 'Months'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {selectedPlan && (
          <div style={{ marginTop: '20px', background: '#f9fafb', padding: '16px', borderRadius: '12px', border: '1px solid #eee' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', color: '#555' }}>Plan Selected: <strong>{selectedPlan.name}</strong></span>
              <strong style={{ fontSize: '15px', color: '#1a1a1a' }}>Total: ₹{selectedPlan.price}</strong>
            </div>
            <button
              onClick={() => handlePurchaseSubscription(selectedPlan)}
              style={{
                width: '100%',
                background: 'var(--primary)',
                color: '#fff',
                border: 'none',
                padding: '12px',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              🔒 Pay ₹{selectedPlan.price} & Activate Subscription
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
