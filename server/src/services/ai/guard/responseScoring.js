class ResponseScoring {
  /**
   * Calculates metadata scores for the final response before sending it to the client.
   * This is part of the AI Governance & Safety layer.
   */
  calculateScore(aiTextResponse, rankedProducts = [], context = {}) {
    let confidence = 100;
    let groundingScore = 100;
    let contextCoverage = 0;
    let policyViolations = 0;

    // 1. Grounding Score
    // If Gemini mentions a product that is NOT in the rankedProducts, it's hallucinating.
    const productNames = rankedProducts.map(p => p.name.toLowerCase());
    const aiTextLower = aiTextResponse.toLowerCase();

    // Very naive check: Count how many times the AI uses words like "Rolex", "Omega"
    // and ensure they exist in the rankedProducts.
    // Real implementation would use NLP or an LLM judge, but this is a deterministic approximation.
    if (rankedProducts.length > 0) {
      let mentioned = 0;
      for (const name of productNames) {
        if (aiTextLower.includes(name)) mentioned++;
      }
      
      // If it mentioned products but none of them matched the ranked ones (hallucination)
      if (mentioned === 0 && (aiTextLower.includes('rolex') || aiTextLower.includes('omega') || aiTextLower.includes('watch'))) {
        groundingScore -= 50; 
      }
    }

    // 2. Policy Violations
    // Check for banned words or inappropriate tone
    const bannedWords = ['discount code', 'free watch', 'hack', 'competitor'];
    for (const word of bannedWords) {
      if (aiTextLower.includes(word)) {
        policyViolations++;
        confidence -= 20;
      }
    }

    // 3. Context Coverage
    // Did it mention the user's budget or preferences if they were set?
    let contextElements = 0;
    let coveredElements = 0;
    
    if (context.preferences?.budget) {
      contextElements++;
      if (aiTextLower.includes('budget') || aiTextLower.includes('$') || aiTextLower.includes('price')) {
        coveredElements++;
      }
    }
    
    if (context.preferences?.brands && context.preferences.brands.length > 0) {
      contextElements++;
      const topBrand = context.preferences.brands[0].toLowerCase();
      if (aiTextLower.includes(topBrand)) {
        coveredElements++;
      }
    }
    
    if (contextElements > 0) {
      contextCoverage = Math.round((coveredElements / contextElements) * 100);
    } else {
      contextCoverage = 100; // N/A
    }

    return {
      confidence: Math.max(confidence, 0),
      groundingScore: Math.max(groundingScore, 0),
      contextCoverage,
      policyViolations,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new ResponseScoring();
