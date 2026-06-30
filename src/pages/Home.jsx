import { useState, useEffect, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import { categories } from '../data/vehicles';
import { useStore } from '../store/useStore';
import Footer from '../components/Footer';
import {
  HiStar, HiUsers, HiTruck, HiLocationMarker,
  HiShieldCheck, HiLightningBolt, HiPhone,
  HiArrowRight, HiChevronRight, HiSearch, HiCheckCircle, HiBadgeCheck,
} from 'react-icons/hi';
import {
  MdConstruction, MdEngineering,
  MdSecurity, MdOutlineVerified,
  MdHomeWork, MdCleaningServices, MdDirectionsCar, MdRestaurant, MdBuild
} from 'react-icons/md';
import { FaHammer } from 'react-icons/fa';
import './Home.css';

const BANNERS = [
  { id: 1, tag: 'Most Booked', title: 'Electricians & Plumbers', sub: 'Verified professionals at your doorstep in 60 mins', cta: 'Book Electrician', vehicleId: 'electricians', bg: 'linear-gradient(120deg,#1a1a2e,#16213e)', accent: '#4f46e5', img: '/images/services/electricians.png' },
  { id: 2, tag: 'Instant Booking', title: 'Deep Cleaning Staff', sub: 'Expert housekeepers & deep cleaning for your home', cta: 'Book Cleaner', vehicleId: 'cleaning-staff', bg: 'linear-gradient(120deg,#0f3460,#533483)', accent: '#fbbf24', img: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=700&q=80' },
  { id: 3, tag: 'Fast Booking', title: 'Construction & Site Labour', sub: 'Experienced masons, welders & fabricators on demand', cta: 'Book Labour', vehicleId: 'construction-labour', bg: 'linear-gradient(120deg,#134e4a,#065f46)', accent: '#34d399', img: '/images/services/construction-labour.png' },
  { id: 4, tag: 'Gourmet Dining', title: 'Cooking Chefs & Home Cooks', sub: 'Hire private chefs & daily home cooks instantly', cta: 'Book Cook', vehicleId: 'home-cooks', bg: 'linear-gradient(120deg,#7c2d12,#9a3412)', accent: '#fb923c', img: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=700&q=80' },
];

const WHY = [
  { Icon: MdOutlineVerified, t: 'Verified Operators',  d: 'All operators are background-checked and certified', color: '#3b82f6' },
  { Icon: HiLocationMarker,  t: 'Live GPS Tracking',   d: 'Track your vehicle from dispatch to site in real-time', color: '#ef4444' },
  { Icon: MdSecurity,        t: 'Transparent Pricing', d: 'No hidden charges. Pay only what you see', color: '#10b981' },
  { Icon: HiLightningBolt,   t: 'Instant Booking',     d: 'Confirm your booking in under 60 seconds', color: '#f59e0b' },
  { Icon: HiShieldCheck,     t: 'Insured Services',    d: 'All service delivery is fully insured for your safety', color: '#8b5cf6' },
  { Icon: HiPhone,           t: '24/7 Support',        d: 'Our team is always available to assist you', color: '#06b6d4' },
];

const CAT_ICONS = {
  contractors:           MdHomeWork,
  'construction-labour': MdConstruction,
  'interior-carpentry':  FaHammer,
  professionals:         MdEngineering,
  installations:         MdBuild,
  housekeeping:          MdCleaningServices,
  'drivers-logistics':   MdDirectionsCar,
  'cooking-events':      MdRestaurant,
};

const CAT_COLORS = {
  contractors:           '#4f46e5',
  'construction-labour': '#f59e0b',
  'interior-carpentry':  '#8b5cf6',
  professionals:         '#3b82f6',
  installations:         '#ec4899',
  housekeeping:          '#10b981',
  'drivers-logistics':   '#84cc16',
  'cooking-events':      '#06b6d4',
};

export default function Home() {
  const navigate = useNavigate();
  const [bannerIdx, setBannerIdx] = useState(0);
  const services = useStore(s => s.services);

  const highlightedServices = services
    .filter(v => ['plumbers', 'electricians', 'cleaning-staff', 'carpenters', 'painters', 'ac-technicians'].includes(v.id))
    .map(s => ({
      ...s,
      rating: s.id === 'ac-technicians' ? 4.8 : s.id === 'electricians' ? 4.8 : s.id === 'plumbers' ? 4.7 : s.id === 'carpenters' ? 4.7 : s.id === 'cleaning-staff' ? 4.6 : 4.5
    }));

  useEffect(() => {
    const t = setInterval(() => setBannerIdx(i => (i + 1) % BANNERS.length), 4500);
    return () => clearInterval(t);
  }, []);

  const banner = BANNERS[bannerIdx];
  const isDark = banner.accent === '#fbbf24' || banner.accent === '#34d399';

  return (
    <div className="home">

      {/* ── Search Bar ── */}
      <div className="home-search-bar">
        <button className="home-search-btn" onClick={() => navigate('/browse')}>
          <HiSearch className="hs-icon" />
          <span>Search for Plumber, Electrician, Cook...</span>
        </button>
      </div>

      {/* ── Hero Banner ── */}
      <section className="hero-banner" style={{ background: banner.bg }}>
        <div className="hb-content">
          <span className="hb-tag">
            <HiLightningBolt style={{ width: 12, height: 12 }} /> {banner.tag}
          </span>
          <h1>{banner.title}</h1>
          <p>{banner.sub}</p>
          <div className="hb-actions">
            <button
              className="hb-cta"
              style={{ background: banner.accent, color: isDark ? '#1a1a1a' : '#fff' }}
              onClick={() => navigate(`/book/${banner.vehicleId}`)}
            >
              {banner.cta} <HiArrowRight style={{ width: 16, height: 16 }} />
            </button>
            <button className="hb-browse" onClick={() => navigate('/browse')}>Browse All</button>
          </div>
        </div>
        <div className="hb-visual">
          <img src={banner.img} alt={banner.title} className="hb-img" />
        </div>
        <div className="hb-dots">
          {BANNERS.map((_, i) => (
            <button key={i} className={`dot ${i === bannerIdx ? 'active' : ''}`} onClick={() => setBannerIdx(i)} />
          ))}
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="stats-bar">
        <div className="stats-inner">
          {[
            { Icon: HiStar,     val: '4.8★', label: 'Service Rating' },
            { Icon: HiUsers,    val: '12M+',  label: 'Customers Globally' },
            { Icon: HiUsers,    val: '5000+',  label: 'Verified Professionals' },
            { Icon: HiLocationMarker, val: '50+', label: 'Cities Covered' },
          ].map(({ Icon, val, label }, i) => (
            <Fragment key={label}>
              {i > 0 && <div className="stat-divider" />}
              <div className="stat-item">
                <Icon className="stat-icon" />
                <strong>{val}</strong>
                <span>{label}</span>
              </div>
            </Fragment>
          ))}
        </div>
      </section>

      {/* ── Popular Services & Workers ── */}
      <section className="section services-section">
        <div className="section-inner">
          <div className="section-header">
            <div>
              <h2>Popular Services</h2>
              <p className="section-sub">Skilled workers at your doorstep</p>
            </div>
            <button className="see-all-btn" onClick={() => navigate('/browse')}>See all <HiChevronRight style={{ width: 14, height: 14, verticalAlign: 'middle' }} /></button>
          </div>
          <div className="h-scroll">
            {highlightedServices.map(s => (
              <div key={s.id} className="service-card" onClick={() => navigate(`/book/${s.id}`)}>
                <div className="sc-img-wrap">
                  <img src={s.image} alt={s.name} className="sc-img" />
                  <div className="sc-rating"><HiStar style={{ width: 11, height: 11, color: '#f59e0b' }} /> {s.rating}</div>
                </div>
                <div className="sc-body">
                  <div className="sc-name">{s.name}</div>
                  <div className="sc-desc">{s.desc}</div>
                  <div className="sc-footer">
                    <div>
                      <span className="sc-rate">₹{s.rate}</span>
                      <span className="sc-unit">/{s.unit}</span>
                    </div>
                    <button className="sc-book" onClick={e => { e.stopPropagation(); navigate(`/book/${s.id}`); }}>Book</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Category Scroll Sections ── */}
      {categories.map((cat, idx) => {
        const CatIcon = CAT_ICONS[cat.id] || MdConstruction;
        const color = CAT_COLORS[cat.id] || '#4f46e5';
        return (
          <section key={cat.id} className={`section ${idx % 2 === 1 ? 'section-gray' : ''}`}>
            <div className="section-inner">
              <div className="section-header">
                <div className="cat-section-title">
                  <div className="cat-section-icon-wrap" style={{ background: color + '18', color }}>
                    <CatIcon className="cat-section-icon" />
                  </div>
                  <div>
                    <h2>{cat.label}</h2>
                    <span className="cat-section-count">{cat.vehicles.filter(v => v.id !== 'admin-approved-category').length} services</span>
                  </div>
                </div>
                <button className="see-all-btn" onClick={() => navigate(`/browse?cat=${cat.id}`)}>See all <HiChevronRight style={{ width: 14, height: 14, verticalAlign: 'middle' }} /></button>
              </div>
              <div className="h-scroll">
                {cat.vehicles.filter(v => v.id !== 'admin-approved-category').map(v => (
                  <div key={v.id} className="hs-card" onClick={() => navigate(`/book/${v.id}`)}>
                    <div className="hs-img-wrap">
                      <img src={v.image} alt={v.name} className="hs-img" />
                      <div className="hs-overlay">
                        <span className="hs-avail">✓ Available</span>
                      </div>
                    </div>
                    <div className="hs-body">
                      <div className="hs-name">{v.name}</div>
                      <div className="hs-desc">{v.desc}</div>
                      <div className="hs-footer">
                        <div>
                          <span className="hs-rate">₹{v.rate.toLocaleString()}</span>
                          <span className="hs-unit">/{v.unit}</span>
                        </div>
                        <button className="hs-book" style={{ background: color }} onClick={e => { e.stopPropagation(); navigate(`/book/${v.id}`); }}>Book</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      })}

      {/* ── How it works ── */}
      <section className="section section-dark">
        <div className="section-inner">
          <h2 className="white-h2">How EasyBooking Works</h2>
          <p className="white-sub">Book skilled services in 3 simple steps</p>
          <div className="steps-row">
            {[
              { n: '01', Icon: HiLocationMarker, t: 'Set Your Location',  d: 'Enter your service address' },
              { n: '02', Icon: MdBuild,            t: 'Choose Service',    d: 'Pick from 25+ services with live availability' },
              { n: '03', Icon: HiCheckCircle,    t: 'Confirm & Track',    d: 'Book instantly and track your provider live' },
            ].map(({ n, Icon, t, d }) => (
              <div key={n} className="step-card">
                <div className="step-num">{n}</div>
                <Icon className="step-icon" />
                <strong>{t}</strong>
                <p>{d}</p>
              </div>
            ))}
          </div>
          <button className="cta-big" onClick={() => navigate('/browse')}>
            Book Your First Service <HiArrowRight style={{ width: 18, height: 18, verticalAlign: 'middle' }} />
          </button>
        </div>
      </section>

      {/* ── Why HireMee ── */}
      <section className="section">
        <div className="section-inner">
          <h2>Why Choose EasyBooking?</h2>
          <div className="why-grid">
            {WHY.map(({ Icon, t, d, color }) => (
              <div key={t} className="why-card">
                <div className="why-icon-wrap" style={{ background: color + '18', color }}>
                  <Icon className="why-icon" />
                </div>
                <strong>{t}</strong>
                <p>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
