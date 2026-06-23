// NexORA — Payment Controller
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const asyncHandler = require('../utils/asyncHandler');
const { sendResponse } = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

// @desc    Initiate a payment
// @route   POST /api/payments/initiate
// @access  Auth
const initiatePayment = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  if (!orderId) {
    throw ApiError.badRequest('Order ID is required');
  }

  const order = await Order.findById(orderId);
  if (!order) {
    throw ApiError.notFound('Order not found');
  }

  if (order.user.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('Not authorized to pay for this order');
  }

  if (order.paymentInfo.status === 'paid') {
    throw ApiError.badRequest('Order is already paid');
  }

  // Create pending payment
  const payment = await Payment.create({
    order: orderId,
    user: req.user._id,
    amount: order.totalPrice,
    method: order.paymentInfo.method,
    status: 'pending',
  });

  sendResponse(res, 201, 'Payment initiated', payment);
});

// @desc    Verify / confirm a simulated payment
// @route   POST /api/payments/verify
// @access  Auth
const verifyPayment = asyncHandler(async (req, res) => {
  const { paymentId, simulateStatus } = req.body; // simulateStatus: 'success' or 'failed'

  if (!paymentId || !simulateStatus) {
    throw ApiError.badRequest('Payment ID and simulation status are required');
  }

  const payment = await Payment.findById(paymentId);
  if (!payment) {
    throw ApiError.notFound('Payment record not found');
  }

  if (payment.status !== 'pending') {
    throw ApiError.badRequest(`Payment is already ${payment.status}`);
  }

  const order = await Order.findById(payment.order);
  if (!order) {
    throw ApiError.notFound('Order associated with this payment not found');
  }

  if (simulateStatus === 'success') {
    payment.status = 'success';
    payment.gatewayResponse = { message: 'Simulated payment success', code: 200 };
    await payment.save();

    // Update Order
    order.paymentInfo.status = 'paid';
    order.paymentInfo.transactionId = payment.transactionId;
    order.paymentInfo.paidAt = Date.now();
    order.status = 'processing';
    await order.save();

    return sendResponse(res, 200, 'Payment verified successfully', { payment, order });
  } else {
    payment.status = 'failed';
    payment.failureReason = 'Simulated payment failure (insufficient funds, timeout, etc.)';
    payment.gatewayResponse = { message: 'Simulated failure', code: 400 };
    await payment.save();

    // Update Order payment status but keep order pending/failed depending on business logic
    order.paymentInfo.status = 'failed';
    await order.save();

    return sendResponse(res, 400, 'Payment failed', { payment, order });
  }
});

// @desc    Get current user's payment history
// @route   GET /api/payments/history
// @access  Auth
const getPaymentHistory = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ user: req.user._id }).sort({ createdAt: -1 });
  sendResponse(res, 200, 'Payment history retrieved', payments);
});

// @desc    Get all payments (admin)
// @route   GET /api/payments
// @access  Admin
const getAllPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find().populate('user', 'name email').sort({ createdAt: -1 });
  sendResponse(res, 200, 'All payments retrieved', payments);
});

module.exports = { initiatePayment, verifyPayment, getPaymentHistory, getAllPayments };
