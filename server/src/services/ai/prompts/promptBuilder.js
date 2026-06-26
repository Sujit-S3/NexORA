const fs = require('fs');
const path = require('path');

class PromptBuilderService {
  constructor() {
    this.templatesPath = path.join(__dirname, '..', 'prompts');
  }

  getSystemPrompt() {
    return `You are NexORA's Private Client Advisor, an elite luxury styling and shopping concierge.
You NEVER sound robotic. You NEVER sound like ChatGPT. You are a Luxury Stylist, Watch Specialist, and Fashion Consultant.
Your tone is Elegant, Confident, Warm, Professional, Concise, and Luxury.
CRITICAL RULES:
- NEVER say "As an AI", "As an AI language model", "I cannot", "I am unable", or "My knowledge cutoff".
- If asked about something outside your bounds, gracefully pivot like a true luxury advisor: "While my expertise lies in our curated luxury collections, I'd be delighted to assist you with..."
- You NEVER invent products or prices. You only recommend products explicitly provided in the AVAILABLE INVENTORY block.
- Always recommend, educate, compare, guide, curate, and upsell naturally based on the customer's profile.`;
  }

  getIntentPrompt(intent) {
    switch (intent) {
      case 'gift-finder': return `Your goal is to help the user find the perfect gift. Ask clarifying questions about the recipient if needed.`;
      case 'comparison': return `Your goal is to compare the provided products objectively, highlighting differences in materials, movement, and value.`;
      case 'checkout-assistance': return `Your goal is to assist the user in completing their purchase. Explain shipping, returns, and warranties if relevant.`;
      default: return `Your goal is to guide the user in discovering the perfect luxury timepiece or accessory.`;
    }
  }

  getCommercePrompt(context, rankedProducts) {
    const customerName = context.user ? context.user.name : 'Valued Client';
    const comfortRange = context.preferences?.budgets?.comfortRange;
    const budgetStr = comfortRange && comfortRange.max ? 
      `$${comfortRange.min} - $${comfortRange.max}` : 
      (context.preferences?.budget || 'Unknown');
    
    return `
--- COMMERCE STATE ---
Conversation Phase: ${context.aiState || 'DISCOVERY'}
Customer Profile:
- Name: ${customerName}
- Comfort Range (Budget): ${budgetStr}
- Preferred Brands: ${context.preferences?.brands?.join(', ') || 'None specified'}

Cart: ${JSON.stringify(context.cart || [])}
Wishlist: ${JSON.stringify(context.wishlist || [])}
Recent Orders: ${JSON.stringify(context.orders || [])}

--- AVAILABLE INVENTORY (Ground Truth) ---
Retrieved Verified Inventory (DO NOT hallucinate other products. Do NOT change prices):
${JSON.stringify(rankedProducts || [])}
`;
  }

  getJourneyPrompt(chatHistory) {
    const chatHistoryData = chatHistory.map(msg => `${msg.role === 'user' ? 'Client' : 'Concierge'}: ${msg.content}`).join('\n');
    return `
--- CONVERSATION HISTORY ---
${chatHistoryData}
`;
  }

  /**
   * Assembles the final prompt to be sent to the Model Router.
   */
  buildPrompt(context, rankedProducts, userMessage, chatHistory, timelineStr = '') {
    const system = this.getSystemPrompt();
    const intent = this.getIntentPrompt(context.intent);
    const commerce = this.getCommercePrompt(context, rankedProducts);
    const journey = this.getJourneyPrompt(chatHistory);

    return `
${system}

${intent}
${commerce}

--- SESSION TIMELINE ---
${timelineStr}

${journey}

--- LATEST CLIENT MESSAGE ---
Client: ${userMessage}
Concierge (Reply in luxury tone, explain choices based on Ground Truth):
`;
  }
}

module.exports = new PromptBuilderService();
