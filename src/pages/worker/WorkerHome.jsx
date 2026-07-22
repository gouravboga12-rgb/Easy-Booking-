import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

const calculateBearing = (lat1, lon1, lat2, lon2) => {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) return 0;
  if (lat1 === null || lon1 === null || lat2 === null || lon2 === null) return 0;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  const brng = Math.atan2(y, x) * 180 / Math.PI;
  return (brng + 360) % 360;
};

export default function WorkerHome() {
  const user = useAuthStore(s => s.user);
  const updateWorkerAvailability = useAuthStore(s => s.updateWorkerAvailability);
  const updateWorkerProfile = useAuthStore(s => s.updateWorkerProfile);
  const navigate = useNavigate();
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

  // Manual city/state editing states
  const [isEditingCity, setIsEditingCity] = useState(false);
  const [cityInput, setCityInput] = useState(user.city || '');
  const [stateInput, setStateInput] = useState(user.state || '');

  useEffect(() => {
    if (user) {
      setCityInput(user.city || '');
      setStateInput(user.state || '');
    }
    if (user?.id) {
      fetchOrdersForWorker(user.id);
    }
  }, [user, fetchOrdersForWorker]);

  // Cancellation States
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('Unable to reach the location');
  const [customCancelReason, setCustomCancelReason] = useState('');

  // Upcoming scheduled orders today for reminder banners and alert hooks (future only)
  const upcomingScheduled = orders.filter(o => {
    if (o.operator?.id !== user.id) return false;
    if (o.status !== 'assigned' || o.bookingType !== 'scheduled') return false;
    const today = new Date().toLocaleDateString('en-CA');
    if (o.booking?.date !== today) return false;
    // Only remind if we haven't reached the slot start yet
    if (!o.booking?.timeSlot) return true;
    try {
      const timePart = o.booking.timeSlot.split('-')[0].trim();
      const parts = timePart.split(' ');
      const time = parts[0];
      const ampm = (parts[1] || '').toUpperCase();
      let [hrs, mins] = time.split(':').map(Number);
      if (ampm === 'PM' && hrs !== 12) hrs += 12;
      if (ampm === 'AM' && hrs === 12) hrs = 0;
      const slotMinutes = hrs * 60 + mins;
      const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
      return nowMinutes < slotMinutes + 30; // show until 30 min after slot start
    } catch (e) { return true; }
  });

  useEffect(() => {
    if (upcomingScheduled.length === 0) return;

    // Helper to parse time slot start: e.g. "05:30 PM" or "09:30 AM - 11:30 AM"
    const parseTimeSlotStart = (timeSlotStr) => {
      if (!timeSlotStr) return null;
      try {
        const timePart = timeSlotStr.split('-')[0].trim();
        const parts = timePart.split(' ');
        const time = parts[0];
        const ampm = parts[1] ? parts[1].toUpperCase() : '';
        let [hrs, mins] = time.split(':').map(Number);
        if (ampm === 'PM' && hrs !== 12) hrs += 12;
        if (ampm === 'AM' && hrs === 12) hrs = 0;
        return { hrs, mins };
      } catch (e) {
        return null;
      }
    };

    // Track which reminders we have sent during this session
    const notifiedMap = {};

    const checkReminders = () => {
      const now = new Date();
      const currentHrs = now.getHours();
      const currentMins = now.getMinutes();
      const nowMinutes = currentHrs * 60 + currentMins;

      upcomingScheduled.forEach(o => {
        const timeSlotStr = o.booking?.timeSlot;
        const start = parseTimeSlotStart(timeSlotStr);
        if (!start) return;

        const startMinutes = start.hrs * 60 + start.mins;
        const diffMinutes = startMinutes - nowMinutes;

        // Trigger reminders at 60, 30, and 15 minutes before slot start
        const key = `${o.id}-${diffMinutes}`;
        if ([60, 30, 15].includes(diffMinutes) && !notifiedMap[key]) {
          notifiedMap[key] = true;
          try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            osc.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.35);
          } catch (e) {}

          alert(`⏰ REMINDER: You have a scheduled service order today at ${timeSlotStr || '5:30 PM'} (${diffMinutes} minutes remaining). Please attend the customer on time.`);
        }
      });
    };

    const intervalId = setInterval(checkReminders, 45000); // check every 45s
    checkReminders();
    return () => clearInterval(intervalId);
  }, [upcomingScheduled, user?.id]);

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
    zoom: 15,
    bearing: 0,
    pitch: 0
  });
  const [autoFollow, setAutoFollow] = useState(true);
  const [recalcTrigger, setRecalcTrigger] = useState(0);
  const [lastRecalcCoords, setLastRecalcCoords] = useState(null);
  const [prevCoords, setPrevCoords] = useState(null);

  // Availability Settings States
  const [hours, setHours] = useState(user.availability?.hours || '24 Hours');
  const [vacation, setVacation] = useState(user.availability?.vacation || false);
  const [blockDate, setBlockDate] = useState('');
  const [blockedDates, setBlockedDates] = useState(user.availability?.blockedDates || []);

  const myOrders = orders.filter(o => o.operator?.id === user.id);

  // Helper: check if a scheduled order's time slot has arrived (within 30-min window)
  const isScheduledTimeArrived = (order) => {
    if (order.bookingType !== 'scheduled') return true; // instant orders always active
    const today = new Date().toLocaleDateString('en-CA');
    if (order.booking?.date !== today) return false;
    if (!order.booking?.timeSlot) return true; // no time slot = treat as active
    try {
      const timePart = order.booking.timeSlot.split('-')[0].trim();
      const parts = timePart.split(' ');
      const time = parts[0];
      const ampm = (parts[1] || '').toUpperCase();
      let [hrs, mins] = time.split(':').map(Number);
      if (ampm === 'PM' && hrs !== 12) hrs += 12;
      if (ampm === 'AM' && hrs === 12) hrs = 0;
      const slotMinutes = hrs * 60 + mins;
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      return nowMinutes >= slotMinutes - 30; // show 30 min before slot
    } catch (e) { return true; }
  };

  // Active job: active/arrived OR instant assigned OR scheduled order whose time slot has arrived / started early (stage > 1)
  const activeJob = myOrders.find(o =>
    ['active', 'arrived'].includes(o.status) ||
    (o.status === 'assigned' && o.bookingType !== 'scheduled') ||
    (o.status === 'assigned' && o.bookingType === 'scheduled' && (isScheduledTimeArrived(o) || o.stage > 1))
  );
  const completedJobs = myOrders.filter(o => o.status === 'completed');
  const earnings = user.wallet?.balance || 0;

  // Accepted scheduled orders (future — not yet time to start and not yet started)
  const myAcceptedScheduled = myOrders.filter(o =>
    o.status === 'assigned' && o.bookingType === 'scheduled' && !isScheduledTimeArrived(o) && o.stage <= 1
  );

  // Helper: check if an incoming pending order collides with accepted scheduled slots
  const collidesWithScheduled = (pendingOrder) => {
    if (pendingOrder.bookingType !== 'scheduled') return false;
    return myAcceptedScheduled.some(sch => {
      if (sch.booking?.date !== pendingOrder.booking?.date) return false;
      if (!sch.booking?.timeSlot || !pendingOrder.booking?.timeSlot) return true; // same date, no slots = collision
      return sch.booking.timeSlot === pendingOrder.booking.timeSlot;
    });
  };

  const workerMatchesService = (worker, serviceCategory, serviceName, vehicleId) => {
    let categories = [];
    if (Array.isArray(worker?.categories)) {
      categories = worker.categories;
    } else if (typeof worker?.categories === 'string') {
      try { categories = JSON.parse(worker.categories); } catch (e) { categories = []; }
    }

    let skills = [];
    if (Array.isArray(worker?.skills)) {
      skills = worker.skills.map(s => String(s).toLowerCase());
    } else if (typeof worker?.skills === 'string') {
      try { skills = JSON.parse(worker.skills).map(s => String(s).toLowerCase()); } catch (e) { skills = []; }
    }

    const designation = (worker?.vehicle_details || worker?.vehicle || '').toLowerCase();
    const cleanDesignation = designation.replace(/&/g, ' and ').replace(/[-_]/g, ' ');
    
    const sCat = (serviceCategory || '').toLowerCase();
    const sName = (serviceName || '').toLowerCase();
    const vId = (vehicleId || '').toLowerCase();

    if (categories.length > 0) {
      if (
        categories.includes('all') || 
        categories.includes(serviceCategory) || 
        categories.includes(sCat) ||
        categories.some(c => String(c).toLowerCase().replace(/[-_]/g, '') === sCat.replace(/[-_]/g, ''))
      ) {
        return true;
      }
    }

    if (categories.length === 0 && skills.length === 0 && !designation) {
      return true;
    }

    const searchTerms = [
      sCat, sName, vId,
      ...sCat.split(/[-_\s&]+/),
      ...sName.split(/[-_\s&]+/),
      ...vId.split(/[-_\s&]+/)
    ].map(t => t.trim().toLowerCase()).filter(t => t && t.length > 2);

    if (searchTerms.some(term => cleanDesignation.includes(term))) return true;
    if (skills.some(skill => searchTerms.some(term => skill.includes(term) || term.includes(skill)))) return true;

    if (sCat.includes('construction') || sName.includes('labour') || vId.includes('labour') || sName.includes('construction')) {
      if (cleanDesignation.includes('construction') || cleanDesignation.includes('labour') || cleanDesignation.includes('mason') || cleanDesignation.includes('civil') || cleanDesignation.includes('site') || cleanDesignation.includes('helper')) return true;
      if (skills.some(s => s.includes('construction') || s.includes('labour') || s.includes('mason') || s.includes('cement') || s.includes('brick'))) return true;
    }

    if (sCat.includes('driver') || sCat.includes('logistics') || sName.includes('driver') || sName.includes('goods')) {
      if (cleanDesignation.includes('driver') || cleanDesignation.includes('logistics') || cleanDesignation.includes('auto') || cleanDesignation.includes('truck') || cleanDesignation.includes('mover')) return true;
      if (skills.some(s => s.includes('driver') || s.includes('driving') || s.includes('logistics') || s.includes('loading'))) return true;
    }

    if (sName.includes('electrician') || sName.includes('electrical')) {
      if (cleanDesignation.includes('electrician') || cleanDesignation.includes('electrical')) return true;
      if (skills.some(s => s.includes('wiring') || s.includes('circuit') || s.includes('electric'))) return true;
    }

    if (sName.includes('plumber') || sName.includes('plumbing')) {
      if (cleanDesignation.includes('plumber') || cleanDesignation.includes('plumbing')) return true;
      if (skills.some(s => s.includes('pipe') || s.includes('leak') || s.includes('tap') || s.includes('water'))) return true;
    }

    if (sName.includes('painter') || sName.includes('painting')) {
      if (cleanDesignation.includes('painter') || cleanDesignation.includes('painting')) return true;
      if (skills.some(s => s.includes('paint') || s.includes('wall') || s.includes('putty'))) return true;
    }

    if (sName.includes('carpenter') || sName.includes('carpentry')) {
      if (cleanDesignation.includes('carpenter') || cleanDesignation.includes('carpentry')) return true;
      if (skills.some(s => s.includes('wood') || s.includes('furniture') || s.includes('lock'))) return true;
    }

    if (sName.includes('clean') || sCat.includes('housekeeping')) {
      if (cleanDesignation.includes('clean') || cleanDesignation.includes('housekeeping') || cleanDesignation.includes('laundry')) return true;
      if (skills.some(s => s.includes('clean') || s.includes('pest') || s.includes('wash'))) return true;
    }

    return false;
  };

  // Filter requests that are:
  // 1. Pending assignment
  // 2. Matches category OR work experience / skills
  // 3. Worker has not rejected
  // 4. Does NOT collide with an accepted scheduled slot
  const pendingRequests = orders.filter(o => 
    o.status === 'pending' &&
    (!o.rejectedWorkers || !o.rejectedWorkers.includes(user.id)) &&
    !collidesWithScheduled(o)
  );

  const isSubscribed = !!user.subscription?.active;

  const STATS = [
    { Icon: HiStar,          val: `${user.rating}★`,                        label: 'Rating',      color: '#f59e0b' },
    { Icon: HiBriefcase,     val: user.jobsDone,                             label: 'Completed',   color: '#10b981' },
    { Icon: HiCurrencyRupee, val: `₹${earnings.toLocaleString()}`,           label: 'Wallet Bal',  color: '#8b5cf6' },
  ];

  const handleToggleOnline = async () => {
    const isCurrentlyOnline = Number(user.available) === 1 || user.available === true;
    const nextState = !isCurrentlyOnline;
    await updateWorkerAvailability(user.id, { online: nextState });
    if (nextState) {
      await fetchOrdersForWorker(user.id);
    }
  };

  const [targetSearchQuery, setTargetSearchQuery] = useState('');
  const [targetSuggestions, setTargetSuggestions] = useState([]);

  const handleTargetSearchChange = async (e) => {
    const val = e.target.value;
    setTargetSearchQuery(val);
    if (val.trim().length < 3) {
      setTargetSuggestions([]);
      return;
    }
    const token = MAPBOX_TOKEN;
    try {
      let suggestions = [];
      
      // Try Mapbox first
      if (token) {
        try {
          const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(val)}.json?access_token=${token}&country=in&types=place,locality,sublocality,address&limit=5`);
          if (res.ok) {
            const data = await res.json();
            if (data.features && data.features.length > 0) {
              suggestions = data.features.map(f => ({
                id: f.id,
                text: f.text,
                place_name: f.place_name
              }));
            }
          } else {
            console.warn(`Mapbox Geocoding returned status: ${res.status}. Falling back to OpenStreetMap Nominatim.`);
          }
        } catch (mapboxErr) {
          console.error("Mapbox search failed, falling back to OSM Nominatim:", mapboxErr);
        }
      }

      // If Mapbox failed or returned no results, fallback to Nominatim
      if (suggestions.length === 0) {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val)}&format=json&addressdetails=1&limit=5`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            suggestions = data.map(item => ({
              id: (item.place_id || Math.random()).toString(),
              text: item.name || item.display_name.split(',')[0],
              place_name: item.display_name
            }));
          }
        }
      }

      setTargetSuggestions(suggestions);
    } catch (err) {
      console.error("All geocoding suggestion attempts failed:", err);
      setTargetSuggestions([]);
    }
  };

  const handleAddTargetLoc = async (locName) => {
    if (!locName) return;
    const currentLocs = user.target_locations || [];
    if (currentLocs.includes(locName)) {
      setTargetSearchQuery('');
      setTargetSuggestions([]);
      return;
    }
    const updated = [...currentLocs, locName];
    await updateWorkerProfile(user.id, { target_locations: updated });
    setTargetSearchQuery('');
    setTargetSuggestions([]);
  };

  const handleRemoveTargetLoc = async (locName) => {
    const currentLocs = user.target_locations || [];
    const updated = currentLocs.filter(l => l !== locName);
    await updateWorkerProfile(user.id, { target_locations: updated });
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
    const targetReq = pendingRequests.find(r => r.id === orderId);
    const isSched = targetReq?.bookingType === 'scheduled';

    const res = await assignWorker(orderId, {
      id: user.id,
      name: user.name,
      phone: user.phone,
      rating: user.rating,
      vehicle: user.vehicle,
      photo: user.photo
    });
    if (res && res.success) {
      if (isSched) {
        alert("📅 Scheduled service successfully accepted and added to your Orders page 'Scheduled' section. You will be notified as the date and time approaches!");
      }
    } else if (res && res.error) {
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
  }, [user.available, user.live_tracking, activeJob?.id, activeJob?.stage]);

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

    // Recalculation logic: Check distance from last recalculation point to prevent spamming Mapbox API
    if (lastRecalcCoords) {
      const dist = calculateDistance(lastRecalcCoords.lat, lastRecalcCoords.lng, workerCoords.lat, workerCoords.lng);
      // Recalculate route if the worker has moved more than 30 meters (0.03 km) and has a route
      if (dist !== null && dist < 0.03 && routeGeojson) {
        return;
      }
    }

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
          setLastRecalcCoords(workerCoords);

          if (route.legs && route.legs[0] && route.legs[0].steps) {
            setNavSteps(route.legs[0].steps.map(s => s.maneuver.instruction));
          }
        }
      } catch (e) {
        console.error("Failed to fetch route on worker side:", e);
      }
    };
    fetchWorkerRoute();
  }, [customerCoords, workerCoords, recalcTrigger]);


  useEffect(() => {
    if (!workerCoords) return;

    // Calculate heading/bearing between previous position and new position
    let newBearing = mapViewState.bearing || 0;
    if (prevCoords) {
      const dist = calculateDistance(prevCoords.lat, prevCoords.lng, workerCoords.lat, workerCoords.lng);
      // Only change bearing if the movement is significant (e.g. > 2 meters) to filter out jitter
      if (dist !== null && dist > 0.002) {
        newBearing = calculateBearing(prevCoords.lat, prevCoords.lng, workerCoords.lat, workerCoords.lng);
      }
    }
    setPrevCoords(workerCoords);

    if (autoFollow) {
      setMapViewState(prev => ({
        ...prev,
        latitude: workerCoords.lat,
        longitude: workerCoords.lng,
        zoom: isNavigating ? 17 : 15,
        bearing: isNavigating ? newBearing : 0,
        pitch: isNavigating ? 45 : 0
      }));
    }
  }, [workerCoords, autoFollow, isNavigating]);

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
      async (position) => {
        const { latitude, longitude } = position.coords;
        setWorkerCoords({ lat: latitude, lng: longitude });
        updateWorkerLocation(latitude, longitude);

        // Reverse geocode to update city & state dynamically
        const token = MAPBOX_TOKEN;
        let city = '';
        let state = '';
        try {
          let resolved = false;
          if (token) {
            try {
              const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${token}&limit=1`);
              if (res.ok) {
                const data = await res.json();
                if (data.features && data.features.length > 0) {
                  const feat = data.features[0];
                  const context = feat.context || [];
                  const placeContext = context.find(c => c.id.startsWith('place'));
                  const regionContext = context.find(c => c.id.startsWith('region'));
                  city = placeContext ? placeContext.text : feat.text;
                  state = regionContext ? regionContext.text : '';
                  resolved = true;
                }
              }
            } catch (err) {
              console.error("Mapbox reverse geocoding failed, trying OSM:", err);
            }
          }

          if (!resolved) {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
            if (res.ok) {
              const data = await res.json();
              if (data.address) {
                city = data.address.city || data.address.town || data.address.village || data.address.suburb || '';
                state = data.address.state || '';
              }
            }
          }

          if (city || state) {
            await updateWorkerProfile(user.id, { city, state });
          }
        } catch (err) {
          console.error("Error reverse geocoding:", err);
        }

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
        <div className="sub-warning-banner" style={{
          background: '#fef2f2',
          border: '1.5px solid #fecaca',
          color: '#b91c1c',
          padding: '20px',
          borderRadius: '16px',
          marginBottom: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          boxShadow: '0 4px 12px rgba(220,38,38,0.05)'
        }}>
          <strong style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ⚠️ Subscription Plan Expired
          </strong>
          <p style={{ fontSize: '14px', lineHeight: '1.6', margin: 0, fontWeight: '500' }}>
            Your activation plan has expired. Please renew your subscription to start receiving new service requests and continue growing your business with our platform.
          </p>
          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <Link
              to="/worker/subscription"
              style={{
                background: '#dc2626',
                color: '#fff',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '700',
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Renew Subscription
            </Link>
            <Link
              to="/worker/subscription"
              style={{
                background: '#fff',
                color: '#dc2626',
                border: '1px solid #fca5a5',
                padding: '10px 18px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '700',
                textDecoration: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              View Plans
            </Link>
          </div>
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
        <div className="avail-toggle" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontWeight: '700', fontSize: '14px', color: '#4b5563' }}>Duty Status:</span>
          <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '50px', height: '26px' }}>
            <input 
              type="checkbox" 
              checked={!!user.available} 
              onChange={handleToggleOnline} 
              disabled={vacation}
              style={{ 
                position: 'absolute', 
                opacity: 0, 
                width: '100%', 
                height: '100%', 
                top: 0, 
                left: 0, 
                cursor: 'pointer', 
                zIndex: 10,
                margin: 0
              }}
            />
            <span className="slider round" style={{
              position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: user.available ? '#10b981' : '#cbd5e1',
              transition: '.4s', borderRadius: '34px'
            }}>
              <span style={{
                position: 'absolute', content: '""', height: '20px', width: '20px', 
                left: user.available ? '27px' : '3px', bottom: '3px',
                backgroundColor: 'white', transition: '.4s', borderRadius: '50%',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }} />
            </span>
          </label>
          <span style={{ fontWeight: '800', fontSize: '12px', color: user.available ? '#10b981' : '#6b7280', width: '60px' }}>
            {user.available ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>
      </div>

      {/* Scheduled Orders Reminder Banner */}
      {upcomingScheduled.map(o => (
        <div key={o.id} style={{
          background: 'linear-gradient(135deg, #f3e8ff 0%, #fae8ff 100%)',
          border: '1.5px solid #d8b4fe',
          padding: '16px',
          borderRadius: '16px',
          marginBottom: '20px',
          boxShadow: '0 4px 12px rgba(139, 92, 246, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}>
          <div style={{
            background: '#8b5cf6',
            color: '#fff',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            flexShrink: 0
          }}>
            📅
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: 0, fontSize: '13.5px', color: '#581c87', fontWeight: '800' }}>
              You have a scheduled order today at {o.booking?.timeSlot || '5:30 PM'}
            </h4>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6b21a8', fontWeight: '500' }}>
              Service: <strong>{o.vehicle?.name}</strong> · Location: <strong>{o.booking?.location?.split(',')[0]}</strong>
            </p>
          </div>
          <button 
            onClick={() => {
              navigate('/worker/orders');
            }}
            style={{
              background: '#8b5cf6',
              color: '#fff',
              border: 'none',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(139, 92, 246, 0.3)'
            }}
          >
            Go to Orders
          </button>
        </div>
      ))}

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

      {/* ── UPCOMING ACCEPTED SCHEDULED SERVICES WIDGET ── */}
      <div className="worker-section" style={{ background: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', color: '#1e293b' }}>
              <span>📅</span> Upcoming Scheduled Tasks ({myAcceptedScheduled.length})
            </h2>
            <span style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px', display: 'block' }}>
              Accepted scheduled jobs waiting for start time
            </span>
          </div>
          {myAcceptedScheduled.length > 0 && (
            <Link to="/worker/orders" style={{ fontSize: '12px', fontWeight: '750', color: 'var(--primary)', textDecoration: 'none', background: 'var(--primary-light)', padding: '6px 12px', borderRadius: '8px' }}>
              View Schedule
            </Link>
          )}
        </div>

        {myAcceptedScheduled.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1.5px dashed #e2e8f0' }}>
            <span style={{ fontSize: '24px' }}>📆</span>
            <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>
              No upcoming scheduled tasks. Keep an eye out for scheduled dispatch requests!
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {myAcceptedScheduled.map(o => (
              <div key={o.id} style={{
                background: '#fffbeb',
                border: '1.5px solid #fde68a',
                borderRadius: '12px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                boxShadow: '0 2px 6px rgba(245, 158, 11, 0.04)'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: '800', fontSize: '13.5px', color: '#92400e' }}>{o.vehicle?.name}</span>
                    <span style={{ fontSize: '10px', color: '#b45309', background: '#fef3c7', padding: '2px 6px', borderRadius: '4px', fontWeight: '800', textTransform: 'uppercase' }}>
                      Accepted
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px', fontSize: '12px', color: '#78350f', fontWeight: '600' }}>
                    <span>📆 <strong>{o.booking?.date}</strong></span>
                    <span>⏰ <strong>{o.booking?.timeSlot || 'Confirm Time'}</strong></span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#b45309', marginTop: '4px', opacity: 0.8 }}>
                    📍 {o.booking?.location?.split(',')[0]}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                  <span style={{ fontSize: '15px', fontWeight: '900', color: '#92400e' }}>₹{o.booking?.total?.toLocaleString()}</span>
                  <button
                    onClick={() => setSelectedDetailsRequest(o)}
                    style={{
                      background: '#fff',
                      border: '1.5px solid #fde68a',
                      color: '#b45309',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '800',
                      cursor: 'pointer'
                    }}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
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
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span className="aj-badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: '700', padding: '4px 10px', borderRadius: '20px', fontSize: '12px' }}>
                🟢 ACTIVE ASSIGNMENT
              </span>
              <span style={{ fontSize: '12px', color: '#888' }}>
                {activeJob.bookingType === 'instant' ? '⚡ Instant Dispatch' : '📅 Scheduled'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setOrderToCancel(activeJob);
                setShowCancelModal(true);
              }}
              style={{
                background: '#fee2e2',
                color: '#dc2626',
                border: '1px solid #fca5a5',
                padding: '5px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              ❌ Cancel
            </button>
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

            {/* Customer Communication Section */}
            <div style={{
              background: '#f8fafc',
              border: '1.5px solid #e2e8f0',
              borderRadius: '14px',
              padding: '16px',
              marginTop: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  📞 Customer Contact details
                </span>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>👤 {activeJob.customer?.name || 'Customer'}</span>
                </div>
                <div style={{ fontSize: '13px', color: '#475569', marginTop: '2px', fontWeight: '700' }}>
                  📞 {activeJob.customer?.phone || 'No phone number available'}
                </div>
              </div>

              {activeJob.customer?.phone && (
                <div className="contact-actions-row" style={{ display: 'flex', gap: '10px' }}>
                  {/* Native dialer Call button */}
                  <a
                    href={`tel:${activeJob.customer.phone}`}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      background: '#3b82f6',
                      color: '#fff',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: '800',
                      textDecoration: 'none',
                      boxShadow: '0 2px 6px rgba(59,130,246,0.2)',
                      textAlign: 'center'
                    }}
                  >
                    <HiPhone style={{ width: 16, height: 16 }} />
                    Call Customer
                  </a>

                  {/* WhatsApp button */}
                  <a
                    href={`https://wa.me/${(activeJob.customer.whatsapp || activeJob.customer.phone || '').replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      background: '#22c55e',
                      color: '#fff',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: '800',
                      textDecoration: 'none',
                      boxShadow: '0 2px 6px rgba(34,197,94,0.2)',
                      textAlign: 'center'
                    }}
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963C16.59 2.019 14.12 1.01 11.493 1.01 6.059 1.01 1.637 5.377 1.633 10.806c-.001 1.674.452 3.3 1.311 4.733L1.925 20.35l5.02-1.316-.298.12z" />
                    </svg>
                    WhatsApp
                  </a>
                </div>
              )}
            </div>

            {activeJob.booking?.notes && (
              <div style={{ marginTop: '4px', background: '#fff9f0', border: '1px solid #ffe0b2', padding: '12px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '11px', color: '#b45309', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>📋 Booking Notes & Specifications:</span>
                <div style={{ fontSize: '13px', color: '#78350f', fontWeight: '700', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                  {activeJob.booking.notes}
                </div>
              </div>
            )}

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
              /* Google Maps directions with origin and destination coordinates */
              <div>
                <a
                  href={(() => {
                    const destLat = activeJob.booking.lat || customerCoords?.lat;
                    const destLng = activeJob.booking.lng || customerCoords?.lng;
                    if (destLat && destLng) {
                      return `https://www.google.com/maps/dir/?api=1&origin=${workerCoords.lat},${workerCoords.lng}&destination=${destLat},${destLng}&travelmode=driving`;
                    }
                    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeJob.booking.location)}`;
                  })()}
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
              /* In-App Navigation — preview card with Launch button */
              <div>
                {MAPBOX_TOKEN && customerCoords ? (
                  <>
                    {/* ETA Summary Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>📍 Destination set</span>
                      {eta && <span style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: '800' }}>⏰ {eta}</span>}
                    </div>

                    {/* Launch Full-Screen Navigation Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsNavigating(true);
                        if (workerCoords) {
                          setMapViewState(v => ({ ...v, latitude: workerCoords.lat, longitude: workerCoords.lng, zoom: 16 }));
                        }
                      }}
                      style={{
                        width: '100%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                        background: 'linear-gradient(135deg, var(--primary), #7c3aed)',
                        color: '#fff', padding: '16px 20px', borderRadius: '14px',
                        fontSize: '16px', fontWeight: '800', border: 'none', cursor: 'pointer',
                        boxShadow: '0 6px 20px rgba(79,70,229,0.4)',
                        letterSpacing: '0.3px', transition: 'transform 0.15s, box-shadow 0.15s'
                      }}
                    >
                      <span style={{ fontSize: '22px' }}>🚀</span>
                      <span>Start In-App Navigation</span>
                    </button>

                    <p style={{ margin: '10px 0 0', fontSize: '11px', color: '#94a3b8', textAlign: 'center' }}>
                      Full-screen map with turn-by-turn directions
                    </p>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#888', fontSize: '13px' }}>
                    🛰️ Initializing GPS...
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── FULL-SCREEN NAVIGATION OVERLAY (like Google Maps) ── */}
          {isNavigating && MAPBOX_TOKEN && customerCoords && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              zIndex: 9999,
              background: '#000',
              display: 'flex', flexDirection: 'column'
            }}>
              {/* Full-screen Map */}
              <div style={{ flex: 1, position: 'relative' }}>
                <Map
                  {...mapViewState}
                  onMove={e => setMapViewState(e.viewState)}
                  onDragStart={() => setAutoFollow(false)}
                  onClick={handleMapClick}
                  style={{ width: '100%', height: '100%' }}
                  mapStyle="mapbox://styles/mapbox/streets-v12"
                  mapboxAccessToken={MAPBOX_TOKEN}
                >
                  <Marker longitude={customerCoords.lng} latitude={customerCoords.lat} anchor="bottom">
                    <div style={{ fontSize: '32px', filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.5))' }}>📍</div>
                  </Marker>
                  <Marker longitude={workerCoords.lng} latitude={workerCoords.lat} anchor="center">
                    <div style={{
                      width: '40px', height: '40px', background: 'var(--primary)', color: '#fff',
                      borderRadius: '50%', border: '3px solid #fff',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '20px', fontWeight: 'bold'
                    }}>🛵</div>
                  </Marker>
                  {routeGeojson && (
                    <Source id="route-fs" type="geojson" data={{ type: 'Feature', geometry: routeGeojson }}>
                      {/* Premium casing line */}
                      <Layer 
                        id="route-casing-fs" 
                        type="line" 
                        layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                        paint={{ 'line-color': '#1d4ed8', 'line-width': 11, 'line-opacity': 0.55 }} 
                      />
                      {/* Inner bright driving route line */}
                      <Layer 
                        id="route-line-fs" 
                        type="line" 
                        layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                        paint={{ 'line-color': '#3b82f6', 'line-width': 6, 'line-opacity': 1.0 }} 
                      />
                    </Source>
                  )}
                </Map>

                {/* ── MAP INTERACTIVE CONTROLS (Floating Zoom and Re-center Buttons) ── */}
                <div style={{
                  position: 'absolute', right: '16px', bottom: '180px',
                  display: 'flex', flexDirection: 'column', gap: '10px',
                  zIndex: 10
                }}>
                  {/* Re-center Target Button */}
                  {!autoFollow && (
                    <button
                      type="button"
                      onClick={() => {
                        setAutoFollow(true);
                        setMapViewState(prev => ({
                          ...prev,
                          latitude: workerCoords.lat,
                          longitude: workerCoords.lng,
                          zoom: 17,
                          pitch: 45
                        }));
                        setRecalcTrigger(prev => prev + 1);
                      }}
                      style={{
                        width: '46px', height: '46px', borderRadius: '50%',
                        background: '#3b82f6', color: '#fff', border: 'none',
                        fontSize: '20px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justify: 'center',
                        boxShadow: '0 4px 12px rgba(59,130,246,0.4)',
                        fontWeight: '800'
                      }}
                      title="Re-center Navigation"
                    >
                      🎯
                    </button>
                  )}

                  {/* Zoom In Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setMapViewState(prev => ({ ...prev, zoom: Math.min(prev.zoom + 1, 20) }));
                    }}
                    style={{
                      width: '42px', height: '42px', borderRadius: '8px',
                      background: 'rgba(255,255,255,0.9)', color: '#333', border: '1px solid #ccc',
                      fontSize: '20px', fontWeight: 'bold', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justify: 'center',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                    }}
                  >
                    +
                  </button>

                  {/* Zoom Out Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setMapViewState(prev => ({ ...prev, zoom: Math.max(prev.zoom - 1, 1) }));
                    }}
                    style={{
                      width: '42px', height: '42px', borderRadius: '8px',
                      background: 'rgba(255,255,255,0.9)', color: '#333', border: '1px solid #ccc',
                      fontSize: '20px', fontWeight: 'bold', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justify: 'center',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                    }}
                  >
                    −
                  </button>
                </div>

                {/* ── TOP HUD — Turn-by-Turn Direction Banner ── */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0,
                  background: 'linear-gradient(180deg, rgba(15,23,42,0.97) 80%, transparent)',
                  padding: '52px 20px 20px',
                  display: 'flex', alignItems: 'center', gap: '14px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                }}>
                  {/* Direction Arrow Box */}
                  <div style={{
                    width: '54px', height: '54px', background: '#3b82f6', borderRadius: '14px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '28px', flexShrink: 0, boxShadow: '0 4px 12px rgba(59,130,246,0.5)'
                  }}>
                    {navSteps[currentStepIndex]?.toLowerCase().includes('left') ? '⬅️' :
                     navSteps[currentStepIndex]?.toLowerCase().includes('right') ? '➡️' :
                     navSteps[currentStepIndex]?.toLowerCase().includes('u-turn') ? '↩️' : '⬆️'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>
                      NEXT MANEUVER
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: '#f8fafc', lineHeight: 1.3, wordBreak: 'break-word' }}>
                      {navSteps[currentStepIndex] || 'Continue on route to destination'}
                    </div>
                  </div>
                </div>

                {/* ── CLOSE BUTTON (top-right) ── */}
                <button
                  type="button"
                  onClick={() => { setIsNavigating(false); setIsSimulating(false); }}
                  style={{
                    position: 'absolute', top: '52px', right: '16px',
                    width: '44px', height: '44px', borderRadius: '50%',
                    background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
                    border: '1.5px solid rgba(255,255,255,0.3)',
                    color: '#fff', fontSize: '22px', fontWeight: '700',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    zIndex: 10
                  }}
                >
                  ✕
                </button>

                {/* ── BOTTOM HUD — ETA & Drive Controls ── */}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  background: 'rgba(255,255,255,0.98)',
                  backdropFilter: 'blur(12px)',
                  borderTop: '1px solid #e2e8f0',
                  padding: '18px 20px',
                  paddingBottom: 'calc(18px + env(safe-area-inset-bottom, 0px))',
                  boxShadow: '0 -8px 24px rgba(0,0,0,0.12)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {/* ETA Info */}
                    <div>
                      <div style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a', lineHeight: 1 }}>
                        {eta ? eta.split('(')[0].trim() : 'Computing…'}
                      </div>
                      {eta && (
                        <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600', marginTop: '3px' }}>
                          {eta.match(/\(.*?\)/)?.[0]?.replace(/[()]/g,'') || ''} · via fastest route
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      {/* Drive / Pause simulation */}
                      <button
                        type="button"
                        onClick={() => setIsSimulating(!isSimulating)}
                        style={{
                          background: isSimulating ? '#ef4444' : '#10b981',
                          color: '#fff', border: 'none',
                          padding: '12px 20px', borderRadius: '12px',
                          fontSize: '14px', fontWeight: '800', cursor: 'pointer',
                          boxShadow: isSimulating ? '0 4px 12px rgba(239,68,68,0.35)' : '0 4px 12px rgba(16,185,129,0.35)',
                          display: 'flex', alignItems: 'center', gap: '6px'
                        }}
                      >
                        {isSimulating ? '⏸ Pause' : '🛵 Drive'}
                      </button>

                      {/* Close Navigation */}
                      <button
                        type="button"
                        onClick={() => { setIsNavigating(false); setIsSimulating(false); }}
                        style={{
                          background: '#f1f5f9', color: '#475569',
                          border: '1.5px solid #cbd5e1', padding: '12px 16px',
                          borderRadius: '12px', fontSize: '14px', fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        Close
                      </button>
                    </div>
                  </div>

                  {/* Route progress steps hint */}
                  {navSteps.length > 0 && (
                    <div style={{ marginTop: '12px', padding: '10px 14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12px', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Step {Math.min(currentStepIndex + 1, navSteps.length)} of {navSteps.length}</span>
                      <span style={{ fontWeight: '700', color: '#3b82f6' }}>📍 {activeJob.booking.location?.split(',')[0]}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

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

      {/* ── LOCATION & DISPATCH SETTINGS CARD ── */}
      <div className="worker-section" style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
          <HiMap style={{ width: '24px', height: '24px', color: 'var(--primary)' }} />
          <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>Location & Dispatch Settings</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '480px', margin: '0 auto' }}>
          {/* GPS updates */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '13.5px', color: '#334155', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ marginBottom: '8px' }}>
                📍 <strong>Operational City:</strong>{' '}
                {isEditingCity ? (
                  <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center', marginTop: '4px', flexWrap: 'wrap' }}>
                    <input
                      placeholder="City (e.g. Hyderabad)"
                      value={cityInput}
                      onChange={e => setCityInput(e.target.value)}
                      style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', width: '130px' }}
                    />
                    <input
                      placeholder="State (e.g. Telangana)"
                      value={stateInput}
                      onChange={e => setStateInput(e.target.value)}
                      style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', width: '130px' }}
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        await updateWorkerProfile(user.id, { city: cityInput.trim(), state: stateInput.trim() });
                        setIsEditingCity(false);
                      }}
                      style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCityInput(user.city || '');
                        setStateInput(user.state || '');
                        setIsEditingCity(false);
                      }}
                      style={{ background: '#cbd5e1', color: '#475569', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <span>{user.city || 'Not set'}, {user.state || 'Not set'}</span>
                    <button
                      type="button"
                      onClick={() => setIsEditingCity(true)}
                      style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '11px', fontWeight: '700', cursor: 'pointer', marginLeft: '8px', textDecoration: 'underline', padding: 0 }}
                    >
                      ✏️ Edit City
                    </button>
                  </>
                )}
              </div>
              <div style={{ marginBottom: '8px', fontSize: '12px', color: '#64748b' }}>
                📍 <strong>Last Coords:</strong> {workerCoords.lat.toFixed(6)}, {workerCoords.lng.toFixed(6)}
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                🕒 <strong>Last Synced:</strong> {new Date().toLocaleTimeString()}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={handleFetchGpsLocation}
                style={{
                  background: 'var(--primary)', color: '#fff', border: 'none',
                  padding: '12px 16px', borderRadius: '10px', fontSize: '13.5px',
                  fontWeight: '700', cursor: 'pointer', flex: 1, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}
              >
                🔄 Refresh GPS Location
              </button>
            </div>
            
            {locMessage && <div style={{ fontSize: '12.5px', color: '#10b981', fontWeight: '600', marginTop: '6px', textAlign: 'center' }}>{locMessage}</div>}
          </div>
        </div>
      </div>

      {/* ── PENDING DISPATCHED REQUESTS POOL (RAPIDO-STYLE) ── */}
      {!activeJob && (
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
            <div className="no-active-job" style={{ padding: '30px', textAlign: 'center', background: '#fff', borderRadius: '12px', border: '1.5px solid #eee', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '32px' }}>🔒</span>
              <p style={{ margin: '8px 0 0', color: '#dc2626', fontSize: '14px', fontWeight: '700' }}>
                Your activation plan has expired. Please renew your subscription to start receiving new service requests and continue growing your business with our platform.
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <Link to="/worker/subscription" style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', textDecoration: 'none' }}>Renew Subscription</Link>
                <Link to="/worker/subscription" style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', textDecoration: 'none' }}>View Plans</Link>
              </div>
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
                const isInstant = req.bookingType === 'instant';

                return (
                  <div key={req.id} style={{
                    background: '#fff',
                    borderRadius: '16px',
                    boxShadow: isInstant ? '0 4px 20px rgba(59,130,246,0.15)' : '0 4px 20px rgba(245,158,11,0.15)',
                    border: `2px solid ${isInstant ? '#3b82f6' : '#f59e0b'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                  }}>

                    {/* ── COLOUR BANNER HEADER ── */}
                    <div style={{
                      background: isInstant
                        ? 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)'
                        : 'linear-gradient(135deg, #92400e 0%, #d97706 100%)',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '10px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>
                          {isInstant ? '⚡' : '📅'}
                        </div>
                        <div>
                          <div style={{ color: '#fff', fontWeight: '900', fontSize: '13.5px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                            {isInstant ? 'Instant Service Order' : 'Scheduled Service Order'}
                          </div>
                          <div style={{ color: 'rgba(255,255,255,0.88)', fontSize: '11px', fontWeight: '600', marginTop: '2px' }}>
                            {isInstant
                              ? '⚡ Customer needs service RIGHT NOW — Act fast!'
                              : `📅 Planned for: ${req.booking?.date || 'Date TBD'}${req.booking?.timeSlot ? ' at ' + req.booking.timeSlot : ' — time TBD'}`
                            }
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ color: '#fff', fontWeight: '900', fontSize: '22px', lineHeight: 1 }}>₹{req.booking?.total?.toLocaleString()}</div>
                        <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '10.5px', fontWeight: '700', marginTop: '2px' }}>
                          {req.booking?.duration} {req.vehicle?.unit === 'hr' ? 'hrs' : 'trips'}
                        </div>
                      </div>
                    </div>

                    {/* ── BODY ── */}
                    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

                      {/* Service name row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '20px' }}>🛠️</span>
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: '900', color: '#0f172a' }}>{req.vehicle?.name}</div>
                          {req.vehicle?.categoryLabel && (
                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>{req.vehicle.categoryLabel}</div>
                          )}
                        </div>
                      </div>

                      {/* Type callout box */}
                      {isInstant ? (
                        <div style={{ background: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: '10px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '18px' }}>⚡</span>
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: '900', color: '#1d4ed8' }}>INSTANT — Report immediately</div>
                            <div style={{ fontSize: '11px', color: '#3b82f6', fontWeight: '600' }}>Once accepted, navigate and reach the customer right away</div>
                          </div>
                        </div>
                      ) : (
                        <div style={{ background: '#fffbeb', border: '2px solid #f59e0b', borderRadius: '12px', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ fontSize: '12px', fontWeight: '900', color: '#92400e', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>📅</span> SCHEDULED — Planned Booking
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: '11px', color: '#78350f', fontWeight: '700' }}>📆 Service Date:</span>
                              <strong style={{ fontSize: '13px', color: '#92400e' }}>{req.booking?.date || 'TBD'}</strong>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: '11px', color: '#78350f', fontWeight: '700' }}>⏰ Service Start Time:</span>
                              {req.booking?.timeSlot
                                ? <strong style={{ fontSize: '13px', color: '#d97706', background: '#fef3c7', padding: '2px 8px', borderRadius: '6px' }}>{req.booking.timeSlot}</strong>
                                : <span style={{ fontSize: '11px', color: '#dc2626', fontWeight: '700' }}>⚠️ Confirm with customer</span>
                              }
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Info pills */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        <span style={{ background: '#f1f5f9', color: '#334155', fontSize: '11.5px', fontWeight: '700', padding: '4px 10px', borderRadius: '20px' }}>
                          📍 {formattedDistance} away
                        </span>
                        <span style={{ background: '#f1f5f9', color: '#334155', fontSize: '11.5px', fontWeight: '700', padding: '4px 10px', borderRadius: '20px' }}>
                          🕐 Booked at {bookingTimeStr}
                        </span>
                      </div>

                      {/* Address */}
                      {req.booking?.location && (
                        <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '8px 12px', fontSize: '12.5px', color: '#475569', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                          <span style={{ marginTop: '1px', flexShrink: 0 }}>📍</span>
                          <span style={{ fontWeight: '600', lineHeight: 1.4 }}>{req.booking.location}</span>
                        </div>
                      )}

                      {/* Booking Notes */}
                      {req.booking?.notes && (
                        <div style={{ background: '#fff9f0', border: '1px solid #ffe0b2', padding: '8px 12px', borderRadius: '10px' }}>
                          <span style={{ fontSize: '10px', color: '#b45309', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' }}>📋 Customer Notes</span>
                          <div style={{ fontSize: '12px', color: '#78350f', fontWeight: '700', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>{req.booking.notes}</div>
                        </div>
                      )}

                      {/* Custom Fields */}
                      {req.vehicle?.custom_fields && req.vehicle.custom_fields.length > 0 && (
                        <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '10px', border: '1.5px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>📋 Requirements</span>
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

                      {/* Action Buttons */}
                      <div className="popup-actions-row" style={{ display: 'flex', gap: '8px', paddingTop: '4px' }}>
                        <button
                          onClick={() => handleRejectRequest(req.id)}
                          style={{ flex: 1, border: '1.5px solid #fca5a5', color: '#dc2626', background: '#fff', padding: '10px', borderRadius: '10px', fontWeight: '700', fontSize: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4.5px' }}
                        >
                          <HiX /> Reject
                        </button>
                        <button
                          onClick={() => setSelectedDetailsRequest(req)}
                          style={{ flex: 1.5, border: `1.5px solid ${isInstant ? '#3b82f6' : '#f59e0b'}`, color: isInstant ? '#1d4ed8' : '#92400e', background: '#fff', padding: '10px', borderRadius: '10px', fontWeight: '700', fontSize: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4.5px' }}
                        >
                          🔍 View Details
                        </button>
                        <button
                          onClick={() => handleAcceptRequest(req.id)}
                          disabled={!!activeJob}
                          style={{
                            flex: 1.5,
                            background: !!activeJob ? '#cbd5e1' : isInstant ? 'linear-gradient(135deg,#1d4ed8,#3b82f6)' : 'linear-gradient(135deg,#92400e,#d97706)',
                            color: '#fff', border: 'none', padding: '10px', borderRadius: '10px', fontWeight: '800', fontSize: '12px',
                            cursor: !!activeJob ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4.5px',
                            boxShadow: !!activeJob ? 'none' : `0 4px 12px ${isInstant ? 'rgba(59,130,246,0.35)' : 'rgba(217,119,6,0.35)'}`
                          }}
                        >
                          <HiCheck /> Accept
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

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
            <h3 style={{ margin: '0 0 10px', fontSize: '18px', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800' }}>
              ⚠️ Profile Rating Downgrade Warning
            </h3>
            
            <div style={{ background: '#fef2f2', border: '1.5px solid #fee2e2', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px' }}>
              <p style={{ margin: 0, fontSize: '13px', color: '#991b1b', fontWeight: '700', lineHeight: '1.5' }}>
                WARNING: Cancelling this assignment will downgrade your profile rating, reduce search visibility, and may result in temporary account restrictions. Please limit rejections to maintain good standing!
              </p>
            </div>
            
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
                onClick={() => {
                  setShowCancelModal(false);
                  setOrderToCancel(null);
                }}
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
                  const cancelId = orderToCancel?.id || activeJob?.id;
                  if (cancelId) {
                    await rejectActiveJob(cancelId, user.id, cancelReason, finalReason);
                  }
                  setShowCancelModal(false);
                  setOrderToCancel(null);
                  alert("Order has been successfully cancelled and returned to pending dispatch pool.");
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
                {req.bookingType === 'scheduled' ? (
                  <div style={{ background: '#fffbeb', border: '2px solid #f59e0b', borderRadius: '12px', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '900', color: '#92400e' }}>📅 SCHEDULED ORDER</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#78350f', fontWeight: '700' }}>📆 Service Date:</span>
                      <strong style={{ fontSize: '14px', color: '#92400e' }}>{req.booking?.date || 'TBD'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#78350f', fontWeight: '700' }}>⏰ Service Start Time:</span>
                      {req.booking?.timeSlot
                        ? <strong style={{ fontSize: '14px', color: '#d97706', background: '#fef3c7', padding: '3px 10px', borderRadius: '8px' }}>{req.booking.timeSlot}</strong>
                        : <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: '700' }}>⚠️ Confirm with customer</span>
                      }
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span style={{ color: '#64748b', fontWeight: '600' }}>Preferred Date/Time</span>
                    <strong style={{ color: '#0f172a', textAlign: 'right' }}>
                      {req.booking?.date}
                      <span style={{ display: 'block', color: '#3b82f6', fontSize: '12px' }}>⚡ Instant Match</span>
                    </strong>
                  </div>
                )}

                {/* Customer Contact (Privacy Redacted if pending, full details if accepted) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', alignItems: 'center' }}>
                  <span style={{ color: '#64748b', fontWeight: '600' }}>Customer Name</span>
                  <strong style={{ color: '#0f172a' }}>{req.customer?.name || 'Customer'}</strong>
                </div>

                {req.status === 'assigned' || req.status === 'active' || req.status === 'arrived' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: '#f8fafc', border: '1.5px solid #e2e8f0', padding: '14px', borderRadius: '12px', marginTop: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px' }}>
                      <span style={{ color: '#64748b', fontWeight: '600' }}>Customer Phone</span>
                      <strong style={{ color: '#0f172a' }}>{req.customer?.phone || 'No number'}</strong>
                    </div>
                    {req.customer?.phone && (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                        <a
                          href={`tel:${req.customer.phone}`}
                          style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            background: '#3b82f6',
                            color: '#fff',
                            padding: '10px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '800',
                            textDecoration: 'none',
                            textAlign: 'center'
                          }}
                        >
                          <HiPhone style={{ width: 14, height: 14 }} /> Call
                        </a>
                        <a
                          href={`https://wa.me/${(req.customer.whatsapp || req.customer.phone || '').replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            background: '#22c55e',
                            color: '#fff',
                            padding: '10px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '800',
                            textDecoration: 'none',
                            textAlign: 'center'
                          }}
                        >
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963C16.59 2.019 14.12 1.01 11.493 1.01 6.059 1.01 1.637 5.377 1.633 10.806c-.001 1.674.452 3.3 1.311 4.733L1.925 20.35l5.02-1.316-.298.12z" />
                          </svg>
                          WhatsApp
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', alignItems: 'center', background: '#fffbeb', border: '1px solid #fef3c7', padding: '6px 10px', borderRadius: '6px', color: '#b45309' }}>
                    <span>Customer Phone</span>
                    <strong style={{ fontSize: '11px', fontWeight: '700' }}>🔒 Hidden until accepted</strong>
                  </div>
                )}

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
              {req.status === 'assigned' || req.status === 'active' || req.status === 'arrived' ? (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      const warnMsg = "⚠️ WARNING: Cancelling this scheduled service will affect your profile rating and downgrade your operational ranking.\n\nAre you sure you want to proceed to cancellation?";
                      if (window.confirm(warnMsg)) {
                        setSelectedDetailsRequest(null);
                        setOrderToCancel(req);
                        setShowCancelModal(true);
                      }
                    }}
                    style={{ flex: 1, padding: '12px', background: '#fef2f2', border: '1.5px solid #fca5a5', color: '#dc2626', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', fontSize: '13px' }}
                  >
                    Cancel Service
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDetailsRequest(null)}
                    style={{ flex: 1, padding: '12px', background: 'var(--primary)', border: 'none', color: '#fff', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', fontSize: '13px' }}
                  >
                    Close
                  </button>
                </div>
              ) : (
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
              )}

            </div>
          </div>
        );
      })()}
    </div>
  );
}
