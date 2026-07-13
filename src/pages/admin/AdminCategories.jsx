import { useState } from 'react';
import { HiPlus, HiPencil, HiTrash, HiCheckCircle } from 'react-icons/hi';
import './Admin.css';

const INITIAL_CATEGORIES = [
  { id: 'contractors', label: 'Contractors & Civil', icon: '🏗️', labourTypes: ['Site Supervisor', 'General Contractor', 'Civil Estimator'] },
  { id: 'construction-labour', label: 'Construction & Site Labour', icon: '⛏️', labourTypes: ['Mason', 'Brick Layer', 'Shuttering Worker', 'Steel Fixer'] },
  { id: 'interior-carpentry', label: 'Interior & Carpentry', icon: '🪵', labourTypes: ['Carpenter', 'Cabinet Maker', 'Interior Designer', 'Furniture Fixer'] },
  { id: 'professionals', label: 'Maintenance Professionals', icon: '🔧', labourTypes: ['Electrician', 'Plumber', 'AC Technician', 'Painter'] },
  { id: 'installations', label: 'Technical Installations', icon: '⚙️', labourTypes: ['CCTV Installer', 'Home Automation Technician', 'Solar Panel Fitter'] },
  { id: 'housekeeping', label: 'Housekeeping & Cleaning', icon: '🧹', labourTypes: ['House Cleaner', 'Deep Clean Expert', 'Pest Control', 'Laundry Worker'] },
  { id: 'drivers-logistics', label: 'Drivers & Logistics', icon: '🚛', labourTypes: ['Truck Driver', 'Auto Driver', 'Loading Labour', 'Goods Mover'] },
  { id: 'cooking-events', label: 'Cooking & Events', icon: '🍳', labourTypes: ['Cook', 'Caterer', 'Event Helper', 'Waiter', 'Bartender'] },
];

const PRESET_ICONS = [
  '🏗️', '⛏️', '🪵', '🔧', '⚙️', '🧹', '🚛', '🍳', '🏠', '🛋️', '⚡', '💧', '🩹', '🎨', '🚨', '🧰', '📐', '🔩', '🪴', '🧺', '🧼', '🚚', '📦', '🦺'
];

