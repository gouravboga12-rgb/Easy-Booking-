import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useAuthStore } from '../store/useAuthStore';
import { HiTrash, HiArrowRight, HiShoppingCart } from 'react-icons/hi';
import './Cart.css';

export default function Cart() {
  const navigate = useNavigate();
  const cart = useStore(s => s.cart);
  const removeFromCart = useStore(s => s.removeFromCart);
  const clearCart = useStore(s => s.clearCart);
  const placeOrder = useStore(s => s.placeOrder);
  const user = useAuthStore(s => s.user);

  const total = cart.reduce((sum, item) => sum + (item.vehicle.rate * item.booking.duration), 0);

  const handleCheckout = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    const customer = { id: user.id, name: user.name, phone: user.phone };
    cart.forEach(item => {
      placeOrder(item.vehicle, item.booking, customer);
    });
    clearCart();
    navigate('/orders');
  };

  if (cart.length === 0) {
    return (
      <div className="cart-empty">
        <HiShoppingCart className="empty-icon" />
        <h2>Your cart is empty</h2>
        <p>Add vehicles to your cart to book them together</p>
        <button className="btn-primary" onClick={() => navigate('/browse')}>
          Browse Vehicles
        </button>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-header">
        <h1>Your Cart</h1>
        <button className="clear-btn" onClick={clearCart}>Clear All</button>
      </div>

      <div className="cart-layout">
        <div className="cart-items">
          {cart.map(item => (
            <div key={item.cartId} className="cart-item">
              <img src={item.vehicle.image} alt={item.vehicle.name} className="ci-img" />
              <div className="ci-details">
                <h3>{item.vehicle.name}</h3>
                <p>{item.vehicle.desc}</p>
                <div className="ci-booking">
                  <span>📍 {item.booking.location}</span>
                  <span>📅 {item.booking.date}</span>
                  <span>⏱ {item.booking.duration} {item.vehicle.unit}</span>
                </div>
              </div>
              <div className="ci-price">
                <div className="ci-rate">₹{(item.vehicle.rate * item.booking.duration).toLocaleString()}</div>
                <button className="ci-remove" onClick={() => removeFromCart(item.cartId)}>
                  <HiTrash /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="cart-summary">
          <h3>Order Summary</h3>
          <div className="cs-row">
            <span>Items ({cart.length})</span>
            <span>₹{total.toLocaleString()}</span>
          </div>
          <div className="cs-row">
            <span>Service Fee</span>
            <span>₹0</span>
          </div>
          <div className="cs-row total">
            <span>Total</span>
            <span>₹{total.toLocaleString()}</span>
          </div>
          <button className="btn-checkout" onClick={handleCheckout}>
            Proceed to Checkout <HiArrowRight />
          </button>
          <button className="btn-continue" onClick={() => navigate('/browse')}>
            Continue Browsing
          </button>
        </div>
      </div>
    </div>
  );
}
