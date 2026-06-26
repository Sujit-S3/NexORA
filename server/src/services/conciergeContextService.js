// NexORA V10 — Concierge Context Service
// Intent-aware retrieval: only fetch what the skill needs.
// Rule 1: MongoDB is the source of truth. Gemini only reasons over retrieved data.

const Cart     = require('../models/Cart');
const Order    = require('../models/Order');
const Discount = require('../models/Discount');
const User     = require('../models/User');
const UserPreference = require('../models/UserPreference');

// ─────────────────────────────────────────────────────────────────────────────
// Intent → Required Context Mapping
// ─────────────────────────────────────────────────────────────────────────────
const SKILL_CONTEXT_MAP = {
  // Pure product discovery — needs products + inventory only
  'product-search':       ['products', 'inventory'],
  'ceo-collection':       ['products', 'inventory'],
  'occasion-shopping':    ['products', 'inventory'],
  'outfit-builder':       ['products', 'inventory'],
  'new-arrivals':         ['products', 'inventory'],
  'luxury-advisor':       ['products', 'inventory'],
  'personalized-recs':    ['products', 'inventory', 'memory'],

  // Needs discounts context
  'budget-planner':       ['products', 'inventory', 'discounts'],
  'checkout-assistant':   ['cart', 'discounts'],
  'gift-finder':          ['products', 'inventory', 'discounts'],
  'upsell':               ['products', 'cart', 'discounts'],

  // Cart-aware skills
  'cart-advisor':         ['cart', 'products', 'discounts'],
  'wishlist-advisor':     ['wishlist', 'products'],
  'compare-products':     ['products', 'inventory'],

  // Order-aware skills
  'order-assistance':     ['orders'],
  'warranty':             ['orders', 'memory'],
  'care-guide':           ['orders', 'memory'],
  'post-purchase':        ['orders', 'products', 'memory'],
  'product-education':    ['products', 'inventory'],

  // Generic fallback
  'general':              ['products', 'inventory', 'memory'],
};

// ─────────────────────────────────────────────────────────────────────────────
// Detect which skill/context a message requires
// ─────────────────────────────────────────────────────────────────────────────
exports.detectSkillFromMessage = (message = '', intentMemory = {}) => {
  const msg = message.toLowerCase();

  // Order / Post-purchase
  if (/\b(my order|order status|track|delivery|shipped|cancel order|return|refund)\b/.test(msg)) return 'order-assistance';
  if (/\b(warranty|guarantee|repair|service center|authorised)\b/.test(msg)) return 'warranty';
  if (/\b(care|clean|maintain|store|polish|condition|dust bag)\b/.test(msg)) return 'care-guide';
  if (/\b(after purchase|post purchase|just bought|received my)\b/.test(msg)) return 'post-purchase';

  // Cart / Checkout
  if (/\b(my cart|in my cart|cart total|checkout|apply|coupon|promo code|discount code|gift card)\b/.test(msg)) {
    if (/\b(coupon|promo|discount|code|gift card)\b/.test(msg)) return 'checkout-assistant';
    return 'cart-advisor';
  }

  // Wishlist
  if (/\b(wishlist|saved|favourite|want list)\b/.test(msg)) return 'wishlist-advisor';

  // Comparison
  if (/\b(compare|versus|vs\b|difference between|better than|which one)\b/.test(msg)) return 'compare-products';

  // Gift
  if (/\b(gift|present|giving|surprise|anniversary|birthday|wedding|for (him|her|them|ceo|boss|friend|family|wife|husband))\b/.test(msg)) return 'gift-finder';

  // CEO / Executive
  if (/\b(ceo|executive|founder|chairman|board|corporate|C-suite)\b/.test(msg)) return 'ceo-collection';

  // Occasion
  if (/\b(occasion|formal|event|gala|black tie|wedding|office|travel|holiday)\b/.test(msg)) return 'occasion-shopping';

  // Budget
  if (/\b(budget|under|within|afford|how much|price range|₹|lakhs?|thousand)\b/.test(msg)) return 'budget-planner';

  // Education
  if (/\b(tell me about|what is|explain|history of|how is|made of|material|movement|mechanism)\b/.test(msg)) return 'product-education';

  // Outfit
  if (/\b(outfit|pair with|wear with|style|look|combination|matching)\b/.test(msg)) return 'outfit-builder';

  // Luxury advisor
  if (/\b(luxury|heritage|iconic|investment|collector|connoisseur|rare|exclusive|bespoke)\b/.test(msg)) return 'luxury-advisor';

  // Upsell signals
  if (/\b(similar|alternative|upgrade|better|premium|higher end|next level)\b/.test(msg)) return 'upsell';

  // Personalized (returning user with memory)
  if (intentMemory?.preferredBrands?.length || intentMemory?.category) return 'personalized-recs';

  return 'product-search';
};

