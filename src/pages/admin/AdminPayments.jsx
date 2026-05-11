import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { HiCurrencyRupee, HiChevronLeft } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import './Admin.css';

const FILTERS = ['all', 'completed', 'pending', 'cancelled'];

export default function AdminPayments() {
  const navigate = useNavigate();
  const orders = useStore(s => s.orders);
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);
  const totalRevenue = orders.filter(o => o.status === 'completed').reduce((s, o) => s + (o.booking?.total || 0), 0);
  const pending = orders.filter(o => o.status === 'pending').reduce((s, o) => s + (o.booking?.total || 0), 0);

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="ah-with-back">
          <button className="back-icon-btn" onClick={() => navigate('/admin/more')}><HiChevronLeft /></button>
          <div><h1>Payments</h1><p>Revenue & transaction history</p></div>
        </div>
      </div>

      <div className="payment-summary">
        <div className="ps-card green">
          <HiCurrencyRupee className="ps-icon" />
          <div><span>Total Revenue</span><strong>₹{totalRevenue.toLocaleString()}</strong></div>
        </div>
        <div className="ps-card yellow">
          <HiCurrencyRupee className="ps-icon" />
          <div><span>Pending Value</span><strong>₹{pending.toLocaleString()}</strong></div>
        </div>
        <div className="ps-card blue">
          <HiCurrencyRupee className="ps-icon" />
          <div><span>Total Transactions</span><strong>{orders.length}</strong></div>
        </div>
      </div>

      <div className="filter-tabs">
        {FILTERS.map(f => (
          <button key={f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span className="tab-count">{f === 'all' ? orders.length : orders.filter(o => o.status === f).length}</span>
          </button>
        ))}
      </div>

      <div className="orders-table-wrap">
        <table className="admin-table full">
          <thead>
            <tr><th>Order ID</th><th>Customer</th><th>Vehicle</th><th>Date</th><th>Amount</th><th>Status</th></tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#aaa' }}>No transactions found.</td></tr>
            ) : filtered.map(o => (
              <tr key={o.id}>
                <td className="mono">#{o.id.slice(-8)}</td>
                <td>{o.customer?.name || 'Guest'}</td>
                <td>{o.vehicle?.name}</td>
                <td>{o.booking?.date || '—'}</td>
                <td><strong>₹{o.booking?.total?.toLocaleString() || '—'}</strong></td>
                <td><span className={`status-chip ${o.status}`}>{o.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
