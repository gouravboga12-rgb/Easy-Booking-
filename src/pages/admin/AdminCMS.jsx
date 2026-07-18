import { useState } from 'react';
import { HiSpeakerphone, HiMail, HiPhone, HiBell, HiPlus, HiCheckCircle, HiX, HiStar } from 'react-icons/hi';
import './Admin.css';

const INIT_ANNOUNCEMENTS = [
  { id: 'a1', title: 'App Update v2.1 Released', message: 'New features: Instant booking, worker ratings & reviews, subscription plans.', date: '2026-06-28', audience: 'all', pinned: true },
  { id: 'a2', title: 'Worker Subscription Offer', message: 'Get 50% off on your first month premium subscription. Use code FIRST50.', date: '2026-06-25', audience: 'workers', pinned: false },
];

const INIT_FAQS = [
  { id: 'f1', q: 'How do I book a service?', a: 'Browse services, click on a category, select a service type, fill in your address and date, and confirm booking.' },
  { id: 'f2', q: 'How long does worker matching take?', a: 'Instant bookings are matched within 15 minutes. Scheduled bookings are confirmed 30 minutes prior to the slot.' },
  { id: 'f3', q: 'Can I cancel a booking?', a: 'Yes, cancellations are allowed up to 30 minutes before the booking date. Go to My Orders and click Cancel.' },
];

