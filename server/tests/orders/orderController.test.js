// NexORA — order placement integration tests
// Covers the specific security-relevant behavior confirmed during the payment
// audit: pricing is always recomputed server-side from the DB, never trusted
// from the client, even though the client still sends its own price/total fields.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_should_be_long_enough_1234567890';
process.env.CLIENT_ORIGIN = 'http://localhost:5173';

const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

const app = require('../../src/app');
const Product = require('../../src/models/Product');
const Order = require('../../src/models/Order');

let replSet;

beforeAll(async () => {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(replSet.getUri());
  // placeOrder writes inside a transaction — MongoDB can't implicitly create a
  // collection mid-transaction, so pre-create everything it touches.
  await Promise.all([Product.createCollection(), Order.createCollection()]);
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  await replSet.stop();
});

afterEach(async () => {
  await Promise.all([Product.deleteMany({}), Order.deleteMany({})]);
});

const shippingAddress = { street: '1 Test St', city: 'Testville', state: 'TS', zip: '00000', country: 'India' };

// placeOrder runs inside a Mongo transaction. A single-node replica set under
// mongodb-memory-server occasionally throws a transient "retry the operation"
// / "unable to acquire IX lock" error while replication/locking catches up —
// this is infra timing, not a defect in placeOrder, so retry a couple of times
// rather than let real assertions flake.
const isTransientMongoError = (message = '') =>
  /retry the operation|unable to acquire .* lock/i.test(message);

const postOrder = async (body) => {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await request(app).post('/api/orders').send(body);
    if (res.status !== 500 || !isTransientMongoError(res.body?.message)) {
      return res;
    }
  }
  throw new Error('placeOrder kept hitting transient MongoDB errors after 3 attempts');
};

describe('POST /api/orders (guest checkout)', () => {
  it('recomputes item price and total from the DB, ignoring client-submitted values', async () => {
    const product = await Product.create({
      name: 'Real Price Product',
      description: 'A product with a real DB price',
      price: 5000,
      category: new mongoose.Types.ObjectId(),
      stock: 10,
    });

    const res = await postOrder({
      shippingAddress,
      paymentMethod: 'cod',
      deliveryMethod: 'standard',
      orderItems: [
        {
          product: product._id.toString(),
          name: product.name,
          quantity: 2,
          price: 1, // tampered — attacker-controlled unit price
        },
      ],
      // tampered totals — should be fully ignored server-side
      itemsPrice: 2,
      taxPrice: 0,
      shippingPrice: 0,
      totalPrice: 2,
    });

    expect(res.status).toBe(201);
    const order = res.body.data;
    expect(order.items[0].price).toBe(5000);
    expect(order.itemsPrice).toBe(10000); // 5000 * 2, not the tampered 2
    expect(order.totalPrice).toBeGreaterThan(10000); // includes real tax on top

    const updatedProduct = await Product.findById(product._id);
    expect(updatedProduct.stock).toBe(8); // decremented by quantity
  });

  it('rejects checkout for a product with insufficient stock', async () => {
    const product = await Product.create({
      name: 'Low Stock Product',
      description: 'Only one left',
      price: 100,
      category: new mongoose.Types.ObjectId(),
      stock: 1,
    });

    const res = await postOrder({
      shippingAddress,
      paymentMethod: 'cod',
      deliveryMethod: 'standard',
      orderItems: [{ product: product._id.toString(), name: product.name, quantity: 5 }],
    });

    expect(res.status).toBe(400);
    const unchangedProduct = await Product.findById(product._id);
    expect(unchangedProduct.stock).toBe(1);
  });

  it('rejects checkout for an inactive product', async () => {
    const product = await Product.create({
      name: 'Inactive Product',
      description: 'Not for sale',
      price: 100,
      category: new mongoose.Types.ObjectId(),
      stock: 10,
      isActive: false,
    });

    const res = await postOrder({
      shippingAddress,
      paymentMethod: 'cod',
      deliveryMethod: 'standard',
      orderItems: [{ product: product._id.toString(), name: product.name, quantity: 1 }],
    });

    expect(res.status).toBe(400);
  });

  it('rejects checkout with no shipping address or payment method', async () => {
    const res = await request(app).post('/api/orders').send({ orderItems: [] });
    expect(res.status).toBe(400);
  });
});
