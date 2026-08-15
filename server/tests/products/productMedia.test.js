process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_should_be_long_enough_1234567890';
process.env.CLIENT_ORIGIN = 'http://localhost:5173';

jest.mock('../../src/middleware/upload', () => {
  const actual = jest.requireActual('../../src/middleware/upload');
  return {
    ...actual,
    uploadToCloudinary: jest.fn(),
    deleteFromCloudinary: jest.fn().mockResolvedValue({ result: 'ok' }),
  };
});

const mongoose = require('mongoose');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../../src/app');
const User = require('../../src/models/User');
const Product = require('../../src/models/Product');
const Category = require('../../src/models/Category');
const uploadService = require('../../src/middleware/upload');

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
  jest.clearAllMocks();
  await Promise.all([User.deleteMany({}), Product.deleteMany({}), Category.deleteMany({})]);
});

const createAdmin = async () => {
  const admin = await User.create({
    name: 'Catalog Admin',
    email: `admin-${Date.now()}@nexora.test`,
    password: 'Password123!',
    role: 'admin',
  });
  return jwt.sign({ id: admin._id }, process.env.JWT_SECRET);
};

describe('product media and product authoring', () => {
  it('promotes a real merchant upload and removes synthetic seed media', async () => {
    const token = await createAdmin();
    const category = await Category.create({ name: 'Fashion', slug: 'fashion' });
    const generated = {
      url: '/assets/luxury/generated/reference.svg',
      publicId: 'generated-reference',
    };
    const product = await Product.create({
      name: 'Merchant Photography Product',
      description: 'Starts with reference art and receives a real upload',
      price: 2500,
      category: category._id,
      stock: 4,
      images: [generated],
      primaryImage: generated,
      thumbnail: generated,
      hoverImage: generated,
      galleryImages: [generated],
    });
    uploadService.uploadToCloudinary.mockResolvedValue({
      secure_url: 'https://res.cloudinary.com/nexora/image/upload/product.webp',
      public_id: 'nexora/products/product',
    });

    const res = await request(app)
      .post(`/api/products/${product._id}/images`)
      .set('Authorization', `Bearer ${token}`)
      .attach('images', Buffer.from('real-image-bytes'), {
        filename: 'product.webp',
        contentType: 'image/webp',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.images).toHaveLength(1);
    expect(res.body.data.primaryImage.url).toContain('res.cloudinary.com');
    expect(res.body.data.galleryImages[0].publicId).toBe('nexora/products/product');
  });

  it('persists variants and merchandising fields sent by the admin editor', async () => {
    const token = await createAdmin();
    const category = await Category.create({ name: 'Fashion', slug: 'fashion' });
    const product = await Product.create({
      name: 'Editable Product',
      description: 'Before edit',
      price: 1000,
      category: category._id,
      stock: 6,
      images: [{ url: 'https://res.cloudinary.com/nexora/image/upload/editable.webp', publicId: 'nexora/products/editable' }],
    });

    const res = await request(app)
      .put(`/api/products/${product._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Editable Product',
        description: 'After edit',
        price: 1200,
        category: category._id.toString(),
        stock: 6,
        gender: 'Women',
        sizeChartHtml: '<table><tr><td>M</td></tr></table>',
        variants: [{ size: 'M', color: 'Black', sku: 'EDIT-M-BLK', stock: 6 }],
        tags: ['editor'],
        isActive: true,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.gender).toBe('Women');
    expect(res.body.data.variants).toHaveLength(1);
    expect(res.body.data.sizeChartHtml).toContain('<table>');
  });

  it('creates active requests as drafts until real media is uploaded', async () => {
    const token = await createAdmin();
    const category = await Category.create({ name: 'Electronics', slug: 'electronics' });

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Draft First Product',
        description: 'Must not be public before its media upload finishes',
        price: 5000,
        category: category._id.toString(),
        stock: 2,
        isActive: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.isActive).toBe(false);
    expect(res.body.message).toMatch(/draft/i);
  });

  it('rejects publishing a product that only has generated reference media', async () => {
    const token = await createAdmin();
    const category = await Category.create({ name: 'Fashion', slug: 'fashion' });
    const product = await Product.create({
      name: 'Reference Only Product',
      description: 'Not ready for customers',
      price: 1000,
      category: category._id,
      stock: 3,
      isActive: false,
      images: [{ url: '/assets/luxury/generated/reference.svg', publicId: 'generated-reference' }],
    });

    const res = await request(app)
      .put(`/api/products/${product._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: product.name,
        description: product.description,
        price: product.price,
        category: category._id.toString(),
        stock: product.stock,
        isActive: true,
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/real product image/i);
  });
});
