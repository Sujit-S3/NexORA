const UserPreference = require('../../../models/UserPreference');
const { eventBus, EVENTS } = require('../../ai/utils/eventBus');

class BudgetIntelligence {
  constructor() {
    this.subscribeToEvents();
  }

  subscribeToEvents() {
    eventBus.on(EVENTS.VIEW_PRODUCT, async (payload) => {
      if (payload.product && payload.product.price) {
        await this.updateObservedBudget(payload.customerId, payload.sessionId, payload.product.price);
      }
    });

    eventBus.on(EVENTS.ORDER_COMPLETED, async (payload) => {
      // Find the max item price in the order
      const maxPrice = Math.max(...(payload.items || []).map(i => i.product.price || 0));
      if (maxPrice > 0) {
        await this.updateMaxPurchase(payload.customerId, payload.sessionId, maxPrice);
      }
    });
  }

  async updateObservedBudget(userId, sessionId, price) {
    const query = userId ? { userId } : { sessionId };
    const prefs = await UserPreference.findOne(query);
    if (!prefs) {return;}

    const currentAvg = prefs.budgets.observedAvg || 0;
    // Exponential moving average for recent budget
    prefs.budgets.observedAvg = currentAvg === 0 ? price : (currentAvg * 0.8) + (price * 0.2);
    this.recalculateComfortRange(prefs);
    
    await prefs.save();
  }

  async updateMaxPurchase(userId, sessionId, price) {
    const query = userId ? { userId } : { sessionId };
    const prefs = await UserPreference.findOne(query);
    if (!prefs) {return;}

    const currentMax = prefs.budgets.maxPurchase || 0;
    if (price > currentMax) {
      prefs.budgets.maxPurchase = price;
      this.recalculateComfortRange(prefs);
      await prefs.save();
    }
  }

  recalculateComfortRange(prefs) {
    const declared = prefs.budgets.declared;
    const observed = prefs.budgets.observedAvg;
    const max = prefs.budgets.maxPurchase;

    // Comfort range heuristic
    // If they declared a budget, that anchors the max tightly
    // If not, their observed browsing average forms the baseline, stretched by max purchase
    let min = 0;
    let comfortMax = 0;

    if (declared) {
      min = declared * 0.5; // Will consider items 50% cheaper
      comfortMax = declared * 1.1; // 10% stretch above declared
    } else if (observed) {
      min = observed * 0.6;
      comfortMax = Math.max(observed * 1.3, max || 0); // Stretch observed, or use historical max
    }

    prefs.budgets.comfortRange = { min, max: comfortMax };
  }

  /**
   * Returns the user's active comfort range to feed into AI Context.
   */
  async getComfortRange(userId, sessionId) {
    const query = userId ? { userId } : { sessionId };
    const prefs = await UserPreference.findOne(query).lean();
    if (!prefs || !prefs.budgets || !prefs.budgets.comfortRange) {
      return { min: 0, max: null };
    }
    return prefs.budgets.comfortRange;
  }
}

module.exports = new BudgetIntelligence();
