import { useState } from 'react';
import { categories, allVehicles } from '../../data/vehicles';
import { HiCube, HiChevronLeft, HiPencil } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import './Admin.css';

export default function AdminProducts() {
  const navigate = useNavigate();
  const [activeCat, setActiveCat] = useState('all');

  const filtered = activeCat === 'all' ? allVehicles : allVehicles.filter(v => v.category === activeCat);

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="ah-with-back">
          <button className="back-icon-btn" onClick={() => navigate('/admin/more')}><HiChevronLeft /></button>
          <div><h1>Products</h1><p>{allVehicles.length} vehicles listed</p></div>
        </div>
      </div>

      <div className="filter-tabs">
        <button className={activeCat === 'all' ? 'active' : ''} onClick={() => setActiveCat('all')}>
          All <span className="tab-count">{allVehicles.length}</span>
        </button>
        {categories.map(c => (
          <button key={c.id} className={activeCat === c.id ? 'active' : ''} onClick={() => setActiveCat(c.id)}>
            {c.label} <span className="tab-count">{c.vehicles.length}</span>
          </button>
        ))}
      </div>

      <div className="products-grid">
        {filtered.map(v => (
          <div key={v.id} className="product-card">
            <div className="pc-img-wrap">
              <img src={v.image} alt={v.name} className="pc-img" onError={e => { e.target.src = 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&q=70'; }} />
              <span className="pc-cat">{v.categoryLabel}</span>
            </div>
            <div className="pc-body">
              <h3>{v.name}</h3>
              <p>{v.desc}</p>
              <div className="pc-footer">
                <span className="pc-rate">₹{v.rate.toLocaleString()}<span className="pc-unit">/{v.unit}</span></span>
                <button className="act-btn assign"><HiPencil style={{ width: 12, height: 12 }} /> Edit</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
