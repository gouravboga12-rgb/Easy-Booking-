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
          <img src="/logo.png" alt="Logo" style={{ height: '36px', width: 'auto', marginRight: '8px', objectFit: 'contain' }} />
          <span>Parrow <b>Skills</b></span>
          <span className="ws-badge">Worker</span>
        </div>
        <div className="ws-user-profile" style={{ position: 'relative' }}>
          <div className="ws-avatar">{user.name.charAt(0)}</div>
          <div className="ws-user-info">
            <strong>{user.name}</strong>
            <span className={`ws-status ${user.available ? 'online' : 'offline'}`}>
              {user.available ? '● Online' : '○ Offline'}
            </span>
          </div>
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '9px',
            fontWeight: '800',
            color: '#10b981',
            background: '#ecfdf5',
            padding: '2px 6px',
            borderRadius: '10px',
            border: '1px solid #a7f3d0'
          }}>
            <span className="live-dot" style={{
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              background: '#10b981',
              animation: 'livePulse 1.5s infinite'
            }}></span>
            LIVE
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
            <img src="/logo.png" alt="Logo" style={{ height: '30px', width: 'auto', marginRight: '8px', objectFit: 'contain' }} />
            <span>Parrow <b>Skills</b></span>
            <span className="wth-badge">Worker</span>
          </div>
          <div className="wth-user" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="wth-avatar">{user.name.charAt(0)}</div>
            <div className="wth-info">
              <strong>{user.name.split(' ')[0]}</strong>
              <span className={`wth-status ${user.available ? 'online' : 'offline'}`}>
                {user.available ? '● Online' : '○ Offline'}
              </span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '8.5px',
              fontWeight: '800',
              color: '#10b981',
              background: '#ecfdf5',
              padding: '1.5px 5px',
              borderRadius: '8px',
              border: '1px solid #a7f3d0',
              marginLeft: '4px'
            }}>
              <span className="live-dot" style={{
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                background: '#10b981',
                animation: 'livePulse 1.5s infinite'
              }}></span>
              LIVE
            </div>
          </div>
        </header>

        {/* Dynamic content rendering */}
        <main className="worker-content" style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 70px)', paddingBottom: '0' }}>
          <div style={{ flex: 1, padding: '20px' }}>
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
              Developed by <a href="https://www.codtechitsolutions.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#fbbf24', textDecoration: 'none', fontWeight: 'bold' }}>CODTECH IT SOLUTIONS</a>
            </div>
          </footer>
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
