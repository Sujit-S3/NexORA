// NexORA V12.2 — SizeChart Model (Reusable Templates & Brand Overrides)

const mongoose = require('mongoose');

const sizeChartSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Size Chart name is required'],
    trim: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required'],
    index: true,
  },
  brand: {
    type: String,
    trim: true,
    default: '',
    index: true, // Enables quick lookup for Brand Overrides
  },
  measurementType: {
    type: String,
    enum: ['clothing', 'bottoms', 'footwear', 'rings', 'belts', 'headwear', 'watches', 'jewelry'],
    default: 'clothing',
  },
  // Table headers (e.g. ['Size', 'Chest', 'Shoulder', 'Length'])
  columns: [{ type: String }],
  // Table rows mapping size to specific measurements
  rows: [
    {
      label: { type: String, required: true }, // e.g. "M", "32", "UK 8"
      measurements: { type: Map, of: String }, // e.g. { "Chest": "38", "Length": "29" }
    },
  ],
  // Universal Size Guide Sections (Structured Content)
  howToMeasure: {
    type: String,
    default: 'Use a soft measuring tape. Keep it level and snug, but not tight.',
  },
  fitRecommendation: {
    type: String,
    default: 'True to size. If between sizes, we recommend sizing up for a more relaxed fit.',
  },
  modelInfo: {
    type: String,
    default: '',
  },
  returnPolicy: {
    type: String,
    default: '14-Day Free Returns on all unworn items with original luxury tags attached.',
  },
  isDefault: {
    type: Boolean,
    default: false, // True if this is the default size chart for the given category
  },
}, {
  timestamps: true,
});

// Ensure only one default size chart per category (if no brand is specified)
sizeChartSchema.index({ category: 1, brand: 1, isDefault: 1 });

module.exports = mongoose.model('SizeChart', sizeChartSchema);
