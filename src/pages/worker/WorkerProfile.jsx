import { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { HiUser, HiPhone, HiMail, HiStar, HiBriefcase, HiLogout } from 'react-icons/hi';
import { MdDirectionsCar } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

export default function WorkerProfile() {
  const user = useAuthStore(s => s.user);
  const updateWorkerAvailability = useAuthStore(s => s.updateWorkerAvailability);
  const logout = useAuthStore(s => s.logout);
  const navigate = useNavigate();
  const [showLogout, setShowLogout] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };

  const INFO = [
    { Icon: HiUser,          label: 'Full Name',  val: user.name },
    { Icon: HiPhone,         label: 'Phone',      val: user.phone },
    { Icon: HiMail,          label: 'Email',      val: user.email },
    { Icon: MdDirectionsCar, label: 'Vehicle',    val: user.vehicle },
    { Icon: HiStar,          label: 'Rating',     val: `${user.rating} ★` },
    { Icon: HiBriefcase,     label: 'Jobs Done',  val: user.jobsDone },
  ];

  return (
    <div className="worker-page">
      <div className="wp-title">
        <HiUser className="wp-title-icon" />
        <h1>Profile</h1>
      </div>

      {/* Avatar */}
      <div className="profile-hero">
        <div className="profile-avatar">{user.name.charAt(0)}</div>
        <h2>{user.name}</h2>
        <span className="profile-role">Worker</span>
        <div className="avail-toggle" style={{ justifyContent: 'center', marginTop: 12 }}>
          <span>Status:</span>
          <button
            className={`toggle-btn ${user.available ? 'on' : 'off'}`}
            onClick={() => updateWorkerAvailability(user.id, !user.available)}
          >
            {user.available ? '● Online' : '○ Offline'}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="worker-section">
        <h2>Personal Info</h2>
        <div className="profile-info-list">
          {INFO.map(({ Icon, label, val }) => (
            <div key={label} className="pi-row">
              <div className="pi-label"><Icon className="pi-icon" />{label}</div>
              <div className="pi-val">{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Logout */}
      <button className="logout-btn" onClick={() => setShowLogout(true)}>
        <HiLogout style={{ width: 18, height: 18 }} /> Logout
      </button>

      {showLogout && (
        <div className="modal-overlay" onClick={() => setShowLogout(false)}>
          <div className="confirm-modal" onClick={e => e.stopPropagation()}>
            <h3>Logout?</h3>
            <p>Are you sure you want to logout?</p>
            <div className="cm-actions">
              <button className="cm-cancel" onClick={() => setShowLogout(false)}>Cancel</button>
              <button className="cm-confirm" onClick={handleLogout}>Logout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
