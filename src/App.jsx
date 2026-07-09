import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
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

  useEffect(() => {
    // Always fetch services from DB on app load (for all users, public too)
    fetchServices();
  }, [fetchServices]);

  useEffect(() => {
    if (!user) return;
    if (user.role === 'admin') {
      fetchWorkers();
      fetchOrdersForAdmin();
    } else if (user.role === 'customer') {
      fetchOrdersForCustomer(user.id);
    } else if (user.role === 'worker') {
      fetchOrdersForWorker(user.id);
    }
  }, [user, fetchWorkers, fetchOrdersForCustomer, fetchOrdersForWorker, fetchOrdersForAdmin]);

  return (
    <>
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
