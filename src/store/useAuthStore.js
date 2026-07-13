import { create } from 'zustand';
import { API_BASE_URL } from '../config';

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  users: [],
  loading: false,

  login: async (email, password, expectedRole) => {
    set({ loading: true });
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: email, password, expectedRole })
      });
      const data = await response.json();
      set({ loading: false });

      if (!response.ok) {
        return { error: data.message || 'Login failed' };
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      set({ user: data.user });

      // Load all users if logged in as Admin
      if (data.user.role === 'admin') {
        get().fetchWorkers();
      }

      return { success: true, role: data.user.role };
    } catch (err) {
      set({ loading: false });
      return { error: 'Connection error' };
    }
  },

  register: async (data) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const resData = await response.json();
      if (!response.ok) {
        return { error: resData.message || 'Registration failed' };
      }
      return { success: true };
    } catch (err) {
      return { error: 'Connection error' };
    }
  },

  googleLogin: async (token, tokenType = 'credential') => {
    set({ loading: true });
    try {
      const body = tokenType === 'access_token'
        ? { access_token: token }
        : { credential: token };

      const response = await fetch(`${API_BASE_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      set({ loading: false });

      if (!response.ok) {
        return { error: data.message || 'Google login failed' };
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      set({ user: data.user });

      return { success: true, role: data.user.role };
    } catch (err) {
      set({ loading: false });
      return { error: 'Connection error' };
    }
  },

  sendRegisterOtp: async (email, name) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name })
      });
      const data = await response.json();
      if (!response.ok) {
        return { error: data.message || 'Failed to send OTP' };
      }
      return { success: true, message: data.message };
    } catch (err) {
      return { error: 'Connection error' };
    }
  },

  resendRegisterOtp: async (email, name) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name })
      });
      const data = await response.json();
      if (!response.ok) {
        return { error: data.message || 'Failed to resend OTP' };
      }
      return { success: true, message: data.message };
    } catch (err) {
      return { error: 'Connection error' };
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, users: [] });
  },

  fetchWorkers: async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/auth/workers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        set({ users: data });
      }
    } catch (err) {
      console.error('Fetch workers failed:', err);
    }
  },

  approveWorker: async (workerId, approved) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE_URL}/auth/workers/${workerId}/approve`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ approved })
      });
      // Refresh list
      get().fetchWorkers();
    } catch (err) {
      console.error(err);
    }
  },

  updateWorkerProfile: async (workerId, profileData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });
      const updatedUser = await response.json();
      if (response.ok) {
        localStorage.setItem('user', JSON.stringify(updatedUser));
        set({ user: updatedUser });
      }
    } catch (err) {
      console.error(err);
    }
  },

  updateUserProfile: async (userId, profileData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });
      const updatedUser = await response.json();
      if (response.ok) {
        localStorage.setItem('user', JSON.stringify(updatedUser));
        set({ user: updatedUser });
      }
    } catch (err) {
      console.error(err);
    }
  },

  updateWorkerAvailability: async (workerId, availabilityData) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE_URL}/auth/profile/availability`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(availabilityData)
      });
      
      const user = get().user;
      if (user && user.id === workerId) {
        const updated = {
          ...user,
          availability: { ...user.availability, ...availabilityData },
          available: availabilityData.online !== undefined ? availabilityData.online : user.available
        };
        localStorage.setItem('user', JSON.stringify(updated));
        set({ user: updated });
      }
    } catch (err) {
      console.error(err);
    }
  },

  addWorkerEarning: async (workerId, amount, description) => {
    const user = get().user;
    if (!user) return;

    const currentWallet = user.wallet || { balance: 0, transactions: [] };
    const nextBalance = Number(currentWallet.balance || 0) + Number(amount);
    const newTransaction = {
      id: `txn-${Date.now()}`,
      amount: Number(amount),
      description,
      type: amount >= 0 ? 'credit' : 'debit',
      date: new Date().toISOString().split('T')[0]
    };

    const nextWallet = {
      balance: nextBalance,
      transactions: [newTransaction, ...(currentWallet.transactions || [])]
    };

    const updatedUser = { ...user, wallet: nextWallet };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    set({ user: updatedUser });

    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ wallet: nextWallet })
      });
    } catch (err) {
      console.error('Failed to sync wallet to database:', err);
    }
  },

  resetUserPassword: async (userId, newPassword) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE_URL}/auth/workers/${userId}/password`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newPassword })
      });
    } catch (err) {
      console.error(err);
    }
  },

  getWorkers: () => {
    const users = get().users;
    return users.filter(u => u.role === 'worker');
  },

  getCustomers: () => {
    const users = get().users;
    return users.filter(u => u.role === 'customer');
  },

  forgotPassword: async (email) => {
    set({ loading: true });
    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      set({ loading: false });
      if (!response.ok) {
        return { error: data.message || 'Request failed' };
      }
      return { success: true, message: data.message };
    } catch (err) {
      set({ loading: false });
      return { error: 'Connection error' };
    }
  },

  resetPassword: async (email, otp, newPassword) => {
    set({ loading: true });
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword })
      });
      const data = await response.json();
      set({ loading: false });
      if (!response.ok) {
        return { error: data.message || 'Reset failed' };
      }
      return { success: true };
    } catch (err) {
      set({ loading: false });
      return { error: 'Connection error' };
    }
  }
}));
