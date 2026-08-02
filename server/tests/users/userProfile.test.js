// NexORA — GET/PUT /api/users/profile and POST /api/users/avatar tests
// The actual Cloudinary upload/delete calls are mocked — these tests cover
// the controller's own logic (which fields are editable, validation,
// avatar-replace behavior) without hitting the real Cloudinary API.

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
const uploadService = require('../../src/middleware/upload');

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
  await User.deleteMany({});
});

const buildUser = async (overrides = {}) => {
  const user = await User.create({ name: 'Test User', email: `user-${Date.now()}@nexora.test`, password: 'Password123!', ...overrides });
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  return { user, token };
};

describe('GET /api/users/profile', () => {
  it('returns the current user', async () => {
    const { user, token } = await buildUser();
    const res = await request(app).get('/api/users/profile').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(user.email);
  });
});

describe('PUT /api/users/profile', () => {
  it('updates editable fields', async () => {
    const { token } = await buildUser();
    const res = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Name', mobile: '9876543210', countryCode: '+1', currency: 'USD' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Updated Name');
    expect(res.body.data.mobile).toBe('9876543210');
    expect(res.body.data.currency).toBe('USD');
  });

  it('rejects a name that is too short', async () => {
    const { token } = await buildUser();
    const res = await request(app).put('/api/users/profile').set('Authorization', `Bearer ${token}`).send({ name: 'A' });
    expect(res.status).toBe(400);
  });

  it('rejects an unsupported currency', async () => {
    const { token } = await buildUser();
    const res = await request(app).put('/api/users/profile').set('Authorization', `Bearer ${token}`).send({ currency: 'JPY' });
    expect(res.status).toBe(400);
  });

  it('ignores attempts to change email or role through this endpoint', async () => {
    const { user, token } = await buildUser();
    const res = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Still Me', email: 'hijacked@evil.test', role: 'admin' });

    expect(res.status).toBe(200);
    const reloaded = await User.findById(user._id);
    expect(reloaded.email).toBe(user.email);
    expect(reloaded.role).toBe('user');
  });

  it('requires authentication', async () => {
    const res = await request(app).put('/api/users/profile').send({ name: 'Nope' });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/users/avatar', () => {
  it('uploads a new avatar and stores its URL/publicId', async () => {
    jest.spyOn(uploadService, 'uploadToCloudinary').mockResolvedValue({ secure_url: 'https://cdn.test/avatar1.jpg', public_id: 'nexora/avatars/abc123' });

    const { user, token } = await buildUser();
    const res = await request(app)
      .post('/api/users/avatar')
      .set('Authorization', `Bearer ${token}`)
      .attach('avatar', Buffer.from('fake-image-bytes'), { filename: 'avatar.png', contentType: 'image/png' });

    expect(res.status).toBe(200);
    expect(res.body.data.avatar.url).toBe('https://cdn.test/avatar1.jpg');

    const reloaded = await User.findById(user._id);
    expect(reloaded.avatar.publicId).toBe('nexora/avatars/abc123');
  });

  it('deletes the previous avatar from Cloudinary when replacing it', async () => {
    jest.spyOn(uploadService, 'uploadToCloudinary').mockResolvedValue({ secure_url: 'https://cdn.test/avatar2.jpg', public_id: 'nexora/avatars/new456' });
    const deleteSpy = jest.spyOn(uploadService, 'deleteFromCloudinary').mockResolvedValue({});

    const { token } = await buildUser({ avatar: { url: 'https://cdn.test/old.jpg', publicId: 'nexora/avatars/old789' } });

    const res = await request(app)
      .post('/api/users/avatar')
      .set('Authorization', `Bearer ${token}`)
      .attach('avatar', Buffer.from('fake-image-bytes'), { filename: 'avatar.png', contentType: 'image/png' });

    expect(res.status).toBe(200);
    expect(deleteSpy).toHaveBeenCalledWith('nexora/avatars/old789');
  });

  it('rejects a request with no file attached', async () => {
    const { token } = await buildUser();
    const res = await request(app).post('/api/users/avatar').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it('rejects a disallowed file type', async () => {
    const { token } = await buildUser();
    const res = await request(app)
      .post('/api/users/avatar')
      .set('Authorization', `Bearer ${token}`)
      .attach('avatar', Buffer.from('not an image'), { filename: 'file.txt', contentType: 'text/plain' });

    expect(res.status).toBe(400);
  });
});
