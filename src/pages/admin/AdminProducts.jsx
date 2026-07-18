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
    rate: '500',
    unit: 'day',
    image: '',
  });

  // Custom Fields States
  const [customFields, setCustomFields] = useState([]);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState('text');
  const [newFieldChoices, setNewFieldChoices] = useState('');

  // Pricing Mode States
  const [pricingType, setPricingType] = useState('direct'); // 'direct' or 'dynamic'
  const [dynamicType, setDynamicType] = useState('person'); // 'person', 'tier', 'custom'
  const [tiers, setTiers] = useState([]);
  const [newTierValue, setNewTierValue] = useState('');
  const [newTierPrice, setNewTierPrice] = useState('');

  const handleAddTier = () => {
    const priceVal = Number(newTierPrice);
    if (!newTierValue.trim() || !priceVal) return;
    
    let newTier = {};
    if (dynamicType === 'custom') {
      newTier = { label: newTierValue.trim(), price: priceVal };
    } else {
      newTier = { value: Number(newTierValue), price: priceVal };
    }

    // Sort numeric values, keep custom order
    let updated = [...tiers, newTier];
    if (dynamicType !== 'custom') {
      updated.sort((a, b) => a.value - b.value);
    }
    setTiers(updated);
    setNewTierValue('');
    setNewTierPrice('');
  };

  const handleDeleteTier = (idx) => {
    setTiers(tiers.filter((_, i) => i !== idx));
  };

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
      rate: '500',
      unit: 'day',
      image: '',
      available: true,
    });
    setCustomFields([]);
    setNewFieldName('');
    setNewFieldChoices('');
    setNewFieldType('text');
    setPricingType('direct');
    setDynamicType('person');
    setTiers([]);
    setNewTierValue('');
    setNewTierPrice('');
    setShowModal(true);
  };

  const handleOpenEdit = (v) => {
    setEditingId(v.id);
    setForm({
      name: v.name,
      desc: v.desc,
      category: v.category || 'professionals',
      rate: String(v.rate),
      unit: v.unit,
      image: v.image || '',
      available: v.available !== false,
    });
    setCustomFields(v.custom_fields || []);
    setNewFieldName('');
    setNewFieldChoices('');
    setNewFieldType('text');

    const prType = v.pricing_type || 'direct';
    setPricingType(prType);
    if (prType === 'dynamic' && v.pricing_rules) {
      setDynamicType(v.pricing_rules.type || 'person');
      setTiers(v.pricing_rules.tiers || []);
    } else {
      setDynamicType('person');
      setTiers([]);
    }
    setNewTierValue('');
    setNewTierPrice('');
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

  const handleAddField = () => {
    if (!newFieldName.trim()) return;
    const choices = newFieldType === 'select'
      ? newFieldChoices.split(',').map(c => c.trim()).filter(Boolean)
      : [];
    
    const newField = {
      id: `field_${Date.now()}`,
      name: newFieldName.trim(),
      type: newFieldType,
      choices,
      required: true
    };
    setCustomFields([...customFields, newField]);
    setNewFieldName('');
    setNewFieldChoices('');
  };

  const handleDeleteField = (fieldId) => {
    setCustomFields(customFields.filter(f => f.id !== fieldId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const catObj = categories.find(c => c.id === form.category);
    const categoryLabel = catObj ? catObj.label : 'Other';

    // Auto-add any custom field that was typed in but not explicitly added via the "+ Add Field Option" button
    let finalCustomFields = [...customFields];
    if (newFieldName.trim()) {
      const choices = newFieldType === 'select'
        ? newFieldChoices.split(',').map(c => c.trim()).filter(Boolean)
        : [];
      
      const newField = {
        id: `field_${Date.now()}`,
        name: newFieldName.trim(),
        type: newFieldType,
        choices,
        required: true
      };
      finalCustomFields.push(newField);
    }

    const pricingRules = pricingType === 'dynamic' ? {
      type: dynamicType,
      tiers: tiers
    } : null;

    const serviceData = {
      name: form.name,
      desc: form.desc,
      category: form.category,
      categoryLabel,
      rate: Number(form.rate),
      unit: form.unit,
      image: form.image || 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80',
      custom_fields: finalCustomFields,
      pricing_type: pricingType,
      pricing_rules: pricingRules,
      available: form.available !== false
    };

    if (editingId) {
      const success = await updateService(editingId, serviceData);
      if (success) {
        showSuccess('Service updated successfully!');
        setShowModal(false);
      } else {
        alert('Failed to update service. Please check server connection.');
      }
    } else {
      const newId = `service-${Date.now()}`;
      const success = await addService({ id: newId, ...serviceData });
      if (success) {
        showSuccess('New service added successfully!');
        setShowModal(false);
      } else {
        alert('Failed to add service. Please check server connection.');
      }
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this service? This cannot be undone.')) {
      const success = await deleteService(editingId);
      if (success) {
        setShowModal(false);
        showSuccess('Service deleted successfully!');
      } else {
        alert('Failed to delete service. Please check server connection.');
      }
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
                  <span className="pc-rate" style={{ fontSize: '15px', fontWeight: '800', color: 'var(--primary)' }}>
                    {v.pricing_type === 'dynamic' ? (
                      v.pricing_rules?.type === 'person' ? (
                        <>Tiered<span className="pc-unit" style={{ fontSize: '11px', fontWeight: '400', color: '#888' }}> (Workers)</span></>
                      ) : v.pricing_rules?.type === 'tier' ? (
                        <>Tiered<span className="pc-unit" style={{ fontSize: '11px', fontWeight: '400', color: '#888' }}> (Hourly)</span></>
                      ) : (
                        <>Tiered<span className="pc-unit" style={{ fontSize: '11px', fontWeight: '400', color: '#888' }}> (Custom)</span></>
                      )
                    ) : (
                      <>₹{v.rate.toLocaleString()}<span className="pc-unit" style={{ fontSize: '11px', fontWeight: '400', color: '#888' }}>/{v.unit}</span></>
                    )}
                  </span>
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
          <div className="confirm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '540px', width: '100%', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700' }}>Pricing Model</span>
                  <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '4px', borderRadius: '8px' }}>
                    <button type="button" onClick={() => setPricingType('direct')} style={{ flex: 1, padding: '7px', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', background: pricingType === 'direct' ? '#fff' : 'transparent', color: pricingType === 'direct' ? 'var(--primary)' : '#64748b', boxShadow: pricingType === 'direct' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
                      Flat Rate
                    </button>
                    <button type="button" onClick={() => setPricingType('dynamic')} style={{ flex: 1, padding: '7px', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s', background: pricingType === 'dynamic' ? '#fff' : 'transparent', color: pricingType === 'dynamic' ? 'var(--primary)' : '#64748b', boxShadow: pricingType === 'dynamic' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
                      Dynamic
                    </button>
                  </div>
                </div>
              </div>

              {pricingType === 'direct' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: '700' }}>
                    Rate (₹)
                    <input type="text" value={form.rate} onChange={e => setForm(p => ({ ...p, rate: e.target.value.replace(/\D/g, '') }))} style={{ padding: '10px', border: '1.5px solid #eee', borderRadius: '8px', fontSize: '13px' }} required />
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
              )}

              {pricingType === 'dynamic' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: '700' }}>
                    Dynamic Calculation Type
                    <select value={dynamicType} onChange={e => { setDynamicType(e.target.value); setTiers([]); }} style={{ padding: '10px', border: '1.5px solid #eee', borderRadius: '8px', fontSize: '13px' }}>
                      <option value="person">Per Worker / Person Tiers (e.g. 1 Worker = ₹300, 2 Workers = ₹600)</option>
                      <option value="tier">Hourly Tiers (e.g. 3 Hours = ₹500, 6 Hours = ₹1000)</option>
                      <option value="custom">Custom Tiers (e.g. Half Day = ₹400, Full Day = ₹800)</option>
                    </select>
                  </label>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#334155' }}>
                      {dynamicType === 'person' ? 'Worker Count Tiers' : dynamicType === 'tier' ? 'Hourly Price Tiers' : 'Custom Pricing Tiers'}
                    </span>
                    
                    {tiers.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {tiers.map((t, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px' }}>
                            <span>
                              {dynamicType === 'custom' ? (
                                <strong>{t.label}</strong>
                              ) : (
                                <strong>{t.value} {dynamicType === 'person' ? (t.value === 1 ? 'Worker' : 'Workers') : 'Hour(s)'}</strong>
                              )}: ₹{t.price}
                            </span>
                            <button type="button" onClick={() => handleDeleteTier(idx)} style={{ border: 'none', background: 'none', color: '#ef4444', fontWeight: '700', cursor: 'pointer' }}>Remove</button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input
                        type="text"
                        placeholder={dynamicType === 'person' ? "e.g. 1 (Workers)" : dynamicType === 'tier' ? "e.g. 3 (Hours)" : "e.g. Half Day (Option Name)"}
                        value={newTierValue}
                        onChange={e => setNewTierValue(dynamicType === 'custom' ? e.target.value : e.target.value.replace(/\D/g, ''))}
                        style={{ flex: 1.5, padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '12px' }}
                      />
                      <input
                        type="text"
                        placeholder="Price (₹)"
                        value={newTierPrice}
                        onChange={e => setNewTierPrice(e.target.value.replace(/\D/g, ''))}
                        style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '12px' }}
                      />
                      <button type="button" onClick={handleAddTier} style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid var(--primary)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                        + Add Tier
                      </button>
                    </div>
                  </div>
                </div>
              )}

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

              {/* Service Availability Option */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', marginTop: '6px' }}>
                <input 
                  type="checkbox" 
                  id="serviceAvailable" 
                  checked={form.available !== false} 
                  onChange={e => setForm(p => ({ ...p, available: e.target.checked }))} 
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="serviceAvailable" style={{ fontSize: '13px', fontWeight: '700', color: form.available !== false ? '#059669' : '#4b5563', cursor: 'pointer' }}>
                  {form.available !== false ? '🟢 Service Available for Booking' : '🔴 Service Currently Unavailable'}
                </label>
              </div>

              {/* Dynamic Option Fields Builder */}
              <div style={{ borderTop: '1.5px solid #eee', paddingTop: '14px', marginTop: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#1a1a1a', display: 'block', marginBottom: '8px' }}>Dynamic Booking Options (Add custom fields for this service)</span>
                
                {/* Existing fields list */}
                {customFields.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                    {customFields.map(f => (
                      <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12.5px' }}>
                        <div>
                          <strong style={{ color: '#0f172a' }}>{f.name}</strong> <span style={{ color: '#64748b', fontSize: '11px' }}>({f.type})</span>
                          {f.choices.length > 0 && <span style={{ display: 'block', fontSize: '11px', color: '#888', marginTop: '2px' }}>Dropdown Options: {f.choices.join(', ')}</span>}
                        </div>
                        <button type="button" onClick={() => handleDeleteField(f.id)} style={{ border: 'none', background: 'none', color: '#ef4444', fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}>Remove</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new field builder row */}
                <div style={{ background: '#f9fafb', padding: '12px', borderRadius: '10px', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <input
                      placeholder="Field Label (e.g. Number of Masons)"
                      value={newFieldName}
                      onChange={e => setNewFieldName(e.target.value)}
                      style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '12px', minWidth: '180px' }}
                    />
                    <select
                      value={newFieldType}
                      onChange={e => setNewFieldType(e.target.value)}
                      style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '12px', width: '130px' }}
                    >
                      <option value="text">Text Box</option>
                      <option value="number">Numbers Only</option>
                      <option value="file">Image / File Upload</option>
                      <option value="select">Dropdown Select</option>
                    </select>
                  </div>
                  {newFieldType === 'select' && (
                    <input
                      placeholder="Dropdown choices separated by commas (e.g. 1, 2, 3, 4, 5+)"
                      value={newFieldChoices}
                      onChange={e => setNewFieldChoices(e.target.value)}
                      style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '11.5px' }}
                    />
                  )}
                  <button
                    type="button"
                    onClick={handleAddField}
                    style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid var(--primary)', padding: '6px 12px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer', alignSelf: 'flex-end' }}
                  >
                    + Add Field Option
                  </button>
                </div>
              </div>

              <div className="cm-actions" style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
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
