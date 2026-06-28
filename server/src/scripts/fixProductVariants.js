require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const SizeChart = require('../models/SizeChart');

async function fixVariants() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB.');

    const products = await Product.find({}).populate('sizeChart');
    let updatedCount = 0;

    for (const p of products) {
      if (!p.sizeChart) {continue;}

      const chart = p.sizeChart;
      const chartSizes = chart.rows.map(r => r.label);
      if (!chartSizes || chartSizes.length === 0) {continue;}

      // Check if current variants' sizes match the chart sizes
      // We assume if at least one variant size is NOT in the chart, we should rewrite all variants.
      // (Or if the product has NO variants but it's not a watch/accessories)
      const currentSizes = p.variants.map(v => v.size);
      const hasInvalidSizes = currentSizes.some(s => !chartSizes.includes(s));
      const hasNoVariants = !p.variants || p.variants.length === 0;

      if (hasInvalidSizes || (hasNoVariants && chart.measurementType !== 'watches')) {
        const colors = p.variants && p.variants.length > 0 
            ? [...new Set(p.variants.map(v => v.color || 'Standard'))] 
            : ['Standard'];
        
        // Sum total stock to distribute
        let totalStock = p.stock > 0 ? p.stock : 0;
        if (p.variants && p.variants.length > 0) {
           totalStock = p.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
        }
        if (totalStock === 0) {totalStock = 20;} // fallback if completely 0
        
        const newVariants = [];
        const stockPerVariant = Math.max(1, Math.floor(totalStock / (colors.length * chartSizes.length)));

        // Get the image from the first variant to carry over, if exists
        const baseImage = (p.variants && p.variants[0] && p.variants[0].image) ? p.variants[0].image : '';
        const baseSku = p.sku || `FAS-${Math.random().toString(36).substring(2,8).toUpperCase()}`;

        for (const color of colors) {
          for (const size of chartSizes) {
             newVariants.push({
               size,
               color,
               sku: `${baseSku}-${size.replace(/\s+/g, '')}`,
               stock: stockPerVariant,
               availability: stockPerVariant > 0,
               priceAdjustment: 0,
               image: baseImage,
             });
          }
        }

        p.variants = newVariants;
        p.stock = newVariants.reduce((sum, v) => sum + v.stock, 0);
        await p.save();
        updatedCount++;
      }
    }

    console.log(`Updated variants for ${updatedCount} products.`);
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

fixVariants();
