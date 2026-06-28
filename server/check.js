const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/nexora').then(async () => {
  const db = mongoose.connection.db;
  const count = await db.collection('products').countDocuments();
  const activeCount = await db.collection('products').countDocuments({ isActive: true });
  console.log('Total:', count, 'Active:', activeCount);
  process.exit(0);
});
