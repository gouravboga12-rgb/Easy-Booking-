import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import PopupAdModal from './components/PopupAdModal';
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
import UnifiedLoginSelect from './pages/auth/UnifiedLoginSelect';
import ForgotPassword from './pages/auth/ForgotPassword';
import WorkerForgotPassword from './pages/auth/WorkerForgotPassword';

function RootIndex() {
  const user = useAuthStore(s => s.user);
  if (user && user.role === 'worker') {
    return <Navigate to="/worker" replace />;
  }
  return <Home />;
}

import AdminLogin from './pages/auth/AdminLogin';
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

import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsConditions from './pages/TermsConditions';
import RefundPolicy from './pages/RefundPolicy';
import ContactUs from './pages/ContactUs';

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
  const user = useAuthStore(s => s.user);
  const isLoginSelect = pathname === '/login-select' || pathname === '/login_select' || pathname === '/login-type';
  const isAdminOrWorker = pathname.startsWith('/admin') || pathname.startsWith('/worker') || pathname.includes('worker');
  const hideHeaderFooter = isAdminOrWorker || isLoginSelect;

  const fetchWorkers = useAuthStore(s => s.fetchWorkers);
  const fetchOrdersForCustomer = useStore(s => s.fetchOrdersForCustomer);
  const fetchOrdersForWorker = useStore(s => s.fetchOrdersForWorker);
  const fetchOrdersForAdmin = useStore(s => s.fetchOrdersForAdmin);
  const fetchServices = useStore(s => s.fetchServices);
  const fetchBanners = useStore(s => s.fetchBanners);
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

  // Request Notification permission prompt when app opens or user logs in
  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, [user]);

  const sendBrowserNotification = (title, body, url) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const notif = new Notification(title, {
          body,
          icon: '/logo.png',
          badge: '/logo.png',
          data: { url }
        });
        notif.onclick = function (e) {
          e.preventDefault();
          window.focus();
          if (url) {
            window.location.href = url;
          }
          notif.close();
        };
      } catch (err) {
        console.warn('Native notification error:', err);
      }
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
        const serviceName = currentOrder.vehicle?.name || 'Service Request';
        const workerName = currentOrder.operator?.name || 'Assigned Worker';
        
        if (matchingPrev) {
          if (matchingPrev.status !== currentOrder.status) {
            // Status changed!
            if (user.role === 'customer' && currentOrder.customer?.id === user.id) {
              let title = `Parrow Skills Order #${currentOrder.id}`;
              let body = `Status updated to ${currentOrder.status.toUpperCase()}`;
              if (currentOrder.status === 'assigned') {
                title = `🎉 Worker Assigned - Order #${currentOrder.id}`;
                body = `${workerName} accepted your ${serviceName} request. Tap to track!`;
              } else if (currentOrder.status === 'active') {
                title = `🚗 Worker En Route - Order #${currentOrder.id}`;
                body = `${workerName} is on the way for ${serviceName}.`;
              } else if (currentOrder.status === 'arrived') {
                title = `📍 Worker Arrived - Order #${currentOrder.id}`;
                body = `${workerName} has reached your location for ${serviceName}.`;
              } else if (currentOrder.status === 'completed') {
                title = `✅ Service Completed - Order #${currentOrder.id}`;
                body = `Your ${serviceName} was completed successfully!`;
              } else if (currentOrder.status === 'cancelled') {
                title = `⚠️ Booking Cancelled - Order #${currentOrder.id}`;
                body = `Your booking for ${serviceName} was cancelled.`;
              }

              const deepLinkUrl = `https://parrowskills.com/track/${currentOrder.id}`;
              addToast(`${title}: ${body}`, 'success');
              playChime();
              sendBrowserNotification(title, body, deepLinkUrl);
            } else if (user.role === 'worker' && currentOrder.operator?.id === user.id) {
              let title = `Worker Update - Order #${currentOrder.id}`;
              let body = `Order status is now ${currentOrder.status.toUpperCase()}`;
              if (currentOrder.status === 'cancelled') {
                title = `⚠️ Booking Cancelled - Order #${currentOrder.id}`;
                body = `Customer cancelled request for ${serviceName}.`;
              } else if (currentOrder.status === 'assigned' && matchingPrev.status === 'pending') {
                title = `🎉 New Job Assigned - #${currentOrder.id}`;
                body = `New ${serviceName} job assigned to you. Tap to view details!`;
              }

              const deepLinkUrl = `https://parrowskills.com/worker/orders`;
              addToast(`${title}: ${body}`, currentOrder.status === 'cancelled' ? 'danger' : 'info');
              playChime();
              sendBrowserNotification(title, body, deepLinkUrl);
            }
          }
        } else {
          // A brand new order was found in list
          if (user.role === 'worker' && currentOrder.status === 'pending') {
            const title = `🔔 New Dispatch Request Available!`;
            const body = `Order #${currentOrder.id}: ${serviceName} in your area. Tap to accept!`;
            const deepLinkUrl = `https://parrowskills.com/worker`;
            addToast(body, 'warning');
            playChime();
            sendBrowserNotification(title, body, deepLinkUrl);
          }
        }
      });
    }

    prevOrdersRef.current = orders;
  }, [orders, user]);

  useEffect(() => {
    // Always fetch services from DB on app load (for all users, public too)
    fetchServices();
    fetchBanners();
  }, [fetchServices, fetchBanners]);

  useEffect(() => {
    if (!user) return;

    const refreshData = () => {
      fetchBanners();
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

    // Background polling interval (every 3 seconds) to refresh orders and banners (live tracking)
    const interval = setInterval(refreshData, 3000);

    return () => clearInterval(interval);
  }, [user, fetchWorkers, fetchOrdersForCustomer, fetchOrdersForWorker, fetchOrdersForAdmin, fetchBanners]);

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

      {!hideHeaderFooter && <Navbar />}
      <main style={{ paddingBottom: hideHeaderFooter ? '0' : '72px', paddingTop: hideHeaderFooter ? '0' : '68px' }}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/login-select" element={<UnifiedLoginSelect />} />
          <Route path="/login-customer" element={<Login />} />
          <Route path="/login-simple" element={<Login />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Legal & Policy Pages */}
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-conditions" element={<TermsConditions />} />
          <Route path="/refund-policy" element={<RefundPolicy />} />
          <Route path="/contact-us" element={<ContactUs />} />

          {/* Worker Login/Signup */}
          <Route path="/login-worker" element={<WorkerLogin />} />
          <Route path="/login_worker" element={<WorkerLogin />} />
          <Route path="/login-workers" element={<WorkerLogin />} />
          <Route path="/register-worker" element={<WorkerRegister />} />
          <Route path="/register_worker" element={<WorkerRegister />} />
          <Route path="/register-workers" element={<WorkerRegister />} />
          <Route path="/forgot-password-worker" element={<WorkerForgotPassword />} />
          <Route path="/admin/login" element={<AdminLogin />} />

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
      {!hideHeaderFooter && <PopupAdModal />}
      {!hideHeaderFooter && <BottomNav />}
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