const BANNERS = [
  { id: 'b1', title: 'Electricians & Plumbers', subtitle: 'Verified professionals at your doorstep in 60 mins', image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&q=80', cta: 'Book Electrician', page: 'Home Slide 1', active: true },
  { id: 'b2', title: 'Deep Cleaning Staff', subtitle: 'Expert housekeepers & deep cleaning for your home', image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80', cta: 'Book Cleaner', page: 'Home Slide 2', active: true },
  { id: 'b3', title: 'Construction & Site Labour', subtitle: 'Experienced masons, welders & fabricators on demand', image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80', cta: 'Book Labour', page: 'Home Slide 3', active: true },
  { id: 'b4', title: 'Cooking Chefs & Home Cooks', subtitle: 'Hire private chefs & daily home cooks instantly', image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&q=80', cta: 'Book Cook', page: 'Home Slide 4', active: true },
];

export default function AdminCMS() {
  const [tab, setTab] = useState('banners');
  const [banners, setBanners] = useState(BANNERS);
  const [announcements, setAnnouncements] = useState(INIT_ANNOUNCEMENTS);
  const [faqs, setFaqs] = useState(INIT_FAQS);
  const [editingFaq, setEditingFaq] = useState(null);
  const [editingBanner, setEditingBanner] = useState(null);
  const [showAddAnn, setShowAddAnn] = useState(false);
  const [showAddFaq, setShowAddFaq] = useState(false);
  const [showAddBanner, setShowAddBanner] = useState(false);
  const [newAnn, setNewAnn] = useState({ title: '', message: '', audience: 'all' });
  const [newFaq, setNewFaq] = useState({ q: '', a: '' });
  const [newBanner, setNewBanner] = useState({ title: '', subtitle: '', image: '', cta: '', page: 'Home Slide 1', active: true });
  const [successMsg, setSuccessMsg] = useState('');

  const showSuccess = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3000); };

  const handleAddBanner = (e) => {
    e.preventDefault();
    setBanners(prev => [...prev, {
      id: `b${Date.now()}`,
      ...newBanner
    }]);
    setNewBanner({ title: '', subtitle: '', image: '', cta: '', page: 'Home Slide 1', active: true });
    setShowAddBanner(false);
    showSuccess('Banner added successfully!');
  };

  const handleSaveBanner = (e) => {
    e.preventDefault();
    setBanners(prev => prev.map(b => b.id === editingBanner.id ? editingBanner : b));
    setEditingBanner(null);
    showSuccess('Banner updated successfully!');
  };

  const handleDeleteBanner = (id) => {
    if (window.confirm('Are you sure you want to delete this banner?')) {
      setBanners(prev => prev.filter(b => b.id !== id));
      showSuccess('Banner deleted successfully!');
    }
  };

  const handleAddAnnouncement = (e) => {
    e.preventDefault();
    setAnnouncements(prev => [{
      id: `a${Date.now()}`,
      ...newAnn,
      date: new Date().toLocaleDateString(),
      pinned: false
    }, ...prev]);
    setNewAnn({ title: '', message: '', audience: 'all' });
    setShowAddAnn(false);
    showSuccess('Announcement published!');
  };

  const handleAddFaq = (e) => {
    e.preventDefault();
    setFaqs(prev => [...prev, { id: `f${Date.now()}`, ...newFaq }]);
    setNewFaq({ q: '', a: '' });
    setShowAddFaq(false);
    showSuccess('FAQ added!');
  };

  const handleSaveFaq = (e) => {
    e.preventDefault();
    setFaqs(prev => prev.map(f => f.id === editingFaq.id ? editingFaq : f));
    setEditingFaq(null);
    showSuccess('FAQ updated!');
  };

  const TABS = [
    { key: 'banners', label: '🖼️ Banners' },
    { key: 'announcements', label: '📢 Announcements' },
    { key: 'faqs', label: '❓ FAQs' },
    { key: 'blogs', label: '📝 Blogs' },
    { key: 'help', label: '🆘 Help Centre' },
  ];

  return (
    <div className="admin-page" style={{ paddingBottom: '32px' }}>
      <div className="admin-header">
        <div>
          <h1>CMS Management</h1>
          <p>Manage home banners, announcements, FAQs, blogs, and help centre content</p>
        </div>
      </div>

      {successMsg && (
        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600' }}>
          <HiCheckCircle /> {successMsg}
        </div>
      )}

      <div className="filter-tabs" style={{ marginBottom: '24px' }}>
        {TABS.map(t => (
          <button key={t.key} className={tab === t.key ? 'active' : ''} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* HOME BANNERS */}
      {tab === 'banners' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button onClick={() => setShowAddBanner(!showAddBanner)} style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <HiPlus /> Add Banner
            </button>
          </div>

          {showAddBanner && (
            <div style={{ background: '#fff', padding: '20px', borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', marginBottom: '20px', border: '1px solid #ede9fe' }}>
              <h3 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: '700', color: '#6d28d9' }}>Create Home Banner</h3>
              <form onSubmit={handleAddBanner} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#555' }}>Banner Title</label>
                    <input value={newBanner.title} onChange={e => setNewBanner(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Electricians & Plumbers" required style={{ padding: '9px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#555' }}>Banner Subtitle</label>
                    <input value={newBanner.subtitle} onChange={e => setNewBanner(p => ({ ...p, subtitle: e.target.value }))} placeholder="e.g. Verified professionals at your doorstep" style={{ padding: '9px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px' }} />
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#555' }}>Image URL</label>
                    <input value={newBanner.image} onChange={e => setNewBanner(p => ({ ...p, image: e.target.value }))} placeholder="https://images.unsplash.com/..." required style={{ padding: '9px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#555' }}>CTA Button Text</label>
                    <input value={newBanner.cta} onChange={e => setNewBanner(p => ({ ...p, cta: e.target.value }))} placeholder="e.g. Book Electrician" required style={{ padding: '9px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#555' }}>Page Placement / Index</label>
                    <select value={newBanner.page} onChange={e => setNewBanner(p => ({ ...p, page: e.target.value }))} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px', minWidth: '150px' }}>
                      <option value="Home Slide 1">Home Slide 1</option>
                      <option value="Home Slide 2">Home Slide 2</option>
                      <option value="Home Slide 3">Home Slide 3</option>
                      <option value="Home Slide 4">Home Slide 4</option>
                      <option value="Home Slide 5">Home Slide 5</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '16px' }}>
                    <input type="checkbox" id="addActive" checked={newBanner.active} onChange={e => setNewBanner(p => ({ ...p, active: e.target.checked }))} />
                    <label htmlFor="addActive" style={{ fontSize: '12px', fontWeight: '700', color: '#555', cursor: 'pointer' }}>Active on Home</label>
                  </div>
                  <button type="submit" style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '9px 20px', borderRadius: '6px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', marginLeft: 'auto' }}>Create Banner</button>
                </div>
              </form>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {banners.map(b => (
              <div key={b.id} style={{ background: '#fff', border: '1px solid #eee', borderRadius: '14px', overflow: 'hidden', display: 'flex', gap: 0 }}>
                <div style={{ width: '140px', flexShrink: 0, background: '#f3f4f6', overflow: 'hidden' }}>
                  <img src={b.image} alt={b.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ flex: 1, padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '10px', color: '#888', fontWeight: '700', textTransform: 'uppercase', marginBottom: '3px' }}>{b.page}</div>
                    <h3 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: '700' }}>{b.title}</h3>
                    {b.subtitle && <p style={{ margin: '0 0 6px', fontSize: '12px', color: '#666' }}>{b.subtitle}</p>}
                    <span style={{ fontSize: '12px', background: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: '10px', fontWeight: '600' }}>{b.cta}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', background: b.active ? '#dcfce7' : '#f3f4f6', color: b.active ? '#15803d' : '#9ca3af', padding: '2px 8px', borderRadius: '10px', fontWeight: '700' }}>
                      {b.active ? 'Active' : 'Inactive'}
                    </span>
                    <button onClick={() => setBanners(prev => prev.map(bn => bn.id === b.id ? { ...bn, active: !bn.active } : bn))} style={{ background: b.active ? '#fee2e2' : '#dcfce7', color: b.active ? '#dc2626' : '#15803d', border: '1px solid', borderColor: b.active ? '#fca5a5' : '#bbf7d0', padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                      {b.active ? 'Disable' : 'Enable'}
                    </button>
                    <button onClick={() => setEditingBanner({ ...b })} style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                      Edit
                    </button>
                    <button onClick={() => handleDeleteBanner(b.id)} style={{ background: 'none', border: '1px solid #fca5a5', color: '#ef4444', padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ANNOUNCEMENTS */}
      {tab === 'announcements' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button onClick={() => setShowAddAnn(!showAddAnn)} style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <HiPlus /> New Announcement
            </button>
          </div>

          {showAddAnn && (
            <div style={{ background: '#fff', padding: '20px', borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: '700' }}>Create Announcement</h3>
              <form onSubmit={handleAddAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input value={newAnn.title} onChange={e => setNewAnn(p => ({ ...p, title: e.target.value }))} placeholder="Announcement title..." required style={{ padding: '9px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }} />
                <textarea value={newAnn.message} onChange={e => setNewAnn(p => ({ ...p, message: e.target.value }))} placeholder="Message content..." required rows={3} style={{ padding: '9px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px', resize: 'vertical' }} />
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700' }}>
                    Target Audience:
                    <select value={newAnn.audience} onChange={e => setNewAnn(p => ({ ...p, audience: e.target.value }))} style={{ marginLeft: '8px', padding: '6px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '12px' }}>
                      <option value="all">All Users</option>
                      <option value="customers">Customers Only</option>
                      <option value="workers">Workers Only</option>
                    </select>
                  </label>
                  <button type="submit" style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: '700', fontSize: '12px', cursor: 'pointer', marginLeft: 'auto' }}>Publish</button>
                </div>
              </form>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {announcements.map(ann => (
              <div key={ann.id} style={{ background: '#fff', border: '1px solid #eee', borderRadius: '12px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <HiSpeakerphone style={{ color: 'var(--primary)', width: '18px', height: '18px' }} />
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700' }}>{ann.title}</h3>
                    {ann.pinned && <span style={{ fontSize: '10px', background: '#fef3c7', color: '#d97706', padding: '1px 6px', borderRadius: '4px', fontWeight: '700' }}>📌 PINNED</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', background: '#f3f4f6', color: '#666', padding: '2px 8px', borderRadius: '10px' }}>{ann.audience}</span>
                    <span style={{ fontSize: '11px', color: '#aaa' }}>{ann.date}</span>
                    <button onClick={() => setAnnouncements(prev => prev.filter(a => a.id !== ann.id))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                      <HiX />
                    </button>
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: '#555', lineHeight: '1.5' }}>{ann.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FAQs */}
      {tab === 'faqs' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button onClick={() => setShowAddFaq(!showAddFaq)} style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <HiPlus /> Add FAQ
            </button>
          </div>

          {showAddFaq && (
            <div style={{ background: '#fff', padding: '20px', borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', marginBottom: '20px' }}>
              <form onSubmit={handleAddFaq} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input value={newFaq.q} onChange={e => setNewFaq(p => ({ ...p, q: e.target.value }))} placeholder="Question..." required style={{ padding: '9px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }} />
                <textarea value={newFaq.a} onChange={e => setNewFaq(p => ({ ...p, a: e.target.value }))} placeholder="Answer..." required rows={3} style={{ padding: '9px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px', resize: 'vertical' }} />
                <button type="submit" style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: '700', fontSize: '12px', cursor: 'pointer', alignSelf: 'flex-end' }}>Add FAQ</button>
              </form>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {faqs.map((faq, i) => (
              <div key={faq.id} style={{ background: '#fff', border: '1px solid #eee', borderRadius: '12px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, paddingRight: '12px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#1a1a1a', marginBottom: '6px' }}>Q{i + 1}. {faq.q}</div>
                    <div style={{ fontSize: '13px', color: '#555', lineHeight: '1.5' }}>{faq.a}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button onClick={() => setEditingFaq({ ...faq })} style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>Edit</button>
                    <button onClick={() => setFaqs(prev => prev.filter(f => f.id !== faq.id))} style={{ background: 'none', border: '1px solid #fca5a5', color: '#ef4444', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'blogs' && (
        <div style={{ background: '#fff', padding: '40px', borderRadius: '14px', textAlign: 'center', color: '#888' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📝</div>
          <h3 style={{ fontWeight: '700', color: '#444', marginBottom: '8px' }}>Blog Management</h3>
          <p style={{ fontSize: '13px' }}>Create and manage platform blog posts to improve SEO and user engagement. This section will be wired to a CMS database in production.</p>
        </div>
      )}

      {tab === 'help' && (
        <div style={{ background: '#fff', padding: '40px', borderRadius: '14px', textAlign: 'center', color: '#888' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🆘</div>
          <h3 style={{ fontWeight: '700', color: '#444', marginBottom: '8px' }}>Help Centre Articles</h3>
          <p style={{ fontSize: '13px' }}>Manage articles and guides that appear on the customer/worker help centre pages. These would link to a support ticketing system in production.</p>
        </div>
      )}

      {/* Edit FAQ Modal */}
      {editingFaq && (
        <div className="modal-overlay" onClick={() => setEditingFaq(null)}>
          <div className="confirm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px', width: '100%' }}>
            <h3>Edit FAQ</h3>
            <form onSubmit={handleSaveFaq} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px', textAlign: 'left' }}>
              <input value={editingFaq.q} onChange={e => setEditingFaq(p => ({ ...p, q: e.target.value }))} style={{ padding: '9px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }} required />
              <textarea value={editingFaq.a} onChange={e => setEditingFaq(p => ({ ...p, a: e.target.value }))} rows={4} style={{ padding: '9px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px', resize: 'vertical' }} required />
              <div className="cm-actions">
                <button type="button" className="cm-cancel" onClick={() => setEditingFaq(null)}>Cancel</button>
                <button type="submit" className="cm-confirm">Save FAQ</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Banner Modal */}
      {editingBanner && (
        <div className="modal-overlay" onClick={() => setEditingBanner(null)}>
          <div className="confirm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', width: '100%' }}>
            <h3 style={{ color: '#6d28d9', fontWeight: '800' }}>Edit Home Banner</h3>
            <form onSubmit={handleSaveBanner} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px', textAlign: 'left' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#555' }}>Banner Title</label>
                <input value={editingBanner.title} onChange={e => setEditingBanner(p => ({ ...p, title: e.target.value }))} style={{ padding: '9px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }} required />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#555' }}>Banner Subtitle</label>
                <input value={editingBanner.subtitle || ''} onChange={e => setEditingBanner(p => ({ ...p, subtitle: e.target.value }))} style={{ padding: '9px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#555' }}>Image URL</label>
                <input value={editingBanner.image} onChange={e => setEditingBanner(p => ({ ...p, image: e.target.value }))} style={{ padding: '9px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }} required />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#555' }}>CTA Button Text</label>
                <input value={editingBanner.cta} onChange={e => setEditingBanner(p => ({ ...p, cta: e.target.value }))} style={{ padding: '9px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }} required />
              </div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#555' }}>Page Placement / Index</label>
                  <select value={editingBanner.page} onChange={e => setEditingBanner(p => ({ ...p, page: e.target.value }))} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px', minWidth: '150px' }}>
                    <option value="Home Slide 1">Home Slide 1</option>
                    <option value="Home Slide 2">Home Slide 2</option>
                    <option value="Home Slide 3">Home Slide 3</option>
                    <option value="Home Slide 4">Home Slide 4</option>
                    <option value="Home Slide 5">Home Slide 5</option>
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '16px' }}>
                  <input type="checkbox" id="editActive" checked={editingBanner.active} onChange={e => setEditingBanner(p => ({ ...p, active: e.target.checked }))} />
                  <label htmlFor="editActive" style={{ fontSize: '12px', fontWeight: '700', color: '#555', cursor: 'pointer' }}>Active on Home</label>
                </div>
              </div>
              <div className="cm-actions" style={{ marginTop: '16px' }}>
                <button type="button" className="cm-cancel" onClick={() => setEditingBanner(null)}>Cancel</button>
                <button type="submit" className="cm-confirm">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
