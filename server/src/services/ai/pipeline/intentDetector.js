/**
 * NexORA V13 — Intent Detector (Local Classifier + Memory Merge)
 *
 * V13 upgrades:
 *  - Accepts session memory for cumulative filter accumulation
 *  - Handles incremental refinements ("only Rolex", "gold only", "under 5 lakh")
 *  - New intents: product-selection, refine-results, confirm-add-to-cart, navigate-checkout
 *  - Budget parsing: "5 lakh", "50k", "2.5 crore"
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
  'theragun', 'yeti', 'nexora', 'iwc', 'jaeger', 'vacheron', 'breguet',
  'bulgari', 'bvlgari', 'tiffany', 'van cleef', 'chopard', 'hublot', 'tag heuer',
  'longines', 'tudor', 'zenith', 'rado', 'hamilton', 'frederique constant',
];

const CATEGORY_MAP = {
  'watch': 'watches', 'watches': 'watches', 'timepiece': 'watches', 'chronograph': 'watches',
  'timepieces': 'watches', 'horology': 'watches', 'wristwatch': 'watches',
  'jacket': 'fashion', 'coat': 'fashion', 'shirt': 'fashion', 'dress': 'fashion',
  'suit': 'fashion', 'trousers': 'fashion', 'skirt': 'fashion', 'fashion': 'fashion',
  'sneaker': 'fashion', 'shoes': 'fashion', 'shoe': 'fashion', 'boots': 'fashion', 'footwear': 'fashion',
  'bag': 'accessories', 'handbag': 'accessories', 'wallet': 'accessories', 'sunglasses': 'accessories',
  'glasses': 'accessories', 'eyewear': 'accessories', 'belt': 'accessories', 'accessory': 'accessories',
  'accessories': 'accessories', 'bags': 'accessories', 'purse': 'accessories',
  'laptop': 'electronics', 'phone': 'electronics', 'headphone': 'electronics', 'headphones': 'electronics',
  'speaker': 'electronics', 'camera': 'electronics', 'tech': 'electronics', 'electronics': 'electronics',
  'tablet': 'electronics', 'monitor': 'electronics', 'keyboard': 'electronics', 'earbuds': 'electronics',
  'perfume': 'lifestyle', 'candle': 'lifestyle', 'skincare': 'lifestyle', 'grooming': 'lifestyle',
  'home': 'lifestyle', 'lifestyle': 'lifestyle', 'wellness': 'lifestyle', 'fragrance': 'lifestyle',
  'gift': 'luxury-gifts', 'gifts': 'luxury-gifts', 'present': 'luxury-gifts',
  'jewellery': 'jewellery', 'jewelry': 'jewellery', 'ring': 'jewellery', 'necklace': 'jewellery',
  'bracelet': 'jewellery', 'earring': 'jewellery',
};

const MATERIAL_MAP = [
  'gold', 'silver', 'platinum', 'rose gold', 'white gold', 'titanium', 'steel',
  'stainless steel', 'ceramic', 'leather', 'crocodile', 'alligator', 'canvas',
  'nylon', 'rubber', 'sapphire', 'diamond', 'carbon fiber', 'bronze',
];

const COLOR_MAP = [
  'black', 'white', 'blue', 'red', 'green', 'gold', 'silver', 'grey', 'gray',
  'brown', 'navy', 'beige', 'cream', 'rose', 'pink', 'champagne', 'chocolate',
  'dark', 'light', 'panda', 'meteorite', 'sunburst',
];

// ── Intent Signal Words ──────────────────────────────────────────────────────
const SEARCH_SIGNALS   = ['show', 'find', 'get', 'browse', 'see', 'display', 'look for', 'search', 'want', 'need', 'looking for', 'i want', 'suggest', 'recommend', 'any', 'more', 'other'];
const COMPARE_SIGNALS  = ['compare', 'vs', 'versus', 'difference between', 'better than', 'which is better', 'between'];
const GIFT_SIGNALS     = ['gift', 'present', 'birthday', 'anniversary', 'christmas', 'give', 'for him', 'for her', 'for my'];
const ADVISOR_SIGNALS  = ['style', 'advice', 'outfit', 'wear', 'fashion', 'trend', 'pair', 'match', 'pair with', 'go with', 'what should'];
const ORDER_SIGNALS    = ['order', 'tracking', 'delivery', 'shipped', 'where is my', 'status', 'return', 'refund', 'my orders'];
const CHECKOUT_SIGNALS = ['checkout', 'promo', 'coupon', 'discount code', 'buy', 'purchase', 'pay', 'proceed'];
const INQUIRY_SIGNALS  = ['how does', 'what is', 'tell me about', 'explain', 'details', 'specs', 'specification', 'review', 'quality', 'material', 'made of', 'about this', 'more about'];
const GREETING_SIGNALS = ['hi', 'hello', 'hey', 'good morning', 'good evening', 'greet', 'start'];
const ADD_CART_SIGNALS = ['add to cart', 'add it', "i'll take", 'i want this', 'buy this', 'get this', 'purchase this', 'take the', 'add the'];
const SELECT_SIGNALS   = ['first one', 'second one', 'third one', 'the first', 'the second', 'the third', 'that one', 'this one', 'choose this', 'i like this', 'i prefer this'];
const REFINE_SIGNALS   = ['only', 'just', 'filter', 'narrow', 'show only', 'limit to', 'prefer', 'change to', 'switch to', 'instead'];
const WISHLIST_SIGNALS = ['wishlist', 'save', 'save for later', 'bookmark', 'heart', 'favorite', 'favourite'];
const CARE_SIGNALS     = ['care', 'maintain', 'clean', 'service', 'warranty', 'repair', 'aftercare'];

// ── Budget Extraction ────────────────────────────────────────────────────────
function extractBudget(text) {
  // Crore/lakh/k shorthand
  const croreMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:cr|crore|crores)/i);
  if (croreMatch) {return parseFloat(croreMatch[1]) * 10000000;}

  const lakhMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:l|lac|lakh|lakhs)/i);
  if (lakhMatch) {return parseFloat(lakhMatch[1]) * 100000;}

  const kMatch = text.match(/(\d+(?:\.\d+)?)\s*k\b/i);
  if (kMatch) {return parseFloat(kMatch[1]) * 1000;}

  // Standard patterns
  const patterns = [
    /(?:under|below|less than|max|maximum|budget of|around|upto|up to|within)\s*[₹$]?\s*([\d,]+(?:\.\d+)?)/i,
    /[₹$]\s*([\d,]+(?:\.\d+)?)/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {return parseFloat(m[1].replace(/,/g, ''));}
  }
  return null;
}

// ── Material Extractor ───────────────────────────────────────────────────────
function extractMaterials(text) {
  return MATERIAL_MAP.filter(m => text.includes(m));
}

// ── Color Extractor ──────────────────────────────────────────────────────────
function extractColors(text) {
  return COLOR_MAP.filter(c => text.includes(c));
}

// ── Main Classifier ──────────────────────────────────────────────────────────
class IntentDetectorService {
  /**
   * Detects intent and merges with session memory for cumulative filters.
   * @param {string} message — raw user message
   * @param {Object} memory  — current session memory (budget, brands, category, colors, materials...)
   */
  detectIntent(message, memory = {}) {
    const lower = message.toLowerCase().trim();

    // ── Extract new entities from this message ───────────────────────────────
    const foundBrands      = BRANDS.filter(b => lower.includes(b));
    const foundCategoryKeys= Object.keys(CATEGORY_MAP).filter(k => lower.includes(k));
    const foundCategories  = [...new Set(foundCategoryKeys.map(k => CATEGORY_MAP[k]))];
    const budget           = extractBudget(lower);
    const materials        = extractMaterials(lower);
    const colors           = extractColors(lower);

    const hasEntitySignal = foundBrands.length > 0 || foundCategoryKeys.length > 0;

    const has = (signals) => signals.some(s => lower.includes(s));

    // ── Merge with session memory (cumulative) ───────────────────────────────
    const mergedBrands     = [...new Set([...(memory?.preferredBrands || []), ...foundBrands])];
    const mergedCategories = [...new Set([...(memory?.category ? [memory.category] : []), ...foundCategories])];
    const mergedBudget     = budget || (memory?.budget ? Number(memory.budget) : null);
    const mergedMaterials  = [...new Set([...(memory?.materials || []), ...materials])];
    const mergedColors     = [...new Set([...(memory?.colors || []), ...colors])];

    // ── Intent Classification (priority order) ────────────────────────────────
    let intent, needsDB, needsRules, needsGemini, confidence;

    if (has(ADD_CART_SIGNALS)) {
      intent      = 'confirm-add-to-cart';
      needsDB     = false;
      needsRules  = true;
      needsGemini = true;
      confidence  = 0.95;
    } else if (lower.includes('checkout') && !has(SEARCH_SIGNALS)) {
      intent      = 'navigate-checkout';
      needsDB     = false;
      needsRules  = true;
      needsGemini = true; // V13: Always use Gemini
      confidence  = 0.95;
    } else if (has(SELECT_SIGNALS)) {
      intent      = 'product-selection';
      needsDB     = true;
      needsRules  = false;
      needsGemini = true;
      confidence  = 0.9;
    } else if (has(REFINE_SIGNALS) && (hasEntitySignal || budget || materials.length || colors.length)) {
      intent      = 'refine-results';
      needsDB     = true;
      needsRules  = false;
      needsGemini = true;
      confidence  = 0.92;
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
    } else if (has(CARE_SIGNALS)) {
      intent      = 'care-guide';
      needsDB     = false;
      needsRules  = false;
      needsGemini = true;
      confidence  = 0.85;
    } else if (has(WISHLIST_SIGNALS)) {
      intent      = 'wishlist-advisor';
      needsDB     = true;
      needsRules  = false;
      needsGemini = true;
      confidence  = 0.85;
    } else if (has(INQUIRY_SIGNALS) && hasEntitySignal) {
      intent      = 'product-inquiry';
      needsDB     = true;
      needsRules  = false;
      needsGemini = true;
      confidence  = 0.85;
    } else if (hasEntitySignal || has(SEARCH_SIGNALS) || mergedBrands.length || mergedCategories.length) {
      intent      = 'product-search';
      needsDB     = true;
      needsRules  = false;
      needsGemini = true; // V13: Always use Gemini for conversational luxury experience
      confidence  = hasEntitySignal ? 0.88 : 0.65;
    } else if (has(ADVISOR_SIGNALS)) {
      intent      = 'luxury-advisor';
      needsDB     = false;
      needsRules  = false;
      needsGemini = true;
      confidence  = 0.8;
    } else if (has(CHECKOUT_SIGNALS)) {
      intent      = lower.includes('discount') || lower.includes('promo') || lower.includes('coupon')
                    ? 'apply-discount' : 'checkout-assistance';
      needsDB     = false;
      needsRules  = true;
      needsGemini = true; // V13: Always use Gemini
      confidence  = 0.95;
    } else if (has(GREETING_SIGNALS) && lower.length < 25) {
      intent      = 'general-chat';
      needsDB     = false;
      needsRules  = false;
      needsGemini = true;
      confidence  = 0.95;
    } else {
      // If memory has context, still search products (user is refining)
      const hasMemory = mergedBrands.length || mergedCategories.length || mergedBudget;
      intent      = hasMemory ? 'product-search' : 'luxury-advisor';
      needsDB     = !!hasMemory;
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
        brands:     mergedBrands,
        categories: mergedCategories,
        budget:     mergedBudget,
        materials:  mergedMaterials,
        colors:     mergedColors,
        // Raw new detections (for memory update)
        newBrands:     foundBrands,
        newCategories: foundCategories,
        newBudget:     budget,
        newMaterials:  materials,
        newColors:     colors,
      },
    };
  }
}

module.exports = new IntentDetectorService();
