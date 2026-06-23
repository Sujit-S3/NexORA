// NexORA — Payment Routes

const express = require('express');
const router = express.Router();
const { initiatePayment, verifyPayment, getPaymentHistory, getAllPayments } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');

// Auth routes
router.post('/initiate', protect, initiatePayment);
router.post('/verify', protect, verifyPayment);
router.get('/history', protect, getPaymentHistory);

// Admin routes
router.get('/', protect, adminOnly, getAllPayments);

module.exports = router;
