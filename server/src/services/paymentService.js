// NexORA — Payment Service
// Real Razorpay integration: order creation, HMAC signature verification
// (checkout callback + webhook). No payment status is ever trusted from the
// client directly — everything here is verified against RAZORPAY_KEY_SECRET.

const crypto = require('crypto');
const { getRazorpayClient } = require('./razorpayClient');

/**
 * Creates a Razorpay Order, required before opening the Checkout widget.
 * @param {object} params - { amount (major units, e.g. rupees), currency, receipt }
 * @returns {Promise<object>} Razorpay order object (contains order.id)
 */
const createRazorpayOrder = async ({ amount, currency = 'INR', receipt }) => {
  const razorpay = getRazorpayClient();
  if (!razorpay) {
    throw new Error('Razorpay is not configured');
  }

  // Razorpay expects the smallest currency unit (paise for INR).
  const amountInPaise = Math.round(amount * 100);

  return razorpay.orders.create({
    amount: amountInPaise,
    currency,
    receipt,
  });
};

/** Constant-time hex string comparison (avoids leaking match length via timing). */
const timingSafeEqualHex = (a, b) => {
  const bufA = Buffer.from(String(a), 'hex');
  const bufB = Buffer.from(String(b), 'hex');
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
};

/**
 * Verifies the signature Razorpay Checkout returns to the browser after a
 * successful payment. This is the standard Razorpay integration check:
 * HMAC-SHA256(order_id + "|" + payment_id, key_secret) === signature.
 */
const verifyPaymentSignature = ({ orderId, paymentId, signature }) => {
  if (!orderId || !paymentId || !signature) {
    return false;
  }
  if (!process.env.RAZORPAY_KEY_SECRET) {
    return false;
  }

  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return timingSafeEqualHex(expected, signature);
};

/**
 * Verifies the `X-Razorpay-Signature` header on incoming webhook events
 * against the raw request body, using the separate webhook secret.
 */
const verifyWebhookSignature = ({ rawBody, signature }) => {
  if (!rawBody || !signature) {
    return false;
  }
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    return false;
  }

  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  return timingSafeEqualHex(expected, signature);
};

/**
 * Issues a full refund for a captured Razorpay payment.
 * @param {object} params - { razorpayPaymentId, amount (major units), notes }
 * @returns {Promise<object>} Razorpay refund object (contains refund.id, status)
 */
const processRefund = async ({ razorpayPaymentId, amount, notes }) => {
  const razorpay = getRazorpayClient();
  if (!razorpay) {
    throw new Error('Razorpay is not configured');
  }

  const amountInPaise = Math.round(amount * 100);

  return razorpay.payments.refund(razorpayPaymentId, {
    amount: amountInPaise,
    speed: 'normal',
    notes,
  });
};

module.exports = {
  createRazorpayOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
  processRefund,
};
