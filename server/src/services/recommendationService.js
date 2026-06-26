// NexORA V9 — Recommendation Service (Deterministic Engine)
const Product = require('../models/Product');
const UserPreference = require('../models/UserPreference');
const mongoose = require('mongoose');

// ── In-Memory Product Pool Cache (5 min TTL) ───────────────────────────────
let productPoolCache = { data: null, timestamp: 0 };

const getProductPool = async () => {
  if (productPoolCache.data && Date.now() - productPoolCache.timestamp < 1000 * 60 * 5) {
    return productPoolCache.data;
  }
  const pool = await Product.find({
    'images.0': { $exists: true },
    isActive: true,
    stock: { $gt: 0 }
  }).populate('category', 'name').limit(200).lean();
  productPoolCache = { data: pool, timestamp: Date.now() };
  return pool;
};

// ── Deterministic Reason Badge Generator ──────────────────────────────────
const generateReasonBadge = (product, intent = {}) => {
  const catName = (product.category?.name || '').toLowerCase();
  const brand   = (product.brand || '').toLowerCase();
  const price   = product.price || 0;
  const rating  = product.ratings?.average || 0;
  const recipient = (intent?.recipient || '').toLowerCase();
  const occasion  = (intent?.occasion || '').toLowerCase();
  const purpose   = (intent?.purpose  || '').toLowerCase();

  // Occasion-based
  if (purpose === 'gift' || recipient) {
    if (recipient === 'ceo' || recipient === 'founder') return 'Perfect for Executives';
    if (recipient === 'partner') return 'A Gift of Distinction';
    if (recipient === 'client') return 'Impress Your Client';
    if (recipient === 'family') return 'Treasured by Loved Ones';
    return 'Curated Gift Selection';
  }

  // Brand prestige
  const swissBrands = ['rolex', 'omega', 'patek', 'audemars', 'breguet', 'iwc', 'vacheron', 'jaeger'];
  if (swissBrands.some(b => brand.includes(b))) return 'Swiss Craftsmanship';

  const frenchBrands = ['hermès', 'hermes', 'louis vuitton', 'lv', 'dior', 'cartier', 'chanel'];
  if (frenchBrands.some(b => brand.includes(b))) return 'French Luxury Heritage';

  const italianBrands = ['gucci', 'prada', 'versace', 'bulgari', 'bottega', 'ferragamo'];
  if (italianBrands.some(b => brand.includes(b))) return 'Italian Artisanship';

  const techBrands = ['apple', 'sony', 'bang', 'bose', 'samsung', 'bang & olufsen'];
  if (techBrands.some(b => brand.includes(b))) return 'Premium Technology';

  // Category-based
  if (catName.includes('watch')) {
    if (price > 500000) return 'Exceptional Investment Timepiece';
    if (price > 200000) return 'Collector\'s Grade Horology';
    return 'Executive Timekeeping';
  }
  if (catName.includes('bag') || catName.includes('handbag')) {
    if (price > 200000) return 'Iconic Investment Piece';
    return 'Signature Style Statement';
  }
  if (catName.includes('tech') || catName.includes('electronic')) return 'Cutting-Edge Innovation';
  if (catName.includes('jewel')) return 'Timeless Fine Jewellery';
  if (catName.includes('shoe') || catName.includes('footwear')) return 'Artisan Footwear';
  if (catName.includes('clo') || catName.includes('apparel')) return 'Refined Executive Wardrobe';

  // Price tier
  if (price > 500000) return 'Ultra-Luxury Collection';
  if (price > 200000) return 'Premium Investment Grade';
  if (price > 50000)  return 'Elevated Luxury Choice';

  // Rating fallback
  if (rating >= 4.8) return 'Highest Rated by Clients';

  return 'Curated Luxury Selection';
};

