import { useState } from 'react';
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
import './BookingFlow.css';

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

  if (!vehicle) return <div className="not-found">Service not found.</div>;

  const total = vehicle.rate * form.duration;

  const handleBook = () => {
    const customer = user
      ? { id: user.id, name: user.name, phone: user.phone }
      : { name: 'Guest', phone: '' };
    const order = placeOrder(
      vehicle,
      {
        ...form,
        date: bookingType === 'instant' ? new Date().toISOString().split('T')[0] : form.date,
        timeSlot: bookingType === 'instant' ? 'Will approach in 15 minutes' : timeSlot,
        bookingType,
        total
      },
      customer
    );
    navigate(`/track/${order.id}`);
  };

  const handleAddToCart = () => {
    addToCart(vehicle, {
      ...form,
      date: bookingType === 'instant' ? new Date().toISOString().split('T')[0] : form.date,
      timeSlot: bookingType === 'instant' ? 'Will approach in 15 minutes' : timeSlot,
      bookingType,
      total
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
              <span className="step-circle">1</span> Service Details
            </span>
            <span className="sep-line" />
            <span className={step >= 2 ? 'done' : ''}>
              <span className="step-circle">2</span> Confirm & Pay
            </span>
          </div>

          {step === 1 && (
            <div className="form-section">
              <h2>Where & When?</h2>

              <label>
                <span className="lbl-text">Booking Mode</span>
                <div style={{ display: 'flex', gap: '10px', marginTop: '6px', marginBottom: '14px' }}>
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
                onClick={() => setStep(2)}
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
                    <span><HiDocumentText className="cd-icon" /> Notes</span>
                    <strong>{form.notes}</strong>
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
