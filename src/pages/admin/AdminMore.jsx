import { useNavigate } from 'react-router-dom';
import {
  HiCube, HiChartBar, HiCurrencyRupee, HiChevronRight,
  HiBell, HiTag, HiDocumentText, HiShieldCheck,
} from 'react-icons/hi';
import { MdCategory } from 'react-icons/md';
import './Admin.css';

const MORE_ITEMS = [
  { to: '/admin/products',      icon: HiCube,          label: 'Services',               desc: 'View and manage service listings',             color: '#3b82f6' },
  { to: '/admin/categories',    icon: MdCategory,       label: 'Category Management',    desc: 'Add, edit, and remove service categories',    color: '#8b5cf6' },
  { to: '/admin/subscriptions', icon: HiTag,            label: 'Subscription Management', desc: 'Plans, pricing, discounts, and coupons',     color: '#f59e0b' },
  { to: '/admin/revenue',       icon: HiCurrencyRupee,  label: 'Revenue Management',     desc: 'Booking sales, subscription, GST reports',    color: '#10b981' },
  { to: '/admin/reports',       icon: HiChartBar,       label: 'Reports & Analytics',    desc: 'Full platform analytics and performance',     color: '#ef4444' },
  { to: '/admin/notifications', icon: HiBell,           label: 'Notification System',    desc: 'Push, SMS, email broadcasts to users',        color: '#06b6d4' },
  { to: '/admin/cms',           icon: HiDocumentText,   label: 'CMS Management',         desc: 'Banners, announcements, FAQs, blogs',         color: '#d946ef' },
  { to: '/admin/payments',      icon: HiShieldCheck,    label: 'Payments & Transactions', desc: 'Order revenue and transaction history',       color: '#14b8a6' },
];

export default function AdminMore() {
  const navigate = useNavigate();
  return (
    <div className="admin-page">
      <div className="admin-header">
        <div><h1>More</h1><p>Additional management tools and platform controls</p></div>
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
