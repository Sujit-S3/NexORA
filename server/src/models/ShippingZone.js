// NexORA — ShippingZone Model
const mongoose = require('mongoose');

const shippingZoneSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Zone name is required'],
      trim: true,
    },
    regions: [{ type: String, trim: true }],
    baseRate: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    freeShippingThreshold: {
      type: Number,
      default: null, // null = no free shipping for this zone
    },
    estimatedDays: {
      type: String,
      default: '3-7 business days',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ShippingZone', shippingZoneSchema);
