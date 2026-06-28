class ExplanationService {
  /**
   * Prepares the deterministically ranked products with their match scores
   * and machine-readable reasons to be consumed by the frontend.
   * Gemini will separately generate the conversational explanation in parallel.
   */
  formatExplanations(rankedProducts) {
    return rankedProducts.map(product => {
      // Create detailed breakdown based on the ranking score
      const breakdown = [];
      const exp = product.explainability || {};
      
      if (exp.brandMatch > 0) {breakdown.push({ factor: 'Brand Match', score: exp.brandMatch });}
      if (exp.categoryMatch > 0) {breakdown.push({ factor: 'Style Match', score: exp.categoryMatch });}
      if (exp.budgetMatch > 0) {breakdown.push({ factor: 'Budget', score: exp.budgetMatch });}
      if (exp.historyMatch > 0) {breakdown.push({ factor: 'History/Wishlist', score: exp.historyMatch });}
      if (exp.trendBonus > 0) {breakdown.push({ factor: 'Trend', score: exp.trendBonus });}

      // Sort breakdown by highest score first to show the most relevant reasons
      breakdown.sort((a, b) => b.score - a.score);

      return {
        ...product, // Send the full product object
        match: product.matchScore,
        explainability: breakdown,
      };
    });
  }
}

module.exports = new ExplanationService();
