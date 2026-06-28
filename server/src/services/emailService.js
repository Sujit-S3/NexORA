// NexORA — Email Service
// Production: sends real transactional emails via Resend (or SendGrid as fallback).
// Development: logs to console — no external calls, no quota burn.
//
// Setup: Set RESEND_API_KEY + EMAIL_FROM in .env for production.
// Resend docs: https://resend.com/docs/send-with-nodejs

const isProduction = process.env.NODE_ENV === 'production';

// ── Lazy-load Resend only in production to avoid startup crash if not installed ──
let resend = null;
const getResend = () => {
  if (!resend) {
    try {
      const { Resend } = require('resend');
      resend = new Resend(process.env.RESEND_API_KEY);
    } catch {
      console.error('[EmailService] CRITICAL: resend package not installed. Run: npm install resend');
      return null;
    }
  }
  return resend;
};

const FROM = process.env.EMAIL_FROM || 'NexORA <noreply@nexora.com>';

// ── Internal send helper ──────────────────────────────────────────────────────
const sendEmail = async ({ to, subject, html }) => {
  if (!isProduction) {
    console.log(`[EmailService] DEV — would send to: ${to}`);
    console.log(`[EmailService] Subject: ${subject}`);
    return { success: true, dev: true };
  }

  const client = getResend();
  if (!client) {return { success: false, error: 'Email client not configured' };}

  try {
    const result = await client.emails.send({ from: FROM, to, subject, html });
    return { success: true, id: result.id };
  } catch (err) {
    console.error(`[EmailService] Failed to send email to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
};

// ── Password Reset ────────────────────────────────────────────────────────────
/**
 * Send password reset email.
 * @param {string} to - Recipient email address
 * @param {string} resetUrl - Full password reset URL (with token)
 * @param {string} name - User's display name
 */
const sendPasswordReset = async (to, resetUrl, name = 'Valued Customer') => sendEmail({
    to,
    subject: 'Reset Your NexORA Password',
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Georgia, serif; background: #0a0a0a; color: #e8d5a3; padding: 40px 20px; margin: 0;">
          <div style="max-width: 560px; margin: 0 auto; background: #111; border: 1px solid #2a2a1a; border-radius: 8px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #1a1500 0%, #0a0a0a 100%); padding: 32px; text-align: center; border-bottom: 1px solid #2a2a1a;">
              <h1 style="margin: 0; color: #c9a84c; font-size: 28px; letter-spacing: 4px; font-weight: 400;">NEXORA</h1>
              <p style="margin: 8px 0 0; color: #8a7a5a; font-size: 12px; letter-spacing: 2px;">LUXURY AI COMMERCE</p>
            </div>
            <div style="padding: 40px 32px;">
              <p style="color: #c9a84c; font-size: 18px; margin: 0 0 16px;">Dear ${name},</p>
              <p style="color: #b0a090; line-height: 1.7; margin: 0 0 24px;">
                We received a request to reset the password for your NexORA account. 
                This link expires in <strong style="color: #c9a84c;">15 minutes</strong>.
              </p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${resetUrl}" 
                   style="display: inline-block; background: linear-gradient(135deg, #c9a84c, #a07830); color: #0a0a0a; 
                          text-decoration: none; padding: 14px 36px; border-radius: 4px; font-weight: bold; 
                          font-size: 14px; letter-spacing: 1px;">
                  RESET PASSWORD
                </a>
              </div>
              <p style="color: #6a5a4a; font-size: 13px; line-height: 1.6;">
                If you did not request this, please ignore this email. Your password will not change.<br><br>
                For security, this link can only be used once.
              </p>
            </div>
            <div style="padding: 20px 32px; border-top: 1px solid #2a2a1a; text-align: center;">
              <p style="color: #4a3a2a; font-size: 11px; margin: 0;">
                © ${new Date().getFullYear()} NexORA. All rights reserved.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  });

// ── Welcome Email ─────────────────────────────────────────────────────────────
/**
 * Send welcome email after registration.
 * @param {string} to - Recipient email address
 * @param {string} name - User's display name
 */
const sendWelcomeEmail = async (to, name = 'Valued Customer') => sendEmail({
    to,
    subject: 'Welcome to NexORA — Your Luxury Journey Begins',
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Georgia, serif; background: #0a0a0a; color: #e8d5a3; padding: 40px 20px; margin: 0;">
          <div style="max-width: 560px; margin: 0 auto; background: #111; border: 1px solid #2a2a1a; border-radius: 8px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #1a1500 0%, #0a0a0a 100%); padding: 32px; text-align: center; border-bottom: 1px solid #2a2a1a;">
              <h1 style="margin: 0; color: #c9a84c; font-size: 28px; letter-spacing: 4px; font-weight: 400;">NEXORA</h1>
              <p style="margin: 8px 0 0; color: #8a7a5a; font-size: 12px; letter-spacing: 2px;">LUXURY AI COMMERCE</p>
            </div>
            <div style="padding: 40px 32px;">
              <p style="color: #c9a84c; font-size: 18px; margin: 0 0 16px;">Welcome, ${name}.</p>
              <p style="color: #b0a090; line-height: 1.7; margin: 0 0 24px;">
                Your NexORA account is ready. You now have access to our curated collection of 
                luxury goods and your personal AI Concierge — always at your service.
              </p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${process.env.CLIENT_ORIGIN}/concierge"
                   style="display: inline-block; background: linear-gradient(135deg, #c9a84c, #a07830); color: #0a0a0a; 
                          text-decoration: none; padding: 14px 36px; border-radius: 4px; font-weight: bold; 
                          font-size: 14px; letter-spacing: 1px;">
                  MEET YOUR CONCIERGE
                </a>
              </div>
            </div>
            <div style="padding: 20px 32px; border-top: 1px solid #2a2a1a; text-align: center;">
              <p style="color: #4a3a2a; font-size: 11px; margin: 0;">© ${new Date().getFullYear()} NexORA. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  });

// ── Order Confirmation ────────────────────────────────────────────────────────
/**
 * Send order confirmation email.
 * @param {string} to - Recipient email address
 * @param {object} order - Order document from MongoDB
 * @param {string} name - Customer name
 */
const sendOrderConfirmation = async (to, order, name = 'Valued Customer') => {
  const itemRows = (order.items || []).map(item => `
    <tr>
      <td style="padding: 8px 0; color: #b0a090; border-bottom: 1px solid #2a2a1a;">${item.name}${item.size ? ` (${item.size})` : ''}</td>
      <td style="padding: 8px 0; color: #b0a090; border-bottom: 1px solid #2a2a1a; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px 0; color: #c9a84c; border-bottom: 1px solid #2a2a1a; text-align: right;">₹${item.price?.toLocaleString('en-IN')}</td>
    </tr>
  `).join('');

  return sendEmail({
    to,
    subject: `NexORA Order Confirmed — ${order.orderNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Georgia, serif; background: #0a0a0a; color: #e8d5a3; padding: 40px 20px; margin: 0;">
          <div style="max-width: 600px; margin: 0 auto; background: #111; border: 1px solid #2a2a1a; border-radius: 8px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #1a1500 0%, #0a0a0a 100%); padding: 32px; text-align: center; border-bottom: 1px solid #2a2a1a;">
              <h1 style="margin: 0; color: #c9a84c; font-size: 28px; letter-spacing: 4px; font-weight: 400;">NEXORA</h1>
              <p style="margin: 8px 0 0; color: #8a7a5a; font-size: 12px; letter-spacing: 2px;">ORDER CONFIRMED</p>
            </div>
            <div style="padding: 40px 32px;">
              <p style="color: #c9a84c; font-size: 16px; margin: 0 0 8px;">Dear ${name},</p>
              <p style="color: #b0a090; margin: 0 0 24px;">Your order <strong style="color: #c9a84c;">${order.orderNumber}</strong> has been confirmed.</p>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <thead>
                  <tr>
                    <th style="text-align: left; color: #6a5a4a; font-size: 11px; letter-spacing: 1px; padding-bottom: 8px; border-bottom: 1px solid #2a2a1a;">ITEM</th>
                    <th style="text-align: center; color: #6a5a4a; font-size: 11px; letter-spacing: 1px; padding-bottom: 8px; border-bottom: 1px solid #2a2a1a;">QTY</th>
                    <th style="text-align: right; color: #6a5a4a; font-size: 11px; letter-spacing: 1px; padding-bottom: 8px; border-bottom: 1px solid #2a2a1a;">PRICE</th>
                  </tr>
                </thead>
                <tbody>${itemRows}</tbody>
              </table>
              <div style="text-align: right; border-top: 1px solid #3a2a1a; padding-top: 16px;">
                <p style="color: #6a5a4a; margin: 4px 0; font-size: 13px;">Subtotal: ₹${order.itemsPrice?.toLocaleString('en-IN')}</p>
                ${order.discountPrice > 0 ? `<p style="color: #4a8a4a; margin: 4px 0; font-size: 13px;">Discount: −₹${order.discountPrice?.toLocaleString('en-IN')}</p>` : ''}
                <p style="color: #6a5a4a; margin: 4px 0; font-size: 13px;">Tax (15%): ₹${order.taxPrice?.toLocaleString('en-IN')}</p>
                <p style="color: #c9a84c; font-size: 18px; margin: 8px 0 0; font-weight: bold;">Total: ₹${order.totalPrice?.toLocaleString('en-IN')}</p>
              </div>
            </div>
            <div style="padding: 20px 32px; border-top: 1px solid #2a2a1a; text-align: center;">
              <p style="color: #4a3a2a; font-size: 11px; margin: 0;">© ${new Date().getFullYear()} NexORA. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
};

module.exports = { sendPasswordReset, sendWelcomeEmail, sendOrderConfirmation };
