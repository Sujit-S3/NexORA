// NexORA — Review Controller
const Review = require('../models/Review');
const Order = require('../models/Order');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const { sendResponse } = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

// @desc    Get all reviews for a product
// @route   GET /api/reviews/product/:productId
// @access  Public
const getProductReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ product: req.params.productId })
    .populate('user', 'name avatar')
    .sort({ createdAt: -1 });
  
  sendResponse(res, 200, 'Reviews retrieved successfully', reviews);
});

// @desc    Add a review
// @route   POST /api/reviews/product/:productId
// @access  Auth
const addReview = asyncHandler(async (req, res) => {
  const { rating, title, comment } = req.body;
  const productId = req.params.productId;

  if (!rating || !comment) {
    throw ApiError.badRequest('Rating and comment are required');
  }

  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  // Check if user already reviewed
  const existingReview = await Review.findOne({ user: req.user._id, product: productId });
  if (existingReview) {
    throw ApiError.badRequest('You have already reviewed this product');
  }

  // Check if user is a verified purchaser
  const hasPurchased = await Order.findOne({
    user: req.user._id,
    'items.product': productId,
    'paymentInfo.status': 'paid'
  });

  if (!hasPurchased) {
    throw ApiError.forbidden('Only verified purchasers can review this product');
  }

  const review = await Review.create({
    user: req.user._id,
    product: productId,
    rating,
    title,
    comment,
    isVerifiedPurchase: true
  });

  // Populate user data before sending response
  await review.populate('user', 'name avatar');

  sendResponse(res, 201, 'Review added successfully', review);
});

// @desc    Edit a review
// @route   PUT /api/reviews/:id
// @access  Auth (own review)
const editReview = asyncHandler(async (req, res) => {
  const { rating, title, comment } = req.body;

  const review = await Review.findById(req.params.id);
  
  if (!review) {
    throw ApiError.notFound('Review not found');
  }

  // Check ownership
  if (review.user.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('Not authorized to edit this review');
  }

  if (rating) review.rating = rating;
  if (title !== undefined) review.title = title;
  if (comment) review.comment = comment;

  await review.save();
  await review.populate('user', 'name avatar');

  sendResponse(res, 200, 'Review updated successfully', review);
});

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Auth (own) / Admin
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  
  if (!review) {
    throw ApiError.notFound('Review not found');
  }

  // Check ownership or admin
  if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw ApiError.forbidden('Not authorized to delete this review');
  }

  await review.deleteOne();

  sendResponse(res, 200, 'Review deleted successfully');
});

module.exports = { getProductReviews, addReview, editReview, deleteReview };
