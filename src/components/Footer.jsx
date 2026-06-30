import { Link } from 'react-router-dom';
import { FaTwitter, FaInstagram, FaLinkedinIn, FaYoutube } from 'react-icons/fa';
import { MdConstruction } from 'react-icons/md';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Link to="/" className="footer-logo">
            <MdConstruction className="footer-logo-icon" /> Easy<b>Booking</b>
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
          <Link to="/browse">Browse Vehicles</Link>
          <Link to="/orders">My Orders</Link>
          <Link to="#">EasyBooking Reviews</Link>
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
        <p>© Copyright 2026 EasyBooking Technologies India Limited. All rights reserved.</p>
      </div>
    </footer>
  );
}
