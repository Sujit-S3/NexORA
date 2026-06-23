// NexORA — Simulated Payment Service (stub)
// Full implementation in Phase 5.

/**
 * Simulates a payment gateway response.
 * In Phase 5, this will process card, UPI, wallet, and COD payments.
 *
 * @param {object} paymentData - { amount, method, orderId, userId }
 * @returns {Promise<object>} Simulated gateway response
 */
const processPayment = async (paymentData) => {
  throw new Error('paymentService.processPayment — not yet implemented (Phase 5)');
};

/**
 * Simulates a refund.
 * @param {string} transactionId - Transaction to refund
 * @returns {Promise<object>} Simulated refund response
 */
const processRefund = async (transactionId) => {
  throw new Error('paymentService.processRefund — not yet implemented (Phase 5)');
};

module.exports = { processPayment, processRefund };
