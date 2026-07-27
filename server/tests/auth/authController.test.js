// NexORA — auth flow integration tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_should_be_long_enough_1234567890';
process.env.JWT_EXPIRES_IN = '7d';
process.env.CLIENT_ORIGIN = 'http://localhost:5173';

const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../../src/app');
const User = require('../../src/models/User');

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
  await User.deleteMany({});
});

describe('POST /api/auth/register', () => {
  it('creates a user, sets the session cookie, and never returns the JWT in the response body', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Ada Lovelace',
      email: 'ada@nexora.test',
      password: 'Password123!',
    });

    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe('ada@nexora.test');
    expect(res.body.data.user.password).toBeUndefined();
    expect(res.body.data.token).toBeUndefined();

    const setCookieHeader = res.headers['set-cookie']?.join(';') || '';
    expect(setCookieHeader).toMatch(/nexora_token=/);
    expect(setCookieHeader.toLowerCase()).toMatch(/httponly/);
  });

  it('rejects a duplicate email', async () => {
    await User.create({ name: 'Existing User', email: 'dupe@nexora.test', password: 'Password123!' });

    const res = await request(app).post('/api/auth/register').send({
      name: 'Someone Else',
      email: 'dupe@nexora.test',
      password: 'Password123!',
    });

    expect(res.status).toBe(400);
  });

  it('rejects a password shorter than 6 characters', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Short Password',
      email: 'short@nexora.test',
      password: '123',
    });

    expect(res.status).toBe(400);
    const stillExists = await User.findOne({ email: 'short@nexora.test' });
    expect(stillExists).toBeNull();
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await User.create({ name: 'Login User', email: 'login@nexora.test', password: 'Password123!' });
  });

  it('logs in with correct credentials and sets the session cookie', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@nexora.test',
      password: 'Password123!',
    });

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('login@nexora.test');
    expect(res.headers['set-cookie']?.join(';')).toMatch(/nexora_token=/);
  });

  it('rejects an incorrect password without revealing which field was wrong', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@nexora.test',
      password: 'wrong-password',
    });

    expect(res.status).toBe(401);
  });

  it('rejects a deactivated account', async () => {
    await User.findOneAndUpdate({ email: 'login@nexora.test' }, { isActive: false });

    const res = await request(app).post('/api/auth/login').send({
      email: 'login@nexora.test',
      password: 'Password123!',
    });

    expect(res.status).toBe(403);
  });
});

describe('GET /api/auth/me', () => {
  it('rejects a request with no session cookie', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns the current user when the session cookie from login is replayed', async () => {
    await User.create({ name: 'Me User', email: 'me@nexora.test', password: 'Password123!' });

    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'me@nexora.test',
      password: 'Password123!',
    });
    const cookie = loginRes.headers['set-cookie'];

    const meRes = await request(app).get('/api/auth/me').set('Cookie', cookie);
    expect(meRes.status).toBe(200);
    expect(meRes.body.data.email).toBe('me@nexora.test');
  });
});
