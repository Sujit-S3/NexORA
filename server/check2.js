require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const db = mongoose.connection.db;
  const count = await db.collection('products').countDocuments();
  const activeCount = await db.collection('products').countDocuments({ isActive: true });
  console.log('Total:', count, 'Active:', activeCount);
  process.exit(0);
}).catch(console.error);
