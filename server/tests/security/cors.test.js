process.env.NODE_ENV = 'production';
process.env.JWT_SECRET = 'test_jwt_secret_should_be_long_enough_1234567890';
process.env.JWT_REFRESH_SECRET = 'test_jwt_refresh_secret_should_be_long_enough_1234567890';
process.env.CLIENT_ORIGIN = 'https://nex-ora-g9tg.vercel.app,https://trusted-preview.vercel.app/';

const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../../src/app');

const PROD_ORIGIN = 'https://nex-ora-g9tg.vercel.app';
const PREVIEW_ORIGIN = 'https://trusted-preview.vercel.app';

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe('production CORS allowlist (server/src/app.js corsOrigin)', () => {
  it('allows the configured production frontend origin', async () => {
    const res = await request(app).get('/api/health').set('Origin', PROD_ORIGIN);

    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe(PROD_ORIGIN);
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('allows a configured preview origin (trailing slash normalized)', async () => {
    const res = await request(app).get('/api/health').set('Origin', PREVIEW_ORIGIN);

    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe(PREVIEW_ORIGIN);
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('rejects an unconfigured *.vercel.app origin (no suffix wildcard)', async () => {
    const res = await request(app).get('/api/health').set('Origin', 'https://attacker-site.vercel.app');

    expect(res.headers['access-control-allow-origin']).toBeUndefined();
    expect(res.status).toBe(500);
  });

  it('rejects an unconfigured *.onrender.com origin (no suffix wildcard)', async () => {
    const res = await request(app).get('/api/health').set('Origin', 'https://some-other-service.onrender.com');

    expect(res.headers['access-control-allow-origin']).toBeUndefined();
    expect(res.status).toBe(500);
  });

  it('rejects the literal "null" origin sent by sandboxed iframes / file:// pages', async () => {
    const res = await request(app).get('/api/health').set('Origin', 'null');

    expect(res.headers['access-control-allow-origin']).toBeUndefined();
    expect(res.status).toBe(500);
  });

  it('rejects a malformed origin', async () => {
    const res = await request(app).get('/api/health').set('Origin', 'not-a-valid-origin');

    expect(res.headers['access-control-allow-origin']).toBeUndefined();
    expect(res.status).toBe(500);
  });

  it('rejects an origin with a path/query appended (not a bare scheme://host[:port])', async () => {
    const res = await request(app).get('/api/health').set('Origin', `${PROD_ORIGIN}/some/path`);

    expect(res.headers['access-control-allow-origin']).toBeUndefined();
    expect(res.status).toBe(500);
  });

  it('allows requests with no Origin header at all (server-to-server / curl / health probes)', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
  });

  it('responds correctly to an OPTIONS preflight from an allowed origin', async () => {
    const res = await request(app)
      .options('/api/products')
      .set('Origin', PROD_ORIGIN)
      .set('Access-Control-Request-Method', 'GET')
      .set('Access-Control-Request-Headers', 'Content-Type');

    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe(PROD_ORIGIN);
    expect(res.headers['access-control-allow-credentials']).toBe('true');
    expect(res.headers['access-control-allow-methods']).toEqual(expect.stringContaining('POST'));
  });

  it('rejects an OPTIONS preflight from a disallowed origin', async () => {
    const res = await request(app)
      .options('/api/products')
      .set('Origin', 'https://attacker.example')
      .set('Access-Control-Request-Method', 'GET');

    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('attaches credentialed CORS headers to a GET carrying cookies from an allowed origin', async () => {
    const res = await request(app)
      .get('/api/products')
      .set('Origin', PROD_ORIGIN)
      .set('Cookie', 'nexora_token=irrelevant-for-this-test');

    expect(res.headers['access-control-allow-origin']).toBe(PROD_ORIGIN);
    expect(res.headers['access-control-allow-credentials']).toBe('true');
    expect(res.headers.vary).toEqual(expect.stringContaining('Origin'));
  });

  it('attaches credentialed CORS headers to a POST from an allowed origin (even when auth itself fails)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Origin', PROD_ORIGIN)
      .send({ email: 'nobody@nexora.test', password: 'wrong-password' });

    // The auth outcome is irrelevant here — this asserts the CORS boundary,
    // not the login logic: an allowed origin must always get credentialed
    // CORS headers back, regardless of what the route handler decides.
    expect(res.headers['access-control-allow-origin']).toBe(PROD_ORIGIN);
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('never reflects a disallowed POST origin, protecting cookies from a credentialed cross-origin write', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Origin', 'https://attacker.example')
      .send({ email: 'nobody@nexora.test', password: 'wrong-password' });

    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});

describe('CORS allowlist parsing edge cases', () => {
  it('does not fail closed on every request when CLIENT_ORIGIN is unset in development', async () => {
    jest.resetModules();
    process.env.NODE_ENV = 'development';
    delete process.env.CLIENT_ORIGIN;

    const devApp = require('../../src/app');
    const res = await request(devApp).get('/api/health').set('Origin', 'http://localhost:5173');

    // Status is not asserted: this fresh app instance has no live DB
    // connection (module registry was reset), so /api/health may report 503.
    // What matters here is purely that CORS did not block the request.
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');

    // Restore for any subsequent test files sharing this module registry.
    process.env.NODE_ENV = 'production';
    process.env.CLIENT_ORIGIN = 'https://nex-ora-g9tg.vercel.app,https://trusted-preview.vercel.app/';
    jest.resetModules();
  });

  it('fails closed (rejects everything) when CLIENT_ORIGIN is unset in production', async () => {
    jest.resetModules();
    process.env.NODE_ENV = 'production';
    delete process.env.CLIENT_ORIGIN;

    const prodApp = require('../../src/app');
    const res = await request(prodApp).get('/api/health').set('Origin', 'https://nex-ora-g9tg.vercel.app');

    expect(res.headers['access-control-allow-origin']).toBeUndefined();

    process.env.CLIENT_ORIGIN = 'https://nex-ora-g9tg.vercel.app,https://trusted-preview.vercel.app/';
    jest.resetModules();
  });
});
