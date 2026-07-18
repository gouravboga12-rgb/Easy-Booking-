import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useStore } from '../store/useStore';
import {
  HiChevronDown, HiChevronUp,
  HiClipboardList, HiCog, HiLogout,
  HiShoppingCart, HiLocationMarker, HiUser,
  HiSearch, HiBell, HiX
} from 'react-icons/hi';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const cartCount = useStore(s => s.cart.length);
  const notifications = useStore(s => s.notifications);
  const markNotificationRead = useStore(s => s.markNotificationRead);
  const markAllNotificationsRead = useStore(s => s.markAllNotificationsRead);
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [dropOpen, setDropOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [loc, setLoc] = useState('');
  const [navSearchVal, setNavSearchVal] = useState(params.get('q') || '');
  const dropRef = useRef();
  const notifRef = useRef();

  const isHome = location.pathname === '/';

  useEffect(() => {
    const handler = (e) => {
      if (!dropRef.current?.contains(e.target)) setDropOpen(false);
      if (!notifRef.current?.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Filter notifications relevant to current user's role
  const myNotifs = user ? notifications.filter(n => {
    if (n.audience === 'all') return true;
    if (n.audience === 'workers' && user.role === 'worker') return true;
    if (n.audience === 'customers' && user.role === 'customer') return true;
    return false;
  }) : [];
  const unreadCount = myNotifs.filter(n => !n.read).length;

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
            <img src="/logo.png" alt="Parrow Skills Logo" className="brand-logo" />
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
          {user && user.role === 'customer' && (
            <div className="live-sync-badge desktop-only" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              fontWeight: '700',
              color: '#16a34a',
              background: '#f0fdf4',
              padding: '4px 10px',
              borderRadius: '20px',
              marginLeft: '16px',
              border: '1px solid #bbf7d0',
              height: 'max-content',
              alignSelf: 'center',
              letterSpacing: '0.2px'
            }}>
              <span className="live-sync-dot" style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#16a34a',
                animation: 'badgePop 1.5s infinite alternate'
              }}></span>
              Auto-Refresh Active
            </div>
          )}
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

          {/* Notification Bell (Only for logged-in customer/worker) */}
          {user && (user.role === 'customer' || user.role === 'worker') && (
            <div className="user-menu" ref={notifRef} style={{ position: 'relative' }}>
              <button
                onClick={() => { setNotifOpen(o => !o); setDropOpen(false); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', borderRadius: '50%', color: '#555' }}
                title="Notifications"
              >
                <HiBell style={{ fontSize: '22px' }} />
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: '2px', right: '2px', background: '#ef4444', color: '#fff', borderRadius: '50%', width: '16px', height: '16px', fontSize: '9px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: '340px', background: '#fff', borderRadius: '14px', boxShadow: '0 8px 32px rgba(0,0,0,0.13)', border: '1px solid #eee', zIndex: 9999, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #f3f4f6' }}>
                    <strong style={{ fontSize: '14px', color: '#1a1a1a' }}>🔔 Notifications</strong>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {unreadCount > 0 && (
                        <button onClick={markAllNotificationsRead} style={{ background: 'none', border: 'none', fontSize: '11px', color: '#6366f1', cursor: 'pointer', fontWeight: '700' }}>Mark all read</button>
                      )}
                      <button onClick={() => setNotifOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center' }}><HiX /></button>
                    </div>
                  </div>
                  <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                    {myNotifs.length === 0 ? (
                      <div style={{ padding: '32px 16px', textAlign: 'center', color: '#aaa', fontSize: '13px' }}>
                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔕</div>
                        No notifications yet
                      </div>
                    ) : myNotifs.map(n => (
                      <div
                        key={n.id}
                        onClick={() => markNotificationRead(n.id)}
                        style={{ padding: '12px 16px', borderBottom: '1px solid #f9fafb', display: 'flex', gap: '10px', alignItems: 'flex-start', cursor: 'pointer', background: n.read ? '#fff' : '#f5f3ff', transition: 'background 0.2s' }}
                      >
                        <span style={{ fontSize: '20px', marginTop: '2px' }}>{n.channel === 'email' ? '📧' : n.channel === 'sms' ? '📱' : '🔔'}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: n.read ? '500' : '700', color: '#1a1a1a', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.title}</div>
                          <div style={{ fontSize: '12px', color: '#666', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{n.body}</div>
                          <div style={{ fontSize: '10px', color: '#aaa', marginTop: '4px' }}>{n.sent}</div>
                        </div>
                        {!n.read && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1', flexShrink: 0, marginTop: '6px' }}></span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
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
