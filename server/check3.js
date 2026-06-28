require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');
const Cart = require('./src/models/Cart');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const carts = await Cart.find().populate('items.product');
  if(carts.length > 0) {
    console.log(JSON.stringify(carts[0], null, 2));
  } else {
    console.log('No carts found');
  }
  process.exit(0);
});
