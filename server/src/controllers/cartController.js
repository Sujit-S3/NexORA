// NexORA — Cart Controller
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const { sendResponse } = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

// Helper to get or create a cart for the user
const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId }).populate('items.product', 'name images slug stock price discountPrice');
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }
  return cart;
};

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Auth
const getCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  
  // Re-sync cart items to ensure prices are up to date and stock is still valid
  // However, the instructions say "Store product snapshots/pricing correctly." 
  // Let's assume we return the cart as-is, maybe update stock dynamically in the UI? 
  // Or we update prices here to be fresh? A snapshot is taken at time of add.
  
  sendResponse(res, 200, 'Cart retrieved successfully', cart);
});

// @desc    Add item to cart
// @route   POST /api/cart/add
// @access  Auth
const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;

  if (!productId) {
    throw ApiError.badRequest('Product ID is required');
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  if (product.stock < quantity) {
    throw ApiError.badRequest('Insufficient stock');
  }

  const cart = await getOrCreateCart(req.user._id);

  const existingItem = cart.findItem(productId);
  
  // Determine correct price snapshot
  const currentPrice = product.discountPrice !== null ? product.discountPrice : product.price;

  if (existingItem) {
    if (existingItem.quantity + quantity > product.stock) {
      throw ApiError.badRequest('Insufficient stock to add more of this item');
    }
    existingItem.quantity += quantity;
    existingItem.price = currentPrice; // Update price snapshot
  } else {
    cart.items.push({
      product: productId,
      quantity,
      price: currentPrice
    });
  }

  await cart.save();
  await cart.populate('items.product', 'name images slug stock price discountPrice');

  sendResponse(res, 200, 'Item added to cart', cart);
});

// @desc    Update item quantity
// @route   PUT /api/cart/update
// @access  Auth
const updateCartItem = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;

  if (!productId || quantity === undefined) {
    throw ApiError.badRequest('Product ID and quantity are required');
  }

  if (quantity < 1) {
    throw ApiError.badRequest('Quantity must be at least 1. To remove, use remove endpoint.');
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  if (product.stock < quantity) {
    throw ApiError.badRequest(`Cannot update quantity to ${quantity}. Only ${product.stock} left in stock.`);
  }

  const cart = await getOrCreateCart(req.user._id);

  const existingItem = cart.findItem(productId);
  if (!existingItem) {
    throw ApiError.notFound('Item not found in cart');
  }

  existingItem.quantity = quantity;
  // Option: could also refresh price here
  existingItem.price = product.discountPrice !== null ? product.discountPrice : product.price;

  await cart.save();
  await cart.populate('items.product', 'name images slug stock price discountPrice');

  sendResponse(res, 200, 'Cart updated', cart);
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/remove/:productId
// @access  Auth
const removeFromCart = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const cart = await getOrCreateCart(req.user._id);

  cart.items = cart.items.filter(item => item.product._id.toString() !== productId.toString());

  await cart.save();
  await cart.populate('items.product', 'name images slug stock price discountPrice');

  sendResponse(res, 200, 'Item removed from cart', cart);
});

// @desc    Clear entire cart
// @route   DELETE /api/cart/clear
// @access  Auth
const clearCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);

  cart.items = [];
  await cart.save();

  sendResponse(res, 200, 'Cart cleared', cart);
});

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart };
