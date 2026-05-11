import { useAuthStore } from '../../store/useAuthStore';
import { useStore } from '../../store/useStore';
import { HiStar, HiPhone } from 'react-icons/hi';
import { MdDirectionsCar } from 'react-icons/md';
import './Admin.css';

export default function AdminWorkers() {
  const getWorkers = useAuthStore(s => s.getWorkers);
  const updateWorkerAvailability = useAuthStore(s => s.updateWorkerAvailability);
  const orders  = useStore(s => s.orders);
  const workers = getWorkers();

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div><h1>Worker Management</h1><p>Manage operators and their availability</p></div>
      </div>

      <div className="workers-grid">
        {workers.map(w => {
          const workerOrders = orders.filter(o => o.operator?.id === w.id);
          const activeJob    = orders.find(o => o.operator?.id === w.id && ['assigned','active'].includes(o.status));
          return (
            <div key={w.id} className="worker-card">
              <div className="wc-top">
                <div className="wc-avatar">{w.name.charAt(0)}</div>
                <div className={`wc-status ${w.available ? 'on' : 'off'}`}>
                  {w.available ? '● Available' : '● Busy'}
                </div>
              </div>
              <h3>{w.name}</h3>
              <p className="wc-vehicle">
                <MdDirectionsCar style={{ width: 14, height: 14, verticalAlign: 'middle', marginRight: 4 }} />
                {w.vehicle}
              </p>
              <p className="wc-phone">
                <HiPhone style={{ width: 13, height: 13, verticalAlign: 'middle', marginRight: 4 }} />
                {w.phone}
              </p>
              <div className="wc-stats">
                <div>
                  <strong>
                    <HiStar style={{ width: 14, height: 14, color: '#f59e0b', verticalAlign: 'middle' }} /> {w.rating}
                  </strong>
                  <span>Rating</span>
                </div>
                <div><strong>{w.jobsDone}</strong><span>Jobs Done</span></div>
                <div><strong>{workerOrders.length}</strong><span>On Platform</span></div>
              </div>
              {activeJob && (
                <div className="active-job-badge">
                  🔴 On Job: {activeJob.vehicle.name}
                </div>
              )}
              <button
                className={`toggle-avail ${w.available ? 'set-busy' : 'set-avail'}`}
                onClick={() => updateWorkerAvailability(w.id, !w.available)}
              >
                {w.available ? 'Mark as Busy' : 'Mark as Available'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
