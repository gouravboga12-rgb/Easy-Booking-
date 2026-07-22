import { Link } from 'react-router-dom';
import { FaTwitter, FaInstagram, FaLinkedinIn, FaYoutube, FaEnvelope } from 'react-icons/fa';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Link to="/" className="footer-logo">
            <img src="/logo.png" alt="Parrow Skills Logo" className="footer-logo-img" /> Parrow <b>Skills</b>
          </Link>
          <p>India's #1 on-demand construction vehicle booking platform. Book JCBs, Cranes, Tippers & more — instantly.</p>
          <p style={{ marginTop: '12px', fontSize: '0.9rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FaEnvelope style={{ color: '#fbbf24' }} />
            Support: <a href="mailto:tameemansarkhan@gmail.com" style={{ color: '#fbbf24', textDecoration: 'none', fontWeight: 'bold' }}>tameemansarkhan@gmail.com</a>
          </p>
          <div className="footer-social">
            <a href="#" aria-label="Twitter"><FaTwitter /></a>
            <a href="#" aria-label="Instagram"><FaInstagram /></a>
            <a href="#" aria-label="LinkedIn"><FaLinkedinIn /></a>
            <a href="#" aria-label="YouTube"><FaYoutube /></a>
          </div>
        </div>

        <div className="footer-col">
          <h4>Company & Policies</h4>
          <Link to="/terms-conditions">Terms & Conditions</Link>
          <Link to="/privacy-policy">Privacy Policy</Link>
          <Link to="/refund-policy">Refund & Cancellation Policy</Link>
          <Link to="/contact-us">Contact Us</Link>
        </div>

        <div className="footer-col">
          <h4>For Customers</h4>
          <Link to="/browse">Browse Services</Link>
          <Link to="/orders">My Orders</Link>
          <Link to="/contact-us">Customer Support</Link>
        </div>

        <div className="footer-col">
          <h4>For Professionals</h4>
          <Link to="/register-worker">Register as Operator</Link>
          <Link to="/login-worker">Operator Login</Link>
          <Link to="/refund-policy">Subscription Terms & Refund</Link>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© Copyright 2026 Parrow Skills Technologies India Limited. All rights reserved. | Contact: <a href="mailto:tameemansarkhan@gmail.com" style={{ color: '#fbbf24', textDecoration: 'none' }}>tameemansarkhan@gmail.com</a></p>
      </div>
    </footer>
  );
}
