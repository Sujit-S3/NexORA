// NexORA — Setting Routes
const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');

router.get('/', getSettings);
router.put('/', protect, adminOnly, updateSettings);

module.exports = router;
