import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useStore } from '../../store/useStore';
import { HiLightningBolt, HiCheckCircle, HiCalendar, HiClock } from 'react-icons/hi';
import './Worker.css';

export default function WorkerSubscription() {
  const user = useAuthStore(s => s.user);
  const buySubscription = useAuthStore(s => s.buySubscription);
  const subscriptionPlans = useStore(s => s.subscriptionPlans);
  const fetchSubscriptionPlans = useStore(s => s.fetchSubscriptionPlans);

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showUpgradeNotice, setShowUpgradeNotice] = useState(false);

  useEffect(() => {
    const loadPlans = async () => {
      await fetchSubscriptionPlans();
      setLoading(false);
    };
    loadPlans();
  }, [fetchSubscriptionPlans]);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePurchaseSubscription = async (plan) => {
    await buySubscription(user.id, plan.name, plan.duration, plan.duration_unit || 'month', plan.price);
    setPurchaseSuccess(true);
    setSelectedPlan(null);
    setShowUpgradeNotice(false);
    setTimeout(() => setPurchaseSuccess(false), 4000);
  };

  const handleInitiatePayment = (plan) => {
    const isCurrentlyActive = user.subscription?.active && user.subscription?.expiresAt >= new Date().toISOString().split('T')[0];
    if (isCurrentlyActive) {
      setShowUpgradeNotice(true);
    } else {
      handlePayment(plan);
    }
  };

  const handlePayment = async (plan) => {
    setShowUpgradeNotice(false);
    const isLoaded = await loadRazorpayScript();
    if (!isLoaded) {
      alert("Failed to load Razorpay payment gateway. Please check your internet connection.");
      return;
    }

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_live_TGqkwSNif2EKBo",
      amount: Math.round(parseFloat(plan.price) * 100),
      currency: "INR",
      name: "Parrow Skills",
      description: `Subscription - ${plan.name}`,
      image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=120&q=80",
      handler: function (response) {
        if (response.razorpay_payment_id) {
          handlePurchaseSubscription(plan);
        } else {
          alert("Payment failed or cancelled.");
        }
      },
      prefill: {
        name: user.name,
        email: user.email,
        contact: user.phone || ""
      },
      notes: {
        userId: user.id,
        planName: plan.name
      },
      theme: {
        color: "#6d28d9"
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  // Only display active plans of type 'worker'
  const activeWorkerPlans = subscriptionPlans.filter(p => p.active && p.type === 'worker');

  return (
    <div className="worker-page" style={{ paddingBottom: '32px' }}>
      <div className="wp-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
        <HiLightningBolt className="wp-title-icon" style={{ width: '28px', height: '28px', color: '#eab308' }} />
        <h1 style={{ fontSize: '24px', fontWeight: '800' }}>Subscription Plan</h1>
      </div>

      {purchaseSuccess && (
        <div className="auth-error" style={{ background: '#ecfdf5', borderColor: '#a7f3d0', color: '#065f46', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HiCheckCircle style={{ width: '20px', height: '20px' }} />
          <span>Subscription activated successfully! Operational features unlocked.</span>
        </div>
      )}

      {/* Upgrade Notice Modal */}
      {showUpgradeNotice && selectedPlan && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '20px',
            maxWidth: '460px',
            width: '100%',
            padding: '28px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <span style={{ fontSize: '28px' }}>💡</span>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                Subscription Upgrade Notice
              </h3>
            </div>
            
            <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6', margin: '0 0 16px' }}>
              You are upgrading to a new subscription plan (<strong>{selectedPlan.name}</strong> for <strong>₹{parseFloat(selectedPlan.price).toLocaleString()}</strong>) while your current plan (<strong>{user.subscription?.plan}</strong>, valid until <strong>{user.subscription?.expiresAt}</strong>) is still active.
            </p>
            
            <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', color: '#334155', fontWeight: '600', marginBottom: '20px' }}>
              Thank you for choosing this new plan! Upgrading will activate your new subscription immediately upon payment.
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowUpgradeNotice(false)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  background: '#fff',
                  color: '#475569',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Close / Cancel
              </button>
              <button
                onClick={() => handlePayment(selectedPlan)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'var(--primary)',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(109, 40, 217, 0.25)'
                }}
              >
                Proceed & Upgrade Now →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Package Status */}
      <div className="worker-section" style={{ background: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', marginBottom: '24px', border: '1px solid #eee' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px' }}>Subscription Package Status</h2>
        <div style={{ background: user.subscription?.active ? '#f0fdf4' : '#fef2f2', border: '1px solid', borderColor: user.subscription?.active ? '#bbf7d0' : '#fecaca', padding: '16px 20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <strong style={{ color: user.subscription?.active ? '#15803d' : '#b91c1c', fontSize: '15px', display: 'block' }}>
              {user.subscription?.active ? `PLAN ACTIVE: ${user.subscription.plan}` : 'NO ACTIVE SUBSCRIPTION'}
            </strong>
            {user.subscription?.active ? (
              <span style={{ display: 'block', fontSize: '12px', color: '#475569', marginTop: '4px' }}>
                📅 Expires on: <strong>{user.subscription.expiresAt}</strong>
              </span>
            ) : (
              <span style={{ display: 'block', fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Activate a plan below to display your profile publicly and unlock active dispatch requests.
              </span>
            )}
          </div>
          <span style={{ fontSize: '24px' }}>{user.subscription?.active ? '✔️' : '❌'}</span>
        </div>
      </div>

      {/* Choose a Subscription Plan */}
      <div className="worker-section" style={{ background: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', border: '1px solid #eee' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Choose a Subscription Plan</h2>
        
        {loading ? (
          <div style={{ padding: '40px 0', textStyle: 'center', color: '#64748b' }}>
            🔄 Loading plans...
          </div>
        ) : activeWorkerPlans.length === 0 ? (
          <div style={{ padding: '40px 0', textStyle: 'center', color: '#94a3b8' }}>
            No worker subscription packages are currently available.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {activeWorkerPlans.map(plan => (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan)}
                style={{
                  border: '2px solid',
                  borderColor: selectedPlan?.id === plan.id ? 'var(--primary)' : '#f1f5f9',
                  background: selectedPlan?.id === plan.id ? 'var(--primary-light)' : '#f8fafc',
                  borderRadius: '14px',
                  padding: '16px 20px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.18s'
                }}
              >
                <div style={{ flex: 1, paddingRight: '12px' }}>
                  <strong style={{ display: 'block', fontSize: '15px', color: '#0f172a' }}>{plan.name}</strong>
                  {plan.description && (
                    <span style={{ display: 'block', fontSize: '12px', color: '#64748b', marginTop: '4px', lineHeight: '1.4' }}>
                      {plan.description}
                    </span>
                  )}
                  {plan.features && plan.features.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                      {plan.features.map(f => (
                        <span key={f} style={{ fontSize: '11px', background: '#e0f2fe', color: '#0369a1', padding: '1px 8px', borderRadius: '8px', fontWeight: '600' }}>
                          ✔ {f}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
                  <strong style={{ fontSize: '18px', color: 'var(--primary)', fontWeight: '800' }}>₹{parseFloat(plan.price).toLocaleString()}</strong>
                  <span style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                    {plan.duration_unit ? (
                      `${plan.duration} ${plan.duration_unit.toLowerCase()}${plan.duration === 1 ? '' : 's'}`
                    ) : (
                      `${plan.duration} ${plan.duration === 1 ? 'Month' : 'Months'}`
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedPlan && (
          <div style={{ marginTop: '20px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', color: '#334155' }}>Plan Selected: <strong>{selectedPlan.name}</strong></span>
              <strong style={{ fontSize: '16px', color: '#0f172a' }}>Total: ₹{parseFloat(selectedPlan.price).toLocaleString()}</strong>
            </div>
            <button
              onClick={() => handleInitiatePayment(selectedPlan)}
              style={{
                width: '100%',
                background: 'var(--primary)',
                color: '#fff',
                border: 'none',
                padding: '12px',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'background 0.18s'
              }}
            >
              🔒 Pay ₹{parseFloat(selectedPlan.price).toLocaleString()} & Activate Subscription
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
