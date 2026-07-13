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

  const vehicle = allVehicles.find(v => v.id === id);
  const [bookingType, setBookingType] = useState('instant');
  const [timeSlot, setTimeSlot] = useState('09:00 AM - 11:00 AM');
  const [form, setForm] = useState({
    location: '',
    date: new Date().toISOString().split('T')[0],
    duration: 1,
    notes: ''
  });
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

  if (!vehicle) return <div className="not-found">Service not found.</div>;

  const total = vehicle.rate * form.duration;

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
    if (token) {
      try {
        const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&limit=1`);
        const data = await res.json();
        if (data.features && data.features.length > 0) {
          setForm(f => ({ ...f, location: data.features[0].place_name }));
        }
      } catch (err) {
        console.error("Reverse geocoding error:", err);
      }
    }
  };

  const handleMapMoveEnd = (e) => {
    const { latitude, longitude } = e.viewState;
    setCoords({ lat: latitude, lng: longitude });
    reverseGeocode(latitude, longitude);
  };

  const compileNotesAndAnswers = () => {
    let compiled = form.notes || '';
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
    const token = MAPBOX_TOKEN;
    if (token && form.location && !form.location.startsWith('📍 Coords:')) {
      try {
        const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(form.location)}.json?access_token=${token}&limit=1`);
        const data = await res.json();
        if (data.features && data.features.length > 0) {
          const [lng, lat] = data.features[0].center;
          setCoords({ lat, lng });
          setViewState(v => ({ ...v, latitude: lat, longitude: lng }));
        }
      } catch (e) {
        console.error("Geocoding failed, using defaults", e);
      }
    }
    setStep(2);
  };

  const handleBook = () => {
    const customer = user
      ? { id: user.id, name: user.name, phone: user.phone }
      : { name: 'Guest', phone: '' };
    
    const finalNotes = compileNotesAndAnswers();

    placeOrder(
      vehicle,
      {
        ...form,
        lat: coords.lat,
        lng: coords.lng,
        date: bookingType === 'instant' ? new Date().toISOString().split('T')[0] : form.date,
        timeSlot: bookingType === 'instant' ? 'Will approach in 15 minutes' : timeSlot,
        bookingType,
        total,
        notes: finalNotes
      },
      customer
    ).then(order => {
      if (order) navigate(`/track/${order.id}`);
    });
  };

  const handleAddToCart = () => {
    const finalNotes = compileNotesAndAnswers();

    addToCart(vehicle, {
      ...form,
      lat: coords.lat,
      lng: coords.lng,
      date: bookingType === 'instant' ? new Date().toISOString().split('T')[0] : form.date,
      timeSlot: bookingType === 'instant' ? 'Will approach in 15 minutes' : timeSlot,
      bookingType,
      total,
      notes: finalNotes
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
                      onMove={e => setViewState(e.viewState)}
                      onMoveEnd={handleMapMoveEnd}
                      style={{ width: '100%', height: '100%' }}
                      mapStyle="mapbox://styles/mapbox/streets-v12"
                      mapboxAccessToken={MAPBOX_TOKEN}
                    />
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -100%)',
                      pointerEvents: 'none',
                      fontSize: '32px',
                      zIndex: 2,
                      filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))'
                    }}>
                      📍
                    </div>
                  </div>
                )}
              </label>

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

              <label style={{ marginTop: '10px' }}>
                <span className="lbl-text">
                  <HiClock className="lbl-icon" /> Duration ({vehicle.unit === 'hr' ? 'Hours' : 'Trips'})
                </span>
                <div className="duration-ctrl">
                  <button onClick={() => setForm(f => ({ ...f, duration: Math.max(1, f.duration - 1) }))}>−</button>
                  <span>{form.duration} {vehicle.unit === 'hr' ? 'hrs' : 'trips'}</span>
                  <button onClick={() => setForm(f => ({ ...f, duration: f.duration + 1 }))}>+</button>
                </div>
              </label>

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
                <div className="cd-row">
                  <span><HiCalendar className="cd-icon" /> Date / Time</span>
                  <strong>{bookingType === 'instant' ? 'Will approach in 15 minutes' : `${form.date} @ ${timeSlot}`}</strong>
                </div>
                <div className="cd-row">
                  <span><HiClock className="cd-icon" /> Duration</span>
                  <strong>{form.duration} {vehicle.unit === 'hr' ? 'hrs' : 'trips'}</strong>
                </div>
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
                <div className="pay-row"><span>Rate</span><span>₹{vehicle.rate.toLocaleString()} / {vehicle.unit}</span></div>
                <div className="pay-row"><span>Duration</span><span>× {form.duration}</span></div>
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
              ₹{vehicle.rate.toLocaleString()} <span>/ {vehicle.unit}</span>
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
