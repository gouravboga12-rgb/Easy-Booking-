import { create } from 'zustand';
import { allVehicles } from '../data/vehicles';
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
  else if (dbOrder.status === 'completed') stage = 4;

  return {
    id: dbOrder.id,
    vehicle,
    booking: {
      location: dbOrder.location,
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
    rejectedWorkers: []
  };
};

export const useStore = create((set, get) => ({
  orders: [],
  activeOrder: null,
  cart: [],
  services: allVehicles,

  addService: (newService) => {
    set(s => ({ services: [...s.services, newService] }));
  },

  updateService: (id, updatedData) => {
    set(s => ({
      services: s.services.map(v => v.id === id ? { ...v, ...updatedData } : v)
    }));
  },

  deleteService: (id) => {
    set(s => ({
      services: s.services.filter(v => v.id !== id)
    }));
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
      date: booking.date,
      duration: booking.duration,
      totalAmount: booking.total,
      vehicleId: vehicle.id,
      bookingType: booking.bookingType || 'instant'
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
    else if (order.stage === 3) nextStatus = 'completed';

    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: nextStatus })
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
  }
}));
