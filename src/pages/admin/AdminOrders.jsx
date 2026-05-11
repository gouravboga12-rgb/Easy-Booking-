import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { useAuthStore } from '../../store/useAuthStore';
import { HiStar, HiX } from 'react-icons/hi';
import { MdAssignmentInd } from 'react-icons/md';
import './Admin.css';

const STATUS_FILTERS = ['all','pending','assigned','active','completed','cancelled'];

export default function AdminOrders() {
  const orders       = useStore(s => s.orders);
  const assignWorker = useStore(s => s.assignWorker);
  const cancelOrder  = useStore(s => s.cancelOrder);
  const advanceStage = useStore(s => s.advanceStage);
  const getWorkers   = useAuthStore(s => s.getWorkers);
  const workers      = getWorkers();

  const [filter, setFilter]       = useState('all');
  const [assignModal, setAssignModal] = useState(null);

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  const handleAssign = (orderId, worker) => {
    assignWorker(orderId, { id: worker.id, name: worker.name, phone: worker.phone, rating: worker.rating, vehicle: worker.vehicle });
    setAssignModal(null);
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div><h1>Order Management</h1><p>Assign workers and manage all bookings</p></div>
      </div>

      <div className="filter-tabs">
        {STATUS_FILTERS.map(f => (
          <button key={f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span className="tab-count">{f === 'all' ? orders.length : orders.filter(o => o.status === f).length}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-msg">No orders in this category.</div>
      ) : (
        <div className="orders-table-wrap">
          <table className="admin-table full">
            <thead>
              <tr>
                <th>Order ID</th><th>Vehicle</th><th>Customer</th><th>Location</th>
                <th>Date</th><th>Amount</th><th>Status</th><th>Operator</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id}>
                  <td className="mono">#{o.id.slice(-6)}</td>
                  <td><strong>{o.vehicle.name}</strong></td>
                  <td>{o.customer?.name || 'Guest'}</td>
                  <td className="truncate">{o.booking?.location}</td>
                  <td>{o.booking?.date}</td>
                  <td>₹{o.booking?.total?.toLocaleString()}</td>
                  <td><span className={`status-chip ${o.status}`}>{o.status}</span></td>
                  <td>{o.operator ? o.operator.name : <span className="unassigned">Unassigned</span>}</td>
                  <td>
                    <div className="action-btns">
                      {o.status === 'pending' && (
                        <button className="act-btn assign" onClick={() => setAssignModal(o.id)}>
                          <MdAssignmentInd style={{ width: 13, height: 13 }} /> Assign
                        </button>
                      )}
                      {['assigned','active'].includes(o.status) && (
                        <button className="act-btn advance" onClick={() => advanceStage(o.id)}>Advance</button>
                      )}
                      {!['completed','cancelled'].includes(o.status) && (
                        <button className="act-btn cancel" onClick={() => cancelOrder(o.id)}>
                          <HiX style={{ width: 12, height: 12 }} /> Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {assignModal && (
        <div className="modal-overlay" onClick={() => setAssignModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Assign Worker</h3>
            <p>Select an available operator for this job</p>
            <div className="worker-options">
              {workers.map(w => (
                <button
                  key={w.id}
                  className={`worker-option ${!w.available ? 'busy' : ''}`}
                  onClick={() => w.available && handleAssign(assignModal, w)}
                  disabled={!w.available}
                >
                  <div className="wo-avatar">{w.name.charAt(0)}</div>
                  <div className="wo-info">
                    <strong>{w.name}</strong>
                    <span>{w.vehicle}</span>
                    <span>
                      <HiStar style={{ width: 11, height: 11, color: '#f59e0b' }} /> {w.rating} · {w.jobsDone} jobs
                    </span>
                  </div>
                  <span className={`avail-badge ${w.available ? 'on' : 'off'}`}>
                    {w.available ? 'Available' : 'Busy'}
                  </span>
                </button>
              ))}
            </div>
            <button className="modal-close" onClick={() => setAssignModal(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
