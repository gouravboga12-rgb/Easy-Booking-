import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import './OrderTracking.css';

export default function OrderTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const orders = useStore(s => s.orders);
  const advanceStage = useStore(s => s.advanceStage);

  const order = orders.find(o => o.id === id);

  // Auto-advance stages for demo (simulates real-time updates)
  useEffect(() => {
    if (!order || order.stage >= order.stages.length - 1) return;
    const timer = setTimeout(() => advanceStage(id), 4000);
    return () => clearTimeout(timer);
  }, [order?.stage, id]);

  if (!order) return (
    <div className="not-found">
      <p>Order not found.</p>
      <button onClick={() => navigate('/orders')}>View All Orders</button>
    </div>
  );

  const isComplete = order.stage === order.stages.length - 1;

  return (
    <div className="tracking-page">
      <button className="back-btn" onClick={() => navigate('/orders')}>← My Orders</button>

      <div className="tracking-layout">
        {/* Left: Status */}
        <div className="tracking-main">
          <div className="order-header">
            <div>
              <div className="order-id">Order #{order.id}</div>
              <div className="order-time">Placed at {order.placedAt}</div>
            </div>
            <div className={`status-badge ${isComplete ? 'complete' : 'active'}`}>
              {isComplete ? '✅ Completed' : '🔴 Live'}
            </div>
          </div>

          {/* Progress Tracker */}
          <div className="progress-tracker">
            {order.stages.map((stage, i) => (
              <div key={i} className={`stage ${i <= order.stage ? 'done' : ''} ${i === order.stage ? 'current' : ''}`}>
                <div className="stage-dot">
                  {i < order.stage ? '✓' : i === order.stage ? '●' : '○'}
                </div>
                <div className="stage-info">
                  <span className="stage-name">{stage}</span>
                  {i === order.stage && !isComplete && (
                    <span className="stage-sub">In progress...</span>
                  )}
                  {i < order.stage && <span className="stage-sub">Done</span>}
                </div>
                {i < order.stages.length - 1 && <div className={`stage-line ${i < order.stage ? 'filled' : ''}`} />}
              </div>
            ))}
          </div>

          {/* Booking Details */}
          <div className="booking-summary">
            <h3>Booking Details</h3>
            <div className="bs-row"><span>📍 Location</span><strong>{order.booking.location}</strong></div>
            <div className="bs-row"><span>📅 Date</span><strong>{order.booking.date}</strong></div>
            <div className="bs-row"><span>⏱ Duration</span><strong>{order.booking.duration} {order.vehicle.unit === 'hr' ? 'hrs' : 'trips'}</strong></div>
            <div className="bs-row total"><span>💰 Total</span><strong>₹{order.booking.total?.toLocaleString()}</strong></div>
          </div>
        </div>

        {/* Right: Operator Card */}
        <div className="operator-card">
          <h3>Your Operator</h3>
          <div className="op-avatar">👷</div>
          <div className="op-name">{order.operator?.name ?? 'Assigning...'}</div>
          <div className="op-rating">⭐ {order.operator?.rating ?? '-'}</div>
          <div className="op-vehicle">{order.operator?.vehicle ?? ''}</div>
          {order.operator?.phone ? (
            <a href={`tel:${order.operator.phone}`} className="call-btn">📞 Call Operator</a>
          ) : (
            <div className="call-btn disabled">📞 Operator being assigned</div>
          )}

          <div className="vehicle-info">
            <div className="vi-icon">🚜</div>
            <div>
              <strong>{order.vehicle?.name ?? 'Vehicle'}</strong>
              <p>{order.vehicle?.desc ?? ''}</p>
            </div>
          </div>

          {!isComplete && (
            <div className="eta-box">
              <div className="eta-label">Estimated Arrival</div>
              <div className="eta-time">~{Math.max(5, (order.stages.length - 1 - order.stage) * 8)} mins</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
