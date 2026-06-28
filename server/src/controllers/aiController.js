// NexORA V9 — AI Controller
const aiService = require('../services/aiService');
const Product   = require('../models/Product');
const Order     = require('../models/Order');
const UserPreference = require('../models/UserPreference');

// ── Health Check ──────────────────────────────────────────────────────────
// GET /api/ai/health
exports.getHealth = async (req, res, next) => {
  try {
    const featureFlags = require('../config/featureFlags');
    const aiCache = require('../services/ai/cache');
    const kpiTracker = require('../services/ai/utils/kpiTracker');
    
    // Check if the underlying Google API can be reached (ping)
    const aiService = require('../services/aiService');
    const systemHealth = await aiService.checkHealth();

    const healthData = {
      status: featureFlags.aiCommerce ? 'ONLINE' : 'OFFLINE',
      // ✅ Explicit availability flag for the Concierge UI
      available: featureFlags.aiCommerce && systemHealth?.status !== 'ERROR',
      model: 'gemini-2.5-flash',
      infrastructure: systemHealth,
      metrics: kpiTracker.getMetrics(),
      cache: {
        status: featureFlags.cachingEnabled ? 'ACTIVE' : 'INACTIVE',
        catalogVersion: aiCache.CATALOG_VERSION,
        itemsCached: aiCache.cache ? aiCache.cache.size : 0,
      },
      flags: featureFlags,
    };

    res.json({ success: true, data: healthData });
  } catch (err) { next(err); }
};

// ── Test Connection (Admin) ───────────────────────────────────────────────
// POST /api/ai/test
exports.testAI = async (req, res, next) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {return res.status(400).json({ success: false, message: 'Prompt is required' });}
    const result = await aiService.testConnection(prompt);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

// ── Intent Extraction ─────────────────────────────────────────────────────
// POST /api/ai/intent
exports.extractIntent = async (req, res, next) => {
  try {
    const { message, memory } = req.body;
    if (!message) {return res.status(400).json({ success: false, message: 'Message is required' });}
    const intent = await aiService.extractIntent(message, memory || {});
    res.json({ success: true, data: intent });
  } catch (err) { next(err); }
};

// ── Chat Concierge Stream ────────────────────────────────────────────────
// POST /api/ai/chat
exports.chat = async (req, res, next) => {
  try {
    const { message, history, memory, cartItems, wishlistIds } = req.body;
    const userId    = req.user ? req.user._id : null;
    const sessionId = req.headers['x-session-id'] || null;

    if (!message) {return res.status(400).json({ success: false, message: 'Message is required' });}

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    // Track AI session analytics
    if (userId || sessionId) {
      UserPreference.findOneAndUpdate(
        userId ? { userId } : { sessionId },
        { $inc: { aiSessionsOpened: 1, aiMessagesSent: 1 }, $set: { lastActivity: new Date() } },
        { upsert: true, new: true },
      ).catch(() => {});
    }

    const pipelineService = require('../services/ai/pipeline');
    const featureFlags = require('../config/featureFlags');

    if (!featureFlags.aiCommerce) {
      res.write(`data: ${JSON.stringify({ error: true, text: 'The AI Concierge is currently offline for upgrades.' })}\n\n`);
      return res.end();
    }

    await pipelineService.processRequest(
      message, req.user, req.headers, history || [], memory || {}, res,
    );
  } catch (err) {
    console.error('Chat stream outer error:', err);
    if (!res.headersSent) {return next(err);}
    res.write(`data: ${JSON.stringify({ error: 'Connection interrupted' })}\n\n`);
    res.end();
  }
};


