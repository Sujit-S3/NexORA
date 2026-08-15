// NexORA — Product Controller
const Product = require('../models/Product');
const Category = require('../models/Category');
const SizeChart = require('../models/SizeChart');
const asyncHandler = require('../utils/asyncHandler');
const { sendResponse } = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const { uploadToCloudinary, deleteFromCloudinary } = require('../middleware/upload');
const slugify = require('slugify');
const RecommendationService = require('../services/recommendationService');
const FitIntelligenceService = require('../services/fitIntelligenceService');

const SYNTHETIC_MEDIA_PREFIXES = [
  '/assets/luxury/generated/',
  '/assets/luxury/fallbacks/',
  '/assets/placeholders/',
];

const isSyntheticMedia = (image) => {
  const url = image?.url || '';
  const publicId = image?.publicId || '';
  return SYNTHETIC_MEDIA_PREFIXES.some(prefix => url.includes(prefix))
    || publicId.startsWith('generated-')
    || publicId === 'fallback';
};

const hasRealProductMedia = (product) => [
  ...(product.images || []),
  product.primaryImage,
  product.thumbnail,
  product.hoverImage,
  ...(product.galleryImages || []),
].some(image => image?.url && !isSyntheticMedia(image));

const asMedia = (image) => ({
  url: image.url,
  publicId: image.publicId,
  alt: image.alt || '',
});

const uniqueMedia = (images = []) => images.filter((image, index, all) =>
  image?.url && index === all.findIndex(candidate => candidate?.url === image.url),
);

// Product list/detail views read the dedicated media fields first. Keep them
// synchronized with the canonical images array so a real admin upload becomes
// visible immediately instead of leaving a generated seed image as the preview.
const syncProductMedia = (product) => {
  product.images = uniqueMedia(product.images || []);
  const preferred = product.images.find(image => !isSyntheticMedia(image)) || product.images[0];

  if (!preferred) {
    product.primaryImage = { url: '', publicId: '', alt: '' };
    product.thumbnail = { url: '', publicId: '', alt: '' };
    product.hoverImage = { url: '', publicId: '', alt: '' };
    product.galleryImages = [];
    return;
  }

  const preferredIndex = product.images.findIndex(image => image.url === preferred.url);
  const ordered = [preferred, ...product.images.filter((_, index) => index !== preferredIndex)];
  const alternate = ordered.find(image => image.url !== preferred.url && !isSyntheticMedia(image)) || preferred;

  product.primaryImage = asMedia(preferred);
  product.thumbnail = asMedia(preferred);
  product.hoverImage = asMedia(alternate);
  product.galleryImages = ordered.map(asMedia);
};

const productWriteFields = (body) => ({
  name: body.name,
  description: body.description,
  price: body.price,
  discountPrice: body.discountPrice === '' ? null : body.discountPrice,
  category: body.category,
  brand: body.brand,
  stock: body.stock,
  isFeatured: body.isFeatured,
  isNewArrival: body.isNewArrival,
  isBestSeller: body.isBestSeller,
  isActive: body.isActive,
  tags: body.tags
    ? (Array.isArray(body.tags) ? body.tags : body.tags.split(',').map(tag => tag.trim()))
    : [],
  gender: body.gender,
  variants: Array.isArray(body.variants) ? body.variants : [],
  fitType: body.fitType,
  sizeChartHtml: body.sizeChartHtml,
});

