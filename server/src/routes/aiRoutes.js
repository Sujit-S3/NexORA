// NexORA V9 — AI Routes
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/aiController');
const { protect }   = require('../middleware/auth');
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
router.get('/health',             ctrl.getHealth);
router.post('/chat',              ctrl.chat);
router.post('/intent',            intentLimiter, ctrl.extractIntent);
router.post('/compare',           ctrl.compareProducts);
router.post('/checkout-suggest',  ctrl.getCheckoutSuggestions);
router.post('/post-purchase',     ctrl.getPostPurchase);
router.post('/cart/recommend',    ctrl.getCartRecommendations);

// ── Memory (V10) ─────────────────────────────────────────────────────────────
router.post('/memory/export',     ctrl.exportMemory);
router.post('/memory/forget',     ctrl.forgetMe);


// ── Admin Protected ───────────────────────────────────────────────────────
router.post('/test',              protect, adminOnly, ctrl.testAI);
router.post('/product/generate',  protect, adminOnly, ctrl.generateProductMetadata);
router.post('/reviews/analyze',   protect, adminOnly, ctrl.analyzeReviews);
router.post('/sales/analyze',     protect, adminOnly, ctrl.analyzeSales);
router.get('/analytics',          protect, adminOnly, ctrl.getAnalytics);

// ── Admin AI Studio ───────────────────────────────────────────────────────
router.post('/admin/studio', protect, adminOnly, ctrl.adminStudio);

module.exports = router;
