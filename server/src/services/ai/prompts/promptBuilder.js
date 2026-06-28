// NexORA V13 — Prompt Builder
class PromptBuilderService {

  getSystemPrompt() {
    return `You are the NexORA Private Client Advisor — an elite luxury shopping concierge for the world's most discerning clientele.

PERSONA:
You advise clients the way a senior associate at Rolex Geneva, Hermès Paris, or Cartier would.
Tone: Elegant, confident, warm, concise. Never theatrical, never robotic, never sycophantic.
Length: 2–4 sentences maximum per response. Be direct and precise.

ABSOLUTE RULES:
- NEVER say "As an AI", "I cannot", "I am unable", "My knowledge cutoff", "Certainly!", "Absolutely!", "Great choice!"
- NEVER invent products, prices, discounts, specifications, or delivery dates not in the AVAILABLE INVENTORY block.
- NEVER mention product IDs, match scores, or backend technical terms.
- Only reference products explicitly listed in the AVAILABLE INVENTORY block.
- If asked about something outside NexORA, gracefully redirect: "While my expertise lies in our curated collections, I'd be delighted to help you discover..."
- After your response, do not add JSON, tables, or metadata.
- When a client says "add it to cart" or "I'll take it" or selects a product, confirm naturally: "Of course. The [product name] has been added to your cart."

LUXURY ADVISOR STYLE:
- Educate with authority: reference heritage, craftsmanship, materials, investment value.
- Curate, don't sell: present options, let the client decide.
- Cross-sell elegantly: suggest complementary pieces naturally, never aggressively.
- Use aspirational language: "acquisition", "collection", "curated", "distinction", "investment piece".

FIT INTELLIGENCE ADVISOR:
- If a client is looking for clothing/shoes and their profile is missing size data, gently ask: "Before I recommend one, what size do you usually wear?" or "What fit do you prefer?"
- NEVER invent sizing. If they give you a size, act as if you'll remember it forever.
- Explain recommendations based on their profile (e.g., "Medium is recommended with 98% confidence based on your preferred fit and previous selections").`;
  }

  getIntentGuidance(intent) {
    const guides = {
      'gift-finder':         'Help the client find the perfect gift. Ask one clarifying question if the recipient profile is unclear. Recommend 2–3 curated pieces with gifting rationale.',
      'comparison':          'Compare the provided products objectively. Highlight differences in craftsmanship, movement, heritage, and value. Do not declare a winner — let the client decide.',
      'checkout-assistance': 'Guide the client smoothly through checkout. Mention any applicable discount codes from the context. Reassure on delivery and warranty.',
      'order-status':        'Assist with the client\'s order query. Reference only the order data provided. Offer helpful next steps.',
      'care-guide':          'Provide precise, product-appropriate care and maintenance guidance. Reference materials and recommended service schedules.',

      'luxury-advisor':      'Speak with connoisseur authority. Reference heritage, provenance, collector significance, and investment value.',
      'refine-results':      'Acknowledge the refinement and explain how the new selection addresses it. Be brief — the products speak for themselves.',
      'product-selection':   'Confirm the client\'s selection with confidence. Offer to add to cart, compare alternatives, or suggest complementary pieces.',
      'confirm-add-to-cart': 'Confirm the addition to cart naturally. Suggest one complementary piece if appropriate.',
      'navigate-checkout':   'Acknowledge the move to checkout. Mention any cart savings or applicable offers.',
      'wishlist-advisor':    'Reference the client\'s saved items. Note any price changes or complementary pieces.',
      'product-search':      'Introduce the curated selection briefly. Reference why these pieces align with the client\'s stated preferences.',
      'product-inquiry':     'Educate with passion and precision. Reference the specific details requested.',
    };
    return guides[intent] || 'Provide an elegant, helpful response relevant to the client\'s request.';
  }

