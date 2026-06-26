const User = require('../models/User');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const { sendResponse } = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

// @desc    Get user wishlist
// @route   GET /api/wishlist
// @access  Auth
const getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('wishlist');
  
  // Filter out products that were deleted from DB (populate returns null)
  const validWishlist = user.wishlist.filter(item => item !== null);
  
  // Clean up if there were deleted products
  if (validWishlist.length !== user.wishlist.length) {
    user.wishlist = validWishlist.map(p => p._id);
    await user.save();
  }

  sendResponse(res, 200, 'Wishlist retrieved successfully', validWishlist);
});

const { eventBus, EVENTS } = require('../services/ai/utils/eventBus');

// @desc    Add to wishlist
// @route   POST /api/wishlist
// @access  Auth
const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  if (!productId) throw ApiError.badRequest('Product ID is required');

  const user = await User.findById(req.user._id);
  if (!user.wishlist.includes(productId)) {
    user.wishlist.push(productId);
    await user.save();
    
    // Emit journey event
    const sessionId = req.headers['x-session-id'];
    eventBus.emit(EVENTS.ADD_TO_WISHLIST, { userId: req.user._id, sessionId });
  }

  const updatedUser = await User.findById(req.user._id).populate('wishlist');
  sendResponse(res, 200, 'Added to wishlist', updatedUser.wishlist);
});

// @desc    Remove from wishlist
// @route   DELETE /api/wishlist/:productId
// @access  Auth
const removeFromWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const user = await User.findById(req.user._id);
  user.wishlist = user.wishlist.filter(id => id.toString() !== productId);
  await user.save();

  const updatedUser = await User.findById(req.user._id).populate('wishlist');
  sendResponse(res, 200, 'Removed from wishlist', updatedUser.wishlist);
});

// @desc    Clear wishlist
// @route   DELETE /api/wishlist
// @access  Auth
const clearWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.wishlist = [];
  await user.save();
  sendResponse(res, 200, 'Wishlist cleared', []);
});

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist
};
