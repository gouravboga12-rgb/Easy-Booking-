import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useAuthStore } from '../store/useAuthStore';
import {
  HiArrowLeft, HiArrowRight, HiLocationMarker, HiCalendar,
  HiClock, HiDocumentText, HiCheckCircle, HiShieldCheck,
  HiLocationMarker as HiLoc, HiCurrencyRupee,
} from 'react-icons/hi';
import { MdOutlineVerified, MdGpsFixed } from 'react-icons/md';
import { GiAutoRepair } from 'react-icons/gi';
import Map from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import './BookingFlow.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoiYW5zYXIta2hhbiIsImEiOiJjbXJpbGU3aGQxcDh2Mnlxem16czZqeXRoIn0.82kFrUjOX09W8Hki5ARTkw';
const FALLBACK = 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80';

export default function BookingFlow() {
  const { id } = useParams();
  const navigate = useNavigate();
  const placeOrder = useStore(s => s.placeOrder);
  const addToCart = useStore(s => s.addToCart);
  const user = useAuthStore(s => s.user);
  const allVehicles = useStore(s => s.services);

  useEffect(() => {
    if (!user) {
      alert("Please login first to book a service.");
      navigate('/login', { state: { from: `/book/${id}` } });
    }
  }, [user, id, navigate]);

  const vehicle = allVehicles.find(v => v.id === id);

  useEffect(() => {
    if (vehicle && vehicle.available === false) {
      alert("This service is currently unavailable for booking. Please select another service.");
      navigate('/browse');
    }
  }, [vehicle, navigate]);
  const [bookingType, setBookingType] = useState('instant');
  const [timeSlot, setTimeSlot] = useState('09:00 AM - 11:00 AM');
  const [form, setForm] = useState({
    location: '',
    manualAddress: '',
    date: new Date().toISOString().split('T')[0],
    duration: 1,
    notes: '',
    bookingName: user?.name || '',
    bookingPhone: user?.phone || '',
    whatsappPhone: '',
    email: user?.email || ''
  });

  useEffect(() => {
    if (user) {
      setForm(f => ({
        ...f,
        bookingName: f.bookingName || user.name || '',
        bookingPhone: f.bookingPhone || user.phone || '',
        email: f.email || user.email || ''
      }));
    }
  }, [user]);

  const [step, setStep] = useState(1);
  const [coords, setCoords] = useState({ lat: 12.9716, lng: 77.5946 }); // Default: Bangalore
  const [locLoading, setLocLoading] = useState(false);
  const [viewState, setViewState] = useState({
    latitude: 12.9716,
    longitude: 77.5946,
    zoom: 14
  });

  // Dynamic answers state for custom options fields
  const [customAnswers, setCustomAnswers] = useState({});

  const [isMoving, setIsMoving] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);

  // Selected tier for tiered / custom pricing
  const [selectedTier, setSelectedTier] = useState(null);
  // Workers count for per-person tier pricing
  const [workersCount, setWorkersCount] = useState(1);

  // Initialize selected tier on service load (for tier and custom types)
  useEffect(() => {
    if (vehicle && vehicle.pricing_type === 'dynamic') {
      const ts = vehicle.pricing_rules?.tiers || [];
      if (ts.length > 0) {
        setSelectedTier(prev => {
          if (!prev) return ts[0];
          // Preserve current selection if it still exists in updated tiers
          const found = ts.find(t =>
            (t.value !== undefined && t.value === prev.value) ||
            (t.label !== undefined && t.label === prev.label)
          );
          return found || ts[0];
        });
      }
    }
  }, [vehicle?.id]);

  const getShortAddress = (addr) => {
    if (!addr) return 'Select location';
    const parts = addr.split(',');
    return parts[0].trim();
  };

  if (!vehicle) return <div className="not-found">Service not found.</div>;

  const tiers = vehicle.pricing_rules?.tiers || [];

  let total = 0;
  if (vehicle.pricing_type === 'dynamic') {
    if (vehicle.pricing_rules?.type === 'person') {
      // tiers are {value: workerCount, price: totalPrice}
      total = selectedTier ? selectedTier.price : 0;
    } else if (vehicle.pricing_rules?.type === 'tier' || vehicle.pricing_rules?.type === 'custom') {
      total = selectedTier ? selectedTier.price : 0;
    }
  } else {
    total = vehicle.rate * form.duration;
  }

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        setViewState(v => ({ ...v, latitude, longitude }));
        setLocLoading(false);
        // Reverse geocoding to write place name
        reverseGeocode(latitude, longitude);
      },
      (err) => {
        console.error(err);
        setLocLoading(false);
        alert("Unable to fetch location. Please enter address manually.");
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const reverseGeocode = async (lat, lng) => {
    const token = MAPBOX_TOKEN;
    setAddressLoading(true);
    let resolvedAddress = '';
    
    // 1. Try Mapbox
    if (token) {
      try {
        const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&limit=1`);
        if (res.ok) {
          const data = await res.json();
          if (data.features && data.features.length > 0) {
            resolvedAddress = data.features[0].place_name;
          }
        }
      } catch (err) {
        console.error("Reverse geocoding Mapbox error:", err);
      }
    }

    // 2. Try Nominatim fallback
    if (!resolvedAddress) {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
        if (res.ok) {
          const data = await res.json();
          resolvedAddress = data.display_name || '';
        }
      } catch (err) {
        console.error("Reverse geocoding Nominatim error:", err);
      }
    }

    if (resolvedAddress) {
      setForm(f => ({ ...f, location: resolvedAddress }));
    }
    setAddressLoading(false);
  };

  const handleMapMoveEnd = (e) => {
    const { latitude, longitude } = e.viewState;
    setCoords({ lat: latitude, lng: longitude });
    reverseGeocode(latitude, longitude);
  };

  const handleAddressLookup = async () => {
    if (!form.location || form.location.startsWith('📍 Coords:')) return;
    setAddressLoading(true);
    const token = MAPBOX_TOKEN;
    let lat = null;
    let lng = null;

    if (token) {
      try {
        const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(form.location)}.json?access_token=${token}&limit=1`);
        if (res.ok) {
          const data = await res.json();
          if (data.features && data.features.length > 0) {
            const center = data.features[0].center;
            lng = center[0];
            lat = center[1];
          }
        }
      } catch (e) {
        console.error("Mapbox geocoding failed, trying OSM:", e);
      }
    }

    if (lat === null || lng === null) {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(form.location)}&format=json&limit=1`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            lat = parseFloat(data[0].lat);
            lng = parseFloat(data[0].lon);
          }
        }
      } catch (osmErr) {
        console.error("OSM Nominatim geocoding failed:", osmErr);
      }
    }

    if (lat !== null && lng !== null) {
      setCoords({ lat, lng });
      setViewState(v => ({ ...v, latitude: lat, longitude: lng }));
    }
    setAddressLoading(false);
  };

  const compileNotesAndAnswers = () => {
    let compiled = form.notes || '';
    if (vehicle.pricing_type === 'dynamic' && selectedTier) {
      let pricingText = '';
      if (vehicle.pricing_rules?.type === 'person') {
        pricingText = `Requested Workers: ${selectedTier.value} Worker(s) — Total: ₹${selectedTier.price}`;
      } else if (vehicle.pricing_rules?.type === 'tier') {
        pricingText = `Selected Duration: ${selectedTier.value} Hour(s) — Total: ₹${selectedTier.price}`;
      } else if (vehicle.pricing_rules?.type === 'custom') {
        pricingText = `Selected Option: ${selectedTier.label} — Total: ₹${selectedTier.price}`;
      }
      if (pricingText) {
        compiled = compiled ? `${pricingText}\n\n${compiled}` : pricingText;
      }
    }
    if (vehicle.custom_fields && vehicle.custom_fields.length > 0) {
      const answersText = vehicle.custom_fields
        .map(f => {
          const val = customAnswers[f.id];
          return `- ${f.name}: ${val && val.startsWith('data:') ? '[File/Image Uploaded]' : (val || 'Not specified')}`;
        })
        .join('\n');
      compiled = compiled 
        ? `${compiled}\n\nAdditional Specifications:\n${answersText}`
        : `Additional Specifications:\n${answersText}`;
    }
    return compiled;
  };

  const handleContinue = async () => {
    if (!form.location) {
      alert("Please specify a service address or select it on the map.");
      return;
    }
    if (!form.manualAddress?.trim()) {
      alert("🏠 Manual Address Details is required.");
      return;
    }
    if (!form.bookingName?.trim()) {
      alert("👤 Customer Name is required.");
      return;
    }
    if (!form.bookingPhone?.trim()) {
      alert("📞 Contact Phone Number is required.");
      return;
    }
    if (!form.whatsappPhone?.trim()) {
      alert("💬 WhatsApp Phone Number is required.");
      return;
    }

    const token = MAPBOX_TOKEN;
    let lat = null;
    let lng = null;

    if (form.location && !form.location.startsWith('📍 Coords:')) {
      // 1. Try Mapbox first
      if (token) {
        try {
          const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(form.location)}.json?access_token=${token}&limit=1`);
          if (res.ok) {
            const data = await res.json();
            if (data.features && data.features.length > 0) {
              const center = data.features[0].center;
              lng = center[0];
              lat = center[1];
            }
          }
        } catch (e) {
          console.error("Mapbox geocoding failed, trying OSM:", e);
        }
      }

      // 2. Try Nominatim fallback if Mapbox failed or didn't yield coords
      if (lat === null || lng === null) {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(form.location)}&format=json&limit=1`);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
              lat = parseFloat(data[0].lat);
              lng = parseFloat(data[0].lon);
            }
          }
        } catch (osmErr) {
          console.error("OSM Nominatim geocoding failed:", osmErr);
        }
      }

      if (lat !== null && lng !== null) {
        setCoords({ lat, lng });
        setViewState(v => ({ ...v, latitude: lat, longitude: lng }));
      }
    }
    setStep(2);
  };

  const handleBook = () => {
    const customer = user
      ? { id: user.id, name: user.name, phone: user.phone }
      : { name: 'Guest', phone: '' };
    
    const finalNotes = compileNotesAndAnswers();
    const finalDuration = (vehicle.pricing_type === 'dynamic' && vehicle.pricing_rules?.type === 'tier' && selectedTier)
      ? selectedTier.hours
      : form.duration;

    placeOrder(
      vehicle,
      {
        ...form,
        location: (() => {
          const loc = (form.location || '').trim();
          const manual = (form.manualAddress || '').trim();
          if (!manual) return loc;
          if (loc.toLowerCase().includes(manual.toLowerCase())) return loc;
          if (manual.toLowerCase().includes(loc.toLowerCase())) return manual;
          return `${manual}, ${loc}`;
        })(),
        lat: coords.lat,
        lng: coords.lng,
        date: bookingType === 'instant' ? new Date().toISOString().split('T')[0] : form.date,
        timeSlot: bookingType === 'instant' ? 'Will approach in 15 minutes' : timeSlot,
        bookingType,
        total,
        duration: finalDuration,
        notes: finalNotes,
        customAnswers: customAnswers,
        bookingName: form.bookingName,
        bookingPhone: form.bookingPhone,
        whatsappPhone: form.whatsappPhone,
        email: form.email,
        manualAddress: form.manualAddress
      },
      customer
    ).then(order => {
      if (order) navigate(`/track/${order.id}`);
    });
  };

  const handleAddToCart = () => {
    const finalNotes = compileNotesAndAnswers();
    const finalDuration = (vehicle.pricing_type === 'dynamic' && vehicle.pricing_rules?.type === 'tier' && selectedTier)
      ? selectedTier.hours
      : form.duration;

    addToCart(vehicle, {
      ...form,
      location: (() => {
        const loc = (form.location || '').trim();
        const manual = (form.manualAddress || '').trim();
        if (!manual) return loc;
        if (loc.toLowerCase().includes(manual.toLowerCase())) return loc;
        if (manual.toLowerCase().includes(loc.toLowerCase())) return manual;
        return `${manual}, ${loc}`;
      })(),
      lat: coords.lat,
      lng: coords.lng,
      date: bookingType === 'instant' ? new Date().toISOString().split('T')[0] : form.date,
      timeSlot: bookingType === 'instant' ? 'Will approach in 15 minutes' : timeSlot,
      bookingType,
      total,
      duration: finalDuration,
      notes: finalNotes,
      customAnswers: customAnswers,
      bookingName: form.bookingName,
      bookingPhone: form.bookingPhone,
      whatsappPhone: form.whatsappPhone,
      email: form.email,
      manualAddress: form.manualAddress
    });
    navigate('/cart');
  };

  const FEATURES = [
    { Icon: MdOutlineVerified, text: 'Verified Provider' },
    { Icon: HiShieldCheck,     text: 'Insured Service'  },
    { Icon: MdGpsFixed,        text: 'Live Tracking'    },
    { Icon: GiAutoRepair,      text: 'On-site Support'  },
  ];

  return (
    <div className="booking-flow">
      <button className="back-btn" onClick={() => navigate(-1)}>
        <HiArrowLeft style={{ width: 16, height: 16 }} /> Back
      </button>

      <div className="booking-layout">
        {/* ── Left: Form ── */}
        <div className="booking-form-wrap">
          <div className="booking-steps">
            <span className={step >= 1 ? 'done' : ''}>
              <span className="step-num">1</span> Details
            </span>
            <span className="step-line" />
            <span className={step >= 2 ? 'done' : ''}>
              <span className="step-num">2</span> Confirm
            </span>
          </div>

          {step === 1 && (
            <div className="form-section">
              <h2>Select Booking Options</h2>

              <label>
                <span className="lbl-text">Booking Type</span>
                <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setBookingType('instant');
                      setForm(f => ({ ...f, date: new Date().toISOString().split('T')[0] }));
                    }}
                    style={{
                      flex: 1,
                      padding: '12px',
                      border: '1.5px solid',
                      borderColor: bookingType === 'instant' ? 'var(--primary)' : '#eee',
                      background: bookingType === 'instant' ? 'var(--primary-light)' : '#fff',
                      color: bookingType === 'instant' ? 'var(--primary)' : '#444',
                      borderRadius: '8px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    ⚡ Instant Match (15 Min ETA)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBookingType('scheduled');
                      setForm(f => ({ ...f, date: '' }));
                    }}
                    style={{
                      flex: 1,
                      padding: '12px',
                      border: '1.5px solid',
                      borderColor: bookingType === 'scheduled' ? 'var(--primary)' : '#eee',
                      background: bookingType === 'scheduled' ? 'var(--primary-light)' : '#fff',
                      color: bookingType === 'scheduled' ? 'var(--primary)' : '#444',
                      borderRadius: '8px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    📅 Schedule for Later
                  </button>
                </div>
              </label>

              <label>
                <span className="lbl-text">
                  <HiLocationMarker className="lbl-icon" /> Service Address
                </span>
                <input
                  placeholder="Enter service address or landmark"
                  value={form.location}
                  onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  onBlur={handleAddressLookup}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddressLookup(); }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                  <button
                    type="button"
                    onClick={handleLocateMe}
                    disabled={locLoading}
                    style={{
                      border: 'none',
                      background: 'none',
                      color: 'var(--primary)',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {locLoading ? '⌛ Locating...' : '🎯 Use Current Location'}
                  </button>
                </div>
                {MAPBOX_TOKEN && (
                  <div style={{ position: 'relative', width: '100%', height: '220px', borderRadius: '12px', overflow: 'hidden', marginTop: '10px', border: '1.5px solid #eee' }}>
                    <Map
                      {...viewState}
                      onMoveStart={() => setIsMoving(true)}
                      onMove={e => setViewState(e.viewState)}
                      onMoveEnd={(e) => {
                        setIsMoving(false);
                        handleMapMoveEnd(e);
                      }}
                      style={{ width: '100%', height: '100%' }}
                      mapStyle="mapbox://styles/mapbox/streets-v12"
                      mapboxAccessToken={MAPBOX_TOKEN}
                    />
                    <div className={`map-pin-container ${isMoving ? 'is-moving' : ''}`}>
                      <div className="map-address-bubble">
                        {addressLoading ? (
                          <>
                            <span className="map-spinner" />
                            <span>Locating...</span>
                          </>
                        ) : (
                          <span>{form.location ? getShortAddress(form.location) : 'Pin location'}</span>
                        )}
                      </div>
                      <div className="map-pin-wrapper">
                        <svg width="36" height="46" viewBox="0 0 36 46" fill="none" xmlns="http://www.w3.org/2000/svg" className="map-svg-pin">
                          <path d="M18 0C8.05888 0 0 8.05888 0 18C0 29.8235 15.8824 44.8235 17.1176 45.9412C17.6471 46.4118 18.3529 46.4118 18.8824 45.9412C20.1176 44.8235 36 29.8235 36 18C36 8.05888 27.9411 0 18 0ZM18 25C14.134 25 11 21.866 11 18C11 14.134 14.134 11 18 11C21.866 11 25 14.134 25 18C25 21.866 21.866 25 18 25Z" fill="var(--primary)"/>
                          <circle cx="18" cy="18" r="4.5" fill="#ffffff"/>
                        </svg>
                        <div className="map-pin-shadow" />
                      </div>
                    </div>
                  </div>
                )}
              </label>

              <label style={{ marginTop: '10px' }}>
                <span className="lbl-text">
                  🏠 Manual Address Details <span style={{ color: '#dc2626' }}>*</span>
                </span>
                <input
                  placeholder="Flat/House No, Building, Apartment, Detailed Landmark"
                  value={form.manualAddress}
                  onChange={e => setForm(f => ({ ...f, manualAddress: e.target.value }))}
                  required
                />
              </label>

              {/* ── Customer Booking Contact Information ── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '10px' }}>
                <label>
                  <span className="lbl-text">
                    👤 Customer Name <span style={{ color: '#dc2626' }}>*</span>
                  </span>
                  <input
                    placeholder="Full name for service contact"
                    value={form.bookingName}
                    onChange={e => setForm(f => ({ ...f, bookingName: e.target.value }))}
                    required
                  />
                </label>

                <label>
                  <span className="lbl-text">
                    ✉️ Email ID
                  </span>
                  <input
                    type="email"
                    placeholder="Enter email address (optional)"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  />
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '10px' }}>
                <label>
                  <span className="lbl-text">
                    📞 Contact Phone Number <span style={{ color: '#dc2626' }}>*</span>
                  </span>
                  <input
                    placeholder="Active mobile/phone number"
                    value={form.bookingPhone}
                    onChange={e => setForm(f => ({ ...f, bookingPhone: e.target.value }))}
                    required
                  />
                </label>

                <label>
                  <span className="lbl-text">
                    💬 WhatsApp Phone Number <span style={{ color: '#dc2626' }}>*</span>
                  </span>
                  <input
                    placeholder="WhatsApp contact number"
                    value={form.whatsappPhone}
                    onChange={e => setForm(f => ({ ...f, whatsappPhone: e.target.value }))}
                    required
                  />
                </label>
              </div>

              {bookingType === 'scheduled' && (
                <>
                  <label style={{ marginTop: '10px' }}>
                    <span className="lbl-text">
                      <HiCalendar className="lbl-icon" /> Select Date
                    </span>
                    <input
                      type="date"
                      value={form.date}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    />
                  </label>
                  
                  <label style={{ marginTop: '10px' }}>
                    <span className="lbl-text">
                      <HiClock className="lbl-icon" /> Preferred Time Slot
                    </span>
                    <select
                      value={timeSlot}
                      onChange={e => setTimeSlot(e.target.value)}
                      style={{ padding: '12px', border: '1.5px solid #eee', borderRadius: '8px', width: '100%', fontSize: '14px', marginTop: '6px' }}
                    >
                      <option value="09:00 AM - 11:00 AM">09:00 AM - 11:00 AM</option>
                      <option value="11:00 AM - 01:00 PM">11:00 AM - 01:00 PM</option>
                      <option value="02:00 PM - 04:00 PM">02:00 PM - 04:00 PM</option>
                      <option value="04:00 PM - 06:00 PM">04:00 PM - 06:00 PM</option>
                    </select>
                  </label>
                </>
              )}

              {vehicle.pricing_type === 'dynamic' ? (
                tiers.length > 0 ? (
                  <label style={{ marginTop: '10px' }}>
                    <span className="lbl-text">
                      {vehicle.pricing_rules?.type === 'person' ? '👥 Number of Workers' :
                       vehicle.pricing_rules?.type === 'tier' ? <><HiClock className="lbl-icon" /> Select Duration (Hours)</> :
                       '🎯 Select Option'}
                    </span>
                    <select
                      value={selectedTier ? (selectedTier.value !== undefined ? String(selectedTier.value) : (selectedTier.label || '')) : ''}
                      onChange={e => {
                        const val = e.target.value;
                        const found = tiers.find(t => String(t.value !== undefined ? t.value : t.label) === val);
                        if (found) setSelectedTier(found);
                      }}
                      style={{ padding: '12px', border: '1.5px solid #eee', borderRadius: '8px', width: '100%', fontSize: '14px', marginTop: '6px', background: '#fff' }}
                    >
                      {tiers.map((t, idx) => {
                        const optVal = t.value !== undefined ? String(t.value) : t.label;
                        return (
                          <option key={idx} value={optVal}>
                            {vehicle.pricing_rules?.type === 'person'
                              ? `${t.value} ${t.value === 1 ? 'Worker' : 'Workers'} — ₹${t.price.toLocaleString()}`
                              : vehicle.pricing_rules?.type === 'tier'
                              ? `${t.value} Hour(s) — ₹${t.price.toLocaleString()}`
                              : `${t.label} — ₹${t.price.toLocaleString()}`}
                          </option>
                        );
                      })}
                    </select>
                    {selectedTier && (
                      <div style={{ marginTop: '8px', padding: '10px 14px', background: 'var(--primary-light, #eff6ff)', borderRadius: '8px', border: '1px solid var(--primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', color: '#475569', fontWeight: '600' }}>Estimated Total</span>
                        <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--primary)' }}>₹{total.toLocaleString()}</span>
                      </div>
                    )}
                  </label>
                ) : (
                  <div style={{ marginTop: '10px', padding: '12px', background: '#fef9c3', borderRadius: '8px', border: '1px solid #fde047', fontSize: '13px', color: '#854d0e' }}>
                    ⚠️ No pricing tiers configured for this service yet. Please contact admin.
                  </div>
                )
              ) : (
                vehicle.unit === 'hr' && (
                  <label style={{ marginTop: '10px' }}>
                    <span className="lbl-text">
                      <HiClock className="lbl-icon" /> Duration (Hours)
                    </span>
                    <div className="duration-ctrl">
                      <button type="button" onClick={() => setForm(f => ({ ...f, duration: Math.max(1, f.duration - 1) }))}>−</button>
                      <span>{form.duration} hrs</span>
                      <button type="button" onClick={() => setForm(f => ({ ...f, duration: f.duration + 1 }))}>+</button>
                    </div>
                  </label>
                )
              )}

              {/* Dynamic Service Specifications / Custom Fields */}
              {vehicle.custom_fields && vehicle.custom_fields.length > 0 && (
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b', margin: 0 }}>Service Specifications</h4>
                  {vehicle.custom_fields.map(f => {
                    const value = customAnswers[f.id] || '';
                    const setVal = (val) => setCustomAnswers(prev => ({ ...prev, [f.id]: val }));

                    return (
                      <label key={f.id} style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '12px', fontWeight: '700', color: '#475569', marginTop: '2px' }}>
                        {f.name}
                        {f.type === 'select' ? (
                          <select
                            value={value}
                            onChange={e => setVal(e.target.value)}
                            style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '13px', background: '#fff', width: '100%', marginTop: '4px' }}
                            required
                          >
                            <option value="">-- Choose Option --</option>
                            {f.choices.map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        ) : f.type === 'file' ? (
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '4px' }}>
                            <label style={{ flex: 1, padding: '8px', border: '1px dashed #bbb', borderRadius: '8px', cursor: 'pointer', textAlign: 'center', background: '#fff', fontSize: '12px', fontWeight: '600' }}>
                              {value ? '✔️ File Attached' : '📁 Upload Photo/Document'}
                              <input
                                type="file"
                                accept="image/*,application/pdf"
                                onChange={e => {
                                  const file = e.target.files[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = () => setVal(reader.result);
                                    reader.readAsDataURL(file);
                                  }
                                }}
                                style={{ display: 'none' }}
                              />
                            </label>
                            {value && value.startsWith('data:image/') && (
                              <img src={value} alt="Preview" style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover', border: '1px solid #ddd' }} />
                            )}
                          </div>
                        ) : (
                          <input
                            type={f.type === 'number' ? 'number' : 'text'}
                            value={value}
                            onChange={e => setVal(e.target.value)}
                            placeholder={`Enter ${f.name}`}
                            style={{ padding: '9px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '13px', marginTop: '4px', width: '100%' }}
                            required
                          />
                        )}
                      </label>
                    );
                  })}
                </div>
              )}

              <label style={{ marginTop: '10px' }}>
                <span className="lbl-text">
                  <HiDocumentText className="lbl-icon" /> Special Instructions
                </span>
                <textarea
                  placeholder="Any specific requirements..."
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3}
                />
              </label>

              <button
                className="btn-primary"
                disabled={!form.location || (bookingType === 'scheduled' && !form.date)}
                onClick={handleContinue}
                style={{ marginTop: '14px' }}
              >
                Continue <HiArrowRight style={{ width: 16, height: 16 }} />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="form-section">
              <h2>Confirm Booking</h2>
              <div className="confirm-details">
                <div className="cd-row">
                  <span>Booking Mode</span>
                  <strong>{bookingType === 'instant' ? '⚡ Instant Match' : '📅 Scheduled'}</strong>
                </div>
                <div className="cd-row">
                  <span><HiLoc className="cd-icon" /> Location</span>
                  <strong>{form.location}</strong>
                </div>
                {form.manualAddress && (
                  <div className="cd-row">
                    <span>🏠 Manual Address Details</span>
                    <strong>{form.manualAddress}</strong>
                  </div>
                )}
                <div className="cd-row">
                  <span>👤 Contact Name</span>
                  <strong>{form.bookingName}</strong>
                </div>
                <div className="cd-row">
                  <span>📞 Contact Phone</span>
                  <strong>{form.bookingPhone}</strong>
                </div>
                <div className="cd-row">
                  <span>💬 WhatsApp</span>
                  <strong>{form.whatsappPhone}</strong>
                </div>
                {form.email && (
                  <div className="cd-row">
                    <span>✉️ Email ID</span>
                    <strong>{form.email}</strong>
                  </div>
                )}
                <div className="cd-row">
                  <span><HiCalendar className="cd-icon" /> Date / Time</span>
                  <strong>{bookingType === 'instant' ? 'Will approach in 15 minutes' : `${form.date} @ ${timeSlot}`}</strong>
                </div>
                {vehicle.pricing_type === 'dynamic' ? (
                  selectedTier ? (
                    <div className="cd-row">
                      <span>{vehicle.pricing_rules?.type === 'person' ? '👥 Workers' : vehicle.pricing_rules?.type === 'tier' ? <><HiClock className="cd-icon" /> Duration</> : '🎯 Option'}</span>
                      <strong>
                        {vehicle.pricing_rules?.type === 'person'
                          ? `${selectedTier.value} ${selectedTier.value === 1 ? 'Worker' : 'Workers'}`
                          : vehicle.pricing_rules?.type === 'tier'
                          ? `${selectedTier.value} Hour(s)`
                          : selectedTier.label}
                      </strong>
                    </div>
                  ) : null
                ) : (
                  vehicle.unit === 'hr' && (
                    <div className="cd-row">
                      <span><HiClock className="cd-icon" /> Duration</span>
                      <strong>{form.duration} hrs</strong>
                    </div>
                  )
                )}
                {form.notes && (
                  <div className="cd-row">
                    <span><HiDocumentText className="cd-icon" /> Special Notes</span>
                    <strong>{form.notes}</strong>
                  </div>
                )}
                {Object.keys(customAnswers).length > 0 && (
                  <div className="cd-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Custom Field Answers</span>
                    <div style={{ width: '100%', background: '#fafafa', padding: '10px', borderRadius: '8px', border: '1px solid #eee', fontSize: '12px' }}>
                      {vehicle.custom_fields.map(f => {
                        const val = customAnswers[f.id];
                        return (
                          <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                            <span>{f.name}:</span>
                            <strong>{val && val.startsWith('data:') ? '[Document Uploaded]' : (val || '—')}</strong>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="payment-info">
                <h3><HiCurrencyRupee style={{ width: 16, height: 16, verticalAlign: 'middle' }} /> Payment Summary</h3>
                {vehicle.pricing_type === 'dynamic' ? (
                  selectedTier ? (
                    <>
                      <div className="pay-row">
                        <span>{vehicle.pricing_rules?.type === 'person' ? 'Workers' : vehicle.pricing_rules?.type === 'tier' ? 'Duration' : 'Option'}</span>
                        <span>
                          {vehicle.pricing_rules?.type === 'person'
                            ? `${selectedTier.value} ${selectedTier.value === 1 ? 'Worker' : 'Workers'}`
                            : vehicle.pricing_rules?.type === 'tier'
                            ? `${selectedTier.value} Hour(s)`
                            : selectedTier.label}
                        </span>
                      </div>
                    </>
                  ) : null
                ) : (
                  <>
                    <div className="pay-row"><span>Rate</span><span>₹{vehicle.rate.toLocaleString()} / {vehicle.unit}</span></div>
                    {vehicle.unit === 'hr' && (
                      <div className="pay-row"><span>Duration</span><span>× {form.duration}</span></div>
                    )}
                  </>
                )}
                <div className="pay-row total"><span>Total</span><span>₹{total.toLocaleString()}</span></div>
              </div>

              <div className="confirm-actions">
                <button className="btn-outline" onClick={() => setStep(1)}>
                  <HiArrowLeft style={{ width: 15, height: 15 }} /> Edit
                </button>
                <button className="btn-outline" onClick={handleAddToCart}>
                  🛒 Add to Cart
                </button>
                <button className="btn-primary" onClick={handleBook}>
                  <HiCheckCircle style={{ width: 17, height: 17 }} /> Confirm & Book
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Vehicle Summary ── */}
        <div className="vehicle-summary">
          <div className="vs-img-wrap">
            <img
              src={vehicle.image || FALLBACK}
              alt={vehicle.name}
              className="vs-img"
              onError={e => { e.target.src = FALLBACK; }}
            />
          </div>
          <div className="vs-body">
            <h3>{vehicle.name}</h3>
            <p>{vehicle.desc}</p>
            <div className="vs-rate">
              {vehicle.pricing_type === 'dynamic' ? (
                vehicle.pricing_rules?.type === 'person' ? (
                  <>Tiered <span>(Workers)</span></>
                ) : vehicle.pricing_rules?.type === 'tier' ? (
                  <>Tiered <span>(Hourly)</span></>
                ) : (
                  <>Tiered <span>(Custom)</span></>
                )
              ) : (
                <>₹{vehicle.rate.toLocaleString()} <span>/ {vehicle.unit}</span></>
              )}
            </div>
            <div className="vs-features">
              {FEATURES.map(({ Icon, text }) => (
                <div key={text} className="vs-feat">
                  <Icon className="vs-feat-icon" /> {text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
