import { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useStore } from '../../store/useStore';
import { HiBell, HiMail, HiPhone, HiSpeakerphone, HiCheckCircle, HiUsers } from 'react-icons/hi';
import './Admin.css';

const NOTIFICATION_HISTORY = [
  { id: 'n1', title: 'Welcome to Parrow Skills!', body: 'Start browsing verified professionals near you.', channel: 'push', audience: 'customers', sent: '2026-06-28 10:00', status: 'delivered' },
  { id: 'n2', title: 'Worker Subscription Reminder', body: 'Renew your subscription to keep receiving dispatch requests.', channel: 'sms', audience: 'workers', sent: '2026-06-27 15:30', status: 'delivered' },
  { id: 'n3', title: 'New Promo Code: SAVE100', body: 'Get ₹100 off on your next booking. Valid this week only!', channel: 'email', audience: 'all', sent: '2026-06-25 09:00', status: 'delivered' },
];

export default function AdminNotifications() {
  const users = useAuthStore(s => s.users);
  const workers = users.filter(u => u.role === 'worker');
  const customers = users.filter(u => u.role === 'customer');
  const broadcastNotification = useStore(s => s.broadcastNotification);

  const [tab, setTab] = useState('compose');
  const [history, setHistory] = useState(NOTIFICATION_HISTORY);

  const [form, setForm] = useState({
    title: '',
    body: '',
    channel: 'push',
    audience: 'all',
  });
  const [sent, setSent] = useState(false);

  const handleSend = (e) => {
    e.preventDefault();
    const recipientCount = form.audience === 'all'
      ? workers.length + customers.length
      : form.audience === 'workers' ? workers.length : customers.length;

    const newNotif = {
      id: `n${Date.now()}`,
      title: form.title,
      body: form.body,
      channel: form.channel,
      audience: form.audience,
      sent: new Date().toLocaleString(),
      status: 'delivered',
      recipients: recipientCount,
      read: false,
    };
    setHistory(prev => [newNotif, ...prev]);
    // Broadcast to global store so customer/worker notification bell picks it up
    broadcastNotification(newNotif);
    setSent(true);
    setForm({ title: '', body: '', channel: 'push', audience: 'all' });
    setTimeout(() => setSent(false), 4000);
  };

  const channelIcon = (ch) => ({ push: '🔔', sms: '📱', email: '📧' }[ch] || '📢');

  const audienceCount = () => {
    if (form.audience === 'all') return workers.length + customers.length;
    if (form.audience === 'workers') return workers.length;
    return customers.length;
  };

  return (
    <div className="admin-page" style={{ paddingBottom: '32px' }}>
      <div className="admin-header">
        <div>
          <h1>Notification System</h1>
          <p>Send push notifications, SMS alerts, email broadcasts, and promotional messages</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Recipients', val: workers.length + customers.length, icon: <HiUsers />, color: '#3b82f6' },
          { label: 'Notifications Sent', val: history.length, icon: <HiBell />, color: '#8b5cf6' },
          { label: 'Delivery Rate', val: '98.2%', icon: <HiCheckCircle />, color: '#10b981' },
        ].map(({ label, val, icon, color }) => (
          <div key={label} style={{ background: '#fff', padding: '18px', borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', border: '1px solid #eee', display: 'flex', gap: '14px', alignItems: 'center' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${color}15`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              {icon}
            </div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: '800', color }}>{val}</div>
              <div style={{ fontSize: '12px', color: '#888' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="filter-tabs" style={{ marginBottom: '24px' }}>
        <button className={tab === 'compose' ? 'active' : ''} onClick={() => setTab('compose')}>✍️ Compose & Send</button>
        <button className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>📜 Notification History</button>
      </div>

      {tab === 'compose' && (
        <div style={{ background: '#fff', padding: '28px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', maxWidth: '640px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px' }}>Compose Notification</h2>

          {sent && (
            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600' }}>
              <HiCheckCircle /> Notification sent successfully to {audienceCount()} recipients!
            </div>
          )}

          <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: '700' }}>
                Notification Channel
                <select value={form.channel} onChange={e => setForm(p => ({ ...p, channel: e.target.value }))} style={{ padding: '10px', border: '1.5px solid #eee', borderRadius: '8px', fontSize: '13px' }}>
                  <option value="push">🔔 Push Notification</option>
                  <option value="sms">📱 SMS Message</option>
                  <option value="email">📧 Email Broadcast</option>
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: '700' }}>
                Target Audience
                <select value={form.audience} onChange={e => setForm(p => ({ ...p, audience: e.target.value }))} style={{ padding: '10px', border: '1.5px solid #eee', borderRadius: '8px', fontSize: '13px' }}>
                  <option value="all">👥 All Users ({workers.length + customers.length})</option>
                  <option value="workers">👷 Workers Only ({workers.length})</option>
                  <option value="customers">🧑 Customers Only ({customers.length})</option>
                </select>
              </label>
            </div>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: '700' }}>
              Notification Title
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. New Offer Available!" required style={{ padding: '10px', border: '1.5px solid #eee', borderRadius: '8px', fontSize: '14px' }} />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: '700' }}>
              Message Body
              <textarea value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))} placeholder="Type your notification message..." required rows={4} style={{ padding: '10px', border: '1.5px solid #eee', borderRadius: '8px', fontSize: '13px', resize: 'vertical' }} />
            </label>

            {/* Preview Card */}
            {(form.title || form.body) && (
              <div style={{ border: '1.5px solid #e0e7ff', borderRadius: '10px', padding: '14px', background: '#f8faff' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#6366f1', marginBottom: '8px' }}>PREVIEW</div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: '#fff', flexShrink: 0 }}>
                    {channelIcon(form.channel)}
                  </div>
                  <div>
                    <strong style={{ display: 'block', fontSize: '13px', color: '#1a1a1a' }}>{form.title || 'Title'}</strong>
                    <span style={{ fontSize: '12px', color: '#666' }}>{form.body || 'Message body...'}</span>
                  </div>
                </div>
              </div>
            )}

            <button type="submit" style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: '700', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <HiSpeakerphone /> Send to {audienceCount()} Recipients
            </button>
          </form>
        </div>
      )}

      {tab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {history.map(n => (
            <div key={n.id} style={{ background: '#fff', border: '1px solid #eee', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '24px' }}>{channelIcon(n.channel)}</span>
                <div>
                  <strong style={{ display: 'block', fontSize: '14px', color: '#1a1a1a' }}>{n.title}</strong>
                  <span style={{ display: 'block', fontSize: '12px', color: '#555', margin: '3px 0' }}>{n.body}</span>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', background: '#f3f4f6', color: '#555', padding: '2px 8px', borderRadius: '10px' }}>{n.channel.toUpperCase()}</span>
                    <span style={{ fontSize: '11px', background: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: '10px' }}>{n.audience}</span>
                    <span style={{ fontSize: '11px', color: '#aaa' }}>{n.sent}</span>
                    {n.recipients && <span style={{ fontSize: '11px', color: '#888' }}>{n.recipients} recipients</span>}
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '11px', background: '#dcfce7', color: '#15803d', padding: '2px 10px', borderRadius: '10px', fontWeight: '700' }}>
                ✔ {n.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
