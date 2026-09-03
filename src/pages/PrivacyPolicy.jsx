import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px 20px 40px', fontFamily: 'sans-serif', color: '#333', lineHeight: '1.7' }}>
      <button 
        onClick={() => navigate(-1)} 
        style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '6px', 
          background: '#f1f5f9', 
          border: '1px solid #cbd5e1', 
          borderRadius: '6px', 
          padding: '6px 14px', 
          fontSize: '13px', 
          fontWeight: '600', 
          color: '#334155', 
          cursor: 'pointer',
          marginBottom: '16px' 
        }}
      >
        ← Back
      </button>
      <h1 style={{ color: '#1e293b', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>Privacy Policy</h1>
      <p style={{ color: '#64748b' }}>Last updated: August 29, 2026</p>

      <section style={{ marginTop: '24px' }}>
        <h2 style={{ color: '#0f172a' }}>1. Introduction & Enterprise Overview</h2>
        <p>
          Welcome to <strong>Parrow Skills</strong> ("we," "our," or "us"), owned and operated by <strong>PARROW SKILLS</strong> (Ministry of MSME, Govt. of India Udyam Reg. No: <strong>UDYAM-AP-01-0034849</strong>). We respect your privacy and are committed to protecting the personal data of our customers, workers, and machine operators across our website (<a href="https://parrowskills.com" style={{ color: '#2563eb' }}>parrowskills.com</a>) and the <strong>ParrowSkills</strong> Android mobile application (Package ID: <code>com.parrowskills.app</code>).
        </p>
      </section>

      <section style={{ marginTop: '24px' }}>
        <h2 style={{ color: '#0f172a' }}>2. Information We Collect</h2>
        <ul>
          <li><strong>Personal Identification Data:</strong> Full name, mobile phone number, email address, and profile details provided during registration.</li>
          <li><strong>Location Data (GPS):</strong> Real-time geographic location (GPS) of workers/operators and booking addresses of customers to facilitate on-demand service matching and live order tracking.</li>
          <li><strong>Payment Information:</strong> Transaction IDs and payment status processed securely through PCI-DSS compliant third-party payment gateways (e.g., Razorpay). We do not store raw card numbers or CVVs on our servers.</li>
          <li><strong>Device & Usage Information:</strong> IP address, device identifier, browser type, and interaction logs with the Parrow Skills platform.</li>
        </ul>
      </section>

      <section style={{ marginTop: '24px' }}>
        <h2 style={{ color: '#0f172a' }}>3. How We Use Your Data</h2>
        <p>We use the collected information for the following purposes:</p>
        <ul>
          <li>To match customer service requests with nearby qualified workers/operators.</li>
          <li>To process worker subscription plans and customer booking payments.</li>
          <li>To send real-time SMS, WhatsApp order updates, and push notifications.</li>
          <li>To prevent fraud, enforce platform rules, and comply with legal requirements.</li>
        </ul>
      </section>

      <section style={{ marginTop: '24px' }}>
        <h2 style={{ color: '#0f172a' }}>4. Data Security & Retention</h2>
        <p>
          We implement industry-standard encryption (SSL/TLS) and secure database access controls to safeguard your data. Personal data is retained only as long as necessary to fulfill service commitments or legal obligations.
        </p>
      </section>

      <section style={{ marginTop: '24px' }}>
        <h2 style={{ color: '#0f172a' }}>5. User Rights & Account/Data Deletion</h2>
        <p>
          You have the right to access, update, or request the permanent deletion of your account and personal data at any time.
        </p>
        <p>
          <strong>Account Deletion Request:</strong> To delete your account and associated data, please contact our support team via email at <a href="mailto:tameemansarkhan@gmail.com" style={{ color: '#2563eb', fontWeight: 'bold' }}>tameemansarkhan@gmail.com</a> or message our WhatsApp support at <a href="https://wa.me/918008081298" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontWeight: 'bold' }}>+91 8008081298</a> with the subject/message <em>"Account Deletion Request"</em>. Your account and all associated data will be permanently removed within 7 business days.
        </p>
      </section>

      <section style={{ marginTop: '24px' }}>
        <h2 style={{ color: '#0f172a' }}>6. Third-Party Sharing</h2>
        <p>
          We do not sell or rent your personal data to third parties. Information is shared only with verified service partners (e.g., Razorpay for payment processing, Mapbox for navigation mapping) strictly required to operate the platform.
        </p>
      </section>

      <section style={{ marginTop: '24px' }}>
        <h2 style={{ color: '#0f172a' }}>7. Contact Us & Customer Support</h2>
        <p>If you have any questions or concerns about this Privacy Policy, please contact our official support team:</p>
        
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '16px 20px', borderRadius: '10px', marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ margin: 0 }}><strong>Enterprise:</strong> PARROW SKILLS (MSME Reg. No: UDYAM-AP-01-0034849)</p>
          <p style={{ margin: 0 }}><strong>Registered Office:</strong> 1-1386-B, BC Colony, Pamidi, Ananthapur, Andhra Pradesh - 515775, India</p>
          <p style={{ margin: 0 }}>
            📧 <strong>Email Support:</strong> <a href="mailto:tameemansarkhan@gmail.com" style={{ color: '#2563eb', fontWeight: 'bold' }}>tameemansarkhan@gmail.com</a>
          </p>
          <p style={{ margin: 0 }}>
            📞 <strong>Phone / Call Support:</strong> <a href="tel:+918008081298" style={{ color: '#2563eb', fontWeight: 'bold' }}>+91 8008081298</a>
          </p>
          <p style={{ margin: 0 }}>
            💬 <strong>WhatsApp Support:</strong> <a href="https://wa.me/918008081298" target="_blank" rel="noopener noreferrer" style={{ color: '#16a34a', fontWeight: 'bold' }}>+91 8008081298 (Chat on WhatsApp)</a>
          </p>
        </div>
      </section>
    </div>
  );
}
