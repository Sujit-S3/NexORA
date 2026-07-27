// NexORA — POST /api/payments/:id/refund integration tests
// The actual Razorpay gateway call (paymentService.processRefund) is mocked —
// these tests cover the controller's own logic: admin-only access, state
// guards (only a 'success', non-COD payment can be refunded), and that a
// successful refund updates both the Payment and the Order consistently.

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_should_be_long_enough_1234567890';
process.env.JWT_EXPIRES_IN = '7d';
process.env.CLIENT_ORIGIN = 'http://localhost:5173';
process.env.RAZORPAY_KEY_SECRET = 'test_key_secret_abc123';
process.env.RAZORPAY_WEBHOOK_SECRET = 'test_webhook_secret_xyz789';

const crypto = require('crypto');
const mongoose = require('mongoose');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

const app = require('../../src/app');
const User = require('../../src/models/User');
const Order = require('../../src/models/Order');
const Payment = require('../../src/models/Payment');
const paymentService = require('../../src/services/paymentService');

let replSet;

beforeAll(async () => {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(replSet.getUri());
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  await replSet.stop();
});

afterEach(async () => {
  jest.restoreAllMocks();
  await Promise.all([User.deleteMany({}), Order.deleteMany({}), Payment.deleteMany({})]);
});

const buildOrderAndPayment = async (user, { paymentStatus = 'success', method = 'card' } = {}) => {
  const order = await Order.create({
    user: user._id,
    items: [{ product: new mongoose.Types.ObjectId(), name: 'Test Product', price: 1000, quantity: 1 }],
    shippingAddress: { street: '1 Test St', city: 'Testville', state: 'TS', zip: '00000', country: 'India' },
    paymentInfo: { method, status: paymentStatus === 'success' ? 'paid' : 'pending' },
    itemsPrice: 1000,
    shippingPrice: 0,
    taxPrice: 150,
    totalPrice: 1150,
  });

  const payment = await Payment.create({
    order: order._id,
    user: user._id,
    amount: order.totalPrice,
    method,
    status: paymentStatus,
    razorpayOrderId: `order_${crypto.randomBytes(8).toString('hex')}`,
    razorpayPaymentId: method === 'cod' ? null : `pay_${crypto.randomBytes(8).toString('hex')}`,
  });

  return { order, payment };
};

const buildAdmin = async () => {
  const admin = await User.create({ name: 'Test Admin', email: `admin-${Date.now()}@nexora.test`, password: 'Password123!', role: 'admin' });
  const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET);
  return { admin, token };
};

const buildCustomer = async () => {
  const customer = await User.create({ name: 'Test Buyer', email: `buyer-${Date.now()}@nexora.test`, password: 'Password123!' });
  const token = jwt.sign({ id: customer._id }, process.env.JWT_SECRET);
  return { customer, token };
};

describe('POST /api/payments/:id/refund', () => {
  it('rejects a non-admin caller', async () => {
    const { customer, token } = await buildCustomer();
    const { payment } = await buildOrderAndPayment(customer);

    const res = await request(app)
      .post(`/api/payments/${payment._id}/refund`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(403);
  });

  it('rejects refunding a payment that is not successful', async () => {
    const { admin, token } = await buildAdmin();
    const { payment } = await buildOrderAndPayment(admin, { paymentStatus: 'pending' });

    const res = await request(app)
      .post(`/api/payments/${payment._id}/refund`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/successful payment/i);
  });

  it('rejects refunding a Cash on Delivery payment', async () => {
    const { admin, token } = await buildAdmin();
    const { payment } = await buildOrderAndPayment(admin, { paymentStatus: 'success', method: 'cod' });

    const res = await request(app)
      .post(`/api/payments/${payment._id}/refund`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/cash on delivery/i);
  });

  it('refunds a successful payment and marks the order refunded', async () => {
    jest.spyOn(paymentService, 'processRefund').mockResolvedValue({ id: 'rfnd_test123', status: 'processed' });

    const { admin, token } = await buildAdmin();
    const { order, payment } = await buildOrderAndPayment(admin);

    const res = await request(app)
      .post(`/api/payments/${payment._id}/refund`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Customer requested cancellation' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('refunded');
    expect(res.body.data.refundId).toBe('rfnd_test123');
    expect(paymentService.processRefund).toHaveBeenCalledWith(
      expect.objectContaining({ razorpayPaymentId: payment.razorpayPaymentId, amount: payment.amount }),
    );

    const reloadedOrder = await Order.findById(order._id);
    expect(reloadedOrder.paymentInfo.status).toBe('refunded');
  });

  it('rejects refunding an already-refunded payment (no double refund)', async () => {
    jest.spyOn(paymentService, 'processRefund').mockResolvedValue({ id: 'rfnd_test456', status: 'processed' });

    const { admin, token } = await buildAdmin();
    const { payment } = await buildOrderAndPayment(admin);

    const first = await request(app).post(`/api/payments/${payment._id}/refund`).set('Authorization', `Bearer ${token}`).send({});
    expect(first.status).toBe(200);

    const second = await request(app).post(`/api/payments/${payment._id}/refund`).set('Authorization', `Bearer ${token}`).send({});
    expect(second.status).toBe(400);
    expect(paymentService.processRefund).toHaveBeenCalledTimes(1);
  });
});
