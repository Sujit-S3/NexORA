// NexORA V13 — Response Formatter
const crypto = require('crypto');

class ResponseFormatter {
  constructor() {
    this.version  = 'V13.0.0';
    this.pipeline = 'luxury-commerce-os';
  }

  generateRecId() {
    return 'REC_' + crypto.randomBytes(4).toString('hex').toUpperCase();
  }

  /** Initial deterministic products payload */
  serializeProducts(products, intent, startTime) {
    return JSON.stringify({
      version:  this.version,
      pipeline: this.pipeline,
      intent,
      recId:    this.generateRecId(),
      latency:  Date.now() - startTime,
      products,
    });
  }

  /** Text chunk from Gemini stream */
  serializeStreamChunk(text) {
    return JSON.stringify({ text });
  }

  /**
   * Luxury streaming status message (shown in status ticker before products)
   * @param {string} text — e.g. "Searching verified inventory..."
   * @param {number} step — 1-5 for progress bar
   */
  serializeStatus(text, step = 1) {
    return JSON.stringify({ type: 'status', text, step });
  }

  /**
   * Machine-executable action frame for the client to act on.
   * @param {string} action  — 'ADD_TO_CART' | 'NAVIGATE' | 'WISHLIST' | 'COMPARE' | 'SHOW_PRODUCT'
   * @param {Object} payload — action-specific data
   */
  serializeAction(action, payload = {}) {
    return JSON.stringify({ type: 'action', action, ...payload });
  }

  /** Recommendation session metadata (goal, products found, reasons) */
  serializeSession(goal, productsFound, appliedFilters) {
    return JSON.stringify({
      type:           'session',
      goal,
      productsFound,
      appliedFilters,
    });
  }

  /** Error or guard intervention */
  serializeError(message) {
    return JSON.stringify({ error: true, text: message });
  }
}

module.exports = new ResponseFormatter();
