import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { useAuthStore } from '../../store/useAuthStore';
import { HiCurrencyRupee, HiCalendar, HiChartBar, HiTrendingUp, HiDownload } from 'react-icons/hi';
import './Admin.css';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function AdminRevenue() {
  const orders = useStore(s => s.orders);
  const getWorkers = useAuthStore(s => s.getWorkers);
  const workers = getWorkers();

  const [period, setPeriod] = useState('monthly');

  const completed = orders.filter(o => o.status === 'completed');
  const totalRevenue = completed.reduce((s, o) => s + (o.booking?.total || 0), 0);
  const pendingRevenue = orders.filter(o => o.status === 'pending').reduce((s, o) => s + (o.booking?.total || 0), 0);
  const cancelled = orders.filter(o => o.status === 'cancelled');
  const gstRevenue = Math.round(totalRevenue * 0.18);
  const netRevenue = totalRevenue - gstRevenue;

  // Subscription Revenue estimate
  const PLAN_PRICES = { '₹99 Monthly': 99, 'Premium Plan': 299, 'Featured Worker Plan': 499 };
  const subscriptionRevenue = workers.reduce((s, w) => s + (PLAN_PRICES[w.subscription?.plan] || 0), 0);

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

  const SUMMARY_CARDS = [
    { label: 'Total Booking Revenue', val: `₹${totalRevenue.toLocaleString()}`, color: '#10b981', icon: '💰' },
    { label: 'Subscription Revenue', val: `₹${subscriptionRevenue.toLocaleString()}`, color: '#8b5cf6', icon: '📋' },
    { label: 'GST Collected (18%)', val: `₹${gstRevenue.toLocaleString()}`, color: '#f59e0b', icon: '🧾' },
    { label: 'Net Revenue', val: `₹${netRevenue.toLocaleString()}`, color: '#3b82f6', icon: '📈' },
    { label: 'Pending Revenue', val: `₹${pendingRevenue.toLocaleString()}`, color: '#f97316', icon: '⏳' },
    { label: 'Lost (Cancelled)', val: `₹${cancelled.reduce((s, o) => s + (o.booking?.total || 0), 0).toLocaleString()}`, color: '#ef4444', icon: '❌' },
  ];

  return (
    <div className="admin-page" style={{ paddingBottom: '32px' }}>
      <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Revenue Management</h1>
          <p>Monitor subscription revenue, booking sales, monthly/yearly reports, and GST summaries</p>
        </div>
        <button
          onClick={() => alert('Export feature: In production this would generate a CSV/PDF revenue report')}
          style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <HiDownload /> Export Report
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
        {SUMMARY_CARDS.map(({ label, val, color, icon }) => (
          <div key={label} style={{ background: '#fff', padding: '20px', borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', border: `1.5px solid ${color}22` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '22px', fontWeight: '800', color }}>{val}</div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>{label}</div>
              </div>
              <span style={{ fontSize: '24px' }}>{icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Monthly Revenue Chart */}
      <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '800', margin: 0 }}>Monthly Revenue Chart (Current Year)</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['monthly', 'quarterly'].map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{ padding: '4px 12px', borderRadius: '20px', border: '1px solid #ddd', background: period === p ? 'var(--primary)' : '#fff', color: period === p ? '#fff' : '#666', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '160px', paddingBottom: '28px', borderBottom: '1px solid #f0f0f0', position: 'relative' }}>
          {(period === 'monthly' ? monthlyData : [
            { month: 'Q1', revenue: monthlyData.slice(0, 3).reduce((s, d) => s + d.revenue, 0) },
            { month: 'Q2', revenue: monthlyData.slice(3, 6).reduce((s, d) => s + d.revenue, 0) },
            { month: 'Q3', revenue: monthlyData.slice(6, 9).reduce((s, d) => s + d.revenue, 0) },
            { month: 'Q4', revenue: monthlyData.slice(9, 12).reduce((s, d) => s + d.revenue, 0) },
          ]).map((d, i) => {
            const h = maxRevenue > 0 ? Math.max((d.revenue / maxRevenue) * 120, d.revenue > 0 ? 8 : 4) : 4;
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                {d.revenue > 0 && (
                  <span style={{ fontSize: '9px', color: '#888', whiteSpace: 'nowrap' }}>₹{d.revenue > 999 ? `${(d.revenue / 1000).toFixed(1)}k` : d.revenue}</span>
                )}
                <div style={{ width: '100%', height: `${h}px`, background: d.revenue > 0 ? 'var(--primary)' : '#f3f4f6', borderRadius: '4px 4px 0 0', transition: 'height 0.3s' }} />
                <span style={{ position: 'absolute', bottom: '6px', fontSize: '10px', color: '#888' }}>{d.month}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Revenue Breakdown Tables */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Category Revenue */}
        <div style={{ background: '#fff', padding: '20px', borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
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
        <div style={{ background: '#fff', padding: '20px', borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '14px' }}>Subscription Revenue by Plan</h2>
          {[
            { name: '₹99 Monthly', price: 99 },
            { name: 'Premium Plan', price: 299 },
            { name: 'Featured Worker Plan', price: 499 },
          ].map(plan => {
            const count = workers.filter(w => w.subscription?.plan === plan.name).length;
            return (
              <div key={plan.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '8px', background: '#fafafa', borderRadius: '6px', marginBottom: '8px' }}>
                <div>
                  <span style={{ fontWeight: '600', color: '#444' }}>{plan.name}</span>
                  <span style={{ fontSize: '11px', color: '#888', marginLeft: '8px' }}>{count} subscribers</span>
                </div>
                <strong style={{ color: '#8b5cf6' }}>₹{(count * plan.price).toLocaleString()}</strong>
              </div>
            );
          })}

          <div style={{ marginTop: '12px', padding: '10px', background: '#eff6ff', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: '700', color: '#2563eb', fontSize: '13px' }}>GST on Subscriptions (18%)</span>
            <strong style={{ color: '#2563eb' }}>₹{Math.round(subscriptionRevenue * 0.18).toLocaleString()}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
