const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Product = require('../src/models/Product');
const Category = require('../src/models/Category');

const imagePools = {
  Rolex: [
    '/assets/luxury/watches/rolex_daytona.png',
    '/assets/luxury/watches/rolex_submariner.png',
    '/assets/luxury/watches/rolex_daytona.png', // Fallback, will add variation if needed
  ],
  Omega: [
    '/assets/luxury/watches/omega_speedmaster.png',
  ],
  Cartier: [
    '/assets/luxury/watches/cartier_santos.png',
  ],
  'Audemars Piguet': [
    '/assets/luxury/watches/ap_royal_oak.png',
  ],
  Hermès: [
    '/assets/luxury/watches/hermes_kelly.png', // wait hermes bag is hermes_kelly.png in bags folder
  ],
  Chanel: [
    '/assets/luxury/bags/chanel_flap.png',
  ],
  Dior: [
    '/assets/luxury/bags/lady_dior.png',
  ],
  'Louis Vuitton': [
    '/assets/luxury/bags/lv_capucines.png',
  ]
};

// Also fallback generic pools
const watchPool = [
  '/assets/luxury/watches/rolex_daytona.png',
  '/assets/luxury/watches/rolex_submariner.png',
  '/assets/luxury/watches/omega_speedmaster.png',
  '/assets/luxury/watches/cartier_santos.png',
  '/assets/luxury/watches/ap_royal_oak.png'
];

const bagPool = [
  '/assets/luxury/bags/bag_white_bg.png',
  '/assets/luxury/bags/chanel_flap.png',
  '/assets/luxury/bags/hermes_kelly.png',
  '/assets/luxury/bags/lady_dior.png',
  '/assets/luxury/bags/luxury_dark_bag.png',
  '/assets/luxury/bags/lv_capucines.png'
];

const electronicsPool = [
  '/assets/luxury/fallbacks/electronics-fallback.webp' // Maybe I have actual electronics?
];

const fashionPool = [
  '/assets/luxury/fallbacks/fashion-fallback.webp'
];

const lifestylePool = [
  '/assets/luxury/fallbacks/lifestyle-fallback.webp'
];

const sleep = ms => new Promise(res => setTimeout(res, ms));

async function runAudit() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB Connected.');

    const products = await Product.find().populate('category');
    console.log(`Total Products Found: ${products.length}`);

    let modifications = 0;
    
    // Track usage to cycle
    const usage = {
      watches: 0,
      bags: 0,
      electronics: 0,
      fashion: 0,
      lifestyle: 0
    };

    for (let product of products) {
      let assignedImage = null;
      const catName = product.category ? product.category.name.toLowerCase() : '';
      const brandName = product.brand ? product.brand : '';
      const prodName = product.name.toLowerCase();

      // Determine brand exact match
      if (brandName.toLowerCase().includes('rolex') || prodName.includes('rolex')) {
        assignedImage = watchPool[usage.watches % 2]; // first two are rolex
        usage.watches++;
      } else if (brandName.toLowerCase().includes('omega') || prodName.includes('omega')) {
        assignedImage = '/assets/luxury/watches/omega_speedmaster.png';
      } else if (brandName.toLowerCase().includes('cartier') || prodName.includes('cartier')) {
        assignedImage = '/assets/luxury/watches/cartier_santos.png';
      } else if (brandName.toLowerCase().includes('audemars') || prodName.includes('audemars')) {
        assignedImage = '/assets/luxury/watches/ap_royal_oak.png';
      } else if (brandName.toLowerCase().includes('hermès') || brandName.toLowerCase().includes('hermes') || prodName.includes('hermes') || prodName.includes('birkin') || prodName.includes('kelly')) {
        assignedImage = '/assets/luxury/bags/hermes_kelly.png';
      } else if (brandName.toLowerCase().includes('chanel') || prodName.includes('chanel')) {
        assignedImage = '/assets/luxury/bags/chanel_flap.png';
      } else if (brandName.toLowerCase().includes('dior') || prodName.includes('dior')) {
        assignedImage = '/assets/luxury/bags/lady_dior.png';
      } else if (brandName.toLowerCase().includes('louis vuitton') || prodName.includes('vuitton')) {
        assignedImage = '/assets/luxury/bags/lv_capucines.png';
      } else {
        // Fallback by category
        if (catName.includes('watch')) {
          assignedImage = watchPool[usage.watches % watchPool.length];
          usage.watches++;
        } else if (catName.includes('bag') || catName.includes('leather')) {
          assignedImage = bagPool[usage.bags % bagPool.length];
          usage.bags++;
        } else if (catName.includes('electronic') || catName.includes('tech')) {
          assignedImage = electronicsPool[usage.electronics % electronicsPool.length];
          usage.electronics++;
        } else if (catName.includes('fashion') || catName.includes('clothing')) {
          assignedImage = fashionPool[usage.fashion % fashionPool.length];
          usage.fashion++;
        } else {
          assignedImage = lifestylePool[usage.lifestyle % lifestylePool.length];
          usage.lifestyle++;
        }
      }

      if (product.images.length === 0 || product.images[0].url !== assignedImage) {
        console.log(`[Updating] ${product.name} | old: ${product.images[0]?.url || 'none'} | new: ${assignedImage}`);
        product.images = [{ url: assignedImage, altText: product.name, publicId: `local_${Date.now()}` }];
        await product.save();
        modifications++;
      }
    }

    console.log(`Audit Complete. Modified ${modifications} products.`);
    process.exit(0);
  } catch (error) {
    console.error('Error running audit:', error);
    process.exit(1);
  }
}

runAudit();
