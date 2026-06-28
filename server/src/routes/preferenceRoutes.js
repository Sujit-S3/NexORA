const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { trackEvent, getHomepageRecommendations, getProductRecommendations, getCartRecommendations, getAnalytics, getConciergeDiscovery } = require('../controllers/preferenceController');

// Using an optional middleware to extract user if logged in
const optionalAuth = async (req, res, next) => {
  try {
    // If we wanted to parse JWT without rejecting if missing
    // We can do that here, but for now we'll just let the controller handle `req.user`
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      const token = req.headers.authorization.split(' ')[1];
      const jwt = require('jsonwebtoken');
      const User = require('../models/User');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    }
  } catch (error) { /* Ignore parsing errors, user remains unauthenticated */ }
  next();
};

router.post('/track', optionalAuth, trackEvent);
router.get('/homepage', optionalAuth, getHomepageRecommendations);
router.get('/pdp/:id', optionalAuth, getProductRecommendations);
router.post('/cart', optionalAuth, getCartRecommendations);
router.get('/analytics', optionalAuth, getAnalytics);
router.get('/concierge-discovery', optionalAuth, getConciergeDiscovery);

module.exports = router;
