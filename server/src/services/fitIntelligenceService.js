// NexORA V12.2.1 — Fit Intelligence Engine
// Calculates recommended sizes, confidence scores, and fit explanations based on user profile and product templates.

const SizeChart = require('../models/SizeChart');

class FitIntelligenceService {
  
  /**
   * Get fit recommendations for a product based on user preferences.
   * @param {Object} product - The populated product document.
   * @param {Object} userPreference - The user's preference document.
   * @returns {Object} Fit recommendation object.
   */
  async getFitRecommendation(product, userPreference) {
    if (!product || !product.variants || product.variants.length === 0) {
      return null;
    }

    const categorySlug = typeof product.category === 'object' ? product.category?.slug : '';
    const categoryName = typeof product.category === 'object' ? product.category?.name : '';

    const prefSizes = userPreference?.preferredSizes || {};
    const physical = userPreference?.physicalProfile || {};
    
    let recommendedSize = null;
    let confidence = 0;
    const reasoning = [];
    const fitWarnings = [];
    
    // 1. Map product category to preferred size key
    const sizeType = this._determineSizeType(categorySlug || categoryName);
    const explicitPreference = prefSizes[sizeType];

    if (explicitPreference) {
      // Check if explicit preference is available in variants
      const availableVariant = product.variants.find(v => v.size.toLowerCase() === explicitPreference.toLowerCase() && v.stock > 0);
      if (availableVariant) {
        recommendedSize = availableVariant.size;
        confidence += 80;
        reasoning.push(`Matches your preferred ${sizeType} size.`);
      } else {
        fitWarnings.push(`Your preferred size (${explicitPreference}) is out of stock.`);
      }
    }

    // 2. Adjust for Fit Preference (if applicable)
    const fitType = product.fitType; // 'Slim', 'Oversized', etc.
    const userPreferredFit = physical.preferredFit;

    if (fitType && fitType !== 'Regular') {
      if (fitType === 'Slim') {
        fitWarnings.push('⚠ Slim Fit: Runs smaller than usual. Consider sizing up.');
        if (userPreferredFit === 'Relaxed') {confidence -= 20;}
      } else if (fitType === 'Oversized') {
        fitWarnings.push('Oversized Fit: Designed to be loose. Do not size up.');
      }
    }

    // 3. Fallback to physical traits (Mock logic for now, in a real system this would map measurements to the SizeChart)
    if (!recommendedSize && product.variants.length > 0) {
      // If we don't know their size, we try to guess based on height/weight, or just don't recommend one.
      if (physical.heightCm && physical.weightKg) {
        recommendedSize = this._guessSizeFromPhysical(physical.heightCm, physical.weightKg, sizeType);
        const available = product.variants.find(v => v.size === recommendedSize && v.stock > 0);
        if (available) {
          confidence += 50;
          reasoning.push(`Based on your height (${physical.heightCm}cm) and weight (${physical.weightKg}kg).`);
        } else {
          recommendedSize = null;
        }
      }
    }

    // 4. Incorporate past purchase history (Confidence History)
    if (recommendedSize && userPreference?.confidenceHistory) {
      const pastReturns = userPreference.confidenceHistory.filter(h => h.wasReturned && h.actualSelectedSize === recommendedSize);
      if (pastReturns.length > 0) {
        confidence -= 30;
        fitWarnings.push(`You previously returned a ${recommendedSize} in a similar item.`);
      } else {
        const pastKeeps = userPreference.confidenceHistory.filter(h => !h.wasReturned && h.actualSelectedSize === recommendedSize);
        if (pastKeeps.length > 0) {
          confidence += 15;
          reasoning.push('Matches previous purchases you kept.');
        }
      }
    }

    // Cap confidence
    confidence = Math.min(Math.max(confidence, 0), 99);

    if (!recommendedSize) {
      return null;
    }

    return {
      recommendedSize,
      confidence,
      confidenceLevel: confidence >= 80 ? 'High' : confidence >= 50 ? 'Medium' : 'Low',
      reasoning,
      fitWarnings,
      alternatives: product.variants.filter(v => v.size !== recommendedSize && v.stock > 0).map(v => v.size),
    };
  }

  _determineSizeType(categoryText) {
    const text = categoryText.toLowerCase();
    if (text.includes('shirt') || text.includes('top') || text.includes('jacket') || text.includes('hoodie')) {return 'shirt';}
    if (text.includes('pant') || text.includes('jeans') || text.includes('short') || text.includes('trouser')) {return 'bottom';}
    if (text.includes('shoe') || text.includes('sneaker') || text.includes('boot')) {return 'shoe';}
    if (text.includes('ring')) {return 'ring';}
    if (text.includes('hat') || text.includes('cap')) {return 'hat';}
    if (text.includes('watch')) {return 'watch';}
    return 'shirt'; // default fallback
  }

  _guessSizeFromPhysical(height, weight, type) {
    if (type !== 'shirt') {return 'M';} // Simplified generic fallback
    if (height > 185 && weight > 90) {return 'XL';}
    if (height > 180 && weight > 80) {return 'L';}
    if (height > 170 && weight > 70) {return 'M';}
    return 'S';
  }

}

module.exports = new FitIntelligenceService();
