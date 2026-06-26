// NexORA — Discount Routes
const express = require('express');
const router = express.Router();
const { getAllDiscounts, createDiscount, updateDiscount, deleteDiscount, validateDiscount } = require('../controllers/discountController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');

// Public
router.post('/validate', validateDiscount);

// Admin
router.get('/', protect, adminOnly, getAllDiscounts);
router.post('/', protect, adminOnly, createDiscount);
router.put('/:id', protect, adminOnly, updateDiscount);
router.delete('/:id', protect, adminOnly, deleteDiscount);

module.exports = router;
