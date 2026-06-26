const mongoose = require('mongoose');
require('dotenv').config();
const { seedLuxuryProducts } = require('../data/luxurySeed');

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected.');
    await seedLuxuryProducts();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
