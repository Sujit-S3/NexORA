require('dotenv').config();
const mongoose = require('mongoose');
const Discount = require('./src/models/Discount');
const Product = require('./src/models/Product');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');
    
    // Create a discount code
    const existing = await Discount.findOne({ code: 'LUXURY20' });
    if (!existing) {
      await Discount.create({
        code: 'LUXURY20',
        description: '20% Off Luxury Watches',
        discountType: 'percentage',
        discountValue: 20,
        minOrderAmount: 100,
        isActive: true
      });
      console.log('Created LUXURY20 discount code');
    } else {
      console.log('LUXURY20 already exists');
    }

    // Ensure we have some products
    const p = await Product.findOne();
    if (!p) {
      console.log('No products found in DB. Make sure to seed products.');
    } else {
      console.log('Found product:', p.name);
    }

  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
seed();
