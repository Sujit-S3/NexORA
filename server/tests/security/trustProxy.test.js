process.env.NODE_ENV = 'production';
process.env.JWT_SECRET = 'test_jwt_secret_should_be_long_enough_1234567890';
process.env.JWT_REFRESH_SECRET = 'test_jwt_refresh_secret_should_be_long_enough_1234567890';
process.env.CLIENT_ORIGIN = 'https://nex-ora-g9tg.vercel.app';

const express = require('express');
const request = require('supertest');

const app = require('../../src/app');

describe('trust proxy hop count (server/src/app.js)', () => {
  it('is configured for exactly 3 hops, matching the confirmed Render/Cloudflare chain', () => {
    // Regression guard: this number was derived empirically in production
    // (see the comment above app.set('trust proxy', ...) in app.js) against
    // the real X-Forwarded-For shape Render delivers. It must not drift
    // without re-running that verification.
    expect(app.get('trust proxy')).toBe(3);
  });
});

describe('trust proxy hop-counting semantics (isolated, matching app.js\'s configured value)', () => {
  const buildProbeApp = (trustProxySetting) => {
    const probe = express();
    probe.set('trust proxy', trustProxySetting);
    probe.get('/ip', (req, res) => res.json({ ip: req.ip }));
    return probe;
  };

  it('resolves req.ip to the true client at the front of a 3-hop chain (Render\'s real shape)', async () => {
    const probe = buildProbeApp(3);
    const res = await request(probe)
      .get('/ip')
      .set('X-Forwarded-For', '203.0.113.7, 162.158.55.100, 10.29.155.7');

    expect(res.body.ip).toBe('203.0.113.7');
  });

  it('does not let a client pad extra forged hops onto the front of X-Forwarded-For', async () => {
    // A client cannot control what Cloudflare/Render append (the last 2
    // entries), but it fully controls the header it sends *into* Cloudflare.
    // If it prepends a fake "victim" IP, trusting only 3 hops must still
    // resolve to the entry Cloudflare itself observed as the connecting
    // peer (position -3), not the attacker's forged prefix.
    const probe = buildProbeApp(3);
    const res = await request(probe)
      .get('/ip')
      .set('X-Forwarded-For', '198.51.100.9, 203.0.113.7, 162.158.55.100, 10.29.155.7');

    expect(res.body.ip).toBe('203.0.113.7');
    expect(res.body.ip).not.toBe('198.51.100.9');
  });

  it('under-trusting (1 hop) resolves to Render\'s internal address, not the client — the pre-fix bug', async () => {
    const probe = buildProbeApp(1);
    const res = await request(probe)
      .get('/ip')
      .set('X-Forwarded-For', '203.0.113.7, 162.158.55.100, 10.29.155.7');

    expect(res.body.ip).toBe('10.29.155.7');
  });
});
