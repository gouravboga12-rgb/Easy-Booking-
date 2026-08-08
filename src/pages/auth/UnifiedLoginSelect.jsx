import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiUser, HiBriefcase, HiUserAdd, HiIdentification, HiArrowRight } from 'react-icons/hi';
import { useAuthStore } from '../../store/useAuthStore';
import './Auth.css';

export default function UnifiedLoginSelect() {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);

  useEffect(() => {
    if (user) {
      if (user.role === 'worker') {
        navigate('/worker', { replace: true });
      } else if (user.role === 'customer') {
        navigate('/', { replace: true });
      } else if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      }
    }
  }, [user, navigate]);

  return (
    <div className="auth-page mobile-unified-auth" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div className="auth-card unified-auth-card" style={{ maxWidth: '480px', width: '100%', margin: '0 auto', padding: '28px 20px', borderRadius: '24px', boxShadow: '0 12px 32px rgba(0,0,0,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <img src="/logo.png" alt="Parrow Skills Logo" style={{ height: '56px', width: 'auto', marginBottom: '10px' }} />
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginBottom: '4px', letterSpacing: '-0.5px' }}>
            Parrow Skills
          </h1>
          <p style={{ fontSize: '13.5px', color: '#64748b', margin: 0, fontWeight: '500' }}>
            Select your account portal to get started
          </p>
        </div>

        <div className="unified-selection-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* TOP HALF: Customer Portal */}
          <div style={{
            background: 'linear-gradient(145deg, #ffffff 0%, #fff7ed 100%)',
            border: '2px solid #ffedd5',
            borderRadius: '20px',
            padding: '20px',
            boxShadow: '0 4px 16px rgba(255, 140, 0, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <button
              type="button"
              onClick={() => navigate('/login-customer')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '14px 16px',
                backgroundColor: '#fff',
                border: '1.5px solid #ff8c00',
                borderRadius: '14px',
                cursor: 'pointer',
                textAlign: 'left',
                boxShadow: '0 2px 8px rgba(255, 140, 0, 0.12)',
                transition: 'transform 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #ff8c00 0%, #ea580c 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '22px'
                }}>
                  <HiUser />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#1e293b' }}>Login as Customer</h3>
                  <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: '#64748b' }}>Book workers & construction vehicles</p>
                </div>
              </div>
              <HiArrowRight style={{ color: '#ff8c00', fontSize: '20px', flexShrink: 0 }} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
              <span style={{ fontSize: '12.5px', color: '#78350f', fontWeight: '600' }}>New to Customer Portal?</span>
              <button
                type="button"
                onClick={() => navigate('/register')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'none',
                  border: 'none',
                  color: '#ea580c',
                  fontSize: '13px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                <HiUserAdd style={{ fontSize: '15px' }} /> Sign Up Here →
              </button>
            </div>
          </div>

          {/* BOTTOM HALF: Worker Portal */}
          <div style={{
            background: 'linear-gradient(145deg, #ffffff 0%, #ecfdf5 100%)',
            border: '2px solid #a7f3d0',
            borderRadius: '20px',
            padding: '20px',
            boxShadow: '0 4px 16px rgba(16, 185, 129, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <button
              type="button"
              onClick={() => navigate('/login-worker')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '14px 16px',
                backgroundColor: '#fff',
                border: '1.5px solid #10b981',
                borderRadius: '14px',
                cursor: 'pointer',
                textAlign: 'left',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.12)',
                transition: 'transform 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '22px'
                }}>
                  <HiBriefcase />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#1e293b' }}>Login as Worker</h3>
                  <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: '#64748b' }}>Accept jobs & track earnings</p>
                </div>
              </div>
              <HiArrowRight style={{ color: '#10b981', fontSize: '20px', flexShrink: 0 }} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
              <span style={{ fontSize: '12.5px', color: '#064e3b', fontWeight: '600' }}>Want to earn as a Worker?</span>
              <button
                type="button"
                onClick={() => navigate('/register-worker')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'none',
                  border: 'none',
                  color: '#059669',
                  fontSize: '13px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                <HiIdentification style={{ fontSize: '15px' }} /> Register Here →
              </button>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Link to="/browse" style={{ color: '#64748b', fontSize: '13px', textDecoration: 'none', fontWeight: 600 }}>
            ← Skip & Browse Services as Guest
          </Link>
        </div>
      </div>
    </div>
  );
}
