// NexORA — Cart Service
import api from './api';

export const cartService = {
  getCart: () => api.get('/cart'),
  addItem: (productId, quantity) => api.post('/cart/add', { productId, quantity }),
  updateItem: (productId, quantity) => api.put('/cart/update', { productId, quantity }),
  removeItem: (productId) => api.delete(`/cart/remove/${productId}`),
  clearCart: () => api.delete('/cart/clear'),
};
