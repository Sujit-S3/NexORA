// NexORA — refresh token rotation integration tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_should_be_long_enough_1234567890';
process.env.JWT_REFRESH_SECRET = 'test_jwt_refresh_secret_should_be_long_enough_0987654321';
process.env.JWT_EXPIRES_IN = '7d';
process.env.JWT_REFRESH_EXPIRES_IN = '30d';
process.env.CLIENT_ORIGIN = 'http://localhost:5173';

const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../../src/app');
const User = require('../../src/models/User');
const RefreshToken = require('../../src/models/RefreshToken');

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
  await Promise.all([User.deleteMany({}), RefreshToken.deleteMany({})]);
});

const registerAndGetCookies = async () => {
  const res = await request(app).post('/api/auth/register').send({
    name: 'Refresh Test',
    email: 'refresh@nexora.test',
    password: 'Password123!',
  });
  return res.headers['set-cookie'];
};

describe('Refresh token issuance', () => {
  it('sets both nexora_token and nexora_refresh cookies on register/login', async () => {
    const cookies = await registerAndGetCookies();
    const cookieNames = cookies.map((c) => c.split('=')[0]);
    expect(cookieNames).toContain('nexora_token');
    expect(cookieNames).toContain('nexora_refresh');

    const count = await RefreshToken.countDocuments();
    expect(count).toBe(1);
  });
});

describe('POST /api/auth/refresh', () => {
  it('rejects a request with no refresh cookie', async () => {
    const res = await request(app).post('/api/auth/refresh');
    expect(res.status).toBe(401);
  });

  it('rotates the refresh token and issues a new access token', async () => {
    const cookies = await registerAndGetCookies();

    const res = await request(app).post('/api/auth/refresh').set('Cookie', cookies);
    expect(res.status).toBe(200);

    const newCookies = res.headers['set-cookie'];
    expect(newCookies.map((c) => c.split('=')[0])).toEqual(expect.arrayContaining(['nexora_token', 'nexora_refresh']));

    // Old token is now revoked, exactly one active token remains.
    const tokens = await RefreshToken.find();
    expect(tokens).toHaveLength(2);
    const revoked = tokens.find((t) => t.revokedAt);
    const active = tokens.find((t) => !t.revokedAt);
    expect(revoked).toBeTruthy();
    expect(active).toBeTruthy();
    expect(revoked.replacedByTokenHash).toBe(active.tokenHash);
  });

  it('detects reuse of an already-rotated token and revokes the entire family', async () => {
    const cookies = await registerAndGetCookies();

    // First refresh — succeeds, rotates.
    const firstRefresh = await request(app).post('/api/auth/refresh').set('Cookie', cookies);
    expect(firstRefresh.status).toBe(200);
    const newCookies = firstRefresh.headers['set-cookie'];

    // Replay the ORIGINAL (now-rotated-out) refresh cookie — reuse detected.
    const replay = await request(app).post('/api/auth/refresh').set('Cookie', cookies);
    expect(replay.status).toBe(401);

    // The new token issued by the first refresh should now ALSO be dead,
    // since reuse detection burns the whole family, not just the replayed one.
    const secondRefreshWithNewToken = await request(app).post('/api/auth/refresh').set('Cookie', newCookies);
    expect(secondRefreshWithNewToken.status).toBe(401);

    const allRevoked = await RefreshToken.find({ revokedAt: null });
    expect(allRevoked).toHaveLength(0);
  });

  it('rejects an unknown/forged refresh token', async () => {
    const res = await request(app).post('/api/auth/refresh').set('Cookie', ['nexora_refresh=not-a-real-token']);
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('revokes the current refresh token so it cannot be used afterward', async () => {
    const cookies = await registerAndGetCookies();

    const logoutRes = await request(app).post('/api/auth/logout').set('Cookie', cookies);
    expect(logoutRes.status).toBe(200);

    const refreshAfterLogout = await request(app).post('/api/auth/refresh').set('Cookie', cookies);
    expect(refreshAfterLogout.status).toBe(401);
  });
});
