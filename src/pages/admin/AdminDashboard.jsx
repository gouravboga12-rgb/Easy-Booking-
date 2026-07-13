import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { useAuthStore } from '../../store/useAuthStore';
import {
  HiClipboardList, HiLightningBolt, HiCheckCircle,
  HiCurrencyRupee, HiUsers, HiArrowRight, HiStar,
  HiTag, HiX, HiTrendingUp, HiBadgeCheck
} from 'react-icons/hi';
import { MdPendingActions, MdEngineering } from 'react-icons/md';
import './Admin.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const orders = useStore(s => s.orders);
  const users = useAuthStore(s => s.users);
  const user = useAuthStore(s => s.user);
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

  const now = new Date();
  const hours = now.getHours();
  const greeting = hours < 12 ? 'Good Morning' : hours < 17 ? 'Good Afternoon' : 'Good Evening';
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const STAT_CARDS = [
    { label: 'Total Orders',          val: orders.length,                                  Icon: HiClipboardList,  color: '#f59e0b', bg: '#fffbeb', path: '/admin/orders' },
    { label: 'Pending Dispatch',      val: pending.length,                                 Icon: MdPendingActions, color: '#ef4444', bg: '#fef2f2', path: '/admin/orders' },
    { label: 'Active Jobs',           val: active.length,                                  Icon: HiLightningBolt,  color: '#3b82f6', bg: '#eff6ff', path: '/admin/orders' },
    { label: 'Completed Jobs',        val: completed.length,                               Icon: HiCheckCircle,    color: '#10b981', bg: '#ecfdf5', path: '/admin/orders' },
    { label: 'Booking Revenue',       val: `₹${revenue.toLocaleString()}`,                 Icon: HiCurrencyRupee,  color: '#8b5cf6', bg: '#f5f3ff', path: '/admin/revenue' },
    { label: 'Subscription Revenue',  val: `₹${subscriptionRevenue.toLocaleString()}`,    Icon: HiTag,            color: '#06b6d4', bg: '#ecfeff', path: '/admin/subscriptions' },
    { label: 'Total Workers',         val: `${workers.length}`,                            Icon: MdEngineering,    color: '#f97316', bg: '#fff7ed', path: '/admin/workers' },
    { label: 'Online Workers',        val: `${onlineWorkers}/${workers.length}`,           Icon: HiUsers,          color: '#10b981', bg: '#ecfdf5', path: '/admin/workers' },
    { label: 'Active Subscriptions',  val: activeSubWorkers,                              Icon: HiBadgeCheck,     color: '#6366f1', bg: '#eef2ff', path: '/admin/subscriptions' },
    { label: 'Total Customers',       val: customers.length,                              Icon: HiUsers,          color: '#8b5cf6', bg: '#f5f3ff', path: '/admin/customers' },
    { label: 'Cancelled Orders',      val: cancelled.length,                              Icon: HiX,              color: '#ef4444', bg: '#fef2f2', path: '/admin/orders' },
    { label: 'Net Platform Earnings', val: `₹${(revenue + subscriptionRevenue).toLocaleString()}`, Icon: HiTrendingUp, color: '#10b981', bg: '#ecfdf5', path: '/admin/revenue' },
  ];

  const recent = [...orders].reverse().slice(0, 6);

  return (
    <div className="admin-page">

      {/* ── GRADIENT WELCOME HERO ── */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)',
        borderRadius: '20px',
        padding: '28px 32px',
        marginBottom: '28px',
        color: '#fff',
        boxShadow: '0 8px 32px rgba(15,52,96,0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ fontSize: '13px', opacity: 0.65, marginBottom: '4px', fontWeight: '600', letterSpacing: '0.5px' }}>
            {dateStr}
          </div>
          <h1 style={{ margin: 0, fontSize: '26px', fontWeight: '900' }}>
            {greeting}, {user?.name?.split(' ')[0] || 'Admin'} 👋
          </h1>
          <p style={{ margin: '6px 0 0', opacity: 0.7, fontSize: '14px' }}>
            Here's your complete platform overview
          </p>
        </div>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '14px 20px', textAlign: 'center', backdropFilter: 'blur(4px)' }}>
            <div style={{ fontSize: '22px', fontWeight: '800' }}>₹{(revenue + subscriptionRevenue).toLocaleString()}</div>
            <div style={{ fontSize: '11px', opacity: 0.75, marginTop: '2px' }}>Total Platform Revenue</div>
          </div>
          <div style={{ background: 'rgba(16,185,129,0.2)', borderRadius: '12px', padding: '14px 20px', textAlign: 'center', border: '1px solid rgba(16,185,129,0.3)' }}>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#34d399' }}>{orders.length}</div>
            <div style={{ fontSize: '11px', opacity: 0.75, marginTop: '2px' }}>Total Orders</div>
          </div>
        </div>
      </div>

      {/* ── STAT CARDS GRID ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: '14px', marginBottom: '28px' }}>
        {STAT_CARDS.map(({ label, val, Icon, color, bg, path }) => (
          <div
            key={label}
            onClick={() => navigate(path)}
            style={{
              background: '#fff',
              borderRadius: '14px',
              padding: '18px',
              cursor: 'pointer',
              border: `1.5px solid ${color}22`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              borderLeft: `4px solid ${color}`,
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${color}22`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.03)'; }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '22px', fontWeight: '900', color, lineHeight: 1 }}>{val}</div>
                <div style={{ fontSize: '11.5px', color: '#666', marginTop: '6px', fontWeight: '600' }}>{label}</div>
              </div>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon style={{ width: 18, height: 18, color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── QUICK ACTIONS ── */}
      <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
        <h2 style={{ fontSize: '14px', fontWeight: '800', color: '#334155', margin: '0 0 14px' }}>⚡ Quick Actions</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {[
            { label: 'Manage Orders',       path: '/admin/orders',        color: '#f59e0b' },
            { label: 'Workers',             path: '/admin/workers',       color: '#10b981' },
            { label: 'Customers',           path: '/admin/customers',     color: '#3b82f6' },
            { label: 'Subscriptions',       path: '/admin/subscriptions', color: '#8b5cf6' },
            { label: 'Revenue',             path: '/admin/revenue',       color: '#06b6d4' },
            { label: 'Reports & Analytics', path: '/admin/reports',       color: '#f97316' },
            { label: 'Notifications',       path: '/admin/notifications', color: '#eab308' },
            { label: 'CMS Management',      path: '/admin/cms',           color: '#d946ef' },
          ].map(({ label, path, color }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              style={{
                background: `${color}12`,
                color,
                border: `1.5px solid ${color}33`,
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '12.5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              {label} <HiArrowRight style={{ width: 13, height: 13 }} />
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* ── RECENT ORDERS ── */}
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

        {/* ── WORKERS OVERVIEW ── */}
        <div className="admin-section">
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
    </div>
  );
}
