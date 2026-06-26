/**
 * NexORA Intent Detector — Local Classifier (Zero API Calls)
 *
 * Replaced Gemini-based intent detection with a deterministic local classifier.
 * Benefits:
 *   - Saves 1 Gemini API call per user message (50% quota reduction)
 *   - ~0ms latency vs ~800ms for Gemini intent call
 *   - Works even when Gemini quota is exhausted
 *   - Fully deterministic and testable
 */

// ── Entity Dictionaries ──────────────────────────────────────────────────────
const BRANDS = [
  'gucci', 'prada', 'versace', 'balenciaga', 'louis vuitton', 'dior', 'hermès', 'hermes',
  'nike', 'off-white', 'moncler', 'chanel', 'burberry', 'christian louboutin', 'louboutin',
  'apple', 'sony', 'samsung', 'bose', 'dell', 'microsoft', 'dyson', 'nvidia', 'lg',
  'rode', 'gopro', 'rolex', 'omega', 'patek philippe', 'patek', 'audemars piguet', 'ap',
  'casio', 'tissot', 'grand seiko', 'breitling', 'seiko', 'ray-ban', 'rayban',
  'montblanc', 'bottega veneta', 'bottega', 'tom ford', 'rimowa', 'cartier', 'aesop',
  'moleskine', 'le labo', 'bang olufsen', 'bang & olufsen', 'smeg', 'nespresso',
  'theragun', 'yeti', 'nexora'
];

const CATEGORY_MAP = {
  // Keywords → category slug for DB lookup
  'watch': 'watches', 'watches': 'watches', 'timepiece': 'watches', 'chronograph': 'watches',
  'jacket': 'fashion', 'coat': 'fashion', 'shirt': 'fashion', 'dress': 'fashion',
  'suit': 'fashion', 'trousers': 'fashion', 'skirt': 'fashion', 'fashion': 'fashion',
  'sneaker': 'fashion', 'shoes': 'fashion', 'shoe': 'fashion', 'boots': 'fashion', 'footwear': 'fashion',
  'bag': 'accessories', 'handbag': 'accessories', 'wallet': 'accessories', 'sunglasses': 'accessories',
  'glasses': 'accessories', 'eyewear': 'accessories', 'belt': 'accessories', 'accessory': 'accessories',
  'laptop': 'electronics', 'phone': 'electronics', 'headphone': 'electronics', 'headphones': 'electronics',
  'speaker': 'electronics', 'camera': 'electronics', 'tech': 'electronics', 'electronics': 'electronics',
  'tablet': 'electronics', 'monitor': 'electronics', 'keyboard': 'electronics', 'earbuds': 'electronics',
  'perfume': 'lifestyle', 'candle': 'lifestyle', 'skincare': 'lifestyle', 'grooming': 'lifestyle',
  'home': 'lifestyle', 'lifestyle': 'lifestyle', 'wellness': 'lifestyle',
  'gift': 'luxury-gifts', 'gifts': 'luxury-gifts', 'present': 'luxury-gifts',
};

// ── Intent Signal Words ──────────────────────────────────────────────────────
const SEARCH_SIGNALS  = ['show', 'find', 'get', 'browse', 'see', 'display', 'look for', 'search', 'want', 'need', 'looking for', 'i want', 'suggest', 'recommend', 'any'];
const COMPARE_SIGNALS = ['compare', 'vs', 'versus', 'difference between', 'better than', 'which is better', 'between'];
const GIFT_SIGNALS    = ['gift', 'present', 'birthday', 'anniversary', 'christmas', 'give', 'for him', 'for her', 'for my'];
const ADVISOR_SIGNALS = ['style', 'advice', 'outfit', 'wear', 'fashion', 'trend', 'pair', 'match', 'pair with', 'go with', 'what should'];
const ORDER_SIGNALS   = ['order', 'tracking', 'delivery', 'shipped', 'where is my', 'status', 'return', 'refund'];
const CHECKOUT_SIGNALS= ['checkout', 'discount', 'promo', 'coupon', 'cart', 'buy', 'purchase', 'pay'];
const INQUIRY_SIGNALS = ['how does', 'what is', 'tell me about', 'explain', 'details', 'specs', 'specification', 'review', 'quality', 'material', 'made of'];
const GREETING_SIGNALS= ['hi', 'hello', 'hey', 'good morning', 'good evening', 'greet'];

