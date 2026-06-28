const UserPreference = require('../../../models/UserPreference');
const { eventBus, EVENTS } = require('../../ai/utils/eventBus');

class StyleProfileEngine {
  constructor() {
    this.subscribeToEvents();
  }

  subscribeToEvents() {
    // Dynamically adjust weights when user interacts with commerce
    eventBus.on(EVENTS.VIEW_PRODUCT, async (payload) => {
      await this.adjustWeights(payload.customerId, payload.sessionId, payload.product, 0.05);
    });

    eventBus.on(EVENTS.ADD_TO_CART, async (payload) => {
      await this.adjustWeights(payload.customerId, payload.sessionId, payload.product, 0.20);
    });

    eventBus.on(EVENTS.ADD_TO_WISHLIST, async (payload) => {
      await this.adjustWeights(payload.customerId, payload.sessionId, payload.product, 0.15);
    });

    eventBus.on(EVENTS.ORDER_COMPLETED, async (payload) => {
      // Strongest signal: Actual purchase
      for (const item of payload.items || []) {
        await this.adjustWeights(payload.customerId, payload.sessionId, item.product, 0.50);
      }
    });
  }

  /**
   * Adjusts the weighted preference for brands and categories based on interaction.
   */
  async adjustWeights(userId, sessionId, productData, weightDelta) {
    if (!productData || !productData.brand) {return;}

    const query = userId ? { userId } : { sessionId };
    let prefs = await UserPreference.findOne(query);

    if (!prefs) {
      prefs = new UserPreference({ userId, sessionId, preferredBrands: {}, preferredCategories: {} });
    }

    // Update Brand Weight
    const currentBrandWeight = prefs.preferredBrands.get(productData.brand) || 0;
    // Cap at 1.0
    prefs.preferredBrands.set(productData.brand, Math.min(currentBrandWeight + weightDelta, 1.0));

    // Decay other brands slightly (simulating shifting taste)
    for (const [brand, weight] of prefs.preferredBrands.entries()) {
      if (brand !== productData.brand) {
        prefs.preferredBrands.set(brand, Math.max(weight - (weightDelta * 0.1), 0));
      }
    }

    // Same for categories if provided
    if (productData.categoryName) {
      const cat = productData.categoryName;
      const currentCatWeight = prefs.preferredCategories.get(cat) || 0;
      prefs.preferredCategories.set(cat, Math.min(currentCatWeight + weightDelta, 1.0));
    }

    await prefs.save();
  }

  /**
   * Retrieves the top 3 preferred brands and categories based on current weights.
   */
  async getTopPreferences(userId, sessionId) {
    const query = userId ? { userId } : { sessionId };
    const prefs = await UserPreference.findOne(query).lean();
    if (!prefs) {return { topBrands: [], topCategories: [] };}

    // Sort Maps by weight descending
    const brands = Object.entries(prefs.preferredBrands || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(entry => entry[0]);

    const categories = Object.entries(prefs.preferredCategories || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(entry => entry[0]);

    return { topBrands: brands, topCategories: categories, allBrands: prefs.preferredBrands };
  }
}

module.exports = new StyleProfileEngine();
