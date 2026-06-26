const mongoose = require('mongoose');

const journeyStateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  sessionId: { type: String, index: true },
  stage: { 
    type: String, 
    enum: ['browsing', 'viewed', 'compared', 'wishlist', 'cart', 'checkout', 'purchased', 'aftercare'],
    default: 'browsing'
  },
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

journeyStateSchema.index({ userId: 1, sessionId: 1 });

module.exports = mongoose.model('JourneyState', journeyStateSchema);