// ── Budget Extraction ────────────────────────────────────────────────────────
function extractBudget(text) {
  // Match patterns like: under 50000, below ₹50k, less than 100000, max 75000
  const patterns = [
    /(?:under|below|less than|max|maximum|budget of|around|upto|up to)\s*[₹$]?\s*(\d[\d,]*(?:\.\d+)?)\s*k?/i,
    /[₹$]\s*(\d[\d,]*(?:\.\d+)?)\s*k?/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      let val = parseFloat(m[1].replace(/,/g, ''));
      if (text.match(/\d+k\b/i)) val *= 1000;
      return val;
    }
  }
  return null;
}

// ── Main Classifier ──────────────────────────────────────────────────────────
class IntentDetectorService {
  detectIntent(message, context = {}) {
    const lower = message.toLowerCase().trim();

    // Extract entities
    const foundBrands = BRANDS.filter(b => lower.includes(b));
    const foundCategoryKeys = Object.keys(CATEGORY_MAP).filter(k => lower.includes(k));
    const foundCategories   = [...new Set(foundCategoryKeys.map(k => CATEGORY_MAP[k]))];
    const budget = extractBudget(lower);

    const hasEntitySignal = foundBrands.length > 0 || foundCategoryKeys.length > 0;

    // Determine intent using priority scoring
    const has = (signals) => signals.some(s => lower.includes(s));

    let intent, needsDB, needsRules, needsGemini, confidence;

    if (has(CHECKOUT_SIGNALS) && !has(SEARCH_SIGNALS)) {
      // Pure commerce action
      intent      = lower.includes('discount') || lower.includes('promo') || lower.includes('coupon')
                    ? 'apply-discount' : 'checkout-assistance';
      needsDB     = false;
      needsRules  = true;
      needsGemini = false;
      confidence  = 0.95;
    } else if (has(ORDER_SIGNALS)) {
      intent      = 'order-status';
      needsDB     = true;
      needsRules  = true;
      needsGemini = true;
      confidence  = 0.9;
    } else if (has(COMPARE_SIGNALS)) {
      intent      = 'comparison';
      needsDB     = true;
      needsRules  = false;
      needsGemini = true;
      confidence  = 0.9;
    } else if (has(GIFT_SIGNALS)) {
      intent      = 'gift-finder';
      needsDB     = true;
      needsRules  = false;
      needsGemini = true;
      confidence  = 0.88;
    } else if (has(INQUIRY_SIGNALS) && hasEntitySignal) {
      intent      = 'product-inquiry';
      needsDB     = true;
      needsRules  = false;
      needsGemini = true;
      confidence  = 0.85;
    } else if (hasEntitySignal || has(SEARCH_SIGNALS)) {
      intent      = 'product-search';
      needsDB     = true;
      needsRules  = false;
      // Gemini not strictly needed for pure product fetch, but enrich if there's a question too
      needsGemini = has(INQUIRY_SIGNALS) || has(ADVISOR_SIGNALS) || (!hasEntitySignal && has(SEARCH_SIGNALS));
      confidence  = hasEntitySignal ? 0.88 : 0.65;
    } else if (has(ADVISOR_SIGNALS)) {
      intent      = 'luxury-advisor';
      needsDB     = false;
      needsRules  = false;
      needsGemini = true;
      confidence  = 0.8;
    } else if (has(GREETING_SIGNALS) && lower.length < 25) {
      intent      = 'general-chat';
      needsDB     = false;
      needsRules  = false;
      needsGemini = true;
      confidence  = 0.95;
    } else {
      // Default: treat as conversational / advisor (Gemini will handle)
      intent      = lower.length > 0 ? 'luxury-advisor' : 'general-chat';
      needsDB     = false;
      needsRules  = false;
      needsGemini = true;
      confidence  = 0.5;
    }

    return {
      intent,
      confidence,
      needsDB,
      needsRules,
      needsGemini,
      entities: {
        brands:     foundBrands,
        categories: foundCategories,
        budget,
      },
    };
  }
}

module.exports = new IntentDetectorService();
