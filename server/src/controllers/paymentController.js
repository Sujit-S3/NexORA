// NexORA — Payment Controller
const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const asyncHandler = require('../utils/asyncHandler');
const { sendResponse } = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const paymentService = require('../services/paymentService');
const { isRazorpayConfigured } = require('../services/razorpayClient');

// When two verify/webhook requests race on the same payment, MongoDB aborts
// the losing transaction with a WriteConflict rather than letting its
// findOneAndUpdate simply return null — this recognizes that case so it can
// be treated the same as "already processed" instead of a raw 500.
const isWriteConflict = (error) =>
  (typeof error?.hasErrorLabel === 'function' && error.hasErrorLabel('TransientTransactionError')) || error?.codeName === 'WriteConflict';

// @desc    Initiate a payment (creates a Razorpay order for online methods)
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

  const method = order.paymentInfo.method;

  if (method !== 'cod' && !isRazorpayConfigured()) {
    throw ApiError.badRequest('Online payments are currently unavailable. Please select Cash on Delivery.');
  }

  const payment = await Payment.create({
    order: orderId,
    user: req.user._id,
    amount: order.totalPrice,
    method,
    status: 'pending',
  });

  if (method === 'cod') {
    return sendResponse(res, 201, 'Payment initiated', payment);
  }

  const razorpayOrder = await paymentService.createRazorpayOrder({
    amount: order.totalPrice,
    currency: payment.currency,
    receipt: payment.transactionId,
  });

  payment.razorpayOrderId = razorpayOrder.id;
  await payment.save();

  sendResponse(res, 201, 'Payment initiated', {
    _id: payment._id,
    razorpayOrderId: razorpayOrder.id,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
  });
});

// @desc    Verify a Razorpay payment via its checkout-callback signature
// @route   POST /api/payments/verify
// @access  Auth
const verifyPayment = asyncHandler(async (req, res) => {
  const { paymentId, razorpay_order_id: razorpayOrderId, razorpay_payment_id: razorpayPaymentId, razorpay_signature: razorpaySignature } = req.body;

  if (!paymentId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    throw ApiError.badRequest('Payment ID and Razorpay verification fields are required');
  }

  const payment = await Payment.findById(paymentId);
  if (!payment) {
    throw ApiError.notFound('Payment record not found');
  }

  if (payment.user.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('Not authorized to verify this payment');
  }

  if (payment.status !== 'pending') {
    throw ApiError.badRequest(`Payment is already ${payment.status}`);
  }

  if (payment.razorpayOrderId !== razorpayOrderId) {
    throw ApiError.badRequest('Order ID mismatch');
  }

  const isValidSignature = paymentService.verifyPaymentSignature({
    orderId: razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature,
  });

  if (!isValidSignature) {
    await Payment.findOneAndUpdate(
      { _id: paymentId, status: 'pending' },
      {
        status: 'failed',
        failureReason: 'Signature verification failed',
        razorpayPaymentId,
      },
    );
    throw ApiError.badRequest('Payment verification failed');
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // Atomic guard: only transitions a still-pending payment — protects
    // against a concurrently replayed verify request double-processing it.
    const updatedPayment = await Payment.findOneAndUpdate(
      { _id: paymentId, status: 'pending' },
      {
        status: 'success',
        razorpayPaymentId,
        razorpaySignature,
        gatewayResponse: { verifiedAt: new Date(), source: 'checkout-callback' },
      },
      { session, new: true },
    );

    if (!updatedPayment) {
      await session.abortTransaction();
      throw ApiError.badRequest('Payment already processed');
    }

    const order = await Order.findByIdAndUpdate(
      updatedPayment.order,
      {
        'paymentInfo.status': 'paid',
        'paymentInfo.transactionId': updatedPayment.transactionId,
        'paymentInfo.paidAt': Date.now(),
        status: 'processing',
      },
      { session, new: true },
    );

    await session.commitTransaction();

    return sendResponse(res, 200, 'Payment verified successfully', { payment: updatedPayment, order });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    if (isWriteConflict(error)) {
      throw ApiError.badRequest('Payment already processed');
    }
    throw error;
  } finally {
    session.endSession();
  }
});

// @desc    Razorpay webhook — server-to-server payment reconciliation
// @route   POST /api/payments/webhook
// @access  Public (authenticated via X-Razorpay-Signature, not JWT)
const handleWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];

  const isValidSignature = paymentService.verifyWebhookSignature({
    rawBody: req.rawBody,
    signature,
  });

  if (!isValidSignature) {
    return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
  }

  const event = req.body?.event;
  const paymentEntity = req.body?.payload?.payment?.entity;

  if (!paymentEntity?.order_id) {
    // Not a payment event we care about — acknowledge so Razorpay doesn't retry.
    return res.status(200).json({ success: true });
  }

  const payment = await Payment.findOne({ razorpayOrderId: paymentEntity.order_id });

  // Idempotent by design: Razorpay may deliver the same event more than
  // once, and the checkout-callback verify may have already resolved this
  // payment. Only a still-pending payment is transitioned.
  if (payment && payment.status === 'pending') {
    if (event === 'payment.captured') {
      const session = await mongoose.startSession();
      try {
        session.startTransaction();

        const updatedPayment = await Payment.findOneAndUpdate(
          { _id: payment._id, status: 'pending' },
          {
            status: 'success',
            razorpayPaymentId: paymentEntity.id,
            gatewayResponse: paymentEntity,
          },
          { session, new: true },
        );

        if (updatedPayment) {
          await Order.findByIdAndUpdate(
            updatedPayment.order,
            {
              'paymentInfo.status': 'paid',
              'paymentInfo.transactionId': updatedPayment.transactionId,
              'paymentInfo.paidAt': Date.now(),
              status: 'processing',
            },
            { session },
          );
        }

        await session.commitTransaction();
      } catch (error) {
        if (session.inTransaction()) {
          await session.abortTransaction();
        }
        // A write conflict here just means the checkout-callback verify (or
        // another webhook delivery) already resolved this payment — benign.
        if (!isWriteConflict(error)) {
          throw error;
        }
      } finally {
        session.endSession();
      }
    } else if (event === 'payment.failed') {
      await Payment.findOneAndUpdate(
        { _id: payment._id, status: 'pending' },
        {
          status: 'failed',
          failureReason: 'Payment failed (webhook)',
          razorpayPaymentId: paymentEntity.id,
          gatewayResponse: paymentEntity,
        },
      );
      await Order.findByIdAndUpdate(payment.order, { 'paymentInfo.status': 'failed' });
    }
  }

  // Always acknowledge quickly — Razorpay retries aggressively on non-2xx.
  return res.status(200).json({ success: true });
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

module.exports = { initiatePayment, verifyPayment, handleWebhook, getPaymentHistory, getAllPayments };
