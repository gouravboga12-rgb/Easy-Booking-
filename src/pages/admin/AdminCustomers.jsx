import { useAuthStore } from '../../store/useAuthStore';
import { useStore } from '../../store/useStore';
import { HiUsers, HiPhone, HiMail, HiShoppingCart } from 'react-icons/hi';
import './Admin.css';

export default function AdminCustomers() {
  const getCustomers = useAuthStore(s => s.getCustomers);
  const orders = useStore(s => s.orders);
  const customers = getCustomers();

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1>Customers</h1>
          <p>{customers.length} registered customers</p>
        </div>
      </div>

      <div className="customers-grid">
        {customers.length === 0 ? (
          <div className="empty-msg">No customers registered yet.</div>
        ) : (
          customers.map(c => {
            const custOrders = orders.filter(o => o.customer?.id === c.id);
            const spent = custOrders.filter(o => o.status === 'completed').reduce((s, o) => s + (o.booking?.total || 0), 0);
            return (
              <div key={c.id} className="customer-card">
                <div className="cc-top">
                  <div className="cc-avatar">{c.name.charAt(0)}</div>
                  <span className="role-tag customer">Customer</span>
                </div>
                <h3>{c.name}</h3>
                <div className="cc-info">
                  <div className="cc-row"><HiMail className="cc-icon" />{c.email}</div>
                  <div className="cc-row"><HiPhone className="cc-icon" />{c.phone || '—'}</div>
                </div>
                <div className="cc-stats">
                  <div><strong>{custOrders.length}</strong><span>Orders</span></div>
                  <div><strong>₹{spent.toLocaleString()}</strong><span>Spent</span></div>
                  <div><strong>{custOrders.filter(o => o.status === 'completed').length}</strong><span>Completed</span></div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
