const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/nexora').then(async () => {
  const count = await mongoose.connection.db.collection('products').countDocuments({'images.url': { $regex: 'generated' }});
  console.log('Generated products count:', count);
  process.exit(0);
});
