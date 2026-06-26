require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  try {
    const products = await mongoose.connection.db.collection('products').find({'images.url': { $regex: 'generated' }}).toArray();
    fs.writeFileSync('generated_products_backup.json', JSON.stringify(products, null, 2));
    console.log(`Backed up ${products.length} products to generated_products_backup.json`);
    
    const result = await mongoose.connection.db.collection('products').deleteMany({'images.url': { $regex: 'generated' }});
    console.log(`Deleted ${result.deletedCount} products`);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
});
