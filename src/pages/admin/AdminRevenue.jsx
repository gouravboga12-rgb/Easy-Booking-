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
  const subscribedUsers = users.filter(u => u.subscription?.active);
  const [period, setPeriod] = useState('monthly');
  const [revenuePeriod, setRevenuePeriod] = useState('all'); // 'today', 'week', 'month', 'year', 'all'

  const now = new Date();
  let startDate = null;
  if (revenuePeriod === 'today') {
    startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  } else if (revenuePeriod === 'week') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (revenuePeriod === 'month') {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else if (revenuePeriod === 'year') {
    startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  }

  // Filter subscription workers based on period (for display table)
  const filteredSubscribedWorkers = subscribedWorkers.filter(w => {
    if (!startDate) return true;
    const dateStr = w.subscription?.purchasedAt || w.created_at || w.createdAt;
    if (!dateStr) return true;
    const purchaseDate = new Date(dateStr);
    return purchaseDate >= startDate;
  });

  // Filter subscription users based on period (for revenue metrics)
  const filteredSubscribedUsers = subscribedUsers.filter(u => {
    if (!startDate) return true;
    const dateStr = u.subscription?.purchasedAt || u.created_at || u.createdAt;
    if (!dateStr) return true;
    const purchaseDate = new Date(dateStr);
    return purchaseDate >= startDate;
  });

  // Filter orders based on period
  const filteredOrders = orders.filter(o => {
    if (!startDate) return true;
    const dateStr = o.createdAt || o.booking?.date;
    if (!dateStr) return true;
    const orderDate = new Date(dateStr);
    return orderDate >= startDate;
  });

  const completed = filteredOrders.filter(o => o.status === 'completed');
  const totalBookingRevenue = completed.reduce((s, o) => s + (o.booking?.total || 0), 0);
  const pendingRevenue = filteredOrders.filter(o => o.status === 'pending').reduce((s, o) => s + (o.booking?.total || 0), 0);
  const gstOnBookings = Math.round(totalBookingRevenue * 0.18);

  // Collect all unique plan names from both subscriptionPlans (DB) and active subscribers
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
  filteredSubscribedUsers.forEach(u => {
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
    const subscribers = filteredSubscribedUsers.filter(u => u.subscription?.active && u.subscription?.plan === plan.name);
    const count = subscribers.length;
    
    // Sum the actual prices paid by the users, falling back to plan.price
    const revenue = subscribers.reduce((sum, u) => {
      if (u.subscription.price !== undefined) return sum + (parseFloat(u.subscription.price) || 0);
      return sum + plan.price;
    }, 0);

    return {
      ...plan,
      count,
      revenue
    };
  }).filter(plan => {
    // Keep plan if it's in the database OR has active subscribers
    return plan.isDbPlan || plan.count > 0;
  });

  // Subscription Revenue — primary metric (total of all plan revenues)
  const subscriptionRevenue = displayPlans.reduce((sum, p) => sum + p.revenue, 0);
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
      <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <h1>Revenue Management</h1>
          <p>Subscription income, booking sales, GST audit trail — all in one view</p>
        </div>
      </div>

      {/* Date Filter Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '12px 20px', borderRadius: '12px', marginBottom: '24px', border: '1px solid #ede9fe', flexWrap: 'wrap', gap: '12px' }}>
        <span style={{ color: '#6d28d9', fontWeight: '800', fontSize: '13px' }}>📅 Filter Revenue by Date Range:</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: 'all', label: 'All Time' },
            { id: 'today', label: 'Today (24h)' },
            { id: 'week', label: 'Weekly (7d)' },
            { id: 'month', label: 'Monthly (30d)' },
            { id: 'year', label: 'Yearly (365d)' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setRevenuePeriod(f.id)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                background: revenuePeriod === f.id ? 'var(--primary)' : '#f1f5f9',
                color: revenuePeriod === f.id ? '#fff' : '#475569',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
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
              Total Subscription Revenue ({filteredSubscribedUsers.length} active subscribers)
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
        {displayPlans.length > 0 && (
          <div style={{ display: 'flex', gap: '12px', marginTop: '20px', flexWrap: 'wrap' }}>
            {displayPlans.map(plan => {
              return (
                <div key={plan.name} style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '10px', padding: '10px 16px', flex: 1, minWidth: '140px' }}>
                  <div style={{ fontSize: '11px', opacity: 0.8 }}>{plan.name}</div>
                  <div style={{ fontSize: '18px', fontWeight: '800' }}>₹{plan.revenue.toLocaleString()}</div>
                  <div style={{ fontSize: '10px', opacity: 0.65 }}>{plan.count} subscribers × ₹{plan.price}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══ SUBSCRIBED WORKERS TABLE ═══ */}
      <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', marginBottom: '24px', border: '1px solid #ede9fe' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px', color: '#6d28d9', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '2px solid #ede9fe', paddingBottom: '12px' }}>
          <HiBadgeCheck /> Active Subscribed Professionals ({filteredSubscribedWorkers.length})
        </h2>
        {filteredSubscribedWorkers.length === 0 ? (
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
                {filteredSubscribedWorkers.map((w, idx) => {
                  const plan = subscriptionPlans.find(p => p.name === w.subscription?.plan);
                  let planPrice = 0;
                  if (w.subscription?.price !== undefined) {
                    planPrice = parseFloat(w.subscription.price) || 0;
                  } else if (plan) {
                    planPrice = parseFloat(plan.price) || 0;
                  } else {
                    const fallbackPrice = w.subscription?.plan?.match(/(\d+)/)?.[0];
                    planPrice = parseFloat(fallbackPrice || 0);
                  }
                  const isKycDone = !!(w.aadhar && w.pan && w.phone && w.address && w.aadhar_photo && w.pan_photo);
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
                      <td style={{ padding: '12px' }}>
                        {isKycDone ? (
                          <span style={{ color: '#10b981', fontWeight: '700' }}>✅ Completed</span>
                        ) : (
                          <span style={{ color: '#f59e0b', fontWeight: '700' }}>⚠️ Pending</span>
                        )}
                      </td>
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