export default function AdminCategories() {
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [editingCat, setEditingCat] = useState(null);
  const [addingLabourType, setAddingLabourType] = useState(null);
  const [newLabourInput, setNewLabourInput] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCat, setNewCat] = useState({ label: '', icon: '📦' });
  const [successMsg, setSuccessMsg] = useState('');

  const showSuccess = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3000); };

  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!newCat.label) return;
    const id = newCat.label.toLowerCase().replace(/\s+/g, '-');
    setCategories(prev => [...prev, { id, label: newCat.label, icon: newCat.icon, labourTypes: [] }]);
    setNewCat({ label: '', icon: '📦' });
    setShowAddForm(false);
    showSuccess('Category added successfully!');
  };

  const handleDeleteCategory = (id) => {
    if (!window.confirm('Delete this category permanently? This may affect existing service listings.')) return;
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    setCategories(prev => prev.map(c => c.id === editingCat.id ? editingCat : c));
    setEditingCat(null);
    showSuccess('Category updated!');
  };

  const handleAddLabourType = (catId) => {
    if (!newLabourInput.trim()) return;
    setCategories(prev => prev.map(c =>
      c.id === catId ? { ...c, labourTypes: [...c.labourTypes, newLabourInput.trim()] } : c
    ));
    setNewLabourInput('');
    setAddingLabourType(null);
    showSuccess('Labour type added!');
  };

  const handleDeleteLabourType = (catId, type) => {
    setCategories(prev => prev.map(c =>
      c.id === catId ? { ...c, labourTypes: c.labourTypes.filter(t => t !== type) } : c
    ));
  };

  return (
    <div className="admin-page" style={{ paddingBottom: '32px' }}>
      <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Category Management</h1>
          <p>Add, edit, and remove service categories and labour types available on the platform</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <HiPlus /> Add Category
        </button>
      </div>

      {successMsg && (
        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600' }}>
          <HiCheckCircle /> {successMsg}
        </div>
      )}

      {/* Add Category Form */}
      {showAddForm && (
        <div style={{ background: '#fff', padding: '24px', borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', marginBottom: '24px', border: '1px solid #eee' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>New Service Category</h2>
          <form onSubmit={handleAddCategory} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', display: 'flex', flexDirection: 'column', gap: '6px', width: '80px' }}>
                Icon
                <input value={newCat.icon} onChange={e => setNewCat(p => ({ ...p, icon: e.target.value }))} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '20px', textAlign: 'center' }} maxLength={2} />
              </label>
              <label style={{ fontSize: '12px', fontWeight: '700', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '200px' }}>
                Category Name
                <input value={newCat.label} onChange={e => setNewCat(p => ({ ...p, label: e.target.value }))} placeholder="e.g. Landscaping & Gardening" style={{ padding: '9px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }} required />
              </label>
            </div>

            {/* Quick Icon Presets Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#666' }}>Quick Icon Picker Presets:</span>
              <div style={{ display: 'flex', gap: '8px', background: '#fafafa', padding: '12px', borderRadius: '10px', border: '1px solid #eee', flexWrap: 'wrap' }}>
                {PRESET_ICONS.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setNewCat(p => ({ ...p, icon: emoji }))}
                    style={{
                      background: newCat.icon === emoji ? 'var(--primary-light)' : '#fff',
                      border: '1.5px solid',
                      borderColor: newCat.icon === emoji ? 'var(--primary)' : '#e5e7eb',
                      borderRadius: '8px',
                      fontSize: '20px',
                      cursor: 'pointer',
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" style={{ background: '#10b981', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', alignSelf: 'flex-start' }}>
              Create Category
            </button>
          </form>
        </div>
      )}

      {/* Categories List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {categories.map(cat => (
          <div key={cat.id} style={{ background: '#fff', border: '1px solid #eee', borderRadius: '14px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '28px' }}>{cat.icon}</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1a1a1a' }}>{cat.label}</h3>
                  <span style={{ fontSize: '12px', color: '#888' }}>{cat.labourTypes.length} labour types</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setEditingCat({ ...cat })} style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                  <HiPencil /> Edit
                </button>
                <button onClick={() => handleDeleteCategory(cat.id)} style={{ background: '#fff', color: '#ef4444', border: '1px solid #fca5a5', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                  <HiTrash /> Remove
                </button>
              </div>
            </div>

            {/* Labour Types */}
            <div>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#666', marginBottom: '8px' }}>Labour Types:</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                {cat.labourTypes.map(type => (
                  <span key={type} style={{ background: '#f3f4f6', border: '1px solid #e5e5e5', color: '#374151', fontSize: '12px', padding: '4px 10px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    {type}
                    <button onClick={() => handleDeleteLabourType(cat.id, type)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0, fontWeight: '700', fontSize: '13px' }}>×</button>
                  </span>
                ))}

                {addingLabourType === cat.id ? (
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <input
                      autoFocus
                      value={newLabourInput}
                      onChange={e => setNewLabourInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleAddLabourType(cat.id); if (e.key === 'Escape') setAddingLabourType(null); }}
                      placeholder="Type labour name..."
                      style={{ padding: '4px 8px', border: '1px solid var(--primary)', borderRadius: '4px', fontSize: '12px', width: '140px' }}
                    />
                    <button onClick={() => handleAddLabourType(cat.id)} style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>Add</button>
                    <button onClick={() => setAddingLabourType(null)} style={{ background: 'none', border: '1px solid #ddd', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => { setAddingLabourType(cat.id); setNewLabourInput(''); }} style={{ background: '#f3f4f6', border: '1px dashed #d1d5db', color: '#6b7280', fontSize: '12px', padding: '4px 10px', borderRadius: '20px', cursor: 'pointer', fontWeight: '600' }}>
                    + Add Labour Type
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingCat && (
        <div className="modal-overlay" onClick={() => setEditingCat(null)}>
          <div className="confirm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px', width: '100%', borderRadius: '16px' }}>
            <h3>Edit Category</h3>
            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px', textAlign: 'left' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', width: '80px' }}>Icon
                  <input value={editingCat.icon} onChange={e => setEditingCat(p => ({ ...p, icon: e.target.value }))} style={{ display: 'block', width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '20px', textAlign: 'center', marginTop: '4px', boxSizing: 'border-box' }} maxLength={2} />
                </label>
                <label style={{ fontSize: '12px', fontWeight: '700', flex: 1 }}>Name
                  <input value={editingCat.label} onChange={e => setEditingCat(p => ({ ...p, label: e.target.value }))} style={{ display: 'block', width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px', marginTop: '4px', boxSizing: 'border-box' }} required />
                </label>
              </div>

              {/* Quick Icon Presets Grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#666' }}>Quick Icon Picker Presets:</span>
                <div style={{ display: 'flex', gap: '6px', background: '#fafafa', padding: '10px', borderRadius: '10px', border: '1px solid #eee', flexWrap: 'wrap' }}>
                  {PRESET_ICONS.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setEditingCat(p => ({ ...p, icon: emoji }))}
                      style={{
                        background: editingCat.icon === emoji ? 'var(--primary-light)' : '#fff',
                        border: '1.5px solid',
                        borderColor: editingCat.icon === emoji ? 'var(--primary)' : '#e5e7eb',
                        borderRadius: '6px',
                        fontSize: '18px',
                        cursor: 'pointer',
                        width: '36px',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="cm-actions" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" className="cm-cancel" onClick={() => setEditingCat(null)} style={{ background: '#f3f4f6', color: '#4b5563', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
                <button type="submit" className="cm-confirm" style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
