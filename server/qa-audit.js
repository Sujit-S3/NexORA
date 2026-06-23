const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

process.env.JWT_SECRET = 'qa_test_secret';
process.env.JWT_EXPIRES_IN = '1h';

const app = require('./src/app');
const User = require('./src/models/User');
const Product = require('./src/models/Product');
const Category = require('./src/models/Category');
const Order = require('./src/models/Order');
const Review = require('./src/models/Review');
const Payment = require('./src/models/Payment');

let mongoServer;
let adminToken, userToken;
let adminId, userId;
let categoryId, productId;
let orderId, paymentId;

const runQA = async () => {
  console.log('🛡️ Starting Full QA Audit...');
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  try {
    // 1. Authentication Testing
    console.log('\n[1] Testing Authentication & Authorization...');
    const registerRes = await request(app).post('/api/auth/register').send({
      name: 'Test User', email: 'test@example.com', password: 'password123'
    });
    if (registerRes.status !== 201) throw new Error('Registration failed');
    userToken = registerRes.body.data.token;
    userId = registerRes.body.data.user._id;

    // Create Admin
    const adminUser = await User.create({
      name: 'Admin User', email: 'admin@example.com', password: 'password123', role: 'admin'
    });
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'admin@example.com', password: 'password123'
    });
    adminToken = loginRes.body.data.token;
    adminId = loginRes.body.data.user._id;

    console.log('✅ Auth successful (Registration, Login, JWT issuing)');

    // 2. Category Testing
    console.log('\n[2] Testing Categories...');
    const catRes = await request(app).post('/api/categories').set('Authorization', `Bearer ${adminToken}`).send({
      name: 'Electronics', description: 'Gadgets'
    });
    if (catRes.status !== 201) throw new Error('Category creation failed');
    categoryId = catRes.body.data._id;
    console.log('✅ Category creation successful');

    // 3. Product Testing
    console.log('\n[3] Testing Products...');
    const prodRes = await request(app).post('/api/products').set('Authorization', `Bearer ${adminToken}`).send({
      name: 'iPhone 15', description: 'Phone', price: 999, category: categoryId, stock: 10
    });
    if (prodRes.status !== 201) throw new Error('Product creation failed: ' + JSON.stringify(prodRes.body));
    productId = prodRes.body.data._id;
    
    // Product Search
    const searchRes = await request(app).get('/api/products?keyword=iPhone');
    if (searchRes.status !== 200 || searchRes.body.data.products.length === 0) throw new Error('Product search failed');
    console.log('✅ Product creation and search successful');

    // 4. Cart Testing (This is handled client-side normally, but let's check if there's a cart API, wait, cart API was requested in Phase 4!)
    console.log('\n[4] Testing Cart...');
    const addCartRes = await request(app).post('/api/cart/add').set('Authorization', `Bearer ${userToken}`).send({
      productId, quantity: 2
    });
    if (addCartRes.status !== 200) throw new Error('Cart add failed: ' + JSON.stringify(addCartRes.body));
    console.log('✅ Cart adding successful');

    // 5. Checkout & Orders
    console.log('\n[5] Testing Orders...');
    const orderRes = await request(app).post('/api/orders').set('Authorization', `Bearer ${userToken}`).send({
      shippingAddress: { street: '123 St', city: 'City', state: 'State', zip: '12345', country: 'US' },
      paymentMethod: 'card'
    });
    if (orderRes.status !== 201) throw new Error('Order creation failed: ' + JSON.stringify(orderRes.body));
    orderId = orderRes.body.data._id;
    console.log('✅ Order creation successful');

    // 6. Payments
    console.log('\n[6] Testing Payments...');
    const payRes = await request(app).post('/api/payments/create').set('Authorization', `Bearer ${userToken}`).send({
      orderId, paymentMethod: 'card'
    });
    if (payRes.status !== 200) throw new Error('Payment creation failed: ' + JSON.stringify(payRes.body));
    
    const verifyPayRes = await request(app).post('/api/payments/verify').set('Authorization', `Bearer ${userToken}`).send({
      transactionId: payRes.body.data.transactionId, status: 'success'
    });
    if (verifyPayRes.status !== 200) throw new Error('Payment verification failed');
    console.log('✅ Payment simulation successful');

    // 7. Reviews
    console.log('\n[7] Testing Reviews...');
    const reviewRes = await request(app).post('/api/reviews').set('Authorization', `Bearer ${userToken}`).send({
      product: productId, rating: 5, comment: 'Great product!'
    });
    if (reviewRes.status !== 201) throw new Error('Review creation failed: ' + JSON.stringify(reviewRes.body));
    console.log('✅ Review creation successful');

    // 8. Admin Security
    console.log('\n[8] Testing Admin Security...');
    const secRes = await request(app).get('/api/admin/dashboard').set('Authorization', `Bearer ${userToken}`);
    if (secRes.status !== 403) throw new Error('Security escalation failed');
    console.log('✅ Admin endpoints strictly protected');

    console.log('\n🎉 ALL QA TESTS PASSED!');
  } catch (err) {
    console.error('\n❌ QA AUDIT FAILED:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    await mongoServer.stop();
  }
};

runQA();