// ── Confidence Score Breakdown ─────────────────────────────────────────────
const generateConfidenceBreakdown = (product, pref, intent = {}) => {
  const matched = [];
  let score = 0;

  const catName = (product.category?.name || '').toLowerCase();
  const evalCategory = intent?.category || '';
  const evalBudget   = intent?.budget
    ? parseInt(String(intent.budget).replace(/[^0-9]/g, ''))
    : (pref?.budgets?.comfortRange?.max || pref?.budgets?.declared || 0);

  const prefBrandsKeys = pref?.preferredBrands 
    ? (pref.preferredBrands instanceof Map ? Array.from(pref.preferredBrands.keys()) : Object.keys(pref.preferredBrands))
    : [];

  const evalBrands   = [
    ...(intent?.preferredBrands || []),
    ...prefBrandsKeys,
    ...(pref?.brandsViewed?.map(bv => typeof bv === 'string' ? bv : bv.brand) || [])
  ].map(b => (typeof b === 'string' ? b.toLowerCase() : ''));

  // Category (40)
  let catMatch = false;
  if (evalCategory && catName.includes(evalCategory.toLowerCase())) {
    catMatch = true; score += 40; matched.push('Category Match');
  } else if (!evalCategory) {
    score += 20;
  }

  // Brand (20)
  let brandMatch = false;
  if (evalBrands.length > 0 && evalBrands.some(b => (product.brand || '').toLowerCase().includes(b))) {
    brandMatch = true; score += 20; matched.push('Brand Preference');
  }

  // Budget (15)
  let budgetMatch = false;
  if (evalBudget > 0 && product.price <= evalBudget) {
    budgetMatch = true; score += 15; matched.push('Within Budget');
  } else if (!evalBudget) {
    score += 10;
  }

  // Rating (10)
  const ratingScore = ((product.ratings?.average || 4.5) / 5.0) * 10;
  score += ratingScore;
  if ((product.ratings?.average || 0) >= 4.5) matched.push('Highly Rated');

  // View History (5)
  const pIdStr = product._id?.toString();
  if (pref && pIdStr) {
    const hasViewed   = pref.productsViewed?.some(id => id.toString() === pIdStr);
    const hasWishlist = pref.wishlisted?.some(id => id.toString() === pIdStr);
    if (hasViewed || hasWishlist) { score += 5; matched.push('In Your History'); }

    // Cart Affinity (5)
    const hasCart    = pref.productsAddedToCart?.some(id => id.toString() === pIdStr);
    const hasCheckout= pref.checkoutStarted?.some(id => id.toString() === pIdStr);
    const hasPurchase= pref.purchaseCompleted?.some(id => id.toString() === pIdStr);
    if (hasCart || hasCheckout || hasPurchase) { score += 5; matched.push('Cart Affinity'); }
  }

  // Gift Intent (5)
  const recipient = (intent?.recipient || '').toLowerCase();
  if (pref?.giftRecipients?.length > 0 || recipient) {
    let gScore = 0;
    if (pref?.giftRecipients?.length > 0) gScore += 0.3;
    if (pref?.giftFinderUsage > 0) gScore += 0.3;
    if (catName.includes('gift') || catName.includes('watch') || catName.includes('access')) gScore += 0.4;
    score += Math.min(gScore, 1) * 5;
    if (gScore >= 0.5) matched.push('Gift Suitability');
  }

  return {
    matchScore: Math.min(Math.round(score), 99),
    matchedBy: matched
  };
};

class RecommendationService {

  // ── Get Preferences ───────────────────────────────────────────────────────
  static async getPreferences(userId, sessionId) {
    if (userId) {
      const pref = await UserPreference.findOne({ userId });
      if (pref) return pref;
    }
    if (sessionId) return UserPreference.findOne({ sessionId });
    return null;
  }

  // ── Legacy score helper (kept for backward compat) ────────────────────────
  static calculateMatchScore(product, pref, intent = null) {
    return generateConfidenceBreakdown(product, pref, intent).matchScore;
  }

  // ── Homepage Recommendations ──────────────────────────────────────────────
  static async getHomepageRecommendations(userId, sessionId) {
    const pref = await this.getPreferences(userId, sessionId);
    const pool = (await getProductPool()).map(p => ({ ...p }));

    if (!pref || (pref.categoriesViewed.length === 0 && pref.brandsViewed.length === 0)) {
      return {
        recommendedForYou: pool.sort((a, b) => b.price - a.price).slice(0, 5),
        continueExploring: pool.slice(5, 10),
        executivePicks:    pool.filter(p => p.price > 100000).slice(0, 5),
        trendingLuxury:    pool.sort((a, b) => (b.ratings?.average || 0) - (a.ratings?.average || 0)).slice(0, 5),
        newArrivals:       pool.slice(10, 15),
        luxuryGifts:       pool.filter(p => p.price < 50000).slice(0, 5)
      };
    }

    pool.forEach(p => { p.matchScore = this.calculateMatchScore(p, pref); });
    pool.sort((a, b) => b.matchScore - a.matchScore);

    return {
      recommendedForYou: pool.slice(0, 5),
      continueExploring: pool.slice(5, 10),
      executivePicks:    pool.filter(p => p.price > 100000).slice(0, 5),
      trendingLuxury:    [...pool].sort((a, b) => (b.ratings?.average || 0) - (a.ratings?.average || 0)).slice(0, 5),
      newArrivals:       pool.slice(10, 15),
      luxuryGifts:       pool.filter(p => p.price < 50000).slice(0, 5)
    };
  }

