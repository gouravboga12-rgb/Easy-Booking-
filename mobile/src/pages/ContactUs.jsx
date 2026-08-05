import React from 'react';

export default function ContactUs() {
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif', color: '#333', lineHeight: '1.7' }}>
      <h1 style={{ color: '#1e293b', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>Contact Us</h1>
      <p style={{ color: '#64748b' }}>We are here to assist you with any questions or support requests.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginTop: '32px' }}>
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ margin: '0 0 12px 0', color: '#0f172a' }}>📧 Customer & Operator Support</h3>
          <p style={{ margin: 0, color: '#475569' }}>For assistance with bookings, worker subscriptions, or account inquiries:</p>
          <p style={{ marginTop: '16px', fontSize: '1.1rem' }}>
            <a href="mailto:tameemansarkhan@gmail.com" style={{ color: '#2563eb', fontWeight: 'bold', textDecoration: 'none' }}>
              tameemansarkhan@gmail.com
            </a>
          </p>
        </div>

        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ margin: '0 0 12px 0', color: '#0f172a' }}>⏰ Support Hours</h3>
          <p style={{ margin: 0, color: '#475569' }}>Monday – Saturday: 9:00 AM – 8:00 PM IST</p>
          <p style={{ margin: '8px 0 0 0', color: '#475569' }}>Sunday: 10:00 AM – 4:00 PM IST</p>
        </div>
      </div>
    </div>
  );
}