// ─────────────────────────────────────────────────────────────────────────────
// Individual retrieval functions
// ─────────────────────────────────────────────────────────────────────────────

const retrieveCart = async (userId, clientCartItems = []) => {
  if (!userId) {
    // Guest: use client-provided cart summary
    return { items: clientCartItems, itemCount: clientCartItems.length, totalPrice: clientCartItems.reduce((s, i) => s + (i.price || 0) * (i.quantity || 1), 0) };
  }
  const cart = await Cart.findOne({ user: userId }).populate('items.product', 'name brand price discountPrice category images stock').lean();
  if (!cart) return { items: [], itemCount: 0, totalPrice: 0 };
  return {
    items: cart.items.map(i => ({
      name: i.product?.name, brand: i.product?.brand,
      price: i.price, quantity: i.quantity,
      image: i.product?.images?.[0]?.url
    })),
    itemCount: cart.items.reduce((s, i) => s + i.quantity, 0),
    totalPrice: cart.items.reduce((s, i) => s + i.price * i.quantity, 0)
  };
};

const retrieveWishlist = async (userId, clientWishlistIds = []) => {
  if (!userId) return { count: clientWishlistIds.length, productIds: clientWishlistIds };
  const user = await User.findById(userId).select('wishlist').populate('wishlist', 'name brand price category images').lean();
  return {
    count: user?.wishlist?.length || 0,
    items: (user?.wishlist || []).map(p => ({ name: p.name, brand: p.brand, price: p.price }))
  };
};

const retrieveRecentOrders = async (userId, limit = 2) => {
  if (!userId) return [];
  const orders = await Order.find({ user: userId })
    .sort('-createdAt')
    .limit(limit)
    .populate('items.product', 'name brand category')
    .lean();
  return orders.map(o => ({
    orderNumber: o.orderNumber,
    status: o.status,
    total: o.totalPrice,
    date: o.createdAt,
    // Only summarised item info — not full order dump
    brands: [...new Set(o.items.map(i => i.product?.brand).filter(Boolean))],
    categories: [...new Set(o.items.map(i => i.product?.category).filter(Boolean))],
    itemCount: o.items.length
  }));
};

const retrieveActiveDiscounts = async () => {
  const discounts = await Discount.find({
    isActive: true,
    $or: [{ expiryDate: null }, { expiryDate: { $gt: new Date() } }],
    $or: [{ usageLimit: null }, { $expr: { $lt: ['$timesUsed', '$usageLimit'] } }]
  }).lean();
  return discounts.map(d => ({
    code: d.code,
    type: d.discountType,
    value: d.discountValue,
    minOrder: d.minOrderAmount,
    description: d.description
  }));
};

const retrieveUserMemorySummary = async (userId, sessionId) => {
  let pref = null;
  if (userId) pref = await UserPreference.findOne({ userId }).lean();
  else if (sessionId) pref = await UserPreference.findOne({ sessionId }).lean();
  if (!pref) return {};
  return {
    preferredBrands: pref.preferredBrands?.slice(0, 5) || [],
    favoriteCategories: pref.categoriesViewed?.slice(0, 3) || [],
    budgets: pref.budgets?.slice(0, 3) || [],
    priceSensitivity: pref.priceSensitivity,
    giftRecipients: pref.giftRecipients?.slice(0, 3) || [],
    occasions: pref.occasions?.slice(0, 3) || [],
    luxuryLevel: pref.luxuryLevel,
    preferredSizes: pref.preferredSizes?.slice(0, 3) || [],
    favoriteColors: pref.favoriteColors?.slice(0, 3) || [],
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Main: Assemble Context (Intent-Aware — only fetch what skill needs)
// ─────────────────────────────────────────────────────────────────────────────
exports.assembleContext = async ({ skill, userId, sessionId, clientCartItems = [], clientWishlistIds = [] }) => {
  const needed = SKILL_CONTEXT_MAP[skill] || SKILL_CONTEXT_MAP['general'];
  const ctx = { skill };

  await Promise.all([
    needed.includes('cart')      && retrieveCart(userId, clientCartItems).then(r => ctx.cart = r),
    needed.includes('wishlist')  && retrieveWishlist(userId, clientWishlistIds).then(r => ctx.wishlist = r),
    needed.includes('orders')    && retrieveRecentOrders(userId).then(r => ctx.recentOrders = r),
    needed.includes('discounts') && retrieveActiveDiscounts().then(r => ctx.discounts = r),
    needed.includes('memory')    && retrieveUserMemorySummary(userId, sessionId).then(r => ctx.memory = r),
  ].filter(Boolean));

  return ctx;
};
