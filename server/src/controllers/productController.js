// NexORA — Product Controller
const Product = require('../models/Product');
const Category = require('../models/Category');
const asyncHandler = require('../utils/asyncHandler');
const { sendResponse } = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const { uploadToCloudinary, deleteFromCloudinary } = require('../middleware/upload');
const slugify = require('slugify');

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
  const total = await Product.countDocuments(query);
  const products = await Product.find(query)
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
  const product = await Product.findOne({ slug: req.params.slug, isActive: true })
    .populate('category', 'name slug')
    .populate('sizeChart');
  
  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  // Emit journey event
  const userId = req.user ? req.user._id : null;
  const sessionId = req.headers['x-session-id'];
  eventBus.emit(EVENTS.VIEW_PRODUCT, { userId, sessionId, product });

  sendResponse(res, 200, 'Product retrieved successfully', product);
});

// @desc    Create product
// @route   POST /api/products
// @access  Admin
const createProduct = asyncHandler(async (req, res) => {
  const { name, description, price, discountPrice, category, brand, stock, isFeatured, isNewArrival, isBestSeller, isActive, tags } = req.body;

  const productExists = await Product.findOne({ name });
  if (productExists) {
    throw ApiError.badRequest('Product with this name already exists');
  }

  const product = await Product.create({
    name, description, price, discountPrice, category, brand, stock,
    isFeatured: isFeatured !== undefined ? isFeatured : false,
    isNewArrival: isNewArrival !== undefined ? isNewArrival : false,
    isBestSeller: isBestSeller !== undefined ? isBestSeller : false,
    isActive: isActive !== undefined ? isActive : true,
    tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [],
  });

  sendResponse(res, 201, 'Product created successfully', product);
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Admin
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  const { name, description, price, discountPrice, category, brand, stock, isFeatured, isNewArrival, isBestSeller, isActive, tags } = req.body;

  if (name && name !== product.name) {
    const existingProduct = await Product.findOne({ name });
    if (existingProduct && existingProduct._id.toString() !== product._id.toString()) {
      throw ApiError.badRequest('Product with this name already exists');
    }
    product.name = name;
    product.slug = slugify(name, { lower: true, strict: true });
  }

  if (description) {product.description = description;}
  if (price !== undefined) {product.price = price;}
  if (discountPrice !== undefined) {product.discountPrice = discountPrice || null;}
  if (category) {product.category = category;}
  if (brand !== undefined) {product.brand = brand;}
  if (stock !== undefined) {product.stock = stock;}
  if (isFeatured !== undefined) {product.isFeatured = isFeatured;}
  if (isNewArrival !== undefined) {product.isNewArrival = isNewArrival;}
  if (isBestSeller !== undefined) {product.isBestSeller = isBestSeller;}
  if (isActive !== undefined) {product.isActive = isActive;}
  if (tags) {product.tags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());}

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
    const deletePromises = product.images.map(image => deleteFromCloudinary(image.publicId));
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

  // Ensure total images don't exceed 10
  if (product.images.length + req.files.length > 10) {
    throw ApiError.badRequest('Maximum 10 images allowed per product');
  }

  const uploadPromises = req.files.map(file => uploadToCloudinary(file.buffer, 'nexora/products'));
  const results = await Promise.all(uploadPromises);

  const newImages = results.map(result => ({
    url: result.secure_url,
    publicId: result.public_id,
  }));

  product.images.push(...newImages);
  await product.save();

  sendResponse(res, 200, 'Images uploaded successfully', product);
});

// @desc    Delete product image
// @route   DELETE /api/products/:id/images/:publicId
// @access  Admin
const deleteProductImage = asyncHandler(async (req, res) => {
  // Decode the URL-encoded publicId
  const publicId = decodeURIComponent(req.params.publicId);

  const product = await Product.findById(req.params.id);
  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  // Check if image exists in product
  const imageIndex = product.images.findIndex(img => img.publicId === publicId);
  if (imageIndex === -1) {
    throw ApiError.notFound('Image not found in product');
  }

  // Delete from Cloudinary
  await deleteFromCloudinary(publicId);

  // Remove from product array
  product.images.splice(imageIndex, 1);
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
