// NexORA — Payment Model

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0, 'Amount must be non-negative'],
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
      maxlength: 3,
    },
    method: {
      type: String,
      enum: ['card', 'upi', 'wallet', 'cod'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed', 'refunded'],
      default: 'pending',
    },
    transactionId: {
      type: String,
      unique: true,
    },
    // Stores the simulated gateway response payload
    gatewayResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    failureReason: {
      type: String,
      default: null,
    },
    refundedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ──────────────────────────────────────────────────────────────
paymentSchema.index({ order: 1 });
paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ status: 1 });

// ── Auto-generate transaction ID ─────────────────────────────────────────
paymentSchema.pre('save', function (next) {
  if (this.isNew && !this.transactionId) {
    this.transactionId = `TXN-${uuidv4().replace(/-/g, '').toUpperCase()}`;
  }
  next();
});

const Payment = mongoose.model('Payment', paymentSchema);
module.exports = Payment;
