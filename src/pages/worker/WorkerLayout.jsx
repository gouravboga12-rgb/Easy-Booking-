import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useStore } from '../../store/useStore';
import { HiHome, HiClipboardList, HiClock, HiCurrencyRupee, HiUser, HiLightningBolt, HiBell, HiX, HiDocumentText, HiShieldCheck, HiRefresh, HiMail } from 'react-icons/hi';
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
  const notifications = useStore(s => s.notifications);
  const fetchNotifications = useStore(s => s.fetchNotifications);
  const markNotificationRead = useStore(s => s.markNotificationRead);
  const markAllNotificationsRead = useStore(s => s.markAllNotificationsRead);
  const clearAllNotifications = useStore(s => s.clearAllNotifications);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef();
  const notifRefMobile = useRef();
  const prevNotifIdsRef = useRef(new Set());
  const isFirstLoadRef = useRef(true);

  // Browser Autoplay Policy Unlock
  useEffect(() => {
    const unlock = () => {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          const ctx = new AudioContext();
          if (ctx.state === 'suspended') {
            ctx.resume();
          }
        }
      } catch (e) {}
      document.removeEventListener('click', unlock);
      document.removeEventListener('touchstart', unlock);
    };
    document.addEventListener('click', unlock);
    document.addEventListener('touchstart', unlock);
    return () => {
      document.removeEventListener('click', unlock);
      document.removeEventListener('touchstart', unlock);
    };
  }, []);

  const playNotificationSound = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      // Force resume context in case autoplay policy was not fully unlocked yet
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880.00, ctx.currentTime + 0.12); // A5
      
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (err) {
      console.error('Audio play error:', err);
    }
  };

  useEffect(() => {
    const handler = (e) => {
      if (!notifRef.current?.contains(e.target) && !notifRefMobile.current?.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (user) {
      fetchNotifications('worker');
      const interval = setInterval(() => {
        fetchNotifications('worker');
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [user, fetchNotifications]);

  useEffect(() => {
    if (!user || !notifications) return;
    const currentIds = new Set(notifications.map(n => String(n.id)));
    if (isFirstLoadRef.current) {
      prevNotifIdsRef.current = currentIds;
      isFirstLoadRef.current = false;
      return;
    }
    const hasNewUnread = notifications.some(n => {
      const matchesRole = n.audience === 'all' || n.audience === 'workers';
      return matchesRole && !n.read && !prevNotifIdsRef.current.has(String(n.id));
    });
    prevNotifIdsRef.current = currentIds;
    if (hasNewUnread) {
      playNotificationSound();
    }
  }, [notifications, user]);

  // Filter notifications for workers
  const myNotifs = notifications.filter(n => n.audience === 'all' || n.audience === 'workers');
  const unreadCount = myNotifs.filter(n => !n.read).length;

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
          {/* LIVE badge */}
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '42px',
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
          {/* Notification Bell - Sidebar */}
          <div ref={notifRef} style={{ position: 'absolute', top: '8px', right: '6px' }}>
            <button
              onClick={() => setNotifOpen(o => !o)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '50%', color: '#555' }}
              title="Notifications"
            >
              <HiBell style={{ fontSize: '18px' }} />
              {unreadCount > 0 && (
                <span style={{ position: 'absolute', top: '0px', right: '0px', background: '#ef4444', color: '#fff', borderRadius: '50%', width: '14px', height: '14px', fontSize: '8px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {notifOpen && (
              <div style={{ position: 'absolute', left: '0', top: 'calc(100% + 6px)', width: '300px', background: '#fff', borderRadius: '14px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', border: '1px solid #eee', zIndex: 9999, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid #f3f4f6' }}>
                  <strong style={{ fontSize: '13px', color: '#1a1a1a' }}>🔔 Notifications</strong>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {unreadCount > 0 && (
                      <button onClick={markAllNotificationsRead} style={{ background: 'none', border: 'none', fontSize: '10px', color: '#6366f1', cursor: 'pointer', fontWeight: '700' }}>Mark all read</button>
                    )}
                    {myNotifs.length > 0 && (
                      <button onClick={clearAllNotifications} style={{ background: 'none', border: 'none', fontSize: '10px', color: '#ef4444', cursor: 'pointer', fontWeight: '700' }}>Clear all</button>
                    )}
                    <button onClick={() => setNotifOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center' }}><HiX /></button>
                  </div>
                </div>
                <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                  {myNotifs.length === 0 ? (
                    <div style={{ padding: '28px 14px', textAlign: 'center', color: '#aaa', fontSize: '12px' }}>
                      <div style={{ fontSize: '28px', marginBottom: '6px' }}>🔕</div>
                      No notifications yet
                    </div>
                  ) : myNotifs.map(n => (
                    <div
                      key={n.id}
                      onClick={() => markNotificationRead(n.id)}
                      style={{ padding: '10px 14px', borderBottom: '1px solid #f9fafb', display: 'flex', gap: '8px', alignItems: 'flex-start', cursor: 'pointer', background: n.read ? '#fff' : '#f5f3ff' }}
                    >
                      <span style={{ fontSize: '18px', marginTop: '1px' }}>{n.channel === 'email' ? '📧' : n.channel === 'sms' ? '📱' : '🔔'}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '12px', fontWeight: n.read ? '500' : '700', color: '#1a1a1a', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</div>
                        <div style={{ fontSize: '11px', color: '#666', lineHeight: '1.4' }}>{n.body}</div>
                        <div style={{ fontSize: '10px', color: '#aaa', marginTop: '3px' }}>{n.sent_at ? new Date(n.sent_at).toLocaleString() : (n.sent || '')}</div>
                      </div>
                      {!n.read && <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#6366f1', flexShrink: 0, marginTop: '5px' }}></span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
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

          <div style={{ marginTop: '20px', paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: '10px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '0 12px', display: 'block', marginBottom: '6px' }}>Help & Policies</span>
            <Link to="/terms-conditions" target="_blank" className="ws-nav-item" style={{ fontSize: '12px', color: '#64748b', textDecoration: 'none' }}>
              <HiDocumentText className="ws-nav-icon" />
              <span>Terms & Conditions</span>
            </Link>
            <Link to="/privacy-policy" target="_blank" className="ws-nav-item" style={{ fontSize: '12px', color: '#64748b', textDecoration: 'none' }}>
              <HiShieldCheck className="ws-nav-icon" />
              <span>Privacy Policy</span>
            </Link>
            <Link to="/refund-policy" target="_blank" className="ws-nav-item" style={{ fontSize: '12px', color: '#64748b', textDecoration: 'none' }}>
              <HiRefresh className="ws-nav-icon" />
              <span>Refund Policy</span>
            </Link>
            <Link to="/contact-us" target="_blank" className="ws-nav-item" style={{ fontSize: '12px', color: '#64748b', textDecoration: 'none' }}>
              <HiMail className="ws-nav-icon" />
              <span>Contact Support</span>
            </Link>
          </div>
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
             {/* Notification Bell - Mobile Header */}
             <div ref={notifRefMobile} style={{ position: 'relative' }}>
               <button
                 onClick={() => setNotifOpen(o => !o)}
                 style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '34px', height: '34px', borderRadius: '50%', color: '#555', marginLeft: '4px' }}
                 title="Notifications"
               >
                 <HiBell style={{ fontSize: '20px' }} />
                 {unreadCount > 0 && (
                   <span style={{ position: 'absolute', top: '1px', right: '1px', background: '#ef4444', color: '#fff', borderRadius: '50%', width: '14px', height: '14px', fontSize: '8px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     {unreadCount > 9 ? '9+' : unreadCount}
                   </span>
                 )}
               </button>
               {notifOpen && (
                 <div style={{
                   position: 'fixed',
                   left: '12px',
                   right: '12px',
                   top: '64px',
                   background: '#fff',
                   borderRadius: '14px',
                   boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                   border: '1px solid #eee',
                   zIndex: 9999,
                   overflow: 'hidden'
                 }}>
                   <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid #f3f4f6' }}>
                     <strong style={{ fontSize: '13px', color: '#1a1a1a' }}>🔔 Notifications</strong>
                     <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                       {unreadCount > 0 && (
                         <button onClick={markAllNotificationsRead} style={{ background: 'none', border: 'none', fontSize: '10px', color: '#6366f1', cursor: 'pointer', fontWeight: '700' }}>Mark all read</button>
                       )}
                       {myNotifs.length > 0 && (
                         <button onClick={clearAllNotifications} style={{ background: 'none', border: 'none', fontSize: '10px', color: '#ef4444', cursor: 'pointer', fontWeight: '700' }}>Clear all</button>
                       )}
                       <button onClick={() => setNotifOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center' }}><HiX /></button>
                     </div>
                   </div>
                   <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                     {myNotifs.length === 0 ? (
                       <div style={{ padding: '28px 14px', textAlign: 'center', color: '#aaa', fontSize: '12px' }}>
                         <div style={{ fontSize: '28px', marginBottom: '6px' }}>🔕</div>
                         No notifications yet
                       </div>
                     ) : myNotifs.map(n => (
                       <div
                         key={n.id}
                         onClick={() => markNotificationRead(n.id)}
                         style={{ padding: '10px 14px', borderBottom: '1px solid #f9fafb', display: 'flex', gap: '8px', alignItems: 'flex-start', cursor: 'pointer', background: n.read ? '#fff' : '#f5f3ff' }}
                       >
                         <span style={{ fontSize: '18px', marginTop: '1px' }}>{n.channel === 'email' ? '📧' : n.channel === 'sms' ? '📱' : '🔔'}</span>
                         <div style={{ flex: 1, minWidth: 0 }}>
                           <div style={{ fontSize: '12px', fontWeight: n.read ? '500' : '700', color: '#1a1a1a', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</div>
                           <div style={{ fontSize: '11px', color: '#666', lineHeight: '1.4' }}>{n.body}</div>
                           <div style={{ fontSize: '10px', color: '#aaa', marginTop: '3px' }}>{n.sent_at ? new Date(n.sent_at).toLocaleString() : (n.sent || '')}</div>
                         </div>
                         {!n.read && <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#6366f1', flexShrink: 0, marginTop: '5px' }}></span>}
                       </div>
                     ))}
                   </div>
                 </div>
               )}
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
            gap: '10px',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
              <img src="/logo.png" alt="Company Logo" style={{ height: '36px', width: 'auto', objectFit: 'contain' }} />
              <span style={{ fontSize: '16px', fontWeight: '800', letterSpacing: '0.5px' }}>Parrow <b style={{ color: 'var(--primary)' }}>Skills</b></span>
            </div>
            <p style={{ margin: '2px 0', color: '#cbd5e1', maxWidth: '400px', fontSize: '12px', lineHeight: '1.4' }}>
              Reliable on-demand professional labor and booking management platform.
            </p>

            <p style={{ margin: '4px 0', color: '#e2e8f0', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
              <span>📧 Support:</span>
              <a href="mailto:tameemansarkhan@gmail.com" style={{ color: '#fbbf24', textDecoration: 'none', fontWeight: 'bold' }}>tameemansarkhan@gmail.com</a>
            </p>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', margin: '6px 0', fontSize: '12px' }}>
              <Link to="/terms-conditions" target="_blank" style={{ color: '#93c5fd', textDecoration: 'none' }}>Terms & Conditions</Link>
              <span style={{ color: '#475569' }}>•</span>
              <Link to="/privacy-policy" target="_blank" style={{ color: '#93c5fd', textDecoration: 'none' }}>Privacy Policy</Link>
              <span style={{ color: '#475569' }}>•</span>
              <Link to="/refund-policy" target="_blank" style={{ color: '#93c5fd', textDecoration: 'none' }}>Refund Policy</Link>
              <span style={{ color: '#475569' }}>•</span>
              <Link to="/contact-us" target="_blank" style={{ color: '#93c5fd', textDecoration: 'none' }}>Contact Us</Link>
            </div>

            <div style={{ fontSize: '11px', color: '#94a3b8', borderTop: '1px solid #334155', paddingTop: '8px', width: '100%', maxWidth: '320px', margin: '4px auto 0' }}>
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
