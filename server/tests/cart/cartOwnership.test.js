// NexORA — cart cross-user isolation test
// Confirms the pattern the security audit already found solid (every cart
// operation is scoped to req.user._id server-side, no client-suppliable
// userId) — this is a regression guard, not new coverage of a bug.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_should_be_long_enough_1234567890';
process.env.CLIENT_ORIGIN = 'http://localhost:5173';

const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../../src/app');
const User = require('../../src/models/User');
const Product = require('../../src/models/Product');
const Cart = require('../../src/models/Cart');

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  await Promise.all([User.deleteMany({}), Product.deleteMany({}), Cart.deleteMany({})]);
});

const loginAs = async (email) => {
  await User.create({ name: 'Test User', email, password: 'Password123!' });
  const res = await request(app).post('/api/auth/login').send({ email, password: 'Password123!' });
  return res.headers['set-cookie'];
};

describe('Cart ownership isolation', () => {
  it("a user's cart is invisible to a different logged-in user", async () => {
    const product = await Product.create({
      name: 'Shared Catalog Item',
      description: 'Visible to everyone, owned by no one',
      price: 250,
      category: new mongoose.Types.ObjectId(),
      stock: 20,
    });

    const cookieA = await loginAs('userA@nexora.test');
    const cookieB = await loginAs('userB@nexora.test');

    const addRes = await request(app)
      .post('/api/cart/add')
      .set('Cookie', cookieA)
      .send({ productId: product._id.toString(), quantity: 1 });
    expect(addRes.status).toBe(200);
    expect(addRes.body.data.items).toHaveLength(1);

    const cartB = await request(app).get('/api/cart').set('Cookie', cookieB);
    expect(cartB.status).toBe(200);
    expect(cartB.body.data.items).toHaveLength(0);

    const cartA = await request(app).get('/api/cart').set('Cookie', cookieA);
    expect(cartA.body.data.items).toHaveLength(1);
  });

  it('updates and removes only the selected size/color variant', async () => {
    const product = await Product.create({
      name: 'Colour Variant Item',
      description: 'The same size in two colours',
      price: 500,
      category: new mongoose.Types.ObjectId(),
      stock: 10,
      variants: [
        { size: 'M', color: 'Black', sku: 'VAR-M-BLK', stock: 5 },
        { size: 'M', color: 'Red', sku: 'VAR-M-RED', stock: 5 },
      ],
    });
    const cookie = await loginAs('variants@nexora.test');

    await request(app).post('/api/cart/add').set('Cookie', cookie).send({
      productId: product._id.toString(), quantity: 1, size: 'M', color: 'Black',
    });
    await request(app).post('/api/cart/add').set('Cookie', cookie).send({
      productId: product._id.toString(), quantity: 1, size: 'M', color: 'Red',
    });

    const removeRes = await request(app)
      .delete(`/api/cart/remove/${product._id}`)
      .query({ size: 'M', color: 'Black' })
      .set('Cookie', cookie);

    expect(removeRes.status).toBe(200);
    expect(removeRes.body.data.items).toHaveLength(1);
    expect(removeRes.body.data.items[0].color).toBe('Red');
  });
});
