// NexORA — Route Aggregator
// Mounts all API routers under /api

const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const productRoutes = require('./productRoutes');
const categoryRoutes = require('./categoryRoutes');
const cartRoutes = require('./cartRoutes');
const orderRoutes = require('./orderRoutes');
const reviewRoutes = require('./reviewRoutes');
const paymentRoutes = require('./paymentRoutes');
const adminRoutes = require('./adminRoutes');
const discountRoutes = require('./discountRoutes');
const settingRoutes = require('./settingRoutes');
const shippingRoutes = require('./shippingRoutes');
const aiRoutes = require('./aiRoutes');
const preferenceRoutes = require('./preferenceRoutes');
const wishlistRoutes = require('./wishlistRoutes');
const contactRoutes = require('./contactRoutes');

// Health check — reports DB connectivity so an outage doesn't read as healthy
router.get('/health', (req, res) => {
  const dbState = mongoose.connection.readyState; // 1 = connected
  const dbConnected = dbState === 1;

  res.status(dbConnected ? 200 : 503).json({
    success: dbConnected,
    message: dbConnected ? 'NexORA API is running' : 'NexORA API is running but the database is unreachable',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV,
    db: dbConnected ? 'connected' : 'disconnected',
  });
});

// TEMPORARY — production trust-proxy verification (NexORA hardening Phase 2).
// Deployed solely to empirically confirm how many reverse-proxy hops sit
// between the client and this app (Render's docs confirm Cloudflare sits in
// front of Render's own load balancer, but not the resulting X-Forwarded-For
// shape), per the official express-rate-limit method: hit this, compare
// reqIp to your real IP, adjust `trust proxy` until they match. No auth data,
// no secrets — only IP/header plumbing already visible to any client via its
// own request. Removed once the correct hop count is confirmed and hardcoded.
router.get('/debug/ip', (req, res) => {
  res.json({
    reqIp: req.ip,
    reqIps: req.ips,
    xForwardedFor: req.headers['x-forwarded-for'] || null,
    xForwardedProto: req.headers['x-forwarded-proto'] || null,
    xForwardedHost: req.headers['x-forwarded-host'] || null,
    socketRemoteAddress: req.socket.remoteAddress,
    trustProxySetting: req.app.get('trust proxy'),
  });
});

// Mount routers
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/reviews', reviewRoutes);
router.use('/payments', paymentRoutes);
router.use('/admin', adminRoutes);
router.use('/discounts', discountRoutes);
router.use('/settings', settingRoutes);
router.use('/shipping', shippingRoutes);
router.use('/ai', aiRoutes);
router.use('/preferences', preferenceRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/contact', contactRoutes);

module.exports = router;

