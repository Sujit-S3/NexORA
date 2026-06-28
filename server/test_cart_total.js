require('dotenv').config();
const mongoose = require('mongoose');
const Cart = require('./src/models/Cart');
const Product = require('./src/models/Product');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  let cart = await Cart.findOne({});
  if (cart) {
    const populated = await cart.populate('items.product', 'name price discountPrice');
    console.log("Cart JSON:", JSON.stringify(populated.toJSON(), null, 2));
    console.log("Total price property:", populated.totalPrice);
  } else {
    console.log("No cart");
  }
  process.exit(0);
});
