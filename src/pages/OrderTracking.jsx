import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useAuthStore } from '../store/useAuthStore';
import { HiLocationMarker, HiCalendar, HiClock, HiDocumentText, HiUser } from 'react-icons/hi';
import Map, { Marker, Source, Layer } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import './OrderTracking.css';

const getCustomerOtp = (customer) => {
  if (!customer) return '4821';
  const digits = customer.phone ? customer.phone.replace(/\D/g, '') : '';
  if (digits.length >= 4) return digits.slice(-4);
  return '4821';
};

export default function OrderTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const orders = useStore(s => s.orders);
  const user = useAuthStore(s => s.user);
  const addWorkerReview = useAuthStore(s => s.addWorkerReview);

  const order = orders.find(o => o.id === id);
  const fetchLiveTracking = useStore(s => s.fetchLiveTracking);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const [trackingData, setTrackingData] = useState(null);
  const [routeGeojson, setRouteGeojson] = useState(null);
  const [eta, setEta] = useState(null);
  const [customerCoords, setCustomerCoords] = useState(null);

  const isComplete = order ? (order.status === 'completed' || order.stage === order.stages.length - 1) : true;

  useEffect(() => {
    if (!order || isComplete) return;

    const getTracking = async () => {
      const data = await fetchLiveTracking(order.id);
      if (data) {
        setTrackingData(data);
      }
    };

    getTracking();
    const interval = setInterval(getTracking, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, [order?.id, isComplete, fetchLiveTracking]);

  useEffect(() => {
    if (trackingData && trackingData.customerLat && trackingData.customerLng) {
      setCustomerCoords({ lat: trackingData.customerLat, lng: trackingData.customerLng });
      return;
    }

    if (!order) return;
    const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    if (!token) return;

    const resolveAddress = async () => {
      try {
        const query = order.location || order.booking?.location;
        if (!query) return;
        const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&limit=1`);
        const data = await res.json();
        if (data.features && data.features.length > 0) {
          const [lng, lat] = data.features[0].center;
          setCustomerCoords({ lat, lng });
        } else {
          setCustomerCoords({ lat: 12.9716, lng: 77.5946 }); // Default Bangalore
        }
      } catch (e) {
        console.error("Geocoding address failed", e);
        setCustomerCoords({ lat: 12.9716, lng: 77.5946 });
      }
    };
    resolveAddress();
  }, [trackingData, order?.location]);

  useEffect(() => {
    if (!customerCoords) return;
    if (!trackingData || !trackingData.workerLocation) {
      setRouteGeojson(null);
      setEta(null);
      return;
    }

    const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    if (!token) return;

    const { lat: wLat, lng: wLng } = trackingData.workerLocation;
    const { lat: cLat, lng: cLng } = customerCoords;

    const fetchRoute = async () => {
      try {
        const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${wLng},${wLat};${cLng},${cLat}?geometries=geojson&access_token=${token}`;
        const res = await fetch(url);
        const json = await res.json();
        if (json.routes && json.routes.length > 0) {
          setRouteGeojson(json.routes[0].geometry);
          const durationMin = Math.round(json.routes[0].duration / 60);
          const distanceKm = (json.routes[0].distance / 1000).toFixed(1);
          setEta(`${durationMin} mins (${distanceKm} km away)`);
        }
      } catch (e) {
        console.error("Failed to fetch directions route", e);
      }
    };

    fetchRoute();
  }, [trackingData?.workerLocation, customerCoords]);

  if (!order) return (
    <div className="not-found">
      <p>Order not found.</p>
      <button onClick={() => navigate('/orders')}>View All Orders</button>
    </div>
  );

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (!order.operator) return;
    addWorkerReview(order.operator.id, {
      author: user?.name || 'Customer Feedback',
      rating: Number(rating),
      comment,
      date: new Date().toLocaleDateString()
    });
    setReviewSubmitted(true);
  };

  return (
    <div className="tracking-page">
      <button className="back-btn" onClick={() => navigate('/orders')}>← My Orders</button>

      <div className="tracking-layout">
        {/* Left: Status */}
        <div className="tracking-main">
          <div className="order-header">
            <div>
              <div className="order-id">Order #{order.id}</div>
              <div className="order-time">Placed at {order.placedAt}</div>
            </div>
            <div className={`status-badge ${isComplete ? 'complete' : 'active'}`}>
              {isComplete ? '✅ Completed' : '🔴 Live'}
            </div>
          </div>

          {/* Progress Tracker */}
          <div className="progress-tracker">
            {order.stages.map((stage, i) => (
              <div key={i} className={`stage ${i <= order.stage ? 'done' : ''} ${i === order.stage ? 'current' : ''}`}>
                <div className="stage-dot">
                  {i < order.stage ? '✓' : i === order.stage ? '●' : '○'}
                </div>
                <div className="stage-info">
                  <span className="stage-name">{stage}</span>
                  {i === order.stage && !isComplete && (
                    <span className="stage-sub">In progress...</span>
                  )}
                  {i < order.stage && <span className="stage-sub">Done</span>}
                </div>
                {i < order.stages.length - 1 && <div className={`stage-line ${i < order.stage ? 'filled' : ''}`} />}
              </div>
            ))}
          </div>

          {/* Universal Service Code (OTP) */}
          {order.stage === 3 && (
            <div style={{ background: '#f5f3ff', border: '1.5px solid #ddd6fe', padding: '16px', borderRadius: '12px', marginBottom: '20px', textAlign: 'center' }}>
              <h4 style={{ margin: '0 0 6px', color: '#6d28d9', fontSize: '14px', fontWeight: '800' }}>🔑 Share Start Code with Operator</h4>
              <p style={{ margin: '0 0 10px', fontSize: '12px', color: '#4c1d95' }}>Provide this 4-digit OTP code to the worker to verify arrival and start the service:</p>
              <strong style={{ fontSize: '28px', color: '#6d28d9', letterSpacing: '4px', background: '#fff', padding: '4px 16px', borderRadius: '8px', border: '1px solid #c084fc', display: 'inline-block' }}>
                {getCustomerOtp(user)}
              </strong>
            </div>
          )}

          {/* Map Tracking */}
          {!isComplete && order.operator && (
            <div className="booking-summary" style={{ marginBottom: '20px', padding: '16px' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '15px' }}>Live Route Tracker</h3>
              {import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ? (
                customerCoords ? (
                  <div style={{ width: '100%', height: '350px', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
                    <Map
                      initialViewState={{
                        longitude: customerCoords.lng,
                        latitude: customerCoords.lat,
                        zoom: 13
                      }}
                      style={{ width: '100%', height: '100%' }}
                      mapStyle="mapbox://styles/mapbox/streets-v12"
                      mapboxAccessToken={import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}
                    >
                      <Marker longitude={customerCoords.lng} latitude={customerCoords.lat} anchor="bottom">
                        <div style={{ fontSize: '24px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>📍</div>
                      </Marker>

                      {trackingData && trackingData.workerLocation && (
                        <Marker longitude={trackingData.workerLocation.lng} latitude={trackingData.workerLocation.lat} anchor="center">
                          <div style={{ fontSize: '28px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>🛵</div>
                        </Marker>
                      )}

                      {routeGeojson && (
                        <Source id="route" type="geojson" data={{ type: 'Feature', geometry: routeGeojson }}>
                          <Layer
                            id="route-line"
                            type="line"
                            paint={{
                              'line-color': '#8b5cf6',
                              'line-width': 5,
                              'line-opacity': 0.8
                            }}
                          />
                        </Source>
                      )}
                    </Map>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#888', background: '#fafafa', borderRadius: '12px' }}>
                    🛰️ Initializing GPS satellite connections...
                  </div>
                )
              ) : (
                <div style={{ padding: '20px', background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '12px', color: '#b45309', fontSize: '13px' }}>
                  ⚠️ Live map tracking is disabled. Please configure your <strong>VITE_MAPBOX_ACCESS_TOKEN</strong> in the environment setup.
                </div>
              )}
            </div>
          )}

          {/* Booking Details */}
          <div className="booking-summary">
            <h3>Booking Details</h3>
            <div className="bs-row"><span>📍 Location</span><strong>{order.booking.location}</strong></div>
            <div className="bs-row"><span>📅 Date</span><strong>{order.booking.date}</strong></div>
            <div className="bs-row"><span>⏱ Duration</span><strong>{order.booking.duration} {order.vehicle.unit === 'hr' ? 'hrs' : 'trips'}</strong></div>
            <div className="bs-row total"><span>💰 Total</span><strong>₹{order.booking.total?.toLocaleString()}</strong></div>
          </div>

          {/* Feedback/Review Submission */}
          {isComplete && order.operator && (
            <div className="booking-summary" style={{ marginTop: '20px', background: '#ecfdf5', borderColor: '#a7f3d0' }}>
              <h3 style={{ color: '#065f46', margin: 0 }}>Rate Your Experience</h3>
              <p style={{ fontSize: '12px', color: '#666', margin: '4px 0 12px' }}>How was the service provided by {order.operator.name}?</p>
              
              {reviewSubmitted ? (
                <div style={{ background: '#fff', border: '1px solid #a7f3d0', padding: '12px', borderRadius: '8px', color: '#15803d', fontSize: '13px', fontWeight: '600' }}>
                  ✔️ Thank you! Your rating and comments have been shared with {order.operator.name}.
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#444' }}>Rating:</span>
                    <select value={rating} onChange={e => setRating(e.target.value)} style={{ padding: '6px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px' }}>
                      <option value="5">⭐⭐⭐⭐⭐ Excellent (5/5)</option>
                      <option value="4">⭐⭐⭐⭐ Good (4/5)</option>
                      <option value="3">⭐⭐⭐ Average (3/5)</option>
                      <option value="2">⭐⭐ Fair (2/5)</option>
                      <option value="1">⭐ Poor (1/5)</option>
                    </select>
                  </div>
                  <div>
                    <textarea
                      placeholder={`Tell us how ${order.operator.name} did...`}
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      required
                      style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '13px', fontFamily: 'inherit' }}
                      rows={3}
                    />
                  </div>
                  <button type="submit" style={{ background: '#10b981', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
                    Submit Rating & Review
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Right: Operator Card */}
        <div className="operator-card">
          <h3>Your Operator</h3>
          {order.operator ? (
            <>
              <div className="op-avatar" style={{ overflow: 'hidden', width: '70px', height: '70px', borderRadius: '50%', margin: '0 auto 10px', border: '2px solid var(--primary-light)' }}>
                <img src={order.operator.photo || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=120&q=80'} alt={order.operator.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div className="op-name">{order.operator.name}</div>
              <div className="op-rating">⭐ {order.operator.rating}</div>
              <div className="op-vehicle">{order.operator.vehicle}</div>
              <a href={`tel:${order.operator.phone}`} className="call-btn">📞 Call Operator</a>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div className="op-avatar" style={{ fontSize: '32px' }}>🛰️</div>
              <div className="op-name" style={{ color: 'var(--primary)', fontWeight: '700', animation: 'pulse 1.5s infinite', margin: '8px 0 4px' }}>Searching for Operator...</div>
              <p style={{ fontSize: '12px', color: '#888', margin: 0, lineHeight: '1.4' }}>
                We are matching your request with nearby verified service providers. This usually takes under 60 seconds.
              </p>
            </div>
          )}

          <div className="vehicle-info">
            <div className="vi-icon">🚜</div>
            <div>
              <strong>{order.vehicle?.name ?? 'Vehicle'}</strong>
              <p>{order.vehicle?.desc ?? ''}</p>
            </div>
          </div>

          {order.operator && !isComplete && (
            <div className="eta-box">
              <div className="eta-label">Estimated Arrival</div>
              <div className="eta-time" style={{ fontSize: (order.stage === 2 && eta) ? '18px' : '22px' }}>
                {order.stage === 1 ? 'Will approach in 15 minutes' : (order.stage === 2 && eta) ? eta : order.stage === 2 ? 'En Route (Approaching...)' : 'On Site (Working...)'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
