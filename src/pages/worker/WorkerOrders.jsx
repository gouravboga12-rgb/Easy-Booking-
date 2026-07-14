import { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useStore } from '../../store/useStore';
import { HiLocationMarker, HiCalendar, HiUser, HiArrowRight, HiClipboardList } from 'react-icons/hi';

export default function WorkerOrders() {
  const user = useAuthStore(s => s.user);
  const orders = useStore(s => s.orders);
  const advanceStage = useStore(s => s.advanceStage);

  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'completed'

  const activeOrders = orders.filter(o =>
    o.operator?.id === user.id && ['assigned', 'active', 'pending', 'arrived'].includes(o.status)
  );

  const completedOrders = orders.filter(o =>
    o.operator?.id === user.id && o.status === 'completed'
  );

  return (
    <div className="worker-page">
      <div className="wp-title" style={{ marginBottom: '16px' }}>
        <HiClipboardList className="wp-title-icon" />
        <h1>Service Orders</h1>
      </div>

      {/* Switch Option on Top */}
      <div className="orders-switcher" style={{
        display: 'flex',
        background: '#f1f5f9',
        padding: '4px',
        borderRadius: '10px',
        marginBottom: '28px',
        width: 'max-content',
        border: '1px solid #e2e8f0'
      }}>
        <button
          onClick={() => setActiveTab('active')}
          style={{
            border: 'none',
            outline: 'none',
            padding: '8px 20px',
            borderRadius: '8px',
            fontSize: '13.5px',
            fontWeight: '700',
            cursor: 'pointer',
            background: activeTab === 'active' ? '#fff' : 'transparent',
            color: activeTab === 'active' ? 'var(--primary)' : '#64748b',
            boxShadow: activeTab === 'active' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.18s ease',
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6' }}></span>
          Active & Ongoing ({activeOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          style={{
            border: 'none',
            outline: 'none',
            padding: '8px 20px',
            borderRadius: '8px',
            fontSize: '13.5px',
            fontWeight: '700',
            cursor: 'pointer',
            background: activeTab === 'completed' ? '#fff' : 'transparent',
            color: activeTab === 'completed' ? '#10b981' : '#64748b',
            boxShadow: activeTab === 'completed' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.18s ease',
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>
          Completed ({completedOrders.length})
        </button>
      </div>

      {activeTab === 'active' ? (
        /* Section 1: Active, Pending & Ongoing Services */
        <div className="worker-section-container">
          {activeOrders.length === 0 ? (
            <div className="empty-msg" style={{ background: '#fff', border: '1.5px dashed #eee', borderRadius: '14px', padding: '40px' }}>
              No active or pending orders right now.
            </div>
          ) : (
            <div className="order-cards">
              {activeOrders.map(o => (
                <div key={o.id} className="order-card" style={{ borderLeft: '4px solid #3b82f6' }}>
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
      ) : (
        /* Section 2: Completed Service Orders */
        <div className="worker-section-container">
          {completedOrders.length === 0 ? (
            <div className="empty-msg" style={{ background: '#fff', border: '1.5px dashed #eee', borderRadius: '14px', padding: '40px' }}>
              No completed orders yet.
            </div>
          ) : (
            <div className="order-cards">
              {completedOrders.map(o => (
                <div key={o.id} className="order-card" style={{ borderLeft: '4px solid #10b981' }}>
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
                  <div className="oc-footer" style={{ borderBottom: o.completionImages && o.completionImages.length > 0 ? '1px solid #f5f5f5' : 'none', paddingBottom: o.completionImages && o.completionImages.length > 0 ? '10px' : '0', marginBottom: o.completionImages && o.completionImages.length > 0 ? '10px' : '0' }}>
                    <div className="oc-amount">₹{o.booking?.total?.toLocaleString()}</div>
                  </div>
                  {o.completionImages && o.completionImages.length > 0 && (
                    <div style={{ marginTop: '10px' }}>
                      <div style={{ fontSize: '11px', color: '#888', fontWeight: '600', marginBottom: '6px' }}>Completion Photos:</div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {o.completionImages.map((img, i) => (
                          <img 
                            key={i} 
                            src={img.startsWith('http') || img.startsWith('data:') ? img : `/images/${img}`} 
                            alt={`Completion ${i+1}`} 
                            style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #e5e7eb' }} 
                            onError={e => { e.target.src = 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=120&q=70'; }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="oc-stage" style={{ marginTop: '10px' }}>
                    Stage: <strong>{o.stages[o.stage]}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


