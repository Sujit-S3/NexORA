const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');
const { trackEvent, getHomepageRecommendations, getProductRecommendations, getCartRecommendations, getAnalytics, getConciergeDiscovery } = require('../controllers/preferenceController');

router.post('/track', optionalAuth, trackEvent);
router.get('/homepage', optionalAuth, getHomepageRecommendations);
router.get('/pdp/:id', optionalAuth, getProductRecommendations);
router.post('/cart', optionalAuth, getCartRecommendations);
// Aggregate business analytics — admin only, not per-visitor personalization.
router.get('/analytics', protect, adminOnly, getAnalytics);
router.get('/concierge-discovery', optionalAuth, getConciergeDiscovery);

module.exports = router;
