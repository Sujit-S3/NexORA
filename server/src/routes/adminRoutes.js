// NexORA — Admin Routes

const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');

// ── Admin-only routes ────────────────────────────────────────────────────
router.get('/dashboard', protect, adminOnly, getDashboardStats);

module.exports = router;
