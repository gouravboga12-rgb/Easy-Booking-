import { NavLink, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { HiHome, HiClipboardList, HiClock, HiCurrencyRupee, HiUser } from 'react-icons/hi';
import { MdConstruction } from 'react-icons/md';
import './Worker.css';

const NAV = [
  { to: '/worker',          icon: HiHome,           label: 'Home'    },
  { to: '/worker/orders',   icon: HiClipboardList,  label: 'Orders'  },
  { to: '/worker/history',  icon: HiClock,          label: 'History' },
  { to: '/worker/wallet',   icon: HiCurrencyRupee,  label: 'Wallet'  },
  { to: '/worker/profile',  icon: HiUser,           label: 'Profile' },
];

export default function WorkerLayout() {
  const user = useAuthStore(s => s.user);
  if (!user) return null;

  return (
    <div className="worker-layout">
      <header className="worker-top-header">
        <div className="wth-brand">
          <MdConstruction className="wth-logo-icon" />
          <span>Hire<b>Mee</b></span>
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
      <div className="worker-content">
        <Outlet />
      </div>
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
