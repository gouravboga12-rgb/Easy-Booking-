import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif', color: '#333', lineHeight: '1.7' }}>
      <h1 style={{ color: '#1e293b', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>Privacy Policy</h1>
      <p style={{ color: '#64748b' }}>Last updated: July 23, 2026</p>

      <section style={{ marginTop: '24px' }}>
        <h2 style={{ color: '#0f172a' }}>1. Introduction</h2>
        <p>
          Welcome to <strong>Parrow Skills</strong> ("we," "our," or "us"). We respect your privacy and are committed to protecting the personal data of our customers, workers, and machine operators. This Privacy Policy explains how your information—including phone numbers, geographic location, and payment details—is collected, stored, and protected.
        </p>
      </section>

      <section style={{ marginTop: '24px' }}>
        <h2 style={{ color: '#0f172a' }}>2. Information We Collect</h2>
        <ul>
          <li><strong>Personal Identification Data:</strong> Name, phone number, email address, and profile details provided during registration.</li>
          <li><strong>Location Data:</strong> Real-time geographic location (GPS) of workers/operators and booking addresses of customers to facilitate on-demand service matching and live order tracking.</li>
          <li><strong>Payment Information:</strong> Transaction IDs and payment status processed securely through PCI-DSS compliant third-party payment gateways (e.g., Razorpay). We do not store raw card numbers or CVVs on our servers.</li>
          <li><strong>Device & Usage Information:</strong> IP address, browser type, and interaction logs with the Parrow Skills platform.</li>
        </ul>
      </section>

      <section style={{ marginTop: '24px' }}>
        <h2 style={{ color: '#0f172a' }}>3. How We Use Your Data</h2>
        <p>We use the collected information for the following purposes:</p>
        <ul>
          <li>To match customer service requests with nearby qualified workers/operators.</li>
          <li>To process worker subscription plans and customer booking payments.</li>
          <li>To send real-time SMS/WhatsApp order updates and system notifications.</li>
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
        <h2 style={{ color: '#0f172a' }}>5. Third-Party Sharing</h2>
        <p>
          We do not sell or rent your personal data to third parties. Information is shared only with verified service partners (e.g., Razorpay for payment processing, Mapbox for navigation mapping) required to operate the platform.
        </p>
      </section>

      <section style={{ marginTop: '24px' }}>
        <h2 style={{ color: '#0f172a' }}>6. Contact Us</h2>
        <p>If you have any questions or concerns about this Privacy Policy, please contact our support team at:</p>
        <p style={{ background: '#f1f5f9', padding: '12px 16px', borderRadius: '8px', display: 'inline-block' }}>
          📧 <strong>Support Email:</strong> <a href="mailto:tameemansarkhan@gmail.com" style={{ color: '#2563eb', fontWeight: 'bold' }}>tameemansarkhan@gmail.com</a>
        </p>
      </section>
    </div>
  );
}
