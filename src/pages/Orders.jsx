import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import './Orders.css';

export default function Orders() {
  const orders = useStore(s => s.orders);
  const navigate = useNavigate();

  if (orders.length === 0) return (
    <div className="orders-empty">
      <div className="empty-icon">📋</div>
      <h2>No orders yet</h2>
      <p>Book your first service to get started.</p>
      <button onClick={() => navigate('/browse')}>Browse Services →</button>
    </div>
  );

  return (
    <div className="orders-page">
      <h1>My Orders</h1>
      <div className="orders-list">
        {orders.map(order => {
          const isComplete = order.stage === order.stages.length - 1;
          return (
            <div key={order.id} className="order-item" onClick={() => navigate(`/track/${order.id}`)}>
              <div className="oi-left">
                <div className="oi-icon">🚜</div>
                <div>
                  <div className="oi-name">{order.vehicle.name}</div>
                  <div className="oi-loc">📍 {order.booking.location}</div>
                  <div className="oi-meta">{order.booking.date} • {order.booking.duration} {order.vehicle.unit === 'hr' ? 'hrs' : 'trips'}</div>
                </div>
              </div>
              <div className="oi-right">
                <div className="oi-amount">₹{order.booking.total?.toLocaleString()}</div>
                <div className={`oi-status ${isComplete ? 'complete' : 'active'}`}>
                  {isComplete ? 'Completed' : order.stages[order.stage]}
                </div>
                <div className="oi-id">#{order.id}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
