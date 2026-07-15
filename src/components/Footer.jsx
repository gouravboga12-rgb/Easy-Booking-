import { Link } from 'react-router-dom';
import { FaTwitter, FaInstagram, FaLinkedinIn, FaYoutube } from 'react-icons/fa';
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
          <div className="footer-social">
            <a href="#" aria-label="Twitter"><FaTwitter /></a>
            <a href="#" aria-label="Instagram"><FaInstagram /></a>
            <a href="#" aria-label="LinkedIn"><FaLinkedinIn /></a>
            <a href="#" aria-label="YouTube"><FaYoutube /></a>
          </div>
        </div>

        <div className="footer-col">
          <h4>Company</h4>
          <Link to="#">About Us</Link>
          <Link to="#">Investor Relations</Link>
          <Link to="#">Terms & Conditions</Link>
          <Link to="#">Privacy Policy</Link>
          <Link to="#">Anti-discrimination Policy</Link>
          <Link to="#">Careers</Link>
        </div>

        <div className="footer-col">
          <h4>For Customers</h4>
          <Link to="/browse">Browse Services</Link>
          <Link to="/orders">My Orders</Link>
          <Link to="#">Parrow Skills Reviews</Link>
          <Link to="#">Categories Near You</Link>
          <Link to="#">Contact Us</Link>
        </div>

        <div className="footer-col">
          <h4>For Professionals</h4>
          <Link to="/register-worker">Register as Operator</Link>
          <Link to="/login-worker">Operator Login</Link>
          <Link to="#">Safety Guidelines</Link>
        </div>
      </div>

      <div className="footer-bottom">
        <p>* As on December 31, 2024</p>
        <p>© Copyright 2026 Parrow Skills Technologies India Limited. All rights reserved. | Developed by <a href="https://www.codtechitsolutions.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#fbbf24', textDecoration: 'none', fontWeight: 'bold' }}>CODTECH IT SOLUTIONS</a></p>
      </div>
    </footer>
  );
}
