import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuthStore } from './store/useAuthStore';
import { useStore } from './store/useStore';

import Home from './pages/Home';
import Browse from './pages/Browse';
import BookingFlow from './pages/BookingFlow';
import OrderTracking from './pages/OrderTracking';
import Orders from './pages/Orders';
import Cart from './pages/Cart';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import WorkerLogin from './pages/auth/WorkerLogin';
import WorkerRegister from './pages/auth/WorkerRegister';
import AdminLogin from './pages/auth/AdminLogin';
import ForgotPassword from './pages/auth/ForgotPassword';
import WorkerForgotPassword from './pages/auth/WorkerForgotPassword';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminOrders from './pages/admin/AdminOrders';
import AdminWorkers from './pages/admin/AdminWorkers';
import AdminLayout from './pages/admin/AdminLayout';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminMore from './pages/admin/AdminMore';
import AdminProducts from './pages/admin/AdminProducts';
import AdminReports from './pages/admin/AdminReports';
import AdminPayments from './pages/admin/AdminPayments';
import AdminSubscriptions from './pages/admin/AdminSubscriptions';
import AdminRevenue from './pages/admin/AdminRevenue';
import AdminCategories from './pages/admin/AdminCategories';
import AdminCMS from './pages/admin/AdminCMS';
import AdminNotifications from './pages/admin/AdminNotifications';

import WorkerDashboard from './pages/worker/WorkerDashboard';
import WorkerLayout from './pages/worker/WorkerLayout';
import WorkerHome from './pages/worker/WorkerHome';
import WorkerOrders from './pages/worker/WorkerOrders';
import WorkerHistory from './pages/worker/WorkerHistory';
import WorkerWallet from './pages/worker/WorkerWallet';
import WorkerProfile from './pages/worker/WorkerProfile';
import WorkerSubscription from './pages/worker/WorkerSubscription';
import UserProfile from './pages/UserProfile';

