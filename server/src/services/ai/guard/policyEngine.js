class InventoryPolicy {
  enforce(products) {
    return products.filter(p => p.stock > 0 && p.isActive);
  }
}

class BudgetPolicy {
  enforce(products, context) {
    if (!context.strictBudget) return products;
    return products.filter(p => {
      const currentPrice = p.discountPrice || p.price;
      // Allow up to 10% stretch if budget intelligence is enabled, otherwise strict
      const limit = (context.budgetFlexibility) ? context.strictBudget * 1.10 : context.strictBudget;
      return currentPrice <= limit;
    });
  }
}

class SecurityPolicy {
  enforce(products) {
    // Strip out internal IDs or cost prices before sending to the model/frontend
    return products.map(p => {
      const safeProduct = { ...p.toObject ? p.toObject() : p };
      delete safeProduct.costPrice;
      delete safeProduct.vendorId;
      return safeProduct;
    });
  }
}

class ContextLimitPolicy {
  enforce(products) {
    // Limit to 5 products to avoid token bloat and hallucination
    return products.slice(0, 5);
  }
}

class PolicyEngine {
  constructor() {
    this.policies = [
      new InventoryPolicy(),
      new BudgetPolicy(),
      new SecurityPolicy(),
      new ContextLimitPolicy()
    ];
  }

  /**
   * Enforces AI Safety Rules and Commerce Constraints
   * @param {Array} products - Products retrieved from ProductResolver
   * @param {Object} context - User context (budget, etc.)
   * @returns {Array} - Verified, safe products
   */
  enforceRules(products, context = {}) {
    let safeProducts = products;
    for (const policy of this.policies) {
      safeProducts = policy.enforce(safeProducts, context);
    }
    return safeProducts;
  }
}

module.exports = new PolicyEngine();
