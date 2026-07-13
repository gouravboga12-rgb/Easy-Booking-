import { useAuthStore } from '../../store/useAuthStore';
import { useStore } from '../../store/useStore';
import { HiLocationMarker, HiCalendar, HiUser, HiArrowRight, HiClipboardList } from 'react-icons/hi';

export default function WorkerOrders() {
  const user = useAuthStore(s => s.user);
  const orders = useStore(s => s.orders);
  const advanceStage = useStore(s => s.advanceStage);

  const activeOrders = orders.filter(o =>
    o.operator?.id === user.id && ['assigned', 'active', 'pending', 'arrived'].includes(o.status)
  );

  return (
    <div className="worker-page">
      <div className="wp-title">
        <HiClipboardList className="wp-title-icon" />
        <h1>Active Orders</h1>
      </div>

      {activeOrders.length === 0 ? (
        <div className="empty-msg">No active orders right now.</div>
      ) : (
        <div className="order-cards">
          {activeOrders.map(o => (
            <div key={o.id} className="order-card">
              <div className="oc-header">
                <div>
                  <div className="oc-id">#{o.id}</div>
                  <div className="oc-vehicle">{o.vehicle?.name}</div>
                </div>
                <span className={`status-chip ${o.status}`}>{o.status}</span>
              </div>
              <div className="oc-details">
                <div className="oc-row"><HiLocationMarker className="oc-icon" />{o.booking?.location}</div>
                <div className="oc-row"><HiCalendar className="oc-icon" />{o.booking?.date} · {o.booking?.duration} {o.vehicle?.unit}</div>
                <div className="oc-row"><HiUser className="oc-icon" />{o.customer?.name} {o.customer?.phone && <span className="oc-phone">{o.customer.phone}</span>}</div>
              </div>
              <div className="oc-footer">
                <div className="oc-amount">₹{o.booking?.total?.toLocaleString()}</div>
                {o.stage < o.stages.length - 1 && (
                  <button className="aj-advance" onClick={() => advanceStage(o.id)}>
                    {o.stages[o.stage + 1]} <HiArrowRight style={{ width: 14, height: 14 }} />
                  </button>
                )}
              </div>
              <div className="oc-stage">
                Stage: <strong>{o.stages[o.stage]}</strong>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
