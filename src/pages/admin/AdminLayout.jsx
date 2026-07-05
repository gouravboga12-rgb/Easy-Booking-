import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useState, useRef, useEffect } from 'react';
import { HiHome, HiClipboardList, HiUsers, HiDotsHorizontal, HiLogout, HiChevronDown } from 'react-icons/hi';
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
  const navigate = useNavigate();
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef();

  const handleLogout = () => { logout(); navigate('/'); };

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
