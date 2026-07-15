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
import Map, { Marker, Source, Layer } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import './Worker.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoiYW5zYXIta2hhbiIsImEiOiJjbXJpbGU3aGQxcDh2Mnlxem16czZqeXRoIn0.82kFrUjOX09W8Hki5ARTkw';

const getCustomerOtp = (customer) => {
  if (!customer) return '4821';
  const digits = customer.phone ? customer.phone.replace(/\D/g, '') : '';
  if (digits.length >= 4) return digits.slice(-4);
  return '4821';
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) return null;
  if (lat1 === null || lon1 === null || lat2 === null || lon2 === null) return null;
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

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
  const sendWorkerMessage = useStore(s => s.sendWorkerMessage);
  const rejectActiveJob = useStore(s => s.rejectActiveJob);
  const fetchOrdersForWorker = useStore(s => s.fetchOrdersForWorker);
  const verifyCompletionOtp = useStore(s => s.verifyCompletionOtp);

  const [simulatedFiles, setSimulatedFiles] = useState([]);
  const [completeSuccess, setCompleteSuccess] = useState(false);
  const [customMsg, setCustomMsg] = useState('I am on my way. Kindly wait');
  const [messageSentStatus, setMessageSentStatus] = useState('');
  const [currentLocInput, setCurrentLocInput] = useState('');
  const [locMessage, setLocMessage] = useState('');

  // Cancellation States
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('Unable to reach the location');
  const [customCancelReason, setCustomCancelReason] = useState('');

  // Payment Collection States
  const [paymentMode, setPaymentMode] = useState(null);

  // Selected details request for Available Job popup modal
  const [selectedDetailsRequest, setSelectedDetailsRequest] = useState(null);

  // Navigation Mode: 'google' | 'inapp'
  const [navMode, setNavMode] = useState('google');

  // Cockpit navigation states
  const [isNavigating, setIsNavigating] = useState(false);
  const [navSteps, setNavSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [mapViewState, setMapViewState] = useState({
    latitude: 12.9716,
    longitude: 77.5946,
    zoom: 15
  });

  // Availability Settings States
  const [hours, setHours] = useState(user.availability?.hours || '09:00 - 18:00');
  const [vacation, setVacation] = useState(user.availability?.vacation || false);
  const [blockDate, setBlockDate] = useState('');
  const [blockedDates, setBlockedDates] = useState(user.availability?.blockedDates || []);

  const myOrders = orders.filter(o => o.operator?.id === user.id);
  const activeJob = myOrders.find(o => ['assigned', 'active', 'arrived'].includes(o.status));
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

  const isSubscribed = !!user.subscription?.active;

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
  const handleAcceptRequest = async (orderId) => {
    if (!isSubscribed) {
      alert("⚠️ Your subscription is inactive or expired. Please purchase or renew your subscription package to accept booking requests.");
      return;
    }
    const res = await assignWorker(orderId, {
      id: user.id,
      name: user.name,
      phone: user.phone,
      rating: user.rating,
      vehicle: user.vehicle,
      photo: user.photo
    });
    if (res && res.error) {
      alert(res.error);
    }
  };

  const handleRejectRequest = (orderId) => {
    rejectOrder(orderId, user.id);
  };

  const [customerCoords, setCustomerCoords] = useState(null);
  const [routeGeojson, setRouteGeojson] = useState(null);
  const [eta, setEta] = useState(null);
  const [workerCoords, setWorkerCoords] = useState({ lat: 12.9716, lng: 77.5946 });

  const [isSimulating, setIsSimulating] = useState(false);
  const [slideVal, setSlideVal] = useState(0);
  const [otpInput, setOtpInput] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState('');

  useEffect(() => {
    // Watch location if worker is available/online OR has an active job
    if (!user.available && !activeJob) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setWorkerCoords({ lat: latitude, lng: longitude });
          updateWorkerLocation(latitude, longitude);
        },
        (err) => console.warn(err)
      );
    }

    const handleSuccess = (position) => {
      const { latitude, longitude } = position.coords;
      setWorkerCoords({ lat: latitude, lng: longitude });
      updateWorkerLocation(latitude, longitude);
    };

    const handleError = (err) => {
      console.error("Worker watch position error:", err);
    };

    const watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      maximumAge: 10000,
      timeout: 10000
    });

    return () => navigator.geolocation.clearWatch(watchId);
  }, [user.available, activeJob?.id, activeJob?.stage]);

  useEffect(() => {
    if (!isSimulating || !customerCoords) return;

    const interval = setInterval(() => {
      setWorkerCoords(prev => {
        const latDiff = customerCoords.lat - prev.lat;
        const lngDiff = customerCoords.lng - prev.lng;
        
        if (Math.abs(latDiff) < 0.0001 && Math.abs(lngDiff) < 0.0001) {
          setIsSimulating(false);
          setIsNavigating(false);
          return prev;
        }

        // Advance turn-by-turn banner step index sequentially during drive
        if (navSteps.length > 0) {
          setCurrentStepIndex(idx => (idx + 1) % navSteps.length);
        }

        // Move 15% closer to destination
        const nextLat = prev.lat + latDiff * 0.15;
        const nextLng = prev.lng + lngDiff * 0.15;

        // Sync to backend DB
        updateWorkerLocation(nextLat, nextLng);

        return { lat: nextLat, lng: nextLng };
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isSimulating, customerCoords, navSteps.length]);

  useEffect(() => {
    if (!activeJob) return;
    
    if (activeJob.booking?.lat && activeJob.booking?.lng) {
      setCustomerCoords({ lat: Number(activeJob.booking.lat), lng: Number(activeJob.booking.lng) });
      return;
    }

    const token = MAPBOX_TOKEN;
    if (!token) return;

    const resolveCustAddress = async () => {
      try {
        const query = activeJob.booking?.location;
        if (!query) return;
        const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&limit=1`);
        const data = await res.json();
        if (data.features && data.features.length > 0) {
          const [lng, lat] = data.features[0].center;
          setCustomerCoords({ lat, lng });
        }
      } catch (err) {
        console.error("Worker side customer address geocoding failed:", err);
      }
    };
    resolveCustAddress();
  }, [activeJob?.id, activeJob?.booking?.location]);

  useEffect(() => {
    if (activeJob) {
      setOtpVerified(!!activeJob.otpVerified);
    } else {
      setOtpVerified(false);
    }
  }, [activeJob?.id, activeJob?.otpVerified]);

  useEffect(() => {
    if (!customerCoords || !workerCoords) return;
    const token = MAPBOX_TOKEN;
    if (!token) return;

    const fetchWorkerRoute = async () => {
      try {
        const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${workerCoords.lng},${workerCoords.lat};${customerCoords.lng},${customerCoords.lat}?geometries=geojson&steps=true&access_token=${token}`;
        const res = await fetch(url);
        const json = await res.json();
        if (json.routes && json.routes.length > 0) {
          const route = json.routes[0];
          setRouteGeojson(route.geometry);
          const durationMin = Math.round(route.duration / 60);
          const distanceKm = (route.distance / 1000).toFixed(1);
          setEta(`${durationMin} mins (${distanceKm} km away)`);

          if (route.legs && route.legs[0] && route.legs[0].steps) {
            setNavSteps(route.legs[0].steps.map(s => s.maneuver.instruction));
          }
        }
      } catch (e) {
        console.error("Failed to fetch route on worker side:", e);
      }
    };
    fetchWorkerRoute();
  }, [customerCoords, workerCoords]);


  useEffect(() => {
    if (workerCoords) {
      setMapViewState(prev => ({
        ...prev,
        latitude: workerCoords.lat,
        longitude: workerCoords.lng
      }));
    }
  }, [workerCoords]);

  const handleAdvanceStage = () => {
    if (!activeJob) return;
    advanceStage(activeJob.id);
  };

  const handleMapClick = (e) => {
    const { lng, lat } = e.lngLat;
    setWorkerCoords({ lat, lng });
    updateWorkerLocation(lat, lng);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!activeJob) return;
    setOtpError('');
    const res = await verifyCompletionOtp(activeJob.id, otpInput);
    if (res && res.success) {
      setOtpVerified(true);
      setOtpError('');
    } else {
      setOtpError(res?.error || 'Invalid OTP. Please enter the same customer verification code.');
    }
  };

  const handleSendMsg = async (e) => {
    if (e) e.preventDefault();
    if (!activeJob) return;
    try {
      await sendWorkerMessage(activeJob.id, customMsg);
      setMessageSentStatus(`Sent: "${customMsg}"`);
      setTimeout(() => setMessageSentStatus(''), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateLocationByName = async (e) => {
    if (e) e.preventDefault();
    if (!currentLocInput.trim()) return;
    const token = MAPBOX_TOKEN;
    if (!token) return;

    try {
      const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(currentLocInput)}.json?access_token=${token}&limit=1`);
      const data = await res.json();
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        setWorkerCoords({ lat, lng });
        updateWorkerLocation(lat, lng);
        setLocMessage(`🟢 Location manually updated to: ${data.features[0].place_name}`);
        setTimeout(() => setLocMessage(''), 5000);
      } else {
        setLocMessage('❌ Location not found. Try another search.');
      }
    } catch (err) {
      console.error(err);
      setLocMessage('❌ Error resolving address.');
    }
  };

  const handleFetchGpsLocation = () => {
    if (!navigator.geolocation) {
      alert("GPS is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setWorkerCoords({ lat: latitude, lng: longitude });
        updateWorkerLocation(latitude, longitude);
        setLocMessage("🟢 GPS location fetched and updated successfully!");
        setTimeout(() => setLocMessage(''), 5000);
      },
      (err) => {
        console.warn(err);
        alert("Unable to fetch GPS. Make sure location permission is allowed and HTTPS is active.");
      },
      { enableHighAccuracy: true }
    );
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
    addWorkerEarning(user.id, amount, `Completed Project #${activeJob.id} - Paid via ${paymentMode.toUpperCase()}`);
    
    // 2. Advance stage to completed, passing payment mode
    advanceStage(activeJob.id, paymentMode);
    setCompleteSuccess(true);
    setSimulatedFiles([]);
    setOtpVerified(false);
    setOtpInput('');
    setPaymentMode(null);
    setTimeout(() => setCompleteSuccess(false), 5000);
  };

  const handleCancelJob = async (e) => {
    e.preventDefault();
    const finalReason = cancelReason === 'Other' ? customCancelReason : cancelReason;
    if (!finalReason.trim()) {
      alert('Please specify a reason for cancellation.');
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${activeJob.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          status: 'pending',
          rejectWorkerId: user.id,
          cancelReason: cancelReason,
          cancelDetails: finalReason
        })
      });
      if (response.ok) {
        alert('Assignment cancelled successfully. The order has been returned to the pool for other workers.');
        fetchOrdersForWorker(user.id);
        setShowCancelModal(false);
        setCustomCancelReason('');
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to cancel job');
      }
    } catch (err) {
      console.error(err);
      alert('Network error releasing assignment.');
    }
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#888' }}>
                {activeJob.bookingType === 'instant' ? '⚡ Instant Dispatch' : '📅 Scheduled'}
              </span>
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                style={{
                  background: '#fee2e2',
                  color: '#dc2626',
                  border: '1px solid #fca5a5',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                ❌ Cancel Request
              </button>
            </div>
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

            {/* Dynamic Specifications */}
            {activeJob.vehicle?.custom_fields && activeJob.vehicle.custom_fields.length > 0 && (
              <div style={{ marginTop: '12px', background: '#f8fafc', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>📋 Selected Specifications:</span>
                {activeJob.vehicle.custom_fields.map(f => {
                  const val = activeJob.customAnswers?.[f.id];
                  if (val && val.startsWith('data:image/')) {
                    return (
                      <div key={f.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '13px', color: '#475569', fontWeight: '600' }}>{f.name}:</span>
                        <div style={{ maxWidth: '80px', cursor: 'pointer' }} onClick={() => window.open(val)}>
                          <img src={val} alt="Spec Image" style={{ maxWidth: '100%', maxHeight: '60px', borderRadius: '6px', border: '1px solid #ddd', objectFit: 'cover' }} />
                        </div>
                      </div>
                    );
                  } else if (val && val.startsWith('data:application/pdf')) {
                    return (
                      <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                        <span style={{ color: '#475569', fontWeight: '600' }}>{f.name}:</span>
                        <a href={val} download={`spec_${f.name}.pdf`} style={{ color: 'var(--primary)', fontWeight: '800', textDecoration: 'underline' }}>
                          📁 PDF Document
                        </a>
                      </div>
                    );
                  } else {
                    return (
                      <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <span style={{ color: '#475569', fontWeight: '600' }}>{f.name}:</span>
                        <strong style={{ color: '#0f172a' }}>{val || '—'}</strong>
                      </div>
                    );
                  }
                })}
              </div>
            )}
          </div>



          {/* ── NAVIGATION OPTIONS BAR ── */}
          <div style={{ marginBottom: '20px', background: '#f8fafc', borderRadius: '14px', padding: '16px', border: '1.5px solid #e2e8f0' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              🗺️ Navigation
            </div>
            {/* Tab toggle */}
            <div style={{ display: 'flex', background: '#e2e8f0', borderRadius: '10px', padding: '3px', marginBottom: '14px' }}>
              <button
                type="button"
                onClick={() => setNavMode('google')}
                style={{
                  flex: 1, padding: '8px', borderRadius: '8px', border: 'none', fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                  background: navMode === 'google' ? '#fff' : 'transparent',
                  color: navMode === 'google' ? '#4f46e5' : '#64748b',
                  boxShadow: navMode === 'google' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                🌐 Google Maps
              </button>
              <button
                type="button"
                onClick={() => setNavMode('inapp')}
                style={{
                  flex: 1, padding: '8px', borderRadius: '8px', border: 'none', fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                  background: navMode === 'inapp' ? '#fff' : 'transparent',
                  color: navMode === 'inapp' ? '#4f46e5' : '#64748b',
                  boxShadow: navMode === 'inapp' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                📍 In-App Navigation
              </button>
            </div>

            {navMode === 'google' ? (
              /* Google Maps Prominent Button */
              <div>
                <a
                  href={activeJob.booking.lat && activeJob.booking.lng
                    ? `https://www.google.com/maps/dir/?api=1&destination=${activeJob.booking.lat},${activeJob.booking.lng}`
                    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeJob.booking.location)}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                    background: 'linear-gradient(135deg, #4285f4, #0f9d58)',
                    color: '#fff', padding: '14px 20px', borderRadius: '12px',
                    fontSize: '15px', fontWeight: '800', textDecoration: 'none',
                    boxShadow: '0 4px 14px rgba(66,133,244,0.35)',
                    letterSpacing: '0.3px'
                  }}
                >
                  <span style={{ fontSize: '22px' }}>🗺️</span>
                  <span>Open in Google Maps</span>
                </a>
                {eta && (
                  <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '13px', color: '#64748b', fontWeight: '600' }}>
                    ⏰ ETA: {eta}
                  </div>
                )}
              </div>
            ) : (
              /* In-App Mapbox Navigation */
              <div>
                {MAPBOX_TOKEN && customerCoords ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#333' }}>Live Route (Mapbox)</span>
                      {eta && <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: '700' }}>⏰ {eta}</span>}
                    </div>
                    <div style={{ width: '100%', height: '340px', borderRadius: '16px', overflow: 'hidden', position: 'relative', border: '1.5px solid #cbd5e1', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
                      <Map
                        {...mapViewState}
                        onMove={e => setMapViewState(e.viewState)}
                        onClick={handleMapClick}
                        style={{ width: '100%', height: '100%', cursor: 'pointer' }}
                        mapStyle="mapbox://styles/mapbox/streets-v12"
                        mapboxAccessToken={MAPBOX_TOKEN}
                      >
                        <Marker longitude={customerCoords.lng} latitude={customerCoords.lat} anchor="bottom">
                          <div style={{ fontSize: '28px', filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.45))' }}>📍</div>
                        </Marker>
                        <Marker longitude={workerCoords.lng} latitude={workerCoords.lat} anchor="center">
                          <div style={{
                            width: '32px', height: '32px', background: 'var(--primary)', color: '#fff', borderRadius: '50%', border: '3px solid #fff', boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 'bold'
                          }}>🛵</div>
                        </Marker>
                        {routeGeojson && (
                          <Source id="route" type="geojson" data={{ type: 'Feature', geometry: routeGeojson }}>
                            <Layer id="route-line" type="line" paint={{ 'line-color': '#3b82f6', 'line-width': 6, 'line-opacity': 0.85 }} />
                          </Source>
                        )}
                      </Map>

                      {/* START NAVIGATION OVERLAY */}
                      {!isNavigating && (
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(1px)' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setIsNavigating(true);
                              if (workerCoords) {
                                setMapViewState(v => ({ ...v, latitude: workerCoords.lat, longitude: workerCoords.lng, zoom: 16 }));
                              }
                            }}
                            style={{
                              background: 'var(--primary)', color: '#fff', border: 'none', padding: '14px 28px', borderRadius: '12px', fontSize: '15px', fontWeight: '800', cursor: 'pointer',
                              boxShadow: '0 8px 20px rgba(79,70,229,0.35)', display: 'flex', alignItems: 'center', gap: '8px', transition: 'transform 0.15s ease'
                            }}
                          >
                            <span>🚀 Start In-App Navigation</span>
                          </button>
                        </div>
                      )}

                      {/* TOP TURN-BY-TURN HUD BANNER */}
                      {isNavigating && (
                        <div style={{ position: 'absolute', top: '12px', left: '12px', right: '12px', background: 'rgba(15,23,42,0.92)', color: '#fff', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 8px 16px rgba(0,0,0,0.2)' }}>
                          <span style={{ fontSize: '24px' }}>
                            {navSteps[currentStepIndex]?.toLowerCase().includes('left') ? '⬅️' :
                             navSteps[currentStepIndex]?.toLowerCase().includes('right') ? '➡️' : '⬆️'}
                          </span>
                          <div>
                            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Next Maneuver:</div>
                            <div style={{ fontSize: '13px', fontWeight: '700', color: '#f8fafc', marginTop: '1px' }}>
                              {navSteps[currentStepIndex] || 'Continue on route to destination'}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* BOTTOM INFORMATION HUD OVERLAY */}
                      {isNavigating && (
                        <div style={{ position: 'absolute', bottom: '12px', left: '12px', right: '12px', background: 'rgba(255,255,255,0.96)', padding: '12px 14px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 8px 16px rgba(0,0,0,0.15)', border: '1px solid #e2e8f0', backdropFilter: 'blur(4px)' }}>
                          <div>
                            <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>{eta || 'Computing...'}</div>
                            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Estimated Travel Info</span>
                          </div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => setIsSimulating(!isSimulating)}
                              style={{
                                background: isSimulating ? '#ef4444' : '#10b981', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer'
                              }}
                            >
                              {isSimulating ? '⏸️ Pause' : '🛵 Drive'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setIsNavigating(false);
                                setIsSimulating(false);
                              }}
                              style={{
                                background: '#64748b', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer'
                              }}
                            >
                              Exit
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {!isNavigating && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                        <span style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>
                          💡 Tip: Click anywhere on the map to manually set your location.
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsSimulating(!isSimulating)}
                          style={{
                            background: isSimulating ? '#ef4444' : 'var(--primary)', color: '#fff', border: 'none',
                            padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer'
                          }}
                        >
                          {isSimulating ? '⏹️ Stop Simulation' : '🛵 Test Ride'}
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#888', fontSize: '13px' }}>
                    🛰️ Initializing GPS...
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ background: '#fafafa', padding: '14px', borderRadius: '10px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#666' }}>Progress Status:</span>
            <strong style={{ fontSize: '14px', color: 'var(--primary)' }}>
              {activeJob.stages[activeJob.stage]}
            </strong>
          </div>

          {/* Upload Completion Images & verification section in Stage 3 */}
          {activeJob.stage === 3 && (
            <>
              {!otpVerified ? (
                <div style={{ marginBottom: '16px', background: '#f5f3ff', border: '1.5px solid #ddd6fe', padding: '16px', borderRadius: '12px' }}>
                  <h4 style={{ margin: '0 0 8px', fontSize: '13.5px', fontWeight: '800', color: '#6d28d9', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    🔑 Enter Customer Completion OTP
                  </h4>
                  <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#4c1d95', fontWeight: '600', lineHeight: '1.4' }}>
                    💡 Please ask the customer to share the <strong>SAME 4-digit code</strong> used at arrival. Enter it below to unlock completion payment confirmation:
                  </p>
                  <form onSubmit={handleVerifyOtp} style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      maxLength={4}
                      placeholder="Enter 4-digit code"
                      value={otpInput}
                      onChange={e => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', textAlign: 'center', fontWeight: 'bold', letterSpacing: '4px' }}
                      required
                    />
                    <button type="submit" style={{ background: '#6d28d9', color: '#fff', border: 'none', padding: '0 16px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
                      Verify OTP
                    </button>
                  </form>
                  {otpError && <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '6px', fontWeight: '600' }}>⚠️ {otpError}</div>}
                </div>
              ) : (
                <div style={{ marginBottom: '16px', background: '#ecfdf5', border: '1.5px solid #a7f3d0', padding: '14px', borderRadius: '10px' }}>
                  <div style={{ color: '#065f46', fontSize: '13px', fontWeight: '700' }}>
                    ✅ OTP Verified Successfully!
                  </div>

                  {/* Payment Collection Selection */}
                  <div style={{ border: '1.5px dashed #ddd', padding: '12px', borderRadius: '8px', background: '#fff' }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>💵 Record Payment Received:</div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => setPaymentMode('cash')}
                        style={{
                          flex: 1,
                          padding: '10px',
                          background: paymentMode === 'cash' ? '#10b981' : '#f8fafc',
                          color: paymentMode === 'cash' ? '#fff' : '#475569',
                          border: '1.5px solid',
                          borderColor: paymentMode === 'cash' ? '#10b981' : '#cbd5e1',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        💵 Cash Collection
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMode('online')}
                        style={{
                          flex: 1,
                          padding: '10px',
                          background: paymentMode === 'online' ? '#3b82f6' : '#f8fafc',
                          color: paymentMode === 'online' ? '#fff' : '#475569',
                          border: '1.5px solid',
                          borderColor: paymentMode === 'online' ? '#3b82f6' : '#cbd5e1',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        📱 Online / UPI
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Action Buttons based on stages:
              stage 1 -> Mark as En Route
              stage 2 -> Swipe to Arrive (Mock slider)
              stage 3 -> Mark as Completed (locked behind OTP) */}
          {activeJob.stage === 1 && (
            <button className="aj-advance" onClick={handleAdvanceStage} style={{ width: '100%', background: 'var(--primary)', color: '#fff', padding: '14px', borderRadius: '10px', border: 'none', fontWeight: '700', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}>
              <span>Start En Route</span>
              <HiArrowRight style={{ width: 16, height: 16 }} />
            </button>
          )}

          {activeJob.stage === 2 && (
            <div style={{ width: '100%', marginTop: '10px' }}>
              <div style={{ position: 'relative', width: '100%', height: '56px', background: '#3b82f6', borderRadius: '28px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#fff', fontWeight: '700', fontSize: '14px', zIndex: 1, pointerEvents: 'none', textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
                  {slideVal >= 100 ? 'Release to Confirm Arrived' : '➡️ Swipe to Arrive'}
                </span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={slideVal}
                  onChange={e => {
                    const val = Number(e.target.value);
                    setSlideVal(val);
                    if (val >= 100) {
                      handleAdvanceStage();
                      setSlideVal(0);
                    }
                  }}
                  onMouseUp={() => setSlideVal(0)}
                  onTouchEnd={() => setSlideVal(0)}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'pointer',
                    zIndex: 3
                  }}
                />
                <div style={{
                  position: 'absolute',
                  left: `calc(3px + ${slideVal}% * 0.8)`,
                  top: '3px',
                  width: '50px',
                  height: '50px',
                  background: '#fff',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                  pointerEvents: 'none',
                  fontSize: '20px',
                  color: '#3b82f6',
                  zIndex: 2,
                  transition: slideVal === 0 ? 'left 0.2s ease-out' : 'none'
                }}>
                  ➡️
                </div>
              </div>
            </div>
          )}

          {activeJob.stage === 3 && (
            <button
              className="aj-advance"
              onClick={handleCompleteJob}
              disabled={!otpVerified || !paymentMode}
              style={{
                width: '100%',
                background: (otpVerified && paymentMode) ? '#10b981' : '#ccc',
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
                cursor: (otpVerified && paymentMode) ? 'pointer' : 'not-allowed'
              }}
            >
              <span>Complete Service Job</span>
              <HiCheckCircle style={{ width: 18, height: 18 }} />
            </button>
          )}

          {/* Cancellation button for active assignment */}
          {(activeJob.stage === 1 || activeJob.stage === 2) && (
            <button
              type="button"
              onClick={() => setShowCancelModal(true)}
              style={{
                width: '100%',
                background: '#fef2f2',
                border: '1.5px solid #fca5a5',
                color: '#b91c1c',
                padding: '12px',
                borderRadius: '10px',
                fontWeight: '700',
                fontSize: '13px',
                marginTop: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <span>❌ Cancel Job Assignment</span>
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
            {pendingRequests.map(req => {
              const distanceVal = calculateDistance(workerCoords.lat, workerCoords.lng, req.booking?.lat, req.booking?.lng);
              const formattedDistance = distanceVal !== null ? `${distanceVal.toFixed(1)} km` : '3.2 km';
              const formattedTravel = distanceVal !== null ? `${(distanceVal * 1.3).toFixed(1)} km` : '4.1 km';
              const bookingTimeStr = req.createdAt ? new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A';

              return (
                <div key={req.id} className="txn-item" style={{ background: '#fff', padding: '18px', borderRadius: '14px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                        <span style={{ background: req.bookingType === 'instant' ? '#eff6ff' : '#fef3c7', color: req.bookingType === 'instant' ? '#2563eb' : '#d97706', fontSize: '10.5px', fontWeight: '800', padding: '3px 8px', borderRadius: '8px', textTransform: 'uppercase' }}>
                          {req.bookingType === 'instant' ? '⚡ Instant' : '📅 Scheduled'}
                        </span>
                        {req.vehicle?.categoryLabel && (
                          <span style={{ background: '#f1f5f9', color: '#475569', fontSize: '10.5px', fontWeight: '800', padding: '3px 8px', borderRadius: '8px' }}>
                            🛠️ {req.vehicle.categoryLabel}
                          </span>
                        )}
                      </div>
                      <strong style={{ display: 'block', fontSize: '16.5px', color: '#0f172a', fontWeight: '800' }}>{req.vehicle?.name}</strong>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px', fontSize: '12.5px', color: '#475569' }}>
                        <div>📍 <span style={{ fontWeight: '500' }}>Location:</span> {req.booking?.location}</div>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', color: '#64748b', fontSize: '12px', marginTop: '2px' }}>
                          <span>📏 Straight Distance: <strong>{formattedDistance}</strong></span>
                          <span>🛵 Est. Travel: <strong>{formattedTravel}</strong></span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                          ⏰ Booked at: <strong>{bookingTimeStr}</strong>
                        </div>
                        {req.vehicle?.custom_fields && req.vehicle.custom_fields.length > 0 && (
                          <div style={{ marginTop: '10px', background: '#f8fafc', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>📋 Requirements:</span>
                            {req.vehicle.custom_fields.map(f => {
                              const val = req.customAnswers?.[f.id];
                              if (val && val.startsWith('data:image/')) {
                                return (
                                  <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px' }}>
                                    <span style={{ color: '#475569', fontWeight: '600' }}>{f.name}:</span>
                                    <img src={val} alt="Spec" style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover', border: '1px solid #ddd' }} />
                                  </div>
                                );
                              } else if (val && val.startsWith('data:application/pdf')) {
                                return (
                                  <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px' }}>
                                    <span style={{ color: '#475569', fontWeight: '600' }}>{f.name}:</span>
                                    <span style={{ color: 'var(--primary)', fontWeight: '700' }}>📁 PDF Attached</span>
                                  </div>
                                );
                              } else {
                                return (
                                  <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                                    <span style={{ color: '#475569', fontWeight: '600' }}>{f.name}:</span>
                                    <strong style={{ color: '#0f172a' }}>{val || '—'}</strong>
                                  </div>
                                );
                              }
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '20px', fontWeight: '900', color: '#4f46e5' }}>₹{req.booking?.total?.toLocaleString()}</div>
                      <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>
                        {req.booking?.duration} {req.vehicle?.unit === 'hr' ? 'hrs' : 'trips'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '12px', marginTop: '4px' }}>
                    <button
                      onClick={() => handleRejectRequest(req.id)}
                      style={{ flex: 1, border: '1.5px solid #fca5a5', color: '#dc2626', background: '#fff', padding: '10px', borderRadius: '10px', fontWeight: '700', fontSize: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4.5px' }}
                    >
                      <HiX /> Reject
                    </button>
                    <button
                      onClick={() => setSelectedDetailsRequest(req)}
                      style={{ flex: 1.5, border: '1.5px solid #3b82f6', color: '#3b82f6', background: '#fff', padding: '10px', borderRadius: '10px', fontWeight: '700', fontSize: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4.5px' }}
                    >
                      🔍 View Details
                    </button>
                    <button
                      onClick={() => handleAcceptRequest(req.id)}
                      disabled={!!activeJob}
                      style={{ flex: 1.5, background: !!activeJob ? '#cbd5e1' : 'var(--primary)', color: '#fff', border: 'none', padding: '10px', borderRadius: '10px', fontWeight: '800', fontSize: '12px', cursor: !!activeJob ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4.5px', boxShadow: !!activeJob ? 'none' : '0 4px 10px rgba(79,70,229,0.2)' }}
                    >
                      <HiCheck /> Accept
                    </button>
                  </div>
                </div>
              );
            })}
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

      {showCancelModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '480px',
            width: '100%',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            border: '1.5px solid #eee'
          }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '18px', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ⚠️ Cancel Assignment Warning
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#4b5563', lineHeight: '1.6' }}>
              Cancelling active assignments impacts your driver score, service reliability rating, and search visibility.
            </p>
            
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>
              Reason for Cancellation:
            </label>
            <select
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1.5px solid #d1d5db',
                fontSize: '13px',
                marginBottom: '16px',
                outline: 'none'
              }}
            >
              <option value="Unable to reach the location">📍 Unable to reach the location</option>
              <option value="Too far from current location">📏 Too far from current location</option>
              <option value="Unable to contact customer">📞 Unable to contact customer</option>
              <option value="Vehicle/transport issue">🔧 Vehicle / transport issue</option>
              <option value="Already assigned another service">📋 Already assigned another service</option>
              <option value="Personal emergency">🚨 Personal emergency</option>
              <option value="Not available">⏸️ Not available right now</option>
              <option value="Other">📝 Other (describe below)</option>
            </select>

            {cancelReason === 'Other' && (
              <textarea
                placeholder="Please write down your reason here..."
                value={customCancelReason}
                onChange={e => setCustomCancelReason(e.target.value)}
                style={{
                  width: '100%',
                  height: '80px',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1.5px solid #d1d5db',
                  fontSize: '13px',
                  marginBottom: '16px',
                  fontFamily: 'inherit',
                  resize: 'none',
                  outline: 'none'
                }}
              />
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#f3f4f6',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#4b5563',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                No, Go Back
              </button>
              <button
                type="button"
                onClick={async () => {
                  const finalReason = cancelReason === 'Other' ? customCancelReason : cancelReason;
                  await rejectActiveJob(activeJob.id, user.id, cancelReason, finalReason);
                  setShowCancelModal(false);
                  alert("Order has been cancelled and returned to pool. Your cancel reason: " + finalReason);
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#dc2626',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SERVICE REQUEST DETAILS POPUP MODAL ── */}
      {selectedDetailsRequest && (() => {
        const req = selectedDetailsRequest;
        const distanceVal = calculateDistance(workerCoords.lat, workerCoords.lng, req.booking?.lat, req.booking?.lng);
        const formattedDistance = distanceVal !== null ? `${distanceVal.toFixed(1)} km` : '3.2 km';
        const estTravelMinutes = distanceVal !== null ? (distanceVal * 2.0).toFixed(0) : '8';
        const customFields = req.vehicle?.custom_fields || [];
        const customAnswers = req.customAnswers || {};

        return (
          <div className="invoice-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={() => setSelectedDetailsRequest(null)}>
            <div className="invoice-modal-card" style={{ background: '#fff', width: '100%', maxWidth: '500px', borderRadius: '20px', padding: '24px', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
              <button style={{ position: 'absolute', right: '20px', top: '20px', border: 'none', background: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b', fontWeight: '800' }} onClick={() => setSelectedDetailsRequest(null)}>×</button>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <span style={{ fontSize: '28px' }}>📋</span>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0f172a', margin: 0 }}>Service Request Details</h3>
                  <span style={{ fontSize: '11px', background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: '800', padding: '2px 8px', borderRadius: '6px', textTransform: 'uppercase', display: 'inline-block', marginTop: '4px' }}>
                    {req.bookingType === 'instant' ? '⚡ Instant' : '📅 Scheduled'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', padding: '16px 0', marginBottom: '18px' }}>
                
                {/* Service Details */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: '#64748b', fontWeight: '600' }}>Service Requested</span>
                  <strong style={{ color: '#0f172a' }}>{req.vehicle?.name}</strong>
                </div>
                {req.vehicle?.categoryLabel && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span style={{ color: '#64748b', fontWeight: '600' }}>Category</span>
                    <strong style={{ color: '#475569' }}>{req.vehicle.categoryLabel}</strong>
                  </div>
                )}

                {/* Pricing / Duration */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: '#64748b', fontWeight: '600' }}>Duration / Scope</span>
                  <strong style={{ color: '#0f172a' }}>{req.booking?.duration} {req.vehicle?.unit === 'hr' ? 'Hours' : 'Trips'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', background: '#f8fafc', padding: '8px 12px', borderRadius: '8px' }}>
                  <span style={{ color: '#64748b', fontWeight: '700' }}>Estimated Payout</span>
                  <strong style={{ color: '#10b981', fontSize: '16px', fontWeight: '800' }}>₹{req.booking?.total?.toLocaleString()}</strong>
                </div>

                {/* Location / Distances */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ color: '#64748b', fontSize: '13px', fontWeight: '600' }}>📍 Service Address</span>
                  <strong style={{ color: '#0f172a', fontSize: '13.5px', lineHeight: '1.4' }}>{req.booking?.location}</strong>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    <span>📏 Distance: <strong>{formattedDistance}</strong></span>
                    <span>🛵 Est. Drive: <strong>{estTravelMinutes} mins</strong></span>
                  </div>
                </div>

                {/* Date & Time */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: '#64748b', fontWeight: '600' }}>Preferred Date/Time</span>
                  <strong style={{ color: '#0f172a' }}>{req.booking?.date} ({req.bookingType === 'instant' ? 'Instant Match' : 'Scheduled'})</strong>
                </div>

                {/* Customer Contact (Privacy Redacted) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', alignItems: 'center' }}>
                  <span style={{ color: '#64748b', fontWeight: '600' }}>Customer Name</span>
                  <strong style={{ color: '#0f172a' }}>{req.customer?.name || 'Customer'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', alignItems: 'center', background: '#fffbeb', border: '1px solid #fef3c7', padding: '6px 10px', borderRadius: '6px', color: '#b45309' }}>
                  <span>Customer Phone</span>
                  <strong style={{ fontSize: '11px', fontWeight: '700' }}>🔒 Hidden until accepted</strong>
                </div>

                {/* Dynamic Custom Fields */}
                {customFields.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px dashed #e2e8f0', paddingTop: '12px', marginTop: '4px' }}>
                    <span style={{ color: '#1e293b', fontSize: '13px', fontWeight: '800' }}>🛠️ Customer Selections</span>
                    <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {customFields.map(f => {
                        const val = customAnswers[f.id];
                        if (val && val.startsWith('data:image/')) {
                          return (
                            <div key={f.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>{f.name}:</span>
                              <div style={{ maxWidth: '100px', cursor: 'pointer' }} onClick={() => window.open(val)}>
                                <img src={val} alt="User Upload" style={{ maxWidth: '100%', maxHeight: '80px', borderRadius: '6px', border: '1.5px solid #ddd', objectFit: 'cover' }} />
                              </div>
                            </div>
                          );
                        } else if (val && val.startsWith('data:application/pdf')) {
                          return (
                            <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                              <span style={{ color: '#64748b', fontWeight: '600' }}>{f.name}:</span>
                              <a href={val} download={`attachment_${f.name}.pdf`} style={{ color: 'var(--primary)', fontWeight: '800', textDecoration: 'underline' }}>
                                📁 PDF Document
                              </a>
                            </div>
                          );
                        } else {
                          return (
                            <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>
                              <span style={{ color: '#64748b', fontWeight: '600' }}>{f.name}:</span>
                              <strong style={{ color: '#0f172a' }}>{val || '—'}</strong>
                            </div>
                          );
                        }
                      })}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {req.booking?.notes && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px dashed #e2e8f0', paddingTop: '12px', marginTop: '4px' }}>
                    <span style={{ color: '#64748b', fontSize: '13px', fontWeight: '600' }}>📝 Instructions / Notes</span>
                    <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12.5px', color: '#475569', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                      {req.booking.notes}
                    </div>
                  </div>
                )}

              </div>

              {/* Accept & Reject Actions inside Modal */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    handleRejectRequest(req.id);
                    setSelectedDetailsRequest(null);
                  }}
                  style={{ flex: 1, padding: '12px', background: '#f8fafc', border: '1.5px solid #fca5a5', color: '#dc2626', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}
                >
                  Reject Request
                </button>
                <button
                  type="button"
                  disabled={!!activeJob}
                  onClick={() => {
                    handleAcceptRequest(req.id);
                    setSelectedDetailsRequest(null);
                  }}
                  style={{ flex: 2, background: !!activeJob ? '#cbd5e1' : 'var(--primary)', border: 'none', color: '#fff', borderRadius: '10px', fontWeight: '800', cursor: !!activeJob ? 'not-allowed' : 'pointer', fontSize: '13px' }}
                >
                  Accept Booking
                </button>
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
}
