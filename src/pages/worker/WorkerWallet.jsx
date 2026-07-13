import { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { HiCurrencyRupee, HiArrowDown, HiArrowUp, HiClock, HiCheckCircle, HiCalendar } from 'react-icons/hi';
import './Worker.css';

export default function WorkerWallet() {
  const user = useAuthStore(s => s.user);
  const buySubscription = useAuthStore(s => s.buySubscription);
  const addWorkerEarning = useAuthStore(s => s.addWorkerEarning);

  const wallet = user.wallet || { balance: 0, transactions: [] };
  const available = wallet.balance || 0;
  
  const credits = (wallet.transactions || []).filter(t => t.type === 'credit' && t.amount > 0);
  const debits = (wallet.transactions || []).filter(t => t.amount < 0 || t.type === 'debit');

  const totalEarned = credits.reduce((sum, t) => sum + t.amount, 0);
  const totalWithdrawn = Math.abs(debits.reduce((sum, t) => sum + t.amount, 0));

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  const PLANS = [
    { name: '₹99 Monthly', price: 99, duration: 1, desc: 'Receive client matches, active dispatch alerts' },
    { name: 'Premium Plan', price: 299, duration: 6, desc: '6 Months access, 2x booking visibility boost' },
    { name: 'Featured Worker Plan', price: 499, duration: 12, desc: '1 Year access, top search listing, badge verification' }
  ];

  const handleWithdraw = () => {
    if (available <= 0) return;
    addWorkerEarning(user.id, -available, 'Withdrawn to Bank Account');
  };

  const handlePurchaseSubscription = (plan) => {
    // Perform simulated purchase
    buySubscription(user.id, plan.name, plan.duration);
    setPurchaseSuccess(true);
    setSelectedPlan(null);
    setTimeout(() => setPurchaseSuccess(false), 4000);
  };

  return (
    <div className="worker-page" style={{ paddingBottom: '32px' }}>
      <div className="wp-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
        <HiCurrencyRupee className="wp-title-icon" style={{ width: '28px', height: '28px', color: 'var(--primary)' }} />
        <h1 style={{ fontSize: '24px', fontWeight: '800' }}>Payments & Subscription</h1>
      </div>

      {purchaseSuccess && (
        <div className="auth-error" style={{ background: '#ecfdf5', borderColor: '#a7f3d0', color: '#065f46', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HiCheckCircle style={{ width: '20px', height: '20px' }} />
          <span>Subscription activated successfully! Operational features unlocked.</span>
        </div>
      )}

      {/* Balance Cards */}
      <div className="wallet-cards">
        <div className="wallet-card primary" style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', color: '#fff', padding: '24px 16px', borderRadius: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span style={{ fontSize: '12px', opacity: 0.85 }}>Available Balance</span>
          <strong style={{ fontSize: '24px', fontWeight: '800', marginTop: '6px' }}>₹{available.toLocaleString()}</strong>
        </div>
        <div className="wallet-card" style={{ background: '#fff', padding: '16px', borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div className="wc-row" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#888', marginBottom: '4px' }}>
            <HiArrowDown className="wc-icon credit" style={{ color: '#10b981' }} />
            <span>Total Earned</span>
          </div>
          <strong style={{ fontSize: '18px', fontWeight: '800', color: '#1a1a1a' }}>₹{totalEarned.toLocaleString()}</strong>
        </div>
        <div className="wallet-card" style={{ background: '#fff', padding: '16px', borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div className="wc-row" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#888', marginBottom: '4px' }}>
            <HiArrowUp className="wc-icon debit" style={{ color: '#ef4444' }} />
            <span>Withdrawn</span>
          </div>
          <strong style={{ fontSize: '18px', fontWeight: '800', color: '#1a1a1a' }}>₹{totalWithdrawn.toLocaleString()}</strong>
        </div>
      </div>

      {/* Subscription Panel */}
      <div className="worker-section" style={{ background: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '6px' }}>Subscription Package Status</h2>
        <div style={{ background: user.subscription?.active ? '#f0fdf4' : '#fef2f2', border: '1px solid', borderColor: user.subscription?.active ? '#bbf7d0' : '#fecaca', padding: '12px 16px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <strong style={{ color: user.subscription?.active ? '#15803d' : '#b91c1c', fontSize: '14px' }}>
              {user.subscription?.active ? `PLAN ACTIVE: ${user.subscription.plan}` : 'NO ACTIVE SUBSCRIPTION'}
            </strong>
            {user.subscription?.active && (
              <span style={{ display: 'block', fontSize: '11px', color: '#666', marginTop: '2px' }}>
                Expires on: {user.subscription.expiresAt}
              </span>
            )}
          </div>
          <span style={{ fontSize: '20px' }}>{user.subscription?.active ? '✔️' : '❌'}</span>
        </div>

        <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#444', marginBottom: '12px' }}>Choose a Subscription Plan</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {PLANS.map(plan => (
            <div
              key={plan.name}
              onClick={() => setSelectedPlan(plan)}
              style={{
                border: '1.5px solid',
                borderColor: selectedPlan?.name === plan.name ? 'var(--primary)' : '#eee',
                background: selectedPlan?.name === plan.name ? 'var(--primary-light)' : '#fafafa',
                borderRadius: '12px',
                padding: '14px 16px',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.18s'
              }}
            >
              <div style={{ flex: 1, paddingRight: '12px' }}>
                <strong style={{ display: 'block', fontSize: '14px', color: '#1a1a1a' }}>{plan.name}</strong>
                <span style={{ display: 'block', fontSize: '12px', color: '#666', marginTop: '4px', lineHeight: '1.4' }}>
                  {plan.desc}
                </span>
              </div>
              <div style={{ textStyle: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <strong style={{ fontSize: '16px', color: 'var(--primary)' }}>₹{plan.price}</strong>
                <span style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                  {plan.duration} {plan.duration === 1 ? 'Month' : 'Months'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {selectedPlan && (
          <div style={{ marginTop: '20px', background: '#f9fafb', padding: '16px', borderRadius: '12px', border: '1px solid #eee' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', color: '#555' }}>Plan Selected: <strong>{selectedPlan.name}</strong></span>
              <strong style={{ fontSize: '15px', color: '#1a1a1a' }}>Total: ₹{selectedPlan.price}</strong>
            </div>
            <button
              onClick={() => handlePurchaseSubscription(selectedPlan)}
              style={{
                width: '100%',
                background: 'var(--primary)',
                color: '#fff',
                border: 'none',
                padding: '12px',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              🔒 Pay ₹{selectedPlan.price} & Activate Subscription
            </button>
          </div>
        )}
      </div>

      {/* Transactions */}
      <div className="worker-section">
        <h2>Payments History</h2>
        {wallet.transactions?.length === 0 ? (
          <div className="empty-msg">No transactions yet.</div>
        ) : (
          <div className="txn-list">
            {(wallet.transactions || []).map(t => {
              const isCredit = t.amount > 0;
              return (
                <div key={t.id} className="txn-item">
                  <div className={`txn-icon-wrap ${isCredit ? 'credit' : 'debit'}`}>
                    {isCredit ? <HiArrowDown className="txn-icon" /> : <HiArrowUp className="txn-icon" />}
                  </div>
                  <div className="txn-details">
                    <strong>{t.label}</strong>
                    <span><HiClock style={{ width: 11, height: 11, verticalAlign: 'middle' }} /> {t.date}</span>
                  </div>
                  <div className={`txn-amount ${isCredit ? 'credit' : 'debit'}`}>
                    {isCredit ? '+' : ''}₹{t.amount.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
