// NexORA — Auth Service
// Full implementation in Phase 2.

import api from './api';

export const authService = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', { 
    ...credentials, 
    guestCart: credentials.guestCart,
    guestWishlist: credentials.guestWishlist 
  }),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
  refreshToken: () => api.post('/auth/refresh'),
};
