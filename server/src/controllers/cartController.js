// NexORA — Cart Controller
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const { sendResponse } = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const { eventBus, EVENTS } = require('../services/ai/utils/eventBus');

// Helper to get or create a cart for the user
const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId }).populate('items.product', 'name images slug stock price discountPrice isActive');
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  } else {
    // Auto-clean any items whose product has been deleted from the database
    const originalLength = cart.items.length;
    cart.items = cart.items.filter(item => item.product !== null);
    if (cart.items.length !== originalLength) {
      await cart.save();
    }
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
  const { productId, quantity = 1, size = '', color = '' } = req.body;

  if (!productId) {
    throw ApiError.badRequest('Product ID is required');
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw ApiError.notFound('The selected product no longer exists.');
  }

  if (!product.isActive) {
    throw ApiError.badRequest(`The ${product.name} is currently inactive and cannot be added to cart.`);
  }

  let availableStock = product.stock;
  let variantDetails = {};
  if (product.variants && product.variants.length > 0) {
    if (!size) {
      throw ApiError.badRequest(`Please select a size for ${product.name}.`);
    }
    if (color) {
      const variant = product.variants.find(v => v.size === size && v.color === color);
      if (!variant) {
        throw ApiError.badRequest(`Selected size ${size} with color ${color} is invalid for ${product.name}.`);
      }
      availableStock = variant.stock;
      variantDetails = {
        variantId: variant._id,
        color: variant.color,
        sku: variant.sku,
        image: variant.image,
      };
    } else {
      const variant = product.variants.find(v => v.size === size);
      if (!variant) {
        throw ApiError.badRequest(`Selected size ${size} is invalid for ${product.name}.`);
      }
      availableStock = variant.stock;
      variantDetails = {
        variantId: variant._id,
        color: variant.color,
        sku: variant.sku,
        image: variant.image,
      };
    }
  }

  // Include Fit Intelligence properties in variant details
  variantDetails.fitType = product.fitType || '';
  variantDetails.recommendedSize = product.fitRecommendation?.recommendedSize || '';
  variantDetails.confidence = product.fitRecommendation?.confidence || 0;
  variantDetails.fitWarning = product.fitRecommendation?.fitWarnings?.[0] || '';

  if (availableStock === 0) {
    throw ApiError.badRequest(`The ${product.name}${size ? ` (Size: ${size})` : ''} is currently out of stock.`);
  }

  if (availableStock < quantity) {
    throw ApiError.badRequest(`Insufficient stock. Only ${availableStock} left.`);
  }

  const cart = await getOrCreateCart(req.user._id);

  const existingItem = cart.findItem(productId, size);
  
  // Determine correct price snapshot
  const currentPrice = product.discountPrice !== null ? product.discountPrice : product.price;

  if (existingItem) {
    if (existingItem.quantity + quantity > availableStock) {
      throw ApiError.badRequest(`Cannot add ${quantity} more. Only ${availableStock - existingItem.quantity} more available.`);
    }
    existingItem.quantity += quantity;
    existingItem.price = currentPrice; // Update price snapshot
  } else {
    cart.items.push({
      product: productId,
      quantity,
      price: currentPrice,
      size,
      ...variantDetails,
    });
  }

  await cart.save();

  // Emit journey event
  const sessionId = req.headers['x-session-id'];
  eventBus.emit(EVENTS.ADD_TO_CART, { userId: req.user._id, sessionId, product });

  const populatedCart = await cart.populate('items.product', 'name price discountPrice images slug');

  sendResponse(res, 200, 'Item added to cart', populatedCart);
});

// @desc    Update item quantity
// @route   PUT /api/cart/update
// @access  Auth
const updateCartItem = asyncHandler(async (req, res) => {
  const { productId, quantity, size = '' } = req.body;

  if (!productId || quantity === undefined) {
    throw ApiError.badRequest('Product ID and quantity are required');
  }

  if (quantity < 1) {
    throw ApiError.badRequest('Quantity must be at least 1. To remove, use remove endpoint.');
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw ApiError.notFound('The selected product no longer exists.');
  }

  if (!product.isActive) {
    throw ApiError.badRequest(`The ${product.name} is currently inactive.`);
  }

  let availableStock = product.stock;
  if (product.variants && product.variants.length > 0) {
    if (!size) {
      throw ApiError.badRequest(`Please provide a size for ${product.name}.`);
    }
    const variant = product.variants.find(v => v.size === size);
    if (!variant) {
      throw ApiError.badRequest(`Selected size ${size} is invalid.`);
    }
    availableStock = variant.stock;
  }

  if (availableStock === 0) {
    throw ApiError.badRequest(`The ${product.name}${size ? ` (Size: ${size})` : ''} is currently out of stock.`);
  }

  if (availableStock < quantity) {
    throw ApiError.badRequest(`Cannot update quantity to ${quantity}. Only ${availableStock} left.`);
  }

  const cart = await getOrCreateCart(req.user._id);

  const existingItem = cart.findItem(productId, size);
  if (!existingItem) {
    throw ApiError.notFound('Item not found in cart');
  }

  existingItem.quantity = quantity;
  // Option: could also refresh price here
  existingItem.price = product.discountPrice !== null ? product.discountPrice : product.price;

  await cart.save();
  await cart.populate('items.product', 'name images slug stock variants price discountPrice isActive');

  sendResponse(res, 200, 'Cart updated', cart);
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/remove/:productId
// @access  Auth
const removeFromCart = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const cart = await getOrCreateCart(req.user._id);

  cart.items = cart.items.filter(item => {
    if (!item.product) {return false;}
    return item.product._id.toString() !== productId.toString();
  });

  await cart.save();
  await cart.populate('items.product', 'name images slug stock price discountPrice isActive');

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
