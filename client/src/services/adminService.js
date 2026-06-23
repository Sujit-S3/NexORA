// NexORA — Admin Service
import api from './api';

export const adminService = {
  getDashboardStats: () => api.get('/admin/dashboard'),
};
