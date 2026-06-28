require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const prod = await Product.findOne({ name: 'Bang & Olufsen Beolit 20' });
  console.log(JSON.stringify(prod, null, 2));
  process.exit(0);
});
