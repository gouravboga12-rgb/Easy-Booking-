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
          <MdConstruction className="ath-logo-icon" />
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

      <div className="admin-content">
        <Outlet />
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
