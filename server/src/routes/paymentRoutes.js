// NexORA — Payment Routes

const express = require('express');
const router = express.Router();
const { initiatePayment, verifyPayment, refundPayment, handleWebhook, getPaymentHistory, getAllPayments } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');

// Razorpay calls this server-to-server, authenticated via signature (not JWT).
router.post('/webhook', handleWebhook);

// Auth routes
router.post('/initiate', protect, initiatePayment);
router.post('/verify', protect, verifyPayment);
router.get('/history', protect, getPaymentHistory);

// Admin routes
router.get('/', protect, adminOnly, getAllPayments);
router.post('/:id/refund', protect, adminOnly, refundPayment);

module.exports = router;
