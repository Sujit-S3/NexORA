// NexORA V9 — AI Routes
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/aiController');
const { protect, optionalAuth }   = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');
const rateLimit     = require('express-rate-limit');

// ── Rate Limiters ─────────────────────────────────────────────────────────
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: { success: false, message: 'Too many AI requests. Please try again shortly.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const intentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20, // 20 intent extractions per minute
  message: { success: false, message: 'Rate limit exceeded.' },
});

router.use(aiLimiter);

// ── Public / User Endpoints ───────────────────────────────────────────────
// optionalAuth: resolves req.user for logged-in shoppers without requiring
// a session — anonymous visitors still get x-session-id-based personalization.
router.get('/health',             ctrl.getHealth);
router.post('/chat',              optionalAuth, ctrl.chat);
router.post('/intent',            intentLimiter, optionalAuth, ctrl.extractIntent);
router.post('/compare',           optionalAuth, ctrl.compareProducts);
router.post('/checkout-suggest',  optionalAuth, ctrl.getCheckoutSuggestions);
router.post('/post-purchase',     optionalAuth, ctrl.getPostPurchase);
router.post('/cart/recommend',    optionalAuth, ctrl.getCartRecommendations);

// ── Memory (V10) ─────────────────────────────────────────────────────────────
router.post('/memory/export',     optionalAuth, ctrl.exportMemory);
router.post('/memory/forget',     optionalAuth, ctrl.forgetMe);


// ── Admin Protected ───────────────────────────────────────────────────────
router.post('/test',              protect, adminOnly, ctrl.testAI);
router.post('/product/generate',  protect, adminOnly, ctrl.generateProductMetadata);
router.post('/reviews/analyze',   protect, adminOnly, ctrl.analyzeReviews);
router.post('/sales/analyze',     protect, adminOnly, ctrl.analyzeSales);
router.get('/analytics',          protect, adminOnly, ctrl.getAnalytics);

// ── Admin AI Studio ───────────────────────────────────────────────────────
router.post('/admin/studio', protect, adminOnly, ctrl.adminStudio);

module.exports = router;
