const crypto = require('crypto');

class AICache {
  constructor() {
    this.cache = new Map();
    // In a real production system, this would be backed by Redis.
    // CATALOG_VERSION is updated whenever inventory, prices, or products change.
    this.CATALOG_VERSION = process.env.CATALOG_VERSION || 1; 
  }

  /**
   * Generates a deterministic hash for the user's specific context.
   */
  generateContextHash(context) {
    const contextString = JSON.stringify({
      cart: context.cart || [],
      wishlist: context.wishlist || [],
      preferences: context.preferences || {},
    });
    return crypto.createHash('sha256').update(contextString).digest('hex');
  }

  /**
   * Generates the cache key.
   * Format: {Intent}_{JourneyStage}_{ContextHash}_{CatalogVersion}
   */
  generateKey(intent, journeyStage, context) {
    const contextHash = this.generateContextHash(context);
    return `${intent}_${journeyStage || 'unknown'}_${contextHash}_V${this.CATALOG_VERSION}`;
  }

  get(key) {
    return this.cache.get(key) || null;
  }

  set(key, data, ttlSeconds = 3600) {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + (ttlSeconds * 1000),
    });
  }

  incrementCatalogVersion() {
    this.CATALOG_VERSION += 1;
    // Optionally clear old cache keys, or let them expire via TTL
    this.cache.clear();
  }
}

module.exports = new AICache();
