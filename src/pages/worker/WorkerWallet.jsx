import { useAuthStore } from '../../store/useAuthStore';
import { useStore } from '../../store/useStore';
import { HiCurrencyRupee, HiArrowDown, HiArrowUp, HiClock } from 'react-icons/hi';

export default function WorkerWallet() {
  const user = useAuthStore(s => s.user);
  const orders = useStore(s => s.orders);

  const completed = orders.filter(o => o.operator?.id === user.id && o.status === 'completed');
  const totalEarned = completed.reduce((s, o) => s + (o.booking?.total || 0), 0);
  const withdrawn = Math.floor(totalEarned * 0.6);
  const available = totalEarned - withdrawn;

  const transactions = completed.map(o => ({
    id: o.id,
    label: o.vehicle?.name,
    date: o.booking?.date || o.placedAt,
    amount: o.booking?.total || 0,
    type: 'credit',
  }));

  return (
    <div className="worker-page">
      <div className="wp-title">
        <HiCurrencyRupee className="wp-title-icon" />
        <h1>Wallet</h1>
      </div>

      {/* Balance Cards */}
      <div className="wallet-cards">
        <div className="wallet-card primary">
          <span>Available Balance</span>
          <strong>₹{available.toLocaleString()}</strong>
          <button className="withdraw-btn">Withdraw</button>
        </div>
        <div className="wallet-card">
          <div className="wc-row"><HiArrowDown className="wc-icon credit" /><span>Total Earned</span></div>
          <strong>₹{totalEarned.toLocaleString()}</strong>
        </div>
        <div className="wallet-card">
          <div className="wc-row"><HiArrowUp className="wc-icon debit" /><span>Withdrawn</span></div>
          <strong>₹{withdrawn.toLocaleString()}</strong>
        </div>
      </div>

      {/* Transactions */}
      <div className="worker-section">
        <h2>Transactions</h2>
        {transactions.length === 0 ? (
          <div className="empty-msg">No transactions yet.</div>
        ) : (
          <div className="txn-list">
            {transactions.map(t => (
              <div key={t.id} className="txn-item">
                <div className="txn-icon-wrap credit"><HiArrowDown className="txn-icon" /></div>
                <div className="txn-details">
                  <strong>{t.label}</strong>
                  <span><HiClock style={{ width: 11, height: 11, verticalAlign: 'middle' }} /> {t.date}</span>
                </div>
                <div className="txn-amount credit">+₹{t.amount.toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
