import { useNavigate } from 'react-router-dom';
import { HiCube, HiChartBar, HiCurrencyRupee, HiChevronRight, HiDotsHorizontal } from 'react-icons/hi';
import './Admin.css';

const MORE_ITEMS = [
  { to: '/admin/products', icon: HiCube,          label: 'Products',  desc: 'Manage vehicle listings',       color: '#3b82f6' },
  { to: '/admin/reports',  icon: HiChartBar,       label: 'Reports',   desc: 'Analytics & performance data',  color: '#8b5cf6' },
  { to: '/admin/payments', icon: HiCurrencyRupee,  label: 'Payments',  desc: 'Revenue & transaction history', color: '#10b981' },
];

export default function AdminMore() {
  const navigate = useNavigate();
  return (
    <div className="admin-page">
      <div className="admin-header">
        <div><h1>More</h1><p>Additional management tools</p></div>
      </div>
      <div className="more-list">
        {MORE_ITEMS.map(({ to, icon: Icon, label, desc, color }) => (
          <button key={to} className="more-item" onClick={() => navigate(to)}>
            <div className="mi-icon-wrap" style={{ background: color + '18', color }}>
              <Icon className="mi-icon" />
            </div>
            <div className="mi-text">
              <strong>{label}</strong>
              <span>{desc}</span>
            </div>
            <HiChevronRight className="mi-arrow" />
          </button>
        ))}
      </div>
    </div>
  );
}
