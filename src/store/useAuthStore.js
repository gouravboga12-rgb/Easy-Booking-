import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Seeded demo accounts
const DEMO_USERS = [
  { id: 'a1', email: 'admin@easybooking.in', password: 'admin123', role: 'admin', name: 'Admin User', phone: '+91 98000 00001' },
  { id: 'w1', email: 'ravi@easybooking.in', password: 'worker123', role: 'worker', name: 'Ravi Kumar', phone: '+91 98765 43210', vehicle: 'Electrician • Lic. 09384', rating: 4.8, jobsDone: 142, available: true, approved: true, subscription: { active: true, plan: 'Premium Plan', expiresAt: '2026-12-31' }, availability: { online: true, hours: '09:00 - 18:00', blockedDates: [], vacation: false }, wallet: { balance: 1450, transactions: [{ id: 't1', label: 'Home Wiring Service', date: '2026-06-29', amount: 800, type: 'credit' }] }, reviews: [{ author: 'Aman S.', rating: 5, comment: 'Punctual and very efficient work!', date: '2026-06-28' }], skills: ['Wiring', 'Panel Repair', 'Short Circuit Detection'], categories: ['professionals'], radius: 10, address: 'Marathahalli, Bangalore, KA', pan: 'ABCDE1234F', aadhar: '123456789012', bank: 'Acct: 918273645, IFSC: SBIN0001234' },
  { id: 'w2', email: 'suresh@easybooking.in', password: 'worker123', role: 'worker', name: 'Suresh Reddy', phone: '+91 97654 32109', vehicle: 'Plumber • Lic. 48291', rating: 4.6, jobsDone: 98, available: true, approved: true, subscription: { active: true, plan: '₹99 Monthly', expiresAt: '2026-07-28' }, availability: { online: true, hours: '08:00 - 20:00', blockedDates: [], vacation: false }, wallet: { balance: 350, transactions: [] }, reviews: [{ author: 'Rohit K.', rating: 4, comment: 'Good plumbing service, resolved the issue quickly.', date: '2026-06-27' }], skills: ['Tap repair', 'Pipe leaks', 'Water Tank cleaning'], categories: ['professionals'], radius: 15, address: 'Indiranagar, Bangalore, KA', pan: 'FGHIJ5678K', aadhar: '987654321098', bank: 'Acct: 109283746, IFSC: ICIC0000456' },
  { id: 'w3', email: 'mohan@easybooking.in', password: 'worker123', role: 'worker', name: 'Mohan Das', phone: '+91 96543 21098', vehicle: 'Mason • Exp. 8 Yrs', rating: 4.9, jobsDone: 210, available: false, approved: false, subscription: { active: false, plan: 'none', expiresAt: null }, availability: { online: false, hours: '09:00 - 18:00', blockedDates: [], vacation: false }, wallet: { balance: 0, transactions: [] }, reviews: [], skills: ['Plastering', 'Cement work', 'Brick laying'], categories: ['construction-labour'], radius: 8, address: 'Whitefield, Bangalore, KA', pan: 'LMNOP9012Q', aadhar: '543210987654', bank: 'Acct: 564738291, IFSC: HDFC0000789' },
  { id: 'c1', email: 'customer@easybooking.in', password: 'cust123', role: 'customer', name: 'Arjun Sharma', phone: '+91 95432 10987' },
];

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      users: DEMO_USERS,

      login: (email, password, expectedRole) => {
        const found = get().users.find(u => u.email === email && u.password === password);
        if (!found) return { error: 'Invalid email or password' };
        if (expectedRole && found.role !== expectedRole) {
          return { error: `This page is for ${expectedRole} login only.` };
        }
        if (found.blocked || found.suspended) {
          return { error: 'Your account has been suspended or blocked by the administrator. Contact support.' };
        }
        if (found.role === 'worker' && !found.approved) {
          return { error: 'Your worker registration is pending administrator approval. Please wait for activation.' };
        }
        set({ user: found });
        return { success: true, role: found.role };
      },

      register: (data) => {
        const exists = get().users.find(u => u.email === data.email);
        if (exists) return { error: 'Email already registered' };
        
        let newUser;
        if (data.role === 'worker') {
          newUser = {
            id: `w${Date.now()}`,
            ...data,
            approved: false,
            rating: 5.0,
            jobsDone: 0,
            available: false,
            subscription: { active: false, plan: 'none', expiresAt: null },
            availability: { online: false, hours: '09:00 - 18:00', blockedDates: [], vacation: false },
            wallet: { balance: 0, transactions: [] },
            reviews: [],
          };
        } else {
          newUser = { id: `c${Date.now()}`, ...data };
        }

        set(s => ({ users: [...s.users, newUser] }));
        return { success: true };
      },

      logout: () => set({ user: null }),

      approveWorker: (workerId, approved) => {
        set(s => {
          const updatedUsers = s.users.map(u => u.id === workerId ? { ...u, approved } : u);
          const updatedUser = s.user?.id === workerId ? { ...s.user, approved } : s.user;
          return { users: updatedUsers, user: updatedUser };
        });
      },

      updateWorkerProfile: (workerId, profileData) => {
        set(s => {
          const updatedUsers = s.users.map(u => u.id === workerId ? { ...u, ...profileData } : u);
          const updatedUser = s.user?.id === workerId ? { ...s.user, ...profileData } : s.user;
          return { users: updatedUsers, user: updatedUser };
        });
      },

      buySubscription: (workerId, planName, durationMonths) => {
        const expiry = new Date();
        expiry.setMonth(expiry.getMonth() + durationMonths);
        const sub = {
          active: true,
          plan: planName,
          expiresAt: expiry.toISOString().split('T')[0]
        };
        set(s => {
          const updatedUsers = s.users.map(u => u.id === workerId ? { ...u, subscription: sub } : u);
          const updatedUser = s.user?.id === workerId ? { ...s.user, subscription: sub } : s.user;
          return { users: updatedUsers, user: updatedUser };
        });
      },

      updateWorkerAvailability: (workerId, availabilityData) => {
        set(s => {
          const updatedUsers = s.users.map(u => {
            if (u.id !== workerId) return u;
            const newAvailability = { ...u.availability, ...availabilityData };
            const onlineStatus = availabilityData.online !== undefined ? availabilityData.online : u.available;
            return { ...u, availability: newAvailability, available: onlineStatus };
          });
          const updatedUser = s.user?.id === workerId ? {
            ...s.user,
            availability: { ...s.user.availability, ...availabilityData },
            available: availabilityData.online !== undefined ? availabilityData.online : s.user.available
          } : s.user;
          return { users: updatedUsers, user: updatedUser };
        });
      },

      addWorkerReview: (workerId, review) => {
        set(s => {
          const updatedUsers = s.users.map(u => {
            if (u.id !== workerId) return u;
            const newReviews = [...(u.reviews || []), review];
            const avgRating = Math.round((newReviews.reduce((sum, r) => sum + r.rating, 0) / newReviews.length) * 10) / 10;
            return { ...u, reviews: newReviews, rating: avgRating, jobsDone: u.jobsDone + 1 };
          });
          const updatedUser = s.user?.id === workerId ? {
            ...s.user,
            reviews: [...(s.user.reviews || []), review],
            rating: Math.round((([...(s.user.reviews || []), review]).reduce((sum, r) => sum + r.rating, 0) / (([...(s.user.reviews || []), review]).length)) * 10) / 10,
            jobsDone: s.user.jobsDone + 1
          } : s.user;
          return { users: updatedUsers, user: updatedUser };
        });
      },

      addWorkerEarning: (workerId, amount, txnLabel) => {
        set(s => {
          const updatedUsers = s.users.map(u => {
            if (u.id !== workerId) return u;
            const wallet = u.wallet || { balance: 0, transactions: [] };
            const newTxn = { id: `txn-${Date.now()}`, label: txnLabel, date: new Date().toLocaleDateString(), amount, type: 'credit' };
            return { ...u, wallet: { balance: wallet.balance + amount, transactions: [newTxn, ...wallet.transactions] } };
          });
          const updatedUser = s.user?.id === workerId ? {
            ...s.user,
            wallet: {
              balance: (s.user.wallet?.balance || 0) + amount,
              transactions: [
                { id: `txn-${Date.now()}`, label: txnLabel, date: new Date().toLocaleDateString(), amount, type: 'credit' },
                ...(s.user.wallet?.transactions || [])
              ]
            }
          } : s.user;
          return { users: updatedUsers, user: updatedUser };
        });
      },

      toggleBlockUser: (userId) => {
        set(s => {
          const updated = s.users.map(u => u.id === userId ? { ...u, blocked: !u.blocked } : u);
          return { users: updated };
        });
      },

      deleteUser: (userId) => {
        set(s => ({ users: s.users.filter(u => u.id !== userId) }));
      },

      resetUserPassword: (userId, newPassword) => {
        set(s => ({
          users: s.users.map(u => u.id === userId ? { ...u, password: newPassword } : u)
        }));
      },

      getWorkers: () => get().users.filter(u => u.role === 'worker'),
      getCustomers: () => get().users.filter(u => u.role === 'customer'),
    }),
    { name: 'easybooking-auth' }
  )
);