  getCommerceContext(context, rankedProducts) {
    const profile = context.sessionMemory || {};
    const profileLines = [
      context.user?.name              ? `Client Name: ${context.user.name}` : null,
      profile.budget                  ? `Budget: ₹${Number(profile.budget).toLocaleString('en-IN')}` : null,
      profile.preferredBrands?.length ? `Preferred Brands: ${profile.preferredBrands.join(', ')}` : null,
      profile.category                ? `Category Interest: ${profile.category}` : null,
      profile.occasion                ? `Occasion: ${profile.occasion}` : null,
      profile.recipient               ? `Shopping For: ${profile.recipient}` : null,
      profile.materials?.length       ? `Preferred Materials: ${profile.materials.join(', ')}` : null,
      profile.colors?.length          ? `Preferred Colors: ${profile.colors.join(', ')}` : null,
      
      // Fit Intelligence Profile
      profile.physicalProfile?.heightCm ? `Height: ${profile.physicalProfile.heightCm}cm` : null,
      profile.physicalProfile?.weightKg ? `Weight: ${profile.physicalProfile.weightKg}kg` : null,
      profile.physicalProfile?.bodyType ? `Body Type: ${profile.physicalProfile.bodyType}` : null,
      profile.physicalProfile?.preferredFit ? `Preferred Fit: ${profile.physicalProfile.preferredFit}` : null,
      profile.preferredSizes?.shirt ? `Preferred Shirt Size: ${profile.preferredSizes.shirt}` : null,
      profile.preferredSizes?.bottom ? `Preferred Bottom Size: ${profile.preferredSizes.bottom}` : null,
      profile.preferredSizes?.shoe ? `Preferred Shoe Size: ${profile.preferredSizes.shoe}` : null,
      profile.preferredSizes?.ring ? `Preferred Ring Size: ${profile.preferredSizes.ring}` : null,

      context.cart?.itemCount > 0     ? `Cart: ${context.cart.itemCount} item(s), ₹${(context.cart.totalPrice || 0).toLocaleString('en-IN')}` : null,
      context.discounts?.length       ? `Active Offers: ${context.discounts.map(d => d.code).join(', ')}` : null,
      context.orders?.length          ? `Recent Orders: ${context.orders.map(o => `${o.orderNumber} (${o.status})`).join('; ')}` : null,
    ].filter(Boolean).join('\n');

    const productSummary = rankedProducts.slice(0, 8).map((p, i) => ({
      position: i + 1,
      name:     p.name,
      brand:    p.brand,
      category: p.category?.name,
      price:    `₹${(p.discountPrice || p.price || 0).toLocaleString('en-IN')}`,
      rating:   p.ratings?.average?.toFixed(1) || '5.0',
      inStock:  (p.stock || 0) > 0,
      variants: p.variants && p.variants.length > 0 ? p.variants.map(v => `${v.size}: ${v.stock > 0 ? 'In Stock' : 'Out of Stock'}`).join(', ') : undefined,
      reasonBadge: p.reasonBadge,
    }));

    return `
--- CONVERSATION PHASE ---
${context.aiState || 'DISCOVERY'}

--- CLIENT PROFILE ---
${profileLines || 'New client — no preferences captured yet.'}

--- AVAILABLE INVENTORY (Ground Truth — recommend ONLY these products) ---
${JSON.stringify(productSummary, null, 2)}

--- CART & CONTEXT ---
Cart Items: ${JSON.stringify(context.cart || [])}
Wishlist: ${JSON.stringify(context.wishlist || [])}`;
  }

  buildPrompt(context, rankedProducts, userMessage, chatHistory, timelineStr = '') {
    const history = chatHistory
      .map(m => `${m.role === 'user' ? 'Client' : 'Concierge'}: ${m.content || m.text || ''}`)
      .join('\n');

    return `${this.getSystemPrompt()}

--- CURRENT TASK ---
${this.getIntentGuidance(context.intent)}

${this.getCommerceContext(context, rankedProducts)}

--- SESSION TIMELINE ---
${timelineStr || 'New session.'}

--- CONVERSATION HISTORY ---
${history || 'No prior turns.'}

--- CLIENT MESSAGE ---
Client: ${userMessage}

Concierge (respond in 2-4 sentences, luxury tone, only reference products from the AVAILABLE INVENTORY above):`;
  }
}

module.exports = new PromptBuilderService();
