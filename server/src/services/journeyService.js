const JourneyState = require('../models/JourneyState');
const { eventBus, EVENTS } = require('./ai/eventBus');

class JourneyService {
  constructor() {
    this.setupListeners();
  }

  setupListeners() {
    eventBus.on(EVENTS.VIEW_PRODUCT, this.handleViewProduct.bind(this));
    eventBus.on(EVENTS.COMPARE_PRODUCTS, this.handleCompareProducts.bind(this));
    eventBus.on(EVENTS.ADD_TO_WISHLIST, this.handleWishlist.bind(this));
    eventBus.on(EVENTS.ADD_TO_CART, this.handleCart.bind(this));
    eventBus.on(EVENTS.BEGIN_CHECKOUT, this.handleCheckout.bind(this));
    eventBus.on(EVENTS.PURCHASE_COMPLETED, this.handlePurchase.bind(this));
    eventBus.on(EVENTS.RETURN_VISIT, this.handleReturnVisit.bind(this));
  }

  async updateStage(userId, sessionId, newStage) {
    const query = userId ? { userId } : { sessionId };
    if (!userId && !sessionId) return null;

    try {
      const state = await JourneyState.findOneAndUpdate(
        query,
        { stage: newStage, lastUpdated: new Date() },
        { upsert: true, new: true }
      );
      return state.stage;
    } catch (err) {
      console.error('[JourneyService] Error updating stage:', err);
      return null;
    }
  }

  async getStage(userId, sessionId) {
    const query = userId ? { userId } : { sessionId };
    if (!userId && !sessionId) return 'browsing';
    
    const state = await JourneyState.findOne(query);
    return state ? state.stage : 'browsing';
  }

  async handleViewProduct({ userId, sessionId }) {
    await this.updateStage(userId, sessionId, 'viewed');
  }

  async handleCompareProducts({ userId, sessionId }) {
    await this.updateStage(userId, sessionId, 'compared');
  }

  async handleWishlist({ userId, sessionId }) {
    await this.updateStage(userId, sessionId, 'wishlist');
  }

  async handleCart({ userId, sessionId }) {
    await this.updateStage(userId, sessionId, 'cart');
  }

  async handleCheckout({ userId, sessionId }) {
    await this.updateStage(userId, sessionId, 'checkout');
  }

  async handlePurchase({ userId, sessionId }) {
    await this.updateStage(userId, sessionId, 'purchased');
  }

  async handleReturnVisit({ userId, sessionId }) {
    // If they have purchased in the past, maybe they are in aftercare.
    // For simplicity, we just set to browsing, or check if they have a purchase history.
    const state = await this.getStage(userId, sessionId);
    if (state === 'purchased') {
      await this.updateStage(userId, sessionId, 'aftercare');
    }
  }
}

module.exports = new JourneyService();
