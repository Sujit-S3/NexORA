const mongoose = require('mongoose');
require('dotenv').config({ path: '../../.env' });

const Product = require('../models/Product');

async function audit() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const products = await Product.find({});
  const total = products.length;
  
  let missing = 0;
  let placeholder = 0;
  let external = 0;
  let luxury = 0;
  
  for (const p of products) {
    if (!p.images || p.images.length === 0) {
      missing++;
      continue;
    }
    
    let hasExternal = false;
    let hasPlaceholder = false;
    let hasLuxury = false;
    
    for (const img of p.images) {
      if (!img.url) {continue;}
      
      if (img.url.includes('unsplash.com') || img.url.includes('placeholder')) {
        if (img.url.includes('unsplash.com')) {hasExternal = true;}
        if (img.url.includes('placeholder')) {hasPlaceholder = true;}
      } else if (img.url.includes('/assets/luxury/')) {
        hasLuxury = true;
      } else if (img.url.startsWith('http')) {
        hasExternal = true;
      }
    }
    
    if (hasExternal) {external++;}
    else if (hasPlaceholder) {placeholder++;}
    else if (hasLuxury) {luxury++;}
    else {missing++;} // if none matched
  }
  
  console.log(`Total Products: ${total}`);
  console.log(`Missing Images: ${missing}`);
  console.log(`Placeholder Images: ${placeholder}`);
  console.log(`External URLs: ${external}`);
  console.log(`Local Luxury Assets: ${luxury}`);
  
  process.exit(0);
}

audit().catch(console.error);