// @desc    Get all products (with filter, sort, pagination)
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
  const { keyword, category, minPrice, maxPrice, sort, page = 1, limit = 12, isFeatured, isNewArrival, isBestSeller } = req.query;

  // 1. Build Query
  const query = { isActive: true };

  // Search keyword (Uses MongoDB full-text index instead of slow regex)
  if (keyword) {
    query.$text = { $search: keyword };
  }

  // Category filter
  if (category && category !== 'all') {
    const isObjectId = category.match(/^[0-9a-fA-F]{24}$/);
    const catDoc = await Category.findOne({
      $or: [
        { slug: category },
        ...(isObjectId ? [{ _id: category }] : []),
      ],
    });
    
    if (catDoc) {
      query.category = catDoc._id;
    } else {
      query.category = null; // Invalid category slug/id, return nothing
    }
  }

  // Price filter
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) {query.price.$gte = Number(minPrice);}
    if (maxPrice) {query.price.$lte = Number(maxPrice);}
  }

  // Flag filters
  if (isFeatured === 'true') {query.isFeatured = true;}
  if (isNewArrival === 'true') {query.isNewArrival = true;}
  if (isBestSeller === 'true') {query.isBestSeller = true;}

  // 2. Build Sort
  let sortOption = { createdAt: -1 }; // Default: Newest
  if (sort === 'price_asc') {sortOption = { price: 1 };}
  if (sort === 'price_desc') {sortOption = { price: -1 };}
  if (sort === 'top_rated') {sortOption = { 'ratings.average': -1 };}

  // 3. Pagination
  const pageNum = Number(page);
  const limitNum = Number(limit);
  const skip = (pageNum - 1) * limitNum;

  // 4. Execute Query
  // Trimmed to what list/grid views actually render — full detail (description,
  // specifications, gallery, variants' full shape) is fetched per-product via
  // getProductBySlug instead of duplicated across every list row.
  const total = await Product.countDocuments(query);
  const products = await Product.find(query)
    .select('name slug brand price discountPrice primaryImage hoverImage images stock isActive isNewArrival isBestSeller ratings variants category')
    .populate('category', 'name slug')
    .sort(sortOption)
    .skip(skip)
    .limit(limitNum);

  sendResponse(res, 200, 'Products retrieved successfully', {
    products,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  });
});

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
const getFeaturedProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ isFeatured: true, isActive: true })
    .populate('category', 'name slug')
    .limit(8);
  sendResponse(res, 200, 'Featured products retrieved successfully', products);
});

const { eventBus, EVENTS } = require('../services/ai/utils/eventBus');

// @desc    Get single product by slug
// @route   GET /api/products/:slug
// @access  Public
const getProductBySlug = asyncHandler(async (req, res) => {
  // Accepts either a slug or a raw ObjectId in the same param, so guest-cart
  // lookups (which only have a product id on hand) can reuse this endpoint.
  const { slug } = req.params;
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(slug);

  const product = await Product.findOne({
    isActive: true,
    ...(isObjectId ? { _id: slug } : { slug }),
  })
    .populate('category', 'name slug')
    .populate('sizeChart');

  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  // Emit journey event
  const userId = req.user ? req.user._id : null;
  const sessionId = req.headers['x-session-id'];
  eventBus.emit(EVENTS.VIEW_PRODUCT, { userId, sessionId, product });

  // Plain object (not the live Mongoose doc) so we can safely attach the
  // ad-hoc fitRecommendation field below — Mongoose's own toJSON only
  // serializes schema-declared paths, so mutating the document directly
  // would silently drop it from the response.
  const productPayload = product.toObject({ virtuals: true });

  // Fit Intelligence: attach a personalized "Recommended Size" when we have
  // a preference profile (by account, or by anonymous session) to draw from.
  if (product.variants && product.variants.length > 0) {
    const pref = await RecommendationService.getPreferences(userId, sessionId);
    if (pref) {
      const fitRecommendation = await FitIntelligenceService.getFitRecommendation(product, pref);
      if (fitRecommendation) {
        productPayload.fitRecommendation = fitRecommendation;
      }
    }
  }

  sendResponse(res, 200, 'Product retrieved successfully', productPayload);
});

