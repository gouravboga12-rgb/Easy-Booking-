import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Seeded demo accounts
const DEMO_USERS = [
  { id: 'a1', email: 'admin@easybooking.in', password: 'admin123', role: 'admin', name: 'Admin User', phone: '+91 98000 00001' },
  { id: 'w1', email: 'ravi@easybooking.in', password: 'worker123', role: 'worker', name: 'Ravi Kumar', phone: '+91 98765 43210', vehicle: 'Electrician • Lic. 09384', rating: 4.8, jobsDone: 142, available: true },
  { id: 'w2', email: 'suresh@easybooking.in', password: 'worker123', role: 'worker', name: 'Suresh Reddy', phone: '+91 97654 32109', vehicle: 'Plumber • Lic. 48291', rating: 4.6, jobsDone: 98, available: true },
  { id: 'w3', email: 'mohan@easybooking.in', password: 'worker123', role: 'worker', name: 'Mohan Das', phone: '+91 96543 21098', vehicle: 'Mason • Exp. 8 Yrs', rating: 4.9, jobsDone: 210, available: false },
  { id: 'c1', email: 'customer@easybooking.in', password: 'cust123', role: 'customer', name: 'Arjun Sharma', phone: '+91 95432 10987' },
];

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      users: DEMO_USERS,

      login: (email, password) => {
        const found = get().users.find(u => u.email === email && u.password === password);
        if (!found) return { error: 'Invalid email or password' };
        set({ user: found });
        return { success: true, role: found.role };
      },

      register: (data) => {
        const exists = get().users.find(u => u.email === data.email);
        if (exists) return { error: 'Email already registered' };
        const newUser = { id: `c${Date.now()}`, ...data };
        set(s => ({ users: [...s.users, newUser] }));
        return { success: true };
      },

      logout: () => set({ user: null }),

      updateWorkerAvailability: (workerId, available) => {
        set(s => ({
          users: s.users.map(u => u.id === workerId ? { ...u, available } : u),
          user: s.user?.id === workerId ? { ...s.user, available } : s.user,
        }));
      },

      getWorkers: () => get().users.filter(u => u.role === 'worker'),
      getCustomers: () => get().users.filter(u => u.role === 'customer'),
    }),
    { name: 'easybooking-auth' }
  )
);
