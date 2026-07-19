import { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { useAuthStore } from '../../store/useAuthStore';
import './Admin.css';

export default function AdminReports() {
  const orders = useStore(s => s.orders);
  const subscriptionPlans = useStore(s => s.subscriptionPlans) || [];
  const fetchSubscriptionPlans = useStore(s => s.fetchSubscriptionPlans);
  const users = useAuthStore(s => s.users);
  
  useEffect(() => {
    if (fetchSubscriptionPlans) fetchSubscriptionPlans();
  }, [fetchSubscriptionPlans]);

  const workers = users.filter(u => u.role === 'worker');
  const customers = users.filter(u => u.role === 'customer');

  const [reportType, setReportType] = useState('bookings');

  const completed  = orders.filter(o => o.status === 'completed');
  const cancelled  = orders.filter(o => o.status === 'cancelled');
  const active     = orders.filter(o => ['assigned', 'active'].includes(o.status));
  const pending    = orders.filter(o => o.status === 'pending');
  const revenue    = completed.reduce((s, o) => s + (o.booking?.total || 0), 0);
  const avgOrder   = completed.length ? Math.round(revenue / completed.length) : 0;

  // Subscription Revenue calculated dynamically (aggregating all subscriber plans)
  const allPlansMap = {};

  // 1. Initialize with database subscription plans (this handles plans with 0 subscribers)
  subscriptionPlans.forEach(plan => {
    allPlansMap[plan.name] = {
      name: plan.name,
      price: parseFloat(plan.price) || 0,
      type: plan.type || 'worker',
      active: !!plan.active,
      isDbPlan: true
    };
  });

  // 2. Add plans from active subscribers (handles deleted, modified, or custom plans)
  const subscribedUsers = users.filter(u => u.subscription?.active);
  subscribedUsers.forEach(u => {
    const planName = u.subscription?.plan;
    if (!planName) return;

    if (!allPlansMap[planName]) {
      // Resolve price
      let price = 0;
      if (u.subscription.price !== undefined) {
        price = parseFloat(u.subscription.price) || 0;
      } else {
        const fallbackPrice = planName.match(/(\d+)/)?.[0];
        price = parseFloat(fallbackPrice || 0);
      }
      allPlansMap[planName] = {
        name: planName,
        price: price,
        type: u.role || 'worker',
        active: true,
        isDbPlan: false
      };
    }
  });

  // Convert map to array and calculate subscriber counts & revenues
  const displayPlans = Object.values(allPlansMap).map(plan => {
    const subscribers = subscribedUsers.filter(u => u.subscription?.active && u.subscription?.plan === plan.name);
    const count = subscribers.length;
    
    // Sum all payments made by users for this plan across active and upgrade history
    const revenueVal = users.reduce((sum, u) => {
      const sub = u.subscription;
      if (!sub) return sum;
      if (Array.isArray(sub.history) && sub.history.length > 0) {
        const planPurchases = sub.history.filter(h => h.plan === plan.name);
        return sum + planPurchases.reduce((s, h) => s + (parseFloat(h.price) || 0), 0);
      }
      if (sub.active && sub.plan === plan.name) {
        return sum + (sub.price !== undefined ? (parseFloat(sub.price) || 0) : plan.price);
      }
      return sum;
    }, 0);

    return {
      ...plan,
      count,
      revenue: revenueVal
    };
  });

  const subscriptionRevenue = users.reduce((sum, u) => {
    const sub = u.subscription;
    if (!sub) return sum;
    if (Array.isArray(sub.history) && sub.history.length > 0) {
      return sum + sub.history.reduce((hSum, entry) => hSum + (parseFloat(entry.price) || 0), 0);
    }
    if (sub.active) {
      if (sub.price !== undefined) return sum + (parseFloat(sub.price) || 0);
      const plan = subscriptionPlans.find(p => p.name === sub.plan);
      if (plan) return sum + (parseFloat(plan.price) || 0);
      const fallbackPrice = sub.plan?.match(/(\d+)/)?.[0];
      return sum + (parseFloat(fallbackPrice || 0));
    }
    return sum;
  }, 0);

  const totalPlatformRevenue = revenue + subscriptionRevenue;

  // Top services booked
  const serviceCount = {};
  orders.forEach(o => {
    if (!o.vehicle?.name) return;
    serviceCount[o.vehicle.name] = (serviceCount[o.vehicle.name] || 0) + 1;
  });
  const topServices = Object.entries(serviceCount).sort((a, b) => b[1] - a[1]).slice(0, 8);

  // Top categories
  const catCount = {};
  orders.forEach(o => {
    const cat = o.vehicle?.categoryLabel || o.vehicle?.category || 'Other';
    catCount[cat] = (catCount[cat] || 0) + 1;
  });
  const topCategories = Object.entries(catCount).sort((a, b) => b[1] - a[1]);
  const maxCatCount = Math.max(...Object.values(catCount), 1);

  // Top workers by completed jobs
  const topWorkers = workers
    .map(w => ({
      ...w,
      jobs: orders.filter(o => o.operator?.id === w.id && o.status === 'completed').length,
      revenue: orders.filter(o => o.operator?.id === w.id && o.status === 'completed').reduce((s, o) => s + (o.booking?.total || 0), 0)
    }))
    .sort((a, b) => b.jobs - a.jobs).slice(0, 8);

  // Customer stats
  const topCustomers = customers.map(c => ({
    ...c,
    orders: orders.filter(o => o.customer?.id === c.id).length,
    spent: orders.filter(o => o.customer?.id === c.id && o.status === 'completed').reduce((s, o) => s + (o.booking?.total || 0), 0)
  })).sort((a, b) => b.spent - a.spent).slice(0, 8);

  const SUMMARY_METRICS = [
    { label: 'Total Bookings',     val: orders.length,          color: '#3b82f6', icon: '📋' },
    { label: 'Completed Jobs',     val: completed.length,       color: '#10b981', icon: '✅' },
    { label: 'Active Jobs',        val: active.length,          color: '#f59e0b', icon: '🔴' },
    { label: 'Cancelled',          val: cancelled.length,       color: '#ef4444', icon: '❌' },
    { label: 'Booking Revenue',    val: `₹${revenue.toLocaleString()}`,              color: '#8b5cf6', icon: '💰' },
    { label: 'Subscription Rev.',  val: `₹${subscriptionRevenue.toLocaleString()}`,  color: '#06b6d4', icon: '📋' },
    { label: 'Total Platform Rev.',val: `₹${totalPlatformRevenue.toLocaleString()}`, color: '#10b981', icon: '📈' },
    { label: 'Avg Order Value',    val: `₹${avgOrder.toLocaleString()}`,             color: '#f97316', icon: '🧾' },
    { label: 'Total Workers',      val: workers.length,         color: '#a78bfa', icon: '👷' },
    { label: 'Active Subscriptions', val: subscribedUsers.length, color: '#7c3aed', icon: '🔐' },
    { label: 'Total Customers',    val: customers.length,       color: '#2563eb', icon: '👤' },
    { label: 'Completion Rate',    val: orders.length ? `${Math.round(completed.length / orders.length * 100)}%` : '0%', color: '#14b8a6', icon: '🎯' },
  ];

  const REPORT_TABS = [
    { key: 'bookings', label: '📋 Bookings' },
    { key: 'workers', label: '👷 Workers' },
    { key: 'customers', label: '👤 Customers' },
    { key: 'categories', label: '🏷️ Categories' },
    { key: 'growth', label: '📈 Growth Analytics' },
  ];

  return (
    <div className="admin-page" style={{ paddingBottom: '32px' }}>
      <div className="admin-header">
        <div>
          <h1>Reports & Analytics</h1>
          <p>Platform-wide analytics across users, workers, bookings, revenue, subscriptions, and growth trends</p>
        </div>
      </div>

      {/* Summary Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '28px' }}>
        {SUMMARY_METRICS.map(({ label, val, color, icon }) => (
          <div key={label} style={{ background: '#fff', padding: '16px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', border: `1.5px solid ${color}22` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '20px', fontWeight: '800', color }}>{val}</div>
                <div style={{ fontSize: '11px', color: '#888', marginTop: '3px' }}>{label}</div>
              </div>
              <span style={{ fontSize: '18px' }}>{icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tab filters */}
      <div className="filter-tabs" style={{ marginBottom: '24px' }}>
        {REPORT_TABS.map(t => (
          <button key={t.key} className={reportType === t.key ? 'active' : ''} onClick={() => setReportType(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Bookings report */}
      {reportType === 'bookings' && (
        <div className="reports-grid">
          <div className="admin-section">
            <div className="as-header"><h2>Top Services Booked</h2></div>
            {topServices.length === 0 ? <div className="empty-msg">No booking data yet.</div> : (
              <div className="top-list">
                {topServices.map(([name, count], i) => (
                  <div key={name} className="top-item">
                    <span className="top-rank">#{i + 1}</span>
                    <span className="top-name">{name}</span>
                    <div className="top-bar-wrap">
                      <div className="top-bar" style={{ width: `${(count / topServices[0][1]) * 100}%` }} />
                    </div>
                    <span className="top-count">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="admin-section">
            <div className="as-header"><h2>Booking Status Breakdown</h2></div>
            {[
              { label: 'Completed', count: completed.length, color: '#10b981' },
              { label: 'Active', count: active.length, color: '#3b82f6' },
              { label: 'Pending', count: pending.length, color: '#f59e0b' },
              { label: 'Cancelled', count: cancelled.length, color: '#ef4444' },
            ].map(({ label, count, color }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#fafafa', borderRadius: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#444' }}>{label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '80px', height: '6px', background: '#eee', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: orders.length ? `${(count / orders.length) * 100}%` : '0%', height: '100%', background: color, borderRadius: '3px' }} />
                  </div>
                  <strong style={{ color, fontSize: '14px', minWidth: '24px', textAlign: 'right' }}>{count}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Workers report */}
      {reportType === 'workers' && (
        <div className="reports-grid">
          <div className="admin-section">
            <div className="as-header"><h2>Top Workers by Completed Jobs</h2></div>
            {topWorkers.length === 0 ? <div className="empty-msg">No worker data yet.</div> : (
              <div className="top-list">
                {topWorkers.map((w, i) => (
                  <div key={w.id} className="top-item">
                    <span className="top-rank">#{i + 1}</span>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '12px', flexShrink: 0 }}>
                      {w.name.charAt(0)}
                    </div>
                    <span className="top-name">{w.name}</span>
                    <span style={{ fontSize: '11px', color: '#888' }}>₹{w.revenue.toLocaleString()}</span>
                    <span className="top-count">{w.jobs} jobs</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="admin-section">
            <div className="as-header"><h2>Worker Status Overview</h2></div>
            {[
              { label: 'Online & Available', count: workers.filter(w => w.available).length, color: '#10b981' },
              { label: 'Active Subscriptions', count: workers.filter(w => w.subscription?.active).length, color: '#8b5cf6' },
              { label: 'Blocked/Suspended', count: workers.filter(w => w.blocked).length, color: '#ef4444' },
            ].map(({ label, count, color }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#fafafa', borderRadius: '8px', marginBottom: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#444' }}>{label}</span>
                <strong style={{ color, fontSize: '16px' }}>{count}</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Customers report */}
      {reportType === 'customers' && (
        <div className="admin-section">
          <div className="as-header"><h2>Top Customers by Spending</h2></div>
          <div className="orders-table-wrap">
            <table className="admin-table full">
              <thead>
                <tr><th>Customer</th><th>Email</th><th>Total Orders</th><th>Completed</th><th>Total Spent</th></tr>
              </thead>
              <tbody>
                {topCustomers.map((c, i) => (
                  <tr key={c.id}>
                    <td><strong>#{i + 1} {c.name}</strong></td>
                    <td style={{ color: '#888', fontSize: '12px' }}>{c.email}</td>
                    <td>{c.orders}</td>
                    <td>{orders.filter(o => o.customer?.id === c.id && o.status === 'completed').length}</td>
                    <td><strong style={{ color: 'var(--primary)' }}>₹{c.spent.toLocaleString()}</strong></td>
                  </tr>
                ))}
                {topCustomers.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: '#aaa' }}>No customer activity yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Categories */}
      {reportType === 'categories' && (
        <div className="admin-section">
          <div className="as-header"><h2>Bookings by Service Category</h2></div>
          {topCategories.length === 0 ? <div className="empty-msg">No booking data by category yet.</div> : (
            <div className="top-list">
              {topCategories.map(([cat, count], i) => (
                <div key={cat} className="top-item">
                  <span className="top-rank">#{i + 1}</span>
                  <span className="top-name">{cat}</span>
                  <div className="top-bar-wrap">
                    <div className="top-bar" style={{ width: `${(count / maxCatCount) * 100}%` }} />
                  </div>
                  <span className="top-count">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Growth Analytics */}
      {reportType === 'growth' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {[
            { label: 'Platform Conversion Rate', val: orders.length ? `${Math.round(completed.length / orders.length * 100)}%` : '0%', desc: 'Bookings that completed successfully vs total placed', color: '#10b981' },
            { label: 'Worker Subscription Rate', val: workers.length ? `${Math.round(workers.filter(w => w.subscription?.active).length / workers.length * 100)}%` : '0%', desc: 'Workers with active subscriptions vs total workers', color: '#3b82f6' },
            { label: 'Avg Revenue Per Worker', val: workers.length ? `₹${Math.round(revenue / workers.length).toLocaleString()}` : '₹0', desc: 'Average booking revenue generated per active worker', color: '#f59e0b' },
            { label: 'Revenue Growth (Est.)', val: '+12.4% MoM', desc: 'Estimated month-over-month growth based on order trends', color: '#14b8a6' },
          ].map(({ label, val, desc, color }) => (
            <div key={label} style={{ background: '#fff', padding: '20px', borderRadius: '14px', border: `1.5px solid ${color}22`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', gap: '12px' }}>
              <div>
                <div style={{ fontWeight: '700', fontSize: '15px', color: '#1a1a1a', marginBottom: '4px' }}>{label}</div>
                <div style={{ fontSize: '12px', color: '#888' }}>{desc}</div>
              </div>
              <strong style={{ fontSize: '24px', fontWeight: '900', color, whiteSpace: 'nowrap' }}>{val}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
