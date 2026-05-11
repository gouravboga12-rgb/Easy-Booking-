import { useStore } from '../../store/useStore';
import { useAuthStore } from '../../store/useAuthStore';
import { HiChartBar, HiChevronLeft, HiTrendingUp, HiCheckCircle, HiX, HiCurrencyRupee } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import './Admin.css';

export default function AdminReports() {
  const navigate = useNavigate();
  const orders = useStore(s => s.orders);
  const getWorkers = useAuthStore(s => s.getWorkers);
  const workers = getWorkers();

  const completed  = orders.filter(o => o.status === 'completed');
  const cancelled  = orders.filter(o => o.status === 'cancelled');
  const revenue    = completed.reduce((s, o) => s + (o.booking?.total || 0), 0);
  const avgOrder   = completed.length ? Math.round(revenue / completed.length) : 0;

  // Top vehicles
  const vehicleCount = {};
  orders.forEach(o => {
    if (!o.vehicle?.name) return;
    vehicleCount[o.vehicle.name] = (vehicleCount[o.vehicle.name] || 0) + 1;
  });
  const topVehicles = Object.entries(vehicleCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Top workers
  const topWorkers = workers
    .map(w => ({ ...w, jobs: orders.filter(o => o.operator?.id === w.id && o.status === 'completed').length }))
    .sort((a, b) => b.jobs - a.jobs).slice(0, 5);

  const METRICS = [
    { Icon: HiTrendingUp,     label: 'Total Orders',    val: orders.length,              color: '#3b82f6' },
    { Icon: HiCheckCircle,    label: 'Completed',       val: completed.length,           color: '#10b981' },
    { Icon: HiX,              label: 'Cancelled',       val: cancelled.length,           color: '#ef4444' },
    { Icon: HiCurrencyRupee,  label: 'Total Revenue',   val: `₹${revenue.toLocaleString()}`, color: '#8b5cf6' },
    { Icon: HiCurrencyRupee,  label: 'Avg Order Value', val: `₹${avgOrder.toLocaleString()}`, color: '#f59e0b' },
    { Icon: HiCheckCircle,    label: 'Completion Rate', val: orders.length ? `${Math.round(completed.length / orders.length * 100)}%` : '0%', color: '#14b8a6' },
  ];

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="ah-with-back">
          <button className="back-icon-btn" onClick={() => navigate('/admin/more')}><HiChevronLeft /></button>
          <div><h1>Reports</h1><p>Analytics & performance overview</p></div>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: 28 }}>
        {METRICS.map(({ Icon, label, val, color }) => (
          <div key={label} className="report-metric">
            <div className="rm-icon" style={{ background: color + '18', color }}><Icon style={{ width: 20, height: 20 }} /></div>
            <strong>{val}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>

      <div className="reports-grid">
        <div className="admin-section">
          <div className="as-header"><h2>Top Vehicles Booked</h2></div>
          {topVehicles.length === 0 ? <div className="empty-msg">No data yet.</div> : (
            <div className="top-list">
              {topVehicles.map(([name, count], i) => (
                <div key={name} className="top-item">
                  <span className="top-rank">#{i + 1}</span>
                  <span className="top-name">{name}</span>
                  <div className="top-bar-wrap">
                    <div className="top-bar" style={{ width: `${(count / topVehicles[0][1]) * 100}%` }} />
                  </div>
                  <span className="top-count">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="admin-section">
          <div className="as-header"><h2>Top Workers</h2></div>
          {topWorkers.length === 0 ? <div className="empty-msg">No data yet.</div> : (
            <div className="top-list">
              {topWorkers.map((w, i) => (
                <div key={w.id} className="top-item">
                  <span className="top-rank">#{i + 1}</span>
                  <div className="wr-avatar" style={{ width: 28, height: 28, fontSize: 12 }}>{w.name.charAt(0)}</div>
                  <span className="top-name">{w.name}</span>
                  <span className="top-count">{w.jobs} jobs</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
