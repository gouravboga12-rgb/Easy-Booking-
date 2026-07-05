import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useStore } from '../store/useStore';
import {
  HiChevronDown, HiChevronUp,
  HiClipboardList, HiCog, HiLogout,
  HiShoppingCart, HiLocationMarker, HiUser,
  HiSearch
} from 'react-icons/hi';
import { MdConstruction } from 'react-icons/md';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const cartCount = useStore(s => s.cart.length);
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [dropOpen, setDropOpen] = useState(false);
  const [loc, setLoc] = useState('');
  const [navSearchVal, setNavSearchVal] = useState(params.get('q') || '');
  const dropRef = useRef();

  const isHome = location.pathname === '/';

  useEffect(() => {
    const handler = (e) => { if (!dropRef.current?.contains(e.target)) setDropOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => { logout(); navigate('/'); setDropOpen(false); };

  useEffect(() => {
    setNavSearchVal(params.get('q') || '');
  }, [params]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    navigate(`/browse?q=${encodeURIComponent(navSearchVal)}`);
  };

  const handleNavSearchFocus = () => {
    if (location.pathname !== '/browse') {
      navigate('/browse');
      setTimeout(() => {
        const inp = document.querySelector('.search-input');
        inp?.focus();
      }, 100);
    } else {
      const inp = document.querySelector('.search-input');
      inp?.focus();
    }
  };

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
            <span>Parrow <b>Skills</b></span>
          </Link>
          
          {/* Location row for mobile (stacked) */}
          <div className="location-row mobile-only-loc">
            <HiLocationMarker className="loc-icon" />
            <span className="location-text">{loc || 'Detecting...'}</span>
          </div>

          {/* Location row for desktop (side-by-side) */}
          <div className="desktop-loc-row desktop-only">
            <HiLocationMarker className="loc-icon-desktop" />
            <div className="loc-text-group">
              <span className="loc-label">Current Location</span>
              <span className="loc-value">
                {loc || 'Detecting...'} <HiChevronDown className="loc-chevron" />
              </span>
            </div>
          </div>
        </div>

        <div className="nav-right">
          {/* Menu links (desktop only) */}
          <div className="nav-menu-links desktop-only">
            <button className="nav-link-btn" onClick={handleNavSearchFocus}>
              <HiSearch className="nav-link-icon" />
              <span>Search</span>
            </button>
          </div>

          {/* Guest Sign In Link (if not logged in) */}
          {!user && (
            <Link to="/login" className="nav-signin-btn">
              <HiUser className="signin-icon" />
              <span>Sign In</span>
            </Link>
          )}

          {/* Cart Button */}
          <button className="cart-btn" onClick={() => navigate('/cart')}>
            <HiShoppingCart className="cart-icon" />
            <span className="cart-label">Cart</span>
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>

          {/* Profile Dropdown (Only show after login) */}
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
                    <>
                      <Link to="/profile" className="drop-item" onClick={() => setDropOpen(false)}>
                        <HiUser className="drop-icon" /> My Profile
                      </Link>
                      <Link to="/orders" className="drop-item" onClick={() => setDropOpen(false)}>
                        <HiClipboardList className="drop-icon" /> My Orders
                      </Link>
                    </>
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
    </nav>
  );
}
