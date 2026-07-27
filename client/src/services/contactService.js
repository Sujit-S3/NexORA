// NexORA — Contact Service
import api from './api';

export const contactService = {
  submit: (data) => api.post('/contact', data),
};
