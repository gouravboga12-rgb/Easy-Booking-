import { create } from 'zustand';
import { API_BASE_URL } from '../config';

const ORDER_STAGES = ['Confirmed', 'Operator Assigned', 'En Route', 'On Site', 'Completed'];

const DEFAULT_CATEGORIES = [
  { id: 'contractors', label: 'Contractors & Civil', icon: '🏗️', image_url: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=150&q=80', color: '#4f46e5', icon_name: 'MdHomeWork', labourTypes: ['Site Supervisor', 'General Contractor', 'Civil Estimator'] },
  { id: 'construction-labour', label: 'Construction & Site Labour', icon: '⛏️', image_url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=150&q=80', color: '#f59e0b', icon_name: 'MdConstruction', labourTypes: ['Mason', 'Brick Layer', 'Shuttering Worker', 'Steel Fixer'] },
  { id: 'interior-carpentry', label: 'Interior & Carpentry', icon: '🪵', image_url: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=150&q=80', color: '#8b5cf6', icon_name: 'FaHammer', labourTypes: ['Carpenter', 'Cabinet Maker', 'Interior Designer', 'Furniture Fixer'] },
  { id: 'professionals', label: 'Maintenance Professionals', icon: '🔧', image_url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=150&q=80', color: '#3b82f6', icon_name: 'MdEngineering', labourTypes: ['Electrician', 'Plumber', 'AC Technician', 'Painter'] },
  { id: 'installations', label: 'Technical Installations', icon: '⚙️', image_url: 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=150&q=80', color: '#ec4899', icon_name: 'MdBuild', labourTypes: ['CCTV Installer', 'Home Automation Technician', 'Solar Panel Fitter'] },
  { id: 'housekeeping', label: 'Housekeeping & Cleaning', icon: '🧹', image_url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=150&q=80', color: '#10b981', icon_name: 'MdCleaningServices', labourTypes: ['House Cleaner', 'Deep Clean Expert', 'Pest Control', 'Laundry Worker'] },
  { id: 'drivers-logistics', label: 'Drivers & Logistics', icon: '🚛', image_url: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=150&q=80', color: '#84cc16', icon_name: 'MdDirectionsCar', labourTypes: ['Truck Driver', 'Auto Driver', 'Loading Labour', 'Goods Mover'] },
  { id: 'cooking-events', label: 'Cooking & Events', icon: '🍳', image_url: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=150&q=80', color: '#06b6d4', icon_name: 'MdRestaurant', labourTypes: ['Cook', 'Caterer', 'Event Helper', 'Waiter', 'Bartender'] }
];

const formatDbOrder = (dbOrder, services) => {
  const vehicle = services.find(v => v.id === dbOrder.vehicle_id) || { id: dbOrder.vehicle_id, name: 'Service', rate: 0 };
  const customer = { id: dbOrder.customer_id, name: dbOrder.customer_name || 'Customer', phone: dbOrder.customer_phone || '' };
  const operator = dbOrder.worker_id ? { 
    id: dbOrder.worker_id, 
    name: dbOrder.worker_name || 'Operator', 
    phone: dbOrder.worker_phone || '', 
    vehicle: dbOrder.worker_vehicle || '' 
  } : null;

  let stage = 0;
  if (dbOrder.status === 'assigned') stage = 1;
  else if (dbOrder.status === 'active') stage = 2;
  else if (dbOrder.status === 'arrived') stage = 3;
  else if (dbOrder.status === 'completed') stage = 4;

  let rejectedList = [];
  if (dbOrder.rejected_workers) {
    try {
      rejectedList = JSON.parse(dbOrder.rejected_workers);
      if (!Array.isArray(rejectedList)) {
        rejectedList = [];
      }
    } catch (e) {
      rejectedList = [];
    }
  }

  let completionPhotos = [];
  if (dbOrder.completion_photos) {
    try {
      completionPhotos = JSON.parse(dbOrder.completion_photos);
      if (!Array.isArray(completionPhotos)) {
        completionPhotos = [];
      }
    } catch (e) {
      completionPhotos = [];
    }
  }

  return {
    id: dbOrder.id,
    vehicle,
    booking: {
      location: dbOrder.location,
      lat: dbOrder.customer_lat ? parseFloat(dbOrder.customer_lat) : null,
      lng: dbOrder.customer_lng ? parseFloat(dbOrder.customer_lng) : null,
      date: dbOrder.booking_date,
      duration: dbOrder.duration,
      total: parseFloat(dbOrder.total_amount),
      bookingType: dbOrder.booking_type
    },
    customer,
    operator,
    stage,
    stages: ORDER_STAGES,
    status: dbOrder.status,
    placedAt: new Date(dbOrder.created_at).toLocaleTimeString(),
    createdAt: dbOrder.created_at,
    rejectedWorkers: rejectedList,
    completionImages: completionPhotos
  };
};

export const useStore = create((set, get) => ({
  orders: [],
  activeOrder: null,
  cart: [],
  liveTracking: {},

  services: [],

  fetchServices: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/services`);
      const data = await response.json();
      if (response.ok) {
        // Normalize DB column names to frontend format
        const normalized = data.map(s => ({
          id: s.id,
          name: s.name,
          desc: s.desc,
          category: s.category,
          categoryLabel: s.category_label,
          rate: parseFloat(s.rate),
          unit: s.unit,
          image: s.image,
          custom_fields: s.custom_fields ? (typeof s.custom_fields === 'string' ? JSON.parse(s.custom_fields) : s.custom_fields) : []
        }));
        set({ services: normalized });
      }
    } catch (err) {
      console.error('Fetch services error:', err);
    }
  },

  addService: async (newService) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newService)
      });
      const data = await response.json();
      if (response.ok) {
        const normalized = { 
          id: data.id, 
          name: data.name, 
          desc: data.desc, 
          category: data.category, 
          categoryLabel: data.category_label, 
          rate: parseFloat(data.rate), 
          unit: data.unit, 
          image: data.image,
          custom_fields: data.custom_fields ? (typeof data.custom_fields === 'string' ? JSON.parse(data.custom_fields) : data.custom_fields) : []
        };
        set(s => ({ services: [...s.services, normalized] }));
      }
    } catch (err) {
      console.error('Add service error:', err);
    }
  },

  updateService: async (id, updatedData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/services/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(updatedData)
      });
      const data = await response.json();
      if (response.ok) {
        const normalized = { 
          id: data.id, 
          name: data.name, 
          desc: data.desc, 
          category: data.category, 
          categoryLabel: data.category_label, 
          rate: parseFloat(data.rate), 
          unit: data.unit, 
          image: data.image,
          custom_fields: data.custom_fields ? (typeof data.custom_fields === 'string' ? JSON.parse(data.custom_fields) : data.custom_fields) : []
        };
        set(s => ({ services: s.services.map(v => v.id === id ? normalized : v) }));
      }
    } catch (err) {
      console.error('Update service error:', err);
    }
  },

  deleteService: async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/services/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        set(s => ({ services: s.services.filter(v => v.id !== id) }));
      }
    } catch (err) {
      console.error('Delete service error:', err);
    }
  },

  addToCart: (vehicle, booking) => {
    const item = { cartId: `cart-${Date.now()}`, vehicle, booking };
    set(s => ({ cart: [...s.cart, item] }));
  },

  removeFromCart: (cartId) => {
    set(s => ({ cart: s.cart.filter(i => i.cartId !== cartId) }));
  },

  clearCart: () => set({ cart: [] }),

  fetchOrdersForCustomer: async (customerId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/customer/${customerId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (response.ok) {
        const formatted = data.map(o => formatDbOrder(o, get().services));
        set({ orders: formatted });
        // Set active order if there is one running
        const active = formatted.find(o => ['pending', 'assigned', 'active'].includes(o.status));
        if (active) set({ activeOrder: active });
      }
    } catch (e) {
      console.error(e);
    }
  },

  fetchOrdersForWorker: async (workerId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/worker/${workerId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (response.ok) {
        const formatted = data.map(o => formatDbOrder(o, get().services));
        set({ orders: formatted });
      }
    } catch (e) {
      console.error(e);
    }
  },

  fetchOrdersForAdmin: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (response.ok) {
        const formatted = data.map(o => formatDbOrder(o, get().services));
        set({ orders: formatted });
      }
    } catch (e) {
      console.error(e);
    }
  },

  placeOrder: async (vehicle, booking, customer) => {
    const body = {
      customerId: customer?.id || 'guest',
      workerId: null,
      location: booking.location,
      customerLat: booking.lat || null,
      customerLng: booking.lng || null,
      date: booking.date,
      duration: booking.duration,
      totalAmount: booking.total,
      vehicleId: vehicle.id,
      bookingType: booking.bookingType || 'instant',
      notes: booking.notes || booking.instructions || null
    };
    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (response.ok) {
        const formatted = formatDbOrder(data, get().services);
        set(s => ({ orders: [formatted, ...s.orders], activeOrder: formatted }));
        return formatted;
      }
    } catch (err) {
      console.error('Error placing order:', err);
    }
  },

  deleteOrder: async (orderId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        set(s => ({
          orders: s.orders.filter(o => o.id !== orderId)
        }));
        return { success: true };
      } else {
        return { error: data.message || 'Failed to delete order' };
      }
    } catch (err) {
      console.error('Delete order error:', err);
      return { error: 'Connection error' };
    }
  },

  assignWorker: async (orderId, worker) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: 'assigned', workerId: worker.id })
      });
      const data = await response.json();
      if (response.ok) {
        const formatted = formatDbOrder(data, get().services);
        set(s => ({
          orders: s.orders.map(o => o.id === orderId ? formatted : o),
          activeOrder: s.activeOrder?.id === orderId ? formatted : s.activeOrder
        }));
      }
    } catch (err) {
      console.error(err);
    }
  },

  rejectActiveJob: async (orderId, workerId, cancelReason, cancelDetails) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          status: 'pending',
          rejectWorkerId: workerId,
          cancelReason,
          cancelDetails
        })
      });
      const data = await response.json();
      if (response.ok) {
        const formatted = formatDbOrder(data, get().services);
        set(s => ({
          orders: s.orders.map(o => o.id === orderId ? formatted : o),
          activeOrder: s.activeOrder?.id === orderId ? null : s.activeOrder
        }));
        return { success: true };
      } else {
        return { error: data.message || 'Failed to cancel job' };
      }
    } catch (err) {
      console.error('rejectActiveJob error:', err);
      return { error: 'Connection error' };
    }
  },

  rejectOrder: (orderId, workerId) => {
    // Keep locally in Zustand to hide from worker UI
    set(s => ({
      orders: s.orders.map(o =>
        o.id === orderId
          ? { ...o, rejectedWorkers: [...(o.rejectedWorkers || []), workerId] }
          : o
      ),
    }));
  },

  uploadCompletionImages: (orderId, images) => {
    set(s => {
      const updated = s.orders.map(o =>
        o.id === orderId ? { ...o, completionImages: images } : o
      );
      const updatedOrder = updated.find(o => o.id === orderId);
      return {
        orders: updated,
        activeOrder: s.activeOrder?.id === orderId ? updatedOrder : s.activeOrder,
      };
    });
  },

  advanceStage: async (orderId) => {
    const order = get().orders.find(o => o.id === orderId);
    if (!order) return;

    let nextStatus = 'active';
    if (order.stage === 0) nextStatus = 'assigned';
    else if (order.stage === 1) nextStatus = 'active';
    else if (order.stage === 2) nextStatus = 'arrived';
    else if (order.stage === 3) nextStatus = 'completed';

    try {
      const body = { status: nextStatus };
      if (nextStatus === 'completed' && order.completionImages) {
        body.completionPhotos = order.completionImages;
      }

      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (response.ok) {
        const formatted = formatDbOrder(data, get().services);
        set(s => ({
          orders: s.orders.map(o => o.id === orderId ? formatted : o),
          activeOrder: s.activeOrder?.id === orderId ? formatted : s.activeOrder
        }));
      }
    } catch (err) {
      console.error(err);
    }
  },

  cancelOrder: async (orderId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: 'cancelled' })
      });
      const data = await response.json();
      if (response.ok) {
        const formatted = formatDbOrder(data, get().services);
        set(s => ({
          orders: s.orders.map(o => o.id === orderId ? formatted : o),
          activeOrder: s.activeOrder?.id === orderId ? null : s.activeOrder
        }));
      }
    } catch (err) {
      console.error(err);
    }
  },

  setActiveOrder: (order) => set({ activeOrder: order }),
  clearActiveOrder: () => set({ activeOrder: null }),

  getOrdersByCustomer: (customerId) => {
    return get().orders.filter(o => o.customer?.id === customerId);
  },

  getOrdersByWorker: (workerId) => {
    return get().orders.filter(o => o.operator?.id === workerId && !o.rejectedWorkers?.includes(workerId));
  },

  getPendingOrders: () => {
    return get().orders.filter(o => o.status === 'pending');
  },

  updateWorkerLocation: async (lat, lng) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE_URL}/tracking/worker/location`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ lat, lng })
      });
    } catch (err) {
      console.error('Error updating worker location:', err);
    }
  },

  fetchLiveTracking: async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/tracking/order/${orderId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        set(s => ({
          liveTracking: {
            ...s.liveTracking,
            [orderId]: data
          }
        }));
        return data;
      }
    } catch (err) {
      console.error('Error fetching live tracking:', err);
    }
    return null;
  },

  submitOrderReview: async (orderId, rating, comment) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/review`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rating, comment })
      });
      const data = await response.json();
      if (response.ok) {
        return { success: true };
      } else {
        return { error: data.message || 'Failed to submit review' };
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      return { error: 'Connection error' };
    }
  },

  sendWorkerMessage: async (orderId, message) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE_URL}/tracking/order/${orderId}/message`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message })
      });
    } catch (err) {
      console.error('Error sending worker message:', err);
    }
  },

  rejectActiveJob: async (orderId, workerId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: 'pending', rejectWorkerId: workerId })
      });
      const data = await response.json();
      if (response.ok) {
        const formatted = formatDbOrder(data, get().services);
        set(s => ({
          orders: s.orders.map(o => o.id === orderId ? formatted : o),
          activeOrder: s.activeOrder?.id === orderId ? null : s.activeOrder
        }));
      }
    } catch (err) {
      console.error('Error rejecting active job:', err);
    }
  },

  subscriptionPlans: [],

  fetchSubscriptionPlans: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/subscriptions`);
      const data = await response.json();
      if (response.ok) {
        set({ subscriptionPlans: data });
      }
    } catch (err) {
      console.error('Fetch subscription plans error:', err);
    }
  },

  addSubscriptionPlan: async (planData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/subscriptions`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(planData)
      });
      const data = await response.json();
      if (response.ok) {
        set(s => ({ subscriptionPlans: [...s.subscriptionPlans, data] }));
        return { success: true };
      } else {
        return { error: data.message || 'Failed to create plan' };
      }
    } catch (err) {
      console.error('Add subscription plan error:', err);
      return { error: 'Connection error' };
    }
  },

  updateSubscriptionPlan: async (id, updatedData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/subscriptions/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedData)
      });
      const data = await response.json();
      if (response.ok) {
        set(s => ({ 
          subscriptionPlans: s.subscriptionPlans.map(p => p.id === id ? data : p) 
        }));
        return { success: true };
      } else {
        return { error: data.message || 'Failed to update plan' };
      }
    } catch (err) {
      console.error('Update subscription plan error:', err);
      return { error: 'Connection error' };
    }
  },

  deleteSubscriptionPlan: async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/subscriptions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        set(s => ({ 
          subscriptionPlans: s.subscriptionPlans.filter(p => p.id !== id) 
        }));
        return { success: true };
      } else {
        return { error: data.message || 'Failed to delete plan' };
      }
    } catch (err) {
      console.error('Delete subscription plan error:', err);
      return { error: 'Connection error' };
    }
  },

  categories: DEFAULT_CATEGORIES,

  fetchCategories: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/categories`);
      const data = await response.json();
      if (response.ok) {
        const normalized = data.map(c => ({
          id: c.id,
          label: c.label,
          icon: c.icon,
          image_url: c.image_url,
          color: c.color || '#6d28d9',
          icon_name: c.icon_name || 'MdBuild',
          labourTypes: c.labour_types ? (typeof c.labour_types === 'string' ? JSON.parse(c.labour_types) : c.labour_types) : []
        }));
        set({ categories: normalized });
      }
    } catch (err) {
      console.error('Fetch categories error:', err);
    }
  },

  addCategory: async (catData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(catData)
      });
      const data = await response.json();
      if (response.ok) {
        const normalized = {
          id: data.id,
          label: data.label,
          icon: data.icon,
          image_url: data.image_url,
          color: data.color || '#6d28d9',
          icon_name: data.icon_name || 'MdBuild',
          labourTypes: data.labour_types ? (typeof data.labour_types === 'string' ? JSON.parse(data.labour_types) : data.labour_types) : []
        };
        set(s => ({ categories: [...s.categories, normalized] }));
        return { success: true };
      } else {
        return { error: data.message || 'Failed to add category' };
      }
    } catch (err) {
      console.error('Add category error:', err);
      return { error: 'Connection error' };
    }
  },

  updateCategory: async (id, catData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(catData)
      });
      const data = await response.json();
      if (response.ok) {
        const normalized = {
          id: data.id,
          label: data.label,
          icon: data.icon,
          image_url: data.image_url,
          color: data.color || '#6d28d9',
          icon_name: data.icon_name || 'MdBuild',
          labourTypes: data.labour_types ? (typeof data.labour_types === 'string' ? JSON.parse(data.labour_types) : data.labour_types) : []
        };
        set(s => ({
          categories: s.categories.map(c => c.id === id ? normalized : c)
        }));
        return { success: true };
      } else {
        return { error: data.message || 'Failed to update category' };
      }
    } catch (err) {
      console.error('Update category error:', err);
      return { error: 'Connection error' };
    }
  },

  deleteCategory: async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        set(s => ({
          categories: s.categories.filter(c => c.id !== id)
        }));
        return { success: true };
      } else {
        return { error: data.message || 'Failed to delete category' };
      }
    } catch (err) {
      console.error('Delete category error:', err);
      return { error: 'Connection error' };
    }
  }
}));
