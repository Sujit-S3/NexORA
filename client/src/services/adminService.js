// NexORA — Admin Service
import api from './api';

export const adminService = {
  getDashboardStats: () => api.get('/admin/dashboard'),
  getPreferenceAnalytics: () => api.get('/preferences/analytics'),
  seedDatabase: () => api.post('/admin/seed'),
};
