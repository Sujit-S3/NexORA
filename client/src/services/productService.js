// NexORA — Product Service
import api from './api';

export const productService = {
  getAll: (params) => api.get('/products', { params }),
  getFeatured: () => api.get('/products/featured'),
  getBySlug: (slug) => api.get(`/products/${slug}`),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  uploadImages: (id, formData) =>
    api.post(`/products/${id}/images`, formData, {
      // Let the browser add the multipart boundary. Supplying Content-Type
      // manually can produce an unreadable body in some Axios/browser builds.
    }),
  deleteImage: (id, publicId) =>
    api.delete(`/products/${id}/images`, { data: { publicId } }),
};
