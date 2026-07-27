// NexORA — Discount Routes
const express = require('express');
const router = express.Router();
const { getAllDiscounts, createDiscount, updateDiscount, deleteDiscount, validateDiscount } = require('../controllers/discountController');
const { protect, optionalAuth } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');
const { authLimiter } = require('../middleware/rateLimiter');

// Public — optionalAuth so the per-user "already used" reuse check can
// actually run for logged-in shoppers; still works for anonymous guests.
router.post('/validate', authLimiter, optionalAuth, validateDiscount);

// Admin
router.get('/', protect, adminOnly, getAllDiscounts);
router.post('/', protect, adminOnly, createDiscount);
router.put('/:id', protect, adminOnly, updateDiscount);
router.delete('/:id', protect, adminOnly, deleteDiscount);

module.exports = router;
