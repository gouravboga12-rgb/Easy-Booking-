import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { allVehicles } from '../data/vehicles';
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

  const vehicle = allVehicles.find(v => v.id === id);
  const [form, setForm] = useState({ location: '', date: '', duration: 1, notes: '' });
  const [step, setStep] = useState(1);

  if (!vehicle) return <div className="not-found">Vehicle not found.</div>;

  const total = vehicle.rate * form.duration;

  const handleBook = () => {
    const customer = user
      ? { id: user.id, name: user.name, phone: user.phone }
      : { name: 'Guest', phone: '' };
    const order = placeOrder(vehicle, { ...form, total }, customer);
    navigate(`/track/${order.id}`);
  };

  const handleAddToCart = () => {
    addToCart(vehicle, { ...form, total });
    navigate('/cart');
  };

  const FEATURES = [
    { Icon: MdOutlineVerified, text: 'Verified Operator' },
    { Icon: HiShieldCheck,     text: 'Insured Vehicle'  },
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
              <span className="step-circle">1</span> Site Details
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
                <span className="lbl-text">
                  <HiLocationMarker className="lbl-icon" /> Site Location
                </span>
                <input
                  placeholder="Enter site address or landmark"
                  value={form.location}
                  onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                />
              </label>

              <label>
                <span className="lbl-text">
                  <HiCalendar className="lbl-icon" /> Date
                </span>
                <input
                  type="date"
                  value={form.date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                />
              </label>

              <label>
                <span className="lbl-text">
                  <HiClock className="lbl-icon" /> Duration ({vehicle.unit === 'hr' ? 'Hours' : 'Trips'})
                </span>
                <div className="duration-ctrl">
                  <button onClick={() => setForm(f => ({ ...f, duration: Math.max(1, f.duration - 1) }))}>−</button>
                  <span>{form.duration} {vehicle.unit === 'hr' ? 'hrs' : 'trips'}</span>
                  <button onClick={() => setForm(f => ({ ...f, duration: f.duration + 1 }))}>+</button>
                </div>
              </label>

              <label>
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
                disabled={!form.location || !form.date}
                onClick={() => setStep(2)}
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
                  <span><HiLoc className="cd-icon" /> Location</span>
                  <strong>{form.location}</strong>
                </div>
                <div className="cd-row">
                  <span><HiCalendar className="cd-icon" /> Date</span>
                  <strong>{form.date}</strong>
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