// @desc    Create product
// @route   POST /api/products
// @access  Admin
const createProduct = asyncHandler(async (req, res) => {
  const { name, category } = req.body;

  const productExists = await Product.findOne({ name });
  if (productExists) {
    throw ApiError.badRequest('Product with this name already exists');
  }

  const categoryExists = await Category.exists({ _id: category });
  if (!categoryExists) {
    throw ApiError.badRequest('Selected category does not exist');
  }

  const fields = productWriteFields(req.body);
  const product = await Product.create({
    ...fields,
    isFeatured: fields.isFeatured ?? false,
    isNewArrival: fields.isNewArrival ?? false,
    isBestSeller: fields.isBestSeller ?? false,
    // Creation and media upload are separate requests. Always begin as a
    // draft so a failed/abandoned upload can never publish an empty product.
    isActive: false,
  });

  sendResponse(res, 201, fields.isActive
    ? 'Product draft created. Upload real product media before publishing.'
    : 'Product draft created successfully', product);
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Admin
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  const fields = productWriteFields(req.body);
  const { name } = fields;

  if (name && name !== product.name) {
    const existingProduct = await Product.findOne({ name });
    if (existingProduct && existingProduct._id.toString() !== product._id.toString()) {
      throw ApiError.badRequest('Product with this name already exists');
    }
    product.name = name;
    product.slug = slugify(name, { lower: true, strict: true });
  }

  if (fields.category !== undefined) {
    const categoryExists = await Category.exists({ _id: fields.category });
    if (!categoryExists) {throw ApiError.badRequest('Selected category does not exist');}
  }

  for (const [field, value] of Object.entries(fields)) {
    if (field !== 'name' && value !== undefined) {
      product[field] = value;
    }
  }

  if (product.isActive && !hasRealProductMedia(product)) {
    throw ApiError.badRequest('A real product image is required before this product can be published.');
  }

  await product.save();
  sendResponse(res, 200, 'Product updated successfully', product);
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Admin
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  // Delete all associated images from Cloudinary
  if (product.images && product.images.length > 0) {
    const deletePromises = product.images
      .filter(image => !isSyntheticMedia(image))
      .map(image => deleteFromCloudinary(image.publicId));
    await Promise.all(deletePromises);
  }

  await product.deleteOne();

  sendResponse(res, 200, 'Product deleted successfully');
});

// @desc    Upload product images
// @route   POST /api/products/:id/images
// @access  Admin
const uploadProductImages = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  if (!req.files || req.files.length === 0) {
    throw ApiError.badRequest('No images provided');
  }

  // Synthetic seed/fallback art is replaced by the first real merchant upload,
  // so it must not consume one of the ten real-media slots.
  const existingRealImages = (product.images || []).filter(image => !isSyntheticMedia(image));
  if (existingRealImages.length + req.files.length > 10) {
    throw ApiError.badRequest('Maximum 10 images allowed per product');
  }

  const uploadPromises = req.files.map(file => uploadToCloudinary(file.buffer, 'nexora/products'));
  const results = await Promise.all(uploadPromises);

  const newImages = results.map(result => ({
    url: result.secure_url,
    publicId: result.public_id,
  }));

  // A catalog seeded with generated reference art should not keep showing it
  // after a merchant uploads real product photography.
  product.images = uniqueMedia([...existingRealImages, ...newImages]);
  syncProductMedia(product);
  if (!hasRealProductMedia(product)) {
    product.isActive = false;
  }
  await product.save();

  sendResponse(res, 200, 'Images uploaded successfully', product);
});

// @desc    Delete product image
// @route   DELETE /api/products/:id/images/:publicId
// @access  Admin
const deleteProductImage = asyncHandler(async (req, res) => {
  // Decode the URL-encoded publicId
  const publicId = req.body?.publicId || (req.params.publicId ? decodeURIComponent(req.params.publicId) : '');

  if (!publicId) {
    throw ApiError.badRequest('Image public ID is required');
  }

  const product = await Product.findById(req.params.id);
  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  // Check if image exists in product
  const imageIndex = product.images.findIndex(img => img.publicId === publicId);
  if (imageIndex === -1) {
    throw ApiError.notFound('Image not found in product');
  }

  // Only merchant uploads live in Cloudinary. Generated/local assets are part
  // of the frontend bundle and must never be sent to Cloudinary for deletion.
  if (!isSyntheticMedia(product.images[imageIndex])) {
    await deleteFromCloudinary(publicId);
  }

  // Remove from product array
  product.images.splice(imageIndex, 1);
  syncProductMedia(product);
  if (!hasRealProductMedia(product)) {
    product.isActive = false;
  }
  await product.save();

  sendResponse(res, 200, 'Image deleted successfully', product);
});

module.exports = {
  getProducts,
  getFeaturedProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImages,
  deleteProductImage,
};
