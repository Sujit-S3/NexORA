// NexORA — Order Controller
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const { sendResponse } = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

// @desc    Place a new order
// @route   POST /api/orders
// @access  Auth
const placeOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod } = req.body;

  if (!shippingAddress || !paymentMethod) {
    throw ApiError.badRequest('Shipping address and payment method are required');
  }

  // Get user's cart
  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
  if (!cart || cart.items.length === 0) {
    throw ApiError.badRequest('Cart is empty');
  }

  // Prepare order items and validate stock
  const orderItems = [];
  let itemsPrice = 0;

  for (const item of cart.items) {
    const product = item.product;
    if (!product) {
      throw ApiError.badRequest('One or more products in your cart no longer exist');
    }
    if (product.stock < item.quantity) {
      throw ApiError.badRequest(`Insufficient stock for ${product.name}`);
    }

    orderItems.push({
      product: product._id,
      name: product.name,
      image: product.images?.[0]?.url || '',
      price: item.price, // Use locked price from cart snapshot
      quantity: item.quantity,
    });

    itemsPrice += item.price * item.quantity;
  }

  // Calculate pricing
  const taxPrice = Number((0.15 * itemsPrice).toFixed(2)); // Simulated 15% tax
  const shippingPrice = itemsPrice > 500 ? 0 : 50; // Free shipping over 500
  const totalPrice = itemsPrice + taxPrice + shippingPrice;

  // Create order
  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    shippingAddress,
    paymentInfo: {
      method: paymentMethod,
    },
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
  });

  // Decrease stock for products
  for (const item of cart.items) {
    await Product.findByIdAndUpdate(item.product._id, {
      $inc: { stock: -item.quantity }
    });
  }

  // Clear cart
  cart.items = [];
  await cart.save();

  sendResponse(res, 201, 'Order created successfully', order);
});

// @desc    Get current user's orders
// @route   GET /api/orders/my
// @access  Auth
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  sendResponse(res, 200, 'Orders retrieved', orders);
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Auth
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  
  if (!order) {
    throw ApiError.notFound('Order not found');
  }

  // Check permissions (Admin or owner of the order)
  if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw ApiError.forbidden('Not authorized to view this order');
  }

  sendResponse(res, 200, 'Order retrieved', order);
});

// @desc    Cancel an order
// @route   PUT /api/orders/:id/cancel
// @access  Auth
const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  
  if (!order) {
    throw ApiError.notFound('Order not found');
  }

  if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw ApiError.forbidden('Not authorized to cancel this order');
  }

  if (order.status !== 'pending' && order.status !== 'processing') {
    throw ApiError.badRequest('Order cannot be cancelled at this stage');
  }

  order.status = 'cancelled';
  order.cancelledAt = Date.now();
  order.cancellationReason = req.body.reason || 'User requested cancellation';
  
  // Return stock
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: item.quantity }
    });
  }

  await order.save();

  sendResponse(res, 200, 'Order cancelled successfully', order);
});

// @desc    Get all orders (admin)
// @route   GET /api/orders
// @access  Admin
const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 });
  sendResponse(res, 200, 'All orders retrieved', orders);
});

// @desc    Update order status (admin)
// @route   PUT /api/orders/:id/status
// @access  Admin
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) {
    throw ApiError.notFound('Order not found');
  }

  order.status = status;
  if (status === 'delivered') {
    order.deliveredAt = Date.now();
    order.paymentInfo.status = 'paid';
  }

  await order.save();
  sendResponse(res, 200, 'Order status updated', order);
});

module.exports = { placeOrder, getMyOrders, getOrderById, cancelOrder, getAllOrders, updateOrderStatus };
