// NexORA — GET/POST/PUT/DELETE /api/users/addresses tests

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_should_be_long_enough_1234567890';
process.env.JWT_EXPIRES_IN = '7d';
process.env.CLIENT_ORIGIN = 'http://localhost:5173';

const mongoose = require('mongoose');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

const app = require('../../src/app');
const User = require('../../src/models/User');

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
  await User.deleteMany({});
});

const buildUser = async () => {
  const user = await User.create({ name: 'Test User', email: `user-${Date.now()}@nexora.test`, password: 'Password123!' });
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  return { user, token };
};

const sampleAddress = (overrides = {}) => ({
  label: 'Home',
  street: '221B Baker Street',
  city: 'Mumbai',
  state: 'Maharashtra',
  zip: '400001',
  country: 'India',
  ...overrides,
});

describe('POST /api/users/addresses', () => {
  it('adds an address and makes it the default when it is the first one', async () => {
    const { token } = await buildUser();
    const res = await request(app).post('/api/users/addresses').set('Authorization', `Bearer ${token}`).send(sampleAddress());

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].isDefault).toBe(true);
  });

  it('does not make a second address default unless explicitly requested', async () => {
    const { token } = await buildUser();
    await request(app).post('/api/users/addresses').set('Authorization', `Bearer ${token}`).send(sampleAddress());
    const res = await request(app).post('/api/users/addresses').set('Authorization', `Bearer ${token}`).send(sampleAddress({ label: 'Office' }));

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data.find((a) => a.label === 'Home').isDefault).toBe(true);
    expect(res.body.data.find((a) => a.label === 'Office').isDefault).toBe(false);
  });

  it('unsets the previous default when a new address is added as default', async () => {
    const { token } = await buildUser();
    await request(app).post('/api/users/addresses').set('Authorization', `Bearer ${token}`).send(sampleAddress());
    const res = await request(app)
      .post('/api/users/addresses')
      .set('Authorization', `Bearer ${token}`)
      .send(sampleAddress({ label: 'Office', isDefault: true }));

    expect(res.body.data.find((a) => a.label === 'Home').isDefault).toBe(false);
    expect(res.body.data.find((a) => a.label === 'Office').isDefault).toBe(true);
  });

  it('rejects a missing required field', async () => {
    const { token } = await buildUser();
    const res = await request(app).post('/api/users/addresses').set('Authorization', `Bearer ${token}`).send(sampleAddress({ street: '' }));
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/users/addresses/:addressId', () => {
  it('updates an address field', async () => {
    const { token } = await buildUser();
    const created = await request(app).post('/api/users/addresses').set('Authorization', `Bearer ${token}`).send(sampleAddress());
    const addressId = created.body.data[0]._id;

    const res = await request(app).put(`/api/users/addresses/${addressId}`).set('Authorization', `Bearer ${token}`).send({ city: 'Pune' });
    expect(res.status).toBe(200);
    expect(res.body.data[0].city).toBe('Pune');
  });

  it('switches the default when isDefault is set on a different address', async () => {
    const { token } = await buildUser();
    await request(app).post('/api/users/addresses').set('Authorization', `Bearer ${token}`).send(sampleAddress());
    const second = await request(app).post('/api/users/addresses').set('Authorization', `Bearer ${token}`).send(sampleAddress({ label: 'Office' }));
    const officeId = second.body.data.find((a) => a.label === 'Office')._id;

    const res = await request(app).put(`/api/users/addresses/${officeId}`).set('Authorization', `Bearer ${token}`).send({ isDefault: true });
    expect(res.body.data.find((a) => a.label === 'Office').isDefault).toBe(true);
    expect(res.body.data.find((a) => a.label === 'Home').isDefault).toBe(false);
  });

  it('returns 404 for an address that does not exist', async () => {
    const { token } = await buildUser();
    const res = await request(app)
      .put(`/api/users/addresses/${new mongoose.Types.ObjectId()}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ city: 'Pune' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/users/addresses/:addressId', () => {
  it('deletes an address and promotes another to default if the default was deleted', async () => {
    const { token } = await buildUser();
    const first = await request(app).post('/api/users/addresses').set('Authorization', `Bearer ${token}`).send(sampleAddress());
    const homeId = first.body.data[0]._id;
    await request(app).post('/api/users/addresses').set('Authorization', `Bearer ${token}`).send(sampleAddress({ label: 'Office' }));

    const res = await request(app).delete(`/api/users/addresses/${homeId}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].isDefault).toBe(true);
  });

  it("a different user cannot delete another user's address", async () => {
    const { token: ownerToken } = await buildUser();
    const created = await request(app).post('/api/users/addresses').set('Authorization', `Bearer ${ownerToken}`).send(sampleAddress());
    const addressId = created.body.data[0]._id;

    const { token: otherToken } = await buildUser();
    const res = await request(app).delete(`/api/users/addresses/${addressId}`).set('Authorization', `Bearer ${otherToken}`);
    expect(res.status).toBe(404);
  });
});
