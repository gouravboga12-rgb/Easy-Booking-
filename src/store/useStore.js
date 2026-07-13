import { create } from 'zustand';
import { API_BASE_URL } from '../config';

const ORDER_STAGES = ['Confirmed', 'Operator Assigned', 'En Route', 'On Site', 'Completed'];

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
        const normalized = { id: data.id, name: data.name, desc: data.desc, category: data.category, categoryLabel: data.category_label, rate: parseFloat(data.rate), unit: data.unit, image: data.image };
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
        const normalized = { id: data.id, name: data.name, desc: data.desc, category: data.category, categoryLabel: data.category_label, rate: parseFloat(data.rate), unit: data.unit, image: data.image };
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
  }
}));
