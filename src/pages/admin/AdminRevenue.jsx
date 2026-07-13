import { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { useAuthStore } from '../../store/useAuthStore';
import { HiCurrencyRupee, HiDownload, HiTrendingUp, HiBadgeCheck } from 'react-icons/hi';
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
  const subscribedWorkers = workers.filter(w => w.subscription?.active);
  const [period, setPeriod] = useState('monthly');

  const completed = orders.filter(o => o.status === 'completed');
  const totalBookingRevenue = completed.reduce((s, o) => s + (o.booking?.total || 0), 0);
  const pendingRevenue = orders.filter(o => o.status === 'pending').reduce((s, o) => s + (o.booking?.total || 0), 0);
  const gstOnBookings = Math.round(totalBookingRevenue * 0.18);

  // Subscription Revenue — primary metric
  const subscriptionRevenue = workers.reduce((sum, w) => {
    if (!w.subscription?.active) return sum;
    const plan = subscriptionPlans.find(p => p.name === w.subscription?.plan);
    if (plan) return sum + (parseFloat(plan.price) || 0);
    const fallbackPrice = w.subscription.plan?.match(/₹\s*(\d+)/)?.[1];
    return sum + (parseFloat(fallbackPrice || 0));
  }, 0);
  const gstOnSubscriptions = Math.round(subscriptionRevenue * 0.18);
  const netPlatformRevenue = subscriptionRevenue + totalBookingRevenue - gstOnBookings;

  // Monthly breakdown
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

  return (
    <div className="admin-page" style={{ paddingBottom: '32px' }}>
      <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Revenue Management</h1>
          <p>Subscription income, booking sales, GST audit trail — all in one view</p>
        </div>
        <button
          onClick={() => alert('Exporting detailed revenue report... Check downloads folder.')}
          style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <HiDownload /> Export Report
        </button>
      </div>

      {/* ═══ SUBSCRIPTION REVENUE — HERO SECTION ═══ */}
      <div style={{ background: 'linear-gradient(135deg, #6d28d9 0%, #4f46e5 50%, #2563eb 100%)', borderRadius: '20px', padding: '28px', marginBottom: '28px', color: '#fff', boxShadow: '0 8px 32px rgba(109,40,217,0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.75, marginBottom: '6px' }}>
              📋 PRIMARY REVENUE SOURCE
            </div>
            <div style={{ fontSize: '42px', fontWeight: '900', lineHeight: 1 }}>
              ₹{subscriptionRevenue.toLocaleString()}
            </div>
            <div style={{ fontSize: '14px', marginTop: '8px', opacity: 0.85 }}>
              Total Subscription Revenue ({subscribedWorkers.length} active subscribers)
            </div>
            <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.7 }}>
              GST (18%): ₹{gstOnSubscriptions.toLocaleString()} | Net: ₹{(subscriptionRevenue - gstOnSubscriptions).toLocaleString()}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '12px', padding: '16px 20px' }}>
              <div style={{ fontSize: '11px', opacity: 0.8, marginBottom: '4px' }}>Net Platform Revenue</div>
              <div style={{ fontSize: '24px', fontWeight: '800' }}>₹{netPlatformRevenue.toLocaleString()}</div>
              <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '2px' }}>Bookings + Subscriptions - GST</div>
            </div>
          </div>
        </div>

        {/* Subscription plan breakdown inside hero */}
        {subscriptionPlans.length > 0 && (
          <div style={{ display: 'flex', gap: '12px', marginTop: '20px', flexWrap: 'wrap' }}>
            {subscriptionPlans.map(plan => {
              const count = workers.filter(w => w.subscription?.active && w.subscription?.plan === plan.name).length;
              const price = parseFloat(plan.price) || 0;
              return (
                <div key={plan.id || plan.name} style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '10px', padding: '10px 16px', flex: 1, minWidth: '140px' }}>
                  <div style={{ fontSize: '11px', opacity: 0.8 }}>{plan.name}</div>
                  <div style={{ fontSize: '18px', fontWeight: '800' }}>₹{(count * price).toLocaleString()}</div>
                  <div style={{ fontSize: '10px', opacity: 0.65 }}>{count} subscribers × ₹{price}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══ SUBSCRIBED WORKERS TABLE ═══ */}
      <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', marginBottom: '24px', border: '1px solid #ede9fe' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px', color: '#6d28d9', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '2px solid #ede9fe', paddingBottom: '12px' }}>
          <HiBadgeCheck /> Active Subscribed Professionals ({subscribedWorkers.length})
        </h2>
        {subscribedWorkers.length === 0 ? (
          <p style={{ color: '#aaa', fontStyle: 'italic', fontSize: '13px', margin: 0, textAlign: 'center', padding: '20px 0' }}>No operators currently subscribed to any plan.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f5f3ff', borderBottom: '2px solid #ede9fe' }}>
                  <th style={{ padding: '12px', color: '#6d28d9', fontWeight: '700' }}>#</th>
                  <th style={{ padding: '12px', color: '#6d28d9', fontWeight: '700' }}>Operator Name</th>
                  <th style={{ padding: '12px', color: '#6d28d9', fontWeight: '700' }}>Work Class</th>
                  <th style={{ padding: '12px', color: '#6d28d9', fontWeight: '700' }}>Active Plan</th>
                  <th style={{ padding: '12px', color: '#6d28d9', fontWeight: '700' }}>Plan Value</th>
                  <th style={{ padding: '12px', color: '#6d28d9', fontWeight: '700' }}>KYC</th>
                  <th style={{ padding: '12px', color: '#6d28d9', fontWeight: '700' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {subscribedWorkers.map((w, idx) => {
                  const plan = subscriptionPlans.find(p => p.name === w.subscription?.plan);
                  const planPrice = plan ? parseFloat(plan.price) || 0 : 0;
                  return (
                    <tr key={w.id} style={{ borderBottom: '1px solid #f3f4f6', transition: 'background 0.15s' }}>
                      <td style={{ padding: '12px', color: '#94a3b8', fontSize: '11px' }}>{idx + 1}</td>
                      <td style={{ padding: '12px', fontWeight: '700', color: '#1e293b' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#ede9fe', color: '#6d28d9', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>
                            {w.name.charAt(0)}
                          </div>
                          {w.name}
                        </div>
                      </td>
                      <td style={{ padding: '12px', color: '#64748b' }}>{w.vehicle || 'General'}</td>
                      <td style={{ padding: '12px', fontWeight: '700', color: '#6d28d9' }}>
                        <span style={{ background: '#f5f3ff', padding: '3px 8px', borderRadius: '6px', fontSize: '11px' }}>{w.subscription.plan}</span>
                      </td>
                      <td style={{ padding: '12px', fontWeight: '700', color: '#10b981' }}>₹{planPrice.toLocaleString()}</td>
                      <td style={{ padding: '12px' }}>{w.aadhaar ? <span style={{ color: '#10b981', fontWeight: '700' }}>✅ Done</span> : <span style={{ color: '#f59e0b', fontWeight: '700' }}>⚠️ Pending</span>}</td>
                      <td style={{ padding: '12px' }}><span style={{ background: '#ecfdf5', color: '#065f46', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>ACTIVE</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═══ BOOKING REVENUE SUMMARY ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: 'Total Booking Sales', val: `₹${totalBookingRevenue.toLocaleString()}`, color: '#10b981', icon: '💰' },
          { label: 'GST on Bookings (18%)', val: `₹${gstOnBookings.toLocaleString()}`, color: '#f59e0b', icon: '🧾' },
          { label: 'Pending Sales Pool', val: `₹${pendingRevenue.toLocaleString()}`, color: '#f97316', icon: '⏳' },
          { label: 'Cancelled Revenue Lost', val: `₹${orders.filter(o => o.status === 'cancelled').reduce((s, o) => s + (o.booking?.total || 0), 0).toLocaleString()}`, color: '#ef4444', icon: '❌' },
        ].map(({ label, val, color, icon }) => (
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

      {/* ═══ MONTHLY CHART + CATEGORY BREAKDOWN ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', border: '1px solid #eee' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '800', margin: 0 }}>Monthly Booking Revenue</h2>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['monthly', 'weekly'].map(p => (
                <button key={p} onClick={() => setPeriod(p)} style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', background: period === p ? 'var(--primary)' : '#f1f5f9', color: period === p ? '#fff' : '#64748b', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>{p === 'monthly' ? 'Monthly' : 'Weekly'}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', height: '120px', paddingBottom: '4px' }}>
            {monthlyData.map(({ month, revenue }) => (
              <div key={month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '100%', background: revenue > 0 ? 'var(--primary)' : '#eee', borderRadius: '4px 4px 0 0', height: `${Math.max((revenue / maxRevenue) * 100, 3)}px`, transition: 'height 0.3s ease' }} title={`₹${revenue.toLocaleString()}`} />
                <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: '600' }}>{month}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: '#fff', padding: '20px', borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', border: '1px solid #eee' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '14px' }}>Revenue by Service Category</h2>
          {topCategories.length === 0 ? (
            <p style={{ color: '#aaa', fontStyle: 'italic', fontSize: '13px' }}>No revenue data yet. Complete orders to see category breakdown.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {topCategories.map(([cat, rev]) => (
                <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '8px 12px', background: '#fafafa', borderRadius: '6px', alignItems: 'center' }}>
                  <span style={{ color: '#444', fontWeight: '600' }}>{cat}</span>
                  <strong style={{ color: 'var(--primary)' }}>₹{rev.toLocaleString()}</strong>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
