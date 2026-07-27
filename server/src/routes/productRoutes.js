// NexORA — Product Routes

const express = require('express');
const router = express.Router();
const {
  getProducts,
  getFeaturedProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImages,
  deleteProductImage,
} = require('../controllers/productController');
const { protect, optionalAuth } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');
const { upload } = require('../middleware/upload');

// ── Public routes ────────────────────────────────────────────────────────
router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
// optionalAuth: populates req.user when a valid token is present, without
// requiring one — needed so getProductBySlug can personalize fit recommendations.
router.get('/:slug', optionalAuth, getProductBySlug);

// ── Admin-only routes ────────────────────────────────────────────────────
router.post('/', protect, adminOnly, createProduct);
router.put('/:id', protect, adminOnly, updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);
router.post('/:id/images', protect, adminOnly, upload.array('images', 10), uploadProductImages);
router.delete('/:id/images/:publicId', protect, adminOnly, deleteProductImage);

module.exports = router;
