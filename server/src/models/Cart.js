// NexORA — Cart Model

const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    size: {
      type: String,
      default: '', // Empty if product has no sizes
    },
    color: {
      type: String,
      default: '',
    },
    sku: {
      type: String,
      default: '',
    },
    fitType: { type: String, default: '' },
    recommendedSize: { type: String, default: '' },
    confidence: { type: Number, default: 0 },
    fitWarning: { type: String, default: '' },
    image: {
      type: String,
      default: '',
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
      default: 1,
    },
    price: {
      // Price snapshot at the time item was added (prevents price changes from affecting active cart)
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: true },
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // One cart per user
    },
    items: [cartItemSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ── Virtual: total price ─────────────────────────────────────────────────
cartSchema.virtual('totalPrice').get(function () {
  return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
});

// ── Virtual: item count ──────────────────────────────────────────────────
cartSchema.virtual('itemCount').get(function () {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// ── Instance method: find item by product and size ───────────────────────
cartSchema.methods.findItem = function (productId, size = '') {
  return this.items.find((item) => {
    if (!item.product) {return false;}
    const id = item.product._id ? item.product._id.toString() : item.product.toString();
    return id === productId.toString() && (item.size || '') === size;
  });
};

const Cart = mongoose.model('Cart', cartSchema);
module.exports = Cart;
