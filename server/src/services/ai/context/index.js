const cartContext = require('./cartContext');
const wishlistContext = require('./wishlistContext');
const orderContext = require('./orderContext');
const preferenceContext = require('./preferenceContext');

class ContextBuilder {
  /**
   * Helper to roughly estimate tokens (1 token ≈ 4 chars)
   */
  estimateTokens(obj) {
    if (!obj) {return 0;}
    return Math.ceil(JSON.stringify(obj).length / 4);
  }

  /**
   * Enforces a token budget across the context
   */
  applyTokenBudget(context) {
    const MAX_TOKENS = 1500;
    let totalTokens = 0;
    
    totalTokens += this.estimateTokens(context.cart);
    totalTokens += this.estimateTokens(context.wishlist);
    totalTokens += this.estimateTokens(context.orders);
    totalTokens += this.estimateTokens(context.preferences);

    if (totalTokens > MAX_TOKENS) {
      console.warn(`Context exceeds ${MAX_TOKENS} tokens. Summarizing.`);
      // If over budget, summarize the heaviest elements
      if (context.orders && context.orders.length > 1) {
        context.orders = [context.orders[0]]; // Only keep the most recent order
      }
      if (context.wishlist && context.wishlist.length > 5) {
        context.wishlist = context.wishlist.slice(0, 5); // Trim wishlist
      }
    }
    return context;
  }

  /**
   * Assembles a rich commerce context for the Prompt Builder.
   * Only gathers the necessary contexts based on intent needs to save processing/latency.
   * 
   * @param {Object} user - Authenticated user object
   * @param {Object} detectedIntent - Output from IntentDetectorService
   * @returns {Object} Rich commerce context
   */
  async buildContext(user, detectedIntent) {
    const context = {
      user: null,
      cart: null,
      wishlist: null,
      orders: null,
      preferences: null,
      intent: detectedIntent.intent,
      entities: detectedIntent.entities,
    };

    if (user) {
      const userId = user._id;
      context.user = { name: user.name, email: user.email };

      // Depending on the intent, we selectively pull context
      const promises = [];

      // Always pull preferences if available to respect budget/style
      promises.push(
        preferenceContext.build(userId).then(res => { context.preferences = res; }),
      );

      if (['checkout-assistance', 'gift-finder', 'comparison', 'luxury-advisor'].includes(detectedIntent.intent)) {
        promises.push(cartContext.build(userId).then(res => { context.cart = res; }));
        promises.push(wishlistContext.build(userId).then(res => { context.wishlist = res; }));
      }

      if (['order-status', 'luxury-advisor'].includes(detectedIntent.intent)) {
        promises.push(orderContext.build(userId).then(res => { context.orders = res; }));
      }

      await Promise.all(promises);
    }

    // Ensure we don't blow the context window
    return this.applyTokenBudget(context);
  }
}

module.exports = new ContextBuilder();
