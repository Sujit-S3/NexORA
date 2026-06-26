// NexORA V10 — AI Service (Elite Luxury Commerce Concierge)
// Rule 1: MongoDB is the source of truth. Gemini only explains retrieved data.
// Rule 7: Flash for conversation, Pro for deep compare/admin/luxury guides.
const { GoogleGenerativeAI } = require('@google/generative-ai');
const crypto = require('crypto');
const Product = require('../models/Product');
const Order   = require('../models/Order');
const Category = require('../models/Category');
const AIRequest = require('../models/AIRequest');
const UserPreference = require('../models/UserPreference');
const RecommendationService = require('./recommendationService');
const AnalyticsService = require('./analyticsService');
const InventoryService = require('./inventoryService');
const ConciergeContext = require('./conciergeContextService');

// ── Environment ────────────────────────────────────────────────────────────
const GOOGLE_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY;
const genAI          = new GoogleGenerativeAI(GOOGLE_API_KEY);

// Track rate-limit state without burning quota on health checks
let rateLimitUntil = 0; // epoch ms when quota resets

function setRateLimit(retryAfterSeconds = 60) {
  rateLimitUntil = Date.now() + retryAfterSeconds * 1000;
}

function isRateLimited() {
  return Date.now() < rateLimitUntil;
}

if (!GOOGLE_API_KEY) {
  console.error('[AI SERVICE] CRITICAL: GEMINI_API_KEY is missing.');
} else {
  console.log('[AI SERVICE] Environment Loaded');
  console.log(`[AI SERVICE] API Loaded. Key Length: ${GOOGLE_API_KEY.length}`);
}

// ── V10 Model Router (Rule 7) ────────────────────────────────────────────────
// Flash: all customer conversations, intent extraction, skill chat
// Pro:  deep product comparison, luxury buying guides, admin studio tools
const FLASH_MODEL = 'gemini-2.5-flash';
const PRO_MODEL   = 'gemini-2.5-pro';
const FLASH_FALLBACK = 'gemini-1.5-flash';

const PRO_SKILLS = new Set(['compare-products', 'luxury-guide', 'forecast', 'trends', 'revenue', 'marketing']);

const SUPPORTED_MODELS = [FLASH_MODEL, FLASH_FALLBACK, PRO_MODEL];
let currentActiveModel = FLASH_MODEL;
console.log(`[AI SERVICE V10] Default Model: ${currentActiveModel}`);

function selectModel(skill = '') {
  return PRO_SKILLS.has(skill) ? PRO_MODEL : FLASH_MODEL;
}


// ── Error Classification ───────────────────────────────────────────────────
class AIError extends Error {
  constructor(message, httpStatus, geminiCode, payload) {
    super(message);
    this.name       = 'AIError';
    this.httpStatus = httpStatus || 500;
    this.geminiCode = geminiCode || 'UNKNOWN';
    this.payload    = payload || {};
  }
}

const parseGeminiError = (error) => {
  let status = 500, code = 'UNKNOWN_ERROR';
  const msg = error.message || '';
  if (msg.includes('404') || msg.includes('not found'))   { status = 404; code = 'ERROR_MODEL_NOT_FOUND'; }
  else if (msg.includes('429') || msg.includes('quota'))  { status = 429; code = 'ERROR_RATE_LIMIT'; }
  else if (msg.includes('503') || msg.includes('overload')){ status = 503; code = 'ERROR_SERVICE_UNAVAILABLE'; }
  else if (msg.includes('504') || msg.includes('timeout')){ status = 504; code = 'ERROR_GATEWAY_TIMEOUT'; }
  else if (msg.includes('400') || msg.includes('invalid')){ status = 400; code = 'ERROR_INVALID_ARGUMENT'; }
  else if (msg.includes('401') || msg.includes('403'))    { status = 401; code = 'ERROR_UNAUTHORIZED'; }
  else if (msg.includes('AbortError') || msg.includes('fetch failed')) { status = 504; code = 'ERROR_NETWORK'; }
  if (error.status) status = error.status;
  return new AIError(msg, status, code, { original: msg });
};

