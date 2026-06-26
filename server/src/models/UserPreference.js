// NexORA V9 — UserPreference Model (Expanded Luxury Session Memory)
const mongoose = require('mongoose');

const userPreferenceSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  sessionId: { type: String, index: true },

  // ── Commerce Behaviour ─────────────────────────────────────────────────
  categoriesViewed:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  brandsViewed:         [{ type: String }],
  productsViewed:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  productsAddedToCart:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  wishlisted:           [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  checkoutStarted:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  purchaseCompleted:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],

  // ── Budget & Spend Profile ─────────────────────────────────────────────
  budgets: {
    declared: { type: Number, default: null }, // User explicitly states "under 5000"
    observedAvg: { type: Number, default: null }, // Calculated from browsing/cart
    maxPurchase: { type: Number, default: null }, // Max item bought
    comfortRange: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 }
    }
  },
  priceSensitivity: { type: String, enum: ['budget', 'mid', 'luxury', 'ultra-luxury'], default: 'luxury' },

  // ── Taste & Style (Weighted Profiles) ───────────────────────────────────
  preferredBrands: { type: Map, of: Number, default: {} }, // e.g. { "Rolex": 0.95, "Omega": 0.4 }
  preferredCategories: { type: Map, of: Number, default: {} },
  favoriteColors:     [{ type: String }],
  preferredMaterials: [{ type: String }], // leather, stainless, titanium, gold
  stylePreference:    { type: String },   // minimalist, executive, streetwear, heritage

  // ── Intent & Occasion ─────────────────────────────────────────────────
  personalities:        [{ type: String }],
  giftRecipients:       [{ type: String }],
  occasions:            [{ type: String }], // business, wedding, anniversary, daily
  shoppingPurpose:      [{ type: String }], // gift, self, investment, collection
  giftFinderUsage:      { type: Number, default: 0 },
  conciergeIntents:     [{ type: String }],

  // ── Luxury Profile ─────────────────────────────────────────────────────
  luxuryLevel:          { type: Number, min: 1, max: 5, default: 3 }, // 1=entry, 5=ultra

  // ── AI Analytics ──────────────────────────────────────────────────────
  aiSessionsOpened:     { type: Number, default: 0 },
  aiMessagesSent:       { type: Number, default: 0 },
  aiProductsRecommended:{ type: Number, default: 0 },
  aiProductsClicked:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  aiProductsAddedToCart:[{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  aiOrdersCompleted:    { type: Number, default: 0 },
  aiRevenueGenerated:   { type: Number, default: 0 },

  lastActivity: { type: Date, default: Date.now }
}, { timestamps: true });

userPreferenceSchema.index({ userId: 1, sessionId: 1 });

module.exports = mongoose.model('UserPreference', userPreferenceSchema);
