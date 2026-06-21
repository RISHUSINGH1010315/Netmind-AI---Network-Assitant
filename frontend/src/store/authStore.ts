import { create } from 'zustand';
import axios from 'axios';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'Super Admin' | 'Network Engineer' | 'NOC Engineer' | 'Security Analyst' | 'Viewer';
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  setAuth: (token: string, refreshToken: string, user: User) => void;
  clearAuth: () => void;
  initAuth: () => void;
}

// Global Axios configuration
// Uses proxy in development/Docker local hostnames; defaults to localhost:5000 when deployed on static servers like GitHub Pages
axios.defaults.baseURL = import.meta.env.VITE_API_URL || (
  typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? ''
    : 'http://localhost:5000'
);

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  refreshToken: null,
  user: null,

  setAuth: (token, refreshToken, user) => {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('userData', JSON.stringify(user));
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    set({ token, refreshToken, user });
  },

  clearAuth: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userData');
    delete axios.defaults.headers.common['Authorization'];
    set({ token: null, refreshToken: null, user: null });
  },

  initAuth: () => {
    const token = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    const userData = localStorage.getItem('userData');

    if (token && refreshToken && userData) {
      const user = JSON.parse(userData);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      set({ token, refreshToken, user });
    }
  }
}));

// Setup automatic Token Refresh interceptor
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 403 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refToken = localStorage.getItem('refreshToken');
      if (refToken) {
        try {
          const res = await axios.post('/api/auth/refresh', { token: refToken });
          const newAccessToken = res.data.accessToken;
          localStorage.setItem('accessToken', newAccessToken);
          axios.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
          return axios(originalRequest);
        } catch (refreshErr) {
          // Token expired or invalid
          useAuthStore.getState().clearAuth();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);
