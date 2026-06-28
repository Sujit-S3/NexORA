const featureFlags = require('../../../config/featureFlags');

class AIExperiments {
  constructor() {
    this.experiments = {
      'ranking_formula_test': {
        enabled: featureFlags.experimentsEnabled,
        variants: ['A', 'B'],
        // A: 40 brand / 20 cat / 15 price
        // B: 35 brand / 25 cat / 20 price
      },
    };
  }

  /**
   * Deterministically assigns a user/session to an A/B test variant.
   * Simple hash of userId or sessionId.
   */
  getVariant(experimentId, sessionId = 'default') {
    const experiment = this.experiments[experimentId];
    if (!experiment || !experiment.enabled) {return 'A';} // Default to control

    // Simple ASCII sum modulo length to assign variant
    let hash = 0;
    for (let i = 0; i < sessionId.length; i++) {
      hash += sessionId.charCodeAt(i);
    }
    const index = hash % experiment.variants.length;
    return experiment.variants[index];
  }

  /**
   * Adjusts the ranking weights dynamically based on the assigned variant.
   */
  getRankingWeights(sessionId) {
    const variant = this.getVariant('ranking_formula_test', sessionId);
    if (variant === 'B') {
      return { brand: 35, category: 25, price: 20 };
    }
    // Variant A (Control)
    return { brand: 40, category: 20, price: 15 };
  }
}

module.exports = new AIExperiments();
