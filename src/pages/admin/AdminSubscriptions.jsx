import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { useAuthStore } from '../../store/useAuthStore';
import { HiCurrencyRupee, HiPlus, HiPencil, HiTrash, HiTag, HiCheckCircle } from 'react-icons/hi';
import './Admin.css';

const DEFAULT_PLANS = {
  worker: [
    { id: 'w1', name: '₹99 Monthly', price: 99, duration: 1, features: ['Dispatch Requests', 'Public Profile', 'Accept Bookings'], active: true },
    { id: 'w2', name: 'Premium 6-Month', price: 299, duration: 6, features: ['2x Visibility Boost', '6 Months Access', 'Priority Dispatch'], active: true },
    { id: 'w3', name: 'Featured 1-Year', price: 499, duration: 12, features: ['Top Listing Badge', '1 Year Access', 'Verified Seal'], active: true },
  ],
  customer: [
    { id: 'c1', name: 'Basic Membership', price: 0, duration: 0, features: ['Standard Bookings', 'Order Tracking', 'Customer Support'], active: true },
    { id: 'c2', name: 'Premium Customer', price: 149, duration: 3, features: ['Priority Dispatch', 'Discounted Rates', 'Dedicated Support'], active: true },
  ],
};

const COUPONS_INIT = [
  { id: 'cp1', code: 'FIRST50', discount: 50, type: '%', minOrder: 200, uses: 12, active: true },
  { id: 'cp2', code: 'SAVE100', discount: 100, type: '₹', minOrder: 500, uses: 4, active: true },
];

