import { Link, useNavigate } from 'react-router-dom';
import { HiUser, HiBriefcase, HiUserAdd, HiIdentification, HiArrowRight } from 'react-icons/hi';
import './Auth.css';

export default function UnifiedLoginSelect() {
  const navigate = useNavigate();

  return (
    <div className="auth-page mobile-unified-auth">
      <div className="auth-card unified-auth-card" style={{ maxWidth: '480px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <img src="/logo.png" alt="Parrow Skills Logo" style={{ height: '60px', width: 'auto', marginBottom: '12px' }} />
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', marginBottom: '6px' }}>
            Parrow Skills
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
            Welcome! Select your account type to proceed
          </p>
        </div>

        <div className="unified-selection-container" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '28px' }}>
          {/* Customer Login Option */}
          <button
            type="button"
            onClick={() => navigate('/login-customer')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justify: 'space-between',
              padding: '18px 20px',
              backgroundColor: '#fff',
              border: '2px solid #e2e8f0',
              borderRadius: '16px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
              textAlign: 'left'
            }}
            onMouseOver={e => {
              e.currentTarget.style.borderColor = '#ff8c00';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #ff8c00 0%, #ff5500 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '24px'
              }}>
                <HiUser />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>Login as Customer</h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>Book services & track your orders</p>
              </div>
            </div>
            <HiArrowRight style={{ color: '#ff8c00', fontSize: '20px' }} />
          </button>

          {/* Worker Login Option */}
          <button
            type="button"
            onClick={() => navigate('/login-worker')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justify: 'space-between',
              padding: '18px 20px',
              backgroundColor: '#fff',
              border: '2px solid #e2e8f0',
              borderRadius: '16px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
              textAlign: 'left'
            }}
            onMouseOver={e => {
              e.currentTarget.style.borderColor = '#10b981';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '24px'
              }}>
                <HiBriefcase />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>Login as Worker</h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>Accept jobs & manage earnings</p>
              </div>
            </div>
            <HiArrowRight style={{ color: '#10b981', fontSize: '20px' }} />
          </button>
        </div>

        <div style={{
          borderTop: '1px solid #f1f5f9',
          paddingTop: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: '600', textAlign: 'center' }}>
            New to Parrow Skills?
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <button
              type="button"
              onClick={() => navigate('/register')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justify: 'center',
                gap: '8px',
                padding: '12px 14px',
                backgroundColor: '#fff7ed',
                border: '1px solid #ffedd5',
                borderRadius: '12px',
                color: '#c2410c',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              <HiUserAdd style={{ fontSize: '16px' }} />
              Sign Up Customer
            </button>

            <button
              type="button"
              onClick={() => navigate('/register-worker')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justify: 'center',
                gap: '8px',
                padding: '12px 14px',
                backgroundColor: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: '12px',
                color: '#047857',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              <HiIdentification style={{ fontSize: '16px' }} />
              Sign Up Worker
            </button>
          </div>

          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <Link to="/" style={{ color: '#64748b', fontSize: '13px', textDecoration: 'none', fontWeight: 500 }}>
              ← Skip to Home Page
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
