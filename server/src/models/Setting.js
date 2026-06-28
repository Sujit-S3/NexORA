// NexORA — Setting Model (Singleton)
const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema(
  {
    storeName: { type: String, default: 'NexORA' },
    storeTagline: { type: String, default: 'Curated For You' },
    contactEmail: { type: String, default: 'hello@nexora.com' },
    supportPhone: { type: String, default: '' },
    currency: { type: String, default: 'INR' },
    currencySymbol: { type: String, default: '₹' },
    taxRate: { type: Number, default: 0, min: 0, max: 100 },
    freeShippingThreshold: { type: Number, default: 999 },
    logoUrl: { type: String, default: '' },
    address: { type: String, default: '' },
    socialLinks: {
      instagram: { type: String, default: '' },
      twitter: { type: String, default: '' },
      facebook: { type: String, default: '' },
    },
    maintenanceMode: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Setting', settingSchema);