export default function AdminSubscriptions() {
  const orders = useStore(s => s.orders);
  const users = useAuthStore(s => s.users);
  const workers = users.filter(u => u.role === 'worker');

  const [tab, setTab] = useState('plans');
  const [plans, setPlans] = useState(DEFAULT_PLANS);
  const [coupons, setCoupons] = useState(COUPONS_INIT);
  const [editingPlan, setEditingPlan] = useState(null);
  const [newCoupon, setNewCoupon] = useState({ code: '', discount: '', type: '%', minOrder: '' });
  const [successMsg, setSuccessMsg] = useState('');

  const showSuccess = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3000); };

  const activeWorkerPlans = workers.filter(w => w.subscription?.active).length;
  const totalSubRevenue = workers.reduce((sum, w) => {
    const plan = [...DEFAULT_PLANS.worker].find(p => p.name === w.subscription?.plan);
    return sum + (plan?.price || 0);
  }, 0);

  const handleSavePlan = (e) => {
    e.preventDefault();
    if (!editingPlan) return;
    setPlans(prev => ({
      ...prev,
      [editingPlan.type]: prev[editingPlan.type].map(p =>
        p.id === editingPlan.id ? { ...editingPlan } : p
      )
    }));
    setEditingPlan(null);
    showSuccess('Subscription plan updated successfully!');
  };

  const handleTogglePlan = (type, planId) => {
    setPlans(prev => ({
      ...prev,
      [type]: prev[type].map(p => p.id === planId ? { ...p, active: !p.active } : p)
    }));
  };

  const handleAddCoupon = (e) => {
    e.preventDefault();
    if (!newCoupon.code || !newCoupon.discount) return;
    setCoupons(prev => [...prev, {
      id: `cp${Date.now()}`,
      code: newCoupon.code.toUpperCase(),
      discount: Number(newCoupon.discount),
      type: newCoupon.type,
      minOrder: Number(newCoupon.minOrder) || 0,
      uses: 0,
      active: true
    }]);
    setNewCoupon({ code: '', discount: '', type: '%', minOrder: '' });
    showSuccess('Promotional coupon created!');
  };

  const handleToggleCoupon = (cpId) => {
    setCoupons(prev => prev.map(cp => cp.id === cpId ? { ...cp, active: !cp.active } : cp));
  };

  const handleDeleteCoupon = (cpId) => {
    setCoupons(prev => prev.filter(cp => cp.id !== cpId));
  };

  return (
    <div className="admin-page" style={{ paddingBottom: '32px' }}>
      <div className="admin-header">
        <div>
          <h1>Subscription Management</h1>
          <p>Create and manage worker/customer plans, pricing, discounts, and promotional coupons</p>
        </div>
      </div>

      {successMsg && (
        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600' }}>
          <HiCheckCircle style={{ width: '18px', height: '18px' }} /> {successMsg}
        </div>
      )}

      {/* Subscription Revenue Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: 'Active Worker Plans', val: activeWorkerPlans, color: '#8b5cf6', sub: `of ${workers.length} workers` },
          { label: 'Subscription Revenue', val: `₹${totalSubRevenue.toLocaleString()}`, color: '#10b981', sub: 'all-time estimate' },
          { label: 'Active Coupons', val: coupons.filter(c => c.active).length, color: '#f59e0b', sub: 'promotional codes' },
        ].map(({ label, val, color, sub }) => (
          <div key={label} style={{ background: '#fff', padding: '20px', borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', border: '1px solid #eee' }}>
            <div style={{ fontSize: '22px', fontWeight: '800', color }}>{val}</div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#333', marginTop: '4px' }}>{label}</div>
            <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="filter-tabs" style={{ marginBottom: '24px' }}>
        {['plans', 'coupons'].map(t => (
          <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
            {t === 'plans' ? '📋 Subscription Plans' : '🎟️ Coupons & Discounts'}
          </button>
        ))}
      </div>

      {tab === 'plans' && (
        <>
          {['worker', 'customer'].map(planType => (
            <div key={planType} style={{ background: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: '800', marginBottom: '16px', textTransform: 'capitalize' }}>
                {planType === 'worker' ? '👷 Worker Subscription Plans' : '👤 Customer Membership Plans'}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {plans[planType].map(plan => (
                  <div key={plan.id} style={{ border: '1.5px solid', borderColor: plan.active ? '#e0e7ff' : '#eee', background: plan.active ? '#f8faff' : '#fafafa', padding: '16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <strong style={{ fontSize: '15px', color: '#1a1a1a' }}>{plan.name}</strong>
                      <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--primary)', margin: '4px 0 6px' }}>
                        ₹{plan.price} <span style={{ fontSize: '13px', fontWeight: '400', color: '#888' }}>/ {plan.duration === 0 ? 'free' : plan.duration === 1 ? 'month' : `${plan.duration} months`}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {plan.features.map(f => (
                          <span key={f} style={{ fontSize: '11px', background: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: '10px', fontWeight: '600' }}>✔ {f}</span>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', background: plan.active ? '#dcfce7' : '#f3f4f6', color: plan.active ? '#15803d' : '#9ca3af', padding: '2px 10px', borderRadius: '10px', fontWeight: '700' }}>
                        {plan.active ? 'Active' : 'Disabled'}
                      </span>
                      <button
                        onClick={() => setEditingPlan({ ...plan, type: planType })}
                        style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                      >
                        <HiPencil style={{ verticalAlign: 'middle' }} /> Edit
                      </button>
                      <button
                        onClick={() => handleTogglePlan(planType, plan.id)}
                        style={{ background: plan.active ? '#fee2e2' : '#dcfce7', color: plan.active ? '#dc2626' : '#15803d', border: '1px solid', borderColor: plan.active ? '#fca5a5' : '#bbf7d0', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                      >
                        {plan.active ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      {tab === 'coupons' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Add new coupon form */}
          <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '14px' }}>
              <HiPlus style={{ verticalAlign: 'middle', marginRight: '6px', color: 'var(--primary)' }} /> Create New Coupon
            </h2>
            <form onSubmit={handleAddCoupon} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: '700' }}>
                Coupon Code
                <input value={newCoupon.code} onChange={e => setNewCoupon(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="e.g. SAVE50" required style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px' }} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: '700' }}>
                Discount Value
                <input type="number" value={newCoupon.discount} onChange={e => setNewCoupon(p => ({ ...p, discount: e.target.value }))} placeholder="50" required min="1" style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px' }} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: '700' }}>
                Discount Type
                <select value={newCoupon.type} onChange={e => setNewCoupon(p => ({ ...p, type: e.target.value }))} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px' }}>
                  <option value="%">% Percentage</option>
                  <option value="₹">₹ Fixed Amount</option>
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: '700' }}>
                Min. Order Value
                <input type="number" value={newCoupon.minOrder} onChange={e => setNewCoupon(p => ({ ...p, minOrder: e.target.value }))} placeholder="₹200" min="0" style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px' }} />
              </label>
              <button type="submit" style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '9px 16px', borderRadius: '6px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', height: 'fit-content' }}>
                Create
              </button>
            </form>
          </div>

          {/* Coupons list */}
          <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '14px' }}>
              <HiTag style={{ verticalAlign: 'middle', marginRight: '6px', color: '#f59e0b' }} /> All Coupons ({coupons.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {coupons.map(cp => (
                <div key={cp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', border: '1.5px solid', borderColor: cp.active ? '#fde68a' : '#eee', background: cp.active ? '#fffbeb' : '#fafafa', borderRadius: '10px', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: '800', fontSize: '16px', color: '#d97706', letterSpacing: '1px' }}>{cp.code}</span>
                    <span style={{ fontSize: '13px', color: '#333' }}>
                      {cp.discount}{cp.type} off {cp.minOrder > 0 ? `(min. ₹${cp.minOrder})` : ''}
                    </span>
                    <span style={{ fontSize: '11px', color: '#888' }}>{cp.uses} uses</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', background: cp.active ? '#dcfce7' : '#f3f4f6', color: cp.active ? '#15803d' : '#9ca3af', padding: '2px 8px', borderRadius: '10px', fontWeight: '700' }}>
                      {cp.active ? 'Active' : 'Disabled'}
                    </span>
                    <button onClick={() => handleToggleCoupon(cp.id)} style={{ background: cp.active ? '#fee2e2' : '#dcfce7', color: cp.active ? '#dc2626' : '#15803d', border: '1px solid', borderColor: cp.active ? '#fca5a5' : '#bbf7d0', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>
                      {cp.active ? 'Disable' : 'Enable'}
                    </button>
                    <button onClick={() => handleDeleteCoupon(cp.id)} style={{ background: 'none', border: '1px solid #fca5a5', color: '#ef4444', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>
                      <HiTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit Plan Modal */}
      {editingPlan && (
        <div className="modal-overlay" onClick={() => setEditingPlan(null)}>
          <div className="confirm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', width: '100%' }}>
            <h3>Edit Plan: {editingPlan.name}</h3>
            <form onSubmit={handleSavePlan} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px', textAlign: 'left' }}>
              <label style={{ fontSize: '12px', fontWeight: '700' }}>Plan Name
                <input value={editingPlan.name} onChange={e => setEditingPlan(p => ({ ...p, name: e.target.value }))} style={{ display: 'block', width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px', marginTop: '4px', boxSizing: 'border-box' }} required />
              </label>
              <label style={{ fontSize: '12px', fontWeight: '700' }}>Price (₹)
                <input type="number" value={editingPlan.price} onChange={e => setEditingPlan(p => ({ ...p, price: Number(e.target.value) }))} style={{ display: 'block', width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px', marginTop: '4px', boxSizing: 'border-box' }} required />
              </label>
              <label style={{ fontSize: '12px', fontWeight: '700' }}>Duration (months, 0 = free)
                <input type="number" value={editingPlan.duration} onChange={e => setEditingPlan(p => ({ ...p, duration: Number(e.target.value) }))} style={{ display: 'block', width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px', marginTop: '4px', boxSizing: 'border-box' }} required />
              </label>
              <div className="cm-actions" style={{ marginTop: '10px' }}>
                <button type="button" className="cm-cancel" onClick={() => setEditingPlan(null)}>Cancel</button>
                <button type="submit" className="cm-confirm">Save Plan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
