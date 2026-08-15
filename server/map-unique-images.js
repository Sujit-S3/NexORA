const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Product = require('./src/models/Product');
const Category = require('./src/models/Category');
require('dotenv').config();

const assetsBaseDir = path.join(__dirname, '../client/public/assets/luxury');

// Get all available real images (ignore generated and fallbacks)
const getAvailableImages = () => {
  const images = [];
  const folders = ['bags', 'electronics', 'fashion', 'watches', 'lifestyle', 'gifts'];
  
  for (const folder of folders) {
    const dirPath = path.join(assetsBaseDir, folder);
    if (!fs.existsSync(dirPath)) continue;
    
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      if (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.webp')) {
        images.push({
          folder,
          filename: file,
          url: `/assets/luxury/${folder}/${file}`,
          basename: path.parse(file).name.toLowerCase().replace(/[^a-z0-9]/g, ' ')
        });
      }
    }
  }
  return images;
};

// Simple scoring function to match product name/slug to filename
const scoreMatch = (productSlug, productName, imageBaseName) => {
  const productWords = new Set([...productSlug.split('-'), ...productName.toLowerCase().split(' ')]);
  const imageWords = imageBaseName.split(' ');
  
  let score = 0;
  for (const w of imageWords) {
    if (productWords.has(w)) score += 3;
    else if (productSlug.includes(w)) score += 1;
  }
  return score;
};

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected.');
    
    const availableImages = getAvailableImages();
    console.log(`Found ${availableImages.length} available images.`);
    
    const products = await Product.find().populate('category');
    let updatedCount = 0;
    
    for (const p of products) {
      // Find the best matching image
      let bestMatch = null;
      let highestScore = 0;
      
      for (const img of availableImages) {
        // Also boost score if category matches
        const categoryMatch = p.category.slug.includes(img.folder) ? 2 : 0;
        const score = scoreMatch(p.slug, p.name, img.basename) + categoryMatch;
        
        if (score > highestScore) {
          highestScore = score;
          bestMatch = img;
        }
      }
      
      // If we found a good match (or any match), assign it!
      if (bestMatch && highestScore > 0) {
        console.log(`Matching [${p.name}] -> ${bestMatch.url} (Score: ${highestScore})`);
        
        p.primaryImage = { url: bestMatch.url, publicId: bestMatch.filename, alt: p.name };
        p.hoverImage = { url: bestMatch.url, publicId: bestMatch.filename, alt: p.name };
        
        if (!p.images || p.images.length === 0) {
          p.images = [{ url: bestMatch.url, publicId: bestMatch.filename, alt: p.name }];
        } else {
          p.images[0].url = bestMatch.url;
        }
        
        if (p.variants && p.variants.length > 0) {
          p.variants.forEach(v => v.image = bestMatch.url);
        }
        
        await p.save();
        updatedCount++;
      } else {
        console.log(`No strong match for [${p.name}]`);
      }
    }
    
    console.log(`\n✅ Successfully mapped unique images for ${updatedCount} products!`);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
};

run();
