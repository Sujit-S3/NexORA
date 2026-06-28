require('dotenv').config();
const mongoose = require('mongoose');
const Cart = require('./src/models/Cart');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const carts = await Cart.find({ 'items.0': { $exists: true } }).lean();
  if (carts.length > 0) {
    console.log("Carts with items:", JSON.stringify(carts, null, 2));
  } else {
    console.log("No carts with items found.");
  }
  process.exit(0);
});
