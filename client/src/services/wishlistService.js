import api from './api';

export const wishlistService = {
  getWishlist: () => api.get('/wishlist'),
  addToWishlist: (productId, size = '', color = '') => api.post('/wishlist/add', { productId, size, color }),
  removeFromWishlist: (productId) => api.delete(`/wishlist/${productId}`),
  clearWishlist: () => api.delete('/wishlist'),
};
