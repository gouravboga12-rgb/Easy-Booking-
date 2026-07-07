import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { useAuthStore } from '../../store/useAuthStore';
import {
  HiClipboardList, HiLightningBolt, HiCheckCircle,
  HiCurrencyRupee, HiUsers, HiArrowRight, HiStar,
  HiTag, HiX,
} from 'react-icons/hi';
import { MdPendingActions, MdEngineering } from 'react-icons/md';
import './Admin.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const orders = useStore(s => s.orders);
  const users = useAuthStore(s => s.users);
  const workers = users.filter(u => u.role === 'worker');
  const customers = users.filter(u => u.role === 'customer');

  const completed   = orders.filter(o => o.status === 'completed');
  const active      = orders.filter(o => ['assigned', 'active'].includes(o.status));
  const pending     = orders.filter(o => o.status === 'pending');
  const cancelled   = orders.filter(o => o.status === 'cancelled');
  const revenue     = completed.reduce((s, o) => s + (o.booking?.total || 0), 0);

  const PLAN_PRICES = { '₹99 Monthly': 99, 'Premium Plan': 299, 'Featured Worker Plan': 499 };
  const subscriptionRevenue = workers.reduce((s, w) => s + (PLAN_PRICES[w.subscription?.plan] || 0), 0);

  const onlineWorkers   = workers.filter(w => w.available).length;
  const activeSubWorkers = workers.filter(w => w.subscription?.active).length;

  const STAT_CARDS = [
    { label: 'Total Orders',         val: orders.length,                          Icon: HiClipboardList,  cls: 'orange', path: '/admin/orders' },
    { label: 'Pending Dispatch',      val: pending.length,                         Icon: MdPendingActions, cls: 'yellow', path: '/admin/orders' },
    { label: 'Active Jobs',           val: active.length,                          Icon: HiLightningBolt,  cls: 'blue',   path: '/admin/orders' },
    { label: 'Completed Jobs',        val: completed.length,                       Icon: HiCheckCircle,    cls: 'green',  path: '/admin/orders' },
    { label: 'Booking Revenue',       val: `₹${revenue.toLocaleString()}`,         Icon: HiCurrencyRupee,  cls: 'purple', path: '/admin/revenue' },
    { label: 'Subscription Revenue', val: `₹${subscriptionRevenue.toLocaleString()}`, Icon: HiTag,        cls: 'teal',   path: '/admin/subscriptions' },
    { label: 'Total Workers',         val: `${workers.length}`,                    Icon: MdEngineering,    cls: 'orange', path: '/admin/workers' },
    { label: 'Workers Online',        val: `${onlineWorkers}/${workers.length}`,   Icon: HiUsers,          cls: 'green',  path: '/admin/workers' },
    { label: 'Active Subscriptions', val: activeSubWorkers,                        Icon: HiCheckCircle,    cls: 'blue',   path: '/admin/subscriptions' },
    { label: 'Total Customers',       val: customers.length,                       Icon: HiUsers,          cls: 'purple', path: '/admin/customers' },
    { label: 'Cancelled Orders',      val: cancelled.length,                       Icon: HiX,              cls: 'red',    path: '/admin/orders' },
  ];

  const recent = [...orders].reverse().slice(0, 6);

  return (
    <div className="admin-page">
      <div className="dash-welcome">
        <p>Here's your complete platform overview 👋</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {STAT_CARDS.map(({ label, val, Icon, cls, path }) => (
          <div key={label} className={`stat-card ${cls}`} onClick={() => navigate(path)} style={{ cursor: 'pointer' }}>
            <div className="sc-top">
              <div className="sc-val">{val}</div>
              <div className={`sc-icon-wrap ${cls}`}><Icon className="sc-icon" /></div>
            </div>
            <div className="sc-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        {[
          { label: 'Manage Orders',       path: '/admin/orders',        cls: 'orange' },
          { label: 'Workers',             path: '/admin/workers',       cls: 'green'  },
          { label: 'Customers',           path: '/admin/customers',     cls: 'blue'   },
          { label: 'Subscriptions',       path: '/admin/subscriptions', cls: 'purple' },
          { label: 'Revenue',             path: '/admin/revenue',       cls: 'teal'   },
          { label: 'Reports & Analytics', path: '/admin/reports',       cls: 'orange' },
          { label: 'Notifications',       path: '/admin/notifications', cls: 'yellow' },
          { label: 'CMS',                 path: '/admin/cms',           cls: 'purple' },
        ].map(({ label, path, cls }) => (
          <button key={path} className={`qa-btn ${cls}`} onClick={() => navigate(path)}>
            {label} <HiArrowRight style={{ width: 14, height: 14 }} />
          </button>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="admin-section">
        <div className="as-header">
          <h2>Recent Orders</h2>
          <button onClick={() => navigate('/admin/orders')}>View all <HiArrowRight style={{ width: 13, height: 13 }} /></button>
        </div>
        {recent.length === 0 ? (
          <div className="empty-msg">No orders yet.</div>
        ) : (
          <div className="recent-orders-list">
            {recent.map(o => (
              <div key={o.id} className="ro-item" onClick={() => navigate('/admin/orders')}>
                <div className="ro-left">
                  <div className="ro-vehicle">{o.vehicle?.name}</div>
                  <div className="ro-meta">
                    <span className="mono">#{o.id.slice(-6)}</span>
                    <span>·</span>
                    <span>{o.customer?.name || 'Guest'}</span>
                    {o.operator && <><span>·</span><span>🔧 {o.operator.name}</span></>}
                  </div>
                </div>
                <div className="ro-right">
                  <div className="ro-amount">₹{o.booking?.total?.toLocaleString() || '—'}</div>
                  <span className={`status-chip ${o.status}`}>{o.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Workers Overview */}
      <div className="admin-section" style={{ marginTop: 16 }}>
        <div className="as-header">
          <h2>Workers</h2>
          <button onClick={() => navigate('/admin/workers')}>Manage <HiArrowRight style={{ width: 13, height: 13 }} /></button>
        </div>
        <div className="worker-list">
          {workers.slice(0, 8).map(w => (
            <div key={w.id} className="worker-row">
              <div className="wr-avatar">{w.name.charAt(0)}</div>
              <div className="wr-info">
                <strong>{w.name}</strong>
                <span>{w.categories?.join(', ') || w.vehicle || 'Worker'}</span>
              </div>
              {w.subscription?.active && (
                <span style={{ fontSize: '10px', background: '#eff6ff', color: '#2563eb', padding: '2px 6px', borderRadius: '4px', fontWeight: '700', marginRight: 4 }}>SUB</span>
              )}
              <div className={`avail-dot ${w.available ? 'on' : 'off'}`} />
              <span className="wr-rating">
                <HiStar style={{ width: 12, height: 12, color: '#f59e0b' }} /> {w.rating || '4.5'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