import './App.css';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function AdminRouteWrapper() {
  const user = useAuthStore(s => s.user);
  if (!user) {
    return <AdminLogin />;
  }
  if (user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return <AdminLayout />;
}

function Layout() {
  const { pathname } = useLocation();
  const isAdminOrWorker = pathname.startsWith('/admin') || pathname.startsWith('/worker') || pathname.includes('worker');

  const user = useAuthStore(s => s.user);
  const fetchWorkers = useAuthStore(s => s.fetchWorkers);
  const fetchOrdersForCustomer = useStore(s => s.fetchOrdersForCustomer);
  const fetchOrdersForWorker = useStore(s => s.fetchOrdersForWorker);
  const fetchOrdersForAdmin = useStore(s => s.fetchOrdersForAdmin);
  const fetchServices = useStore(s => s.fetchServices);
  const orders = useStore(s => s.orders);

  const [toasts, setToasts] = useState([]);
  const prevOrdersRef = useRef([]);

  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5
      gain1.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.4);
      osc1.start();
      osc1.stop(audioCtx.currentTime + 0.4);

      setTimeout(() => {
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.frequency.setValueAtTime(880.00, audioCtx.currentTime); // A5
        gain2.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.5);
        osc2.start();
        osc2.stop(audioCtx.currentTime + 0.5);
      }, 100);
    } catch (e) {
      console.warn("Audio Context blocked or not supported:", e);
    }
  };

  // Listen for order changes and status transitions
  useEffect(() => {
    if (!user || orders.length === 0) {
      prevOrdersRef.current = orders;
      return;
    }

    const prevOrders = prevOrdersRef.current;
    if (prevOrders && prevOrders.length > 0) {
      orders.forEach(currentOrder => {
        const matchingPrev = prevOrders.find(o => o.id === currentOrder.id);
        if (matchingPrev) {
          if (matchingPrev.status !== currentOrder.status) {
            // Status changed!
            if (user.role === 'customer' && currentOrder.customer?.id === user.id) {
              const statusLabel = currentOrder.status === 'assigned' ? 'Accepted by worker' : currentOrder.status;
              addToast(`Order #${currentOrder.id} status updated to: ${statusLabel.toUpperCase()}`, 'success');
              playChime();
            } else if (user.role === 'worker' && currentOrder.operator?.id === user.id) {
              if (currentOrder.status === 'cancelled') {
                addToast(`⚠️ Customer has cancelled Order #${currentOrder.id}`, 'danger');
                playChime();
              } else if (currentOrder.status === 'assigned' && matchingPrev.status === 'pending') {
                addToast(`🎉 New Order Assigned: #${currentOrder.id}!`, 'success');
                playChime();
              } else {
                addToast(`Order #${currentOrder.id} status is now: ${currentOrder.status.toUpperCase()}`, 'info');
                playChime();
              }
            }
          }
        } else {
          // A brand new order was found in list
          if (user.role === 'worker' && currentOrder.status === 'pending') {
            addToast(`🔔 New Pending Job Available in your Area: #${currentOrder.id}!`, 'warning');
            playChime();
          }
        }
      });
    }

    prevOrdersRef.current = orders;
  }, [orders, user]);

  useEffect(() => {
    // Always fetch services from DB on app load (for all users, public too)
    fetchServices();
  }, [fetchServices]);

  useEffect(() => {
    if (!user) return;

    const refreshData = () => {
      fetchServices();
      if (user.role === 'admin') {
        fetchWorkers();
        fetchOrdersForAdmin();
      } else if (user.role === 'customer') {
        fetchOrdersForCustomer(user.id);
      } else if (user.role === 'worker') {
        fetchOrdersForWorker(user.id);
      }
    };

    // Initial fetch
    refreshData();

    // Background polling interval (every 3 seconds) to refresh the lists
    const interval = setInterval(refreshData, 3000);

    return () => clearInterval(interval);
  }, [user, fetchWorkers, fetchOrdersForCustomer, fetchOrdersForWorker, fetchOrdersForAdmin, fetchServices]);

  return (
    <>
      {/* Toast Overlay */}
      <div className="notification-container">
        {toasts.map(t => (
          <div key={t.id} className={`realtime-toast ${t.type}`}>
            <span>{t.message}</span>
            <button className="realtime-toast-close" onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}>✕</button>
          </div>
        ))}
      </div>

      {!isAdminOrWorker && <Navbar />}
      <main style={{ paddingBottom: isAdminOrWorker ? '0' : '72px', paddingTop: isAdminOrWorker ? '0' : '68px' }}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Worker Login/Signup */}
          <Route path="/login-worker" element={<WorkerLogin />} />
          <Route path="/login-workers" element={<WorkerLogin />} />
          <Route path="/register-worker" element={<WorkerRegister />} />
          <Route path="/register-workers" element={<WorkerRegister />} />
          <Route path="/forgot-password-worker" element={<WorkerForgotPassword />} />

          {/* Customer */}
          <Route path="/book/:id" element={<BookingFlow />} />
          <Route path="/track/:id" element={<OrderTracking />} />
          <Route path="/orders" element={
            <ProtectedRoute roles={['customer', 'admin']}>
              <Orders />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute roles={['customer', 'admin']}>
              <UserProfile />
            </ProtectedRoute>
          } />

          {/* Admin */}
          <Route path="/admin" element={<AdminRouteWrapper />}>
            <Route index element={<AdminDashboard />} />
            <Route path="orders"    element={<AdminOrders />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="workers"   element={<AdminWorkers />} />
            <Route path="more"          element={<AdminMore />} />
            <Route path="products"      element={<AdminProducts />} />
            <Route path="reports"       element={<AdminReports />} />
            <Route path="payments"      element={<AdminPayments />} />
            <Route path="subscriptions" element={<AdminSubscriptions />} />
            <Route path="revenue"       element={<AdminRevenue />} />
            <Route path="categories"    element={<AdminCategories />} />
            <Route path="cms"           element={<AdminCMS />} />
            <Route path="notifications" element={<AdminNotifications />} />
          </Route>

          {/* Worker */}
          <Route path="/worker" element={<ProtectedRoute roles={['worker']}><WorkerLayout /></ProtectedRoute>}>
            <Route index element={<WorkerHome />} />
            <Route path="orders"  element={<WorkerOrders />} />
            <Route path="history" element={<WorkerHistory />} />
            <Route path="wallet"  element={<WorkerWallet />} />
            <Route path="subscription" element={<WorkerSubscription />} />
            <Route path="profile" element={<WorkerProfile />} />
          </Route>
        </Routes>
      </main>
      {!isAdminOrWorker && <BottomNav />}
    </>
  );
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId="372352207561-lg7bl7r84ktcrne90i3cblgjif8titvq.apps.googleusercontent.com">
      <BrowserRouter>
        <ScrollToTop />
        <Layout />
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}
