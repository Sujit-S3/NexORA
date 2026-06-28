const UserPreference = require('../models/UserPreference');
const RecommendationService = require('../services/recommendationService');

// POST /api/preferences/track
exports.trackEvent = async (req, res) => {
  try {
    const { sessionId, event, data } = req.body;
    const userId = req.user ? req.user._id : null;
    
    if (!sessionId && !userId) {return res.status(400).json({ success: false, message: 'No identifier provided' });}

    let pref = await RecommendationService.getPreferences(userId, sessionId);
    
    if (!pref) {
      pref = new UserPreference({
        userId,
        sessionId: userId ? null : sessionId, // only need sessionId if guest
      });
    }

    // Process event
    switch (event) {
      case 'view_product':
        if (data.productId && !pref.productsViewed.includes(data.productId)) {
          pref.productsViewed.push(data.productId);
          if (pref.productsViewed.length > 50) {pref.productsViewed.shift();} // keep last 50
        }
        if (data.brand && !pref.brandsViewed.includes(data.brand)) {
          pref.brandsViewed.push(data.brand);
        }
        break;
      case 'view_category':
        if (data.categoryId && !pref.categoriesViewed.includes(data.categoryId)) {
          pref.categoriesViewed.push(data.categoryId);
        }
        break;
      case 'add_to_cart':
        if (data.productId && !pref.productsAddedToCart.includes(data.productId)) {
          pref.productsAddedToCart.push(data.productId);
        }
        break;
      case 'wishlist':
        if (data.productId && !pref.wishlisted.includes(data.productId)) {
          pref.wishlisted.push(data.productId);
        }
        break;
      case 'checkout_started':
        if (data.productId && !pref.checkoutStarted.includes(data.productId)) {
          pref.checkoutStarted.push(data.productId);
        }
        break;
      case 'purchase_completed':
        if (data.productId && !pref.purchaseCompleted.includes(data.productId)) {
          pref.purchaseCompleted.push(data.productId);
        }
        break;
      case 'concierge_intent':
        if (data.intent && !pref.conciergeIntents.includes(data.intent)) {
          pref.conciergeIntents.push(data.intent);
        }
        break;
      case 'gift_finder':
        // budgets is an object (V10.6 schema) not an array
        if (data.budget) {
          const budgetNum = parseInt(String(data.budget).replace(/[^0-9]/g, '')) || null;
          if (budgetNum && !pref.budgets?.declared) {
            pref.budgets = pref.budgets || {};
            pref.budgets.declared = budgetNum;
          }
        }
        if (data.personality && !pref.personalities.includes(data.personality)) {pref.personalities.push(data.personality);}
        if (data.recipient && !pref.giftRecipients.includes(data.recipient)) {pref.giftRecipients.push(data.recipient);}
        pref.giftFinderUsage = (pref.giftFinderUsage || 0) + 1;
        break;
    }

    pref.lastActivity = Date.now();
    await pref.save();

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Preference tracking error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/preferences/homepage
exports.getHomepageRecommendations = async (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'];
    const userId = req.user ? req.user._id : null;
    
    const recs = await RecommendationService.getHomepageRecommendations(userId, sessionId);
    res.status(200).json({ success: true, data: recs });
  } catch (err) {
    console.error('Homepage rec error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/preferences/pdp/:id
exports.getProductRecommendations = async (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'];
    const userId = req.user ? req.user._id : null;
    
    const recs = await RecommendationService.getProductRecommendations(req.params.id, userId, sessionId);
    res.status(200).json({ success: true, data: recs });
  } catch (err) {
    console.error('PDP rec error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/preferences/cart
exports.getCartRecommendations = async (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'];
    const userId = req.user ? req.user._id : null;
    const { cartItems } = req.body;
    
    if (!cartItems || cartItems.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    const recs = await RecommendationService.getCartRecommendations(cartItems, userId, sessionId);
    res.status(200).json({ success: true, data: recs });
  } catch (err) {
    console.error('Cart rec error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/preferences/concierge-discovery
exports.getConciergeDiscovery = async (req, res) => {
  try {
    const sessionId = req.headers['x-session-id'];
    const userId = req.user ? req.user._id : null;
    
    const recs = await RecommendationService.getPreChatDiscovery(userId, sessionId);
    res.status(200).json({ success: true, data: recs });
  } catch (err) {
    console.error('Concierge discovery error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/preferences/analytics
exports.getAnalytics = async (req, res) => {
  try {
    const preferences = await UserPreference.find().lean();
    
    const totalProfiles = preferences.length;
    const popularBrands = {};
    const popularCategories = {};
    const popularBudgets = {};
    const popularPersonalities = {};
    const popularRecipients = {};
    const popularConciergeIntents = {};
    const mostViewed = {};
    const mostAddedToCart = {};
    
    let totalBudget = 0;
    let budgetCount = 0;

    preferences.forEach(p => {
      if (p.brandsViewed) {p.brandsViewed.forEach(b => popularBrands[b] = (popularBrands[b] || 0) + 1);}
      if (p.categoriesViewed) {p.categoriesViewed.forEach(c => popularCategories[c] = (popularCategories[c] || 0) + 1);}
      // budgets is an object {declared, observedAvg, maxPurchase, comfortRange} (V10.6 schema \u2014 not an array)
      if (p.budgets?.declared) {
        const key = `under_${p.budgets.declared}`;
        popularBudgets[key] = (popularBudgets[key] || 0) + 1;
        totalBudget += Number(p.budgets.declared) || 0;
        budgetCount++;
      }
      if (p.personalities) {p.personalities.forEach(pe => popularPersonalities[pe] = (popularPersonalities[pe] || 0) + 1);}
      if (p.giftRecipients) {p.giftRecipients.forEach(r => popularRecipients[r] = (popularRecipients[r] || 0) + 1);}
      if (p.conciergeIntents) {p.conciergeIntents.forEach(i => popularConciergeIntents[i] = (popularConciergeIntents[i] || 0) + 1);}
      
      if (p.productsViewed) {p.productsViewed.forEach(id => mostViewed[id] = (mostViewed[id] || 0) + 1);}
      if (p.productsAddedToCart) {p.productsAddedToCart.forEach(id => mostAddedToCart[id] = (mostAddedToCart[id] || 0) + 1);}
    });

    const averageBudget = budgetCount > 0 ? Math.round(totalBudget / budgetCount) : 0;

    res.status(200).json({
      success: true,
      data: {
        totalProfiles,
        averageBudget,
        popularBrands,
        popularCategories,
        popularBudgets,
        popularPersonalities,
        popularRecipients,
        popularConciergeIntents,
        mostViewed,
        mostAddedToCart,
      },
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/preferences/concierge-discovery
// Returns curated trending products to populate the Concierge pre-chat discovery grid
exports.getConciergeDiscovery = async (req, res) => {
  try {
    const Product = require('../models/Product');
    const [trending, newArrivals] = await Promise.all([
      Product.find({ isActive: true, stock: { $gt: 0 } })
        .sort({ 'ratings.count': -1, 'ratings.average': -1 })
        .limit(6)
        .select('name brand slug price discountPrice images category ratings stock'),
      Product.find({ isActive: true, stock: { $gt: 0 } })
        .sort({ createdAt: -1 })
        .limit(4)
        .select('name brand slug price discountPrice images category ratings stock'),
    ]);
    res.status(200).json({
      success: true,
      data: { trending, newArrivals },
    });
  } catch (err) {
    console.error('Concierge discovery error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
