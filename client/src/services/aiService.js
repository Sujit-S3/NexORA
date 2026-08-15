// NexORA V13 — Client AI Service
import api, { apiBaseUrl, apiConfigurationError } from './api';
import { getSessionId } from '../hooks/usePreferenceTracking';

// Same base URL the shared `api` instance uses — chatStream needs an absolute
// URL because it streams via fetch()/SSE rather than axios.
const getSessionHeaders = () => {
  const sessionId = getSessionId();
  const conversationId = localStorage.getItem('nexora_conversation_id') || sessionId;
  return {
    'Content-Type': 'application/json',
    'x-session-id': sessionId,
    'x-conversation-id': conversationId,
  };
};

const aiService = {
  // ── Health ──────────────────────────────────────────────────────────────
  checkHealth: async () => api.get('/ai/health'),

  // ── Intent Extraction ───────────────────────────────────────────────────
  extractIntent: async (message, memory = {}) =>
    api.post('/ai/intent', { message, memory }, { headers: getSessionHeaders() }),

  // ── Chat Stream (SSE) ────────────────────────────────────────────────────
  // V13: passes memory so pipeline accumulates filters; supports AbortController signal
  chatStream: async (message, history, memory, cartItems = [], wishlistIds = [], signal = null) => {
    if (apiConfigurationError) {
      throw new Error(`${apiConfigurationError} AI streaming is disabled until it is configured.`);
    }
    const headers = getSessionHeaders();
    const response = await fetch(`${apiBaseUrl}/ai/chat`, {
      method: 'POST',
      headers,
      credentials: 'include', // send the httpOnly auth cookie cross-origin
      body: JSON.stringify({ message, history, memory, cartItems, wishlistIds }),
      signal,
    });
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      throw new Error('The AI endpoint returned the frontend application instead of a stream. Check VITE_API_URL before redeploying.');
    }
    return response;
  },

  // ── Compare Products ─────────────────────────────────────────────────────
  compareProducts: async (productIds) =>
    api.post('/ai/compare', { productIds }, { headers: getSessionHeaders() }),

  // ── Checkout Suggestions ─────────────────────────────────────────────────
  getCheckoutSuggestions: async (cartProductIds) =>
    api.post('/ai/checkout-suggest', { cartProductIds }, { headers: getSessionHeaders() }),

  // ── Post-Purchase Package ────────────────────────────────────────────────
  getPostPurchase: async (orderId) =>
    api.post('/ai/post-purchase', { orderId }, { headers: getSessionHeaders() }),

  // ── Cart Recommendations ─────────────────────────────────────────────────
  getCartRecommendations: async (cartItems) =>
    api.post('/ai/cart/recommend', { cartItems }, { headers: getSessionHeaders() }),

  // ── Admin Tools ──────────────────────────────────────────────────────────
  generateProductMetadata: async (productId) =>
    api.post('/ai/product/generate', { productId }),
  analyzeReviews: async (productId) =>
    api.post('/ai/reviews/analyze', { productId }),
  analyzeSales: async (salesData, query) =>
    api.post('/ai/sales/analyze', { salesData, query }),
  getAnalytics: async () =>
    api.get('/ai/analytics'),
  runAdminStudioTool: async (tool, payload = {}) =>
    api.post('/ai/admin/studio', { tool, payload }),

  // ── Memory Export / Forget Me ─────────────────────────────────────────────
  exportMemory: async (format = 'json') =>
    api.post('/ai/memory/export', { format }, { headers: getSessionHeaders(), responseType: 'blob' }),
  forgetMe: async () =>
    api.post('/ai/memory/forget', {}, { headers: getSessionHeaders() }),
};

export default aiService;
