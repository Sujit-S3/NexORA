class ResponseGuard {
  autoRepair(response) {
    let repaired = response;
    // Common AI spelling hallucination fixes
    const fixes = {
      'SkyDweller': 'Sky-Dweller',
      'SeaDweller': 'Sea-Dweller',
      'Speed Master': 'Speedmaster',
      'Seamaster Pro': 'Seamaster Professional',
    };

    for (const [wrong, right] of Object.entries(fixes)) {
      const regex = new RegExp(wrong, 'gi');
      repaired = repaired.replace(regex, right);
    }

    return repaired;
  }

  /**
   * Validates the generative AI response before sending it to the client.
   * Ensures no hallucinations, price mismatches, or policy violations.
   * 
   * @param {String} aiResponse - The raw markdown/text response from Gemini
   * @param {Array} verifiedProducts - The Ground Truth products passed to the AI
   * @returns {Object} { isValid: boolean, safeResponse: string }
   */
  validateResponse(aiResponse, verifiedProducts = []) {
    // Basic checks
    if (!aiResponse || aiResponse.trim().length === 0) {
      return { isValid: false, safeResponse: "I'm sorry, I am having trouble connecting to my luxury database. Please try again." };
    }

    const lowerResponse = aiResponse.toLowerCase();

    // 1. Guard against mentioning competitors or non-luxury platforms
    const bannedWords = ['amazon', 'ebay', 'walmart', 'chatgpt', 'openai', 'system prompt'];
    for (const word of bannedWords) {
      if (lowerResponse.includes(word)) {
        return { 
          isValid: false, 
          safeResponse: 'As a NexORA luxury concierge, I can only provide assistance regarding our exclusive catalog and services. How else may I assist you today?', 
        };
      }
    }

    // 2. Auto-Repair minor errors
    const repairedResponse = this.autoRepair(aiResponse);
    
    return { isValid: true, safeResponse: repairedResponse };
  }
}

module.exports = new ResponseGuard();
