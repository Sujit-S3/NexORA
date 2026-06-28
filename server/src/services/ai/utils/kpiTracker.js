const { eventBus, EVENTS } = require('../utils/eventBus');

class KPITracker {
  constructor() {
    this.metrics = {
      recommendationClicks: 0,
      aiAssistedPurchases: 0,
      aiAssistedRevenue: 0,
      wishlistConversions: 0,
      cartConversions: 0,
      upsellAcceptance: 0,
      crossSellAcceptance: 0,
      aiConversationsCompleted: 0,
    };

    this.subscribeToEvents();
  }

  subscribeToEvents() {
    eventBus.on(EVENTS.CLICK_RECOMMENDATION, (payload) => {
      this.metrics.recommendationClicks++;
    });

    eventBus.on(EVENTS.ORDER_COMPLETED, (payload) => {
      // If the order contained an item recommended by AI
      if (payload.aiAssisted) {
        this.metrics.aiAssistedPurchases++;
        this.metrics.aiAssistedRevenue += payload.totalValue;
      }
    });

    eventBus.on(EVENTS.ADD_TO_CART, (payload) => {
      if (payload.source === 'ai_recommendation') {
        this.metrics.cartConversions++;
      }
    });
    
    eventBus.on(EVENTS.ADD_TO_WISHLIST, (payload) => {
      if (payload.source === 'ai_recommendation') {
        this.metrics.wishlistConversions++;
      }
    });
  }

  getMetrics() {
    return this.metrics;
  }
}

module.exports = new KPITracker();
