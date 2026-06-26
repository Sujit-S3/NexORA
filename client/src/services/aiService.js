// NexORA V10 — Client AI Service
import axios from 'axios';
import { getSessionId } from '../hooks/usePreferenceTracking';

const API_URL = '/api/ai';

const getAuthHeaders = () => {
  const token = localStorage.getItem('nexora_token');
  return {
    'Content-Type': 'application/json',
    'x-session-id': getSessionId(),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const aiService = {
  // ── Health ──────────────────────────────────────────────────────────────
  checkHealth: async () => {
    return axios.get(`${API_URL}/health`);
  },

  // ── Intent Extraction ───────────────────────────────────────────────────
  extractIntent: async (message, memory = {}) => {
    return axios.post(`${API_URL}/intent`, { message, memory }, { headers: getAuthHeaders() });
  },

  // ── Chat Stream (SSE) ───────────────────────────────────────────────────────────────────
  // V10: sends cartItems + wishlistIds for intent-aware context retrieval
  chatStream: async (message, history, memory, cartItems = [], wishlistIds = []) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);
    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ message, history, memory, cartItems, wishlistIds }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return response;
    } catch (err) {
      clearTimeout(timeout);
      throw err;
    }
  },

  // ── Compare Products ─────────────────────────────────────────────────────
  compareProducts: async (productIds) => {
    return axios.post(`${API_URL}/compare`, { productIds }, { headers: getAuthHeaders() });
  },

  // ── Checkout Suggestions ─────────────────────────────────────────────────
  getCheckoutSuggestions: async (cartProductIds) => {
    return axios.post(`${API_URL}/checkout-suggest`, { cartProductIds }, { headers: getAuthHeaders() });
  },

  // ── Post-Purchase Package ────────────────────────────────────────────────
  getPostPurchase: async (orderId) => {
    return axios.post(`${API_URL}/post-purchase`, { orderId }, { headers: getAuthHeaders() });
  },

  // ── Cart Recommendations ─────────────────────────────────────────────────
  getCartRecommendations: async (cartItems) => {
    return axios.post(`${API_URL}/cart/recommend`, { cartItems }, { headers: getAuthHeaders() });
  },

  // ── Admin: SEO Generator ─────────────────────────────────────────────────
  generateProductMetadata: async (productId) => {
    return axios.post(`${API_URL}/product/generate`, { productId });
  },

  // ── Admin: Review Analyzer ───────────────────────────────────────────────
  analyzeReviews: async (productId) => {
    return axios.post(`${API_URL}/reviews/analyze`, { productId });
  },

  // ── Admin: Sales Analyst ─────────────────────────────────────────────────
  analyzeSales: async (salesData, query) => {
    return axios.post(`${API_URL}/sales/analyze`, { salesData, query });
  },

  // ── Admin: Analytics Dashboard ───────────────────────────────────────────
  getAnalytics: async () => {
    return axios.get(`${API_URL}/analytics`);
  },

  // ── Admin: AI Studio (Unified) ───────────────────────────────────────────────
  runAdminStudioTool: async (tool, payload = {}) => {
    return axios.post(`${API_URL}/admin/studio`, { tool, payload });
  },

  // ── Memory Export / Forget Me (V10) ─────────────────────────────────────────
  exportMemory: async (format = 'json') => {
    return axios.post(`${API_URL}/memory/export`, { format }, { headers: getAuthHeaders(), responseType: 'blob' });
  },

  forgetMe: async () => {
    return axios.post(`${API_URL}/memory/forget`, {}, { headers: getAuthHeaders() });
  }
};

export default aiService;
