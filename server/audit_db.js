require('dotenv').config();
const mongoose = require('mongoose');

async function auditDB() {
  await mongoose.connect(process.env.MONGO_URI);
  const products = await mongoose.connection.db.collection('products').find({}).toArray();
  
  let nullImages = 0;
  let emptyStrings = 0;
  let missingImagesArray = 0;
  let emptyImagesArray = 0;
  let logoPaths = 0;
  let defaultFallbacks = 0;
  let validImages = 0;
  let total = products.length;
  
  const imageCounts = {};

  products.forEach(p => {
    let hasValidImage = false;
    
    // Check main image field if it exists
    if (p.image === null) nullImages++;
    else if (p.image === '') emptyStrings++;
    
    // Check images array
    if (!p.images) {
      missingImagesArray++;
    } else if (p.images.length === 0) {
      emptyImagesArray++;
    } else {
      p.images.forEach(img => {
        if (!img.url) return;
        const url = img.url.toLowerCase();
        if (url.includes('logo')) logoPaths++;
        if (url.includes('default') || url.includes('fallback') || url.includes('placeholder')) defaultFallbacks++;
        
        // Track duplicates
        imageCounts[url] = (imageCounts[url] || 0) + 1;
        hasValidImage = true;
      });
    }
    
    if (hasValidImage) validImages++;
  });

  const duplicates = Object.entries(imageCounts).filter(([url, count]) => count > 1);

  console.log('--- DB AUDIT REPORT ---');
  console.log(`Total Products: ${total}`);
  console.log(`Products with at least one valid image: ${validImages}`);
  console.log(`Null image fields: ${nullImages}`);
  console.log(`Empty string image fields: ${emptyStrings}`);
  console.log(`Missing images array: ${missingImagesArray}`);
  console.log(`Empty images array: ${emptyImagesArray}`);
  console.log(`Logo paths found: ${logoPaths}`);
  console.log(`Default fallbacks found: ${defaultFallbacks}`);
  
  console.log('\n--- DUPLICATE IMAGES ---');
  duplicates.forEach(([url, count]) => {
    console.log(`${count} products use: ${url}`);
  });
  
  // Let's also output a few sample products to see their exact structure
  console.log('\n--- SAMPLE PRODUCT SCHEMA ---');
  if (products.length > 0) {
    console.log(JSON.stringify({
      _id: products[0]._id,
      name: products[0].name,
      brand: products[0].brand,
      image: products[0].image,
      images: products[0].images
    }, null, 2));
  }
  
  process.exit(0);
}

auditDB().catch(console.error);
