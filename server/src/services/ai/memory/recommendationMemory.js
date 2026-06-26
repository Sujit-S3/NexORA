const { eventBus, EVENTS } = require('../utils/eventBus');

/**
 * Tracks AI recommendations over a session to ensure 
 * the AI doesn't repeat the exact same product continually.
 */
class RecommendationMemory {
  constructor() {
    // In production, this might be backed by Redis for multi-instance scaling.
    // Map of sessionId -> Map of productId -> status (RECOMMENDED, CLICKED, IGNORED, PURCHASED)
    this.memory = new Map();
    this.subscribeToEvents();
  }

  getSessionMemory(sessionId) {
    if (!this.memory.has(sessionId)) {
      this.memory.set(sessionId, new Map());
    }
    return this.memory.get(sessionId);
  }

  subscribeToEvents() {
    // Track when AI recommends a product
    eventBus.on(EVENTS.VIEW_RECOMMENDATION, (payload) => {
      const mem = this.getSessionMemory(payload.meta.sessionId);
      for (const recId of payload.productIds || []) {
        if (!mem.has(recId)) mem.set(recId, { status: 'RECOMMENDED', count: 1 });
        else {
          const item = mem.get(recId);
          item.count++;
        }
      }
    });

    eventBus.on(EVENTS.CLICK_RECOMMENDATION, (payload) => {
      const mem = this.getSessionMemory(payload.meta.sessionId);
      if (payload.productId) {
        mem.set(payload.productId, { status: 'CLICKED', count: mem.get(payload.productId)?.count || 1 });
      }
    });

    eventBus.on(EVENTS.ORDER_COMPLETED, (payload) => {
      const mem = this.getSessionMemory(payload.meta.sessionId);
      for (const item of payload.items || []) {
        if (mem.has(item.product.toString())) {
          mem.set(item.product.toString(), { status: 'PURCHASED', count: mem.get(item.product.toString()).count });
        }
      }
    });
  }

  /**
   * Filters out products that have been recommended too many times without engagement.
   */
  filterRepeatedRecommendations(products, sessionId) {
    const mem = this.getSessionMemory(sessionId);
    
    return products.filter(product => {
      const id = product._id.toString();
      const state = mem.get(id);
      
      // If it's been purchased in this session, don't recommend it again
      if (state && state.status === 'PURCHASED') return false;

      // If recommended >= 3 times and user never clicked/carted it, ignore it (Recommendation Fatigue)
      if (state && state.status === 'RECOMMENDED' && state.count >= 3) {
        return false;
      }
      
      return true;
    });
  }
}

module.exports = new RecommendationMemory();
