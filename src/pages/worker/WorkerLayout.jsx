import { NavLink, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { HiHome, HiClipboardList, HiClock, HiCurrencyRupee, HiUser, HiLightningBolt } from 'react-icons/hi';
import { MdConstruction } from 'react-icons/md';
import './Worker.css';

const NAV = [
  { to: '/worker',              icon: HiHome,           label: 'Home'    },
  { to: '/worker/orders',       icon: HiClipboardList,  label: 'Orders'  },
  { to: '/worker/history',      icon: HiClock,          label: 'History' },
  { to: '/worker/wallet',       icon: HiCurrencyRupee,  label: 'Payments & Earnings'  },
  { to: '/worker/subscription', icon: HiLightningBolt,  label: 'Subscription Plan'  },
  { to: '/worker/profile',      icon: HiUser,           label: 'Profile' },
];

export default function WorkerLayout() {
  const user = useAuthStore(s => s.user);
  if (!user) return null;

  return (
    <div className="worker-layout">
      {/* Sidebar for Desktop & Tablet view */}
      <aside className="worker-sidebar">
        <div className="ws-brand">
          <MdConstruction className="ws-logo-icon" />
          <span>Parrow <b>Skills</b></span>
          <span className="ws-badge">Worker</span>
        </div>
        <div className="ws-user-profile">
          <div className="ws-avatar">{user.name.charAt(0)}</div>
          <div className="ws-user-info">
            <strong>{user.name}</strong>
            <span className={`ws-status ${user.available ? 'online' : 'offline'}`}>
              {user.available ? '● Online' : '○ Offline'}
            </span>
          </div>
        </div>
        <nav className="ws-nav">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/worker'}
              className={({ isActive }) => `ws-nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon className="ws-nav-icon" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main content wrapper */}
      <div className="worker-main">
        {/* Mobile View Top Header */}
        <header className="worker-top-header">
          <div className="wth-brand">
            <MdConstruction className="wth-logo-icon" />
            <span>Parrow <b>Skills</b></span>
            <span className="wth-badge">Worker</span>
          </div>
          <div className="wth-user">
            <div className="wth-avatar">{user.name.charAt(0)}</div>
            <div className="wth-info">
              <strong>{user.name.split(' ')[0]}</strong>
              <span className={`wth-status ${user.available ? 'online' : 'offline'}`}>
                {user.available ? '● Online' : '○ Offline'}
              </span>
            </div>
          </div>
        </header>

        {/* Dynamic content rendering */}
        <main className="worker-content">
          <Outlet />
        </main>
      </div>

      {/* Mobile View Bottom Navigation */}
      <nav className="worker-bottom-nav">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/worker'}
            className={({ isActive }) => `wbn-item ${isActive ? 'active' : ''}`}
          >
            <Icon className="wbn-icon" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
