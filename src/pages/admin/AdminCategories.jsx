import { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { HiPlus, HiPencil, HiTrash, HiCheckCircle } from 'react-icons/hi';
import './Admin.css';

const PRESET_ICONS = [
  '🏗️', '⛏️', '🪵', '🔧', '⚙️', '🧹', '🚛', '🍳', '🏠', '🛋️', '⚡', '💧', '🩹', '🎨', '🚨', '🧰', '📐', '🔩', '🪴', '🧺', '🧼', '🚚', '📦', '🦺'
];

export default function AdminCategories() {
  const categories = useStore(s => s.categories);
  const fetchCategories = useStore(s => s.fetchCategories);
  const addCategory = useStore(s => s.addCategory);
  const updateCategory = useStore(s => s.updateCategory);
  const deleteCategory = useStore(s => s.deleteCategory);

  const [editingCat, setEditingCat] = useState(null);
  const [addingLabourType, setAddingLabourType] = useState(null);
  const [newLabourInput, setNewLabourInput] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCat, setNewCat] = useState({ label: '', icon: '📦', image_url: '', color: '#6d28d9', icon_name: 'MdBuild' });
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const showSuccess = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3000); };

  const handleImageUpload = (file, isEdit = false) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (isEdit) {
        setEditingCat(p => ({ ...p, image_url: reader.result }));
      } else {
        setNewCat(p => ({ ...p, image_url: reader.result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCat.label) return;
    const id = newCat.label.toLowerCase().replace(/\s+/g, '-');
    const res = await addCategory({
      id,
      label: newCat.label,
      icon: newCat.icon,
      image_url: newCat.image_url,
      color: newCat.color,
      icon_name: newCat.icon_name,
      labour_types: []
    });
    if (res && res.success) {
      setNewCat({ label: '', icon: '📦', image_url: '', color: '#6d28d9', icon_name: 'MdBuild' });
      setShowAddForm(false);
      showSuccess('Category added successfully!');
    } else {
      alert(res?.error || 'Failed to add category');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Delete this category permanently? This may affect existing service listings.')) return;
    const res = await deleteCategory(id);
    if (res && res.success) {
      showSuccess('Category deleted successfully!');
    } else {
      alert(res?.error || 'Failed to delete category');
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    const res = await updateCategory(editingCat.id, {
      label: editingCat.label,
      icon: editingCat.icon,
      image_url: editingCat.image_url,
      color: editingCat.color,
      icon_name: editingCat.icon_name
    });
    if (res && res.success) {
      setEditingCat(null);
      showSuccess('Category updated!');
    } else {
      alert(res?.error || 'Failed to update category');
    }
  };

  const handleAddLabourType = async (catId) => {
    if (!newLabourInput.trim()) return;
    const cat = categories.find(c => c.id === catId);
    if (!cat) return;
    const updatedLabour = [...(cat.labourTypes || []), newLabourInput.trim()];
    const res = await updateCategory(catId, {
      labour_types: updatedLabour
    });
    if (res && res.success) {
      setNewLabourInput('');
      setAddingLabourType(null);
      showSuccess('Labour type added!');
    } else {
      alert(res?.error || 'Failed to add labour type');
    }
  };

  const handleDeleteLabourType = async (catId, type) => {
    const cat = categories.find(c => c.id === catId);
    if (!cat) return;
    const updatedLabour = (cat.labourTypes || []).filter(t => t !== type);
    const res = await updateCategory(catId, {
      labour_types: updatedLabour
    });
    if (res && res.success) {
      showSuccess('Labour type removed!');
    } else {
      alert(res?.error || 'Failed to remove labour type');
    }
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
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1.5fr', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                Icon (Emoji)
                <input value={newCat.icon} onChange={e => setNewCat(p => ({ ...p, icon: e.target.value }))} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '20px', textAlign: 'center' }} maxLength={2} />
              </label>
              <label style={{ fontSize: '12px', fontWeight: '700', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                Category Name
                <input value={newCat.label} onChange={e => setNewCat(p => ({ ...p, label: e.target.value }))} placeholder="e.g. Landscaping & Gardening" style={{ padding: '9px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }} required />
              </label>
              <label style={{ fontSize: '12px', fontWeight: '700', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                Category Cover Image
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {newCat.image_url ? (
                    <div style={{ position: 'relative', width: '80px', height: '60px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #ddd' }}>
                      <img src={newCat.image_url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        type="button"
                        onClick={() => setNewCat(p => ({ ...p, image_url: '' }))}
                        style={{
                          position: 'absolute',
                          top: '2px',
                          right: '2px',
                          background: 'rgba(239, 68, 68, 0.9)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '50%',
                          width: '18px',
                          height: '18px',
                          fontSize: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div
                      style={{
                        flex: 1,
                        height: '42px',
                        border: '2px dashed #ccc',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#fafafa',
                        cursor: 'pointer',
                        position: 'relative'
                      }}
                    >
                      <span style={{ fontSize: '12px', color: '#666' }}>Click to upload image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => handleImageUpload(e.target.files[0], false)}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          opacity: 0,
                          cursor: 'pointer'
                        }}
                      />
                    </div>
                  )}
                </div>
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', flexWrap: 'wrap' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                Accent Color
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input type="color" value={newCat.color} onChange={e => setNewCat(p => ({ ...p, color: e.target.value }))} style={{ padding: 0, width: '40px', height: '36px', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer' }} />
                  <input value={newCat.color} onChange={e => setNewCat(p => ({ ...p, color: e.target.value }))} placeholder="#6d28d9" style={{ flex: 1, padding: '9px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }} required />
                </div>
              </label>
              <label style={{ fontSize: '12px', fontWeight: '700', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                React Icon Component
                <select value={newCat.icon_name} onChange={e => setNewCat(p => ({ ...p, icon_name: e.target.value }))} style={{ padding: '9px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '14px' }}>
                  <option value="MdHomeWork">MdHomeWork (Contractors & Civil)</option>
                  <option value="MdConstruction">MdConstruction (Site Labour)</option>
                  <option value="FaHammer">FaHammer (Carpentry & Woodwork)</option>
                  <option value="MdEngineering">MdEngineering (Maintenance & Tech)</option>
                  <option value="MdBuild">MdBuild (Installations & Repairs)</option>
                  <option value="MdCleaningServices">MdCleaningServices (Housekeeping)</option>
                  <option value="MdDirectionsCar">MdDirectionsCar (Logistics & Drivers)</option>
                  <option value="MdRestaurant">MdRestaurant (Cooking & Events)</option>
                  <option value="MdPalette">MdPalette (Painting & Decoration)</option>
                  <option value="MdPlumbing">MdPlumbing (Plumbing Services)</option>
                  <option value="MdElectricBolt">MdElectricBolt (Electrical Services)</option>
                  <option value="MdGrass">MdGrass (Gardening & Landscaping)</option>
                  <option value="MdSecurity">MdSecurity (Security & Guarding)</option>
                  <option value="MdLocalShipping">MdLocalShipping (Packers & Movers)</option>
                  <option value="MdContentCut">MdContentCut (Beauty & Grooming)</option>
                  <option value="MdMedicalServices">MdMedicalServices (Healthcare & Caregivers)</option>
                  <option value="MdCameraAlt">MdCameraAlt (Photography & Media)</option>
                  <option value="MdDryCleaning">MdDryCleaning (Laundry & Dry Clean)</option>
                  <option value="MdAutoStories">MdAutoStories (Education & Tutoring)</option>
                  <option value="MdPets">MdPets (Pet Care & Dog Walking)</option>
                  <option value="MdHardware">MdHardware (Hardware & Tools)</option>
                  <option value="MdHandyman">MdHandyman (Handyman Services)</option>
                </select>
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

               <label style={{ fontSize: '12px', fontWeight: '700', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                 Category Cover Image
                 <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '4px' }}>
                   {editingCat.image_url ? (
                     <div style={{ position: 'relative', width: '80px', height: '60px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #ddd' }}>
                       <img src={editingCat.image_url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                       <button
                         type="button"
                         onClick={() => setEditingCat(p => ({ ...p, image_url: '' }))}
                         style={{
                           position: 'absolute',
                           top: '2px',
                           right: '2px',
                           background: 'rgba(239, 68, 68, 0.9)',
                           color: '#fff',
                           border: 'none',
                           borderRadius: '50%',
                           width: '18px',
                           height: '18px',
                           fontSize: '10px',
                           display: 'flex',
                           alignItems: 'center',
                           justifyContent: 'center',
                           cursor: 'pointer'
                         }}
                       >
                         ×
                       </button>
                     </div>
                   ) : (
                     <div
                       style={{
                         flex: 1,
                         height: '42px',
                         border: '2px dashed #ccc',
                         borderRadius: '8px',
                         display: 'flex',
                         alignItems: 'center',
                         justifyContent: 'center',
                         background: '#fafafa',
                         cursor: 'pointer',
                         position: 'relative'
                       }}
                     >
                       <span style={{ fontSize: '12px', color: '#666' }}>Click to upload image</span>
                       <input
                         type="file"
                         accept="image/*"
                         onChange={e => handleImageUpload(e.target.files[0], true)}
                         style={{
                           position: 'absolute',
                           top: 0,
                           left: 0,
                           width: '100%',
                           height: '100%',
                           opacity: 0,
                           cursor: 'pointer'
                         }}
                       />
                     </div>
                   )}
                 </div>
               </label>

               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                 <label style={{ fontSize: '12px', fontWeight: '700' }}>Accent Color
                   <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                     <input type="color" value={editingCat.color || '#6d28d9'} onChange={e => setEditingCat(p => ({ ...p, color: e.target.value }))} style={{ padding: 0, width: '36px', height: '36px', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer' }} />
                     <input value={editingCat.color || ''} onChange={e => setEditingCat(p => ({ ...p, color: e.target.value }))} placeholder="#6d28d9" style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '6px', boxSizing: 'border-box' }} required />
                   </div>
                 </label>
                 <label style={{ fontSize: '12px', fontWeight: '700' }}>React Icon Name
                   <select value={editingCat.icon_name || 'MdBuild'} onChange={e => setEditingCat(p => ({ ...p, icon_name: e.target.value }))} style={{ display: 'block', width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px', marginTop: '4px', boxSizing: 'border-box' }}>
                     <option value="MdHomeWork">MdHomeWork</option>
                     <option value="MdConstruction">MdConstruction</option>
                     <option value="FaHammer">FaHammer</option>
                     <option value="MdEngineering">MdEngineering</option>
                     <option value="MdBuild">MdBuild</option>
                     <option value="MdCleaningServices">MdCleaningServices</option>
                     <option value="MdDirectionsCar">MdDirectionsCar</option>
                     <option value="MdRestaurant">MdRestaurant</option>
                     <option value="MdPalette">MdPalette</option>
                     <option value="MdPlumbing">MdPlumbing</option>
                     <option value="MdElectricBolt">MdElectricBolt</option>
                     <option value="MdGrass">MdGrass</option>
                     <option value="MdSecurity">MdSecurity</option>
                     <option value="MdLocalShipping">MdLocalShipping</option>
                     <option value="MdContentCut">MdContentCut</option>
                     <option value="MdMedicalServices">MdMedicalServices</option>
                     <option value="MdCameraAlt">MdCameraAlt</option>
                     <option value="MdDryCleaning">MdDryCleaning</option>
                     <option value="MdAutoStories">MdAutoStories</option>
                     <option value="MdPets">MdPets</option>
                     <option value="MdHardware">MdHardware</option>
                     <option value="MdHandyman">MdHandyman</option>
                   </select>
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
