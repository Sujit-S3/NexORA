const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/nexora').then(async () => {
  const result = await mongoose.connection.db.collection('products').deleteMany({'images.url': { $regex: 'generated' }});
  console.log('Deleted generated products:', result.deletedCount);
  process.exit(0);
});
