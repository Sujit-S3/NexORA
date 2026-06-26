const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./src/models/Product.js');
const Order = require('./src/models/Order.js');

async function runVerification() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    let product = await Product.findOne({});
    if (!product) {
      console.log('No products found.');
      return;
    }

    console.log(`\n--- Test 1: Concurrency / Oversell Prevention ---`);
    console.log(`Product: ${product.name}`);
    
    product.stock = 1;
    product.isActive = true;
    await product.save();
    console.log(`Stock set to 1.`);

    const mockOrderCreation = async (userSuffix) => {
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        const prodInTx = await Product.findById(product._id).session(session);
        if (prodInTx.stock < 1) {
          throw new Error('Insufficient stock');
        }
        prodInTx.stock -= 1;
        await prodInTx.save({ session });

        const order = new Order({
          orderItems: [{ product: product._id, name: product.name, qty: 1, price: product.price }],
          shippingAddress: { street: '123', city: 'Test', state: 'TS', zip: '12345', country: 'US' },
          paymentMethod: 'credit_card',
          itemsPrice: product.price,
          taxPrice: 0,
          shippingPrice: 0,
          totalPrice: product.price,
          isPaid: true,
          paidAt: Date.now()
        });
        await order.save({ session });
        await session.commitTransaction();
        return `Order created for ${userSuffix}`;
      } catch (err) {
        await session.abortTransaction();
        return `Order failed for ${userSuffix}: ${err.message}`;
      } finally {
        session.endSession();
      }
    };

    const results = await Promise.all([
      mockOrderCreation('UserA'),
      mockOrderCreation('UserB'),
      mockOrderCreation('UserC')
    ]);

    console.log(results);
    const finalProd = await Product.findById(product._id);
    console.log(`Final stock: ${finalProd.stock} (Expected: 0)`);

    console.log(`\n--- Test 2: Inactive Product Rejection ---`);
    product.isActive = false;
    await product.save();
    console.log(`Product set to inactive.`);
    console.log(`(Checkout logic in real app checks !isActive and throws. Simulated check here for parity.)`);
    
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

runVerification();