  // ── Product Page Recommendations ──────────────────────────────────────────
  static async getProductRecommendations(productId, userId, sessionId) {
    const pref = await this.getPreferences(userId, sessionId);
    const source = await Product.findById(productId).populate('category');
    const pool = (await getProductPool())
      .filter(p => p._id.toString() !== productId.toString())
      .map(p => ({ ...p }));

    pool.forEach(p => {
      let score = 0;
      if (p.category?._id?.toString() === source.category?._id?.toString()) score += 40;
      if (p.brand === source.brand) score += 20;
      if (Math.abs(p.price - source.price) < 20000) score += 10;
      if (pref) score += this.calculateMatchScore(p, pref) * 0.3;
      p.matchScore = Math.min(Math.round(score), 99);
    });
    pool.sort((a, b) => b.matchScore - a.matchScore);

    return {
      frequentlyBoughtTogether: pool.slice(0, 4),
      premiumUpgrade: pool.filter(p => p.price > source.price).sort((a, b) => b.price - a.price).slice(0, 4),
      luxuryAlternatives: pool.filter(p => p.brand !== source.brand).slice(0, 4),
      becauseYouViewed: pool.filter(p => pref?.productsViewed?.some(id => id.toString() === p._id.toString())).slice(0, 4),
      similarStyle: pool.filter(p => p.category?._id?.toString() === source.category?._id?.toString()).slice(0, 4)
    };
  }

  // ── Concierge Recommendations (V9 — retrieve 20, rank, return top 5) ─────
  static async getConciergeRecommendations(queryText, intentMemory = {}, userId, sessionId) {
    const pref = await this.getPreferences(userId, sessionId);

    // Build targeted DB query using intent memory
    const dbQuery = {
      'images.0': { $exists: true },
      isActive: true,
      stock: { $gt: 0 }
    };

    // Apply budget filter at DB level
    const budget = intentMemory?.budget
      ? parseInt(String(intentMemory.budget).replace(/[^0-9]/g, ''))
      : null;
    if (budget && budget > 0) dbQuery.price = { $lte: budget };

    // Apply brand filter
    if (intentMemory?.brand) {
      dbQuery.brand = { $regex: intentMemory.brand, $options: 'i' };
    }

    // Text search on query
    let relevantProducts = [];
    if (queryText) {
      const keywords = queryText.split(' ')
        .map(w => w.replace(/[^a-zA-Z0-9]/g, ''))
        .filter(w => w.length > 2)
        .join(' ');
      if (keywords) {
        try {
          relevantProducts = await Product.find({ ...dbQuery, $text: { $search: keywords } })
            .populate('category', 'name').limit(30).lean();
        } catch (e) { /* text index may not match — fall through */ }
      }
    }

    // If text search < 10 results, supplement with direct query
    if (relevantProducts.length < 10) {
      const extra = await Product.find(dbQuery)
        .populate('category', 'name').sort('-ratings.average').limit(30).lean();
      // Merge without duplicates
      const seen = new Set(relevantProducts.map(p => p._id.toString()));
      extra.forEach(p => { if (!seen.has(p._id.toString())) relevantProducts.push(p); });
    }

    // Fallback: full pool
    if (relevantProducts.length === 0) {
      const pool = await getProductPool();
      relevantProducts = pool.slice(0, 20).map(p => ({ ...p }));
    }

    // Score all candidates (pool of up to 20–30)
    relevantProducts.forEach(p => {
      const { matchScore, matchedBy } = generateConfidenceBreakdown(p, pref, intentMemory);
      p.matchScore = matchScore;
      p.matchedBy  = matchedBy;
      p.reasonBadge = generateReasonBadge(p, intentMemory);
    });

    // Sort and take top 5
    relevantProducts.sort((a, b) => b.matchScore - a.matchScore);
    const top5 = relevantProducts.slice(0, 5);

    // Assign concierge rank labels
    const rankLabels = ['Top Recommendation', 'Best Value', 'Premium Choice', 'Alternative Pick', 'Explore More'];
    top5.forEach((p, i) => { p.conciergeRank = rankLabels[i] || 'Explore More'; });

    return top5;
  }

  // ── Pre-Chat Discovery ────────────────────────────────────────────────────
  static async getPreChatDiscovery(userId, sessionId) {
    const pref = await this.getPreferences(userId, sessionId);
    const pool = (await getProductPool()).map(p => ({ ...p }));

    if (pref) {
      pool.forEach(p => { p.matchScore = this.calculateMatchScore(p, pref); });
      pool.sort((a, b) => b.matchScore - a.matchScore);
    }

    const sorted = [...pool].sort((a, b) => (b.ratings?.average || 0) - (a.ratings?.average || 0));

    return {
      recommendedToday:    pool.slice(0, 4),
      ceoPicks:            pool.filter(p => p.price > 100000).slice(0, 4),
      trendingLuxury:      sorted.slice(0, 4),
      giftFinder:          pool.filter(p => p.price < 50000).slice(0, 4),
      executiveEssentials: pool.filter(p => {
        const cat = (p.category?.name || '').toLowerCase();
        return cat.includes('watch') || cat.includes('access') || cat.includes('tech');
      }).slice(0, 4),
      newArrivals:         pool.slice(10, 14)
    };
  }

