// NexORA — Razorpay SDK Client
// Lazily instantiated so the app can boot with online payments disabled
// (COD-only) when RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET are not configured.

let client = null;

const isRazorpayConfigured = () =>
  Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

const getRazorpayClient = () => {
  if (!isRazorpayConfigured()) {
    return null;
  }
  if (!client) {
    const Razorpay = require('razorpay');
    client = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return client;
};

module.exports = { getRazorpayClient, isRazorpayConfigured };
