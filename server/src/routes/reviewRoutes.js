// NexORA — Review Routes

const express = require('express');
const router = express.Router();
const { getProductReviews, addReview, editReview, deleteReview } = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');

// Public
router.get('/product/:productId', getProductReviews);

// Auth
router.post('/product/:productId', protect, addReview);
router.put('/:id', protect, editReview);

// Auth (own) or Admin
router.delete('/:id', protect, deleteReview);

module.exports = router;
