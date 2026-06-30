import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { allVehicles } from '../data/vehicles';

const ORDER_STAGES = ['Confirmed', 'Operator Assigned', 'En Route', 'On Site', 'Completed'];
let _counter = 0;

export const useStore = create(
  persist(
    (set, get) => ({
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

      placeOrder: (vehicle, booking, customer) => {
        const order = {
          id: `HM${Date.now()}_${++_counter}`,
          vehicle,
          booking,
          customer: customer || { name: 'Guest', phone: '' },
          stage: 0,
          stages: ORDER_STAGES,
          operator: null,
          placedAt: new Date().toLocaleTimeString(),
          createdAt: new Date().toISOString(),
          status: 'pending',
          bookingType: booking.bookingType || 'instant',
          rejectedWorkers: [],
          completionImages: [],
        };
        set(s => ({ orders: [order, ...s.orders], activeOrder: order }));
        return order;
      },

      assignWorker: (orderId, worker) => {
        set(s => {
          const updated = s.orders.map(o =>
            o.id === orderId
              ? { ...o, operator: worker, stage: 1, status: 'assigned' }
              : o
          );
          const updatedOrder = updated.find(o => o.id === orderId);
          return {
            orders: updated,
            activeOrder: s.activeOrder?.id === orderId ? updatedOrder : s.activeOrder,
          };
        });
      },

      rejectOrder: (orderId, workerId) => {
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
            o.id === orderId
              ? { ...o, completionImages: images }
              : o
          );
          const updatedOrder = updated.find(o => o.id === orderId);
          return {
            orders: updated,
            activeOrder: s.activeOrder?.id === orderId ? updatedOrder : s.activeOrder,
          };
        });
      },

      advanceStage: (orderId) => {
        set(s => {
          const updated = s.orders.map(o => {
            if (o.id !== orderId) return o;
            const newStage = Math.min(o.stage + 1, ORDER_STAGES.length - 1);
            return {
              ...o,
              stage: newStage,
              status: newStage === ORDER_STAGES.length - 1 ? 'completed' : 'active',
            };
          });
          const updatedOrder = updated.find(o => o.id === orderId);
          return {
            orders: updated,
            activeOrder: s.activeOrder?.id === orderId ? updatedOrder : s.activeOrder,
          };
        });
      },

      cancelOrder: (orderId) => {
        set(s => ({
          orders: s.orders.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o),
          activeOrder: s.activeOrder?.id === orderId ? null : s.activeOrder,
        }));
      },

      setActiveOrder: (order) => set({ activeOrder: order }),
      clearActiveOrder: () => set({ activeOrder: null }),

      getOrdersByCustomer: (customerId) => get().orders.filter(o => o.customer?.id === customerId),
      getOrdersByWorker: (workerId) => get().orders.filter(o => o.operator?.id === workerId),
      getPendingOrders: () => get().orders.filter(o => o.status === 'pending'),
    }),
    { name: 'easybooking-orders' }
  )
);
