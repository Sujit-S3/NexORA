// NexORA — Order Controller
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Discount = require('../models/Discount');
const { computeDiscount } = require('./discountController');
const asyncHandler = require('../utils/asyncHandler');
const { sendResponse } = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const { eventBus, EVENTS } = require('../services/ai/utils/eventBus');

// @desc    Place a new order
// @route   POST /api/orders
// @access  Auth
const placeOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod, deliveryMethod, discountCode, orderItems: clientItems } = req.body;

  if (!shippingAddress || !paymentMethod) {
    throw ApiError.badRequest('Shipping address and payment method are required');
  }

  let itemsToProcess = [];

  const mongoose = require('mongoose');
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Get user's cart or use client items for guest
    if (req.user) {
      const cart = await Cart.findOne({ user: req.user._id }).populate('items.product').session(session);
      if (!cart || cart.items.length === 0) {
        throw ApiError.badRequest('Cart is empty');
      }
      itemsToProcess = cart.items.map(item => ({
        product: item.product,
        quantity: item.quantity,
        size: item.size || null
      }));
    } else {
      // Guest Checkout
      if (!clientItems || clientItems.length === 0) {
        throw ApiError.badRequest('Cart is empty');
      }
      for (const item of clientItems) {
        const dbProduct = await Product.findById(item.product || item._id).session(session);
        if (!dbProduct) throw ApiError.badRequest(`The product "${item.name || 'Unknown'}" no longer exists.`);
        itemsToProcess.push({ product: dbProduct, quantity: item.quantity, size: item.size || null });
      }
    }

    // Prepare order items and validate stock
    const finalOrderItems = [];
    let itemsPrice = 0;

    for (const item of itemsToProcess) {
      const product = item.product;
      if (!product) {
        throw ApiError.badRequest('One or more products in your cart no longer exist.');
      }
      if (!product.isActive) {
        throw ApiError.badRequest(`The ${product.name} is currently inactive and cannot be purchased.`);
      }

      let availableStock = product.stock;
      if (item.size && product.variants && product.variants.length > 0) {
        const variant = product.variants.find(v => v.size === item.size);
        if (!variant) throw ApiError.badRequest(`Invalid size ${item.size} for ${product.name}.`);
        availableStock = variant.stock;
      }

      if (availableStock === 0) {
        throw ApiError.badRequest(`The ${product.name}${item.size ? ` (Size: ${item.size})` : ''} is out of stock.`);
      }
      if (availableStock < item.quantity) {
        throw ApiError.badRequest(`Insufficient stock for ${product.name}${item.size ? ` (Size: ${item.size})` : ''}. Only ${availableStock} available.`);
      }

      const price = product.discountPrice !== null && product.discountPrice !== undefined ? product.discountPrice : product.price;

      finalOrderItems.push({
        product: product._id,
        name: product.name,
        image: product.images?.[0]?.url || '',
        price: price, // Securely calculated from DB
        quantity: item.quantity,
        size: item.size
      });

      itemsPrice += price * item.quantity;
    }

    // Calculate pricing
    const taxPrice = Number((0.15 * itemsPrice).toFixed(2)); // 15% tax
    
    let shippingPrice = 0;
    if (deliveryMethod === 'express') shippingPrice = 25;
    if (deliveryMethod === 'priority') shippingPrice = 50;
    
    // Discount logic
    let discountPrice = 0;
    let appliedDiscount = null;

    if (discountCode) {
      const discount = await Discount.findOne({ code: discountCode.toUpperCase() }).session(session);
      if (!discount) throw ApiError.badRequest('Invalid discount code');
      if (!discount.isActive) throw ApiError.badRequest('Discount code is disabled');
      if (discount.expiryDate && new Date() > new Date(discount.expiryDate))
        throw ApiError.badRequest('Discount code has expired');
      if (discount.usageLimit && discount.timesUsed >= discount.usageLimit)
        throw ApiError.badRequest('Discount code usage limit reached');
      if (itemsPrice < discount.minOrderAmount)
        throw ApiError.badRequest(`Minimum order amount of ₹${discount.minOrderAmount} required`);

      // Per-user one-time check
      if (req.user && discount.usedByUsers?.some(id => id.toString() === req.user._id.toString())) {
        throw ApiError.badRequest('You have already used this discount code');
      }

      discountPrice = computeDiscount(discount, itemsPrice);
      appliedDiscount = discount;
    }
    
    const totalPrice = Number((itemsPrice + taxPrice + shippingPrice - discountPrice).toFixed(2));

    // Prevent duplicate submissions (within 30 seconds)
    const duplicateQuery = {
      itemsPrice,
      totalPrice,
      createdAt: { $gt: new Date(Date.now() - 30 * 1000) }
    };
    if (req.user) {
      duplicateQuery.user = req.user._id;
    } else {
      duplicateQuery.user = null;
      duplicateQuery['shippingAddress.street'] = shippingAddress.street;
    }
    const recentOrder = await Order.findOne(duplicateQuery).session(session);
    if (recentOrder) {
      throw ApiError.badRequest('Duplicate order detected. Please wait before placing another order.');
    }

    // Create order
    const order = await Order.create([{
      user: req.user ? req.user._id : null,
      items: finalOrderItems,
      shippingAddress,
      paymentInfo: { method: paymentMethod },
      itemsPrice,
      taxPrice,
      shippingPrice,
      discountPrice,
      discountCode: appliedDiscount ? appliedDiscount.code : null,
      totalPrice,
    }], { session });

    // Decrease stock for products
    for (const item of itemsToProcess) {
      const productId = item.product._id || item.product;
      const dec = -item.quantity;
      if (item.size) {
        // Decrease both total stock and the specific variant's stock
        await Product.findOneAndUpdate(
          { _id: productId, "variants.size": item.size },
          { 
            $inc: { 
              stock: dec,
              "variants.$.stock": dec 
            } 
          },
          { session }
        );
      } else {
        await Product.findByIdAndUpdate(productId, {
          $inc: { stock: dec },
        }, { session });
      }
    }

    // Increment discount usage + track per-user
    if (appliedDiscount) {
      const updateOp = { $inc: { timesUsed: 1 } };
      if (req.user) updateOp.$addToSet = { usedByUsers: req.user._id };
      await Discount.findByIdAndUpdate(appliedDiscount._id, updateOp, { session });
    }

    // Clear user cart if authenticated
    if (req.user) {
      await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] }, { session });
    }

    await session.commitTransaction();
    session.endSession();

    // Emit journey event
    const sessionId = req.headers['x-session-id'];
    eventBus.emit(EVENTS.PURCHASE_COMPLETED, { userId: req.user ? req.user._id : null, sessionId, order: order[0] });

    sendResponse(res, 201, 'Order placed successfully', order[0]);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
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
  // order.user is null for guest orders — guard against null reference
  const isOwner = order.user && order.user._id.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') {
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
  
  // Return stock — variant-aware to match placeOrder logic
  for (const item of order.items) {
    if (item.size) {
      // Restore both total stock and the specific variant's stock
      await Product.findOneAndUpdate(
        { _id: item.product, 'variants.size': item.size },
        {
          $inc: {
            stock: item.quantity,
            'variants.$.stock': item.quantity
          }
        }
      );
    } else {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity }
      });
    }
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
