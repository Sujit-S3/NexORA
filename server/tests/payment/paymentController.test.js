// NexORA — POST /api/payments/verify integration tests
// Covers the security-critical paths: duplicate/replay prevention and
// signature verification. Uses a single-node in-memory replica set because
// the controller relies on Mongo transactions.

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_should_be_long_enough_1234567890';
process.env.JWT_EXPIRES_IN = '7d';
process.env.CLIENT_ORIGIN = 'http://localhost:5173';
process.env.RAZORPAY_KEY_ID = 'rzp_test_key_id';
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
const gatewayService = require('../../src/services/paymentService');

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

const hmac = (payload) => crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(payload).digest('hex');

const buildFixtures = async () => {
  const user = await User.create({ name: 'Test Buyer', email: `buyer-${Date.now()}@nexora.test`, password: 'Password123!' });
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

  const order = await Order.create({
    user: user._id,
    items: [
      {
        product: new mongoose.Types.ObjectId(),
        name: 'Test Product',
        price: 1000,
        quantity: 1,
      },
    ],
    shippingAddress: { street: '1 Test St', city: 'Testville', state: 'TS', zip: '00000', country: 'India' },
    paymentInfo: { method: 'card', status: 'pending' },
    itemsPrice: 1000,
    shippingPrice: 0,
    taxPrice: 150,
    totalPrice: 1150,
  });

  const razorpayOrderId = `order_${crypto.randomBytes(8).toString('hex')}`;
  const payment = await Payment.create({
    order: order._id,
    user: user._id,
    amount: order.totalPrice,
    method: 'card',
    status: 'pending',
    razorpayOrderId,
  });

  return { user, token, order, payment, razorpayOrderId };
};

describe('POST /api/payments/verify', () => {
  it('rejects an invalid signature and leaves the order unpaid', async () => {
    const { token, order, payment, razorpayOrderId } = await buildFixtures();
    const razorpayPaymentId = `pay_${crypto.randomBytes(8).toString('hex')}`;

    const res = await request(app)
      .post('/api/payments/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({
        paymentId: payment._id.toString(),
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: 'not-a-real-signature',
      });

    expect(res.status).toBe(400);

    const reloadedPayment = await Payment.findById(payment._id);
    const reloadedOrder = await Order.findById(order._id);
    expect(reloadedPayment.status).toBe('failed');
    expect(reloadedOrder.paymentInfo.status).not.toBe('paid');
  });

  it('accepts a validly-signed payment and marks the order paid', async () => {
    const { token, order, payment, razorpayOrderId } = await buildFixtures();
    const razorpayPaymentId = `pay_${crypto.randomBytes(8).toString('hex')}`;
    const signature = hmac(`${razorpayOrderId}|${razorpayPaymentId}`);

    const res = await request(app)
      .post('/api/payments/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({
        paymentId: payment._id.toString(),
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: signature,
      });

    expect(res.status).toBe(200);

    const reloadedOrder = await Order.findById(order._id);
    expect(reloadedOrder.paymentInfo.status).toBe('paid');
    expect(reloadedOrder.status).toBe('processing');
  });

  it('rejects verification of a payment that is no longer pending (duplicate prevention)', async () => {
    const { token, payment, razorpayOrderId } = await buildFixtures();
    await Payment.findByIdAndUpdate(payment._id, { status: 'success' });
    const razorpayPaymentId = `pay_${crypto.randomBytes(8).toString('hex')}`;
    const signature = hmac(`${razorpayOrderId}|${razorpayPaymentId}`);

    const res = await request(app)
      .post('/api/payments/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({
        paymentId: payment._id.toString(),
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: signature,
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already/i);
  });

  it('processes a valid payment exactly once when the verify request is replayed concurrently', async () => {
    const { token, order, payment, razorpayOrderId } = await buildFixtures();
    const razorpayPaymentId = `pay_${crypto.randomBytes(8).toString('hex')}`;
    const signature = hmac(`${razorpayOrderId}|${razorpayPaymentId}`);

    const body = {
      paymentId: payment._id.toString(),
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: signature,
    };

    const [resA, resB] = await Promise.all([
      request(app).post('/api/payments/verify').set('Authorization', `Bearer ${token}`).send(body),
      request(app).post('/api/payments/verify').set('Authorization', `Bearer ${token}`).send(body),
    ]);

    const statuses = [resA.status, resB.status].sort();
    expect(statuses).toEqual([200, 400]);

    const reloadedOrder = await Order.findById(order._id);
    expect(reloadedOrder.paymentInfo.status).toBe('paid');
  });
});

describe('Razorpay payment initiation', () => {
  it('reports online payment capability without exposing a key', async () => {
    const res = await request(app).get('/api/payments/config');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      onlinePaymentsAvailable: true,
      provider: 'razorpay',
    });
    expect(JSON.stringify(res.body)).not.toContain(process.env.RAZORPAY_KEY_ID);
  });

  it('reuses an existing pending Razorpay order when initiation is retried', async () => {
    const { token, order } = await buildFixtures();
    await Payment.deleteMany({ order: order._id });
    const createOrder = jest.spyOn(gatewayService, 'createRazorpayOrder').mockResolvedValue({
      id: 'order_gateway_once',
      amount: 115000,
      currency: 'INR',
    });

    const first = await request(app)
      .post('/api/payments/initiate')
      .set('Authorization', `Bearer ${token}`)
      .send({ orderId: order._id.toString() });
    const second = await request(app)
      .post('/api/payments/initiate')
      .set('Authorization', `Bearer ${token}`)
      .send({ orderId: order._id.toString() });

    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    expect(second.body.data.razorpayOrderId).toBe('order_gateway_once');
    expect(createOrder).toHaveBeenCalledTimes(1);
    expect(await Payment.countDocuments({ order: order._id, status: 'pending' })).toBe(1);
  });

  it('records a failed attempt when Razorpay order creation is unavailable', async () => {
    const { token, order } = await buildFixtures();
    await Payment.deleteMany({ order: order._id });
    jest.spyOn(gatewayService, 'createRazorpayOrder').mockRejectedValue(new Error('gateway unavailable'));

    const res = await request(app)
      .post('/api/payments/initiate')
      .set('Authorization', `Bearer ${token}`)
      .send({ orderId: order._id.toString() });

    expect(res.status).toBe(502);
    const failed = await Payment.findOne({ order: order._id });
    expect(failed.status).toBe('failed');
    expect(failed.failureReason).toBe('Razorpay order creation failed');
  });
});
