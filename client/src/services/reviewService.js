// NexORA — Review Service
import api from './api';

export const reviewService = {
  getProductReviews: (productId) => api.get(`/reviews/product/${productId}`),
  addReview: (productId, reviewData) => api.post(`/reviews/product/${productId}`, reviewData),
  editReview: (reviewId, reviewData) => api.put(`/reviews/${reviewId}`, reviewData),
  deleteReview: (reviewId) => api.delete(`/reviews/${reviewId}`),
};
