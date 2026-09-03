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
        <h2 style={{ color: '#0f172a' }}>1. Introduction & Ownership</h2>
        <p>
          Welcome to <strong>Parrow Skills</strong> ("we," "our," or "us"). We respect your privacy and are committed to protecting the personal data of our customers, workers, and machinery operators. This Privacy Policy explains how information is collected, used, shared, and protected when you use our website (<a href="https://parrowskills.com" style={{ color: '#2563eb' }}>parrowskills.com</a>) and the <strong>ParrowSkills</strong> Android mobile application (Package ID: <code>com.parrowskills.app</code>).
        </p>
        <p style={{ background: '#f8fafc', borderLeft: '4px solid #3b82f6', padding: '10px 14px', borderRadius: '4px', fontSize: '13.5px' }}>
          <strong>Entity & Publishing Information:</strong> The ParrowSkills platform and brand are owned and operated by <strong>PARROW SKILLS</strong> (Government of India MSME / Udyam Reg. No: <strong>UDYAM-AP-01-0034849</strong>), having its registered office at 1-1386-B, BC Colony, Pamidi, Ananthapur, Andhra Pradesh - 515775. The official application is published, developed, and maintained on Google Play by authorized developer <strong>Premium Business (CODTECH IT SOLUTIONS)</strong>.
        </p>
      </section>

      <section style={{ marginTop: '24px' }}>
        <h2 style={{ color: '#0f172a' }}>2. Information We Collect</h2>
        <ul>
          <li><strong>Personal Identification Data:</strong> Full name, mobile phone number, email address, and profile details provided during account registration.</li>
          <li><strong>Location Data (GPS):</strong> We collect precise and approximate real-time geographic location data from workers/operators and customers to enable nearby service matching, job dispatch, and live booking tracking. Location data is collected when the app is active and during active orders.</li>
          <li><strong>Payment Information:</strong> Transaction identifiers and payment confirmation statuses processed securely via RBI-authorized, PCI-DSS compliant third-party payment gateways (e.g., Razorpay). We do not collect or store raw debit/credit card numbers or CVVs on our servers.</li>
          <li><strong>Device & Log Data:</strong> Device model, operating system version, unique device identifiers, IP address, and app usage timestamps to ensure system stability and fraud prevention.</li>
        </ul>
      </section>

      <section style={{ marginTop: '24px' }}>
        <h2 style={{ color: '#0f172a' }}>3. How We Use Your Information</h2>
        <p>We use the collected information for the following legitimate purposes:</p>
        <ul>
          <li>To match customer construction machinery and labor requests with nearby qualified operators.</li>
          <li>To facilitate transparent live order tracking and communication between customers and workers.</li>
          <li>To process worker membership subscriptions and customer booking transactions.</li>
          <li>To send critical transactional SMS, WhatsApp updates, and real-time push notifications.</li>
          <li>To prevent fraudulent activity, verify accounts, and maintain platform security.</li>
        </ul>
      </section>

      <section style={{ marginTop: '24px' }}>
        <h2 style={{ color: '#0f172a' }}>4. Third-Party Service Providers</h2>
        <p>We may share minimal required data with trusted third-party service providers solely to perform essential application functions:</p>
        <ul>
          <li><strong>Razorpay:</strong> Payment processing and secure transaction settlement.</li>
          <li><strong>Mapbox / OpenStreetMap:</strong> Location mapping, address lookup, and navigation routing.</li>
          <li><strong>Expo / Firebase:</strong> Delivering real-time push notifications and order status alerts.</li>
        </ul>
        <p>We do not sell, rent, or trade your personal information to third parties for advertising or marketing purposes.</p>
      </section>

      <section style={{ marginTop: '24px' }}>
        <h2 style={{ color: '#0f172a' }}>5. Data Security & Storage</h2>
        <p>
          We employ industry-standard security protocols, including HTTPS/TLS encryption and restricted database access controls, to safeguard personal data against unauthorized access, alteration, or disclosure.
        </p>
      </section>

      <section style={{ marginTop: '24px' }}>
        <h2 style={{ color: '#0f172a' }}>6. User Rights & Account/Data Deletion</h2>
        <p>
          You have the right to access, review, update, or request the complete deletion of your account and personal data at any time.
        </p>
        <p>
          <strong>How to request Data Deletion:</strong> You can submit a deletion request by emailing our support team at <a href="mailto:tameemansarkhan@gmail.com" style={{ color: '#2563eb', fontWeight: 'bold' }}>tameemansarkhan@gmail.com</a> with the subject line <em>"Account Deletion Request"</em> from your registered email address. Upon verification, your account and associated personal data will be permanently removed from our active databases within 7 working days.
        </p>
      </section>

      <section style={{ marginTop: '24px' }}>
        <h2 style={{ color: '#0f172a' }}>7. Children's Privacy</h2>
        <p>
          Our platform and services are strictly intended for adults (aged 18 and older). We do not knowingly collect personal information from children under 18 years of age.
        </p>
      </section>

      <section style={{ marginTop: '24px' }}>
        <h2 style={{ color: '#0f172a' }}>8. Contact Us</h2>
        <p>For any questions, concerns, or data privacy requests, please contact us at:</p>
        <div style={{ background: '#f1f5f9', padding: '14px 18px', borderRadius: '8px', marginTop: '10px' }}>
          <p style={{ margin: '3px 0' }}><strong>Enterprise:</strong> PARROW SKILLS (MSME: UDYAM-AP-01-0034849)</p>
          <p style={{ margin: '3px 0' }}><strong>Address:</strong> 1-1386-B, BC Colony, Pamidi, Ananthapur, Andhra Pradesh - 515775, India</p>
          <p style={{ margin: '3px 0' }}><strong>Email:</strong> <a href="mailto:tameemansarkhan@gmail.com" style={{ color: '#2563eb' }}>tameemansarkhan@gmail.com</a></p>
          <p style={{ margin: '3px 0' }}><strong>Phone:</strong> +91 8008081298</p>
        </div>
      </section>
    </div>
  );
}