  // ── Cart Recommendations ──────────────────────────────────────────────────
  static async getCartRecommendations(cartItems, userId, sessionId) {
    const pref = await this.getPreferences(userId, sessionId);
    const cartIds = cartItems.map(i => (i._id || i.product)?.toString());
    const pool = (await getProductPool()).filter(p => !cartIds.includes(p._id.toString())).map(p => ({ ...p }));

    const cartCategories = cartItems.map(i => (i.category?._id || i.category)?.toString()).filter(Boolean);
    const cartBrands     = cartItems.map(i => i.brand).filter(Boolean);
    const avgPrice       = cartItems.reduce((s, i) => s + (Number(i.price) || 0), 0) / (cartItems.length || 1);

    pool.forEach(p => {
      let score = 0;
      if (cartCategories.includes(p.category?._id?.toString())) score += 30;
      if (cartBrands.includes(p.brand)) score += 15;
      if (Math.abs(p.price - avgPrice) < avgPrice * 0.5) score += 15;
      if (pref) score += this.calculateMatchScore(p, pref) * 0.4;
      p.matchScore = Math.min(Math.round(score), 99);
    });
    pool.sort((a, b) => b.matchScore - a.matchScore);
    return pool.slice(0, 4);
  }

  // ── Checkout Suggestions (complementary — different category) ─────────────
  static async getCheckoutSuggestions(cartProductIds) {
    if (!cartProductIds || cartProductIds.length === 0) return [];

    const cartProducts = await Product.find({ _id: { $in: cartProductIds } }).populate('category', 'name').lean();
    const cartCatIds   = cartProducts.map(p => p.category?._id?.toString()).filter(Boolean);
    const avgPrice     = cartProducts.reduce((s, p) => s + p.price, 0) / (cartProducts.length || 1);

    // Fetch products NOT in the same category (complementary)
    const pool = (await getProductPool())
      .filter(p => !cartProductIds.includes(p._id.toString()))
      .filter(p => !cartCatIds.includes(p.category?._id?.toString()))
      .map(p => ({ ...p }));

    pool.forEach(p => {
      let score = (p.ratings?.average || 4) * 10;
      if (p.price <= avgPrice * 0.4) score += 20;   // accessories / smaller items
      if (p.isFeatured) score += 10;
      p.matchScore = Math.min(Math.round(score), 99);
      p.reasonBadge = generateReasonBadge(p);
    });
    pool.sort((a, b) => b.matchScore - a.matchScore);
    return pool.slice(0, 3);
  }

  // ── Post-Purchase Recommendations ─────────────────────────────────────────
  static async getPostPurchaseRecommendations(orderedProductIds) {
    if (!orderedProductIds || orderedProductIds.length === 0) return [];

    const orderedProducts = await Product.find({ _id: { $in: orderedProductIds } }).populate('category', 'name').lean();
    const orderedCatIds   = orderedProducts.map(p => p.category?._id?.toString()).filter(Boolean);

    const pool = (await getProductPool())
      .filter(p => !orderedProductIds.includes(p._id.toString()))
      .map(p => ({ ...p }));

    pool.forEach(p => {
      let score = 0;
      // Prefer complementary categories
      if (!orderedCatIds.includes(p.category?._id?.toString())) score += 20;
      score += (p.ratings?.average || 4) * 8;
      if (p.isFeatured || p.isBestSeller) score += 15;
      p.matchScore = Math.min(Math.round(score), 99);
      p.reasonBadge = generateReasonBadge(p);
    });
    pool.sort((a, b) => b.matchScore - a.matchScore);
    return pool.slice(0, 4);
  }

  // ── Comparable Products (for Compare Mode) ────────────────────────────────
  static async getComparableProducts(productIds) {
    return Product.find({ _id: { $in: productIds } }).populate('category', 'name').lean();
  }

  // ── Slow-Moving Inventory (Admin) ─────────────────────────────────────────
  static async getSlowMovingInventory() {
    const products = await Product.find({ isActive: true }).populate('category', 'name').lean();
    // Products with high stock but low sold ratio
    const scored = products.map(p => ({
      ...p,
      velocity: p.sold > 0 ? p.stock / p.sold : p.stock * 10 // higher = slower moving
    }));
    scored.sort((a, b) => b.velocity - a.velocity);
    return scored.slice(0, 20);
  }

  // ── Export helpers ────────────────────────────────────────────────────────
  static generateReasonBadge = generateReasonBadge;
  static generateConfidenceBreakdown = generateConfidenceBreakdown;
}

module.exports = RecommendationService;