// ── Timeout + Retry ────────────────────────────────────────────────────────
const withTimeoutAndRetry = async (asyncFn, options = { timeoutMs: 15000, maxRetries: 1 }) => {
  let attempt = 0;
  while (attempt <= options.maxRetries) {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AbortError: Request timed out')), options.timeoutMs)
      );
      return await Promise.race([asyncFn(), timeoutPromise]);
    } catch (err) {
      const parsedErr = parseGeminiError(err);
      const retryable = [429, 500, 502, 503, 504].includes(parsedErr.httpStatus) || parsedErr.geminiCode === 'ERROR_NETWORK';
      if (!retryable || attempt >= options.maxRetries) throw parsedErr;
      console.warn(`[AI SERVICE] Attempt ${attempt + 1} failed (${parsedErr.httpStatus}). Retrying in ${(attempt + 1)}s…`);
      attempt++;
      await new Promise(res => setTimeout(res, 1000 * attempt));
    }
  }
};

// ── Model Failover Executor ────────────────────────────────────────────────
const executeWithFailover = async (executeFn) => {
  let lastError = null;
  for (let i = 0; i < SUPPORTED_MODELS.length; i++) {
    const modelToTry = SUPPORTED_MODELS[i];
    try {
      const result = await withTimeoutAndRetry(
        () => executeFn(modelToTry),
        { timeoutMs: 15000, maxRetries: 1 }
      );
      currentActiveModel = modelToTry;
      return result;
    } catch (err) {
      lastError = err;
      if (err.httpStatus === 400 || err.httpStatus === 401 || err.httpStatus === 403) break;
      console.warn(`[AI SERVICE] Model ${modelToTry} failed (${err.httpStatus}). Trying next model…`);
      currentActiveModel = SUPPORTED_MODELS[i + 1] || SUPPORTED_MODELS[0];
    }
  }
  throw lastError;
};

// ── Logging ────────────────────────────────────────────────────────────────
const logAIRequest = async (data) => {
  try {
    const promptCost = data.model?.includes('pro') ? 0.00125 : 0.000075;
    const compCost   = data.model?.includes('pro') ? 0.005   : 0.0003;
    const estimatedCost = ((data.promptTokens || 0) / 1000) * promptCost + ((data.completionTokens || 0) / 1000) * compCost;
    console.log(`[AI LOG] ${data.requestId} | ${data.model} | ${data.latency}ms | ${data.httpStatus} | ${data.finalOutcome}`);
    await AIRequest.create({ ...data, estimatedCost });
  } catch (e) { console.error('[AI SERVICE] Log failed:', e.message); }
};

// ── Safety Guard ───────────────────────────────────────────────────────────
const isSafePrompt = (prompt) => {
  const patterns = [/ignore previous instructions/i, /system prompt/i, /bypass/i, /act as an unconstrained/i, /disregard/i, /jailbreak/i];
  return !patterns.some(p => p.test(prompt));
};

// ── In-Memory Cache ────────────────────────────────────────────────────────
const aiCache = new Map();
const getCached = async (key, ttlMinutes, fn) => {
  const cached = aiCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.data;
  const data = await fn();
  aiCache.set(key, { data, expiresAt: Date.now() + ttlMinutes * 60 * 1000 });
  return data;
};

