import React from 'react';

export default function RefundPolicy() {
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif', color: '#333', lineHeight: '1.7' }}>
      <h1 style={{ color: '#1e293b', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>Refund & Cancellation Policy</h1>
      <p style={{ color: '#64748b' }}>Last updated: July 23, 2026</p>

      <section style={{ marginTop: '24px' }}>
        <h2 style={{ color: '#0f172a' }}>1. Worker Subscription Plans</h2>
        <div style={{ background: '#fef2f2', borderLeft: '4px solid #ef4444', padding: '16px', borderRadius: '4px', margin: '16px 0' }}>
          <p style={{ margin: 0, fontWeight: 'bold', color: '#991b1b' }}>
            ⚠️ Subscription Policy Notice:
          </p>
          <p style={{ margin: '8px 0 0 0', color: '#7f1d1d' }}>
            Subscription plans are non-refundable once activated. Once a worker completes a subscription payment and account access is granted, no partial or full refunds will be issued for the remaining subscription period.
          </p>
        </div>
      </section>

      <section style={{ marginTop: '24px' }}>
        <h2 style={{ color: '#0f172a' }}>2. Customer Booking Cancellations</h2>
        <ul>
          <li><strong>Before Worker Dispatch:</strong> Customer order cancellations requested before a worker accepts or dispatches will incur no cancellation fee.</li>
          <li><strong>After Worker Dispatch:</strong> Orders cancelled after a worker has dispatched to the job site may incur a nominal cancellation charge to cover operator travel costs.</li>
        </ul>
      </section>

      <section style={{ marginTop: '24px' }}>
        <h2 style={{ color: '#0f172a' }}>3. Exception Refunds & Billing Support</h2>
        <p>
          In rare circumstances involving duplicate billing, technical payment gateway errors, or unfulfilled services caused by platform malfunction, refunds may be considered on a case-by-case basis.
        </p>
        <p>
          Approved exception refunds will be credited back to the original payment source within <strong>5-7 business days</strong>.
        </p>
      </section>

      <section style={{ marginTop: '24px' }}>
        <h2 style={{ color: '#0f172a' }}>4. Contact Support</h2>
        <p>If you experience billing issues or require clarification regarding a transaction, contact our support team:</p>
        <p style={{ background: '#f1f5f9', padding: '12px 16px', borderRadius: '8px', display: 'inline-block' }}>
          📧 <strong>Support Email:</strong> <a href="mailto:tameemansarkhan@gmail.com" style={{ color: '#2563eb', fontWeight: 'bold' }}>tameemansarkhan@gmail.com</a>
        </p>
      </section>
    </div>
  );
}
