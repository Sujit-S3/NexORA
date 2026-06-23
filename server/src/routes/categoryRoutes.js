// NexORA — Category Routes

const express = require('express');
const router = express.Router();
const {
  getCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');
const { upload } = require('../middleware/upload');

// ── Public routes ────────────────────────────────────────────────────────
router.get('/', getCategories);
router.get('/:slug', getCategoryBySlug);

// ── Admin-only routes ────────────────────────────────────────────────────
router.post('/', protect, adminOnly, upload.single('image'), createCategory);
router.put('/:id', protect, adminOnly, upload.single('image'), updateCategory);
router.delete('/:id', protect, adminOnly, deleteCategory);

module.exports = router;
