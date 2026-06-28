// NexORA — Discount Model
const mongoose = require('mongoose');

const discountSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Discount code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true,
      default: 'percentage',
    },
    discountValue: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: [0, 'Discount value must be non-negative'],
    },
    minOrderAmount: {
      type: Number,
      default: 0,
    },
    maxDiscountAmount: {
      type: Number,
      default: null,
    },
    usageLimit: {
      type: Number,
      default: null, // null = unlimited
    },
    timesUsed: {
      type: Number,
      default: 0,
    },
    expiryDate: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    usedByUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
  },
  { timestamps: true },
);

// Virtual: is expired
discountSchema.virtual('isExpired').get(function () {
  if (!this.expiryDate) {return false;}
  return new Date() > this.expiryDate;
});

// Virtual: is usage exhausted
discountSchema.virtual('isExhausted').get(function () {
  if (!this.usageLimit) {return false;}
  return this.timesUsed >= this.usageLimit;
});

discountSchema.set('toJSON', { virtuals: true });
discountSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Discount', discountSchema);