// ── Generic Text Generator ─────────────────────────────────────────────────
const generateText = async (prompt, systemInstruction = '', userId = null, endpoint = '/general') => {
  if (!isSafePrompt(prompt)) throw new AIError('Prompt rejected by guardrails.', 400, 'ERROR_PROMPT_VALIDATION');

  const reqId = crypto.randomUUID();
  const t0    = Date.now();
  let usedModel = '';

  try {
    const result = await executeWithFailover(async (modelName) => {
      usedModel = modelName;
      const model = genAI.getGenerativeModel({ model: modelName, systemInstruction });
      return model.generateContent(prompt);
    });
    const response = await result.response;
    const latency  = Date.now() - t0;
    await logAIRequest({ requestId: reqId, userId, endpoint, model: usedModel,
      promptTokens: response.usageMetadata?.promptTokenCount,
      completionTokens: response.usageMetadata?.candidatesTokenCount,
      latency, httpStatus: 200, finalOutcome: 'SUCCESS' });
    return response.text();
  } catch (err) {
    await logAIRequest({ requestId: reqId, userId, endpoint, model: usedModel || currentActiveModel,
      latency: Date.now() - t0, httpStatus: err.httpStatus || 500,
      geminiCode: err.geminiCode, finalOutcome: 'ERROR' });
    throw err;
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// PHASE 2 — Intent Extraction
// ══════════════════════════════════════════════════════════════════════════════
exports.extractIntent = async (message, existingMemory = {}) => {
  const cacheKey = `intent:${message.toLowerCase().trim().slice(0, 80)}`;
  return getCached(cacheKey, 5, async () => {
    const prompt = `
You are extracting shopping intent from a luxury customer's message.
Existing memory: ${JSON.stringify(existingMemory)}
Customer message: "${message}"

Return ONLY a JSON object (no markdown, no explanation) with these keys:
{
  "category": "watches|bags|electronics|jewellery|clothing|accessories|null",
  "budget": <number in INR or null>,
  "brand": "<brand name or null>",
  "recipient": "CEO|Founder|Partner|Client|Friend|Family|Self|null",
  "occasion": "business|gift|daily|investment|travel|collection|null",
  "purpose": "gift|self|investment|collection|null",
  "preferredBrands": ["brand1","brand2"],
  "colors": ["color1"],
  "materials": ["material1"],
  "luxuryLevel": <1-5 or null>
}

Rules:
- Parse budget from text: "2 lakh" = 200000, "50k" = 50000, "₹2,00,000" = 200000
- Only fill fields explicitly mentioned or strongly implied
- Merge with existingMemory (do not overwrite unless explicitly changed)
- Return null for unknown fields
`.trim();

    try {
      const raw = await generateText(prompt, 'You extract structured intent. Return only valid JSON.', null, '/intent');
      return JSON.parse(raw.replace(/```json|```/g, '').trim());
    } catch (e) {
      return existingMemory; // Return existing memory on failure
    }
  });
};

// ══════════════════════════════════════════════════════════════════════════════
// PHASE 4+5 — Chat Concierge Stream (V10 — Intent-Aware Context + Luxury Journey)
// Architecture: Intent Detect → Context Retrieve (selective) → Gemini Flash → Stream
// ══════════════════════════════════════════════════════════════════════════════
exports.chatWithConciergeStream = async (message, history, memory, userId, sessionId, clientCart, clientWishlist, res) => {
  const reqId = crypto.randomUUID();
  const t0    = Date.now();
  let usedModel = '';
  let promptTokens = 0, completionTokens = 0;

  try {
    // STEP 1: Detect which skill this message maps to
    const skill = ConciergeContext.detectSkillFromMessage(message, memory);
    console.log(`[AI V10] Skill detected: ${skill}`);

    // STEP 2: Retrieve products from MongoDB (deterministic — backend decides ranking)
    const topProducts = await RecommendationService.getConciergeRecommendations(
      message, memory, userId, sessionId
    );

    // STEP 3: Intent-aware selective context retrieval (not everything — only what skill needs)
    const context = await ConciergeContext.assembleContext({
      skill, userId, sessionId,
      clientCartItems: clientCart || [],
      clientWishlistIds: clientWishlist || []
    });

    // STEP 4: Build lean product summary for Gemini (backend decided ranking/pricing)
    const productSummary = topProducts.map(p => ({
      name:     p.name,
      brand:    p.brand,
      category: p.category?.name,
      price:    `₹${(p.discountPrice || p.price).toLocaleString('en-IN')}`,
      rating:   p.ratings?.average?.toFixed(1) || '5.0',
      inStock:  p.stock > 0,
      rank:     p.conciergeRank,
      reasonBadge: p.reasonBadge
    }));

    // STEP 5: Build suggested actions
    const actions = buildSkillActions(skill, topProducts, memory, context);

    // STEP 6: Build system instruction (skill-aware persona)
    const systemInstruction = buildSystemInstruction(skill, productSummary, memory, context);

    // STEP 7: Stream products immediately so UI renders while Gemini types
    res.write(`data: ${JSON.stringify({ products: topProducts, actions, skill })}\n\n`);

    // STEP 8: Stream conversational response (Gemini Flash)
    await executeWithFailover(async (modelName) => {
      usedModel = modelName;
      const model = genAI.getGenerativeModel({ model: modelName, systemInstruction });
      const chat  = model.startChat({ history: history || [] });
      const stream = await chat.sendMessageStream(message);

      for await (const chunk of stream.stream) {
        const txt = chunk.text();
        res.write(`data: ${JSON.stringify({ text: txt })}\n\n`);
        if (chunk.usageMetadata) {
          promptTokens    = chunk.usageMetadata.promptTokenCount;
          completionTokens= chunk.usageMetadata.candidatesTokenCount;
        }
      }
    });

    // STEP 9: Send journey stage update
    const journeyStage = detectJourneyStage(skill, context);
    res.write(`data: ${JSON.stringify({ journeyStage })}\n\n`);

    res.write('data: [DONE]\n\n');

    await logAIRequest({ requestId: reqId, userId, endpoint: `/chat/stream/${skill}`, model: usedModel,
      promptTokens, completionTokens, latency: Date.now() - t0, httpStatus: 200, finalOutcome: 'SUCCESS' });

  } catch (err) {
    console.error(`[AI V10] Chat stream error (${err.httpStatus}):`, err.message);

    let userMsg = 'Our concierge is currently assisting other clients. Please try again shortly.';
    if (err.httpStatus === 429) userMsg = 'Our concierge is experiencing high demand. Please try again in a moment.';
    if (err.httpStatus === 504) userMsg = 'The connection timed out. Our team has been notified.';

    res.write(`data: ${JSON.stringify({ error: userMsg })}\n\n`);
    res.write('data: [DONE]\n\n');

    await logAIRequest({ requestId: reqId, userId, endpoint: '/chat/stream',
      model: usedModel || currentActiveModel, latency: Date.now() - t0,
      httpStatus: err.httpStatus || 500, geminiCode: err.geminiCode, finalOutcome: 'FAILOVER_ERROR' });
  }
};

// ── Skill Action Builder ───────────────────────────────────────────────────
function buildSkillActions(skill, products, memory, context) {
  const actions = [];
  if (products.length >= 2) actions.push('Compare Products');
  if (skill === 'gift-finder' || memory?.recipient) actions.push('Gift Finder');
  if (context.cart?.itemCount > 0) actions.push('Cart Advisor');
  if (context.discounts?.length > 0) actions.push('Apply Discount');
  if (skill !== 'wishlist-advisor') actions.push('Show Similar');
  if (skill !== 'post-purchase' && skill !== 'care-guide') actions.push('Luxury Alternatives');
  if (!memory?.budget) actions.push('Set Budget');
  return actions.slice(0, 5);
}

// ── Journey Stage Detector ────────────────────────────────────────────────
function detectJourneyStage(skill, context) {
  if (['order-assistance', 'warranty', 'care-guide', 'post-purchase'].includes(skill)) return 'aftercare';
  if (skill === 'checkout-assistant') return 'checkout';
  if (skill === 'cart-advisor' || context.cart?.itemCount > 0) return 'cart';
  if (skill === 'compare-products') return 'comparison';
  if (['personalized-recs', 'wishlist-advisor', 'upsell'].includes(skill)) return 'selection';
  if (['gift-finder', 'ceo-collection', 'occasion-shopping', 'budget-planner'].includes(skill)) return 'discovery';
  return 'browsing';
}

// ── System Instruction Builder (Skill-Aware) ──────────────────────────────
function buildSystemInstruction(skill, products, memory, context) {
  const clientProfile = [
    memory?.budget    ? `Budget: ₹${Number(memory.budget).toLocaleString('en-IN')}` : null,
    memory?.recipient ? `Shopping for: ${memory.recipient}` : null,
    memory?.category  ? `Category interest: ${memory.category}` : null,
    memory?.preferredBrands?.length ? `Preferred brands: ${memory.preferredBrands.join(', ')}` : null,
    memory?.occasion  ? `Occasion: ${memory.occasion}` : null,
    context.memory?.preferredSizes?.length ? `Sizes: ${context.memory.preferredSizes.join(', ')}` : null,
    context.cart?.itemCount ? `Cart: ${context.cart.itemCount} item(s), ₹${context.cart.totalPrice?.toLocaleString('en-IN')}` : null,
    context.discounts?.length ? `Active offers: ${context.discounts.map(d => d.code).join(', ')}` : null,
    context.recentOrders?.length ? `Recent orders: ${context.recentOrders.map(o => `${o.orderNumber} (${o.status})`).join('; ')}` : null,
  ].filter(Boolean).join('\n');

  const skillGuidance = getSkillGuidance(skill, context);

  return `
You are the NexORA Luxury Concierge — an elite personal shopping advisor for a world-class luxury e-commerce platform.

PERSONA:
- You advise clients the way a senior associate at Rolex, Hermès, or Cartier would.
- Tone: Elegant, professional, confident, warm. Never theatrical or sycophantic.
- Length: 2–4 sentences maximum. Be direct and precise.
- Never use: "Certainly!", "Absolutely!", "Of course!", "Great choice!"
- Never mention AI, Gemini, models, or technology.
- Never invent products, prices, or specifications not in the list below.
- Never decide which product is "best" — present options and let the client choose.

CURRENT SKILL: ${skill}
${skillGuidance}

AVAILABLE PRODUCTS (recommend ONLY these — backend has decided the ranking):
${JSON.stringify(products, null, 2)}

CLIENT PROFILE:
${clientProfile || 'New client — no profile yet.'}

RULES:
- Only reference products by name/brand from the list above.
- Do not mention product IDs, match scores, or backend terms.
- If no products match, acknowledge and suggest the closest option.
- After your response, do not add JSON, tables, or metadata.
- If the client's query suggests they are ready to buy, gently ask if they'd like to proceed to cart or checkout.
`.trim();
}

// ── Per-Skill Guidance ────────────────────────────────────────────────────
function getSkillGuidance(skill, context) {
  const guides = {
    'gift-finder':       'Focus on the recipient\'s profile. Ask clarifying questions if needed. Recommend 2–3 curated pieces with gifting rationale.',
    'ceo-collection':    'Recommend pieces that command presence in a boardroom. Prioritise heritage brands, precision, and discretion.',
    'compare-products':  'Present a balanced, honest comparison. Do not declare a winner — let the client decide based on their priorities.',
    'occasion-shopping': 'Match the product to the occasion\'s dress code, setting, and expected impression.',
    'outfit-builder':    'Suggest complementary pieces that form a cohesive, polished look. Reference colours, materials, and occasions.',
    'budget-planner':    `Present the best options within the client\'s budget. ${context.discounts?.length ? `Mention available offers: ${context.discounts.map(d => `${d.code} (${d.type === 'percentage' ? d.value + '% off' : '₹' + d.value + ' off'})`).join(', ')}.` : ''}`,
    'wishlist-advisor':  'Reference the client\'s saved items. Suggest complementary pieces or highlight any price changes.',
    'cart-advisor':      `The client has ${context.cart?.itemCount || 0} item(s) in their cart worth ₹${(context.cart?.totalPrice || 0).toLocaleString('en-IN')}. Suggest complementary additions or flag applicable discounts.`,
    'checkout-assistant':context.discounts?.length ? `Available discount codes: ${context.discounts.map(d => `${d.code} — ${d.description}`).join('; ')}.` : 'Guide the client smoothly through checkout.',
    'luxury-advisor':    'Speak with connoisseur authority. Reference heritage, craftsmanship provenance, investment value, and collector significance.',
    'order-assistance':  context.recentOrders?.length ? `Recent orders: ${JSON.stringify(context.recentOrders)}. Help the client with their query.` : 'The client is asking about an order. If they are not logged in, ask them to sign in to view order details.',
    'warranty':          'Provide clear, accurate warranty information. Reference the brand\'s authorised service policy.',
    'care-guide':        'Give precise, product-appropriate care instructions. Reference the materials and recommended maintenance schedule.',
    'post-purchase':     'Congratulate the client on their purchase. Suggest accessories or complementary pieces that enhance their new acquisition.',
    'product-education': 'Educate with authority and passion. Reference craftsmanship, heritage, materials, and what makes this piece exceptional.',
    'personalized-recs': 'Use the client\'s history and preferences to justify every recommendation.',
    'upsell':            'Suggest a premium alternative that offers additional value. Never push — present the option and its benefits.',
    'outfit-builder':    'Build a complete look. Reference how pieces complement each other in colour, material, and formality.',
  };
  return guides[skill] || 'Provide an elegant, helpful response relevant to the client\'s request.';
}



// ══════════════════════════════════════════════════════════════════════════════
// PHASE 7 — Compare Products
// ══════════════════════════════════════════════════════════════════════════════
exports.generateComparison = async (productIds, userId) => {
  const products = await RecommendationService.getComparableProducts(productIds);
  if (products.length < 2) throw new AIError('Need at least 2 products to compare.', 400, 'ERROR_INVALID_ARGUMENT');

  const productData = products.map(p => ({
    id: p._id, name: p.name, brand: p.brand,
    category: p.category?.name, price: p.discountPrice || p.price,
    rating: p.ratings?.average, stock: p.stock,
    specifications: p.specifications ? Object.fromEntries(p.specifications) : {}
  }));

  const prompt = `
Compare these luxury products for a high-value client:
${JSON.stringify(productData, null, 2)}

Return ONLY a valid JSON object (no markdown):
{
  "rows": [
    { "field": "Price", "values": ["₹X,XX,XXX", "₹Y,YY,YYY"] },
    { "field": "Rating", "values": ["4.8/5", "4.6/5"] },
    { "field": "Brand Heritage", "values": ["...","..."] },
    { "field": "Category", "values": ["...","..."] },
    { "field": "Availability", "values": ["In Stock (X units)","..."] },
    { "field": "Key Specification 1", "values": ["...","..."] },
    { "field": "Key Specification 2", "values": ["...","..."] }
  ],
  "verdict": {
    "winner": "<product name>",
    "reason": "<one sentence>"
  },
  "pros": { "<product1_id>": ["Pro 1","Pro 2"], "<product2_id>": ["Pro 1","Pro 2"] },
  "cons": { "<product1_id>": ["Con 1"], "<product2_id>": ["Con 1"] }
}

Rules:
- Only use data from the products provided.
- Format prices in Indian Rupees with commas.
- Keep values concise (max 30 chars each).
- Include specs from the specifications map if available.
`.trim();

  try {
    const raw = await generateText(prompt, 'You are a luxury product expert. Return only valid JSON.', userId, '/compare');
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
    return { ...parsed, products };
  } catch (e) {
    // Fallback: return basic deterministic comparison
    return {
      rows: [
        { field: 'Price', values: products.map(p => `₹${(p.discountPrice || p.price).toLocaleString('en-IN')}`) },
        { field: 'Rating', values: products.map(p => `${p.ratings?.average || 'N/A'}/5`) },
        { field: 'Brand', values: products.map(p => p.brand || 'N/A') },
        { field: 'Category', values: products.map(p => p.category?.name || 'N/A') },
        { field: 'Stock', values: products.map(p => p.stock > 0 ? `${p.stock} units` : 'Out of Stock') }
      ],
      verdict: { winner: products[0].name, reason: 'Based on overall rating and value.' },
      pros: {}, cons: {},
      products
    };
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// PHASE 9 — Checkout Suggestions (deterministic — no Gemini for selection)
// ══════════════════════════════════════════════════════════════════════════════
exports.getCheckoutSuggestions = async (cartProductIds, userId) => {
  return RecommendationService.getCheckoutSuggestions(cartProductIds);
};

// ══════════════════════════════════════════════════════════════════════════════
// PHASE 10 — Post-Purchase
// ══════════════════════════════════════════════════════════════════════════════
const CARE_GUIDES = {
  watch:       'Store your timepiece in a cool, dry environment away from magnetic fields. Service every 3–5 years at an authorised centre. Avoid extreme temperature changes.',
  bag:         'Store in the provided dust bag, stuffed lightly to maintain shape. Condition leather every 3 months with a pH-neutral cream. Avoid prolonged exposure to sunlight.',
  electronics: 'Use only certified accessories and chargers. Keep firmware updated. Store at room temperature and avoid moisture.',
  jewel:       'Store separately in a soft pouch to prevent scratching. Clean gently with a soft cloth. Schedule professional cleaning annually.',
  shoe:        'Use shoe trees when not worn. Rotate pairs to extend life. Apply leather conditioner every 30 days.',
  default:     'Handle with care and store in the original packaging when not in use. Keep away from humidity and direct sunlight.'
};

const getCareGuide = (categoryName = '') => {
  const cat = categoryName.toLowerCase();
  if (cat.includes('watch'))   return CARE_GUIDES.watch;
  if (cat.includes('bag') || cat.includes('leather')) return CARE_GUIDES.bag;
  if (cat.includes('tech') || cat.includes('elec'))   return CARE_GUIDES.electronics;
  if (cat.includes('jewel'))   return CARE_GUIDES.jewel;
  if (cat.includes('shoe') || cat.includes('foot'))   return CARE_GUIDES.shoe;
  return CARE_GUIDES.default;
};

exports.getPostPurchasePackage = async (orderId, userId) => {
  try {
    const order = await Order.findById(orderId).populate({
      path: 'items.product', populate: { path: 'category', select: 'name' }
    });

    if (!order) throw new AIError('Order not found', 404, 'NOT_FOUND');

    const products   = order.items.map(i => i.product).filter(Boolean);
    const categories = products.map(p => p.category?.name || '').filter(Boolean);
    const careText   = getCareGuide(categories[0] || '');

    const productIds      = products.map(p => p._id);
    const recommendations = await RecommendationService.getPostPurchaseRecommendations(productIds);

    // Estimated delivery (simple business day calc)
    const now = new Date();
    const deliveryDate = new Date(now);
    deliveryDate.setDate(deliveryDate.getDate() + 5);

    return {
      careText,
      categories,
      estimatedDelivery: deliveryDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }),
      recommendations
    };
  } catch (e) {
    // Fallback with generic care
    const recs = await RecommendationService.getPostPurchaseRecommendations([]);
    return {
      careText: CARE_GUIDES.default,
      categories: [],
      estimatedDelivery: 'Within 5–7 business days',
      recommendations: recs
    };
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// Auxiliary — Product Metadata, Reviews, Sales, Cart
// ══════════════════════════════════════════════════════════════════════════════
exports.generateProductMetadata = async (productData, userId) => {
  const prompt = `Generate SEO Title, Meta Description, 5 comma-separated Tags, and a short Luxury Instagram caption.\nProduct: ${JSON.stringify(productData)}`;
  try {
    const res = await generateText(prompt, 'You are a luxury commerce copywriter. Return JSON: { seoTitle, metaDescription, tags (array), instagramCaption }.', userId, '/product-metadata');
    return JSON.parse(res.replace(/```json|```/g, '').trim());
  } catch (e) {
    return { seoTitle: productData.name, metaDescription: 'A luxury product of exceptional quality.', tags: [], instagramCaption: '#luxury #nexora' };
  }
};

exports.analyzeReviews = async (reviews, userId) => {
  if (!reviews || reviews.length === 0) return { sentiment: 100, summary: 'No client reviews yet.', pros: [], cons: [] };
  const prompt = `Analyze these client reviews:\n${JSON.stringify(reviews)}\nReturn JSON: { sentiment (0-100), summary (2 sentences), pros (array), cons (array) }`;
  try {
    const res = await generateText(prompt, 'You are an objective luxury product analyst. Return strictly valid JSON.', userId, '/review-analysis');
    return JSON.parse(res.replace(/```json|```/g, '').trim());
  } catch (e) {
    return { sentiment: 80, summary: 'AI analysis is temporarily unavailable.', pros: [], cons: [] };
  }
};

exports.generateCartRecommendations = async (cartItems, userId) => {
  if (!cartItems || cartItems.length === 0) return [];
  return RecommendationService.getCartRecommendations(cartItems, userId, null);
};

// ══════════════════════════════════════════════════════════════════════════════
// PHASE 11 — Unified Admin Studio Endpoint
// ══════════════════════════════════════════════════════════════════════════════
exports.runAdminStudioTool = async (tool, payload, userId) => {
  let prompt = '';
  let sysInstruction = 'You are a Luxury Brand Executive. Be extremely concise. Format output in valid JSON.';

  try {
    if (tool === 'marketing') {
      prompt = `
Generate aspirational luxury marketing copy.
Campaign Type: ${payload?.campaignType}
Segment: ${payload?.segment}

Return JSON with structure:
{ "headline": "...", "body": "...", "cta": "..." }
`.trim();
    } 
    else if (tool === 'forecast') {
      const inventoryData = await InventoryService.getInventorySummary();
      prompt = `
Analyze this inventory data for a luxury store:
${JSON.stringify(inventoryData)}

Return JSON with structure:
{ 
  "actions": ["action 1", "action 2", "action 3"],
  "restockPriority": ["brand/category", "brand/category"],
  "overallHealth": "Healthy / Overstocked / Understocked"
}
`.trim();
    }
    else if (tool === 'trends') {
      const trendData = await AnalyticsService.getCustomerTrendsSummary();
      prompt = `
Analyze customer preference data:
${JSON.stringify(trendData)}

Return JSON with structure:
{
  "topInsights": ["insight 1", "insight 2", "insight 3"],
  "valuableSegments": ["segment 1", "segment 2"],
  "merchandisingPriority": "focus for next month"
}
`.trim();
    }
    else if (tool === 'revenue') {
      const revenueData = await AnalyticsService.getAdminAnalyticsSummary();
      prompt = `
Analyze this 8-week revenue data:
${JSON.stringify(revenueData)}

Return JSON with structure:
{
  "performanceSummary": "...",
  "bestWeek": "week identifier",
  "worstWeek": "week identifier",
  "recommendations": ["rec 1", "rec 2"]
}
`.trim();
    }
    else {
      throw new Error("Unknown admin tool");
    }

    const raw = await generateText(prompt, sysInstruction, userId, `/admin/${tool}`);
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
    return parsed;
  } catch (e) {
    console.error("Admin Tool Error:", e);
    return { error: 'Service temporarily unavailable.' };
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// Health + Test + Analytics
// ══════════════════════════════════════════════════════════════════════════════
exports.checkHealth = () => {
  const t0 = Date.now();
  const hasKey = !!(GOOGLE_API_KEY && GOOGLE_API_KEY.length > 10);
  if (!hasKey) {
    return { status: 'UNHEALTHY', provider: 'Google Gemini', model: currentActiveModel, latency: 0, available: false, error: 'API key not configured', timestamp: new Date() };
  }
  if (isRateLimited()) {
    const retryIn = Math.ceil((rateLimitUntil - Date.now()) / 1000);
    return { status: 'RATE_LIMITED', provider: 'Google Gemini', model: currentActiveModel, latency: Date.now() - t0, available: true, retryIn, timestamp: new Date() };
  }
  // Key is present and no known rate limit — report healthy without burning a quota token
  return { status: 'HEALTHY', provider: 'Google Gemini', model: currentActiveModel, latency: Date.now() - t0, available: true, timestamp: new Date() };
};

exports.testConnection = async (prompt) => {
  const t0 = Date.now();
  const res = await executeWithFailover(async (modelName) => {
    return genAI.getGenerativeModel({ model: modelName }).generateContent(prompt);
  });
  const response = await res.response;
  return { text: response.text(), usage: response.usageMetadata, latency: Date.now() - t0 };
};

exports.getAIAnalytics = async () => {
  const stats    = await AIRequest.aggregate([{ $group: { _id: null, totalRequests: { $sum: 1 }, totalCost: { $sum: '$estimatedCost' }, avgLatency: { $avg: '$latency' }, promptTokens: { $sum: '$promptTokens' }, completionTokens: { $sum: '$completionTokens' } } }]);
  const endpoints= await AIRequest.aggregate([{ $group: { _id: '$endpoint', count: { $sum: 1 } } }, { $sort: { count: -1 } }]);
  return { overview: stats[0] || { totalRequests: 0, totalCost: 0, avgLatency: 0, promptTokens: 0, completionTokens: 0 }, endpoints };
};
