// NexORA — Admin Routes

const express = require('express');
const router = express.Router();
const { getDashboardStats, seedDatabase } = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');

// ── Admin-only routes ────────────────────────────────────────────────────
router.get('/dashboard', protect, adminOnly, getDashboardStats);
router.post('/seed', protect, adminOnly, seedDatabase);

module.exports = router;
