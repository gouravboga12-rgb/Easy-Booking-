import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useStore } from '../store/useStore';
import {
  HiChevronDown, HiChevronUp,
  HiClipboardList, HiCog, HiLogout,
  HiShoppingCart, HiLocationMarker, HiUser,
} from 'react-icons/hi';
import { MdConstruction, MdEngineering } from 'react-icons/md';
import { GiCrane, GiPickelhaube } from 'react-icons/gi';
import { FaTractor, FaRoad, FaSpa, FaLeaf } from 'react-icons/fa';
import { TbTruckDelivery } from 'react-icons/tb';
import './Navbar.css';

const CAT_NAV = [
  { id: 'excavation',  label: 'Excavation',  Icon: GiPickelhaube  },
  { id: 'transport',   label: 'Transport',   Icon: TbTruckDelivery },
  { id: 'road',        label: 'Road',        Icon: FaRoad          },
  { id: 'lifting',     label: 'Lifting',     Icon: GiCrane         },
  { id: 'agricultural',label: 'Agricultural',Icon: FaTractor       },
  { id: 'native',      label: 'Native',      Icon: FaLeaf          },
  { id: 'beauty',      label: 'Beauty',      Icon: FaSpa           },
  { id: 'other',       label: 'Other',       Icon: MdEngineering   },
];

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const cartCount = useStore(s => s.cart.length);
  const navigate = useNavigate();
  const location = useLocation();
  const [dropOpen, setDropOpen] = useState(false);
  const [loc, setLoc] = useState('');
  const dropRef = useRef();

  const isHome = location.pathname === '/';

  useEffect(() => {
    const handler = (e) => { if (!dropRef.current?.contains(e.target)) setDropOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => { logout(); navigate('/'); setDropOpen(false); };

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`);
          const data = await res.json();
          if (data.address) setLoc(data.address.suburb || data.address.city_district || data.address.city || 'Unknown');
        } catch { setLoc('Location unavailable'); }
      },
      () => setLoc('Enable location')
    );
  }, []);

  return (
    <nav className="navbar">
      {/* ── Main Row ── */}
      <div className="nav-inner">
        <div className="nav-left">
          <Link to="/" className="brand">
            <MdConstruction className="brand-logo" />
            <span>Hire<b>Mee</b></span>
          </Link>
          <div className="location-row">
            <HiLocationMarker className="loc-icon" />
            <span className="location-text">{loc || 'Detecting...'}</span>
          </div>
        </div>

        <div className="nav-right">
          <button className="cart-btn" onClick={() => navigate('/cart')}>
            <HiShoppingCart className="cart-icon" />
            <span className="cart-label">Cart</span>
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>

          {/* Only show after login */}
          {user && (
            <div className="user-menu" ref={dropRef}>
              <button className="avatar-btn" onClick={() => setDropOpen(o => !o)}>
                <span className="avatar-circle">{user.name.charAt(0).toUpperCase()}</span>
                <span className="avatar-name">{user.name.split(' ')[0]}</span>
                {dropOpen ? <HiChevronUp className="chevron-icon" /> : <HiChevronDown className="chevron-icon" />}
              </button>
              {dropOpen && (
                <div className="dropdown">
                  <div className="drop-header">
                    <strong>{user.name}</strong>
                    <span className={`role-tag ${user.role}`}>{user.role}</span>
                  </div>
                  <div className="drop-email">{user.email}</div>
                  <hr />
                  {user.role === 'customer' && (
                    <Link to="/orders" className="drop-item" onClick={() => setDropOpen(false)}>
                      <HiClipboardList className="drop-icon" /> My Orders
                    </Link>
                  )}
                  {user.role === 'admin' && (
                    <Link to="/admin" className="drop-item" onClick={() => setDropOpen(false)}>
                      <HiCog className="drop-icon" /> Admin Panel
                    </Link>
                  )}
                  {user.role === 'worker' && (
                    <Link to="/worker" className="drop-item" onClick={() => setDropOpen(false)}>
                      <HiCog className="drop-icon" /> My Jobs
                    </Link>
                  )}
                  <button className="drop-item logout" onClick={handleLogout}>
                    <HiLogout className="drop-icon" /> Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Category Nav Row ── */}
      <div className="cat-nav-row">
        {CAT_NAV.map(({ id, label, Icon }) => (
          <button
            key={id}
            className="cat-nav-item"
            onClick={() => navigate(`/browse?cat=${id}`)}
          >
            <Icon className="cat-nav-icon" />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
