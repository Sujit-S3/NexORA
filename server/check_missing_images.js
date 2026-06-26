require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

async function checkMissingImages() {
  await mongoose.connect(process.env.MONGO_URI);
  const products = await mongoose.connection.db.collection('products').find({}).toArray();
  
  let missing = [];
  
  products.forEach(p => {
    if (p.images && p.images.length > 0) {
      p.images.forEach(img => {
        if (!img.url) return;
        
        // Remove query parameters if any (e.g. ?v=1)
        let cleanUrl = img.url.split('?')[0];
        
        const localPath = path.join(__dirname, '../client/public', cleanUrl);
        if (!fs.existsSync(localPath)) {
          missing.push({
            productId: p._id,
            productName: p.name,
            missingUrl: img.url
          });
        }
      });
    }
  });

  console.log(`Found ${missing.length} missing images:`);
  missing.forEach(m => console.log(`- ${m.productName}: ${m.missingUrl}`));
  
  process.exit(0);
}

checkMissingImages().catch(console.error);
