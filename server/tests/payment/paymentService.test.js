// NexORA — paymentService signature verification unit tests
process.env.RAZORPAY_KEY_SECRET = 'test_key_secret_abc123';
process.env.RAZORPAY_WEBHOOK_SECRET = 'test_webhook_secret_xyz789';

const crypto = require('crypto');
const { verifyPaymentSignature, verifyWebhookSignature } = require('../../src/services/paymentService');

const hmac = (secret, payload) => crypto.createHmac('sha256', secret).update(payload).digest('hex');

describe('paymentService.verifyPaymentSignature', () => {
  const orderId = 'order_test123';
  const paymentId = 'pay_test456';

  it('accepts a correctly-signed payment', () => {
    const signature = hmac(process.env.RAZORPAY_KEY_SECRET, `${orderId}|${paymentId}`);
    expect(verifyPaymentSignature({ orderId, paymentId, signature })).toBe(true);
  });

  it('rejects a tampered signature', () => {
    const signature = hmac(process.env.RAZORPAY_KEY_SECRET, `${orderId}|${paymentId}`);
    const tampered = signature.slice(0, -2) + (signature.slice(-2) === '00' ? '11' : '00');
    expect(verifyPaymentSignature({ orderId, paymentId, signature: tampered })).toBe(false);
  });

  it('rejects a signature produced with the wrong secret', () => {
    const signature = hmac('wrong_secret', `${orderId}|${paymentId}`);
    expect(verifyPaymentSignature({ orderId, paymentId, signature })).toBe(false);
  });

  it('rejects a signature for a different order/payment id pair (no replay across orders)', () => {
    const signature = hmac(process.env.RAZORPAY_KEY_SECRET, `${orderId}|${paymentId}`);
    expect(verifyPaymentSignature({ orderId: 'order_other', paymentId, signature })).toBe(false);
  });

  it('rejects when any field is missing', () => {
    expect(verifyPaymentSignature({ orderId, paymentId, signature: '' })).toBe(false);
    expect(verifyPaymentSignature({ orderId: '', paymentId, signature: 'abc' })).toBe(false);
  });
});

describe('paymentService.verifyWebhookSignature', () => {
  const rawBody = Buffer.from(JSON.stringify({ event: 'payment.captured' }));

  it('accepts a correctly-signed webhook body', () => {
    const signature = hmac(process.env.RAZORPAY_WEBHOOK_SECRET, rawBody);
    expect(verifyWebhookSignature({ rawBody, signature })).toBe(true);
  });

  it('rejects a body that was modified after signing', () => {
    const signature = hmac(process.env.RAZORPAY_WEBHOOK_SECRET, rawBody);
    const modifiedBody = Buffer.from(JSON.stringify({ event: 'payment.captured', amount: 999999 }));
    expect(verifyWebhookSignature({ rawBody: modifiedBody, signature })).toBe(false);
  });

  it('rejects a signature produced with the wrong webhook secret', () => {
    const signature = hmac('wrong_webhook_secret', rawBody);
    expect(verifyWebhookSignature({ rawBody, signature })).toBe(false);
  });
});
