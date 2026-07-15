import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useStore } from '../../store/useStore';
import { useState, useRef, useEffect } from 'react';
import { HiHome, HiClipboardList, HiUsers, HiDotsHorizontal, HiLogout, HiChevronDown, HiRefresh } from 'react-icons/hi';
import { MdEngineering, MdConstruction } from 'react-icons/md';
import './Admin.css';

const NAV = [
  { to: '/admin',           icon: HiHome,           label: 'Dashboard', end: true },
  { to: '/admin/orders',    icon: HiClipboardList,  label: 'Orders'              },
  { to: '/admin/customers', icon: HiUsers,          label: 'Customers'           },
  { to: '/admin/workers',   icon: MdEngineering,    label: 'Workers'             },
  { to: '/admin/more',      icon: HiDotsHorizontal, label: 'More'                },
];

export default function AdminLayout() {
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const fetchWorkers = useAuthStore(s => s.fetchWorkers);
  const fetchOrdersForAdmin = useStore(s => s.fetchOrdersForAdmin);
  const fetchSubscriptionPlans = useStore(s => s.fetchSubscriptionPlans);

  const navigate = useNavigate();
  const location = useLocation();
  const [dropOpen, setDropOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const dropRef = useRef();

  const handleLogout = () => { logout(); navigate('/'); };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (location.pathname.includes('/orders')) {
        await fetchOrdersForAdmin();
      } else if (location.pathname.includes('/workers') || location.pathname.includes('/customers')) {
        await fetchWorkers();
      } else if (location.pathname.includes('/subscriptions')) {
        await fetchSubscriptionPlans();
      } else if (location.pathname === '/admin') {
        await Promise.all([fetchOrdersForAdmin(), fetchWorkers()]);
      } else {
        await Promise.all([fetchOrdersForAdmin(), fetchWorkers(), fetchSubscriptionPlans()]);
      }
    } catch (e) {
      console.error('Refresh error:', e);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500); // Visual indicator delay
    }
  };

  useEffect(() => {
    const handler = (e) => { if (!dropRef.current?.contains(e.target)) setDropOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="admin-layout">
      {/* Top Header */}
      <header className="admin-top-header">
        <div className="ath-brand">
          <img src="/logo.png" alt="Logo" style={{ height: '32px', width: 'auto', marginRight: '8px', objectFit: 'contain' }} />
          <span>Parrow <b>Skills</b></span>
          <span className="ath-badge">Admin</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button 
            onClick={handleRefresh} 
            className="ath-refresh-btn" 
            title="Refresh active page data"
            disabled={isRefreshing}
          >
            <HiRefresh className={`ath-refresh-icon ${isRefreshing ? 'spin-icon' : ''}`} />
          </button>
          <div className="ath-user" ref={dropRef}>
          <button className="ath-user-btn" onClick={() => setDropOpen(o => !o)}>
            <div className="ath-avatar">{user?.name?.charAt(0)}</div>
            <div className="ath-info">
              <strong>{user?.name?.split(' ')[0]}</strong>
              <span>Administrator</span>
            </div>
            <HiChevronDown className={`ath-chevron ${dropOpen ? 'open' : ''}`} />
          </button>
          {dropOpen && (
            <div className="ath-dropdown">
              <div className="ath-drop-header">
                <div className="ath-drop-avatar">{user?.name?.charAt(0)}</div>
                <div>
                  <strong>{user?.name}</strong>
                  <span>{user?.email}</span>
                </div>
              </div>
              <hr className="ath-drop-divider" />
              <button className="ath-drop-item logout" onClick={handleLogout}>
                <HiLogout className="ath-drop-icon" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>

      <div className="admin-content" style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 70px)', paddingBottom: '60px', boxSizing: 'border-box' }}>
        <div style={{ flex: 1, padding: '24px' }}>
          <Outlet />
        </div>

        <footer className="brand-footer" style={{
          background: '#1e293b',
          color: '#f8fafc',
          padding: '24px 16px',
          textAlign: 'center',
          marginTop: 'auto',
          borderTop: '4px solid var(--primary)',
          fontSize: '13px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
            <img src="/logo.png" alt="Company Logo" style={{ height: '36px', width: 'auto', objectFit: 'contain' }} />
            <span style={{ fontSize: '16px', fontWeight: '800', letterSpacing: '0.5px' }}>Parrow <b style={{ color: 'var(--primary)' }}>Skills</b></span>
          </div>
          <p style={{ margin: '4px 0', color: '#cbd5e1', maxWidth: '400px', fontSize: '12px', lineHeight: '1.4' }}>
            Reliable on-demand professional labor and booking management platform.
          </p>
          <div style={{ fontSize: '11px', color: '#94a3b8', borderTop: '1px solid #334155', paddingTop: '8px', width: '100%', maxWidth: '280px', margin: '4px auto 0' }}>
            Developed by <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>Quotec IT Solutions</span>
          </div>
        </footer>
      </div>

      <nav className="admin-bottom-nav">
        {NAV.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `abn-item ${isActive ? 'active' : ''}`}
          >
            <Icon className="abn-icon" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
