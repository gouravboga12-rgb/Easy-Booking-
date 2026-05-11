import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { useAuthStore } from '../../store/useAuthStore';
import {
  HiClipboardList, HiLightningBolt, HiCheckCircle,
  HiCurrencyRupee, HiUsers, HiArrowRight, HiStar,
} from 'react-icons/hi';
import { MdPendingActions } from 'react-icons/md';
import './Admin.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const orders = useStore(s => s.orders);
  const getWorkers = useAuthStore(s => s.getWorkers);
  const workers = getWorkers();

  const stats = {
    total:            orders.length,
    pending:          orders.filter(o => o.status === 'pending').length,
    active:           orders.filter(o => ['assigned', 'active'].includes(o.status)).length,
    completed:        orders.filter(o => o.status === 'completed').length,
    revenue:          orders.filter(o => o.status === 'completed').reduce((s, o) => s + (o.booking?.total || 0), 0),
    availableWorkers: workers.filter(w => w.available).length,
  };

  const recent = orders.slice(0, 5);

  const STAT_CARDS = [
    { label: 'Total Orders',       val: stats.total,                           Icon: HiClipboardList,  cls: 'orange' },
    { label: 'Pending',            val: stats.pending,                         Icon: MdPendingActions, cls: 'yellow' },
    { label: 'Active Jobs',        val: stats.active,                          Icon: HiLightningBolt,  cls: 'blue'   },
    { label: 'Completed',          val: stats.completed,                       Icon: HiCheckCircle,    cls: 'green'  },
    { label: 'Revenue',            val: `₹${stats.revenue.toLocaleString()}`,  Icon: HiCurrencyRupee,  cls: 'purple' },
    { label: 'Workers Online',     val: `${stats.availableWorkers}/${workers.length}`, Icon: HiUsers,  cls: 'teal'   },
  ];

  return (
    <div className="admin-page">
      <div className="dash-welcome">
        <p>Here's what's happening today 👋</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {STAT_CARDS.map(({ label, val, Icon, cls }) => (
          <div key={label} className={`stat-card ${cls}`}>
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
          { label: 'Manage Orders',    path: '/admin/orders',    cls: 'orange' },
          { label: 'View Customers',   path: '/admin/customers', cls: 'blue'   },
          { label: 'Manage Workers',   path: '/admin/workers',   cls: 'green'  },
          { label: 'Payments',         path: '/admin/payments',  cls: 'purple' },
        ].map(({ label, path, cls }) => (
          <button key={path} className={`qa-btn ${cls}`} onClick={() => navigate(path)}>
            {label} <HiArrowRight style={{ width: 14, height: 14 }} />
          </button>
        ))}
      </div>

      {/* Recent Orders as Cards */}
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

      {/* Workers */}
      <div className="admin-section" style={{ marginTop: 16 }}>
        <div className="as-header">
          <h2>Workers</h2>
          <button onClick={() => navigate('/admin/workers')}>Manage <HiArrowRight style={{ width: 13, height: 13 }} /></button>
        </div>
        <div className="worker-list">
          {workers.map(w => (
            <div key={w.id} className="worker-row">
              <div className="wr-avatar">{w.name.charAt(0)}</div>
              <div className="wr-info">
                <strong>{w.name}</strong>
                <span>{w.vehicle}</span>
              </div>
              <div className={`avail-dot ${w.available ? 'on' : 'off'}`} />
              <span className="wr-rating">
                <HiStar style={{ width: 12, height: 12, color: '#f59e0b' }} /> {w.rating}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
