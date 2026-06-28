require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const pool = await Product.find({'images.0': { $exists: true }, isActive: true, stock: { $gt: 0 }});
  console.log('Valid products:', pool.length);
  const all = await Product.countDocuments();
  console.log('Total products:', all);
  process.exit(0);
});
