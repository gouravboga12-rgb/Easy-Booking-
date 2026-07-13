import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { useAuthStore } from '../../store/useAuthStore';
import { HiStar, HiX, HiCheck, HiRefresh } from 'react-icons/hi';
import { MdAssignmentInd } from 'react-icons/md';
import './Admin.css';

const STATUS_FILTERS = ['all', 'pending', 'assigned', 'active', 'disputed', 'completed', 'cancelled'];

export default function AdminOrders() {
  const orders = useStore(s => s.orders);
  const assignWorker = useStore(s => s.assignWorker);
  const cancelOrder = useStore(s => s.cancelOrder);
  const advanceStage = useStore(s => s.advanceStage);
  const users = useAuthStore(s => s.users);
  const workers = users.filter(u => u.role === 'worker');

  const [filter, setFilter] = useState('all');
  const [assignModal, setAssignModal] = useState(null);
  
  // Custom dispute state simulation in local memory or store
  const [disputedOrders, setDisputedOrders] = useState([]);

  const toggleDisputeOrder = (orderId) => {
    if (disputedOrders.includes(orderId)) {
      setDisputedOrders(disputedOrders.filter(id => id !== orderId));
    } else {
      setDisputedOrders([...disputedOrders, orderId]);
    }
  };

  const handleAssign = (orderId, worker) => {
    assignWorker(orderId, {
      id: worker.id,
      name: worker.name,
      phone: worker.phone,
      rating: worker.rating,
      vehicle: worker.vehicle,
      photo: worker.photo
    });
    setAssignModal(null);
  };

  const getOrderStatus = (o) => {
    if (disputedOrders.includes(o.id) && o.status !== 'completed' && o.status !== 'cancelled') {
      return 'disputed';
    }
    return o.status;
  };

  const filtered = filter === 'all'
    ? orders
    : orders.filter(o => {
        const status = getOrderStatus(o);
        return status === filter;
      });

  return (
    <div className="admin-page" style={{ paddingBottom: '32px' }}>
      <div className="admin-header">
        <div>
          <h1>Booking & Dispatch Management</h1>
          <p>Track live statuses, assign operators, perform reassignments, resolve disputes, and cancel bookings</p>
        </div>
      </div>

      <div className="filter-tabs">
        {STATUS_FILTERS.map(f => {
          const count = f === 'all'
            ? orders.length
            : orders.filter(o => getOrderStatus(o) === f).length;
          return (
            <button key={f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
              <span className="tab-count">{count}</span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-msg">No orders match this status filter.</div>
      ) : (
        <div className="orders-table-wrap">
          <table className="admin-table full">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Service Name</th>
                <th>Booking Type</th>
                <th>Customer</th>
                <th>Location / Address</th>
                <th>Schedule Date</th>
                <th>Progress Stage</th>
                <th>Bill Total</th>
                <th>Status Badge</th>
                <th>Operator</th>
                <th>Dispatcher Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => {
                const currentStatus = getOrderStatus(o);
                return (
                  <tr key={o.id}>
                    <td className="mono">#{o.id.slice(-6)}</td>
                    <td><strong>{o.vehicle.name}</strong></td>
                    <td style={{ fontSize: '11px' }}>
                      {o.bookingType === 'instant' ? '⚡ Instant' : '📅 Scheduled'}
                    </td>
                    <td>{o.customer?.name || 'Guest'}</td>
                    <td className="truncate" title={o.booking?.location}>
                      <div>{o.booking?.location}</div>
                      {o.booking?.lat && o.booking?.lng && (
                        <div style={{ fontSize: '10px', color: '#888', marginTop: '2px' }}>
                          🎯 Lat: {o.booking.lat.toFixed(5)}, Lng: {o.booking.lng.toFixed(5)}
                        </div>
                      )}
                    </td>
                    <td>{o.booking?.date}</td>
                    <td style={{ fontSize: '11px', color: '#666' }}>
                      {o.stages && o.stages[o.stage] ? `${o.stage + 1}/4: ${o.stages[o.stage]}` : 'Unassigned'}
                    </td>
                    <td><strong>₹{o.booking?.total?.toLocaleString()}</strong></td>
                    <td>
                      <span className={`status-chip ${currentStatus}`}>
                        {currentStatus.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      {o.operator ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: '600' }}>{o.operator.name}</span>
                        </div>
                      ) : (
                        <span className="unassigned">Searching...</span>
                      )}
                    </td>
                    <td>
                      <div className="action-btns" style={{ display: 'flex', gap: '6px' }}>
                        {o.status === 'pending' && (
                          <button className="act-btn assign" onClick={() => setAssignModal(o.id)} style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: '700' }}>
                            <MdAssignmentInd /> Dispatch
                          </button>
                        )}

                        {['assigned', 'active'].includes(o.status) && (
                          <>
                            <button className="act-btn advance" onClick={() => advanceStage(o.id)} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: '700' }}>
                              Next Stage
                            </button>
                            <button className="act-btn assign" onClick={() => setAssignModal(o.id)} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                              <HiRefresh /> Reassign
                            </button>
                          </>
                        )}

                        {currentStatus === 'disputed' ? (
                          <button
                            onClick={() => {
                              toggleDisputeOrder(o.id);
                              advanceStage(o.id); // Force-complete order to resolve
                            }}
                            style={{ background: '#10b981', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: '700' }}
                          >
                            ✔️ Resolve Dispute
                          </button>
                        ) : (
                          !['completed', 'cancelled'].includes(o.status) && (
                            <button
                              onClick={() => toggleDisputeOrder(o.id)}
                              style={{ background: '#f59e0b', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: '700' }}
                            >
                              ⚠️ Dispute
                            </button>
                          )
                        )}

                        {!['completed', 'cancelled'].includes(o.status) && (
                          <button className="act-btn cancel" onClick={() => cancelOrder(o.id)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: '700' }}>
                            <HiX /> Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {assignModal && (
        <div className="modal-overlay" onClick={() => setAssignModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Dispatch & Assign Operator</h3>
            <p>Assign/reassign an available verified service professional</p>
            <div className="worker-options" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {workers.map(w => (
                <button
                  key={w.id}
                  className={`worker-option ${!w.available ? 'busy' : ''}`}
                  onClick={() => handleAssign(assignModal, w)}
                  style={{ width: '100%', padding: '10px', display: 'flex', alignItems: 'center', gap: '10px', margin: '8px 0', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', background: '#fff' }}
                >
                  <div className="wo-avatar" style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#eee', overflow: 'hidden' }}>
                    <img src={w.photo || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=80&q=80'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div className="wo-info" style={{ textAlign: 'left', flex: 1 }}>
                    <strong style={{ display: 'block', fontSize: '13px' }}>{w.name}</strong>
                    <span style={{ fontSize: '11px', color: '#666' }}>{w.vehicle}</span>
                    <span style={{ display: 'block', fontSize: '11px', color: '#eab308' }}>⭐ {w.rating} · {w.jobsDone} completed</span>
                  </div>
                  <span className={`avail-badge ${w.available ? 'on' : 'off'}`} style={{ fontSize: '11px', background: w.available ? '#dcfce7' : '#f3f4f6', color: w.available ? '#15803d' : '#9ca3af', padding: '2px 8px', borderRadius: '10px' }}>
                    {w.available ? 'Available' : 'Busy/Offline'}
                  </span>
                </button>
              ))}
            </div>
            <button className="modal-close" onClick={() => setAssignModal(null)} style={{ marginTop: '12px', background: 'none', border: '1.5px solid #ddd', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
