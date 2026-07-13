import { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { useAuthStore } from '../../store/useAuthStore';
import { HiCurrencyRupee, HiCalendar, HiChartBar, HiTrendingUp, HiDownload } from 'react-icons/hi';
import './Admin.css';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function AdminRevenue() {
  const orders = useStore(s => s.orders);
  const subscriptionPlans = useStore(s => s.subscriptionPlans) || [];
  const fetchSubscriptionPlans = useStore(s => s.fetchSubscriptionPlans);
  const users = useAuthStore(s => s.users);

  useEffect(() => {
    if (fetchSubscriptionPlans) fetchSubscriptionPlans();
  }, [fetchSubscriptionPlans]);

  const workers = users.filter(u => u.role === 'worker');

  const [period, setPeriod] = useState('monthly');

  const completed = orders.filter(o => o.status === 'completed');
  const totalRevenue = completed.reduce((s, o) => s + (o.booking?.total || 0), 0);
  const pendingRevenue = orders.filter(o => o.status === 'pending').reduce((s, o) => s + (o.booking?.total || 0), 0);
  const cancelled = orders.filter(o => o.status === 'cancelled');
  const gstRevenue = Math.round(totalRevenue * 0.18);
  const netRevenue = totalRevenue - gstRevenue;

  // Subscription Revenue calculated dynamically
  const subscriptionRevenue = workers.reduce((sum, w) => {
    if (!w.subscription?.active) return sum;
    const plan = subscriptionPlans.find(p => p.name === w.subscription?.plan);
    if (plan) return sum + (parseFloat(plan.price) || 0);
    const fallbackPrice = w.subscription.plan?.match(/₹\s*(\d+)/)?.[1];
    return sum + (parseFloat(fallbackPrice || 0));
  }, 0);

  // Monthly breakdown (simulated from order dates or created date)
  const monthlyData = MONTHS.map((m, idx) => {
    const monthOrders = completed.filter(o => {
      const d = new Date(o.createdAt || o.booking?.date);
      return d.getMonth() === idx;
    });
    return { month: m, revenue: monthOrders.reduce((s, o) => s + (o.booking?.total || 0), 0), count: monthOrders.length };
  });

  const maxRevenue = Math.max(...monthlyData.map(d => d.revenue), 1);

  // Category-wise revenue
  const categoryRevenue = {};
  completed.forEach(o => {
    const cat = o.vehicle?.categoryLabel || o.vehicle?.category || 'Other';
    categoryRevenue[cat] = (categoryRevenue[cat] || 0) + (o.booking?.total || 0);
  });
  const topCategories = Object.entries(categoryRevenue).sort((a, b) => b[1] - a[1]);

  const subscribedWorkers = workers.filter(w => w.subscription?.active);

  const SUMMARY_CARDS = [
    { label: 'Subscription Revenue', val: `₹${subscriptionRevenue.toLocaleString()}`, color: '#8b5cf6', icon: '📋' },
    { label: 'Total Booking Sales', val: `₹${totalRevenue.toLocaleString()}`, color: '#10b981', icon: '💰' },
    { label: 'Net Platform Earnings', val: `₹${(subscriptionRevenue + netRevenue).toLocaleString()}`, color: '#3b82f6', icon: '📈' },
    { label: 'GST on Bookings (18%)', val: `₹${gstRevenue.toLocaleString()}`, color: '#f59e0b', icon: '🧾' },
    { label: 'Active Subscribers', val: `${subscribedWorkers.length} Users`, color: '#6366f1', icon: '👷' },
    { label: 'Pending Sales Pool', val: `₹${pendingRevenue.toLocaleString()}`, color: '#f97316', icon: '⏳' },
  ];

  return (
    <div className="admin-page" style={{ paddingBottom: '32px' }}>
      <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Revenue Management</h1>
          <p>Monitor worker subscriptions, operational platform revenues, and tax audits</p>
        </div>
        <button
          onClick={() => alert('Exporting detailed subscription reports... Check downloads folder.')}
          style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <HiDownload /> Export Report
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {SUMMARY_CARDS.map(({ label, val, color, icon }) => (
          <div key={label} style={{ background: '#fff', padding: '20px', borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', border: `1.5px solid ${color}22` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '22px', fontWeight: '800', color }}>{val}</div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px', fontWeight: '600' }}>{label}</div>
              </div>
              <span style={{ fontSize: '24px' }}>{icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Subscribed Workers details table */}
      <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', marginBottom: '24px', border: '1px solid #eee' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px', color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1.5px solid #fafafa', paddingBottom: '10px' }}>
          📋 Active Subscribed Professionals ({subscribedWorkers.length})
        </h2>
        {subscribedWorkers.length === 0 ? (
          <p style={{ color: '#aaa', fontStyle: 'italic', fontSize: '13px', margin: 0, textAlign: 'center', padding: '16px 0' }}>No operators are currently subscribed to any plan.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #edf2f7' }}>
                  <th style={{ padding: '12px', color: '#475569', fontWeight: '700' }}>Operator Name</th>
                  <th style={{ padding: '12px', color: '#475569', fontWeight: '700' }}>Primary Class</th>
                  <th style={{ padding: '12px', color: '#475569', fontWeight: '700' }}>Active Plan</th>
                  <th style={{ padding: '12px', color: '#475569', fontWeight: '700' }}>Aadhaar Copy</th>
                  <th style={{ padding: '12px', color: '#475569', fontWeight: '700' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {subscribedWorkers.map(w => (
                  <tr key={w.id} style={{ borderBottom: '1px solid #edf2f7' }}>
                    <td style={{ padding: '12px', fontWeight: '700', color: '#1e293b' }}>{w.name}</td>
                    <td style={{ padding: '12px', color: '#64748b' }}>{w.vehicle || 'Not specified'}</td>
                    <td style={{ padding: '12px', fontWeight: '600', color: '#8b5cf6' }}>{w.subscription.plan}</td>
                    <td style={{ padding: '12px', color: '#64748b' }}>{w.aadhaar ? '✅ Submitted' : '❌ Pending'}</td>
                    <td style={{ padding: '12px' }}><span style={{ background: '#ecfdf5', color: '#065f46', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>ACTIVE</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Revenue Breakdown Tables */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        
        {/* Category Revenue */}
        <div style={{ background: '#fff', padding: '20px', borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', border: '1px solid #eee' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '14px' }}>Revenue by Category</h2>
          {topCategories.length === 0 ? (
            <p style={{ color: '#aaa', fontStyle: 'italic', fontSize: '13px' }}>No revenue data yet. Place orders to see categories.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {topCategories.map(([cat, rev]) => (
                <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '8px', background: '#fafafa', borderRadius: '6px' }}>
                  <span style={{ color: '#444', fontWeight: '600' }}>{cat}</span>
                  <strong style={{ color: 'var(--primary)' }}>₹{rev.toLocaleString()}</strong>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Subscription Revenue Breakdown */}
        <div style={{ background: '#fff', padding: '20px', borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', border: '1px solid #eee' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '14px' }}>Subscription Revenue by Plan</h2>
          {subscriptionPlans.length === 0 ? (
            <p style={{ color: '#aaa', fontStyle: 'italic', fontSize: '13px' }}>No plan categories configured in database.</p>
          ) : (
            subscriptionPlans.map(plan => {
              const count = workers.filter(w => w.subscription?.active && w.subscription?.plan === plan.name).length;
              const price = parseFloat(plan.price) || 0;
              return (
                <div key={plan.id || plan.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '8px', background: '#fafafa', borderRadius: '6px', marginBottom: '8px' }}>
                  <div>
                    <span style={{ fontWeight: '600', color: '#444' }}>{plan.name}</span>
                    <span style={{ fontSize: '11px', color: '#888', marginLeft: '8px' }}>{count} active subscribers</span>
                  </div>
                  <strong style={{ color: '#8b5cf6' }}>₹{(count * price).toLocaleString()}</strong>
                </div>
              );
            })
          )}

          <div style={{ marginTop: '12px', padding: '10px', background: '#eff6ff', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: '700', color: '#2563eb', fontSize: '13px' }}>GST on Subscriptions (18%)</span>
            <strong style={{ color: '#2563eb' }}>₹{Math.round(subscriptionRevenue * 0.18).toLocaleString()}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
