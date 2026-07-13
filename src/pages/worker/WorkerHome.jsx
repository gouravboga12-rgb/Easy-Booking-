import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useStore } from '../../store/useStore';
import {
  HiStar, HiBriefcase, HiCheckCircle, HiCurrencyRupee,
  HiLocationMarker, HiCalendar, HiUser, HiArrowRight,
  HiLightningBolt, HiClock, HiPhone, HiMap, HiFolderOpen,
  HiCheck, HiX
} from 'react-icons/hi';
import { MdDirectionsCar, MdOutlineCancelScheduleSend } from 'react-icons/md';
import './Worker.css';

export default function WorkerHome() {
  const user = useAuthStore(s => s.user);
  const updateWorkerAvailability = useAuthStore(s => s.updateWorkerAvailability);
  const addWorkerEarning = useAuthStore(s => s.addWorkerEarning);
  const orders = useStore(s => s.orders);
  const assignWorker = useStore(s => s.assignWorker);
  const rejectOrder = useStore(s => s.rejectOrder);
  const advanceStage = useStore(s => s.advanceStage);
  const uploadCompletionImages = useStore(s => s.uploadCompletionImages);
  const updateWorkerLocation = useStore(s => s.updateWorkerLocation);

  const [simulatedFiles, setSimulatedFiles] = useState([]);
  const [completeSuccess, setCompleteSuccess] = useState(false);

  // Availability Settings States
  const [hours, setHours] = useState(user.availability?.hours || '09:00 - 18:00');
  const [vacation, setVacation] = useState(user.availability?.vacation || false);
  const [blockDate, setBlockDate] = useState('');
  const [blockedDates, setBlockedDates] = useState(user.availability?.blockedDates || []);

  const myOrders = orders.filter(o => o.operator?.id === user.id);
  const activeJob = myOrders.find(o => ['assigned', 'active'].includes(o.status));
  const completedJobs = myOrders.filter(o => o.status === 'completed');
  const earnings = user.wallet?.balance || 0;

  // Filter requests that are:
  // 1. Pending assignment
  // 2. Matches category
  // 3. Worker has not rejected
  const pendingRequests = orders.filter(o => 
    o.status === 'pending' &&
    (!o.rejectedWorkers || !o.rejectedWorkers.includes(user.id)) &&
    (user.categories && user.categories.includes(o.vehicle.category))
  );

  const isSubscribed = true; // Bypass subscription check for testing/debug

  const STATS = [
    { Icon: HiStar,          val: `${user.rating}★`,                        label: 'Rating',      color: '#f59e0b' },
    { Icon: HiBriefcase,     val: user.jobsDone,                             label: 'Completed',   color: '#10b981' },
    { Icon: HiCurrencyRupee, val: `₹${earnings.toLocaleString()}`,           label: 'Wallet Bal',  color: '#8b5cf6' },
  ];

  const handleToggleOnline = () => {
    updateWorkerAvailability(user.id, { online: !user.available });
  };

  const handleToggleVacation = () => {
    const nextVal = !vacation;
    setVacation(nextVal);
    updateWorkerAvailability(user.id, { vacation: nextVal, online: nextVal ? false : user.available });
  };

  const handleAddBlockedDate = () => {
    if (!blockDate) return;
    const updated = [...blockedDates, blockDate];
    setBlockedDates(updated);
    updateWorkerAvailability(user.id, { blockedDates: updated });
    setBlockDate('');
  };

  const handleRemoveBlockedDate = (date) => {
    const updated = blockedDates.filter(d => d !== date);
    setBlockedDates(updated);
    updateWorkerAvailability(user.id, { blockedDates: updated });
  };

  const handleUpdateHours = (val) => {
    setHours(val);
    updateWorkerAvailability(user.id, { hours: val });
  };

  // Job flow handlers
  const handleAcceptRequest = (orderId) => {
    if (!isSubscribed) return;
    assignWorker(orderId, {
      id: user.id,
      name: user.name,
      phone: user.phone,
      rating: user.rating,
      vehicle: user.vehicle,
      photo: user.photo
    });
  };

  const handleRejectRequest = (orderId) => {
    rejectOrder(orderId, user.id);
  };

  useEffect(() => {
    if (!activeJob || activeJob.stage !== 2) return;

    if (!navigator.geolocation) {
      console.warn("Geolocation is not supported by this browser.");
      return;
    }

    console.log("Starting worker location watch en-route...");
    const handleSuccess = (position) => {
      const { latitude, longitude } = position.coords;
      updateWorkerLocation(latitude, longitude);
    };

    const handleError = (err) => {
      console.error("Worker location watch error:", err);
    };

    const watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      maximumAge: 10000,
      timeout: 10000
    });

    return () => {
      console.log("Stopping worker location watch.");
      navigator.geolocation.clearWatch(watchId);
    };
  }, [activeJob?.id, activeJob?.stage, updateWorkerLocation]);


  const handleAdvanceStage = () => {
    if (!activeJob) return;
    advanceStage(activeJob.id);
  };

  const handleUploadSimulatedImages = () => {
    // Simulate uploading completion photos
    const mockFiles = ['completed_job_after1.jpg', 'completed_job_after2.jpg'];
    setSimulatedFiles(mockFiles);
    uploadCompletionImages(activeJob.id, mockFiles);
  };

  const handleCompleteJob = () => {
    if (!activeJob) return;
    
    // 1. Credit earnings (amount is total price)
    const amount = activeJob.booking.total || 0;
    addWorkerEarning(user.id, amount, `Completed Project #${activeJob.id}`);
    
    // 2. Advance stage to completed
    advanceStage(activeJob.id);
    setCompleteSuccess(true);
    setSimulatedFiles([]);
    setTimeout(() => setCompleteSuccess(false), 5000);
  };

  return (
    <div className="worker-page" style={{ paddingBottom: '32px' }}>
      
      {/* Subscription Alert Banner */}
      {!isSubscribed && (
        <div className="sub-warning-banner" style={{ background: '#fef2f2', border: '1.5px solid #fecaca', color: '#b91c1c', padding: '14px', borderRadius: '12px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <strong style={{ fontSize: '15px' }}>⚠️ Inactive Subscription Plan</strong>
          <p style={{ fontSize: '13px', lineHeight: '1.5', margin: 0 }}>
            You must have an active subscription package to receive active dispatch requests, display your professional profile publicly, or accept bookings.
          </p>
          <span style={{ fontSize: '12px', fontWeight: '700', textDecoration: 'underline', marginTop: '4px', cursor: 'pointer' }}>
            Go to Wallet Tab to purchase ₹99 Monthly Plan ➔
          </span>
        </div>
      )}

      {/* Header */}
      <div className="worker-header" style={{ marginBottom: '24px' }}>
        <div className="wh-left">
          <div className="wh-avatar" style={{ overflow: 'hidden' }}>
            <img src={user.photo || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=120&q=80'} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div>
            <h1>Hey, {user.name.split(' ')[0]}! 👋</h1>
            <p className="wh-vehicle" style={{ fontSize: '13px', color: '#666' }}>
              <MdDirectionsCar style={{ width: 14, height: 14, verticalAlign: 'middle', marginRight: 4, color: 'var(--primary)' }} />
              {user.vehicle}
            </p>
          </div>
        </div>
        <div className="avail-toggle">
          <span>Duty Status:</span>
          <button
            className={`toggle-btn ${user.available ? 'on' : 'off'}`}
            onClick={handleToggleOnline}
            disabled={vacation}
            style={{ opacity: vacation ? 0.6 : 1 }}
          >
            {user.available ? '● ONLINE' : '○ OFFLINE'}
          </button>
        </div>
      </div>

      {/* Stats Cockpit */}
      <div className="worker-stats">
        {STATS.map(({ Icon, val, label, color }) => (
          <div key={label} className="ws-card" style={{ padding: '16px', borderRadius: '12px', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="ws-icon-wrap" style={{ background: color + '12', color, width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
              <Icon style={{ width: '18px', height: '18px' }} />
            </div>
            <strong style={{ fontSize: '18px', fontWeight: '800', color: '#1a1a1a' }}>{val}</strong>
            <span style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{label}</span>
          </div>
        ))}
      </div>

      {completeSuccess && (
        <div className="auth-error" style={{ background: '#ecfdf5', borderColor: '#a7f3d0', color: '#065f46', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HiCheckCircle style={{ width: '20px', height: '20px' }} />
          <span>Job successfully marked as completed! Payment has been credited to your wallet.</span>
        </div>
      )}

      {/* ── ACTIVE PROJECT SECTION (En Route, On Site, etc.) ── */}
      {activeJob && (
        <div className="active-job-card" style={{ background: '#fff', borderRadius: '16px', borderLeft: '5px solid var(--primary)', padding: '24px', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span className="aj-badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: '700', padding: '4px 10px', borderRadius: '20px', fontSize: '12px' }}>
              🟢 ACTIVE ASSIGNMENT
            </span>
            <span style={{ fontSize: '12px', color: '#888' }}>
              {activeJob.bookingType === 'instant' ? '⚡ Instant Dispatch' : '📅 Scheduled'}
            </span>
          </div>

          <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1a1a1a', marginBottom: '16px' }}>
            {activeJob.vehicle.name}
          </h2>

          <div className="aj-details" style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '16px', borderBottom: '1px solid #f0f0f0', marginBottom: '16px' }}>
            <div className="aj-row" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '14px' }}>
              <HiLocationMarker style={{ color: '#bbb', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: '#333' }}>Address:</strong>
                <p style={{ margin: '2px 0 0', color: '#666' }}>{activeJob.booking.location}</p>
              </div>
            </div>
            
            <div className="aj-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
              <HiCalendar style={{ color: '#bbb' }} />
              <div>
                <strong style={{ color: '#333' }}>Schedule:</strong>
                <span style={{ marginLeft: '6px', color: '#666' }}>{activeJob.booking.date} ({activeJob.booking.duration} {activeJob.vehicle.unit === 'hr' ? 'hrs' : 'trips'})</span>
              </div>
            </div>

            <div className="aj-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
              <HiUser style={{ color: '#bbb' }} />
              <div>
                <strong style={{ color: '#333' }}>Customer:</strong>
                <span style={{ marginLeft: '6px', color: '#666' }}>{activeJob.customer?.name}</span>
                {activeJob.customer?.phone && (
                  <a href={`tel:${activeJob.customer.phone}`} style={{ marginLeft: '12px', color: 'var(--primary)', fontWeight: '700', textDecoration: 'none' }}>
                    📞 Call Customer
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Navigation link via Google Maps */}
          <div style={{ marginBottom: '16px' }}>
            <a
              href={activeJob.booking.lat && activeJob.booking.lng
                ? `https://www.google.com/maps/dir/?api=1&destination=${activeJob.booking.lat},${activeJob.booking.lng}`
                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeJob.booking.location)}`}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#f3f4f6',
                color: '#4b5563',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                textDecoration: 'none',
                border: '1px solid #e5e5e5'
              }}
            >
              <HiMap style={{ color: 'var(--primary)' }} />
              <span>Navigate in Google Maps</span>
            </a>
          </div>

          <div style={{ background: '#fafafa', padding: '14px', borderRadius: '10px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#666' }}>Progress Status:</span>
            <strong style={{ fontSize: '14px', color: 'var(--primary)' }}>
              {activeJob.stages[activeJob.stage]}
            </strong>
          </div>

          {/* Upload Completion Images section in Stage 3 */}
          {activeJob.stage === 3 && (
            <div style={{ marginBottom: '16px', border: '1.5px dashed #ddd', padding: '14px', borderRadius: '10px', background: '#fafafa' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#444', marginBottom: '8px' }}>
                <HiFolderOpen style={{ color: 'var(--primary)' }} />
                <strong>Before/After Completion Photos</strong>
              </div>
              
              {simulatedFiles.length === 0 ? (
                <button
                  type="button"
                  onClick={handleUploadSimulatedImages}
                  style={{
                    background: '#fff',
                    border: '1px solid #ddd',
                    color: '#666',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    width: '100%'
                  }}
                >
                  📸 Upload Simulated Completion Images
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {simulatedFiles.map(f => (
                    <span key={f} style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', fontSize: '11px', padding: '4px 8px', borderRadius: '4px' }}>
                      ✔️ {f}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons based on stages:
              stage 1 -> Mark as En Route
              stage 2 -> Mark as On Site
              stage 3 -> Mark as Completed */}
          {activeJob.stage === 1 && (
            <button className="aj-advance" onClick={handleAdvanceStage} style={{ width: '100%', background: 'var(--primary)', color: '#fff', padding: '14px', borderRadius: '10px', border: 'none', fontWeight: '700', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}>
              <span>Start En Route</span>
              <HiArrowRight style={{ width: 16, height: 16 }} />
            </button>
          )}
          {activeJob.stage === 2 && (
            <button className="aj-advance" onClick={handleAdvanceStage} style={{ width: '100%', background: 'var(--primary)', color: '#fff', padding: '14px', borderRadius: '10px', border: 'none', fontWeight: '700', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}>
              <span>Arrived (On Site)</span>
              <HiArrowRight style={{ width: 16, height: 16 }} />
            </button>
          )}
          {activeJob.stage === 3 && (
            <button
              className="aj-advance"
              onClick={handleCompleteJob}
              disabled={simulatedFiles.length === 0}
              style={{
                width: '100%',
                background: simulatedFiles.length > 0 ? '#10b981' : '#ccc',
                color: '#fff',
                padding: '14px',
                borderRadius: '10px',
                border: 'none',
                fontWeight: '700',
                fontSize: '15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: simulatedFiles.length > 0 ? 'pointer' : 'not-allowed'
              }}
            >
              <span>Complete Project & Credit Wallet</span>
              <HiCheck style={{ width: 16, height: 16 }} />
            </button>
          )}
        </div>
      )}

      {/* ── PENDING DISPATCHED REQUESTS POOL (RAPIDO-STYLE) ── */}
      <div className="worker-section" style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h2>Pending Dispatch Orders ({pendingRequests.length})</h2>
          <span style={{ fontSize: '11px', color: '#888', background: '#f3f4f6', padding: '2px 8px', borderRadius: '10px' }}>
            Matches your operational category
          </span>
        </div>

        {!user.available ? (
          <div className="no-active-job" style={{ padding: '30px', textAlign: 'center', background: '#fff', borderRadius: '12px', border: '1.5px solid #eee' }}>
            <span style={{ fontSize: '32px' }}>💤</span>
            <p style={{ margin: '8px 0 0', color: '#666', fontSize: '14px' }}>
              You are currently <strong>Offline</strong>. Set duty status to <strong>Online</strong> at the top to display and receive incoming booking requests.
            </p>
          </div>
        ) : !isSubscribed ? (
          <div className="no-active-job" style={{ padding: '30px', textAlign: 'center', background: '#fff', borderRadius: '12px', border: '1.5px solid #eee' }}>
            <span style={{ fontSize: '32px' }}>🔒</span>
            <p style={{ margin: '8px 0 0', color: '#666', fontSize: '14px' }}>
              Active dispatch list is locked. Please navigate to the <strong>Wallet</strong> tab and purchase an active subscription package to unlock booking dispatch requests.
            </p>
          </div>
        ) : pendingRequests.length === 0 ? (
          <div className="no-active-job" style={{ padding: '30px', textAlign: 'center', background: '#fff', borderRadius: '12px', border: '1.5px solid #eee' }}>
            <span style={{ fontSize: '32px' }}>🛰️</span>
            <p style={{ margin: '8px 0 0', color: '#666', fontSize: '14px' }}>
              Listening for dispatch requests... New jobs within your radius will appear here instantly.
            </p>
          </div>
        ) : (
          <div className="txn-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {pendingRequests.map(req => (
              <div key={req.id} className="txn-item" style={{ background: '#fff', padding: '16px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', border: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ background: req.bookingType === 'instant' ? '#eff6ff' : '#fef3c7', color: req.bookingType === 'instant' ? '#2563eb' : '#d97706', fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '10px', display: 'inline-block', marginBottom: '6px' }}>
                      {req.bookingType === 'instant' ? '⚡ INSTANT' : '📅 SCHEDULED'}
                    </span>
                    <strong style={{ display: 'block', fontSize: '16px', color: '#1a1a1a' }}>{req.vehicle.name}</strong>
                    <span style={{ display: 'block', fontSize: '12px', color: '#888', marginTop: '4px' }}>
                      📍 {req.booking.location}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--primary)' }}>₹{req.booking.total?.toLocaleString()}</div>
                    <span style={{ fontSize: '11px', color: '#888' }}>
                      {req.booking.duration} {req.vehicle.unit === 'hr' ? 'hrs' : 'trips'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #f9f9f9', paddingTop: '10px' }}>
                  <button
                    onClick={() => handleRejectRequest(req.id)}
                    style={{ flex: 1, border: '1px solid #fca5a5', color: '#dc2626', background: '#fff', padding: '8px', borderRadius: '8px', fontWeight: '600', fontSize: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                  >
                    <HiX /> Reject
                  </button>
                  <button
                    onClick={() => handleAcceptRequest(req.id)}
                    disabled={!!activeJob}
                    style={{ flex: 2, background: !!activeJob ? '#ccc' : 'var(--primary)', color: '#fff', border: 'none', padding: '8px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: !!activeJob ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                  >
                    <HiCheck /> Accept Booking
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── AVAILABILITY & DUTY SETTINGS ── */}
      <div className="worker-section" style={{ background: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
        <h2>Duty & Schedule Management</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '14px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f9f9f9', paddingBottom: '12px' }}>
            <div>
              <strong style={{ fontSize: '14px', color: '#333', display: 'block' }}>Vacation Mode</strong>
              <span style={{ fontSize: '12px', color: '#888' }}>Temporarily pause duty listings</span>
            </div>
            <button
              className={`toggle-btn ${vacation ? 'on' : 'off'}`}
              onClick={handleToggleVacation}
              style={{ background: vacation ? '#ef4444' : '#ccc' }}
            >
              {vacation ? 'ON' : 'OFF'}
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f9f9f9', paddingBottom: '12px' }}>
            <div>
              <strong style={{ fontSize: '14px', color: '#333', display: 'block' }}>Set Working Hours</strong>
              <span style={{ fontSize: '12px', color: '#888' }}>Operational availability schedule</span>
            </div>
            <select
              className="auth-select"
              value={hours}
              onChange={e => handleUpdateHours(e.target.value)}
              style={{ width: '160px', padding: '6px 10px', fontSize: '13px', background: '#fafafa', borderRadius: '8px' }}
            >
              <option value="09:00 - 18:00">09:00 AM - 06:00 PM</option>
              <option value="08:00 - 20:00">08:00 AM - 08:00 PM</option>
              <option value="06:00 - 14:00">06:00 AM - 02:00 PM</option>
              <option value="14:00 - 22:00">02:00 PM - 10:00 PM</option>
              <option value="24 Hours">24 Hours Duty</option>
            </select>
          </div>

          {/* Block Dates */}
          <div>
            <strong style={{ fontSize: '14px', color: '#333', display: 'block', marginBottom: '8px' }}>Block Specific Dates</strong>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <input
                type="date"
                value={blockDate}
                onChange={e => setBlockDate(e.target.value)}
                style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '13px' }}
              />
              <button
                type="button"
                onClick={handleAddBlockedDate}
                style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}
              >
                Block Date
              </button>
            </div>
            {blockedDates.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {blockedDates.map(d => (
                  <span
                    key={d}
                    style={{
                      background: '#f3f4f6',
                      border: '1px solid #e5e5e5',
                      padding: '4px 10px',
                      borderRadius: '16px',
                      fontSize: '11px',
                      color: '#4b5563',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>{d}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveBlockedDate(d)}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, color: '#dc2626', fontWeight: '700' }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}
