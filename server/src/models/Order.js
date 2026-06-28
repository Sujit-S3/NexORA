// NexORA — Order Model

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    // Denormalized snapshot fields (preserved even if product changes)
    name: { type: String, required: true },
    image: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    
    // Fit Intelligence & Variant Data
    size: { type: String, default: '' },
    color: { type: String, default: '' },
    sku: { type: String, default: '' },
    fitType: { type: String, default: '' },
    recommendedSize: { type: String, default: '' },
    confidence: { type: Number, default: 0 },
    fitWarning: { type: String, default: '' },
  },
  { _id: true },
);

const shippingAddressSchema = new mongoose.Schema(
  {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zip: { type: String, required: true },
    country: { type: String, required: true },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    orderNumber: {
      type: String,
      unique: true,
    },
    items: {
      type: [orderItemSchema],
      validate: {
        validator: (items) => items.length > 0,
        message: 'Order must contain at least one item',
      },
    },
    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },
    paymentInfo: {
      method: {
        type: String,
        enum: ['card', 'upi', 'wallet', 'cod', 'stripe', 'paypal'],
        required: true,
      },
      status: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending',
      },
      transactionId: { type: String, default: null },
      paidAt: { type: Date, default: null },
    },
    itemsPrice: { type: Number, required: true, min: 0 },
    shippingPrice: { type: Number, required: true, min: 0, default: 0 },
    taxPrice: { type: Number, required: true, min: 0, default: 0 },
    discountPrice: { type: Number, min: 0, default: 0 },
    discountCode: { type: String, default: null },
    totalPrice: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    deliveredAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    cancellationReason: { type: String, default: null },
    notes: { type: String, maxlength: 500 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ── Indexes ──────────────────────────────────────────────────────────────
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });

// ── Auto-generate unique order number ────────────────────────────────────
orderSchema.pre('save', function (next) {
  if (this.isNew && !this.orderNumber) {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = uuidv4().split('-')[0].toUpperCase();
    this.orderNumber = `NXR-${ts}-${rand}`;
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
