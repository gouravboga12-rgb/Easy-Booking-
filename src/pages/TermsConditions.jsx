import React from 'react';

export default function TermsConditions() {
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif', color: '#333', lineHeight: '1.7' }}>
      <h1 style={{ color: '#1e293b', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>Terms & Conditions</h1>
      <p style={{ color: '#64748b' }}>Last updated: July 23, 2026</p>

      <section style={{ marginTop: '24px' }}>
        <h2 style={{ color: '#0f172a' }}>1. Agreement to Terms</h2>
        <p>
          By accessing or using the <strong>Parrow Skills</strong> website or worker application, you agree to be bound by these Terms & Conditions. If you do not agree to these terms, please do not use our platform.
        </p>
      </section>

      <section style={{ marginTop: '24px' }}>
        <h2 style={{ color: '#0f172a' }}>2. Platform Services & User Roles</h2>
        <p>
          Parrow Skills acts as an on-demand technology marketplace connecting customers requiring construction vehicle services with independent operators and workers.
        </p>
        <ul>
          <li><strong>Customers:</strong> Must provide accurate booking information and pay agreed service charges.</li>
          <li><strong>Workers / Operators:</strong> Must hold valid licensing/certifications, maintain their vehicles, and deliver services safely and professionally.</li>
        </ul>
      </section>

      <section style={{ marginTop: '24px' }}>
        <h2 style={{ color: '#0f172a' }}>3. Worker Subscriptions & Payments</h2>
        <ul>
          <li>Workers may subscribe to membership tiers to access customer job requests.</li>
          <li>Subscription fees are billed in advance according to the chosen plan duration.</li>
          <li>All subscription plan payments are processed securely via approved payment gateways (e.g., Razorpay).</li>
        </ul>
      </section>

      <section style={{ marginTop: '24px' }}>
        <h2 style={{ color: '#0f172a' }}>4. Acceptable Conduct</h2>
        <p>Users and workers agree NOT to:</p>
        <ul>
          <li>Provide false identity or inaccurate vehicle availability.</li>
          <li>Engage in abusive, fraudulent, or illegal behavior on the platform.</li>
          <li>Bypass the platform to solicit off-platform transactions after matching.</li>
        </ul>
      </section>

      <section style={{ marginTop: '24px' }}>
        <h2 style={{ color: '#0f172a' }}>5. Limitation of Liability</h2>
        <p>
          Parrow Skills provides matching services and is not liable for direct, indirect, or accidental damages arising from independent worker conduct or equipment operational failures.
        </p>
      </section>

      <section style={{ marginTop: '24px' }}>
        <h2 style={{ color: '#0f172a' }}>6. Contact & Support</h2>
        <p>For questions regarding these Terms & Conditions, please contact us:</p>
        <p style={{ background: '#f1f5f9', padding: '12px 16px', borderRadius: '8px', display: 'inline-block' }}>
          📧 <strong>Support Email:</strong> <a href="mailto:tameemansarkhan@gmail.com" style={{ color: '#2563eb', fontWeight: 'bold' }}>tameemansarkhan@gmail.com</a>
        </p>
      </section>
    </div>
  );
}
