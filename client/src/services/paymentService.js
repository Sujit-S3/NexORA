// NexORA — Payment Service
import api from './api';

export const paymentService = {
  initiate: (data) => api.post('/payments/initiate', data),
  verify: (data) => api.post('/payments/verify', data),
  getHistory: (params) => api.get('/payments/history', { params }),
  // Admin
  getAll: (params) => api.get('/payments', { params }),
};
