// NexORA — Discount Service
import api from './api';

export const discountService = {
  getAll: () => api.get('/discounts'),
  create: (data) => api.post('/discounts', data),
  update: (id, data) => api.put(`/discounts/${id}`, data),
  delete: (id) => api.delete(`/discounts/${id}`),
  validate: (code, orderAmount) => api.post('/discounts/validate', { code, orderAmount }),
};
