// NexORA V13 — Client AI Service
import axios from 'axios';
import { getSessionId } from '../hooks/usePreferenceTracking';

const API_URL = '/api/ai';

const getAuthHeaders = () => {
  const token         = localStorage.getItem('nexora_token');
  const sessionId     = getSessionId();
  const conversationId= localStorage.getItem('nexora_conversation_id') || sessionId;
  return {
    'Content-Type':       'application/json',
    'x-session-id':       sessionId,
    'x-conversation-id':  conversationId,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const aiService = {
  // ── Health ──────────────────────────────────────────────────────────────
  checkHealth: async () => axios.get(`${API_URL}/health`),

  // ── Intent Extraction ───────────────────────────────────────────────────
  extractIntent: async (message, memory = {}) =>
    axios.post(`${API_URL}/intent`, { message, memory }, { headers: getAuthHeaders() }),

  // ── Chat Stream (SSE) ────────────────────────────────────────────────────
  // V13: passes memory so pipeline accumulates filters; supports AbortController signal
  chatStream: async (message, history, memory, cartItems = [], wishlistIds = [], signal = null) => {
    const headers = getAuthHeaders();
    return fetch(`${API_URL}/chat`, {
      method:  'POST',
      headers,
      body: JSON.stringify({ message, history, memory, cartItems, wishlistIds }),
      signal,
    });
  },

  // ── Compare Products ─────────────────────────────────────────────────────
  compareProducts: async (productIds) =>
    axios.post(`${API_URL}/compare`, { productIds }, { headers: getAuthHeaders() }),

  // ── Checkout Suggestions ─────────────────────────────────────────────────
  getCheckoutSuggestions: async (cartProductIds) =>
    axios.post(`${API_URL}/checkout-suggest`, { cartProductIds }, { headers: getAuthHeaders() }),

  // ── Post-Purchase Package ────────────────────────────────────────────────
  getPostPurchase: async (orderId) =>
    axios.post(`${API_URL}/post-purchase`, { orderId }, { headers: getAuthHeaders() }),

  // ── Cart Recommendations ─────────────────────────────────────────────────
  getCartRecommendations: async (cartItems) =>
    axios.post(`${API_URL}/cart/recommend`, { cartItems }, { headers: getAuthHeaders() }),

  // ── Admin Tools ──────────────────────────────────────────────────────────
  generateProductMetadata: async (productId) =>
    axios.post(`${API_URL}/product/generate`, { productId }),
  analyzeReviews: async (productId) =>
    axios.post(`${API_URL}/reviews/analyze`, { productId }),
  analyzeSales: async (salesData, query) =>
    axios.post(`${API_URL}/sales/analyze`, { salesData, query }),
  getAnalytics: async () =>
    axios.get(`${API_URL}/analytics`),
  runAdminStudioTool: async (tool, payload = {}) =>
    axios.post(`${API_URL}/admin/studio`, { tool, payload }),

  // ── Memory Export / Forget Me ─────────────────────────────────────────────
  exportMemory: async (format = 'json') =>
    axios.post(`${API_URL}/memory/export`, { format }, { headers: getAuthHeaders(), responseType: 'blob' }),
  forgetMe: async () =>
    axios.post(`${API_URL}/memory/forget`, {}, { headers: getAuthHeaders() }),
};

export default aiService;
