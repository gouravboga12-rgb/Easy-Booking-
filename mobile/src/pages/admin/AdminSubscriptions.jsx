import { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { useAuthStore } from '../../store/useAuthStore';
import { HiCurrencyRupee, HiPlus, HiPencil, HiTrash, HiTag, HiCheckCircle } from 'react-icons/hi';
import './Admin.css';

const displayDuration = (duration, unit) => {
  if (duration === 0) return 'free';
  const u = (unit || 'month').toLowerCase();
  const label = u === 'day' ? 'day' : u === 'week' ? 'week' : u === 'year' ? 'year' : 'month';
  return duration === 1 ? label : `${duration} ${label}s`;
};

export default function AdminSubscriptions() {
  const users = useAuthStore(s => s.users);
  const workers = users.filter(u => u.role === 'worker');

  const subscriptionPlans = useStore(s => s.subscriptionPlans);
  const fetchSubscriptionPlans = useStore(s => s.fetchSubscriptionPlans);
  const addSubscriptionPlan = useStore(s => s.addSubscriptionPlan);
  const updateSubscriptionPlan = useStore(s => s.updateSubscriptionPlan);
  const deleteSubscriptionPlan = useStore(s => s.deleteSubscriptionPlan);

  const [tab, setTab] = useState('plans');
  const [editingPlan, setEditingPlan] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(true);

  // New Plan form state
  const [newPlan, setNewPlan] = useState({
    name: '',
    price: '',
    duration: '',
    duration_unit: 'month',
    description: '',
    featuresString: '',
    type: 'worker',
    active: true
  });

  // Coupons state (Simulated)
  const [coupons, setCoupons] = useState([
    { id: 'cp1', code: 'FIRST50', discount: 50, type: '%', minOrder: 200, uses: 12, active: true },
    { id: 'cp2', code: 'SAVE100', discount: 100, type: '₹', minOrder: 500, uses: 4, active: true },
  ]);
  const [newCoupon, setNewCoupon] = useState({ code: '', discount: '', type: '%', minOrder: '' });

  useEffect(() => {
    const loadPlans = async () => {
      await fetchSubscriptionPlans();
      setLoading(false);
    };
    loadPlans();
  }, [fetchSubscriptionPlans]);

  const showSuccess = (msg) => { 
    setSuccessMsg(msg); 
    setTimeout(() => setSuccessMsg(''), 3000); 
  };

  const activeWorkerPlansCount = workers.filter(w => w.subscription?.active).length;
  const totalSubRevenue = workers.reduce((sum, w) => {
    const sub = w.subscription;
    if (!sub) return sum;
    if (Array.isArray(sub.history) && sub.history.length > 0) {
      return sum + sub.history.reduce((hSum, entry) => hSum + (parseFloat(entry.price) || 0), 0);
    }
    const plan = subscriptionPlans.find(p => p.name === sub.plan);
    return sum + (sub.price !== undefined ? (parseFloat(sub.price) || 0) : (parseFloat(plan?.price) || 0));
  }, 0);

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    if (!newPlan.name || newPlan.price === undefined || newPlan.duration === undefined) return;

    const featuresList = newPlan.featuresString 
      ? newPlan.featuresString.split(',').map(f => f.trim()).filter(Boolean) 
      : [];

    const res = await addSubscriptionPlan({
      name: newPlan.name,
      price: Number(newPlan.price),
      duration: Number(newPlan.duration),
      duration_unit: newPlan.duration_unit || 'month',
      description: newPlan.description,
      features: featuresList,
      active: newPlan.active ? 1 : 0,
      type: newPlan.type
    });

    if (res && res.success) {
      setNewPlan({
        name: '',
        price: '',
        duration: '',
        duration_unit: 'month',
        description: '',
        featuresString: '',
        type: 'worker',
        active: true
      });
      showSuccess('Subscription plan created successfully!');
    } else {
      alert(res?.error || 'Failed to create plan');
    }
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    if (!editingPlan) return;

    const featuresList = typeof editingPlan.featuresString === 'string'
      ? editingPlan.featuresString.split(',').map(f => f.trim()).filter(Boolean)
      : editingPlan.features;

    const res = await updateSubscriptionPlan(editingPlan.id, {
      name: editingPlan.name,
      price: Number(editingPlan.price),
      duration: Number(editingPlan.duration),
      duration_unit: editingPlan.duration_unit || 'month',
      description: editingPlan.description,
      features: featuresList,
      type: editingPlan.type,
      active: editingPlan.active ? 1 : 0
    });

    if (res && res.success) {
      setEditingPlan(null);
      showSuccess('Subscription plan updated successfully!');
    } else {
      alert(res?.error || 'Failed to update plan');
    }
  };

  const handleTogglePlan = async (plan) => {
    const res = await updateSubscriptionPlan(plan.id, {
      active: plan.active ? 0 : 1
    });
    if (res && res.success) {
      showSuccess(`Subscription plan ${plan.active ? 'disabled' : 'enabled'} successfully!`);
    } else {
      alert(res?.error || 'Failed to toggle status');
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!confirm('Are you sure you want to delete this subscription plan?')) return;
    const res = await deleteSubscriptionPlan(planId);
    if (res && res.success) {
      showSuccess('Subscription plan deleted successfully!');
    } else {
      alert(res?.error || 'Failed to delete plan');
    }
  };

  // Coupons handlers (Simulated)
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

  // Group plans from database
  const workerPlans = subscriptionPlans.filter(p => p.type === 'worker');
  const customerPlans = subscriptionPlans.filter(p => p.type === 'customer');

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
          { label: 'Active Worker Plans', val: activeWorkerPlansCount, color: '#8b5cf6', sub: `of ${workers.length} workers` },
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
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'start' }}>
          {/* Left Column: Manage Plans */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Worker Plans List */}
            <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', border: '1px solid #eee' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px' }}>👷 Worker Subscription Plans</h2>
              {loading ? (
                <div>🔄 Loading...</div>
              ) : workerPlans.length === 0 ? (
                <div style={{ color: '#aaa', fontStyle: 'italic' }}>No worker plans created yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {workerPlans.map(plan => (
                    <div key={plan.id} style={{ border: '1.5px solid', borderColor: plan.active ? '#e0e7ff' : '#eee', background: plan.active ? '#f8faff' : '#fafafa', padding: '16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <strong style={{ fontSize: '15px', color: '#1a1a1a' }}>{plan.name}</strong>
                        <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--primary)', margin: '4px 0' }}>
                          ₹{parseFloat(plan.price).toLocaleString()} <span style={{ fontSize: '12px', fontWeight: '400', color: '#888' }}>/ {displayDuration(plan.duration, plan.duration_unit)}</span>
                        </div>
                        {plan.description && <p style={{ fontSize: '12px', color: '#666', margin: '4px 0' }}>{plan.description}</p>}
                        {plan.features && plan.features.length > 0 && (
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                            {plan.features.map(f => (
                              <span key={f} style={{ fontSize: '10px', background: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: '10px', fontWeight: '600' }}>✔ {f}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', background: plan.active ? '#dcfce7' : '#f3f4f6', color: plan.active ? '#15803d' : '#9ca3af', padding: '2px 10px', borderRadius: '10px', fontWeight: '700' }}>
                          {plan.active ? 'Active' : 'Disabled'}
                        </span>
                        <button
                          onClick={() => setEditingPlan({ ...plan, featuresString: plan.features.join(', ') })}
                          style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '5px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                        >
                          <HiPencil />
                        </button>
                        <button
                          onClick={() => handleTogglePlan(plan)}
                          style={{ background: plan.active ? '#fee2e2' : '#dcfce7', color: plan.active ? '#dc2626' : '#15803d', border: '1px solid', borderColor: plan.active ? '#fca5a5' : '#bbf7d0', padding: '5px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                        >
                          {plan.active ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          onClick={() => handleDeletePlan(plan.id)}
                          style={{ background: 'none', border: '1px solid #fca5a5', color: '#ef4444', padding: '5px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                        >
                          <HiTrash />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Customer Plans List */}
            <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', border: '1px solid #eee' }}>
              <h2 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px' }}>👤 Customer Membership Plans</h2>
              {loading ? (
                <div>🔄 Loading...</div>
              ) : customerPlans.length === 0 ? (
                <div style={{ color: '#aaa', fontStyle: 'italic' }}>No customer plans created yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {customerPlans.map(plan => (
                    <div key={plan.id} style={{ border: '1.5px solid', borderColor: plan.active ? '#e0e7ff' : '#eee', background: plan.active ? '#f8faff' : '#fafafa', padding: '16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <strong style={{ fontSize: '15px', color: '#1a1a1a' }}>{plan.name}</strong>
                        <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--primary)', margin: '4px 0' }}>
                          ₹{parseFloat(plan.price).toLocaleString()} <span style={{ fontSize: '12px', fontWeight: '400', color: '#888' }}>/ {displayDuration(plan.duration, plan.duration_unit)}</span>
                        </div>
                        {plan.description && <p style={{ fontSize: '12px', color: '#666', margin: '4px 0' }}>{plan.description}</p>}
                        {plan.features && plan.features.length > 0 && (
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                            {plan.features.map(f => (
                              <span key={f} style={{ fontSize: '10px', background: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: '10px', fontWeight: '600' }}>✔ {f}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', background: plan.active ? '#dcfce7' : '#f3f4f6', color: plan.active ? '#15803d' : '#9ca3af', padding: '2px 10px', borderRadius: '10px', fontWeight: '700' }}>
                          {plan.active ? 'Active' : 'Disabled'}
                        </span>
                        <button
                          onClick={() => setEditingPlan({ ...plan, featuresString: plan.features.join(', ') })}
                          style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '5px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                        >
                          <HiPencil />
                        </button>
                        <button
                          onClick={() => handleTogglePlan(plan)}
                          style={{ background: plan.active ? '#fee2e2' : '#dcfce7', color: plan.active ? '#dc2626' : '#15803d', border: '1px solid', borderColor: plan.active ? '#fca5a5' : '#bbf7d0', padding: '5px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                        >
                          {plan.active ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          onClick={() => handleDeletePlan(plan.id)}
                          style={{ background: 'none', border: '1px solid #fca5a5', color: '#ef4444', padding: '5px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                        >
                          <HiTrash />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Create Subscription Plan Form */}
          <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', border: '1px solid #eee', position: 'sticky', top: '20px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <HiPlus style={{ color: 'var(--primary)' }} /> Add Subscription Plan
            </h2>
            <form onSubmit={handleCreatePlan} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: '700' }}>
                Plan Name
                <input value={newPlan.name} onChange={e => setNewPlan(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Pro Monthly Plan" required style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px' }} />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: '700' }}>
                  Price (₹)
                  <input type="number" value={newPlan.price} onChange={e => setNewPlan(p => ({ ...p, price: e.target.value }))} placeholder="199" required min="0" style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px' }} />
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '6px' }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: '700' }}>
                    Duration
                    <input type="number" value={newPlan.duration} onChange={e => setNewPlan(p => ({ ...p, duration: e.target.value }))} placeholder="3" required min="0" style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px' }} />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: '700' }}>
                    Unit
                    <select value={newPlan.duration_unit} onChange={e => setNewPlan(p => ({ ...p, duration_unit: e.target.value }))} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px' }}>
                      <option value="day">Day(s)</option>
                      <option value="week">Week(s)</option>
                      <option value="month">Month(s)</option>
                      <option value="year">Year(s)</option>
                    </select>
                  </label>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: '700' }}>
                  Plan Audience
                  <select value={newPlan.type} onChange={e => setNewPlan(p => ({ ...p, type: e.target.value }))} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px' }}>
                    <option value="worker">Worker Package</option>
                    <option value="customer">Customer Membership</option>
                  </select>
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: '700' }}>
                  Status
                  <select value={newPlan.active ? '1' : '0'} onChange={e => setNewPlan(p => ({ ...p, active: e.target.value === '1' }))} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px' }}>
                    <option value="1">Active / Live</option>
                    <option value="0">Disabled</option>
                  </select>
                </label>
              </div>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: '700' }}>
                Brief Description
                <input value={newPlan.description} onChange={e => setNewPlan(p => ({ ...p, description: e.target.value }))} placeholder="Brief summary of the package" style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px' }} />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: '700' }}>
                Key Features (comma-separated list)
                <textarea value={newPlan.featuresString} onChange={e => setNewPlan(p => ({ ...p, featuresString: e.target.value }))} placeholder="Visibility Boost, Priority Support, verified badge" rows="3" style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit' }} />
              </label>

              <button type="submit" style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', marginTop: '4px' }}>
                Save Subscription Plan
              </button>
            </form>
          </div>
        </div>
      )}

      {tab === 'coupons' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Add new coupon form */}
          <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', border: '1px solid #eee' }}>
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
          <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', border: '1px solid #eee' }}>
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700' }}>Duration (0 = free)
                  <input type="number" value={editingPlan.duration} onChange={e => setEditingPlan(p => ({ ...p, duration: Number(e.target.value) }))} style={{ display: 'block', width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px', marginTop: '4px', boxSizing: 'border-box' }} required />
                </label>
                <label style={{ fontSize: '12px', fontWeight: '700' }}>Duration Unit
                  <select value={editingPlan.duration_unit || 'month'} onChange={e => setEditingPlan(p => ({ ...p, duration_unit: e.target.value }))} style={{ display: 'block', width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px', marginTop: '4px', boxSizing: 'border-box' }}>
                    <option value="day">Day(s)</option>
                    <option value="week">Week(s)</option>
                    <option value="month">Month(s)</option>
                    <option value="year">Year(s)</option>
                  </select>
                </label>
              </div>
              <label style={{ fontSize: '12px', fontWeight: '700' }}>Audience Type
                <select value={editingPlan.type} onChange={e => setEditingPlan(p => ({ ...p, type: e.target.value }))} style={{ display: 'block', width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px', marginTop: '4px', boxSizing: 'border-box' }}>
                  <option value="worker">Worker</option>
                  <option value="customer">Customer</option>
                </select>
              </label>
              <label style={{ fontSize: '12px', fontWeight: '700' }}>Brief Description
                <input value={editingPlan.description || ''} onChange={e => setEditingPlan(p => ({ ...p, description: e.target.value }))} style={{ display: 'block', width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px', marginTop: '4px', boxSizing: 'border-box' }} />
              </label>
              <label style={{ fontSize: '12px', fontWeight: '700' }}>Key Features (comma-separated list)
                <textarea value={editingPlan.featuresString || ''} onChange={e => setEditingPlan(p => ({ ...p, featuresString: e.target.value }))} style={{ display: 'block', width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px', marginTop: '4px', boxSizing: 'border-box', fontFamily: 'inherit' }} rows="3" />
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
