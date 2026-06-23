// NexORA — Email Service (stub)
// Full implementation in Phase 8.

/**
 * Send order confirmation email.
 * @param {string} to - Recipient email
 * @param {object} order - Order document
 */
const sendOrderConfirmation = async (to, order) => {
  // TODO Phase 8: integrate nodemailer / SendGrid
  console.log(`[EmailService] sendOrderConfirmation → ${to} (not yet implemented)`);
};

/**
 * Send password reset email.
 * @param {string} to - Recipient email
 * @param {string} resetUrl - Password reset URL
 */
const sendPasswordReset = async (to, resetUrl) => {
  console.log(`[EmailService] sendPasswordReset → ${to} (not yet implemented)`);
};

/**
 * Send welcome email after registration.
 * @param {string} to - Recipient email
 * @param {string} name - User's name
 */
const sendWelcomeEmail = async (to, name) => {
  console.log(`[EmailService] sendWelcomeEmail → ${to} (not yet implemented)`);
};

module.exports = { sendOrderConfirmation, sendPasswordReset, sendWelcomeEmail };
