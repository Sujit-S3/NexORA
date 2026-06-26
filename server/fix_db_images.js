require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const mappings = {
  // Watches
  'patek_nautilus_new.png': '/assets/luxury/watches/patek.png',
  'ap_royal_oak_new.png': '/assets/luxury/watches/ap.png',
  
  // Bags
  'hermes_birkin_orange.png': '/assets/luxury/bags/hermes.png',
  'chanel_flap_black.png': '/assets/luxury/bags/chanel.png',
  'chanel_flap.png': '/assets/luxury/bags/chanel.png',
  'lady_dior.png': '/assets/luxury/bags/dior.png',
  
  // Try to use some of the other generic bags for specific ones to avoid duplicates
  'hermes_kelly.png': '/assets/luxury/bags/light_bag_1.png',
  'lv_keepall.png': '/assets/luxury/bags/dark_bag_1.png',
  'lv_capucines.png': '/assets/luxury/bags/light_bag_2.png',
  'luxury_dark_bag.png': '/assets/luxury/bags/dark_bag_2.png',
  'bag_white_bg.png': '/assets/luxury/bags/light_bag_3.png',
  
  // Fashion mappings (since we don't have exactly these, we'll map to fallback to avoid wrong items, OR map to a similar item if safe)
  'chanel_tweed_jacket.png': '/assets/luxury/fallbacks/fashion-fallback.webp',
  'burberry_trench.png': '/assets/luxury/fallbacks/fashion-fallback.webp',
  'louboutin_sokate.png': '/assets/luxury/fallbacks/fashion-fallback.webp'
};

function getCategoryFallback(catName) {
  const cat = (catName || '').toLowerCase();
  if (cat.includes('watch')) return '/assets/luxury/fallbacks/watch-fallback.webp';
  if (cat.includes('bag')) return '/assets/luxury/fallbacks/bag-fallback.webp';
  if (cat.includes('electronic') || cat.includes('tech')) return '/assets/luxury/fallbacks/electronics-fallback.webp';
  if (cat.includes('fashion') || cat.includes('cloth') || cat.includes('shoe')) return '/assets/luxury/fallbacks/fashion-fallback.webp';
  if (cat.includes('lifestyle') || cat.includes('home') || cat.includes('gift')) return '/assets/luxury/fallbacks/lifestyle-fallback.webp';
  return '/assets/luxury/fallbacks/default-luxury.webp'; // Actually NexORA logo but good for anything else
}

async function fixImages() {
  await mongoose.connect(process.env.MONGO_URI);
  const products = await mongoose.connection.db.collection('products').find({}).toArray();
  const categoriesMap = {};
  
  const categories = await mongoose.connection.db.collection('categories').find({}).toArray();
  categories.forEach(c => categoriesMap[c._id.toString()] = c.name);
  
  let updatedCount = 0;
  
  for (const p of products) {
    let needsUpdate = false;
    let newImages = p.images ? [...p.images] : [];
    
    // Determine category name
    const catName = p.category ? categoriesMap[p.category.toString()] : '';
    
    // Fix single image string field if it exists
    if (p.image) {
      let cleanUrl = p.image.split('?')[0];
      const localPath = path.join(__dirname, '../client/public', cleanUrl);
      if (!fs.existsSync(localPath) || cleanUrl.includes('placehold.co')) {
         const basename = path.basename(cleanUrl);
         if (mappings[basename]) {
           p.image = mappings[basename];
         } else {
           p.image = getCategoryFallback(catName);
         }
         needsUpdate = true;
      }
    }

    // Fix images array
    for (let i = 0; i < newImages.length; i++) {
      if (!newImages[i].url) continue;
      
      let cleanUrl = newImages[i].url.split('?')[0];
      const localPath = path.join(__dirname, '../client/public', cleanUrl);
      
      if (!fs.existsSync(localPath) || cleanUrl.includes('placehold.co')) {
        const basename = path.basename(cleanUrl);
        let replacement = mappings[basename];
        
        if (!replacement) {
          replacement = getCategoryFallback(catName);
        }
        
        console.log(`Replacing ${newImages[i].url} -> ${replacement} for product ${p.name}`);
        newImages[i].url = replacement;
        needsUpdate = true;
      }
    }
    
    if (needsUpdate) {
      const updateDoc = {};
      if (p.image) updateDoc.image = p.image;
      if (newImages.length > 0) updateDoc.images = newImages;
      
      await mongoose.connection.db.collection('products').updateOne(
        { _id: p._id },
        { $set: updateDoc }
      );
      updatedCount++;
    }
  }

  console.log(`Fixed images for ${updatedCount} products.`);
  process.exit(0);
}

fixImages().catch(console.error);
