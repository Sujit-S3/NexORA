// NexORA — Product Model

const mongoose = require('mongoose');
const slugify = require('slugify');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [150, 'Product name must not exceed 150 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      maxlength: [2000, 'Description must not exceed 2000 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be non-negative'],
    },
    discountPrice: {
      type: Number,
      min: [0, 'Discount price must be non-negative'],
      default: null,
      validate: {
        validator (value) {
          return value === null || value < this.price;
        },
        message: 'Discount price must be less than the original price',
      },
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    brand: {
      type: String,
      trim: true,
      maxlength: [50, 'Brand name must not exceed 50 characters'],
    },
    primaryImage: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
      alt: { type: String, default: '' },
    },
    thumbnail: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
      alt: { type: String, default: '' },
    },
    hoverImage: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
      alt: { type: String, default: '' },
    },
    galleryImages: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
        alt: { type: String, default: '' },
      },
    ],
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
        alt: { type: String, default: '' },
      },
    ],
    stock: {
      type: Number,
      required: [true, 'Stock is required'],
      min: [0, 'Stock must be non-negative'],
      default: 0,
      integer: true,
    },
    sold: {
      type: Number,
      default: 0,
      min: 0,
    },
    ratings: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0, min: 0 },
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isNewArrival: {
      type: Boolean,
      default: false,
    },
    isBestSeller: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    tags: [{ type: String, lowercase: true, trim: true }],
    specifications: {
      type: Map,
      of: String,
    },
    gender: {
      type: String,
      enum: ['Men', 'Women', 'Unisex', 'Kids'],
      default: 'Unisex',
    },
    sku: {
      type: String,
      sparse: true,
      trim: true,
    },
    variants: [
      {
        size: { type: String, required: true, trim: true },
        color: { type: String, trim: true, default: '' },
        sku: { type: String, trim: true, default: '' },
        stock: { type: Number, required: true, min: 0, default: 0 },
        availability: { type: Boolean, default: true },
        priceAdjustment: { type: Number, default: 0 },
        image: { type: String, trim: true, default: '' },
        images: [
          {
            url: { type: String },
            publicId: { type: String },
            alt: { type: String },
          },
        ],
      },
    ],
    sizeChart: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SizeChart',
      default: null,
    },
    fitType: {
      type: String,
      enum: ['Slim', 'Regular', 'Relaxed', 'Oversized', 'Athletic', ''],
      default: '',
    },
    sizeChartHtml: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ── Indexes ──────────────────────────────────────────────────────────────
// slug has unique: true which creates an index automatically
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ 'ratings.average': -1 });
productSchema.index({ isFeatured: 1, isActive: 1 });
productSchema.index({ name: 'text', description: 'text', tags: 'text' }); // Full-text search

// ── Virtuals ─────────────────────────────────────────────────────────────
productSchema.virtual('effectivePrice').get(function () {
  return this.discountPrice !== null ? this.discountPrice : this.price;
});

productSchema.virtual('discountPercent').get(function () {
  if (!this.discountPrice) {return 0;}
  return Math.round(((this.price - this.discountPrice) / this.price) * 100);
});

productSchema.virtual('inStock').get(function () {
  return this.stock > 0;
});

// ── Auto-generate slug ───────────────────────────────────────────────────
productSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
