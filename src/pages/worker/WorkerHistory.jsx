import { useAuthStore } from '../../store/useAuthStore';
import { useStore } from '../../store/useStore';
import { HiLocationMarker, HiClock } from 'react-icons/hi';

export default function WorkerHistory() {
  const user = useAuthStore(s => s.user);
  const orders = useStore(s => s.orders);

  const history = orders.filter(o =>
    o.operator?.id === user.id && ['completed', 'cancelled'].includes(o.status)
  );

  const totalEarned = history
    .filter(o => o.status === 'completed')
    .reduce((s, o) => s + (o.booking?.total || 0), 0);

  return (
    <div className="worker-page">
      <div className="wp-title">
        <HiClock className="wp-title-icon" />
        <h1>Order History</h1>
      </div>

      {history.length > 0 && (
        <div className="history-summary">
          <div className="hs-item"><span>Total Jobs</span><strong>{history.length}</strong></div>
          <div className="hs-divider" />
          <div className="hs-item"><span>Completed</span><strong>{history.filter(o => o.status === 'completed').length}</strong></div>
          <div className="hs-divider" />
          <div className="hs-item"><span>Total Earned</span><strong>₹{totalEarned.toLocaleString()}</strong></div>
        </div>
      )}

      {history.length === 0 ? (
        <div className="empty-msg">No completed jobs yet.</div>
      ) : (
        <div className="job-list">
          {history.map(o => (
            <div key={o.id} className="job-item">
              <div className="ji-left">
                <div className="ji-thumb">
                  <img src={o.vehicle?.image || 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=120&q=70'} alt={o.vehicle?.name} onError={e => { e.target.src = 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=120&q=70'; }} />
                </div>
                <div>
                  <strong>{o.vehicle?.name}</strong>
                  <p><HiLocationMarker style={{ width: 11, height: 11, verticalAlign: 'middle' }} /> {o.booking?.location} · {o.booking?.date}</p>
                  <p style={{ fontSize: 11, color: '#bbb' }}>#{o.id}</p>
                </div>
              </div>
              <div className="ji-right">
                <div className="ji-amount">₹{o.booking?.total?.toLocaleString()}</div>
                <span className={`status-chip ${o.status}`}>{o.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
