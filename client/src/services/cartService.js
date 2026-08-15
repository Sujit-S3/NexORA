// NexORA — Cart Service
import api from './api';

export const cartService = {
  getCart: () => api.get('/cart'),
  addItem: (productId, quantity, size = '', color = '') => api.post('/cart/add', { productId, quantity, size, color }),
  updateItem: (productId, quantity, size = '', color = '') => api.put('/cart/update', { productId, quantity, size, color }),
  removeItem: (productId, size = '', color = '', cartItemId = '') => api.delete(`/cart/remove/${productId}`, {
    params: { size, color, ...(cartItemId ? { cartItemId } : {}) },
  }),
  clearCart: () => api.delete('/cart/clear'),
};
