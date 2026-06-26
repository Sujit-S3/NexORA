// NexORA — Shipping Routes
const express = require('express');
const router = express.Router();
const { getShippingZones, createShippingZone, updateShippingZone, deleteShippingZone } = require('../controllers/shippingController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');

router.get('/', getShippingZones);
router.post('/', protect, adminOnly, createShippingZone);
router.put('/:id', protect, adminOnly, updateShippingZone);
router.delete('/:id', protect, adminOnly, deleteShippingZone);

module.exports = router;
