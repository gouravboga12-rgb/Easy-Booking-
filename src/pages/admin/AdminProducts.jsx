import { useState } from 'react';
import { categories } from '../../data/vehicles';
import { useStore } from '../../store/useStore';
import { HiCube, HiChevronLeft, HiPencil, HiPlus, HiTrash, HiCheckCircle } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import './Admin.css';

export default function AdminProducts() {
  const navigate = useNavigate();
  const services = useStore(s => s.services);
  const addService = useStore(s => s.addService);
  const updateService = useStore(s => s.updateService);
  const deleteService = useStore(s => s.deleteService);

  const [activeCat, setActiveCat] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null); // null for add, ID for edit
  const [successMsg, setSuccessMsg] = useState('');

  const [form, setForm] = useState({
    name: '',
    desc: '',
    category: 'professionals',
    rate: 500,
    unit: 'day',
    image: '',
  });

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm({
      name: '',
      desc: '',
      category: categories[0]?.id || 'professionals',
      rate: 500,
      unit: 'day',
      image: '',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (v) => {
    setEditingId(v.id);
    setForm({
      name: v.name,
      desc: v.desc,
      category: v.category || 'professionals',
      rate: v.rate,
      unit: v.unit,
      image: v.image || '',
    });
    setShowModal(true);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const catObj = categories.find(c => c.id === form.category);
    const categoryLabel = catObj ? catObj.label : 'Other';

    const serviceData = {
      name: form.name,
      desc: form.desc,
      category: form.category,
      categoryLabel,
      rate: Number(form.rate),
      unit: form.unit,
      image: form.image || 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80',
    };

    if (editingId) {
      await updateService(editingId, serviceData);
      showSuccess('Service updated successfully!');
    } else {
      const newId = `service-${Date.now()}`;
      await addService({ id: newId, ...serviceData });
      showSuccess('New service added successfully!');
    }
    setShowModal(false);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this service? This cannot be undone.')) {
      await deleteService(editingId);
      setShowModal(false);
      showSuccess('Service deleted successfully!');
    }
  };

  const filtered = activeCat === 'all' ? services : services.filter(v => v.category === activeCat);

  return (
    <div className="admin-page" style={{ paddingBottom: '40px' }}>
      <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="ah-with-back">
          <button className="back-icon-btn" onClick={() => navigate('/admin/more')}><HiChevronLeft /></button>
          <div>
            <h1>Services & Catalog</h1>
            <p>{services.length} services configured</p>
          </div>
        </div>
        <button className="btn-primary" onClick={handleOpenAdd} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <HiPlus style={{ width: 16, height: 16 }} /> Add Service
        </button>
      </div>

      {successMsg && (
        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600' }}>
          <HiCheckCircle style={{ width: 18, height: 18 }} /> {successMsg}
        </div>
      )}

      <div className="filter-tabs">
        <button className={activeCat === 'all' ? 'active' : ''} onClick={() => setActiveCat('all')}>
          All <span className="tab-count">{services.length}</span>
        </button>
        {categories.map(c => {
          const count = services.filter(v => v.category === c.id).length;
          return (
            <button key={c.id} className={activeCat === c.id ? 'active' : ''} onClick={() => setActiveCat(c.id)}>
              {c.label} <span className="tab-count">{count}</span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: '16px', padding: '48px', textAlign: 'center', color: '#888' }}>
          <HiCube style={{ width: 48, height: 48, color: '#ccc', marginBottom: '12px' }} />
          <h3>No services found in this category.</h3>
          <p style={{ fontSize: '13px', marginTop: '4px' }}>Click "Add Service" to add a new service to this category.</p>
        </div>
      ) : (
        <div className="products-grid">
          {filtered.map(v => (
            <div key={v.id} className="product-card" style={{ background: '#fff', border: '1px solid #eee', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div className="pc-img-wrap" style={{ position: 'relative', height: '160px', overflow: 'hidden' }}>
                <img src={v.image} alt={v.name} className="pc-img" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.src = 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=70'; }} />
                <span className="pc-cat" style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(255,255,255,0.9)', color: '#333', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '700' }}>{v.categoryLabel}</span>
              </div>
              <div className="pc-body" style={{ padding: '16px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '800', margin: '0 0 6px', color: '#1a1a1a' }}>{v.name}</h3>
                <p style={{ fontSize: '12px', color: '#666', margin: '0 0 16px', lineHeight: '1.4', height: '3.6em', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>{v.desc}</p>
                <div className="pc-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="pc-rate" style={{ fontSize: '16px', fontWeight: '800', color: 'var(--primary)' }}>₹{v.rate.toLocaleString()}<span className="pc-unit" style={{ fontSize: '11px', fontWeight: '400', color: '#888' }}>/{v.unit}</span></span>
                  <button className="act-btn assign" onClick={() => handleOpenEdit(v)} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                    <HiPencil style={{ width: 12, height: 12 }} /> Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="confirm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', width: '100%', padding: '28px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px' }}>{editingId ? 'Edit Service' : 'Add New Service'}</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: '700' }}>
                Service Name
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Premium Electrician" style={{ padding: '10px', border: '1.5px solid #eee', borderRadius: '8px', fontSize: '13px' }} required />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: '700' }}>
                Description
                <textarea value={form.desc} onChange={e => setForm(p => ({ ...p, desc: e.target.value }))} placeholder="Service description..." rows={3} style={{ padding: '10px', border: '1.5px solid #eee', borderRadius: '8px', fontSize: '13px', resize: 'vertical' }} required />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: '700' }}>
                  Category
                  <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} style={{ padding: '10px', border: '1.5px solid #eee', borderRadius: '8px', fontSize: '13px' }}>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: '700' }}>
                    Rate (₹)
                    <input type="number" value={form.rate} onChange={e => setForm(p => ({ ...p, rate: e.target.value }))} min="1" style={{ padding: '10px', border: '1.5px solid #eee', borderRadius: '8px', fontSize: '13px' }} required />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: '700' }}>
                    Unit
                    <select value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))} style={{ padding: '10px', border: '1.5px solid #eee', borderRadius: '8px', fontSize: '13px' }}>
                      <option value="day">per Day</option>
                      <option value="hr">per Hour</option>
                      <option value="visit">per Visit</option>
                      <option value="event">per Event</option>
                    </select>
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700' }}>Service Image</span>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <label style={{ flex: 1, padding: '10px', border: '1.5px dashed #ccc', borderRadius: '8px', cursor: 'pointer', textAlign: 'center', fontSize: '13px', background: '#fafafa' }}>
                    📁 Choose Photo Upload
                    <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                  </label>
                  {form.image && (
                    <img src={form.image} alt="Preview" style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #ddd' }} />
                  )}
                </div>
              </div>

              <div className="cm-actions" style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                {editingId && (
                  <button type="button" onClick={handleDelete} style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', marginRight: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <HiTrash /> Delete
                  </button>
                )}
                <button type="button" className="cm-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="cm-confirm">{editingId ? 'Save Changes' : 'Create Service'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
