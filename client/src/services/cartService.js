// NexORA — Cart Service
import api from './api';

export const cartService = {
  getCart: () => api.get('/cart'),
  addItem: (productId, quantity, size = '') => api.post('/cart/add', { productId, quantity, size }),
  updateItem: (productId, quantity, size = '') => api.put('/cart/update', { productId, quantity, size }),
  removeItem: (productId) => api.delete(`/cart/remove/${productId}`),
  clearCart: () => api.delete('/cart/clear'),
};
