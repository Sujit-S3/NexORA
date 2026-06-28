const experiments = require('./experiments');

class RankingService {
  /**
   * Deterministically scores and ranks products based on user context.
   * Utilizes A/B testing framework to adjust weights dynamically.
   */
  rankProducts(products, context = {}) {
    const { preferredBrands = [], preferredCategories = [], budget, wishlist = [], cart = [], sessionId = 'default' } = context;
    
    // Fetch dynamic weights from Experiment Framework
    const weights = experiments.getRankingWeights(sessionId);

    const scoredProducts = products.map(product => {
      const scoreBreakdown = {
        brandMatch: 0,
        categoryMatch: 0,
        budgetMatch: 0,
        historyMatch: 0,
        trendBonus: 0,
      };

      // Brand Match (Dynamic Weight)
      if (preferredBrands.some(b => new RegExp(b, 'i').test(product.brand))) {
        scoreBreakdown.brandMatch += weights.brand;
      }

      // Category Match (Dynamic Weight)
      if (product.category && preferredCategories.some(c => new RegExp(c, 'i').test(product.category.name))) {
        scoreBreakdown.categoryMatch += weights.category;
      }

      // Budget Proximity (Dynamic Weight)
      const currentPrice = product.discountPrice || product.price;
      if (budget) {
        if (currentPrice <= budget) {
          scoreBreakdown.budgetMatch += weights.price;
        } else if (currentPrice <= budget * 1.2) {
          scoreBreakdown.budgetMatch += weights.price / 2;
        }
      } else {
        scoreBreakdown.budgetMatch += weights.price / 2;
      }

      // User History (20 points)
      const productIdStr = product._id.toString();
      if (wishlist.some(id => id.toString() === productIdStr)) {scoreBreakdown.historyMatch += 10;}
      if (cart.some(item => item.product.toString() === productIdStr)) {scoreBreakdown.historyMatch += 10;}

      // New Arrival / Best Seller bonuses
      if (product.isNewArrival) {scoreBreakdown.trendBonus += 5;}
      if (product.isBestSeller) {scoreBreakdown.trendBonus += 5;}

      const totalScore = Math.min(
        scoreBreakdown.brandMatch + 
        scoreBreakdown.categoryMatch + 
        scoreBreakdown.budgetMatch + 
        scoreBreakdown.historyMatch + 
        scoreBreakdown.trendBonus, 
        100,
      );

      return {
        ...product,
        matchScore: totalScore,
        explainability: scoreBreakdown,
      };
    });

    // Sort descending by match score
    scoredProducts.sort((a, b) => b.matchScore - a.matchScore);

    // Apply Recommendation Diversity
    // If the top 4 products are all the same brand, push one down to introduce diversity
    const diverseRanking = [];
    const brandCounts = {};
    
    for (const product of scoredProducts) {
      const brand = product.brand;
      brandCounts[brand] = (brandCounts[brand] || 0) + 1;
      
      // Limit to max 2 items of the same brand in the top results if possible
      if (brandCounts[brand] <= 2) {
        diverseRanking.push(product);
      }
    }

    // Re-append the de-prioritized items (those that exceeded the brand limit)
    for (const product of scoredProducts) {
      if (!diverseRanking.includes(product)) {
        diverseRanking.push(product);
      }
    }

    return diverseRanking;
  }
}

module.exports = new RankingService();