// ── Compare Products ──────────────────────────────────────────────────────
// POST /api/ai/compare
exports.compareProducts = async (req, res, next) => {
  try {
    const { productIds } = req.body;
    if (!productIds || productIds.length < 2) {
      return res.status(400).json({ success: false, message: 'Provide at least 2 product IDs' });
    }
    const userId  = req.user ? req.user._id : null;
    const result  = await aiService.generateComparison(productIds, userId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

// ── Checkout Suggestions ──────────────────────────────────────────────────
// POST /api/ai/checkout-suggest
exports.getCheckoutSuggestions = async (req, res, next) => {
  try {
    const { cartProductIds } = req.body;
    const userId = req.user ? req.user._id : null;
    const suggestions = await aiService.getCheckoutSuggestions(cartProductIds || [], userId);
    res.json({ success: true, data: suggestions });
  } catch (err) { next(err); }
};

// ── Post-Purchase Package ─────────────────────────────────────────────────
// POST /api/ai/post-purchase
exports.getPostPurchase = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const userId = req.user ? req.user._id : null;

    // Track purchase analytics
    if (userId) {
      UserPreference.findOneAndUpdate(
        { userId },
        { $inc: { aiOrdersCompleted: 1 } },
        { upsert: true },
      ).catch(() => {});
    }

    const result = await aiService.getPostPurchasePackage(orderId, userId);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

// ── Product Metadata (SEO) ────────────────────────────────────────────────
// POST /api/ai/product/generate
exports.generateProductMetadata = async (req, res, next) => {
  try {
    const { productId } = req.body;
    if (!productId) {return res.status(400).json({ success: false, message: 'Product ID required' });}
    const product  = await Product.findById(productId);
    if (!product)  {return res.status(404).json({ success: false, message: 'Product not found' });}
    const metadata = await aiService.generateProductMetadata(product, req.user._id);
    res.json({ success: true, data: metadata });
  } catch (err) { next(err); }
};

// ── Review Analysis ───────────────────────────────────────────────────────
// POST /api/ai/reviews/analyze
exports.analyzeReviews = async (req, res, next) => {
  try {
    const { productId } = req.body;
    if (!productId) {return res.status(400).json({ success: false, message: 'Product ID required' });}
    const product  = await Product.findById(productId).populate('reviews.user', 'name');
    if (!product)  {return res.status(404).json({ success: false, message: 'Product not found' });}
    const analysis = await aiService.analyzeReviews(product.reviews, req.user._id);
    res.json({ success: true, data: analysis });
  } catch (err) { next(err); }
};

// ── Cart Recommendations ──────────────────────────────────────────────────
// POST /api/ai/cart/recommend
exports.getCartRecommendations = async (req, res, next) => {
  try {
    const { cartItems } = req.body;
    const userId = req.user ? req.user._id : null;
    const recs = await aiService.generateCartRecommendations(cartItems, userId);
    res.json({ success: true, data: recs });
  } catch (err) { next(err); }
};

// ── Sales Analysis ────────────────────────────────────────────────────────
// POST /api/ai/sales/analyze
exports.analyzeSales = async (req, res, next) => {
  try {
    const { salesData, query } = req.body;
    if (!query) {return res.status(400).json({ success: false, message: 'Query is required' });}
    const analysis = await aiService.analyzeSales(salesData, query, req.user._id);
    res.json({ success: true, data: analysis });
  } catch (err) { next(err); }
};

// ── AI Analytics ──────────────────────────────────────────────────────────
// GET /api/ai/analytics
exports.getAnalytics = async (req, res, next) => {
  try {
    const analytics = await aiService.getAIAnalytics();
    res.json({ success: true, data: analytics });
  } catch (err) { next(err); }
};

// ── Admin AI Studio (Unified) ────────────────────────────────────────────────
// POST /api/ai/admin/studio
exports.adminStudio = async (req, res, next) => {
  try {
    const { tool, payload } = req.body;
    if (!tool) {return res.status(400).json({ success: false, message: 'Tool identifier required' });}
    
    const result = await aiService.runAdminStudioTool(tool, payload, req.user._id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

// ── Memory Export (V10) ──────────────────────────────────────────────────
// POST /api/ai/memory/export
exports.exportMemory = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const sessionId = req.headers['x-session-id'];
    const { format = 'json' } = req.body;
    const pref = userId
      ? await UserPreference.findOne({ userId }).lean()
      : await UserPreference.findOne({ sessionId }).lean();

    const profileData = pref || {};
    
    if (format === 'markdown' || format === 'html') {
      const budgetText = profileData.budgets?.declared 
        ? `$${profileData.budgets.declared}` 
        : (profileData.budgets?.comfortRange?.max ? `$${profileData.budgets.comfortRange.min} - $${profileData.budgets.comfortRange.max}` : 'Unknown');

      const md = `
# NexORA — Luxury AI Concierge Export
**Generated On:** ${new Date().toLocaleString()}
**Session ID:** ${sessionId || 'N/A'}
**Model Configuration:** Gemini 3.1 Pro (Luxury Concierge Persona)

---

## Your Shopping Profile

- **Luxury Level:** ${profileData.luxuryLevel || 3}/5
- **Price Sensitivity:** ${profileData.priceSensitivity || 'Luxury'}
- **Observed Budget:** ${budgetText}
- **Style Preference:** ${profileData.stylePreference || 'Unspecified'}

### Interests & Preferences
- **Preferred Brands:** ${Object.keys(profileData.preferredBrands || {}).join(', ') || 'None explicitly captured'}
- **Favorite Colors:** ${profileData.favoriteColors?.join(', ') || 'None explicitly captured'}
- **Preferred Materials:** ${profileData.preferredMaterials?.join(', ') || 'None explicitly captured'}
- **Occasions:** ${profileData.occasions?.join(', ') || 'None explicitly captured'}

---
*Note: This data is securely stored and exclusively used to personalize your luxury shopping experience. To permanently erase this profile, use the "Forget Me" function.*
`;
      if (format === 'html') {
        const html = `<html><head><title>NexORA AI Export</title><style>body{font-family:sans-serif;line-height:1.6;padding:2rem;max-width:800px;margin:auto;}</style></head><body>
          <h1>NexORA — Luxury AI Concierge Export</h1>
          <p><strong>Generated On:</strong> ${new Date().toLocaleString()}<br>
          <strong>Session ID:</strong> ${sessionId || 'N/A'}<br>
          <strong>Model Configuration:</strong> Gemini 3.1 Pro</p>
          <hr>
          <h2>Your Shopping Profile</h2>
          <ul>
            <li><strong>Luxury Level:</strong> ${profileData.luxuryLevel || 3}/5</li>
            <li><strong>Price Sensitivity:</strong> ${profileData.priceSensitivity || 'Luxury'}</li>
            <li><strong>Observed Budget:</strong> ${budgetText}</li>
            <li><strong>Style Preference:</strong> ${profileData.stylePreference || 'Unspecified'}</li>
          </ul>
        </body></html>`;
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', 'attachment; filename="nexora-memory-export.html"');
        return res.send(html);
      } else {
        res.setHeader('Content-Type', 'text/markdown');
        res.setHeader('Content-Disposition', 'attachment; filename="nexora-memory-export.md"');
        return res.send(md);
      }
    }

    // Default JSON
    const exportData = {
      exportedAt: new Date().toISOString(),
      platform: 'NexORA',
      model: 'Gemini 3.1 Pro',
      profile: profileData,
      note: 'This is all the preference data NexORA has stored about your shopping session.',
    };
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="nexora-memory-export.json"');
    res.json(exportData);
  } catch (err) { next(err); }
};

// ── Forget Me / GDPR (V10) ────────────────────────────────────────────────
// POST /api/ai/memory/forget
exports.forgetMe = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const sessionId = req.headers['x-session-id'];
    if (userId) {
      await UserPreference.findOneAndDelete({ userId });
    } else if (sessionId) {
      await UserPreference.findOneAndDelete({ sessionId });
    }
    res.json({ success: true, message: 'Your preference data has been permanently deleted.' });
  } catch (err) { next(err); }
};
